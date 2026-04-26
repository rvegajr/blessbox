# DB Fix Report — Schema reconciliation, baseline migrations, backups

Date: 2026-04-25 | Repo: BlessBox (branch `main`)

## What was done

### 1. Schema reconciled with live DB (24 tables)

`lib/schema.ts` rewritten to mirror `blessbox.db` exactly. Added:

- **7 missing tables**: `login_codes`, `payment_transactions`, `usage_tracking`,
  `saved_searches`, `export_jobs`, `coupon_codes`, `usage_alerts`.
- **Missing columns** on existing tables:
  - `organizations.password_hash`, `organizations.last_login_at`
  - `registrations.check_in_token` (UNIQUE), `checked_in_at`, `checked_in_by`,
    `token_status` (default `'active'`), `organization_id`
  - `subscription_plans.current_period_start/end`, `payment_provider`,
    `external_subscription_id`
- **Coupons / coupon_redemptions** redefined to match the live shape produced by
  `scripts/create-turso-schema.js` (the prior Drizzle definition was for a
  different, never-deployed schema).
- All live indexes registered in Drizzle (so generate emits them).
- `users` table already had `name`/`image`/`email_verified_at` in code — QA
  report 08 was slightly stale on that point. Confirmed and kept.

Drizzle now defines **23 tables** (the live `__drizzle_migrations` housekeeping
table is excluded by design); the live DB has 24 user tables — all 24 are now in
the Drizzle schema.

### 2. Baseline migration generated

```
npx drizzle-kit generate --config=src/drizzle.config.ts --name=baseline
→ drizzle/migrations/0000_baseline.sql
```

The drizzle output dir was already configured (`out: './drizzle/migrations'`).
Adjusted `.gitignore` so `drizzle/migrations/` is tracked (the broader
`drizzle/` working dir stays ignored):

```
drizzle/*
!drizzle/migrations/
```

`npx drizzle-kit check --config=src/drizzle.config.ts` → **Everything's fine**.

### 3. Baseline-application doc

`scripts/baseline-migrations.md` documents how to mark `0000_baseline.sql` as
already applied in production by SHA-256-hashing the file and inserting into
`__drizzle_migrations` (Drizzle's libSQL/SQLite runner identifies applied
migrations by file-hash, not tag).

### 4. Backup / restore scripts

- `scripts/backup-db.sh` — `sqlite3 .backup` to
  `backups/blessbox-<UTC-timestamp>.db`. Idempotent, `set -euo pipefail`.
- `scripts/restore-db.sh <backup>` — snapshots current target before
  overwriting (defense-in-depth), then `cp` restores.
- Both `chmod +x`. Verified by running `./scripts/backup-db.sh` →
  `backups/blessbox-20260425T203620Z.db` (1.6 MB).
- `.gitignore` now excludes `backups/`.

### 5. Destructive scripts hardened

New module `scripts/_require-recent-backup.ts` exits non-zero unless
`backups/*.db` contains a file with mtime ≤ 1 hour. Imported (for side-effects)
at the top of:

- `scripts/clear-production-database.ts`
- `scripts/clear-production-database-interactive.ts`

Bypass with `FORCE_NO_BACKUP=1` (logged as a warning) for CI scenarios where a
backup was taken via Turso CLI out-of-band.

## Verification

| Check | Result |
|---|---|
| `npx drizzle-kit check --config=src/drizzle.config.ts` | clean (`Everything's fine`) |
| `npx drizzle-kit generate` (replay) | no-op (no schema drift) |
| `npm run build` | success |
| `npm run test -- --run` | 364 / 365 pass |

The single failing test (`lib/services/RaceConditions.test.ts → 10 parallel
enrollments at capacity-1`) is **pre-existing** — confirmed by stashing the
working tree and re-running: at HEAD it has 3 failing tests in the same file;
with our changes it has 1. Our schema changes do not regress it; the failure is
unrelated to schema reconciliation (concurrent enrollment race in
`ClassService`, not a schema column issue).

## Files changed / created

- `lib/schema.ts` — full rewrite, aligned to live DB
- `drizzle/migrations/0000_baseline.sql` — generated
- `drizzle/migrations/meta/_journal.json`, `meta/0000_snapshot.json` — generated
- `scripts/backup-db.sh`, `scripts/restore-db.sh` — new, executable
- `scripts/_require-recent-backup.ts` — new safety guard
- `scripts/baseline-migrations.md` — operator runbook
- `scripts/clear-production-database.ts` — guard imported
- `scripts/clear-production-database-interactive.ts` — guard imported
- `.gitignore` — track `drizzle/migrations/`, ignore `backups/`

## Follow-ups (advisory)

- Production Turso DB: run the procedure in `scripts/baseline-migrations.md`
  before next `drizzle-kit generate` cycle, otherwise a future migration runner
  will attempt to recreate baseline tables.
- The `__drizzle_migrations` table is created by the migration runner; no need
  to add it to `lib/schema.ts`.
- Consider replacing `drizzle-kit push` (in `npm run db:migrate`) with a
  proper migration runner (e.g. `drizzle-orm/libsql/migrator`) now that
  versioned SQL exists.
