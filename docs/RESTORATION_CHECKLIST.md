# BlessBox Authentication Restoration Checklist

**Created:** December 29, 2025
**Purpose:** Restore 6-digit email verification codes, remove 6-digit code, and fix subscriptions

---

## Executive Summary

### Current State (Broken)
- ❌ 6-digit code authentication triggers Chrome "Dangerous site" warnings
- ❌ React Error #310 on organization setup page (FIXED in latest commit)
- ❌ Users cannot sign in with previously used email
- ❌ Users cannot start new registrations
- ❌ "Forbidden" error on QR code generation (membership not created)
- ❌ Subscriptions not linked to user accounts properly

### Target State (Restore)
- ✅ **6-digit email verification codes** for identity verification
- ✅ **Standalone session management** (not dependent on NextAuth 6-digit code)
- ✅ **Email delivery via SendGrid** (6-digit codes)
- ✅ **Functional subscription system** linked to organizations
- ✅ **Complete onboarding flow**: Org Setup → Email Verify (6-digit) → Form Builder → QR Config

---

## Phase 1: Remove 6-digit code Authentication

### 1.1 Disable NextAuth Email Provider
- [ ] Remove `EmailProvider` from `app/api/auth/[...nextauth]/authOptions.ts`
- [ ] Remove `sendVerificationRequest` callback that sends 6-digit codes
- [ ] Keep NextAuth for session management only (JWT strategy)
- [ ] Remove `sendAuthMagicLinkEmail` usage from EmailService

### 1.2 Remove 6-digit code Login UI
- [ ] Update `app/login/login-client.tsx` to use 6-digit code verification
- [ ] Remove "Email me a sign-in link" messaging
- [ ] Add "Send verification code" → "Enter 6-digit code" flow

### 1.3 Clean Up Related Files
- [ ] Archive `app/api/test/magic-link-url/route.ts` (test endpoint)
- [ ] Archive `app/api/debug-auth-url/route.ts` (debug endpoint)
- [ ] Update `EmailService.sendAuthMagicLinkEmail` → remove or repurpose

---

## Phase 2: Restore 6-Digit Email Verification

### 2.1 Verify Existing Services (Already in Place)
- [x] `lib/services/VerificationService.ts` - generates and verifies 6-digit codes
- [x] `lib/interfaces/IVerificationService.ts` - ISP interface
- [x] `/api/onboarding/send-verification` - sends verification code
- [x] `/api/onboarding/verify-code` - verifies code and creates user/membership

### 2.2 Update Onboarding Flow
- [ ] Remove auth redirect from `app/onboarding/organization-setup/page.tsx`
- [ ] Allow unauthenticated users to start organization setup
- [ ] After org setup → navigate to email verification step
- [ ] Email verification page sends 6-digit code (already implemented)
- [ ] After verification → create session and proceed to form builder

### 2.3 Update Email Verification Page
- [ ] Remove 6-digit code redirect from `app/onboarding/email-verification/page.tsx`
- [ ] Restore 6-digit code entry UI (already exists)
- [ ] After successful verification:
  - Create user account (via `/api/onboarding/verify-code`)
  - Create membership to organization
  - Set session cookie
  - Navigate to form builder

### 2.4 Create New Login Flow with 6-Digit Codes
- [ ] Create new login API: `POST /api/auth/login`
  - Accept email
  - Send 6-digit code via VerificationService
  - Return success
- [ ] Create verify login API: `POST /api/auth/verify-login`
  - Accept email + code
  - Verify code
  - Create/update user record
  - Issue JWT session token
  - Return session info
- [ ] Update login page to use new APIs

---

## Phase 3: Session Management Without 6-digit code

### 3.1 JWT Session Strategy
- [ ] Keep NextAuth JWT strategy in `authOptions.ts`
- [ ] Remove Email provider
- [ ] Add custom credentials provider OR custom session issuance

### 3.2 Custom Session Issuance (Option A - Recommended)
Create a simple session system that:
- [ ] Issues JWT tokens after 6-digit verification
- [ ] Stores sessions in DB (optional) or uses stateless JWT
- [ ] Works with existing `useSession()` hooks via NextAuth adapter

### 3.3 Update Protected Routes
- [ ] `/api/onboarding/save-organization` - allow without session (creates org)
- [ ] `/api/onboarding/save-form-config` - require session + membership
- [ ] `/api/onboarding/generate-qr` - require session + membership
- [ ] Dashboard routes - require session

---

## Phase 4: Fix Membership and Authorization

### 4.1 Organization Creation Flow
- [ ] `POST /api/onboarding/save-organization`:
  - No session required (new user)
  - Create organization
  - Store org ID in localStorage for onboarding continuation
  - Do NOT create membership yet (user not verified)

### 4.2 Email Verification Creates Membership
- [ ] `POST /api/onboarding/verify-code`:
  - Verify 6-digit code
  - Create/update user record
  - Create membership (user → organization as admin)
  - Issue session token
  - Set `bb_active_org_id` cookie

### 4.3 Subsequent Onboarding Steps
- [ ] `POST /api/onboarding/save-form-config`:
  - Require valid session
  - Verify membership exists
  - Save form config
- [ ] `POST /api/onboarding/generate-qr`:
  - Require valid session
  - Verify membership exists
  - Generate QR codes

---

## Phase 5: Email Delivery (SendGrid)

### 5.1 Verify SendGrid Configuration
- [ ] Check Vercel environment variables:
  - `SENDGRID_API_KEY` - must be valid
  - `SENDGRID_FROM_EMAIL` - must be verified sender
- [ ] Test email delivery: `npm run test:email`

### 5.2 Email Templates
- [ ] Verification code email (already in VerificationService)
- [ ] Registration confirmation email
- [ ] Subscription confirmation email

### 5.3 Email Health Check
- [ ] Use `/api/system/email-health` to verify configuration
- [ ] Ensure production emails are delivered

---

## Phase 6: Subscriptions

### 6.1 Verify Subscription Schema
- [ ] Check `subscription_plans` table exists
- [ ] Verify plan types: free, standard, enterprise
- [ ] Verify pricing: 0, 1900, 9900 cents

### 6.2 Subscription Flow
- [ ] New organizations start on `free` plan (100 registrations)
- [ ] Upgrade via Square payment → create `standard` or `enterprise` subscription
- [ ] Downgrade/cancel via `/api/subscription/cancel`

### 6.3 Usage Limits
- [ ] `UsageLimitChecker` enforces registration limits per plan
- [ ] Display remaining registrations in dashboard

---

## Phase 7: Testing

### 7.1 Local Testing
```bash
# Start dev server
npm run dev

# Test email verification flow
1. Go to /onboarding/organization-setup
2. Fill form, submit
3. Should navigate to /onboarding/email-verification
4. Enter email, click "Send Code"
5. Check console/email for 6-digit code
6. Enter code, verify
7. Should navigate to /onboarding/form-builder
```

### 7.2 E2E Tests
```bash
# Run onboarding E2E tests
npm run test:e2e:local -- tests/e2e/onboarding-flow.spec.ts

# Run full QA suite
npm run test:qa:local
```

### 7.3 Production Verification
```bash
# After deploy, verify:
curl -X POST https://www.blessbox.org/api/system/email-health \
  -H "X-Diagnostics-Secret: $DIAGNOSTICS_SECRET"

# Test email delivery
curl -X POST https://www.blessbox.org/api/test-email-send \
  -H "Content-Type: application/json" \
  -d '{"to": "your@email.com"}'
```

---

## Implementation Order

### Step 1: Fix Critical Bugs First
1. ✅ Fix React Error #310 (hooks ordering)
2. [ ] Remove 6-digit code redirects from onboarding pages
3. [ ] Allow unauthenticated org setup

### Step 2: Restore 6-Digit Code Flow
4. [ ] Update login page to use 6-digit codes
5. [ ] Update email verification page
6. [ ] Ensure verification creates membership

### Step 3: Update Auth Configuration
7. [ ] Simplify authOptions.ts
8. [ ] Add session issuance after code verification
9. [ ] Test session persistence

### Step 4: Test and Deploy
10. [ ] Test locally
11. [ ] Run E2E tests
12. [ ] Deploy to production
13. [ ] Verify email delivery
14. [ ] Verify complete onboarding flow

---

## Files to Modify

### High Priority
| File | Action |
|------|--------|
| `app/api/auth/[...nextauth]/authOptions.ts` | Remove EmailProvider |
| `app/login/login-client.tsx` | Change to 6-digit code UI |
| `app/onboarding/organization-setup/page.tsx` | Remove auth requirement |
| `app/onboarding/email-verification/page.tsx` | Remove 6-digit code redirect |
| `app/api/onboarding/verify-code/route.ts` | Ensure session issuance |

### Medium Priority
| File | Action |
|------|--------|
| `app/api/onboarding/save-organization/route.ts` | Remove session requirement |
| `lib/services/EmailService.ts` | Remove 6-digit code method |
| `app/api/auth/login/route.ts` | Create new (6-digit code) |
| `app/api/auth/verify-login/route.ts` | Create new (verify + session) |

### Low Priority (Cleanup)
| File | Action |
|------|--------|
| `app/api/test/magic-link-url/route.ts` | Archive/remove |
| `app/api/debug-auth-url/route.ts` | Archive/remove |
| `docs/QA_TESTING_GUIDE.md` | Update for 6-digit codes |

---

## Rollback Plan

If issues arise:
1. Revert to previous commit
2. Restore 6-digit code configuration
3. Re-deploy

---

## Success Criteria

- [ ] User can start onboarding without being logged in
- [ ] User enters email, receives 6-digit code
- [ ] User enters code, gets verified and logged in
- [ ] User completes form builder and QR configuration
- [ ] User can log in again with same email (via 6-digit code)
- [ ] Subscriptions display correctly in dashboard
- [ ] No "Dangerous site" warnings from Chrome

---

**ROLE: architect STRICT=true**

