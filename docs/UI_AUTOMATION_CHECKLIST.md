# UI Automation Checklist (Playwright-ready)

This document operationalizes the `.cursorrules` **UI AUTOMATION REQUIREMENTS (CRITICAL)** into a concrete, page-by-page checklist.

**Goal:** every core user/org workflow can be tested using **stable selectors only** (`data-testid`) with explicit loading/error states.

---

## Global conventions (required)

### Naming
- **Buttons**: `data-testid="btn-{action}"`
- **Forms**: `data-testid="form-{name}"`
- **Inputs**: `data-testid="input-{field}"`
- **Links**: `data-testid="link-{destination}"`
- **Cards**: `data-testid="card-{name}"`
- **Tables**: `data-testid="table-{name}"`
- **Rows**: `data-testid="row-{entity}-{id}"`
- **Loading indicators**: `data-testid="loading-{component}"`
- **Errors**: `data-testid="error-{field|scope}"`
- **Empty states**: `data-testid="empty-{component}"`

### Loading & errors (required)
- Any async section wrapper should have `data-loading="true|false"`.
- Any field error should have:
  - `role="alert"`
  - `id="...-error"` and the input should reference it via `aria-describedby="...-error"`.

---

## Core flow checklist (high priority)

### 1) Checkout (`/checkout`)

**Containers**
- [ ] `data-testid="page-checkout"` on the page root container
- [ ] `data-testid="card-checkout"` on the card panel
- [ ] `data-testid="status-checkout"` on the status banner/area (if present)

**Email**
- [ ] `data-testid="input-email"` on the email input
- [ ] `data-testid="error-email"` on email error message + `role="alert"`
- [ ] `aria-describedby="email-error"` on the email input when error exists

**Coupon**
- [ ] `data-testid="input-coupon"` on coupon input
- [ ] `data-testid="btn-apply-coupon"` on Apply button
- [ ] `data-testid="btn-clear-coupon"` on Clear button (only when applied)
- [ ] `data-testid="error-coupon"` on coupon error message + `role="alert"`
- [ ] coupon section wrapper: `data-testid="section-coupon"` + `data-loading` while applying

**Payment submit**
- [ ] `$0 checkout`: `data-testid="btn-complete-checkout"`
- [ ] Paid checkout: `data-testid="btn-pay"` (Square) and container `data-testid="payment-square-form"`
- [ ] payment wrapper: `data-testid="section-payment"` + `data-loading` while submitting

**Summary**
- [ ] `data-testid="summary-checkout"`
- [ ] `data-testid="summary-total"`

---

### 2) Onboarding – Organization Setup (`/onboarding/organization-setup`)

**Containers**
- [ ] `data-testid="page-onboarding-org-setup"`
- [ ] `data-testid="form-org-setup"`
- [ ] form wrapper: `data-loading` during submit

**Inputs**
- [ ] `data-testid="input-org-name"`
- [ ] `data-testid="input-event-name"`
- [ ] `data-testid="input-contact-email"`
- [ ] `data-testid="input-contact-phone"`
- [ ] `data-testid="input-contact-address"`
- [ ] `data-testid="input-contact-city"`
- [ ] `data-testid="input-contact-state"`
- [ ] `data-testid="input-contact-zip"`

**Errors**
- [ ] `data-testid="error-org-name"` + `role="alert"`
- [ ] `data-testid="error-contact-email"` + `role="alert"`
- [ ] each input uses `aria-describedby` pointing at its error id

**Actions**
- [ ] `data-testid="btn-submit-org-setup"`

---

### 3) Onboarding – Email Verification (`/onboarding/email-verification`)

**Containers**
- [ ] `data-testid="page-onboarding-email"`
- [ ] `data-testid="form-email-verification"`
- [ ] wrapper `data-loading` while sending/verifying

**Inputs**
- [ ] `data-testid="input-email"` (email input)
- [ ] `data-testid="input-verification-code"` (code input)

**Actions**
- [ ] `data-testid="btn-send-code"`
- [ ] `data-testid="btn-resend-code"`
- [ ] `data-testid="btn-verify-code"`

**Messages**
- [ ] `data-testid="error-email-verification"` + `role="alert"`
- [ ] `data-testid="success-email-verification"` + `role="status"`

---

### 4) Onboarding – Form Builder (`/onboarding/form-builder`)

**Containers**
- [ ] `data-testid="page-onboarding-form-builder"`
- [ ] `data-testid="form-builder-wizard"` (already present in component)

**Field actions**
- [ ] Each “add field” button has a stable id, e.g.:
  - `btn-add-field-text`
  - `btn-add-field-email`
  - `btn-add-field-phone`
  - `btn-add-field-select`
  - `btn-add-field-textarea`
  - `btn-add-field-checkbox`

**Select options editor**
- [ ] select options textarea: `data-testid="input-select-options-{fieldId}"`

**Navigation**
- [ ] `btn-next` / `btn-prev` / `btn-skip` within wizard navigation
- [ ] `data-loading` for save action

---

### 5) Onboarding – QR Configuration (`/onboarding/qr-configuration`)

**Containers**
- [ ] `data-testid="page-onboarding-qr-config"`
- [ ] `data-testid="qr-config-wizard"` (already present in component)

**Entry points**
- [ ] `data-testid="btn-add-entry-point"`
- [ ] For each entry row:
  - `data-testid="row-entry-point-{index|id}"`
  - `data-testid="input-entry-label-{index|id}"`
  - `data-testid="input-entry-slug-{index|id}"`
  - `data-testid="input-entry-description-{index|id}"`
  - `data-testid="btn-remove-entry-{index|id}"`

**Actions**
- [ ] `data-testid="btn-generate-qr"`
- [ ] `data-testid="btn-download-qr"`
- [ ] `data-testid="loading-qr-generate"` (or wrapper `data-loading`)
- [ ] `data-testid="error-qr-generate"` + `role="alert"`

**Generated QR preview**
- [ ] `data-testid="section-qr-preview"`
- [ ] For each QR card: `data-testid="card-qr-{slug}"`

---

### 6) Dashboard – QR Codes (`/dashboard/qr-codes`)

**Containers**
- [ ] `data-testid="page-dashboard-qr-codes"`
- [ ] `data-testid="loading-qr-codes"` + wrapper `data-loading`
- [ ] `data-testid="error-qr-codes"` + `role="alert"`
- [ ] `data-testid="empty-qr-codes"` for empty state

**Filters**
- [ ] `data-testid="input-qr-search"`
- [ ] `data-testid="dropdown-qr-status"`
- [ ] `data-testid="dropdown-qr-set"`
- [ ] `data-testid="btn-clear-filters"`

**Cards + actions**
- [ ] For each QR card: `data-testid="card-qr-{id}"`
- [ ] Actions:
  - `btn-download-qr-{id}`
  - `btn-view-analytics-{id}`
  - `btn-edit-qr-{id}`
  - `btn-deactivate-qr-{id}`

**Edit mode (safe-by-design)**
- [ ] show immutable slug text: `data-testid="text-qr-slug-{id}"`
- [ ] edit display name input: `data-testid="input-qr-description-{id}"`
- [ ] save/cancel:
  - `btn-save-qr-{id}`
  - `btn-cancel-qr-{id}`

---

### 7) Dashboard – Registrations (`/dashboard/registrations`)

**Containers**
- [ ] `data-testid="page-dashboard-registrations"`
- [ ] `data-testid="loading-registrations"` + wrapper `data-loading`
- [ ] `data-testid="error-registrations"` + `role="alert"`
- [ ] `data-testid="empty-registrations"`

**Filters**
- [ ] `data-testid="input-registration-search"`
- [ ] `data-testid="dropdown-registration-status"`
- [ ] `data-testid="btn-clear-registration-filters"`

**Exports**
- [ ] `data-testid="btn-export-csv"`
- [ ] `data-testid="btn-export-pdf"`
- [ ] `data-loading` while exporting

**Table**
- [ ] `data-testid="table-registrations"`
- [ ] For each row: `data-testid="row-registration-{id}"`
- [ ] For each row action:
  - `btn-check-in-{id}`
  - `link-view-registration-{id}`

---

### 8) Public registration form (`/register/[orgSlug]/[qrLabel]`)

**Containers**
- [ ] `data-testid="page-public-registration"`
- [ ] `data-testid="loading-public-registration"` (already has a loader view; add test id)
- [ ] `data-testid="error-public-registration"` for “Form unavailable”

**Form**
- [ ] `data-testid="form-public-registration"`
- [ ] submit: `data-testid="btn-submit-registration"`

**Field controls**
- [ ] Each generated field wrapper: `data-testid="field-{fieldId}"`
- [ ] Each input: `data-testid="input-{fieldId}"`
- [ ] Select dropdown: `data-testid="dropdown-{fieldId}"`

---

## Optional “audit gate” (recommended)

After implementing the above, add a CI check that fails if the required test ids are missing from these pages/components.

