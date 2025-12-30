# BlessBox Authentication System

## Overview

BlessBox uses a simple JWT-based authentication system with email verification via 6-digit codes. **Email is the source of truth for identity.**

## Authentication Flow

### Sign In Flow

1. **User enters email** on `/login`
2. **System sends 6-digit code** via email
3. **User enters code** on login page
4. **System verifies code** and creates JWT session
5. **JWT stored in HttpOnly cookie** (`bb_session`)
6. **User redirected** to dashboard or requested page

### Onboarding Flow

1. **Organization Setup** (`/onboarding/organization-setup`)
   - User fills organization details (name, email, address)
   - No authentication required at this step
   - Data stored in localStorage temporarily

2. **Email Verification** (`/onboarding/email-verification`)
   - System sends 6-digit code to the provided email
   - User enters code to verify
   - On success:
     - Organization is created in database
     - User account is created (or existing user is found by email)
     - Membership (user ↔ org) is created with 'admin' role
     - JWT session is created
     - Organization's `email_verified` flag is set to 1

3. **Form Builder** (`/onboarding/form-builder`) - *Requires auth*
   - User customizes their registration form fields

4. **QR Configuration** (`/onboarding/qr-configuration`) - *Requires auth*
   - User generates QR codes for entry points

## API Endpoints

### POST /api/auth/send-code

Send a 6-digit verification code to an email address.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

**Errors:**
- 400: Invalid email
- 429: Rate limited

### POST /api/auth/verify-code

Verify a 6-digit code and create a session.

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "organizationId": "optional-org-id"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "organizationId": "org-uuid"
  },
  "expires": "2025-01-28T..."
}
```

**Effects:**
- Sets `bb_session` cookie (HttpOnly, JWT)
- Sets `bb_active_org_id` cookie if organizationId provided
- Creates user if not exists
- Creates membership if organizationId provided

### GET /api/auth/session

Get current session information.

**Response (authenticated):**
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "organizationId": "org-uuid"
  },
  "expires": "2025-01-28T..."
}
```

**Response (unauthenticated):**
```json
{
  "user": null
}
```

### POST /api/auth/logout

Clear session and log out.

**Response:**
```json
{
  "success": true
}
```

## Client-Side Usage

### useAuth Hook

The primary hook for authentication state and methods:

```tsx
import { useAuth } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { 
    user,           // AuthUser | null
    status,         // 'loading' | 'authenticated' | 'unauthenticated'
    sendCode,       // (email: string) => Promise<{ success, error? }>
    verifyCode,     // (email, code, orgId?) => Promise<{ success, error? }>
    logout,         // () => Promise<void>
    refresh,        // () => Promise<void>
  } = useAuth();

  // ...
}
```

### useSession Hook (Legacy Compatibility)

For compatibility with existing code patterns:

```tsx
import { useSession } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { data, status } = useSession();
  const user = data?.user;
  // ...
}
```

## Server-Side Usage

### getServerSession

For API routes and server components:

```ts
import { getServerSession } from '@/lib/auth-helper';

export async function GET() {
  const session = await getServerSession();
  
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const email = session.user.email;
  const orgId = session.user.organizationId;
  // ...
}
```

## Session Storage

### Cookies

| Cookie | Purpose | HttpOnly | Secure (prod) |
|--------|---------|----------|---------------|
| `bb_session` | JWT session token | Yes | Yes |
| `bb_active_org_id` | Active organization ID | Yes | Yes |

### JWT Payload

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "organizationId": "org-id",
  "role": "admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Security

- JWT secret from `NEXTAUTH_SECRET` or `JWT_SECRET` env var
- Codes expire after 15 minutes
- Rate limiting on code sends (configurable)
- HttpOnly cookies prevent XSS access
- Secure flag set in production
- SameSite=Lax for CSRF protection

## Testing

### Development Bypass

In non-production environments, set these cookies for test auth:

```
bb_test_auth=1
bb_test_email=test@example.com
bb_test_org_id=test-org-id
bb_test_admin=1  (optional, for super_admin role)
```

### E2E Tests

Use the test bypass cookies or the `/api/test/seed` endpoint to set up test users and organizations.

## Migration from 6-digit codes

This system replaces the previous NextAuth-based 6-digit code authentication. Key differences:

| Feature | Old (6-digit code) | New (6-digit Code) |
|---------|------------------|-------------------|
| Auth method | Click link in email | Enter code manually |
| Session storage | NextAuth session | Custom JWT |
| Provider | NextAuth v5 | Custom AuthService |
| Hooks | next-auth/react | @/lib/hooks/useAuth |

