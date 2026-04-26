# MCP Server Fixes – Report

Scope: `/Users/admin/Dev/YOLOProjects/BlessBox/mcp-server` and root `package.json`.
Date: 2026-04-25.

## Blocker 10 – Shell injection in `run-test` (FIXED)

`runTest()` previously concatenated `testFile` and `testName` into a string passed to `execAsync` (shell). A `testName` of `foo"; rm -rf ~; echo "` would execute. Replaced with `execFile('npx', argv, { shell: false })`:

- Switched import to `execFile` + `promisify` (`execFileAsync`).
- `testFile` is validated before use:
  - must be a non-empty string
  - rejected if `isAbsolute(testFile)`
  - must match `/^[A-Za-z0-9_./-]+$/`
  - normalized; rejected if any segment is `..` or normalized form starts with `..`
  - prefixed with the fixed literal `tests/e2e/`
- `testName` must match `/^[\w\s\-\.]+$/`; passed as a separate argv entry to `-g`.
- All other flags (`--headed`, `--reporter=list`) are literal argv items.

No user data ever reaches a shell. `displayCommand` is a render-only string for output.

## Bonus fixes from the same report

### `mark-fixed` ignored GitHub failures (FIXED)
Added an `assertOk(label, res)` helper that throws `GitHub <label> failed: HTTP <status> ...` (with up to 300 chars of body) when `!res.ok`. Both the comment-post and the issue-close PATCH are now checked. A failed call now surfaces an error instead of returning `success: true`.

### Runtime JSON-Schema validation (ADDED)
Hand-rolled `validateInput(schema, input)` covers the subset our tools use: `type` (object/array/string/boolean/number), `enum`, `required`, `properties`, `items`, and `default` injection. Tool defs were lifted into a `TOOL_DEFINITIONS` const so a `TOOL_SCHEMAS` map can be built once at module load. The `CallToolRequestSchema` dispatcher validates `args` against the tool's `inputSchema` and throws `Invalid input for <tool>: <reason>` before invoking the handler. Defaults (`source`, `status`, `headed`) are applied here, not in the handlers.

### Root postinstall wiring (ADDED)
Added to root `package.json`:
```
"postinstall": "node -e \"const fs=require('fs');if(fs.existsSync('mcp-server/package.json')){require('child_process').execSync('npm --prefix mcp-server install --no-audit --no-fund',{stdio:'inherit'})}\""
```
Idempotent, guarded by `existsSync`, no-op if the directory is removed.

## Verification

- `cd mcp-server && npm install` -> `added 14 packages`.
- `node --check src/index.js` -> SYNTAX OK.
- Booted server via stdio: stderr emits `BlessBox MCP Server started`. No `ERR_MODULE_NOT_FOUND`.
- No `build` script exists in `mcp-server/package.json`; pure ESM, nothing to compile.

## Files touched

- `/Users/admin/Dev/YOLOProjects/BlessBox/mcp-server/src/index.js`
- `/Users/admin/Dev/YOLOProjects/BlessBox/package.json`
