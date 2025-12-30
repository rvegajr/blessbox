# BlessBox Authentication Specification

## Core Principles

1. **Email is the source of truth for identity**
2. **6-digit codes sent via email for verification**
3. **JWT-based sessions stored in HttpOnly cookies**
4. **Users can belong to multiple organizations (memberships)**
5. **Active organization tracked separately from session**

---

## Data Model

### Users Table
```sql
users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,  -- Source of truth for identity
  name TEXT,
  email_verified_at TEXT,
  created_at TEXT,
  updated_at TEXT
)
```

### Organizations Table
```sql
organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,  -- Can match user email but not enforced
  email_verified INTEGER DEFAULT 0,  -- Verified via 6-digit code
  ...
)
```

### Memberships Table (User ↔ Organization link)
```sql
memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  role TEXT DEFAULT 'admin',
  UNIQUE(user_id, organization_id)
)
```

### Verification Codes Table
```sql
verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,  -- 6 digits
  attempts INTEGER DEFAULT 0,
  expires_at TEXT NOT NULL,  -- 15 minutes from creation
  verified INTEGER DEFAULT 0
)
```

---

## Session Management

### Cookies
| Cookie | Purpose | HttpOnly | Secure | MaxAge |
|--------|---------|----------|--------|--------|
| `bb_session` | JWT token | Yes | Yes (prod) | 30 days |
| `bb_active_org_id` | Active organization | Yes | Yes (prod) | 30 days |

### JWT Payload
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "organizationId": "org-id-if-single-org",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Authentication Flows

### Flow 1: New User Onboarding

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Organization Setup (/onboarding/organization-setup)      │
│    - No auth required                                        │
│    - User fills: org name, email, address                    │
│    - Data saved to localStorage                              │
│    - Navigates to email verification                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Email Verification (/onboarding/email-verification)      │
│    - No auth required                                        │
│    - System sends 6-digit code to email                      │
│    - User enters code                                        │
│    - On verify:                                              │
│      a. Create organization (from localStorage)              │
│      b. Create/find user by email                            │
│      c. Create membership (user → org, role=admin)           │
│      d. Set org.email_verified = 1                           │
│      e. Create JWT session with organizationId               │
│      f. Set bb_session and bb_active_org_id cookies          │
│    - Navigates to form builder                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Form Builder (/onboarding/form-builder)                  │
│    - Auth required (redirects to login if not authenticated) │
│    - User configures registration form fields                │
│    - Navigates to QR configuration                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. QR Configuration (/onboarding/qr-configuration)          │
│    - Auth required                                           │
│    - User generates QR codes for entry points                │
│    - Onboarding complete → Dashboard                         │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Existing User Login (Single Org)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Login (/login)                                           │
│    - User enters email                                       │
│    - System sends 6-digit code                               │
│    - User enters code                                        │
│    - On verify:                                              │
│      a. Find user by email                                   │
│      b. Create JWT session (no organizationId yet)           │
│      c. Set bb_session cookie                                │
│    - Fetch organizations for user                            │
│    - If 1 org: auto-select and set bb_active_org_id          │
│    - Redirect to dashboard                                   │
└─────────────────────────────────────────────────────────────┘
```

### Flow 3: Existing User Login (Multiple Orgs)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Login (/login)                                           │
│    - Same as single org login                                │
│    - After verify, fetch organizations                       │
│    - If multiple orgs: redirect to /select-organization      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Select Organization (/select-organization)               │
│    - Display list of user's organizations                    │
│    - User selects one                                        │
│    - POST /api/me/active-organization                        │
│    - Set bb_active_org_id cookie                             │
│    - Redirect to dashboard                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/send-code` | POST | No | Send 6-digit code to email |
| `/api/auth/verify-code` | POST | No | Verify code, create session |
| `/api/auth/session` | GET | No | Get session + organizations |
| `/api/auth/logout` | POST | No | Clear session cookies |

### User/Organization

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/me/organizations` | GET | Yes | List user's organizations |
| `/api/me/active-organization` | POST | Yes | Set active organization |

### Onboarding

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/onboarding/create-organization` | POST | No | Create org (before verify) |
| `/api/onboarding/save-form-config` | POST | Yes | Save form configuration |
| `/api/onboarding/generate-qr` | POST | Yes | Generate QR codes |

---

## Client-Side API

### useAuth Hook

```typescript
const {
  // State
  user,                  // AuthUser | null
  status,                // 'loading' | 'authenticated' | 'unauthenticated'
  expires,               // string | null (ISO date)
  organizations,         // Organization[]
  activeOrganizationId,  // string | null
  
  // Methods
  sendCode,              // (email) => Promise<{ success, error? }>
  verifyCode,            // (email, code, orgId?) => Promise<{ success, error? }>
  logout,                // () => Promise<void>
  refresh,               // () => Promise<void>
  setActiveOrganization, // (orgId) => Promise<{ success, error? }>
} = useAuth();
```

### useSession Hook (Compatibility)

```typescript
const { data, status } = useSession();
// data = { user: AuthUser } | null
// status = 'loading' | 'authenticated' | 'unauthenticated'
```

---

## Server-Side API

### getServerSession

```typescript
import { getServerSession } from '@/lib/auth-helper';

const session = await getServerSession();
if (!session?.user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

const { id, email, organizationId } = session.user;
```

---

## Security Considerations

1. **6-digit codes expire after 15 minutes**
2. **Max 5 attempts per code before invalidation**
3. **Rate limiting: 3 codes per hour per email**
4. **JWT signed with NEXTAUTH_SECRET or JWT_SECRET**
5. **HttpOnly cookies prevent XSS access**
6. **SameSite=Lax prevents CSRF**
7. **Secure flag in production**

---

## Test Bypass (Development Only)

Set these cookies for automated testing:

```
bb_test_auth=1
bb_test_email=test@example.com
bb_test_org_id=test-org-id
bb_test_admin=1  (optional, for super_admin)
```

---

## Migration Notes

This system replaced NextAuth v5 Magic Links. Key changes:

| Feature | Before (NextAuth) | After (Custom) |
|---------|-------------------|----------------|
| Auth method | Magic Link (click email) | 6-digit code (enter manually) |
| Session | NextAuth JWT | Custom JWT |
| Provider | NextAuth v5 | AuthService |
| Client hook | `useSession()` from next-auth/react | `useAuth()` from @/lib/hooks/useAuth |
| Organizations | Not tracked in session | Tracked via `/api/auth/session` |

