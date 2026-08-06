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
                        │  (merge auto-opens ↓)
                     Promote: develop → uat
                        │
                        ▼
                       uat ──▶ uat.blessbox.org
                        │  (merge auto-opens ↓)
                     Promote: uat → main
                        │
                        ▼
                       main ──▶ www.blessbox.org
```

1. **Feature work targets `develop`.** Open a PR into `develop`; it is gated by
   `validate` + `security-scan` + `smoke` + `gitleaks` (see `pull-request.yml`).
2. **Merging to `develop`** deploys dev (Vercel) + migrates blessbox-dev
   (`development-ci.yml`), and **auto-opens a `Promote: develop → uat` PR**
   (`promote.yml`).
3. **Merging that PR** deploys uat + migrates blessbox-uat (`uat-ci.yml`), and
   **auto-opens a `Promote: uat → main` PR**.
4. **Merging that PR** migrates blessbox-prod + deploys prod
   (`production-deploy.yml`).

Every hop is a PR gated by the same checks, and merged by a human — nothing is
auto-merged, especially into prod.

## Hotfixes (straight to prod)

An urgent fix can PR directly into `main`. On merge, `promote.yml` **auto-opens
`Back-sync: main → uat` and `main → develop` PRs** so the lower environments
pick up the fix and don't drift. In the normal forward flow these open nothing
(the change already came from below).

## Branch protection

`main`, `uat`, and `develop` each require PRs (no direct pushes) and the four
status checks above. No human review is required (solo repo).

## `PROMOTE_PAT` (required for auto-promotion)

The promotion PRs are opened by `promote.yml` using a repo secret
**`PROMOTE_PAT`** — a fine-grained PAT on this repo with **Contents: read** +
**Pull requests: write**. It's required because PRs opened with the default
`GITHUB_TOKEN` do not trigger the gate workflows; a PAT-opened PR does. If the
secret is absent, `promote.yml` skips with a warning (deploys/migrations still
work; only the auto-opened promotion PRs are suppressed).
