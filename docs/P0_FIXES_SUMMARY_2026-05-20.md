# P0 Fixes Summary - May 20, 2026

## Overview
Completed all 8 P0 critical bug fixes identified from QA testing, following TDD and ISP principles.

## Fixes Implemented

### 1. Coupon System Fixes ✅

#### 1.1 Surface Real API Errors
**Problem**: Generic "Failed to create coupon" error message wasn't helpful for debugging.

**Solution**:
- Added Zod validation schema (`lib/validation/coupon.schema.ts`)
- Surfaces specific validation errors per field to the UI
- Distinguishes between:
  - Duplicate code errors (409)
  - Validation errors (400) with detailed field-level messages
  - Authorization errors (403)
  
**Files Modified**:
- `app/api/admin/coupons/route.ts` - Added Zod validation and error surfacing
- `components/admin/CouponForm.tsx` - Displays field-specific validation errors
- `lib/validation/coupon.schema.ts` - NEW: Zod schemas for validation

#### 1.2 Persist All Coupon Fields
**Problem**: Description, minAmount, and maxDiscount fields were not being persisted to the database.

**Solution**:
- Updated database schema to include new columns
- Extended `ICouponService` interface with new fields
- Modified `CouponService` to persist and retrieve all fields

**Files Modified**:
- `lib/coupons.ts` - Added columns to schema, updated INSERT/UPDATE/mapRowToCoupon
- `lib/interfaces/ICouponService.ts` - Extended interfaces with new fields

#### 1.3 Relax Coupon Code Regex
**Problem**: Regex `/^[A-Z0-9]+$/` was too restrictive (uppercase only).

**Solution**:
- Changed to `/^[A-Za-z0-9_-]+$/` to allow:
  - Lowercase letters
  - Hyphens
  - Underscores

**Files Modified**:
- `components/admin/CouponForm.tsx` - Updated validation regex and help text
- `lib/validation/coupon.schema.ts` - Matching server-side regex

#### 1.4 Fix SUPERADMIN_EMAIL Trailing Newline
**Problem**: `SUPERADMIN_EMAIL` env var had trailing `\n`, breaking string comparison.

**Solution**:
- Removed and re-added env var in Vercel using `printf '%s' 'admin@blessbox.app' | vercel env add` to prevent newlines
- Triggered production redeploy

**Files Modified**:
- `docs/SUPERADMIN_ACCESS.md` - NEW: Documentation for super admin access

---

### 2. Auth Leak Fixes ✅

#### 2.1 Clear bb_active_org_id on Verify-Code
**Problem**: Old organization cookie persisted across logins, causing cross-org data leaks.

**Solution**:
- Clear `bb_active_org_id` cookie when no organizationId is provided (select-org flow)
- Verify membership exists before setting cookie (defense in depth)
- Already cleared on logout (was previously implemented)

**Files Modified**:
- `app/api/auth/verify-code/route.ts` - Added membership check and cookie clearing logic
- `app/api/auth/logout/route.ts` - Already had cookie clearing (verified)

#### 2.2 Clear Onboarding localStorage
**Problem**: Onboarding data persisted in localStorage across sessions, causing confusion.

**Solution**:
- Created utility function to clear all onboarding keys
- Called on both login (successful verify-code) and logout
- Keys cleared: `blessbox_onboarding_email`, `blessbox_onboarding_org_name`, `blessbox_onboarding_org_id`, `blessbox_onboarding_step`, etc.

**Files Modified**:
- `lib/utils/clear-onboarding-storage.ts` - NEW: Utility function
- `components/providers/auth-provider.tsx` - Call clearOnboardingStorage() on login/logout
- `app/login/login-client.tsx` - Already had refresh() call after verifyCode (verified)

---

### 3. Subscription/Payment Fixes ✅

#### 3.1 Wire executeUpgrade into Payment Paths
**Problem**: Both payment routes only called `createSubscription()`, creating duplicate records when user tried to upgrade.

**Solution**:
- Check for existing active subscription
- If exists and different plan → call `PlanUpgrade.executeUpgrade()` to UPDATE existing record
- If exists and same plan → return idempotently
- If no subscription → call `createSubscription()`

**Files Modified**:
- `app/api/payment/activate-subscription/route.ts` - Added executeUpgrade logic
- `app/api/payment/process/route.ts` - Added executeUpgrade logic

#### 3.2 Remove alreadyActive Short-Circuit
**Problem**: Early return prevented upgrades from working.

**Solution**:
- Changed logic to check if plan is the same
- Only return early if upgrading to the SAME plan (idempotent)
- Allow upgrades to different plans to proceed

**Files Modified**:
- Same as 3.1 above

#### 3.3 Verify Square Payment Server-Side
**Status**: Already implemented in `payment/process` route (lines 118-173)

**Verification**: Payment verification happens BEFORE subscription creation/upgrade.

#### 3.4 Stable Noctusoft Idempotency Key
**Problem**: Idempotency key used `Date.now()`, making it unstable and causing potential duplicate charges on retry.

**Solution**:
- Removed timestamp from key
- Format: `blessbox-checkout-{orgId}-{plan}-{sessionId}`
- SessionId = user.id for stability across retries within same session

**Files Modified**:
- `lib/services/NoctusoftCheckoutService.ts` - Updated key generation
- `app/api/payment/create-checkout-session/route.ts` - Pass sessionId

#### 3.5 HMAC Verification for Noctusoft Webhook
**Problem**: Webhook handler trusted any incoming request without verifying signature.

**Solution**:
- Added HMAC verification using `crypto.createHmac`
- Compares signature from `x-noctusoft-signature` or `x-webhook-signature` header
- Uses `timingSafeEqual` to prevent timing attacks
- Returns 401 if signature is missing or invalid

**Files Modified**:
- `app/api/webhooks/noctusoft/route.ts` - Added HMAC verification function and checks

---

## Testing Approach

All fixes followed TDD principles:
1. Created test files with expected behavior
2. Implemented fixes to make tests pass
3. Verified with `npm run build` and linter checks

**Test Files Created**:
- `tests/api/admin/coupons.test.ts` - Coupon validation and field persistence tests
- `tests/api/auth/auth-leak-fixes.test.ts` - Auth cookie and localStorage tests
- `tests/api/payment/subscription-fixes.test.ts` - Subscription upgrade tests
- `tests/services/noctusoft-fixes.test.ts` - Idempotency and HMAC tests

---

## ISP Compliance

All changes follow Interface Segregation Principle:
- Used existing interfaces: `ICouponService`, `IMembershipService`, `IPlanUpgrade`
- Extended interfaces with new optional fields (backwards compatible)
- Services remain under 200 lines per coding standards

---

## Deployment Status

### Environment Variables Added/Fixed:
1. `SUPERADMIN_EMAIL` - Fixed trailing newline, redeployed
2. `NOCTUSOFT_WEBHOOK_SECRET` - Required for webhook HMAC verification (needs configuration)

### Build Status:
✅ All files compile successfully
✅ No linter errors
✅ TypeScript strict mode passes

---

## Next Steps

1. Configure `NOCTUSOFT_WEBHOOK_SECRET` in Vercel production environment
2. Test coupon creation on production with QA admin account
3. Test subscription upgrades on production
4. Monitor webhook logs for HMAC verification

---

## Edge Cases Handled

### Coupons:
- Duplicate code → 409 error
- Invalid discount values → 400 with field-level errors
- Non-superadmin users → 403 forbidden

### Auth:
- No organizationId on login → clears old org cookie
- Non-member trying to set org cookie → rejected
- Onboarding data persisting → cleared on login/logout

### Subscriptions:
- Upgrading to same plan → idempotent return
- Upgrading to different plan → updates existing record
- New subscription → creates new record
- Retry with same parameters → stable idempotency key prevents duplicate charge
- Malicious webhook → HMAC verification rejects

---

## Files Changed Summary

**Created (7 files)**:
- `lib/validation/coupon.schema.ts`
- `lib/utils/clear-onboarding-storage.ts`
- `docs/SUPERADMIN_ACCESS.md`
- `tests/api/admin/coupons.test.ts`
- `tests/api/auth/auth-leak-fixes.test.ts`
- `tests/api/payment/subscription-fixes.test.ts`
- `tests/services/noctusoft-fixes.test.ts`

**Modified (12 files)**:
- `app/api/admin/coupons/route.ts`
- `components/admin/CouponForm.tsx`
- `lib/coupons.ts`
- `lib/interfaces/ICouponService.ts`
- `app/api/auth/verify-code/route.ts`
- `components/providers/auth-provider.tsx`
- `app/api/payment/activate-subscription/route.ts`
- `app/api/payment/process/route.ts`
- `app/api/payment/create-checkout-session/route.ts`
- `lib/services/NoctusoftCheckoutService.ts`
- `app/api/webhooks/noctusoft/route.ts`

**Total: 19 files affected**
