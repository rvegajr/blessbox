# 🚀 BlessBox Subscription & Payment System Testing Checklist

*The Most Comprehensive Testing Guide - Built with Love by the Happiest Software Architect* ✨

---

## 📋 TABLE OF CONTENTS

1. [Pre-Implementation Analysis](#pre-implementation-analysis)
2. [Square Developer Sandbox Setup](#square-developer-sandbox-setup)
3. [Interface Segregation Principle (ISP) Compliance](#isp-compliance)
4. [Test-Driven Development (TDD) Requirements](#tdd-requirements)
5. [Payment Processing Tests](#payment-processing-tests)
6. [Coupon System Tests](#coupon-system-tests)
7. [Admin Control Tests](#admin-control-tests)
8. [Integration Tests](#integration-tests)
9. [End-to-End Tests](#e2e-tests)
10. [Security & Edge Cases](#security-edge-cases)
11. [Performance & Scale Tests](#performance-scale-tests)
12. [Production Readiness Checklist](#production-readiness)

---

## 🔍 PRE-IMPLEMENTATION ANALYSIS

### Current State Assessment

#### ✅ What We Have
- [ ] **Database Schema**
  - [ ] `organizations` table exists
  - [ ] `subscription_plans` table exists with all required columns
  - [ ] Indexes on `organization_id` and `status`
  - [ ] Foreign key constraints properly defined

- [ ] **Basic API Endpoints**
  - [ ] `POST /api/payment/create-intent` (simulated)
  - [ ] `POST /api/payment/process` (simulated)
  - [ ] `POST /api/payment/validate-coupon` (basic in-memory)
  - [ ] `GET /api/subscriptions` (user's subscription)
  - [ ] `POST /api/subscriptions` (create subscription)
  - [ ] `GET /api/admin/subscriptions` (list all)
  - [ ] `DELETE /api/admin/subscriptions` (cancel)

- [ ] **UI Pages**
  - [ ] `/pricing` - Plan selection page
  - [ ] `/checkout` - Payment page (simulated)
  - [ ] `/dashboard` - User subscription view
  - [ ] `/admin` - Super admin panel

- [ ] **Authentication**
  - [ ] NextAuth configured
  - [ ] Super admin role detection
  - [ ] Session includes user role

#### ❌ What's Missing (Implementation Required)

- [ ] **Real Square Integration**
  - [ ] Square Web Payments SDK integration
  - [ ] Card tokenization
  - [ ] Customer creation in Square
  - [ ] Subscription creation in Square
  - [ ] Webhook endpoint for Square events
  - [ ] Webhook signature validation
  - [ ] Square subscription status sync

- [ ] **Advanced Coupon System**
  - [ ] Database table for coupons
  - [ ] Admin UI to create/edit coupons
  - [ ] Coupon usage tracking
  - [ ] Redemption limits (per-user, total)
  - [ ] Expiration date handling
  - [ ] Stackable vs. exclusive coupons
  - [ ] Coupon analytics

- [ ] **Plan Limit Enforcement**
  - [ ] Registration count tracking
  - [ ] Hard limits on registration creation
  - [ ] Feature gating middleware
  - [ ] Upgrade prompts when limits hit
  - [ ] Grace period handling

- [ ] **Admin Features**
  - [ ] Manual subscription creation
  - [ ] Refund processing
  - [ ] Plan migration tools
  - [ ] Audit log for all admin actions
  - [ ] Revenue reporting
  - [ ] Churn analytics

---

## 🟦 SQUARE DEVELOPER SANDBOX SETUP

### Environment Configuration

#### Square Account Setup
- [ ] **Developer Account**
  - [ ] Created Square Developer account at https://developer.squareup.com
  - [ ] Verified email address
  - [ ] Created application for BlessBox
  - [ ] Application name: "BlessBox Subscriptions"
  - [ ] Application description documented

- [ ] **Sandbox Credentials**
  - [ ] Obtained Sandbox Application ID
  - [ ] Obtained Sandbox Access Token
  - [ ] Stored in `.env.local`:
    ```bash
    SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxx
    SQUARE_ACCESS_TOKEN=EAAAxxxxxxx
    SQUARE_ENVIRONMENT=sandbox
    ```
  - [ ] Credentials NOT committed to version control
  - [ ] Added to `.env.template` as placeholders

- [ ] **Production Credentials** (for later)
  - [ ] Obtained Production Application ID
  - [ ] Obtained Production Access Token
  - [ ] Stored securely in Vercel environment variables
  - [ ] Production access restricted to `main` branch only

#### Catalog Setup in Square Dashboard

- [ ] **Subscription Plans Created**
  - [ ] **Free Plan**
    - [ ] Created as free tier (no payment required)
    - [ ] 100 registration limit documented
    - [ ] Plan ID stored: `CATALOG_OBJECT_ID_FREE`
  
  - [ ] **Standard Plan**
    - [ ] Created in Catalog as Subscription
    - [ ] Pricing: $19/month
    - [ ] Plan ID stored: `CATALOG_OBJECT_ID_STANDARD`
    - [ ] Billing frequency: Monthly
    - [ ] Trial period: Optional (0 days default)
  
  - [ ] **Enterprise Plan**
    - [ ] Created in Catalog as Subscription
    - [ ] Pricing: $99/month
    - [ ] Plan ID stored: `CATALOG_OBJECT_ID_ENTERPRISE`
    - [ ] Billing frequency: Monthly
    - [ ] Annual option configured: $990/year

- [ ] **Test Coupons in Square**
  - [ ] Created "WELCOME25" discount (25% off)
  - [ ] Created "NGO50" discount (50% off for nonprofits)
  - [ ] Created "FIXED500" discount ($5 off)
  - [ ] Documented all coupon IDs

#### Square SDK Integration Points

- [ ] **Web Payments SDK**
  - [ ] Script loaded from Square CDN
  - [ ] Version documented: `https://sandbox.web.squarecdn.com/v1/square.js`
  - [ ] Application ID correctly passed to SDK
  - [ ] Card payment form initialized
  - [ ] Tokenization callback configured

- [ ] **Server SDK** (`square` npm package)
  - [ ] Installed: `npm install square@latest`
  - [ ] Client initialized with credentials
  - [ ] Environment (sandbox/production) configurable
  - [ ] API version documented (latest stable)

---

## 🏗️ ISP COMPLIANCE

### Interface Segregation Analysis

#### Required Interfaces

- [ ] **IPaymentProcessor** ✅ SEGREGATED PROPERLY
  ```typescript
  interface IPaymentProcessor {
    createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent>
    processPayment(token: string, amount: number): Promise<PaymentResult>
    refundPayment(paymentId: string, amount?: number): Promise<RefundResult>
  }
  ```
  - [ ] Does NOT include coupon logic ✅
  - [ ] Does NOT include subscription management ✅
  - [ ] Single responsibility: Payment processing only ✅

- [ ] **ISubscriptionService** ✅ SEGREGATED PROPERLY
  ```typescript
  interface ISubscriptionService {
    createSubscription(orgId: string, planId: string): Promise<Subscription>
    cancelSubscription(subscriptionId: string): Promise<void>
    getSubscription(subscriptionId: string): Promise<Subscription>
    listSubscriptions(orgId: string): Promise<Subscription[]>
    updateSubscription(subscriptionId: string, data: SubscriptionUpdate): Promise<Subscription>
  }
  ```
  - [ ] Does NOT include payment processing ✅
  - [ ] Does NOT include coupon application ✅
  - [ ] Single responsibility: Subscription lifecycle ✅

- [ ] **ICouponService** ⚠️ NEEDS IMPLEMENTATION
  ```typescript
  interface ICouponService {
    validateCoupon(code: string): Promise<CouponValidationResult>
    applyCoupon(code: string, amount: number): Promise<number> // returns discounted amount
    trackCouponUsage(code: string, userId: string): Promise<void>
    createCoupon(coupon: CouponCreate): Promise<Coupon>
    deactivateCoupon(couponId: string): Promise<void>
  }
  ```
  - [ ] Separate from payment processing ✅
  - [ ] Separate from subscription management ✅
  - [ ] Single responsibility: Coupon validation and tracking ✅

- [ ] **IAdminExportService** ✅ IMPLEMENTED
  ```typescript
  interface IAdminExportService {
    exportOrganizationData(organizationId: string, exportedBy: string): Promise<ExportDataSnapshot>
    exportAllData(exportedBy: string): Promise<ExportDataSnapshot>
  }
  ```
  - [ ] Single responsibility: export snapshots ✅
  - [ ] Implemented in `lib/services/AdminExportService.ts` ✅
  - [ ] Unit tests: `lib/services/AdminExportService.test.ts` ✅

#### ISP Violations to Fix

- [ ] **Current Violation**: `POST /api/payment/validate-coupon`
  - [ ] Issue: Coupon logic mixed with payment endpoint
  - [ ] Fix: Move to `/api/coupons/validate`
  - [ ] Extract to ICouponService

- [ ] **Potential Violation**: Admin endpoints in subscription service
  - [ ] Issue: Admin operations in user-facing API
  - [ ] Fix: Separate `/api/admin/*` from `/api/subscriptions`
  - [ ] Already done ✅

#### ISP Validation Tests

- [ ] **Unit Tests for Interfaces**
  - [ ] Each service implements ONLY its interface
  - [ ] No cross-interface dependencies in implementations
  - [ ] Mock implementations don't violate ISP
  - [ ] Interface clients don't depend on unused methods

---

## 🧪 TDD REQUIREMENTS

### Test Coverage Goals

- [ ] **Overall Coverage**: 90%+ on business logic
- [ ] **Service Layer**: 100% coverage required
- [ ] **API Routes**: 95%+ coverage
- [ ] **UI Components**: 85%+ coverage (critical paths)
- [ ] **Database Layer**: 100% for mutation operations

### Test Pyramid Structure

#### Unit Tests (Base of Pyramid) - 70% of tests

- [ ] **Subscription Service Tests** (`lib/subscriptions.test.ts`)
  - [ ] ✅ MUST WRITE BEFORE IMPLEMENTATION
  - [ ] `getOrCreateOrganizationForEmail()` creates new org
  - [ ] `getOrCreateOrganizationForEmail()` returns existing org
  - [ ] `getActiveSubscription()` returns null when no subscription
  - [ ] `getActiveSubscription()` returns active subscription
  - [ ] `getActiveSubscription()` ignores canceled subscriptions
  - [ ] `createSubscription()` creates with default values
  - [ ] `createSubscription()` creates with custom billing cycle
  - [ ] `createSubscription()` sets correct registration limits
  - [ ] `cancelSubscription()` updates status and end_date
  - [ ] `listAllSubscriptions()` returns all with org info
  - [ ] Edge case: Multiple active subscriptions (should not happen)
  - [ ] Edge case: Invalid organization ID
  - [ ] Edge case: Invalid plan type

- [ ] **Coupon Service Tests** (`lib/coupons.test.ts`)
  - [ ] ✅ MUST WRITE BEFORE IMPLEMENTATION
  - [ ] `validateCoupon()` returns true for valid code
  - [ ] `validateCoupon()` returns false for invalid code
  - [ ] `validateCoupon()` returns false for expired code
  - [ ] `validateCoupon()` respects usage limits
  - [ ] `applyCoupon()` calculates percentage discount correctly
  - [ ] `applyCoupon()` calculates fixed discount correctly
  - [ ] `applyCoupon()` doesn't discount below zero
  - [ ] `trackCouponUsage()` increments usage count
  - [ ] `trackCouponUsage()` prevents duplicate usage per user
  - [ ] `createCoupon()` requires valid discount type
  - [ ] `deactivateCoupon()` sets active=false
  - [ ] Edge case: Stackable coupons
  - [ ] Edge case: Coupon expiration during checkout

- [ ] **Payment Service Tests** (`lib/payment.test.ts`)
  - [ ] ✅ MUST WRITE BEFORE IMPLEMENTATION
  - [ ] `createPaymentIntent()` returns intent ID
  - [ ] `createPaymentIntent()` validates amount > 0
  - [ ] `processPayment()` succeeds with valid token
  - [ ] `processPayment()` fails with invalid token
  - [ ] `processPayment()` handles network errors gracefully
  - [ ] `refundPayment()` processes full refund
  - [ ] `refundPayment()` processes partial refund
  - [ ] `refundPayment()` fails for already-refunded payment
  - [ ] Edge case: Currency conversion
  - [ ] Edge case: Payment declined by bank
  - [ ] Edge case: Insufficient funds

- [ ] **Admin Service Tests** (`lib/admin.test.ts`)
  - [ ] ✅ MUST WRITE BEFORE IMPLEMENTATION
  - [ ] `listAllSubscriptions()` paginates correctly
  - [ ] `listAllSubscriptions()` filters by status
  - [ ] `listAllSubscriptions()` filters by plan type
  - [ ] `updateOrganizationPlan()` upgrades plan
  - [ ] `updateOrganizationPlan()` downgrades plan
  - [ ] `issueRefund()` creates refund record
  - [ ] `issueRefund()` logs audit entry
  - [ ] `getRevenueReports()` calculates MRR
  - [ ] `getRevenueReports()` calculates churn rate
  - [ ] Edge case: Admin with no permissions
  - [ ] Edge case: Concurrent admin actions

#### Integration Tests (Middle of Pyramid) - 20% of tests

- [ ] **API Route Tests**
  - [ ] `POST /api/payment/create-intent`
    - [ ] Returns 401 when not authenticated
    - [ ] Returns intent ID when authenticated
    - [ ] Accepts custom plan amounts
    - [ ] Validates currency codes
  
  - [ ] `POST /api/payment/process`
    - [ ] Returns 401 when not authenticated
    - [ ] Creates subscription on success
    - [ ] Applies coupon discount if provided
    - [ ] Handles payment failure gracefully
    - [ ] Creates organization if new user
  
  - [ ] `POST /api/payment/validate-coupon`
    - [ ] Returns valid=true for active coupon
    - [ ] Returns valid=false for expired coupon
    - [ ] Returns valid=false for exhausted coupon
    - [ ] Returns discount information
  
  - [ ] `GET /api/subscriptions`
    - [ ] Returns 401 when not authenticated
    - [ ] Returns null when no subscription
    - [ ] Returns active subscription details
    - [ ] Includes plan information
  
  - [ ] `POST /api/subscriptions`
    - [ ] Creates new subscription
    - [ ] Upgrades existing subscription
    - [ ] Returns 400 for invalid plan
  
  - [ ] `GET /api/admin/subscriptions`
    - [ ] Returns 403 for non-admin
    - [ ] Returns all subscriptions for admin
    - [ ] Includes organization details
    - [ ] Paginates large result sets
  
  - [ ] `DELETE /api/admin/subscriptions`
    - [ ] Returns 403 for non-admin
    - [ ] Cancels subscription for admin
    - [ ] Creates audit log entry
    - [ ] Returns 400 for invalid subscription ID

#### E2E Tests (Top of Pyramid) - 10% of tests

- [ ] **User Subscription Journey**
  - [ ] User visits pricing page
  - [ ] User selects plan
  - [ ] User redirected to checkout
  - [ ] User enters payment details
  - [ ] Payment processes successfully
  - [ ] User redirected to dashboard
  - [ ] Dashboard shows active subscription

- [ ] **Admin Management Journey**
  - [ ] Admin logs in
  - [ ] Admin visits admin panel
  - [ ] Admin sees all subscriptions
  - [ ] Admin cancels a subscription
  - [ ] Admin sees updated list
  - [ ] Canceled user sees canceled status in dashboard

### TDD Red-Green-Refactor Cycle

For EACH feature, follow this order:

- [ ] **Step 1: Write Failing Test (RED)**
  - [ ] Write test for desired behavior
  - [ ] Run test → should FAIL
  - [ ] Verify test failure message makes sense

- [ ] **Step 2: Make Test Pass (GREEN)**
  - [ ] Write minimum code to pass test
  - [ ] Run test → should PASS
  - [ ] Verify NO other tests broke

- [ ] **Step 3: Refactor (REFACTOR)**
  - [ ] Clean up code
  - [ ] Remove duplication
  - [ ] Improve readability
  - [ ] Run tests → should STILL PASS

- [ ] **Step 4: Repeat**
  - [ ] Move to next test
  - [ ] Repeat cycle

---

## 💳 PAYMENT PROCESSING TESTS

### Square Web Payments SDK Integration

#### Frontend Card Form Tests

- [ ] **SDK Loading**
  - [ ] Square script loads successfully
  - [ ] Correct version loaded (v1 stable)
  - [ ] Script loads from CDN (not bundled)
  - [ ] Application ID correctly passed
  - [ ] Environment (sandbox/production) detected

- [ ] **Card Input Initialization**
  - [ ] Card form renders in `#card-container`
  - [ ] Form styling matches BlessBox theme
  - [ ] Placeholder text appropriate
  - [ ] Input fields focus properly
  - [ ] Tab navigation works

- [ ] **Card Validation**
  - [ ] Valid card number accepted: `4111 1111 1111 1111`
  - [ ] Invalid card number rejected
  - [ ] CVV validation works
  - [ ] Expiration date validation works
  - [ ] Postal code validation works
  - [ ] Real-time validation feedback shown

- [ ] **Tokenization**
  - [ ] Valid card tokenizes successfully
  - [ ] Token returned from Square
  - [ ] Token passed to backend
  - [ ] Error handling for tokenization failure
  - [ ] Network error handling

#### Square Test Cards (Sandbox)

Test with these cards:

- [ ] **Successful Payment**
  - [ ] Visa: `4111 1111 1111 1111`
  - [ ] Mastercard: `5105 1051 0510 5100`
  - [ ] Amex: `3782 822463 10005`
  - [ ] Discover: `6011 1111 1111 1117`
  - [ ] CVV: Any 3-4 digits
  - [ ] ZIP: Any 5 digits

- [ ] **Declined Payment**
  - [ ] Card: `4000 0000 0000 0002`
  - [ ] Expected: Payment declined error
  - [ ] Error message shown to user
  - [ ] User can retry

- [ ] **CVV Failure**
  - [ ] Card: `4000 0000 0000 0127`
  - [ ] Expected: CVV check failed
  - [ ] Appropriate error message

- [ ] **Postal Code Failure**
  - [ ] Card: `4000 0000 0000 0036`
  - [ ] Expected: ZIP check failed
  - [ ] Appropriate error message

- [ ] **Insufficient Funds**
  - [ ] Card: `4000 0000 0000 9995`
  - [ ] Expected: Insufficient funds error
  - [ ] User notified appropriately

#### Backend Payment Processing

- [ ] **Payment Intent Creation**
  - [ ] Creates intent in Square
  - [ ] Returns intent ID to frontend
  - [ ] Stores intent ID in database
  - [ ] Associates intent with user/org
  - [ ] Handles amount in cents correctly

- [ ] **Payment Processing**
  - [ ] Receives card token from frontend
  - [ ] Verifies token with Square
  - [ ] Processes payment using Square SDK
  - [ ] Handles successful payment
  - [ ] Handles failed payment
  - [ ] Stores payment record
  - [ ] Returns success/failure to frontend

- [ ] **Customer Creation in Square**
  - [ ] Creates customer record on first payment
  - [ ] Stores Square customer ID in database
  - [ ] Reuses customer ID for future payments
  - [ ] Updates customer info if changed

- [ ] **Error Handling**
  - [ ] Network errors logged and handled
  - [ ] Invalid token errors handled
  - [ ] Declined payments handled
  - [ ] Duplicate payment prevention
  - [ ] Idempotency key usage

#### Square Subscription Creation

- [ ] **Subscription Setup**
  - [ ] Creates subscription using Catalog plan ID
  - [ ] Associates subscription with Square customer
  - [ ] Sets correct billing frequency
  - [ ] Stores Square subscription ID
  - [ ] Returns subscription details

- [ ] **Subscription Status Sync**
  - [ ] Initial status: ACTIVE
  - [ ] Updates to local database
  - [ ] Webhook handles status changes
  - [ ] CANCELED status synced
  - [ ] PAUSED status synced

- [ ] **Billing Cycle**
  - [ ] Monthly billing configured correctly
  - [ ] First payment processed immediately
  - [ ] Subsequent payments scheduled
  - [ ] Billing date stored

#### Payment Reconciliation

- [ ] **Square Dashboard Verification**
  - [ ] Payments appear in Square dashboard
  - [ ] Amounts match exactly
  - [ ] Customer names match
  - [ ] Subscription IDs match
  - [ ] Status matches between systems

- [ ] **Database Consistency**
  - [ ] Every payment has a database record
  - [ ] Every subscription has a Square ID
  - [ ] Amounts stored correctly (in cents)
  - [ ] Timestamps accurate
  - [ ] Status fields consistent

---

## 🎟️ COUPON SYSTEM TESTS

### Database Schema for Coupons

```sql
CREATE TABLE coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
  discount_value REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  active INTEGER DEFAULT 1 NOT NULL,
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0 NOT NULL,
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_by TEXT, -- admin user ID
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL REFERENCES coupons(id),
  user_id TEXT NOT NULL,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  subscription_id TEXT REFERENCES subscription_plans(id),
  discount_applied REAL NOT NULL,
  redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Coupon Validation Tests

- [ ] **Code Format Validation**
  - [ ] Accepts alphanumeric codes
  - [ ] Case-insensitive matching
  - [ ] Trims whitespace
  - [ ] Rejects special characters
  - [ ] Minimum length: 4 characters
  - [ ] Maximum length: 20 characters

- [ ] **Activation Status**
  - [ ] Active coupon validates successfully
  - [ ] Inactive coupon rejected
  - [ ] Error message: "Coupon code is not active"

- [ ] **Expiration Validation**
  - [ ] Non-expired coupon accepted
  - [ ] Expired coupon rejected
  - [ ] Error message: "Coupon code has expired"
  - [ ] Expiration at midnight (UTC)

- [ ] **Usage Limit Validation**
  - [ ] Coupon within limit accepted
  - [ ] Coupon at max uses rejected
  - [ ] Error message: "Coupon code has been fully redeemed"
  - [ ] NULL max_uses means unlimited

- [ ] **User-Specific Rules**
  - [ ] User can't use same coupon twice
  - [ ] Error message: "You've already used this coupon"
  - [ ] Different users can use same coupon
  - [ ] Admin override for re-use

### Discount Calculation Tests

- [ ] **Percentage Discount**
  - [ ] 10% off $100 = $90
  - [ ] 25% off $19 = $14.25
  - [ ] 50% off $99 = $49.50
  - [ ] 100% off = FREE (special case)
  - [ ] Rounds to 2 decimal places

- [ ] **Fixed Amount Discount**
  - [ ] $5 off $19 = $14
  - [ ] $10 off $100 = $90
  - [ ] $50 off $99 = $49
  - [ ] Discount > price = sets to $0 (or minimum $1)

- [ ] **Edge Cases**
  - [ ] Discount doesn't go below $0
  - [ ] Discount doesn't go below minimum ($1 for paid plans)
  - [ ] Currency conversion (if multi-currency)
  - [ ] Rounding consistency

### Coupon Application Flow

- [ ] **Checkout Integration**
  - [ ] Coupon input field shown on checkout
  - [ ] "Apply Coupon" button functional
  - [ ] Invalid coupon shows error inline
  - [ ] Valid coupon shows discount preview
  - [ ] Discount reflected in total
  - [ ] Coupon code stored with subscription

- [ ] **Payment Processing with Coupon**
  - [ ] Discounted amount charged to card
  - [ ] Full price stored (for accounting)
  - [ ] Discount amount stored separately
  - [ ] Coupon redemption recorded
  - [ ] Usage count incremented

### Admin Coupon Management

- [ ] **Create Coupon**
  - [ ] Admin can access coupon creation form
  - [ ] Code uniqueness enforced
  - [ ] Discount type dropdown (percentage/fixed)
  - [ ] Discount value validation
  - [ ] Expiration date picker
  - [ ] Max uses field (optional)
  - [ ] Preview shows example discounts
  - [ ] Success message on creation

- [ ] **Edit Coupon**
  - [ ] Admin can edit existing coupon
  - [ ] Can update discount value
  - [ ] Can change expiration date
  - [ ] Can adjust max uses
  - [ ] Cannot change code (must create new)
  - [ ] Cannot edit if already redeemed (safety)

- [ ] **Deactivate Coupon**
  - [ ] Admin can deactivate coupon
  - [ ] Deactivation doesn't delete (audit trail)
  - [ ] Active redemptions unaffected
  - [ ] New redemptions blocked
  - [ ] Confirmation dialog shown

- [ ] **Coupon Analytics**
  - [ ] List all coupons with usage stats
  - [ ] Show redemption count vs. limit
  - [ ] Show total revenue discount
  - [ ] Show most popular coupons
  - [ ] Export coupon usage report

### Coupon API Tests

- [ ] `POST /api/coupons/validate`
  - [ ] Returns `{ valid: true, discount: {...} }` for valid coupon
  - [ ] Returns `{ valid: false, error: "..." }` for invalid
  - [ ] Checks all validation rules
  - [ ] Rate-limited to prevent abuse

- [ ] `POST /api/coupons/apply`
  - [ ] Applies coupon to current cart/checkout
  - [ ] Returns discounted amount
  - [ ] Prevents duplicate application
  - [ ] Requires authentication

- [ ] `POST /api/admin/coupons` (create)
  - [ ] Returns 403 for non-admin
  - [ ] Creates coupon for admin
  - [ ] Validates all fields
  - [ ] Returns created coupon

- [ ] `GET /api/admin/coupons` (list)
  - [ ] Returns 403 for non-admin
  - [ ] Lists all coupons for admin
  - [ ] Includes usage statistics
  - [ ] Supports pagination

- [ ] `PATCH /api/admin/coupons/:id` (update)
  - [ ] Returns 403 for non-admin
  - [ ] Updates coupon for admin
  - [ ] Validates changes
  - [ ] Creates audit log entry

- [ ] `DELETE /api/admin/coupons/:id` (deactivate)
  - [ ] Returns 403 for non-admin
  - [ ] Soft-deletes (sets active=0)
  - [ ] Returns success message

---

## 👑 ADMIN CONTROL TESTS

### Super Admin Authentication

- [ ] **Role Detection**
  - [ ] `admin@blessbox.app` gets superadmin role
  - [ ] Custom `SUPERADMIN_EMAIL` works
  - [ ] Regular users get 'user' role
  - [ ] Role stored in session token
  - [ ] Role accessible in API routes

- [ ] **Access Control**
  - [ ] `/api/admin/*` routes check for superadmin
  - [ ] Returns 403 for regular users
  - [ ] Returns 200 for superadmin
  - [ ] `/admin` page checks authentication
  - [ ] Redirects non-admin to `/pricing` or `/dashboard`

### Subscription Management

- [ ] **List All Subscriptions**
  - [ ] Shows all organizations
  - [ ] Shows contact email
  - [ ] Shows plan type (free/standard/enterprise)
  - [ ] Shows status (active/canceled/paused)
  - [ ] Shows billing cycle
  - [ ] Shows registration count vs. limit
  - [ ] Shows start date
  - [ ] Shows end date (if canceled)
  - [ ] Sortable by each column
  - [ ] Filterable by status
  - [ ] Filterable by plan type
  - [ ] Searchable by email/org name

- [ ] **View Subscription Details**
  - [ ] Click row to expand details
  - [ ] Shows full organization info
  - [ ] Shows payment history
  - [ ] Shows coupon used (if any)
  - [ ] Shows Square subscription ID
  - [ ] Shows last payment date
  - [ ] Shows next billing date
  - [ ] Shows lifetime value (LTV)

- [ ] **Cancel Subscription**
  - [ ] "Cancel" button visible for active subs
  - [ ] Confirmation dialog shown
  - [ ] Requires reason input
  - [ ] Calls DELETE API
  - [ ] Updates UI immediately
  - [ ] Shows success message
  - [ ] Logs audit entry
  - [ ] Cancels in Square (if integrated)

- [ ] **Upgrade/Downgrade Subscription**
  - [ ] Admin can change plan manually
  - [ ] Prorated billing calculated
  - [ ] Changes immediately or at next cycle
  - [ ] Notification sent to user
  - [ ] Audit log created

- [ ] **Issue Refund**
  - [ ] Admin can refund full amount
  - [ ] Admin can refund partial amount
  - [ ] Refund reason required
  - [ ] Refund processed in Square
  - [ ] Refund recorded in database
  - [ ] User notified of refund
  - [ ] Subscription status updated if needed

### Organization Management

- [ ] **Manual Organization Creation**
  - [ ] Admin can create org manually
  - [ ] Sets contact info
  - [ ] Sets initial plan
  - [ ] Bypasses payment for special cases
  - [ ] Sends welcome email
  - [ ] Logs audit entry

- [ ] **Organization Suspension**
  - [ ] Admin can suspend org for non-payment
  - [ ] Blocks new registrations
  - [ ] Hides QR codes
  - [ ] Shows "Account Suspended" message
  - [ ] Can be reactivated after payment

- [ ] **Data Export**
  - [ ] Admin can export org data
  - [ ] Includes all registrations
  - [ ] Includes payment history
  - [ ] CSV format
  - [ ] GDPR compliant

### Revenue & Analytics

- [ ] **Revenue Dashboard**
  - [ ] Monthly Recurring Revenue (MRR)
  - [ ] Annual Recurring Revenue (ARR)
  - [ ] Total revenue (lifetime)
  - [ ] Revenue by plan type
  - [ ] New subscriptions this month
  - [ ] Canceled subscriptions this month
  - [ ] Churn rate calculation
  - [ ] Average Revenue Per User (ARPU)

- [ ] **Subscription Analytics**
  - [ ] Total active subscriptions
  - [ ] Breakdown by plan (pie chart)
  - [ ] Growth trend (line chart)
  - [ ] Conversion funnel (pricing → checkout → success)
  - [ ] Failed payment rate
  - [ ] Retention cohorts

- [ ] **Coupon Analytics**
  - [ ] Total discount given
  - [ ] Most popular coupons
  - [ ] Coupon redemption rate
  - [ ] Revenue impact of coupons

### Audit Logging

- [ ] **Logged Actions**
  - [ ] Subscription created
  - [ ] Subscription canceled
  - [ ] Subscription upgraded/downgraded
  - [ ] Payment processed
  - [ ] Payment failed
  - [ ] Refund issued
  - [ ] Coupon created/edited/deactivated
  - [ ] Coupon redeemed
  - [ ] Admin login
  - [ ] Manual organization changes

- [ ] **Audit Log Viewing**
  - [ ] Admin can view full audit log
  - [ ] Filterable by action type
  - [ ] Filterable by user/org
  - [ ] Filterable by date range
  - [ ] Shows timestamp, actor, action, details
  - [ ] Exportable to CSV

---

## 🔗 INTEGRATION TESTS

### Square Webhook Integration

#### Webhook Endpoint Setup

- [ ] **Webhook URL Configuration**
  - [ ] Production: `https://blessbox.org/api/payment/webhook`
  - [ ] Development: Use ngrok for local testing
  - [ ] Configured in Square Dashboard
  - [ ] SSL certificate valid
  - [ ] Responds within 10 seconds

- [ ] **Signature Validation**
  - [ ] Webhook signature header present
  - [ ] Signature validated using Square SDK
  - [ ] Invalid signature returns 401
  - [ ] Signature secret stored securely
  - [ ] Logging for failed validations

#### Subscription Events

- [ ] **subscription.created**
  - [ ] Webhook received
  - [ ] Subscription ID extracted
  - [ ] Database updated with Square ID
  - [ ] Status set to ACTIVE
  - [ ] User notified
  - [ ] 200 OK returned

- [ ] **subscription.updated**
  - [ ] Plan change reflected in database
  - [ ] Billing cycle change handled
  - [ ] Amount change recorded
  - [ ] User notified of changes

- [ ] **subscription.canceled**
  - [ ] Status updated to CANCELED
  - [ ] End date set
  - [ ] User notified
  - [ ] Access downgraded after grace period
  - [ ] Retention email sent

#### Payment Events

- [ ] **payment.created**
  - [ ] Payment recorded in database
  - [ ] Amount verified
  - [ ] Receipt sent to user

- [ ] **payment.failed**
  - [ ] Failure recorded
  - [ ] Retry logic triggered
  - [ ] User notified
  - [ ] Dunning email sent
  - [ ] Subscription paused after X failures

- [ ] **refund.created**
  - [ ] Refund recorded in database
  - [ ] Subscription status updated
  - [ ] User notified

#### Error Handling

- [ ] **Webhook Failures**
  - [ ] Network errors logged
  - [ ] Retries with exponential backoff
  - [ ] Dead letter queue for permanent failures
  - [ ] Alert sent to admin after 3 failures

- [ ] **Duplicate Webhooks**
  - [ ] Idempotency key checked
  - [ ] Duplicate webhooks ignored
  - [ ] No double-processing

### Database Transaction Tests

- [ ] **Payment → Subscription Creation**
  - [ ] Atomic transaction
  - [ ] Rollback on payment failure
  - [ ] Rollback on subscription creation failure
  - [ ] No orphaned records

- [ ] **Subscription Cancellation**
  - [ ] Updates subscription_plans table
  - [ ] Updates Square subscription
  - [ ] Creates audit log
  - [ ] All succeed or all rollback

### Third-Party Service Mocking

- [ ] **Square API Mocks**
  - [ ] Mock successful payment
  - [ ] Mock failed payment
  - [ ] Mock network timeout
  - [ ] Mock rate limiting
  - [ ] Mock service unavailable

- [ ] **Database Mocks**
  - [ ] Mock successful insert
  - [ ] Mock constraint violation
  - [ ] Mock connection failure

---

## 🎭 END-TO-END TESTS

### Complete User Journey (Playwright)

#### Happy Path: Free → Standard Upgrade

- [ ] **Step 1: Sign Up (Free Plan)**
  - [ ] Visit `/pricing`
  - [ ] Click "Get Started" on Free plan
  - [ ] No payment required
  - [ ] Redirected to `/dashboard`
  - [ ] Free plan shown
  - [ ] Registration limit: 100

- [ ] **Step 2: Hit Registration Limit**
  - [ ] Create 100 registrations (simulated)
  - [ ] Attempt 101st registration
  - [ ] Error shown: "Registration limit reached"
  - [ ] Upgrade prompt displayed
  - [ ] Click "Upgrade Now" button

- [ ] **Step 3: Upgrade to Standard**
  - [ ] Redirected to `/pricing`
  - [ ] Standard plan highlighted
  - [ ] Click "Subscribe" on Standard
  - [ ] Redirected to `/checkout?plan=standard`
  - [ ] Checkout page loads
  - [ ] Square payment form visible

- [ ] **Step 4: Apply Coupon**
  - [ ] Enter coupon code "WELCOME25"
  - [ ] Click "Apply Coupon"
  - [ ] Discount applied: $19 → $14.25
  - [ ] Discount shown in UI
  - [ ] Total updated

- [ ] **Step 5: Enter Payment**
  - [ ] Enter test card: 4111 1111 1111 1111
  - [ ] CVV: 123
  - [ ] ZIP: 12345
  - [ ] Expiration: 12/25
  - [ ] Card tokenized by Square
  - [ ] Click "Pay and Subscribe"

- [ ] **Step 6: Payment Processing**
  - [ ] Loading indicator shown
  - [ ] Payment processed
  - [ ] Subscription created
  - [ ] Redirected to `/dashboard`

- [ ] **Step 7: Verify Upgrade**
  - [ ] Dashboard shows Standard plan
  - [ ] Billing: $14.25/month
  - [ ] Limit: 5,000
  - [ ] Coupon shown: WELCOME25
  - [ ] Next billing date shown

#### Admin Journey

- [ ] **Step 1: Admin Login**
  - [ ] Visit `/`
  - [ ] Sign in as `admin@blessbox.app`
  - [ ] Password: `BlessBox2024!Admin`
  - [ ] Session shows role=superadmin

- [ ] **Step 2: View Subscriptions**
  - [ ] Visit `/admin`
  - [ ] Table of all subscriptions shown
  - [ ] Test user's subscription visible
  - [ ] Plan: Standard
  - [ ] Status: Active

- [ ] **Step 3: View Details**
  - [ ] Click on test user's subscription
  - [ ] Details expanded
  - [ ] Payment history shown
  - [ ] Coupon: WELCOME25 (25% off)
  - [ ] Discounted amount: $14.25

- [ ] **Step 4: Cancel Subscription**
  - [ ] Click "Cancel" button
  - [ ] Confirmation dialog shown
  - [ ] Enter reason: "Testing cancelation flow"
  - [ ] Click "Confirm Cancel"
  - [ ] Status updated to Canceled
  - [ ] End date set to now

- [ ] **Step 5: Verify Cancelation**
  - [ ] User dashboard shows Canceled
  - [ ] No next billing date
  - [ ] Access valid until end date
  - [ ] Downgrade prompt shown

### Error Scenarios

- [ ] **Payment Declined**
  - [ ] Use test card: 4000 0000 0000 0002
  - [ ] Payment fails
  - [ ] Error message shown
  - [ ] User can retry
  - [ ] Subscription not created

- [ ] **Expired Coupon**
  - [ ] Enter expired coupon code
  - [ ] Error: "Coupon has expired"
  - [ ] Discount not applied
  - [ ] Can proceed without coupon

- [ ] **Network Timeout**
  - [ ] Simulate network failure during payment
  - [ ] Loading state doesn't hang
  - [ ] Error message shown
  - [ ] User can retry

- [ ] **Concurrent Subscription Creation**
  - [ ] User clicks "Subscribe" multiple times quickly
  - [ ] Only one subscription created
  - [ ] Duplicate prevented
  - [ ] No double-charge

### Cross-Browser Testing

- [ ] **Chrome** (latest)
  - [ ] Full flow works
  - [ ] Square form renders
  - [ ] Payment processes

- [ ] **Firefox** (latest)
  - [ ] Full flow works
  - [ ] Square form renders
  - [ ] Payment processes

- [ ] **Safari** (latest)
  - [ ] Full flow works
  - [ ] Square form renders
  - [ ] Payment processes

- [ ] **Mobile Safari** (iOS)
  - [ ] Full flow works on iPhone
  - [ ] Touch interactions work
  - [ ] Forms are mobile-friendly

- [ ] **Chrome Mobile** (Android)
  - [ ] Full flow works on Android
  - [ ] Touch interactions work
  - [ ] Forms are mobile-friendly

---

## 🔒 SECURITY & EDGE CASES

### Authentication & Authorization

- [ ] **Session Security**
  - [ ] JWT secret is strong (32+ chars)
  - [ ] JWT secret not in version control
  - [ ] Session timeout configured (1 hour default)
  - [ ] Refresh token strategy
  - [ ] Session invalidated on logout

- [ ] **Admin Access**
  - [ ] Super admin email enforced
  - [ ] No hardcoded admin passwords in code
  - [ ] Admin actions logged
  - [ ] Multi-factor authentication (future)

- [ ] **API Security**
  - [ ] Rate limiting on all endpoints
  - [ ] CSRF protection enabled
  - [ ] CORS configured properly
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] XSS prevention (input sanitization)

### Payment Security

- [ ] **PCI Compliance**
  - [ ] No card numbers stored in database
  - [ ] No CVV stored anywhere
  - [ ] Only Square tokens stored
  - [ ] Square handles sensitive data
  - [ ] SSL/TLS enforced

- [ ] **Webhook Security**
  - [ ] Signature validation enforced
  - [ ] Replay attack prevention
  - [ ] IP whitelist (optional)
  - [ ] Logs all webhook attempts

### Data Privacy

- [ ] **GDPR Compliance**
  - [ ] User can export their data
  - [ ] User can delete their account
  - [ ] Payment data retained per regulations
  - [ ] Privacy policy updated
  - [ ] Cookie consent banner

- [ ] **Audit Trail**
  - [ ] All sensitive actions logged
  - [ ] Logs immutable (append-only)
  - [ ] Logs retained for 7 years
  - [ ] PII hashed in logs

### Edge Cases

- [ ] **Duplicate Payment Prevention**
  - [ ] Idempotency keys used
  - [ ] Button disabled after click
  - [ ] Server-side duplicate check

- [ ] **Plan Limit Edge Cases**
  - [ ] Exactly at limit (100/100)
  - [ ] One over limit (101/100)
  - [ ] Limit change during active subscription
  - [ ] Downgrade from 1000 registrations to 100 limit

- [ ] **Timezone Handling**
  - [ ] All dates in UTC
  - [ ] Display in user's timezone
  - [ ] Billing cycle respects timezone
  - [ ] Coupon expiration at midnight UTC

- [ ] **Currency Edge Cases**
  - [ ] USD only initially
  - [ ] Future: Multi-currency support
  - [ ] Exchange rate handling
  - [ ] Currency symbol display

- [ ] **Concurrent Operations**
  - [ ] Two admins cancel same subscription
  - [ ] User upgrades while admin changes plan
  - [ ] Payment processes during subscription cancel
  - [ ] Database locking/transactions prevent conflicts

---

## ⚡ PERFORMANCE & SCALE TESTS

### Load Testing

- [ ] **Checkout Page**
  - [ ] 100 concurrent users
  - [ ] Response time < 500ms
  - [ ] No errors
  - [ ] Square SDK loads quickly

- [ ] **Payment Processing**
  - [ ] 50 concurrent payments
  - [ ] Each completes within 5 seconds
  - [ ] Success rate > 99%
  - [ ] No database deadlocks

- [ ] **Admin Dashboard**
  - [ ] 10,000 subscriptions loaded
  - [ ] Pagination performs well
  - [ ] Search is instant (< 100ms)
  - [ ] Filters apply quickly

### Database Performance

- [ ] **Query Optimization**
  - [ ] All queries use indexes
  - [ ] No N+1 query problems
  - [ ] Joins optimized
  - [ ] Explain plan analyzed

- [ ] **Connection Pooling**
  - [ ] Max connections configured
  - [ ] Connection reuse
  - [ ] No connection leaks
  - [ ] Graceful connection closing

### Caching Strategy

- [ ] **Subscription Data**
  - [ ] Active subscription cached
  - [ ] Cache invalidated on update
  - [ ] TTL: 5 minutes
  - [ ] Redis or in-memory cache

- [ ] **Coupon Validation**
  - [ ] Valid coupons cached
  - [ ] TTL: 1 minute
  - [ ] Cache invalidated on edit/deactivate

---

## 🚀 PRODUCTION READINESS

### Pre-Launch Checklist

#### Environment Configuration

- [ ] **Production Environment Variables Set**
  - [ ] `SQUARE_APPLICATION_ID` (production)
  - [ ] `SQUARE_ACCESS_TOKEN` (production)
  - [ ] `SQUARE_ENVIRONMENT=production`
  - [ ] `NEXTAUTH_SECRET` (strong, unique)
  - [ ] `TURSO_DATABASE_URL` (production)
  - [ ] `TURSO_AUTH_TOKEN` (production)
  - [ ] `SUPERADMIN_EMAIL` configured
  - [ ] All secrets in Vercel (not .env file)

#### Square Production Setup

- [ ] **Square Account Verified**
  - [ ] Business information complete
  - [ ] Bank account linked
  - [ ] Tax information submitted
  - [ ] Account approved for payments

- [ ] **Production Catalog**
  - [ ] All plans created in production
  - [ ] Prices match staging
  - [ ] Plan IDs documented
  - [ ] Test subscription created and canceled

- [ ] **Webhook URLs**
  - [ ] Production webhook URL set
  - [ ] SSL certificate valid
  - [ ] Webhook events subscribed
  - [ ] Test webhook sent and received

#### Database

- [ ] **Production Database**
  - [ ] Turso production instance created
  - [ ] Schema migrated
  - [ ] Indexes created
  - [ ] Backup strategy configured
  - [ ] Point-in-time recovery enabled

- [ ] **Data Migration**
  - [ ] Test data NOT in production
  - [ ] Coupon codes imported
  - [ ] Initial admin user created

#### Monitoring & Alerts

- [ ] **Error Tracking**
  - [ ] Sentry or similar configured
  - [ ] Source maps uploaded
  - [ ] Alerts for payment failures
  - [ ] Alerts for webhook failures

- [ ] **Performance Monitoring**
  - [ ] APM tool configured (Vercel Analytics)
  - [ ] Key metrics tracked (checkout conversion)
  - [ ] Slow query alerts
  - [ ] Uptime monitoring

- [ ] **Business Metrics**
  - [ ] MRR tracking
  - [ ] Churn rate calculation
  - [ ] Failed payment rate
  - [ ] Coupon usage rate

#### Legal & Compliance

- [ ] **Terms of Service**
  - [ ] Subscription terms clear
  - [ ] Refund policy stated
  - [ ] Cancellation policy stated
  - [ ] Auto-renewal disclosure

- [ ] **Privacy Policy**
  - [ ] Payment data handling explained
  - [ ] Square mentioned as processor
  - [ ] Data retention policy
  - [ ] GDPR compliance

- [ ] **Email Templates**
  - [ ] Payment receipt
  - [ ] Subscription confirmation
  - [ ] Subscription canceled
  - [ ] Payment failed
  - [ ] Refund processed
  - [ ] Welcome email with plan details

#### Support & Documentation

- [ ] **User Documentation**
  - [ ] How to subscribe
  - [ ] How to upgrade/downgrade
  - [ ] How to cancel
  - [ ] How to use coupons
  - [ ] FAQ

- [ ] **Admin Documentation**
  - [ ] How to view subscriptions
  - [ ] How to issue refunds
  - [ ] How to create coupons
  - [ ] How to handle disputes

### Launch Day Checklist

- [ ] **Pre-Launch**
  - [ ] All tests passing
  - [ ] Production deployment successful
  - [ ] Smoke tests in production
  - [ ] Team briefed
  - [ ] Support ready

- [ ] **Launch**
  - [ ] Enable Square production mode
  - [ ] Announce to users
  - [ ] Monitor error rates
  - [ ] Monitor payment success rate
  - [ ] Monitor performance

- [ ] **Post-Launch (24 hours)**
  - [ ] First real payment successful
  - [ ] Webhooks working
  - [ ] No critical errors
  - [ ] User feedback collected
  - [ ] Revenue tracking confirmed

### Ongoing Maintenance

- [ ] **Weekly**
  - [ ] Review failed payments
  - [ ] Review churn
  - [ ] Check coupon usage
  - [ ] Monitor conversion rate

- [ ] **Monthly**
  - [ ] Reconcile Square revenue with database
  - [ ] Review most popular plans
  - [ ] Analyze downgrades/cancellations
  - [ ] Review and deactivate old coupons
  - [ ] Generate revenue report for stakeholders

---

## 📊 TEST EXECUTION TRACKING

Use this table to track progress:

| Category | Tests | Passing | Failing | Skipped | Coverage |
|----------|-------|---------|---------|---------|----------|
| Unit Tests - Subscriptions | 0/13 | 0 | 0 | 13 | 0% |
| Unit Tests - Coupons | 0/13 | 0 | 0 | 13 | 0% |
| Unit Tests - Payments | 0/11 | 0 | 0 | 11 | 0% |
| Unit Tests - Admin | 0/10 | 0 | 0 | 10 | 0% |
| Integration - API Routes | 0/25 | 0 | 0 | 25 | 0% |
| Integration - Square SDK | 0/20 | 0 | 0 | 20 | 0% |
| Integration - Webhooks | 0/15 | 0 | 0 | 15 | 0% |
| E2E - User Journey | 0/7 | 0 | 0 | 7 | 0% |
| E2E - Admin Journey | 0/5 | 0 | 0 | 5 | 0% |
| E2E - Error Scenarios | 0/4 | 0 | 0 | 4 | 0% |
| Security Tests | 0/15 | 0 | 0 | 15 | 0% |
| Performance Tests | 0/10 | 0 | 0 | 10 | 0% |
| **TOTAL** | **0/148** | **0** | **0** | **148** | **0%** |

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

Follow this order for maximum efficiency:

### Phase 1: Foundation (Week 1)
1. ✅ Database schema for coupons
2. ✅ ICouponService interface (TDD)
3. ✅ Coupon service unit tests (write first!)
4. ✅ Coupon service implementation
5. ✅ Coupon validation API

### Phase 2: Square Integration (Week 2)
6. ✅ Square Web Payments SDK on checkout page
7. ✅ Card tokenization
8. ✅ Payment processing with Square SDK
9. ✅ Customer creation in Square
10. ✅ Subscription creation in Square
11. ✅ Store Square IDs in database

### Phase 3: Webhooks (Week 3)
12. ✅ Webhook endpoint `/api/payment/webhook`
13. ✅ Signature validation
14. ✅ Handle subscription events
15. ✅ Handle payment events
16. ✅ Error handling and retries

### Phase 4: Admin Features (Week 4)
17. ✅ Admin coupon creation UI
18. ✅ Admin coupon management
19. ✅ Refund processing
20. ✅ Revenue analytics dashboard
21. ✅ Audit logging

### Phase 5: Testing & Polish (Week 5)
22. ✅ Integration tests
23. ✅ E2E tests with Playwright
24. ✅ Security audit
25. ✅ Performance testing
26. ✅ Documentation

### Phase 6: Production (Week 6)
27. ✅ Production environment setup
28. ✅ Staging testing
29. ✅ Beta testing with real users
30. ✅ Launch! 🚀

---

## 💡 FINAL RECOMMENDATIONS

### Critical Success Factors

1. **TDD is Non-Negotiable**
   - Write tests BEFORE implementation
   - Maintain 90%+ coverage
   - No skipping tests for "speed"

2. **ISP Compliance**
   - Keep interfaces focused
   - Regularly review for violations
   - Refactor when interfaces grow too large

3. **Square Sandbox First**
   - Test everything in sandbox
   - Don't rush to production
   - Use all test cards scenarios

4. **Security is Priority #1**
   - Never store card data
   - Validate all webhook signatures
   - Rate limit all endpoints
   - Log everything security-related

5. **User Experience Matters**
   - Clear error messages
   - Fast checkout (< 5 seconds)
   - Mobile-friendly forms
   - Transparent pricing (no surprises)

### Common Pitfalls to Avoid

1. ❌ Storing card numbers in database
2. ❌ Skipping webhook signature validation
3. ❌ Not handling failed payments gracefully
4. ❌ Forgetting to test edge cases
5. ❌ Mixing payment logic with business logic (ISP violation)
6. ❌ No audit logging for admin actions
7. ❌ Hardcoding plan IDs instead of using config
8. ❌ Not testing coupon expiration edge cases
9. ❌ Forgetting to cancel in Square when canceling locally
10. ❌ No reconciliation between Square and database

### Success Metrics

Track these KPIs after launch:

- **Payment Success Rate**: > 98%
- **Checkout Abandonment**: < 20%
- **Failed Payment Recovery**: > 50%
- **Support Tickets (payment)**: < 5% of transactions
- **Average Checkout Time**: < 30 seconds
- **Coupon Redemption Rate**: Track and optimize
- **MRR Growth**: Month-over-month
- **Churn Rate**: < 5% monthly

---

## 🎊 CONCLUSION

This checklist represents a **comprehensive, production-ready subscription and payment system** following **TDD** and **ISP** principles, integrated with **Square Developer sandbox**, and featuring a **full coupon system** with **complete admin control**.

**Estimated Total Effort**: 6 weeks (1 developer)  
**Total Test Cases**: 148+  
**Lines of Code**: ~3,000 (not counting tests)  
**Test Lines of Code**: ~5,000

**You are now equipped to build the happiest, most robust payment system in the universe!** 🚀✨

---

*Built with ORGASMIC JOY by the HAPPIEST Software Architect* 💖

Last Updated: October 28, 2025


