# Production Readiness Checklist - Detailed Action Items

**Last Updated:** Based on production E2E test results (134 tests: 106 passed, 23 failed, 5 skipped)  
**Status:** Deployed to Vercel, but critical onboarding gaps remain

---

## 🚨 CRITICAL: Must Fix Before Production Use

### 1. Fix `/dashboard/registrations` Infinite Spinner (User-Reported Regression)

**Problem:**  
- When unauthenticated, `/dashboard/registrations` shows a loading spinner forever
- Test: `tests/e2e/user-reported-regressions.spec.ts:31`

**Root Cause:**  
- Page doesn't handle unauthenticated state properly
- Missing error boundary or redirect logic

**Action Required:**
```typescript
// File: app/dashboard/registrations/page.tsx
// Add proper auth check and error handling
```

**Steps:**
1. Open `app/dashboard/registrations/page.tsx`
2. Add `useSession()` check at component start
3. If `status === 'unauthenticated'`, redirect to `/login?next=/dashboard/registrations`
4. If `status === 'loading'`, show loading state (not infinite spinner)
5. Only fetch registrations when `status === 'authenticated'`

**Test:**  
```bash
npm run test:e2e:production -- tests/e2e/user-reported-regressions.spec.ts:31
```

---

### 2. Fix Onboarding Organization Setup Form Not Visible

**Problem:**  
- Onboarding org setup form not visible (likely auth redirect)
- Tests failing: `onboarding-flow.spec.ts:32`, `blessbox-full-flow.spec.ts:183`

**Root Cause:**  
- Page redirects to `/login` but form never appears after auth
- Missing proper session restoration after 6-digit code login

**Action Required:**
```typescript
// File: app/onboarding/organization-setup/page.tsx
// Ensure form is visible after authentication
```

**Steps:**
1. Check `app/onboarding/organization-setup/page.tsx`
2. Verify `useSession()` logic doesn't block form rendering
3. Ensure `next` parameter is preserved: `/login?next=/onboarding/organization-setup`
4. After 6-digit code login, verify redirect back to org setup page
5. Add loading state while checking auth (don't hide form prematurely)

**Test:**  
```bash
npm run test:e2e:production -- tests/e2e/onboarding-flow.spec.ts:32
```

---

### 3. Implement Membership Creation During Onboarding (P0)

**Problem:**  
- `POST /api/onboarding/save-organization` creates org but **NOT** membership
- Dashboard can't find user's organization → empty dashboard
- This is why "QR codes exist but registrations don't appear"

**Action Required:**
```typescript
// File: app/api/onboarding/save-organization/route.ts
// Add membership creation after org creation
```

**Steps:**

1. **Create MembershipService** (if not exists):
   ```bash
   # Create lib/services/MembershipService.ts
   # Create lib/interfaces/IMembershipService.ts
   ```

2. **Update `POST /api/onboarding/save-organization`:**
   ```typescript
   // After organization creation:
   const userId = session.user.id;
   const membershipService = new MembershipService();
   await membershipService.ensureMembership(userId, organization.id, 'admin');
   ```

3. **Set active org context:**
   ```typescript
   // After membership creation:
   const response = NextResponse.json({ success: true, organization: {...} });
   response.cookies.set('bb_active_org_id', organization.id, {
     path: '/',
     httpOnly: true,
     sameSite: 'lax',
     secure: process.env.NODE_ENV === 'production',
     maxAge: 60 * 60 * 24 * 30, // 30 days
   });
   return response;
   ```

**Test:**  
```bash
npm run test  # Unit tests
npm run test:e2e:production -- tests/e2e/onboarding-flow.spec.ts
```

---

### 4. Add Auth + Membership Checks to Onboarding Endpoints (P0 Security)

**Problem:**  
- `POST /api/onboarding/save-form-config` - **NO AUTH CHECK**
- `POST /api/onboarding/generate-qr` - **NO AUTH CHECK**
- Anyone can create form configs/QR codes for any organization

**Action Required:**

**File 1: `app/api/onboarding/save-form-config/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  // 1. Require auth
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Require membership
  const { organizationId } = await request.json();
  const membershipService = new MembershipService();
  const isMember = await membershipService.isMember(session.user.id, organizationId);
  if (!isMember) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // 3. Continue with existing logic...
}
```

**File 2: `app/api/onboarding/generate-qr/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  // Same pattern: auth check → membership check → proceed
}
```

**Test:**  
```bash
# Test unauthorized access returns 401/403
curl -X POST https://www.blessbox.org/api/onboarding/save-form-config \
  -H "Content-Type: application/json" \
  -d '{"organizationId":"test"}'
# Should return 401 Unauthorized
```

---

## 🔧 CONFIGURATION: Environment Variables for Production

### Required Vercel Environment Variables

**Set these in Vercel Dashboard → Settings → Environment Variables:**

```bash
# Core Auth (REQUIRED)
NEXTAUTH_URL=https://www.blessbox.org
NEXTAUTH_SECRET=<generate-strong-random-string-32-chars-min>
PUBLIC_APP_URL=https://www.blessbox.org

# Database (REQUIRED)
TURSO_DATABASE_URL=<your-turso-connection-string>
TURSO_AUTH_TOKEN=<your-turso-auth-token>

# Email (REQUIRED)
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=<verified-sender@yourdomain.com>
EMAIL_REPLY_TO=<optional-reply-to@yourdomain.com>

# Payments (REQUIRED)
SQUARE_ACCESS_TOKEN=<square-access-token>
SQUARE_LOCATION_ID=<square-location-id>
SQUARE_ENVIRONMENT=production

# Production Testing (OPTIONAL - for E2E tests)
PROD_TEST_SEED_SECRET=<strong-random-secret-for-qa-endpoints>
DIAGNOSTICS_SECRET=<secret-for-system-endpoints>

# Optional
NODE_ENV=production
ENABLE_DEBUG_LOGGING=false
```

### How to Set in Vercel:

1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Add each variable above
3. **Important:** Set `NEXTAUTH_URL` and `PUBLIC_APP_URL` to `https://www.blessbox.org` (no trailing slash)
4. **Important:** `NEXTAUTH_SECRET` must be a strong random string (32+ characters)
   ```bash
   # Generate one:
   openssl rand -base64 32
   ```
5. After adding variables, **redeploy**:
   ```bash
   vercel --prod --yes
   ```

---

## 📋 ONBOARDING CHECKLIST: Complete Implementation

### Phase 1: Create Interfaces (ISP Compliance)

**1.1 Create `lib/interfaces/IMembershipService.ts`:**
```typescript
export interface IMembershipService {
  ensureMembership(userId: string, organizationId: string, role?: string): Promise<void>;
  isMember(userId: string, organizationId: string): Promise<boolean>;
  listOrganizationsForUser(userId: string): Promise<Array<{ id: string }>>;
}
```

**1.2 Create `lib/interfaces/IActiveOrganizationContext.ts`:**
```typescript
export interface IActiveOrganizationReader {
  getActiveOrganizationIdForSession(session: Session): Promise<string | null>;
}

export interface IActiveOrganizationWriter {
  setActiveOrganizationIdForSession(session: Session, orgId: string): Promise<void>;
}
```

### Phase 2: Write Unit Tests First (TDD)

**2.1 Create `lib/services/MembershipService.test.ts`:**
- Test `ensureMembership` idempotency
- Test `isMember` returns true/false
- Test `listOrganizationsForUser` ordering

**2.2 Create `lib/services/ActiveOrganizationContext.test.ts`:**
- Test set/get active org id
- Test rejects setting org if no membership

**Run tests:**
```bash
npm run test
```

### Phase 3: Implement Services

**3.1 Create `lib/services/MembershipService.ts`:**
```typescript
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { IMembershipService } from '@/lib/interfaces/IMembershipService';

export class MembershipService implements IMembershipService {
  private db = getDbClient();

  async ensureMembership(userId: string, organizationId: string, role: string = 'admin'): Promise<void> {
    const now = new Date().toISOString();
    await this.db.execute({
      sql: `
        INSERT INTO memberships (id, user_id, organization_id, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, organization_id) DO UPDATE SET updated_at = excluded.updated_at
      `,
      args: [uuidv4(), userId, organizationId, role, now, now],
    });
  }

  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const result = await this.db.execute({
      sql: `SELECT id FROM memberships WHERE user_id = ? AND organization_id = ? LIMIT 1`,
      args: [userId, organizationId],
    });
    return result.rows.length > 0;
  }

  async listOrganizationsForUser(userId: string): Promise<Array<{ id: string }>> {
    const result = await this.db.execute({
      sql: `SELECT organization_id as id FROM memberships WHERE user_id = ? ORDER BY created_at DESC`,
      args: [userId],
    });
    return result.rows as Array<{ id: string }>;
  }
}
```

**3.2 Update `app/api/onboarding/save-organization/route.ts`:**
```typescript
import { MembershipService } from '@/lib/services/MembershipService';

export async function POST(request: NextRequest) {
  // ... existing auth check ...
  
  const organization = await organizationService.createOrganization({...});

  // NEW: Create membership
  const membershipService = new MembershipService();
  await membershipService.ensureMembership(session.user.id, organization.id, 'admin');

  // NEW: Set active org cookie
  const response = NextResponse.json({ success: true, organization: {...} }, { status: 201 });
  response.cookies.set('bb_active_org_id', organization.id, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
```

**3.3 Update `app/api/onboarding/save-form-config/route.ts`:**
```typescript
import { getServerSession } from '@/lib/auth-helper';
import { MembershipService } from '@/lib/services/MembershipService';

export async function POST(request: NextRequest) {
  // NEW: Require auth
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { organizationId, formFields, ... } = await request.json();

  // NEW: Require membership
  const membershipService = new MembershipService();
  const isMember = await membershipService.isMember(session.user.id, organizationId);
  if (!isMember) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // ... existing form config logic ...
}
```

**3.4 Update `app/api/onboarding/generate-qr/route.ts`:**
```typescript
// Same pattern: add auth check → membership check
```

### Phase 4: Fix UI Issues

**4.1 Fix `/dashboard/registrations` infinite spinner:**
```typescript
// app/dashboard/registrations/page.tsx
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegistrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?next=/dashboard/registrations');
      return;
    }
    if (status === 'authenticated') {
      setLoading(false);
      // Fetch registrations...
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return <div>Loading...</div>; // Don't show infinite spinner
  }

  if (status === 'unauthenticated') {
    return null; // Redirecting...
  }

  // ... rest of component
}
```

**4.2 Clear onboarding localStorage on completion:**
```typescript
// app/onboarding/qr-configuration/page.tsx
const handleComplete = async () => {
  // Clear ALL onboarding keys
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('onboarding_organizationId');
    window.localStorage.removeItem('onboarding_contactEmail');
    window.localStorage.removeItem('onboarding_emailVerified');
    window.localStorage.removeItem('onboarding_formData');
    window.localStorage.removeItem('onboarding_formSaved');
    window.localStorage.removeItem('onboarding_step');
    window.localStorage.removeItem('onboarding_qrGenerated');
  }
  
  router.push('/dashboard');
};
```

---

## 🧪 TESTING: Production E2E Test Setup

### Set Up Production Test Secret

**1. Generate Secret:**
```bash
openssl rand -base64 32
# Example output: aBc123XyZ456...
```

**2. Add to Vercel Environment Variables:**
- Key: `PROD_TEST_SEED_SECRET`
- Value: `<generated-secret>`
- Environment: Production

**3. Add to Local `.env.local` (for running tests):**
```bash
PROD_TEST_SEED_SECRET=aBc123XyZ456...
```

**4. Run Production Tests:**
```bash
PROD_TEST_SEED_SECRET=<your-secret> npm run test:e2e:production
```

### Test Critical Paths

**1. Test Onboarding Flow:**
```bash
npm run test:e2e:production -- tests/e2e/onboarding-flow.spec.ts
```

**2. Test Registration Flow:**
```bash
npm run test:e2e:production -- tests/e2e/registration-public-flow.spec.ts
```

**3. Test Dashboard:**
```bash
npm run test:e2e:production -- tests/e2e/user-reported-regressions.spec.ts
```

---

## ✅ VERIFICATION CHECKLIST

Before marking production as "ready":

- [ ] **Membership creation** works during onboarding
- [ ] **Active org context** is set after org creation
- [ ] **Auth checks** added to `save-form-config` and `generate-qr`
- [ ] **Dashboard registrations** doesn't spin forever when unauthenticated
- [ ] **Onboarding form** is visible after 6-digit code login
- [ ] **Environment variables** set in Vercel (all required vars)
- [ ] **PROD_TEST_SEED_SECRET** set for E2E testing
- [ ] **Unit tests** pass: `npm run test`
- [ ] **Build** succeeds: `npm run build`
- [ ] **Production E2E** critical paths pass: `npm run test:e2e:production`
- [ ] **Manual test:** Complete onboarding flow end-to-end
- [ ] **Manual test:** Submit registration via QR code, verify it appears in dashboard

---

## 📊 CURRENT STATUS

**Deployed:** ✅ Yes (Vercel production)  
**Unit Tests:** ✅ 288 passed  
**Build:** ✅ Successful  
**E2E Tests:** ⚠️ 106 passed, 23 failed (mostly due to missing PROD_TEST_SEED_SECRET)  
**Onboarding:** ⚠️ Functional but incomplete (missing membership + active org)  
**Security:** ⚠️ Onboarding endpoints not protected  

**Next Steps:**  
1. Implement membership creation (P0)
2. Add auth checks to onboarding endpoints (P0)
3. Fix dashboard infinite spinner (P0)
4. Set `PROD_TEST_SEED_SECRET` in Vercel
5. Re-run E2E tests
6. Manual QA of complete onboarding flow

---

## 🆘 TROUBLESHOOTING

### 6-digit codes Redirecting to Wrong Domain

**Check:**
```bash
curl https://www.blessbox.org/api/debug-auth-url
```

**Should return:**
```json
{
  "nextAuthUrl": "https://www.blessbox.org",
  "publicAppUrl": "https://www.blessbox.org",
  "magicLinkBaseUrl": "https://www.blessbox.org"
}
```

**If wrong:** Update Vercel env vars `NEXTAUTH_URL` and `PUBLIC_APP_URL`

### Dashboard Shows Empty (No Registrations)

**Likely Cause:** Missing membership → no active org context

**Fix:** Implement membership creation (see Phase 3.2 above)

### E2E Tests Fail with "Production tests require PROD_TEST_SEED_SECRET"

**Fix:** Set `PROD_TEST_SEED_SECRET` in Vercel env vars and local `.env.local`

---

**Last Updated:** Based on production test run results  
**Priority:** P0 items must be fixed before production use

