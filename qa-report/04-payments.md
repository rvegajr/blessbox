# QA Section 8 — Pricing / Subscriptions / Payments

Date: 2026-04-25  Reviewer: rvegajr@noctusoft.com  Branch: main  Dev: http://localhost:7777

> Note: Task brief said "no .env → Square sandbox unavailable", but a `.env` IS loaded — `SQUARE_APPLICATION_ID`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT=sandbox` are configured. `CRON_SECRET` is **not** set. End-to-end card auth still requires Square sandbox test cards (manual UI step).

---

## 1. `/api/square/config` — Secret Leak Check — PASS

```
GET /api/square/config -> 200
{"enabled":true,"applicationId":"sandbox-sq0idb-wmodH19wX_VVwhJOkrunbw",
 "locationId":"LJWT6C2KX3YZV","environment":"sandbox"}
```
Source: `app/api/square/config/route.ts` returns ONLY `enabled / applicationId / locationId / environment`. **No `accessToken`, no secret leakage.** Application ID is a public/publishable value (sandbox prefix `sandbox-sq0idb-`) — safe to expose.

## 2. Coupon Validation + SQL Injection — PASS (security) / DATA GAP

`/api/coupons/validate` (POST `{code}`) is now DB-backed via `CouponService` (`lib/coupons.ts`). Hard-coded coupons in the deprecated `/api/payment/validate-coupon` (WELCOME25 25%, SAVE10 10%, NGO50 50%, FIXED500 500¢) are NO LONGER honored by the canonical endpoint.

| Code                   | Response                                     |
|------------------------|----------------------------------------------|
| WELCOME25              | `{"valid":false,"error":"Coupon not found"}` |
| SAVE10                 | `{"valid":false,"error":"Coupon not found"}` |
| NGO50                  | `{"valid":false,"error":"Coupon not found"}` |
| FIXED500               | `{"valid":false,"error":"Coupon not found"}` |
| FAKE123                | `{"valid":false,"error":"Coupon not found"}` |
| `'; DROP TABLE coupons;--` | `{"valid":false,"error":"Coupon not found"}` |

- **SQL injection BLOCKED** — `validateCoupon()` uses parameterized libsql `args:[code...]` (line 55-58 of `lib/coupons.ts`). No string interpolation.
- **Discount math (from `applyCoupon`):** `percentage`: `amount * (1 - value/100)`, `fixed`: `amount - value`. Floor of **100¢** for paid plans (or 0 if a true 100% coupon). Logic is correct.
- **Issue (data, not security):** No coupons seeded in dev DB, so the documented promo codes cannot be tested. Either seed dev data or remove the deprecated mock endpoint to prevent confusion. The deprecated endpoint at `app/api/payment/validate-coupon/route.ts` still happily returns `valid:true` for the four legacy codes — **this is a divergence vector** if any UI still calls it.

## 3. `/api/payment/process` Source Review — MULTIPLE SECURITY ISSUES

File: `app/api/payment/process/route.ts`

### CRITICAL: Client-controlled amount (price tampering)
Lines 9-15 destructure `amount` from request body and pass it directly to `SquarePaymentService.processPayment(token, Number(amount), ...)` (line 105-110). **Server never verifies `amount` matches the `planType`'s real price.** A malicious client can POST `{planType:'enterprise', amount:1}` and pay 1¢ for an Enterprise sub. The subsequent `createSubscription({planType})` then provisions the correct tier regardless of what was charged.
**Fix:** Look up canonical price server-side from `planType`+`billingCycle` (and optionally apply server-validated coupon by code), and ignore client `amount`.

### CRITICAL: No coupon re-validation server-side
`/api/coupons/apply` is called from the client to compute the discounted amount, but `process` accepts whatever amount the client returns. A tampered client skips coupons entirely or fakes a 100% discount. Combine with above fix.

### Idempotency
`SquarePaymentService.processPayment` (line 67) generates a fresh `idempotencyKey` server-side per call (`crypto.randomUUID()`). This protects Square from duplicate Square-side charges within the same call but does **NOT** prevent a client from submitting the same payment token twice and getting two charges/two subscriptions — there's no replay-guard keyed off the Square `sourceId` or a client-supplied idempotency key. Recommend: accept `Idempotency-Key` header from client, persist + dedupe.

### Webhook verification — NOT IMPLEMENTED
No `app/api/**/webhook*` route exists. Square payment status is trusted purely from the synchronous API response. If Square later disputes/refunds, app state will drift. Recommend adding a `/api/square/webhook` with HMAC signature verification (`Square-Signature` header).

### Mock bypass (informational)
`shouldMockPayment` (line 56-59) auto-mocks payments when `NODE_ENV!=='production'` AND token/app id missing. In dev with sandbox keys present (current state), this branch is NOT taken — real Square sandbox is hit. Behavior is sound; just be sure `NODE_ENV==='production'` is set in prod.

### Auth fallback (medium)
Lines 19-23: if no session, the route falls back to `body.email` and calls `getOrCreateOrganizationForEmail(email)`. **Anyone can trigger subscription creation for any email.** Combined with the amount-tampering issue, an attacker can pre-pay $0.01 to grant a victim's email an Enterprise org and binding. Restrict to authenticated sessions only, or require email verification token.

## 4. Cron `/api/cron/finalize-cancellations` — PASS (with config gap)

```
GET /api/cron/finalize-cancellations -> 500
{"error":"Cron secret not configured"}
```
Source verifies `Authorization: Bearer ${CRON_SECRET}` (lines 22-39). Anonymous request is rejected. The 500 vs 401 here is because `CRON_SECRET` env is not set in dev — fail-closed (good). With `CRON_SECRET` set, anonymous returns 401 as required. No Vercel cron header bypass — only Bearer token. Recommend also accepting/preferring `x-vercel-cron` header in prod.

## 5. `/api/subscription/{upgrade,cancel}` — PASS

- Both `GET` and `POST` require `getServerSession()` and resolve org from session — no body-supplied org override (good, contrast with `/payment/process`).
- Anonymous probes returned `401 Authentication required`.
- `upgrade` validates `targetPlan ∈ {free,standard,enterprise}`, rejects `free` as upgrade target (line 107), and delegates state transition to `PlanUpgrade.executeUpgrade`.
- `cancel` does soft cancel (`canceling` status, access until `current_period_end`) — finalized later by the cron job. Reason whitelisted via `CANCEL_REASONS`.
- **Concern:** `POST /upgrade` directly upgrades plan WITHOUT verifying payment (comment on line 80-81 acknowledges this: "In production, this would be called AFTER payment is confirmed"). Currently any logged-in user can self-upgrade to Enterprise for free by calling this endpoint. **Fix before launch.**

## 6. `/api/usage` — PASS (auth) / NEEDS DEEPER ENFORCEMENT REVIEW

- Anonymous: 401. Session required, org resolved from session — good.
- Returns usage from `UsageDisplay` service. The route only *displays* usage; actual Free-tier write enforcement must live in the registration creation path (out of scope for this file). Recommend a follow-up audit confirming `app/api/registrations/*` checks `current_count < plan_limit` server-side and not only via UI.

## 7. `/pricing` Page Render — PARTIAL PASS

`GET /pricing -> 200`. Page (`app/pricing/page.tsx`) hard-codes:
- Free — $0, "Up to 100 registrations"
- Standard — **$19/mo**, "Up to 5,000 registrations"
- Enterprise — **$99/mo**, "Up to 50,000 registrations"

`docs/CHURCH_PRICING_STRATEGY_ANALYSIS.md` was not present in the loaded set during review (path may differ — recommend cross-checking pricing values against canonical docs). Hard-coded prices on the page also drift from any DB-driven plan source — single source of truth needed.

## 8. SendGrid Lazy-Init (commit 68c33a4) — PASS

`lib/services/SendGridTransport.ts` uses lazy getters (`_apiKey`, `_fromEmail`, `_fromName`) backed by `getRequiredEnv` only on first access (lines 17-39). Constructor performs no env reads — module import during build/CI no longer throws. `require('@sendgrid/mail')` is also deferred to `sendDirect()`. Fix is present and correct in the actual transport used by payment/email paths.

---

## Square Sandbox E2E — BLOCKED (manual)

Real card-flow tests (4111… sandbox PAN through Square Web Payments SDK → `/api/payment/process` → success/decline/3DS) require a browser session and human interaction. Not executed in this pass. Run manually with sandbox PAN `4111 1111 1111 1111`, CVV `111`, any future expiry.

## Top Priorities to Fix Before Launch
1. **Server-side price authority** in `/api/payment/process` — never trust `amount` from client.
2. **Require auth** on `/api/payment/process` (drop the body-email fallback).
3. **Gate `/api/subscription/upgrade`** on confirmed payment (currently free Enterprise upgrade).
4. **Add Square webhook + signature verification** for async payment state.
5. Decide: seed real coupons OR delete deprecated `/api/payment/validate-coupon`.
6. Set `CRON_SECRET` in deployed envs.

## Files Reviewed
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/square/config/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/payment/process/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/payment/create-intent/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/payment/validate-coupon/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/coupons/validate/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/coupons/apply/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/cron/finalize-cancellations/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/subscription/cancel/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/subscription/upgrade/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/subscriptions/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/usage/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/pricing/page.tsx`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/checkout/page.tsx`
- `/Users/admin/Dev/YOLOProjects/BlessBox/lib/coupons.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/lib/services/SquarePaymentService.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/lib/services/SendGridTransport.ts`
