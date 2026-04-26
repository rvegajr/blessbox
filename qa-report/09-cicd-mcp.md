# QA Report 09 – CI/CD & MCP Server

Scope: Sections 18 (CI/CD) and 19 (MCP Server).
Repo: `/Users/admin/Dev/YOLOProjects/BlessBox` (branch `main`).

---

## Section 18 – CI/CD

### 18.1 Workflows

Three workflows in `.github/workflows/`:

| File | Trigger | Steps actually present |
|---|---|---|
| `development-ci.yml` | push/PR to `development` | checkout, setup-node (18.x + 20.x matrix), `npm ci`, "Run linting" (actually runs `npm run build` and greps for `ERROR`), `npm run build` (run again), upload artifacts, then `deploy-preview` job (Vercel preview on push) |
| `production-deploy.yml` | push to `main`, manual | checkout, setup-node 20.x, `npm ci`, `npm run build`, deploy to Vercel `--prod`, create GitHub release tag |
| `pull-request.yml` | PR to `main` | `npm ci`, `npm run build`, auto-comment; second `security-scan` job runs `npm audit` (moderate continue-on-error, then high fails build) |

Comparison vs. `docs/ci-cd/CI-CD-SETUP.md`:

- Doc claims "Tests on Node.js 18.x and 20.x" – **no tests are run.** No `vitest`, no `playwright`, no `npm test` step in any workflow. Only `npm run build` executes.
- Doc claims "Lint checking" – there is **no real lint step.** The "Run linting" step is mis-labeled: it executes `npm run build 2>&1 | tee build.log && ! grep -q "ERROR" build.log`. There is no `eslint`/`tsc --noEmit` invocation. Type-check happens only as a side effect of Next build.
- Doc claims "Build validation" – **present** (only thing that actually runs).
- Vercel deploy steps – **present** in both dev and prod workflows.
- `actions/create-release@v1` is **deprecated/archived** – production release step will likely warn or eventually fail.
- No matrix on prod, no concurrency guard, no caching of Next/Playwright artifacts.

Gaps to flag:
1. No automated test execution anywhere in CI. Vitest and Playwright suites in the repo are never gated by PR.
2. No lint or typecheck job (despite doc claims).
3. `npm audit` "high" severity gate exists only on PR-to-main, not on development pushes.
4. Two redundant `npm run build` invocations in `development-ci.yml`.

### 18.2 Cron registration & route protection

- **Root `vercel.json` is missing.** The only `vercel.json` in the tree is `tests/fixtures/vercel.json`, which is a test fixture – Vercel will not pick it up.
- Therefore `/api/cron/finalize-cancellations` is **NOT registered as a Vercel cron job in production** unless the cron has been configured manually in the Vercel dashboard. Recommend committing a real `/vercel.json` with the same `crons` block as the fixture:

  ```json
  { "crons": [{ "path": "/api/cron/finalize-cancellations", "schedule": "0 2 * * *" }] }
  ```

- Route source `app/api/cron/finalize-cancellations/route.ts` correctly verifies the request:
  - Reads `CRON_SECRET` env. If unset, returns 500 ("Cron secret not configured") – fail-closed.
  - Checks `Authorization: Bearer <CRON_SECRET>`. Mismatch returns 401.
  - Does **not** also check the `x-vercel-cron` header. Vercel docs recommend either the secret or that header; the secret-only path is acceptable but slightly weaker (no defense if the secret leaks via logs/metrics).
- Local anonymous curl: `curl http://localhost:7777/api/cron/finalize-cancellations` against the running dev server returned **HTTP 500** (CRON_SECRET not set in `.env.local`). With `CRON_SECRET` set, anonymous request would return 401 as required. The 500 path leaks the configuration state of the deployment in its body (`{"error":"Cron secret not configured"}`) – minor info leak; consider returning 401 in both cases.

---

## Section 19 – MCP Server

Location: `/Users/admin/Dev/YOLOProjects/BlessBox/mcp-server/`. Entry: `src/index.js`. Single dep `@modelcontextprotocol/sdk ^0.5.0`. Stdio transport.

### 19.1 Exposed tools

Six tools, no resources, no prompts:

| Tool | Input schema | Required | Validation | Error handling | Auth gate |
|---|---|---|---|---|---|
| `list-bugs` | `source` enum, `status` enum | none | declared in JSON-Schema only; not enforced beyond defaults | try/catch around fetch; swallows errors silently with `console.error` | uses `GITHUB_TOKEN` env if set; no caller permission check |
| `get-bug` | `id` (string), `source` enum | `id` | schema-only | throws on 404 / unknown source | none |
| `run-test` | `testFile`, `testName`, `headed` | none | **schema-only – `testFile` and `testName` are passed unsanitised into a shell `exec` string** | try/catch; returns stderr | **none – arbitrary shell injection risk** |
| `create-regression-test` | `bugId`, `testName`, `steps[]` | `bugId`,`testName` | schema-only; embeds `testName` and `steps` directly into generated JS string | none (pure string build) | none |
| `mark-fixed` | `id`, `fixSummary`, `commitHash` | `id`,`fixSummary` | schema-only | `await fetch` results not checked for non-2xx | requires `GITHUB_TOKEN`; no caller gate |
| `analyze-bug` | `bugId` | `bugId` | schema-only | propagates `getBug` errors | none |

Key risks:
1. **Command injection in `run-test`.** Lines 338–352: `command += " tests/e2e/${testFile}"` and `-g "${testName}"` are concatenated into `execAsync(command)`. A malicious `testName` value such as `foo"; rm -rf ~; echo "` executes arbitrary shell. Use `execFile` with an argv array, or strictly validate against `/^[\w./-]+$/`.
2. **No runtime schema validation.** MCP SDK does not auto-validate `inputSchema`; handlers should re-parse with zod/ajv. Currently any JSON shape is accepted.
3. **`mark-fixed` ignores GitHub API failures** (no `.ok` check on either fetch). A failed comment-post still reports `success: true`.
4. **No auth/permission gate on any tool.** Any client with stdio access to the server can close GitHub issues, run shell commands, and mutate bug files. Acceptable only if the server is launched per-user via a trusted MCP client; document this.
5. `console.error` is used for the "started" log – correct (stdout is reserved for MCP frames).
6. No `tools/resources` listing, no `prompts/list`, no `notifications` – minimal surface.

### 19.2 Startup attempt

`npm install` has not been run in `mcp-server/` (no `node_modules`). Launching directly:

```
$ node mcp-server/src/index.js
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@modelcontextprotocol/sdk'
  imported from /Users/admin/Dev/YOLOProjects/BlessBox/mcp-server/src/index.js
```

Server cannot start in its current state. Add `npm ci` (or document `cd mcp-server && npm install`) and ideally a `postinstall` hook from the root `package.json`, or include the MCP server in a workspace.

---

## Summary findings

- CI runs build only – no tests, no lint, no typecheck despite docs.
- Production `vercel.json` missing from repo root → cron schedule may rely on dashboard config; commit a real one.
- Cron route auth is correct (Bearer secret), fails closed; consider returning 401 instead of 500 when secret unset.
- MCP server has a real shell-injection vector in `run-test`, no runtime schema validation, no auth gate, and cannot start without `npm install` (deps not vendored).

Files touched / referenced:
- `/Users/admin/Dev/YOLOProjects/BlessBox/.github/workflows/development-ci.yml`
- `/Users/admin/Dev/YOLOProjects/BlessBox/.github/workflows/production-deploy.yml`
- `/Users/admin/Dev/YOLOProjects/BlessBox/.github/workflows/pull-request.yml`
- `/Users/admin/Dev/YOLOProjects/BlessBox/docs/ci-cd/CI-CD-SETUP.md`
- `/Users/admin/Dev/YOLOProjects/BlessBox/docs/CRON_SETUP_INSTRUCTIONS.md`
- `/Users/admin/Dev/YOLOProjects/BlessBox/tests/fixtures/vercel.json` (only vercel.json present)
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/cron/finalize-cancellations/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/mcp-server/src/index.js`
- `/Users/admin/Dev/YOLOProjects/BlessBox/mcp-server/package.json`
