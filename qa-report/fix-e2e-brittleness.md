# Fix: E2E Test Brittleness — three classes addressed

Targets the prod e2e suite so failures reflect product bugs, not test bugs.

## Task 1 — Strict-mode `.or()` selector failures

`page.locator('input[type="email"]#email').or(page.locator('input[type="email"]'))` resolves to two matching elements on the same page → Playwright strict-mode violation. The `.or()` chain only short-circuits when the first locator resolves to *zero* elements; if both have matches the union is multi-element.

Fixes:

- **`tests/e2e/production-verification.spec.ts:40`** — replaced with `page.getByTestId('input-email').or(page.locator('input[type="email"]').first())`. The `.first()` collapses the fallback to one element and the testid path is a no-op until the component adds it.
- **`tests/e2e/square-payment-flow.spec.ts`** — same pattern at the email selector (lines 55, 241, 313 — all three usages of `input[type="email"]` ∪ `input[id="email"]`) and the `Pay`/`Processing`/`Complete Payment` button unions (lines 135, 258). Each side wrapped with `.first()` so ambiguous matches no longer crash the test.

The remaining `.or()` chains in those files were checked: they target distinct text/role selectors that cannot both match (e.g. `text=/declined/i` ∪ `text=/failed/i`) and so are safe.

## Task 2 — `qr-checkin-complete-flow.spec.ts` used dev-only seeder

`/api/test/seed` is intentionally absent in prod, so the suite hard-failed at "Setup". Replaced every call site with a `seedTestData(request)` helper that:

- Detects prod via `process.env.TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL)`.
- In prod: `POST /api/test/seed-prod` with the secret in **`x-qa-seed-token`** *and* `x-test-seed-secret` (the route accepts either; first is the new CDN-safe name, second is back-compat — code in `app/api/test/seed-prod/route.ts:58`). Body `{ seedKey: 'qa-prod-qr-checkin' }`. Normalizes the `qrCodes[0].url` from the response into `registrationUrl`.
- Otherwise: original `GET /api/test/seed`.

`PROD_TEST_SEED_SECRET` from `.env.test.local` is post-processed with `.replace(/\\n$/, '').trim()` because `vercel env pull` writes literal `\n` characters into the file, which would otherwise mismatch the server-side trimmed secret. After this fix Setup passes:

```
✅ Registration URL: https://www.blessbox.org/register/qa-production-org-qa-prod-qr-checkin/main-entrance
```

The two regression-suite call sites (`describe('QR Check-In Regression Tests')`) were updated to the same helper. The `seed1.registrationId && seed2.registrationId` guard in the token-uniqueness test already handles the prod path returning no IDs.

## Task 3 — Inventory tests didn't know about diagnostic-secret 404 contract

Both inventory specs assumed every route must respond non-404. Production hardening (correctly) returns 404 for diagnostic/test routes when no `DIAGNOSTICS_SECRET` is provided.

- **`tests/e2e/api-route-inventory-all.spec.ts`** — added `EXPECT_404_IN_PROD` allowlist (15 routes from the brief plus `/api/dev/traklet-proxy` discovered during the run) and folded it into `shouldAllow404()`. The previous `/api/test/*` blanket rule was preserved (excludes only `/api/test/seed-prod`). 401 from auth-gated routes was already tolerated by this spec (it only fails on 5xx and unexpected 404).
- **`tests/e2e/api-inventory-smoke.spec.ts`** — added the same `EXPECT_404_IN_PROD` set plus an `EXPECT_401_IN_PROD` set covering the IDOR-closed `/api/registrations*` and `/api/registrations/export` / `/api/export/registrations` paths. The `expect(status).not.toBe(404)` assertion now checks `api.allow404 || (IS_PRODUCTION && EXPECT_404_IN_PROD.has(api.path))`.

## Result

`npm run test:e2e` against prod for the five target specs:

|              | before | after |
|--------------|-------:|------:|
| passed       |      7 |    13 |
| failed       |     17 |    11 |
| skipped      |      2 |     2 |

All inventory tests now pass. `qr-checkin-complete-flow` Setup passes; downstream check-in steps still fail because the registration-form-submit path 401s/redirects in prod (separate auth-gating issue, not test brittleness). Remaining `square-payment-flow` and `production-verification > Fix 1` failures are all `page.waitForLoadState('networkidle')` timeouts on `/checkout` — Square SDK keeps a long-poll connection open so networkidle never resolves. That's a real product/test-strategy concern (swap to `domcontentloaded` + selector-wait) but distinct from the three brittleness classes targeted here. The FREE100/SAVE20 coupon assertions noted as Task B are unchanged.

## Files touched

- `/Users/admin/Dev/YOLOProjects/BlessBox/tests/e2e/production-verification.spec.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/tests/e2e/square-payment-flow.spec.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/tests/e2e/qr-checkin-complete-flow.spec.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/tests/e2e/api-route-inventory-all.spec.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/tests/e2e/api-inventory-smoke.spec.ts`
