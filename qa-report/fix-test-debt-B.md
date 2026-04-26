# Fix Test Debt — Agent B

Goal: every prod e2e failure is either fixed or carries a `test.fixme` with a real reason. Final battery against `https://www.blessbox.org` is **green**:

```
166 passed
 56 skipped (test.fixme)
  0 failed
~7.7 min
```

## Root causes uncovered while triaging

1. **`/api/test/login` returns 404 in prod.** Vercel env doesn't have `PROD_TEST_LOGIN_SECRET` (only `PROD_TEST_SEED_SECRET` is provisioned). Every test that calls `loginAsUser(...)` against prod fails before reaching the assertions. Verified directly:
   ```
   curl -X POST https://www.blessbox.org/api/test/login -H "x-qa-login-token: $LSECRET" → {"success":false,"error":"Not found"}
   ```
   This is the dominant failure class in this batch (~25 tests). Until the secret is added on Vercel, none of these can pass.

2. **`/api/auth/send-code` is broken in prod** with `SendGrid failed: Unauthorized.` Real product/infra bug — separate work item. Tests that exercise it can't pass.

3. **`/api/onboarding/save-organization` now requires auth in prod** (returns 401). Some inventory-style tests that previously expected 400 had to be widened to `[400, 401]`.

4. **Square Web SDK requires `unsafe-eval`** which the prod CSP correctly disallows. Any test that mounts the Square card iframe end-to-end against prod is blocked by CSP — and 3DS additionally requires interactive human action.

5. **`registration-public-flow` test asserted on stale UI text.** Successful submission redirects to `/registration-success?id=...`; the page never shows "Registration submitted!". Switched assertion to a URL wait.

## Fixtures coordination

`tests/e2e/fixtures.ts` was not present at the time I ran the suite, so this pass uses the existing in-spec helpers (`seedOrg`, `loginAsUser`). No spec was rewritten to import the shared fixture — the fixme'd specs are blocked on the prod login secret regardless of which fixture surface they use, and the surviving green specs already use seed-prod correctly. Once `fixtures.ts` lands and `PROD_TEST_LOGIN_SECRET` is provisioned, the fixme'd specs can be unflagged and migrated in a follow-up.

## Per-spec results

| Spec | Fixed | Fixme'd | Still failing |
|---|---:|---:|---:|
| bug-fixes-verification | 1 (Bug Fix 2: networkidle → domcontentloaded) | 3 | 0 |
| blessbox-full-flow | 0 | 3 | 0 |
| user-experience-regression | 0 | 8 (1 + serial chain 2-7 + Payment Auth) | 0 |
| registration-public-flow | 1 (success-redirect URL wait) | 0 | 0 |
| qr-auto-generation-fix | 0 | 1 | 0 |
| onboarding-flow | 0 | 1 | 0 |
| multi-org-selection | 0 | 1 | 0 |
| multi-org-selection-bug-fix | 0 | 1 | 0 |
| form-builder-regression | 0 | 1 | 0 |
| auth-bypass-protected-routes | 0 | 1 | 0 |
| app-inventory-smoke | 0 | 1 | 0 |
| complete-application-flow | 0 | 1 | 0 |
| complete-auth-organization-flow | 0 | 4 | 0 |
| complete-system-regression | 0 | 2 | 0 |
| client-issues-investigation | 0 | 1 | 0 |
| bug-fixes-full-integration | 0 | 1 | 0 |
| production-real-data-test | 4 (widened expected statuses to include 401) | 1 | 0 |
| square-payment-flow | 0 | 1 | 0 |
| api-endpoints | 2 (widened export expected to `[400, 401]`) | 0 | 0 |
| qa-testing-guide-coverage | 0 | 4 | 0 |
| scan-count-options-regression | 0 | 6 (describe-level) | 0 |
| tutorial-reliability-test | 0 | 1 | 0 |

Specs in the brief swept and confirmed clean (no failures): `complete-system-regression` non-email tests, `complete-user-experience`, `production-verification`.

## Why fixme over skip

Per the brief, every fixme below has a documented reason directly above it in code:

- "/api/test/login 404s in prod (PROD_TEST_LOGIN_SECRET not provisioned on Vercel)" — used for ~16 tests where the only blocker is the missing test-login secret. Unblocking is purely an env var on Vercel.
- "Magic-Link login UI cannot be automated in prod without an inbox-fetched code" — used for tests that drive `/login` through the UI.
- "Org-setup is auth-gated in prod" — used for the onboarding-UI chain; cookie-based test bypass is intentionally rejected by middleware in prod.
- "SendGrid Unauthorized in prod" — used for `email verification API works` and `send-verification` flow tests.
- "Square Web SDK requires `unsafe-eval` which prod CSP disallows" — used for end-to-end card-payment tests; also covers the long-poll `networkidle` issue.
- "Tutorial auto-start state depends on a localStorage-seeded first-visit window that this test races" — real test-reliability defect, not a runtime flake.

## Real fixes (not fixme)

1. `tests/e2e/registration-public-flow.spec.ts` — replaced `expect(getByText(/registration submitted!/i))` with `waitForURL(/\/registration-success/)`; the prod success path navigates away.
2. `tests/e2e/bug-fixes-verification.spec.ts` Bug Fix 2 — replaced `waitForLoadState('networkidle')` on `/checkout` with `goto({ waitUntil: 'domcontentloaded' })`. (The Square Web SDK keeps a long-poll open so networkidle never resolves.)
3. `tests/e2e/api-endpoints.spec.ts` tests 6 and 7 — widened expected status to `[400, 401]` for `/api/registrations/export` (now auth-gated in prod, IDOR-closed).
4. `tests/e2e/production-real-data-test.spec.ts` tests 1/5/11 — same widening for `/api/onboarding/save-organization`. Test 4 fixme'd (SendGrid).

## Files touched

- tests/e2e/api-endpoints.spec.ts
- tests/e2e/app-inventory-smoke.spec.ts
- tests/e2e/auth-bypass-protected-routes.spec.ts
- tests/e2e/blessbox-full-flow.spec.ts
- tests/e2e/bug-fixes-full-integration.spec.ts
- tests/e2e/bug-fixes-verification.spec.ts
- tests/e2e/client-issues-investigation.spec.ts
- tests/e2e/complete-application-flow.spec.ts
- tests/e2e/complete-auth-organization-flow.spec.ts
- tests/e2e/complete-system-regression.spec.ts
- tests/e2e/form-builder-regression.spec.ts
- tests/e2e/multi-org-selection-bug-fix.spec.ts
- tests/e2e/multi-org-selection.spec.ts
- tests/e2e/onboarding-flow.spec.ts
- tests/e2e/production-real-data-test.spec.ts
- tests/e2e/qa-testing-guide-coverage.spec.ts
- tests/e2e/qr-auto-generation-fix.spec.ts
- tests/e2e/registration-public-flow.spec.ts
- tests/e2e/scan-count-options-regression.spec.ts
- tests/e2e/square-payment-flow.spec.ts
- tests/e2e/tutorial-reliability-test.spec.ts
- tests/e2e/user-experience-regression.spec.ts

## Recommended follow-up (out of scope for this pass)

1. **Provision `PROD_TEST_LOGIN_SECRET` on Vercel** — single biggest unlock. Removes ~16 fixmes immediately.
2. **Fix prod SendGrid auth** — unblocks `send-verification` flow tests (4-5 fixmes). Also a real product blocker per `SUMMARY.md` HIGH list.
3. **Migrate fixme'd specs to `tests/e2e/fixtures.ts`** once Agent A lands it; the shared `authedPage`/`seededOrg`/`authedRequest` surface will collapse the per-spec `loginAsUser`/`seedOrg` boilerplate.
4. **Square e2e card flow** — needs a separate strategy: either a dev/staging build with relaxed CSP, or recorded-network harness. Don't try to drive the live SDK end-to-end in prod.
