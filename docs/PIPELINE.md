# Environment & Promotion Pipeline

BlessBox promotes changes forward through three environments. Each has its own
branch, domain, database, and deploy.

| Env | Branch | Domain | Database | Email |
|-----|--------|--------|----------|-------|
| dev | `develop` | dev.blessbox.org | blessbox-dev | captured (smtp4dev) |
| uat | `uat` | uat.blessbox.org | blessbox-uat | delivered, `[UAT]`-tagged |
| prod | `main` | www.blessbox.org | blessbox-prod | delivered |

## Forward flow

```
 feature/*  ──PR──▶  develop ──▶ dev.blessbox.org
                        │  npm run promote  ↓
                     Promote: develop → uat
                        │
                        ▼
                       uat ──▶ uat.blessbox.org
                        │  npm run promote  ↓
                     Promote: uat → main
                        │
                        ▼
                       main ──▶ www.blessbox.org
```

1. **Feature work targets `develop`.** Open a PR into `develop`; it is gated by
   `validate` + `security-scan` + `smoke` + `gitleaks` (see `pull-request.yml`).
2. **Merging to `develop`** deploys dev (Vercel) + migrates blessbox-dev
   (`development-ci.yml`).
3. **Promote** with `npm run promote` — opens the next-stage PR (`develop → uat`,
   then `uat → main`). Merging each deploys + migrates that env
   (`uat-ci.yml`, `production-deploy.yml`).

Every hop is a PR gated by the same checks and **merged by a human** — nothing is
auto-merged, especially into prod.

## Promoting — `npm run promote` (gh CLI)

Promotion PRs are opened by **`scripts/promote.sh`** using the **`gh` CLI's own
authentication** — no repo secret. (This is why it's a local script and not a
GitHub Actions workflow: a PR opened by Actions' default `GITHUB_TOKEN` does not
trigger the gate workflows, so its checks would never run; a `gh`-opened PR,
authenticated as you, triggers them normally.)

```
npm run promote            # open the next forward PR(s): develop→uat, uat→main
npm run promote:backsync   # open main→uat and main→develop (hotfix drift guard)
bash scripts/promote.sh develop uat   # a specific hop
```

The script is idempotent: it opens a PR only when the branches' **content**
actually differs and no such PR is already open. You (or CI) merge each PR once
its checks are green. Requires an authenticated gh CLI (`gh auth status`).

## Hotfixes (straight to prod)

An urgent fix can PR directly into `main`. Afterwards run `npm run promote:backsync`
to open `main → uat` and `main → develop` PRs so the lower environments pick up
the fix and don't drift. In the normal forward flow these open nothing (the
change already came from below).

## Branch protection

`main`, `uat`, and `develop` each require PRs (no direct pushes) and the four
status checks above. No human review is required (solo repo).
