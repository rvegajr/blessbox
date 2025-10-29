# Subscriptions and Billing

## What exists now
- Square config and environment validation are present but not wired to live payments.
- Implemented endpoints:
  - `POST /api/payment/create-intent`: creates a simulated payment intent in sandbox/dev.
  - `POST /api/payment/process`: simulates successful payment and creates a subscription record.
  - `POST /api/payment/validate-coupon`: sample coupon validator for tests.
  - `GET/POST /api/subscriptions`: list current user's active subscription or create/upgrade.
  - `GET/DELETE /api/admin/subscriptions`: super admin list and cancel.
- Database:
  - `organizations` and `subscription_plans` tables created automatically on demand via `ensureSubscriptionSchema`.

## Conditions for gating features
- Free plan:
  - Max 100 registrations; basic features only.
- Standard plan:
  - Higher limits (5,000); email support.
- Enterprise plan:
  - Highest limits (50,000); priority support.

Enforcement points to add (recommended next):
- On registration creation: check `subscription_plans.current_registration_count < registration_limit`.
- On QR set creation: optional plan-based limits (e.g., number of active QR sets).
- On export/reporting: enable for Standard+.

## Super Admin visibility and actions
- `GET /admin` page lists all subscriptions with org email, plan, status, billing.
- `DELETE /api/admin/subscriptions` cancels a subscription (sets status=canceled, end_date).

## How to add real Square Subscriptions
1. Frontend checkout:
   - Replace simulated card container with Square Web Payments SDK.
   - Collect payment token and pass to backend.
2. Backend:
   - Use Square SDK to create a customer and card on file.
   - Create a subscription using a Square Catalog plan.
   - Store Square ids (customer_id, subscription_id) in `subscription_plans` (add columns).
3. Webhooks:
   - Add `/api/payment/webhook` and validate signature.
   - Handle subscription `ACTIVE`, `CANCELED`, `PAYMENT_FAILED` events to update status.

## Testing plan
- Unit tests:
  - Subscription creation/upgrades in `lib/subscriptions`.
  - Limits enforcement helpers.
- Integration tests:
  - `POST /api/payment/process` returns subscription.
  - `GET /api/subscriptions` shows it.
  - Admin list/cancel flow.
- E2E (Playwright):
  - Visit `/pricing` → plan card → `/checkout` → pay → `/dashboard` shows plan.
  - Visit `/admin` as superadmin → list and cancel.

## Environment variables
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` for libsql.
- `NEXTAUTH_SECRET` required.
- `SUPERADMIN_EMAIL` optional; defaults include `admin@blessbox.app`.

## Future schema extensions
- Add `square_customer_id`, `square_subscription_id`, `square_status`.
- Add `trial_end_date`, `grace_period_end` for dunning flows.
- Add `plan_metadata` JSON for feature flags.

