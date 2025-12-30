# ✅ Onboarding Completion Checklist (TDD + ISP)

**Scope:** 6-digit code auth → Org setup → Form builder → QR generation → Dashboard handoff.  
**Tech:** NextAuth v5, Turso/libSQL, Drizzle, Vitest, Playwright.  
**Rule:** Write tests first (TDD). Keep interfaces segregated (ISP).

---

## 0) Definition of Done (DOD)

- [ ] A new user can sign in via 6-digit code (`/login`)
- [ ] User can complete onboarding: `/onboarding/organization-setup` → `/onboarding/form-builder` → `/onboarding/qr-configuration`
- [ ] On completion, dashboard loads with correct active organization context
- [ ] Generated QR URLs work and submitted registrations appear in `/dashboard/registrations`
- [ ] All onboarding write operations are authorized (auth + membership)
- [ ] Unit tests (Vitest) cover services; E2E tests (Playwright) cover critical path

---

## 1) ISP Interfaces (lib/interfaces/)

### 1.1 Active Organization Context
- [ ] Create `lib/interfaces/IActiveOrganizationContext.ts`
  - [ ] `IActiveOrganizationReader.getActiveOrganizationIdForSession(session): Promise<string | null>`
  - [ ] `IActiveOrganizationWriter.setActiveOrganizationIdForSession(session, orgId): Promise<void>`

### 1.2 Membership Management
- [ ] Create `lib/interfaces/IMembershipService.ts`
  - [ ] `ensureMembership(userId: string, organizationId: string, role?: string): Promise<void>`
  - [ ] `isMember(userId: string, organizationId: string): Promise<boolean>`
  - [ ] `listOrganizationsForUser(userId: string): Promise<Array<{ id: string }>>`

### 1.3 Onboarding Orchestration
- [ ] Create `lib/interfaces/IOnboardingOrchestrator.ts`
  - [ ] `createOrganizationForUser(args): Promise<{ organizationId: string }>`
  - [ ] `saveFormConfigForOrganization(args): Promise<{ qrCodeSetId: string }>`
  - [ ] `generateQrForOrganization(args): Promise<{ qrSetId: string }>`

---

## 2) TDD: Unit tests (Vitest) first (lib/services/*.test.ts)

### 2.1 MembershipService tests
- [ ] Add `lib/services/MembershipService.test.ts`
  - [ ] creates membership idempotently (`ensureMembership` twice does not duplicate)
  - [ ] `isMember` returns true/false
  - [ ] `listOrganizationsForUser` ordering and filtering

### 2.2 ActiveOrganizationContext tests
- [ ] Add `lib/services/ActiveOrganizationContext.test.ts`
  - [ ] set/get active org id (cookie-backed or via existing endpoint semantics)
  - [ ] rejects setting org if no membership

### 2.3 OnboardingOrchestrator tests
- [ ] Add `lib/services/OnboardingOrchestrator.test.ts`
  - [ ] org creation links membership to user
  - [ ] org creation sets organization active context
  - [ ] form config save requires membership
  - [ ] qr generation requires membership

**Test rules**
- [ ] No `any`
- [ ] Mock external deps (db/email) where needed
- [ ] Test interfaces/behaviors, not UI

---

## 3) Implement services (lib/services/)

### 3.1 MembershipService (DB: `memberships`)
- [ ] Create `lib/services/MembershipService.ts` implementing `IMembershipService`
- [ ] Use parameterized queries (`db.execute({ sql, args })`)
- [ ] Ensure idempotency (unique constraint / `ON CONFLICT DO NOTHING`)

### 3.2 ActiveOrganizationContext (cookie + membership gate)
- [ ] Create `lib/services/ActiveOrganizationContext.ts` implementing `IActiveOrganizationReader`/`Writer`
- [ ] Use existing cookie `bb_active_org_id` behavior (see `app/api/me/active-organization/route.ts`)

### 3.3 OnboardingOrchestrator
- [ ] Create `lib/services/OnboardingOrchestrator.ts` implementing `IOnboardingOrchestrator`
- [ ] Compose existing services:
  - [ ] `OrganizationService`
  - [ ] `FormConfigService`
  - [ ] QR generation (route/service boundary)
  - [ ] `MembershipService`
  - [ ] `ActiveOrganizationContext`

---

## 4) API hardening (app/api/onboarding/*)

### 4.1 `POST /api/onboarding/save-organization`
- [ ] Add membership creation for signed-in user
- [ ] Set active org context (`bb_active_org_id`) after creating membership
- [ ] Decide `organizations.email_verified` semantics for 6-digit code and implement:
  - [ ] Option A: set `email_verified = 1` on create
  - [ ] Option B: deprecate usage in onboarding logic

### 4.2 `POST /api/onboarding/save-form-config`
- [ ] Require auth (`getServerSession`)
- [ ] Require membership for `organizationId`
- [ ] Reject if unauthorized (401/403)

### 4.3 `POST /api/onboarding/generate-qr`
- [ ] Require auth (`getServerSession`)
- [ ] Require membership for `organizationId`
- [ ] Reject if unauthorized (401/403)

---

## 5) UI wiring (app/onboarding/*)

### 5.1 Organization setup page
- [ ] On success: call `POST /api/me/active-organization` (or rely on org-create route setting cookie)
- [ ] Ensure local onboarding keys are consistent (do not set step=3 prematurely)

### 5.2 QR completion cleanup
- [ ] Clear full onboarding localStorage keys on completion:
  - [ ] `onboarding_organizationId`
  - [ ] `onboarding_contactEmail`
  - [ ] `onboarding_emailVerified`
  - [ ] `onboarding_formData`
  - [ ] `onboarding_formSaved`
  - [ ] `onboarding_step`
  - [ ] `onboarding_qrGenerated`

---

## 6) E2E coverage (Playwright) — critical path

### 6.1 New test: onboarding sets active org and dashboard shows data
- [ ] Add `tests/e2e/onboarding-magic-link-flow.spec.ts`
  - [ ] Use QA helper login endpoint in non-production OR headed/manual login
  - [ ] Complete onboarding and assert:
    - [ ] `/api/me/organizations` returns 1+ orgs
    - [ ] active org cookie set (behavioral assertion via dashboard data present)
    - [ ] QR codes appear in `/dashboard/qr-codes`

### 6.2 New test: public registration appears in dashboard
- [ ] Add `tests/e2e/public-registration-to-dashboard.spec.ts`
  - [ ] Create org + QR via APIs/QA seed
  - [ ] Submit registration via `/register/[orgSlug]/[qrLabel]`
  - [ ] Assert new row exists in `/dashboard/registrations`

---

## 7) Edge cases (must handle)

- [ ] **Multi-org user**: if user has >1 org, require selection; onboarding must set active org on create
- [ ] **Case-insensitive emails**: normalize everywhere
- [ ] **Unauthorized writes**: clients cannot write form config/QR for other orgs
- [ ] **Back button**: protected routes redirect to `/login?next=...` without dead ends
- [ ] **Idempotency**: repeated submits do not create duplicate memberships

---

## 8) “Stop the line” validation

- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] `npm run test:e2e:smoke:local` passes (or the equivalent critical-check path)


