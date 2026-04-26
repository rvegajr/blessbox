# QA Report 06 — Tutorials, Bug Reporting, Components Sweep

Date: 2026-04-25 · Tester: rvegajr@noctusoft.com · Dev: http://localhost:7777

---

## 11. Tutorials

### 11.1 Inventory — expected 13, actually **19** (FAIL — count mismatch)

Source: `/Users/admin/Dev/YOLOProjects/BlessBox/components/TutorialSystemLoader.tsx` loads `/public/tutorials/tutorial-definitions.js` (11 tutorials) + `/public/tutorials/additional-tutorials.js` (8 tutorials) = **19**.

Definitions file IDs (11): `welcome-tour`, `dashboard-tour`, `qr-creation-tour`, `event-management-tour`, `team-management-tour`, `first-visit-welcome`, `dashboard-empty-state`, `qr-creation-help`, `event-management-help`, `team-invite-help`, `feature-discovery`.

Additional file IDs (8): `registration-management-tour`, `checkin-tutorial`, `form-builder-tutorial`, `qr-configuration-tutorial`, `analytics-tutorial`, `export-data-tutorial`, `onboarding-complete-flow`, `payment-coupons-tutorial`.

Note: there are also two parallel implementations — the vanilla JS engine in `/public/tutorials/*.js` (loaded at runtime by `TutorialSystemLoader`) and a React `TutorialManager` at `components/ui/TutorialManager.tsx` (does not appear to be mounted anywhere). Documentation/spec claiming 13 should be reconciled against the actual 19, or 6 surplus tutorials retired.

### 11.2 Static checks per tutorial

- **Steps array structure**: every tutorial in both files conforms to `{ element: string, popover: { title, description, side }, action? }` per `Tutorial.interface.ts`. Spot-checked all 19 — all have non-empty `steps[]`. PASS.
- **Completion persistence**: `localStorage` only. Vanilla engine (`tutorial-engine.js`) writes to a single key holding `{ [id]: { version, completed, completedAt } }`; React `TutorialManager` writes per-tutorial keys `tutorial-<id>` with `{ completed, version }`. The two systems use **different storage schemas** — completing in one will not be seen by the other. FLAG. No DB persistence (cross-device progress not tracked). FLAG for product.
- **Keyboard handlers**: React `TutorialManager` handles `Escape` (skip if dismissible), `ArrowRight`/`Enter` (next/complete), `ArrowLeft` (prev) — PASS. Vanilla engine has no global keydown listener (relies on driver.js mock UI buttons) — FLAG: no keyboard nav for the system actually loaded in production.

---

## 12. Bug Reporting (`/api/report-bug`)

Source: `app/api/report-bug/route.ts`, `app/report-bug/page.tsx`. Live curl results against localhost:7777:

| Test | Payload | HTTP | Result |
|---|---|---|---|
| Valid | all required fields | 200 | `BUG-...` returned, stored locally (no GITHUB_TOKEN in dev) — PASS |
| Missing fields | only `description` | 400 | `Missing required fields: description, expected, steps` — PASS |
| XSS | `<script>`, `<img onerror>`, `<svg onload>` in body | 200 | Accepted unsanitized; payload only logged + posted to GitHub markdown. GitHub strips JS in issue render, but **server logs and any future DB sink store raw HTML/JS unescaped**. FLAG (low‑risk now, escalates if a UI ever renders these). No `DOMPurify` / escape applied server-side. |
| Oversized | 2 MB description | 200 | Accepted in 200 with no size cap — FAIL. No `Content-Length` check, no `bodyParser` size limit, no truncation before storage/GitHub call. Will eventually fail GitHub's ~64KB issue body limit and balloon logs. |
| Rate limiting | grep of route + `middleware.ts` + `lib/` | — | **No rate limiting present**. FAIL. Endpoint is unauthenticated and trivially abuseable to spam GitHub Issues once `GITHUB_TOKEN` is configured. |

Recommendations: add request size cap (e.g. 256 KB), strip HTML server-side, add IP rate limit (e.g. 5/min via Upstash or in-memory LRU), require captcha or auth for unauthenticated submissions, cap `images[]` length and per-image base64 size.

---

## 13. Traklet Dev Widget Gating (commit 8d6b166)

Source: `components/dev/TrakletDevWidget.tsx`, mounted unconditionally in `app/layout.tsx:52`.

```ts
const token = process.env.NEXT_PUBLIC_TRAKLET_PAT;
if (!token || process.env.NEXT_PUBLIC_TRAKLET_ENABLED !== 'true' || initRef.current) return;
```

**Verdict: PASS conditionally.** The component *renders* (returns `null`) on every page load including production, but only `import('traklet')` and initializes when **both** `NEXT_PUBLIC_TRAKLET_PAT` and `NEXT_PUBLIC_TRAKLET_ENABLED === 'true'` are present at build time. Since these are `NEXT_PUBLIC_*`, they are inlined at build time — production builds without these envs will short-circuit. **However**: the gating relies on operator discipline (don't set `NEXT_PUBLIC_TRAKLET_ENABLED=true` in prod), not a `process.env.NODE_ENV !== 'production'` guard. FLAG — recommend hard guard:

```ts
if (process.env.NODE_ENV === 'production') return;
```

Also: `NEXT_PUBLIC_TRAKLET_PAT` is a GitHub PAT exposed to the client bundle whenever set. If accidentally enabled in prod, the token leaks to every visitor. HIGH severity if misconfigured.

---

## Components Sweep

`find components -type f -name "*.tsx"` returns 31 files; all 31 covered below.

| File (under `components/`) | Purpose | Loading | Empty | Error | A11y (aria/role) | Responsive (sm/md/lg) | Flags |
|---|---|---|---|---|---|---|---|
| `TutorialSystemLoader.tsx` | Loads vanilla tutorial scripts, renders `GlobalHelpButton` | n/a | n/a | console only | inherits | n/a | Swallows script errors silently |
| `admin/AnalyticsDashboard.tsx` | Admin analytics page | yes | — | yes (retry btn) | none | md/lg grid | no aria on retry button |
| `admin/AnalyticsSummary.tsx` | Top-line metrics row | yes | — | — | none | md grid | no error state |
| `admin/CouponForm.tsx` | Create/edit coupon | submit btn | — | per-field + submit | `onKeyDown` on input | — | no `role=alert` on errors |
| `admin/CouponListTable.tsx` | Coupon table w/ pagination | yes | yes | yes | none | — | clickable `<th>` sort lacks role/keyboard handler |
| `admin/MetricCard.tsx` | KPI tile | — | — | — | none | — | purely presentational; OK |
| `classes/ClassForm.tsx` | Create class form | yes | — | yes | none | md grid | no `aria-invalid`/labels-by-id |
| `classes/ClassList.tsx` | Class cards grid | yes | implicit | yes (retry) | none | md/lg grid | no empty state copy |
| `dashboard/AnalyticsChart.tsx` | Chart wrapper | yes | — | console | none | — | no error UI; chart lacks `role="img"` + label |
| `dashboard/DashboardLayout.tsx` | Main dashboard shell | yes | — | — | `role="main"`, `aria-label` | sm/md/lg | OK |
| `dashboard/DashboardStats.tsx` | Stats cards | yes | — | yes (yellow note) | none | md/lg | OK |
| `dashboard/RecentActivityFeed.tsx` | Activity list | yes | implicit | console | none | — | no empty state copy, no error UI |
| `dashboard/StatCard.tsx` | KPI card | — | — | — | `role="region"`, `aria-label` | — | OK |
| `dashboard/StatCardEnhanced.tsx` | KPI card w/ click | — | — | — | `role="region"`, `tabIndex` when clickable | — | missing `onKeyDown` for Enter/Space activation |
| `dashboard/UsageBar.tsx` | Quota bar | — | — | — | `role="progressbar"` + valuenow/min/max | — | exemplary a11y |
| `dev/TrakletDevWidget.tsx` | Dev issue tracker | — | — | console | n/a | n/a | gating via env only — see §13 |
| `onboarding/FormBuilderWizard.tsx` | Drag-style form builder | — | — | — | `aria-label` on add/move/remove | lg grid | reorder buttons OK; complex DnD lacks `role="list"` |
| `onboarding/OnboardingWizard.tsx` | Wizard shell | — | — | — | `role="region"`, `aria-label` | — | OK |
| `onboarding/QRConfigWizard.tsx` | QR config + entry points | yes (`data-loading`) | — | — | aria-labels per row, `aria-label` on actions | md grid | `<img>` for QR preview — verify `alt` (FLAG: not seen in awk grep, please confirm) |
| `onboarding/WizardNavigation.tsx` | Prev/Next/Skip/Complete | — | — | — | `role="navigation"`, full `aria-label`+`onKeyDown` per button | — | exemplary a11y |
| `onboarding/WizardStepper.tsx` | Step indicator | — | — | — | `role="navigation"`, `aria-current="step"`, keyboard nav | — | exemplary a11y |
| `payment/CouponInput.tsx` | Apply coupon | yes (loading prop) | — | inline error | `role="status"`, `aria-live="polite"`, `aria-label`, `onKeyDown` | — | OK |
| `payment/SquarePaymentForm.tsx` | Square card entry | yes | — | reinit-on-error | none | — | error region lacks `role="alert"`; complex iframe a11y delegated to Square |
| `providers/auth-provider.tsx` | Auth context | status='loading' | — | typed errors returned | n/a (provider) | n/a | OK |
| `subscription/CancelModal.tsx` | Cancel sub modal | yes | — | yes | none | — | backdrop `onClick` only (no `Escape` handler), no `role="dialog"`/`aria-modal` |
| `subscription/UpgradeModal.tsx` | Upgrade sub modal | yes | — | yes | none | — | same as Cancel — missing dialog a11y + Escape |
| `ui/EmptyState.tsx` | Generic empty state | — | yes (purpose) | — | `role="region"`, `aria-label`, `aria-hidden` icon | sm flex | OK |
| `ui/GlobalHelpButton.tsx` | Floating help drawer | — | — | — | `aria-expanded`, `aria-haspopup`, `role="dialog"`, `aria-modal`, `aria-live` | — | exemplary a11y |
| `ui/HelpTooltip.tsx` | Inline help bubble | — | — | — | `aria-label="Help"`, `onKeyDown` | — | OK |
| `ui/ProgressIndicator.tsx` | Progress bar | — | — | — | `role="progressbar"` w/ valuemin/max/now | — | OK |
| `ui/TutorialManager.tsx` | React tutorial driver | — | — | — | `role="dialog"`, `aria-modal`, `aria-live`, full keyboard | — | not mounted in app — dead code or test-only |

### Cross-cutting flags

- **Hardcoded colors at-a-glance contrast**: `text-yellow-800` on white (DashboardStats error) — passes AA. `text-gray-500` on white (multiple) — borderline (4.6:1) — passes AA normal text. `text-blue-600` on white — passes. `bg-red-500` white-cross close button on `report-bug` previews (5x5px) — too small for tap target (24px min); FLAG. No clear AA failures spotted, but full audit needs a tool (axe).
- **Missing alt text on `<img>`**: `report-bug/page.tsx` previews use `alt={`Screenshot ${i+1}`}` — OK. `QRConfigWizard.tsx` renders an `<img>` for QR preview — please verify `alt` attribute is present (not visible in the partial grep).
- **Interactive `<div>` without keyboard handlers**: `report-bug/page.tsx` dropzone `<div onClick=...>` lacks `role="button"`, `tabIndex`, and `onKeyDown`. FLAG. `subscription/CancelModal` and `UpgradeModal` backdrop divs lack `role="dialog"`/Escape. `StatCardEnhanced` adds `tabIndex={0}` but no `onKeyDown` for Enter/Space — fails WCAG 2.1.1.
- **Modals without focus trap**: Cancel/Upgrade/HelpDrawer — only HelpDrawer has full dialog a11y; verify focus trap & restore.

### Cross-reference

`find components -type f -name "*.tsx" | wc -l` = 31. All 31 above. No misses.

---

## Summary

- Tutorials count mismatch: spec says 13, code has **19** (FAIL).
- Two parallel tutorial implementations with incompatible localStorage schemas (FLAG).
- `/api/report-bug`: no rate limit, no size cap, no input sanitization (FAIL — security/abuse).
- Traklet widget gated by env vars only — recommend hard `NODE_ENV` guard (FLAG, high impact if misconfigured).
- Components: strong a11y in `WizardNavigation`, `WizardStepper`, `GlobalHelpButton`, `UsageBar`, `ProgressIndicator`. Weak a11y in subscription modals, `StatCardEnhanced` keyboard activation, and `report-bug` dropzone.
