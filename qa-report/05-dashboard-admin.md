# QA Report — Sections 9 (Dashboard) & 10 (Admin)

Date: 2026-04-25 · Env: localhost:7777 (NODE_ENV=development)

## Security Findings (lead)

### BLOCKER-01 — `/api/system/clear-database` has no auth in dev/staging
File: `app/api/system/clear-database/route.ts`
- Guard logic: `if (process.env.NODE_ENV !== 'production') return true;` — any caller can wipe the DB outside production.
- Required guards expected: (1) env flag like `ALLOW_DB_CLEAR` — **MISSING**; (2) admin role check — **MISSING** (no session lookup at all); (3) explicit confirmation token in the request body — **MISSING**.
- Production path only requires a single shared `DIAGNOSTICS_SECRET` Bearer token. No user identity, no per-call confirmation, no env kill-switch.
- Curl results:
  - `POST /api/system/clear-database` (no auth) → **200** (DB wiped)
  - `POST` with invented admin cookie → **200**
- Recommendation: require all three: `ALLOW_DB_CLEAR === 'true'` env, authenticated super-admin session, AND body field `confirm: "CLEAR-<timestamp>"` matching server-generated token. Block entirely when `NODE_ENV==='production'` unless an explicit `PROD_DB_CLEAR_OK` flag is also set.

### HIGH-01 — `/api/admin/seed-test-coupons` POST returns 200 unauthenticated
File: `app/api/admin/seed-test-coupons/route.ts`
- Guard: only requires `x-seed-secret` header **when `NODE_ENV === 'production'`**. In dev/staging anyone can seed coupons (FREE100, WELCOME50, etc.) which directly affect billing flows.
- Curl: `POST /api/admin/seed-test-coupons` (no auth) → **200**
- Recommendation: always require an authenticated super-admin session in addition to the secret; do not rely on `NODE_ENV` alone — staging often runs as `production` but other deploy targets may not.

### LOW — Dashboard endpoints leak no data, but `fake-cookie` returns `401` not `403`
That is correct because session validation fails outright. Not a finding, recorded for completeness.

## Task 1 — Dashboard endpoint scoping

| Endpoint | anon | fake cookie | scoped to active orgId? |
|---|---|---|---|
| `/api/dashboard/stats` | 401 | 401 | YES — `resolveOrganizationForSession(session)` then `organization.id` used in every query |
| `/api/dashboard/recent-activity` | 401 | 401 | YES — both join + JSON-each subquery filtered by `organization.id` |
| `/api/dashboard/analytics` | 401 | 401 | YES — trends, status breakdown, qrPerformance, check-in rate all filtered by `organization.id` |

All three return 409 if the session has no resolvable org. Multi-tenant isolation looks correct.

## Task 2 — Admin endpoints anon test

| Endpoint | anon | fake cookie | Guard |
|---|---|---|---|
| `GET /api/admin/stats` | 403 | 403 | `isSuperAdminEmail` |
| `GET /api/admin/organizations` | 403 | 403 | `isSuperAdminEmail` |
| `GET /api/admin/subscriptions` | 403 | 403 | `isSuperAdminEmail` |
| `DELETE /api/admin/subscriptions` | (403 inferred) | — | `isSuperAdminEmail` |
| `GET /api/admin/coupons` | 401 | 401 | session + `isSuperAdminEmail` |
| `GET /api/admin/coupons/analytics` | 401 | 401 | session + `isSuperAdminEmail` |
| `POST /api/admin/seed-test-coupons` | **200** | **200** | env-gated only — see HIGH-01 |

No protected admin endpoint returned 200 to anon other than `seed-test-coupons`.

## Task 3 — `/api/system/clear-database` guard audit

| Required guard | Present? | Notes |
|---|---|---|
| Env flag (e.g. `ALLOW_DB_CLEAR`) | NO | Only `DIAGNOSTICS_SECRET` in production |
| Admin role check | NO | No `getServerSession` call anywhere in the route |
| Explicit confirmation token | NO | No body parsing; any POST proceeds |
| Production gate | PARTIAL | Bearer-secret only; no user identity tied to the destructive op |

See BLOCKER-01.

## Task 4 — Coupon admin authz

`app/api/admin/coupons/route.ts` (GET, POST) and `app/api/admin/coupons/[id]/route.ts` (GET, PUT, DELETE) and `analytics/route.ts` all consistently:
1. `getServerSession()` → 401 if missing.
2. `isSuperAdminEmail(session.user.email)` → 403 if not super-admin.

DELETE soft-deletes via `deactivateCoupon` (good). PUT accepts arbitrary body merged into update payload — minor risk of mass-assignment; consider whitelisting fields. `seed-test-coupons` is the outlier (HIGH-01).

## Task 5 — Component static review

Dashboard:
- `AnalyticsChart.tsx` — loading ✓, catch logs only, **no error state UI**, no empty state. FLAG.
- `DashboardLayout.tsx` — loading ✓ via prop. Layout shell only.
- `DashboardStats.tsx` — loading ✓, error ✓ (yellow banner), empty `return null` ✓.
- `RecentActivityFeed.tsx` — loading ✓, catch logs only, **no error UI**. FLAG.
- `StatCard.tsx`, `StatCardEnhanced.tsx`, `UsageBar.tsx` — pure presentational, no states needed.

Admin:
- `AnalyticsDashboard.tsx` — loading ✓, error ✓ (red banner), empty `return null` ✓.
- `AnalyticsSummary.tsx` — loading ✓, catch logs only, **no error UI**, empty `return null`. FLAG.
- `CouponForm.tsx` — field-level errors ✓, submit error ✓, success via parent.
- `CouponListTable.tsx` — loading ✓, error ✓, empty "No coupons found" ✓.
- `MetricCard.tsx` — pure presentational.

No component declares a React `ErrorBoundary`. Recommend wrapping dashboard and admin pages in a shared `<ErrorBoundary>` to catch render-time failures (e.g. malformed analytics payloads).

## Task 6 — `/dashboard` HTML render

`GET http://localhost:7777/dashboard` → **200**. Page renders (Next.js redirects to login client-side based on session state).

## Files referenced
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/system/clear-database/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/admin/seed-test-coupons/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/dashboard/{stats,recent-activity,analytics}/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/admin/{stats,organizations,subscriptions,coupons}/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/components/{dashboard,admin}/*.tsx`
