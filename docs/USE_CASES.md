# BlessBox Use Case Registry

Single source of truth for all test cases (TC-###). Each test case maps to:
- Test case markdown file in `.traklet/test-cases/`
- Playwright E2E spec (where applicable)
- Manual testing section in `docs/QA_TESTING_GUIDE.md`
- GitHub Issue (populated after `npx traklet sync`)

## Auth & Onboarding (Suite: auth, onboarding)

- **TC-001** Organization setup with email verification (priority: high)
  - File: [.traklet/test-cases/TC-001.md](.traklet/test-cases/TC-001.md)
  - Spec: [tests/e2e/registration-public-flow.spec.ts](../tests/e2e/registration-public-flow.spec.ts) (onboarding portion)
  - Manual: QA_TESTING_GUIDE.md Part 1 Test 1.1
  - GitHub: (pending sync)

- **TC-002** 6-digit code sign-in for returning users (priority: high)
  - File: [.traklet/test-cases/TC-002.md](.traklet/test-cases/TC-002.md)
  - Spec: [tests/e2e/complete-auth-organization-flow.spec.ts](../tests/e2e/complete-auth-organization-flow.spec.ts)
  - Manual: QA_TESTING_GUIDE.md Part 1 Test 1.2
  - GitHub: (pending sync)

- **TC-003** Build custom registration form with field types and validation (priority: high)
  - File: [.traklet/test-cases/TC-003.md](.traklet/test-cases/TC-003.md)
  - Spec: [tests/e2e/form-builder-regression.spec.ts](../tests/e2e/form-builder-regression.spec.ts)
  - Component: [components/onboarding/FormBuilderWizard.tsx](../components/onboarding/FormBuilderWizard.tsx)
  - Manual: QA_TESTING_GUIDE.md Part 1 Test 1.3
  - GitHub: (pending sync)
  - Depends on: TC-001

- **TC-004** Generate and download QR codes for entry points (priority: high)
  - File: [.traklet/test-cases/TC-004.md](.traklet/test-cases/TC-004.md)
  - Spec: [tests/e2e/qr-auto-generation-fix.spec.ts](../tests/e2e/qr-auto-generation-fix.spec.ts)
  - Component: [components/onboarding/QRConfigWizard.tsx](../components/onboarding/QRConfigWizard.tsx)
  - Manual: QA_TESTING_GUIDE.md Part 1 Test 1.4
  - GitHub: (pending sync)
  - Depends on: TC-003

- **TC-005** BLOCKER: verify-code endpoint handles foreign key constraints gracefully (priority: critical)
  - File: [.traklet/test-cases/TC-005.md](.traklet/test-cases/TC-005.md)
  - Blocker: qa-report/SUMMARY.md item 9
  - Endpoint: [app/api/onboarding/verify-code/route.ts](../app/api/onboarding/verify-code/route.ts)
  - Manual: (not in manual guide, discovered during QA)
  - GitHub: (pending sync)

## Dashboard & QR Codes (Suite: dashboard)

- **TC-006** View dashboard with statistics and recent activity (priority: medium)
  - File: [.traklet/test-cases/TC-006.md](.traklet/test-cases/TC-006.md)
  - Spec: [tests/e2e/app-inventory-smoke.spec.ts](../tests/e2e/app-inventory-smoke.spec.ts)
  - Component: [components/dashboard/DashboardLayout.tsx](../components/dashboard/DashboardLayout.tsx)
  - Manual: QA_TESTING_GUIDE.md Part 2 Test 2.1
  - GitHub: (pending sync)
  - Depends on: TC-001

- **TC-007** View QR codes list and details (priority: medium)
  - File: [.traklet/test-cases/TC-007.md](.traklet/test-cases/TC-007.md)
  - Spec: [tests/e2e/qr-checkin-complete-flow.spec.ts](../tests/e2e/qr-checkin-complete-flow.spec.ts)
  - Endpoint: [app/api/qr-codes/route.ts](../app/api/qr-codes/route.ts)
  - Manual: QA_TESTING_GUIDE.md Part 2 Test 2.2
  - GitHub: (pending sync)
  - Depends on: TC-004

- **TC-008** Download QR codes in multiple formats (priority: medium)
  - File: [.traklet/test-cases/TC-008.md](.traklet/test-cases/TC-008.md)
  - Endpoint: [app/api/qr-codes/[id]/download/route.ts](../app/api/qr-codes/[id]/download/route.ts)
  - Manual: QA_TESTING_GUIDE.md Part 2 Test 2.3
  - GitHub: (pending sync)
  - Depends on: TC-007

## Registration (Suite: registration)

- **TC-009** Public user registers via QR code form (priority: high)
  - File: [.traklet/test-cases/TC-009.md](.traklet/test-cases/TC-009.md)
  - Spec: [tests/e2e/registration-public-flow.spec.ts](../tests/e2e/registration-public-flow.spec.ts)
  - Endpoint: [app/api/registrations/route.ts](../app/api/registrations/route.ts) (POST)
  - Manual: QA_TESTING_GUIDE.md Part 3 Test 3.1
  - GitHub: (pending sync)
  - Depends on: TC-004

- **TC-010** View registrations list and details (priority: high)
  - File: [.traklet/test-cases/TC-010.md](.traklet/test-cases/TC-010.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Parts 3-4-7)
  - Page: [app/dashboard/registrations/page.tsx](../app/dashboard/registrations/page.tsx)
  - Manual: QA_TESTING_GUIDE.md Part 3 Test 3.2
  - GitHub: (pending sync)
  - Depends on: TC-009

- **TC-011** Search and filter registrations (priority: medium)
  - File: [.traklet/test-cases/TC-011.md](.traklet/test-cases/TC-011.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Parts 3-4-7)
  - Manual: QA_TESTING_GUIDE.md Part 3 Test 3.3
  - GitHub: (pending sync)
  - Depends on: TC-010

## Check-in (Suite: checkin)

- **TC-012** Check in a registration (priority: high)
  - File: [.traklet/test-cases/TC-012.md](.traklet/test-cases/TC-012.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Parts 3-4-7)
  - Service: [lib/services/RegistrationService.ts](../lib/services/RegistrationService.ts) checkInRegistration
  - Manual: QA_TESTING_GUIDE.md Part 4 Test 4.1
  - GitHub: (pending sync)
  - Race condition: qa-report/SUMMARY.md (no transaction, no WHERE checked_in_at IS NULL guard)
  - Depends on: TC-010

- **TC-013** Undo a check-in (priority: medium)
  - File: [.traklet/test-cases/TC-013.md](.traklet/test-cases/TC-013.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Parts 3-4-7)
  - Manual: QA_TESTING_GUIDE.md Part 4 Test 4.2
  - GitHub: (pending sync)
  - Depends on: TC-012

- **TC-014** Bulk check-in multiple registrations (priority: low)
  - File: [.traklet/test-cases/TC-014.md](.traklet/test-cases/TC-014.md)
  - Manual: QA_TESTING_GUIDE.md Part 4 Test 4.3 (marked "If Available")
  - GitHub: (pending sync)
  - Depends on: TC-012

## Payments (Suite: payments)

- **TC-015** View pricing plans and features (priority: high)
  - File: [.traklet/test-cases/TC-015.md](.traklet/test-cases/TC-015.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 5)
  - Page: [app/pricing/page.tsx](../app/pricing/page.tsx)
  - Manual: QA_TESTING_GUIDE.md Part 5 Test 5.1
  - GitHub: (pending sync)

- **TC-016** Apply FREE100 coupon for 100% discount (priority: high)
  - File: [.traklet/test-cases/TC-016.md](.traklet/test-cases/TC-016.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 5)
  - Manual: QA_TESTING_GUIDE.md Part 5 Test 5.2
  - GitHub: (pending sync)
  - Depends on: TC-015

- **TC-017** Apply WELCOME50 coupon for 50% discount (priority: high)
  - File: [.traklet/test-cases/TC-017.md](.traklet/test-cases/TC-017.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 5)
  - Manual: QA_TESTING_GUIDE.md Part 5 Test 5.3
  - GitHub: (pending sync)
  - Depends on: TC-015

- **TC-018** Apply SAVE20 coupon with $1 minimum charge (priority: medium)
  - File: [.traklet/test-cases/TC-018.md](.traklet/test-cases/TC-018.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 5)
  - Manual: QA_TESTING_GUIDE.md Part 5 Test 5.4
  - GitHub: (pending sync)
  - Depends on: TC-015

- **TC-019** Apply FIRST10 coupon for $10 discount (priority: medium)
  - File: [.traklet/test-cases/TC-019.md](.traklet/test-cases/TC-019.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 5)
  - Manual: QA_TESTING_GUIDE.md Part 5 Test 5.5
  - GitHub: (pending sync)
  - Depends on: TC-015

- **TC-020** Validate error handling for invalid coupons (priority: medium)
  - File: [.traklet/test-cases/TC-020.md](.traklet/test-cases/TC-020.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 5)
  - Endpoint: [app/api/coupons/validate/route.ts](../app/api/coupons/validate/route.ts)
  - Manual: QA_TESTING_GUIDE.md Part 5 Test 5.6 (a/b/c/d)
  - GitHub: (pending sync)
  - Depends on: TC-015

- **TC-021** Complete payment with Square sandbox card (priority: high)
  - File: [.traklet/test-cases/TC-021.md](.traklet/test-cases/TC-021.md)
  - Spec: [tests/e2e/square-payment-flow.spec.ts](../tests/e2e/square-payment-flow.spec.ts), [tests/e2e/checkout-with-mock-square.spec.ts](../tests/e2e/checkout-with-mock-square.spec.ts)
  - Component: [components/payment/SquarePaymentForm.tsx](../components/payment/SquarePaymentForm.tsx)
  - Endpoint: [app/api/payment/process/route.ts](../app/api/payment/process/route.ts)
  - Manual: QA_TESTING_GUIDE.md Part 5 (implicit in Tests 5.3, 5.4, 5.5)
  - GitHub: (pending sync)
  - Depends on: TC-015

## Admin (Suite: admin)

- **TC-022** Super-admin can sign in via password (priority: critical, NEW FEATURE)
  - File: [.traklet/test-cases/TC-022.md](.traklet/test-cases/TC-022.md)
  - Page: [app/admin-login/page.tsx](../app/admin-login/page.tsx) (to be created)
  - Endpoint: [app/api/auth/admin-login/route.ts](../app/api/auth/admin-login/route.ts) (to be created)
  - Helper: [tests/e2e/_helpers/auth.ts](../tests/e2e/_helpers/auth.ts) loginAsSuperAdminWithPassword() (to be added)
  - Manual: QA_TESTING_GUIDE.md Part 6 (admin features require this)
  - GitHub: (pending sync)

- **TC-023** Super-admin views all organizations (priority: high)
  - File: [.traklet/test-cases/TC-023.md](.traklet/test-cases/TC-023.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 6)
  - Endpoint: [app/api/admin/subscriptions/route.ts](../app/api/admin/subscriptions/route.ts)
  - Manual: QA_TESTING_GUIDE.md Part 6 Test 6.2
  - GitHub: (pending sync)
  - Depends on: TC-022

- **TC-024** Super-admin creates and manages coupons (priority: high)
  - File: [.traklet/test-cases/TC-024.md](.traklet/test-cases/TC-024.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 6)
  - Page: [app/admin/coupons/page.tsx](../app/admin/coupons/page.tsx)
  - Component: [components/admin/CouponForm.tsx](../components/admin/CouponForm.tsx), [components/admin/CouponListTable.tsx](../components/admin/CouponListTable.tsx)
  - Endpoint: [app/api/admin/coupons/route.ts](../app/api/admin/coupons/route.ts)
  - Manual: QA_TESTING_GUIDE.md Part 6 Test 6.3
  - GitHub: (pending sync)
  - Depends on: TC-022

- **TC-025** Super-admin views all subscriptions (priority: medium)
  - File: [.traklet/test-cases/TC-025.md](.traklet/test-cases/TC-025.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 6)
  - Endpoint: [app/api/admin/subscriptions/route.ts](../app/api/admin/subscriptions/route.ts)
  - Manual: QA_TESTING_GUIDE.md Part 6 Test 6.4
  - GitHub: (pending sync)
  - Depends on: TC-022

## Export (Suite: export)

- **TC-026** Export registrations as CSV (priority: high)
  - File: [.traklet/test-cases/TC-026.md](.traklet/test-cases/TC-026.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Parts 3-4-7)
  - Manual: QA_TESTING_GUIDE.md Part 7 Test 7.1
  - GitHub: (pending sync)
  - Issue: CSV export missing UTF-8 BOM and CSV-formula-injection escaping (qa-report/SUMMARY.md HIGH)
  - Depends on: TC-010

- **TC-027** Export registrations as PDF (priority: medium)
  - File: [.traklet/test-cases/TC-027.md](.traklet/test-cases/TC-027.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Parts 3-4-7)
  - Manual: QA_TESTING_GUIDE.md Part 7 Test 7.2
  - GitHub: (pending sync)
  - Depends on: TC-010

- **TC-028** Export registrations with applied filters (priority: low)
  - File: [.traklet/test-cases/TC-028.md](.traklet/test-cases/TC-028.md)
  - Manual: QA_TESTING_GUIDE.md Part 7 Test 7.3 (marked "If Available")
  - GitHub: (pending sync)
  - Depends on: TC-011, TC-026

## Classes (Suite: classes)

- **TC-029** Create a class or workshop (priority: medium)
  - File: [.traklet/test-cases/TC-029.md](.traklet/test-cases/TC-029.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 8)
  - Page: [app/classes/new/page.tsx](../app/classes/new/page.tsx)
  - Component: [components/classes/ClassForm.tsx](../components/classes/ClassForm.tsx)
  - Manual: QA_TESTING_GUIDE.md Part 8 Test 8.1
  - GitHub: (pending sync)
  - Depends on: TC-006

- **TC-030** Add sessions to a class (priority: medium)
  - File: [.traklet/test-cases/TC-030.md](.traklet/test-cases/TC-030.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 8)
  - Page: [app/classes/[id]/sessions/page.tsx](../app/classes/[id]/sessions/page.tsx)
  - Manual: QA_TESTING_GUIDE.md Part 8 Test 8.2
  - GitHub: (pending sync)
  - Depends on: TC-029

- **TC-031** Add participants to organization (priority: medium)
  - File: [.traklet/test-cases/TC-031.md](.traklet/test-cases/TC-031.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 8)
  - Page: [app/participants/new/page.tsx](../app/participants/new/page.tsx)
  - Manual: QA_TESTING_GUIDE.md Part 8 Test 8.3
  - GitHub: (pending sync)
  - Depends on: TC-006

- **TC-032** Enroll participant with capacity enforcement (priority: high)
  - File: [.traklet/test-cases/TC-032.md](.traklet/test-cases/TC-032.md)
  - Spec: [tests/e2e/qa-testing-guide-coverage.spec.ts](../tests/e2e/qa-testing-guide-coverage.spec.ts) (Part 8)
  - Endpoint: [app/api/enrollments/route.ts](../app/api/enrollments/route.ts)
  - Manual: QA_TESTING_GUIDE.md Part 8 (implicit)
  - GitHub: (pending sync)
  - Race condition: qa-report/SUMMARY.md (same pattern as check-in, no transaction guard)
  - Depends on: TC-029, TC-031

## Security Regression (Suite: security)

- **TC-033** BLOCKER: Payment amount must be server-validated (priority: critical)
  - File: [.traklet/test-cases/TC-033.md](.traklet/test-cases/TC-033.md)
  - Blocker: qa-report/SUMMARY.md item 1
  - Endpoint: [app/api/payment/process/route.ts](../app/api/payment/process/route.ts)
  - Manual: (not in manual guide, discovered during QA)
  - GitHub: (pending sync)

- **TC-034** BLOCKER: Registration endpoints require auth and org-scoping (priority: critical)
  - File: [.traklet/test-cases/TC-034.md](.traklet/test-cases/TC-034.md)
  - Blocker: qa-report/SUMMARY.md item 4 (IDOR vulnerability)
  - Endpoint: [app/api/registrations/[id]/route.ts](../app/api/registrations/[id]/route.ts)
  - Manual: (not in manual guide, discovered during QA)
  - GitHub: (pending sync)

- **TC-035** BLOCKER: Export endpoint requires authentication (priority: critical)
  - File: [.traklet/test-cases/TC-035.md](.traklet/test-cases/TC-035.md)
  - Blocker: qa-report/SUMMARY.md item 5 (unauthenticated bulk PII export)
  - Endpoint: [app/api/registrations/export/route.ts](../app/api/registrations/export/route.ts)
  - Manual: (not in manual guide, discovered during QA)
  - GitHub: (pending sync)

- **TC-036** BLOCKER: clear-database endpoint requires strict authorization (priority: critical)
  - File: [.traklet/test-cases/TC-036.md](.traklet/test-cases/TC-036.md)
  - Blocker: qa-report/SUMMARY.md item 6
  - Endpoint: [app/api/system/clear-database/route.ts](../app/api/system/clear-database/route.ts)
  - Manual: (not in manual guide, discovered during QA)
  - GitHub: (pending sync)

- **TC-037** BLOCKER: report-bug endpoint requires rate limiting (priority: critical)
  - File: [.traklet/test-cases/TC-037.md](.traklet/test-cases/TC-037.md)
  - Blocker: qa-report/SUMMARY.md item 8 (partial)
  - Endpoint: [app/api/report-bug/route.ts](../app/api/report-bug/route.ts)
  - Manual: (not in manual guide, discovered during QA)
  - GitHub: (pending sync)

- **TC-038** REGRESSION: Traklet PAT never exposed to client (priority: high)
  - File: [.traklet/test-cases/TC-038.md](.traklet/test-cases/TC-038.md)
  - Fix documented: qa-report/fix-traklet.md (2026-04-25)
  - Component: [components/dev/TrakletDevWidget.tsx](../components/dev/TrakletDevWidget.tsx)
  - Proxy: [app/api/dev/traklet-proxy/route.ts](../app/api/dev/traklet-proxy/route.ts)
  - Manual: (regression check, not in manual guide)
  - GitHub: (pending sync)

- **TC-039** CSP nonce rotates per request (priority: medium)
  - File: [.traklet/test-cases/TC-039.md](.traklet/test-cases/TC-039.md)
  - Middleware: [middleware.ts](../middleware.ts)
  - Manual: (not in manual guide, security hardening)
  - GitHub: (pending sync)

- **TC-040** BLOCKER: Payment auth-bypass via body.email (priority: critical)
  - File: [.traklet/test-cases/TC-040.md](.traklet/test-cases/TC-040.md)
  - Blocker: qa-report/SUMMARY.md item 2
  - Endpoint: [app/api/payment/process/route.ts](../app/api/payment/process/route.ts)
  - Manual: (not in manual guide, discovered during QA)
  - GitHub: (pending sync)
  - Combined with TC-033 for full attack chain

---

## Stats

- **Total test cases**: 40
- **Critical priority**: 9 (TC-005, TC-022, TC-033, TC-034, TC-035, TC-036, TC-037, TC-040)
- **High priority**: 15
- **Medium priority**: 13
- **Low priority**: 3
- **Blockers from QA report**: 8 (TC-005, TC-033, TC-034, TC-035, TC-036, TC-037, TC-040 + partial TC-037)
- **New features**: 1 (TC-022 super-admin password login)
- **Regression checks**: 1 (TC-038 Traklet PAT)

## Sync Status

Run `npx traklet sync` to create GitHub Issues for all test cases.
After sync, `backend-id` will be written to each TC-###.md frontmatter.
Update this file with GitHub issue links after sync completes.

## Dependency Graph

Test cases with dependencies must pass prerequisites before they can be executed:
- TC-003 → TC-001 (form builder requires org setup)
- TC-004 → TC-003 (QR codes require form config)
- TC-007 → TC-004 (view QR codes requires generated QR codes)
- TC-008 → TC-007 (download requires viewing)
- TC-009 → TC-004 (public registration requires QR code)
- TC-010 → TC-009 (view registrations requires at least one registration)
- TC-011 → TC-010 (search requires registration list)
- TC-012 → TC-010 (check-in requires registrations)
- TC-013 → TC-012 (undo requires check-in)
- TC-014 → TC-012 (bulk check-in requires check-in feature)
- TC-016..TC-021 → TC-015 (coupon/payment tests require pricing page)
- TC-023..TC-025 → TC-022 (admin features require super-admin auth)
- TC-026..TC-027 → TC-010 (export requires registrations)
- TC-028 → TC-011, TC-026 (filtered export requires search + export)
- TC-029 → TC-006 (classes require dashboard access)
- TC-030 → TC-029 (sessions require class)
- TC-031 → TC-006 (participants require dashboard access)
- TC-032 → TC-029, TC-031 (enrollment requires class + participants)
