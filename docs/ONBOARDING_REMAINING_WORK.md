# Onboarding Remaining Work (6-digit code Auth)

**Scope:** Organization onboarding from sign-in → org setup → form builder → QR generation → dashboard handoff.  
**Canonical Auth:** NextAuth v5 **6-digit code (email-only)** via `/login`.

---

## Current Step Map (as implemented)

1. **Auth (6-digit code)**
   - `/login` sends 6-digit code via NextAuth Email provider
   - Onboarding pages redirect unauthenticated users to `/login?next=...`

2. **Organization Setup**
   - UI: `app/onboarding/organization-setup/page.tsx`
   - API: `POST /api/onboarding/save-organization`

3. **Form Builder**
   - UI: `app/onboarding/form-builder/page.tsx`
   - API: `POST /api/onboarding/save-form-config`

4. **QR Configuration**
   - UI: `app/onboarding/qr-configuration/page.tsx`
   - API: `POST /api/onboarding/generate-qr`

5. **Completion / Dashboard Handoff**
   - UI pushes to `/dashboard`
   - Dashboard requires an **active organization context**

---

## What’s Left (to make onboarding “complete and working”)

### P0 — Correctness: link signed-in user to organization (membership + active org)

- **Problem**
  - `/api/onboarding/save-organization` creates an organization but does **not** create a membership for the signed-in user.
  - `/api/me/active-organization` requires an existing membership; onboarding never calls it.
  - Result: dashboard can show **empty/incorrect org context**, leading to “QR exists but registrations don’t” symptoms.

- **Required**
  - Create a `memberships` row for `{ user_id, organization_id }` during onboarding org creation.
  - Set active org context (server cookie `bb_active_org_id`) after org creation:
    - either from the org-creation API response,
    - or by calling `POST /api/me/active-organization` from onboarding UI once membership exists.

### P0 — Security/Consistency: protect onboarding write endpoints

- **Problem**
  - `POST /api/onboarding/save-form-config` does not verify session or membership.
  - `POST /api/onboarding/generate-qr` does not verify session or membership.

- **Required**
  - Enforce Auth → Organization membership on both endpoints.
  - Avoid trusting `organizationId` from client without authorization.

### P1 — Data integrity: organization emailVerified flag vs 6-digit code

- **Problem**
  - Organizations are created with `email_verified = false` even though user is authenticated via 6-digit code.

- **Required**
  - Decide canonical meaning of `organizations.email_verified` under 6-digit code:
    - Option A: set `email_verified = true` on org creation (recommended).
    - Option B: deprecate the flag for org onboarding and rely on NextAuth identity.

### P1 — Completion hygiene: clear onboarding localStorage keys

- **Problem**
  - QR completion currently removes only `onboarding_step`.
  - Remaining keys (`onboarding_organizationId`, `onboarding_contactEmail`, etc.) can cause confusing resume behavior.

- **Required**
  - Clear full onboarding session keys on successful completion, or convert to a “resume onboarding” feature with explicit UX.

### P2 — Specs + tests alignment (6-digit code)

- **Problem**
  - Some tests/docs historically expect 6-digit verification-code flows.

- **Required**
  - Update onboarding E2E tests to use either:
    - headed-mode manual login, or
    - secret-gated QA login helpers in production test runs (preferred for CI).

---

## Definition of Done (Onboarding)

- A brand-new user can:
  - sign in via 6-digit code,
  - create an organization,
  - build a form,
  - generate QR codes,
  - land on dashboard with the correct organization active,
  - and see registrations submitted via generated QR links under `/dashboard/registrations`.


