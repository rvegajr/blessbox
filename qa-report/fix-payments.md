# Payment Blockers — Fix Report

Date: 2026-04-25  Reviewer: rvegajr@noctusoft.com  Branch: main

Addresses the three blockers from `qa-report/04-payments.md` (sections 3 and 5):
price tampering, auth bypass via `body.email`, and self-grant upgrade.

## Files Changed

### New: `lib/pricing/plans.ts` (new file, 78 lines)
Single source of truth for plan metadata. Re-exports `planPricingCents` /
`planRegistrationLimits` from `lib/subscriptions.ts` and adds:
- `VALID_PLANS`, `isValidPlan()` — server-side input guard.
- `getPlanPriceCents(planType, billingCycle)` — server-authoritative price.
- `PLANS[]` — display descriptors used by the pricing page.

### `app/api/payment/process/route.ts` (rewritten end-to-end)
- **L17–22**: Hard 401 when `session?.user?.email` is missing. Removed
  the `body.email` fallback path entirely (no more
  `getOrCreateOrganizationForEmail(email)`).
- **L33–37**: `planType` validated via `isValidPlan()`; rejects unknown
  plans with 400.
- **L62–66**: `amountCents` derived server-side via `getPlanPriceCents()`.
  Client-supplied `amount` is no longer read.
- **L69–80**: If `couponCode` present, server calls
  `CouponService.validateCoupon()` then `applyCoupon()`. Client-discounted
  amount is never trusted.
- **L84**: Free plans short-circuit Square; paid plans require
  `paymentToken`.
- **L106**: Square is charged with the server-computed `amountCents`,
  not the body value.
- **L150**: `createSubscription` now also receives `amountCents` so the
  ledger row reflects the actually-charged price (incl. coupon).

### `app/api/subscription/upgrade/route.ts` (L74–103, POST handler rewritten)
POST now returns **402 Payment Required** with a directive message:
"Plan upgrades must be completed via /api/payment/process with a
verified payment token." The previous `planUpgrade.executeUpgrade()`
self-grant path is removed. GET (preview) is unchanged.

### `app/pricing/page.tsx` (L4–10)
Now imports `PLANS` from `lib/pricing/plans.ts` instead of hard-coding
prices. UI prices can no longer drift from server pricing.

### `lib/services/PaymentProcess.test.ts` (rewritten, 7 tests)
Replaces obsolete email-fallback assertions with the new contract:
- **Auth**: rejects no-session (401); IGNORES `body.email` fallback
  (401); accepts authenticated session and resolves org from session.
- **Price-tampering defense**: POST `{planType:'enterprise', amount:1}`
  is recomputed to **9900 cents** server-side; `processPayment` is
  asserted to be called with `9900`, not `1`. Unknown `planType`
  rejected; missing `paymentToken` for paid plan rejected.
- **Coupon**: invalid code rejected server-side (no client trust).

### Incidental: `app/api/auth/send-code/route.ts` (L18)
Pre-existing TS build break (unrelated to payments) was blocking
`npm run build`. Tightened body type from `{ email?: unknown }` to
`{ email?: string }` — minimal fix, no behavior change.

## Test Results

```
npm run test -- --run
 Test Files  29 passed (29)
      Tests  351 passed (351)

npm run build
 ✓ Compiled successfully
 ✓ Type check passed
```

Specifically the new tampering test:
```
✓ Payment Process API > Price tampering defense >
    IGNORES client amount=1 for enterprise; charges canonical 9900 cents
```

## Behavior Summary

| Attack                                                   | Before    | After                  |
|----------------------------------------------------------|-----------|------------------------|
| POST `/api/payment/process` `{planType:enterprise, amount:1}` | $0.01 charged, Enterprise granted | Square charged 9900¢; or rejected if unauth |
| POST `/api/payment/process` `{email:'victim@x.com'}` no session | Provisions Enterprise org for victim | 401 Authentication required |
| Tampered client coupon (fake 100% discount in `amount`)  | Honored   | Server re-validates code; ignores client amount |
| POST `/api/subscription/upgrade` `{plan:'enterprise'}`   | Free Enterprise upgrade | 402 Payment Required — must go through `/api/payment/process` |

## Out of Scope (still open from QA report)
- Square webhook + HMAC signature verification.
- Idempotency-Key replay guard keyed off Square `sourceId`.
- Seed real coupons OR delete deprecated `/api/payment/validate-coupon`.
- Set `CRON_SECRET` in deployed envs.
