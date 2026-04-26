# QA Report: Section 1 (Auth) and Section 2 (Onboarding)

Date: 2026-04-25  Tester: rvegajr@noctusoft.com  Server: http://localhost:7777
Env: no `.env` configured. Turso/SendGrid not configured but dev fallbacks work (codes generated; helper endpoint returns them).

Severity: P0 = blocks flow, P1 = leaks/security/UX bug, P2 = polish.

---

## 1. Auth endpoints

| # | Case | Endpoint | Result | Severity | Notes |
|---|---|---|---|---|---|
| 1.1 | POST happy `qa1@example.com` | `/api/auth/send-code` | PASS (200) | - | Returns generic success. |
| 1.2 | POST invalid `not-an-email` | same | PASS (400) | - | `Invalid email format`. |
| 1.3 | POST missing email `{}` | same | PASS (400) | - | |
| 1.4 | POST malformed JSON `{not json` | same | FAIL (500) | P1 | Generic message, but 500 instead of 400. `route.ts:52-58` swallows `request.json()` parse error as 500. Same pattern repeats across every POST endpoint reviewed. |
| 1.5 | GET (no schema) | same | PASS (405) | - | Method-not-allowed. |
| 1.6 | 10x rapid POST same email | same | FAIL | P1 | All 10 returned 200. No rate-limit triggered in dev. Service claims rate-limit error path at `route.ts:35`, but limit was not hit. Unclear if disabled or threshold high. |
| 1.7 | POST verify wrong code | `/api/auth/verify-code` | PASS (400) | - | `Incorrect verification code`. |
| 1.8 | POST verify bad format `"abc"` | same | PASS (400) | - | |
| 1.9 | POST verify whitespace `" 140591 "` | same | FAIL (400) | P2 | Strict `/^\d{6}$/` regex (`route.ts:41`) rejects padded codes. Most paste workflows include whitespace. Recommend `code.trim()` before regex. |
| 1.10 | POST verify case-insensitive email `QA1@Example.com` + correct code | same | PASS (200) | - | Cookie set; `normalizeEmail` works. |
| 1.11 | POST verify reused code | same | PASS (400) | - | "No verification code found" (code consumed). |
| 1.12 | POST verify missing code | same | PASS (400) | - | |
| 1.13 | POST verify malformed JSON | same | FAIL (500) | P1 | Same parse-error-as-500 pattern. `route.ts:93`. |
| 1.14 | GET session anon | `/api/auth/session` | PASS (200) | - | `{user:null, organizations:[]}`. |
| 1.15 | GET session authed | same | PASS (200) | - | Returns user + org list. |
| 1.16 | POST logout | `/api/auth/logout` | PASS (200) | - | Cookie cleared; subsequent session is anon. |
| 1.17 | GET magic-link-url | `/api/test/magic-link-url` | PASS (405) | - | |
| 1.18 | POST magic-link-url happy | same | PASS (200) | - | Correctly rewrites origin from `0.0.0.0:3000` to `http://localhost:7777`. |
| 1.19 | POST magic-link-url missing | same | PASS (400) | - | |
| 1.20 | Internal leak audit (above) | (all) | OBSERVATION | P1 | `/api/test/magic-link-url` exposes `nextAuthUrl` env value (`https://bless-box.vercel.app\n` — note trailing `\n`!) in response body. Acceptable for `/api/test/*`, but the trailing newline in `NEXTAUTH_URL` is a real config defect (would break URL building). |

Expiry test for verify-code: helper shows `expiresAt = createdAt + 15min` (`route.ts:55-58`) — could not wait. Logic correct on inspection.

---

## 2. Onboarding endpoints

Walked the full happy-path: send-verification -> verify-code -> create-organization -> save-organization -> save-form-config -> generate-qr.

| # | Case | Endpoint | Result | Severity | Notes |
|---|---|---|---|---|---|
| 2.1 | Send happy | `/api/onboarding/send-verification` | PASS (200) | - | Dev mode leaks `code` in response body (`route.ts:43`) — intentional dev convenience, gated by `NODE_ENV==='development'`. |
| 2.2 | Send missing | same | PASS (400) | - | |
| 2.3 | Send malformed | same | FAIL (500) | P1 | **Leaks parser internals**: `Unexpected token 'o', \"oops\" is not valid JSON`. `route.ts:51` returns `error.message` raw. |
| 2.4 | Send 10x | same | FAIL | P1 | No rate limit triggered. |
| 2.5 | verify-code wrong | `/api/onboarding/verify-code` | PASS (400) | - | Returns `remainingAttempts`. |
| 2.6 | verify-code missing | same | PASS (400) | - | |
| 2.7 | verify-code malformed | same | FAIL (500) | P1 | Leaks parser message. `route.ts:108`. |
| 2.8 | verify-code happy WITH `organizationId` | same | **FAIL (500)** | **P0** | `SQLITE_CONSTRAINT_FOREIGNKEY: FOREIGN KEY constraint failed`. The membership INSERT at `route.ts:86-93` fires before the `users` upsert is committed in the same connection, OR `organizations.id` referenced by membership doesn't exist for the just-created org. This breaks the **primary onboarding happy path**. Also the raw SQLite error string is leaked to client. |
| 2.9 | verify-code happy WITHOUT org | same | PASS (200) | - | User upsert works; membership skipped. |
| 2.10 | create-organization happy (anon) | `/api/onboarding/create-organization` | PASS (201) | - | Correctly anonymous per spec. |
| 2.11 | create-organization missing name | same | PASS (400) | - | |
| 2.12 | create-organization malformed | same | FAIL (500) | P1 | Leaks parser message. `route.ts:82`. |
| 2.13 | save-organization anon | `/api/onboarding/save-organization` | PASS (401) | - | |
| 2.14 | save-organization authed happy | same | PASS (201) | - | Creates org + membership + sets `bb_active_org_id` cookie. |
| 2.15 | save-organization missing name | same | PASS (400) | - | |
| 2.16 | save-organization malformed | same | FAIL (500) | P1 | Same leak. `route.ts:99`. |
| 2.17 | save-form-config anon | `/api/onboarding/save-form-config` | PASS (401) | - | |
| 2.18 | save-form-config foreign org | same | PASS (403) | - | Membership check works. `route.ts:40-43`. |
| 2.19 | save-form-config happy (no `order` field) | same | FAIL (500) | P1 | `Form fields validation failed: Field 1: Order must be a number`. The route does not document or enforce `order` at the API boundary; FormConfigService rejects. Should be 400, not 500, and the wizard's FormBuilder must always populate `order`. |
| 2.20 | save-form-config happy (with `order`) | same | PASS (200) | - | |
| 2.21 | save-form-config missing orgId | same | PASS (400) | - | |
| 2.22 | save-form-config malformed | same | FAIL (500) | P1 | Leaks parser. `route.ts:165`. |
| 2.23 | generate-qr anon | `/api/onboarding/generate-qr` | PASS (401) | - | |
| 2.24 | generate-qr happy | same | PASS (200) | - | Creates 1 QR; merges with existing. |
| 2.25 | generate-qr missing entryPoints | same | PASS (400) | - | |
| 2.26 | generate-qr malformed | same | FAIL (500) | P1 | Leaks parser. `route.ts:228`. |
| 2.27 | migrate-onboarding happy | `/api/migration/migrate-onboarding` | PASS (200) | - | Dev-only; rejects in prod (`route.ts:19`). |
| 2.28 | migrate-onboarding missing | same | PASS (400) | - | |
| 2.29 | migrate-onboarding malformed | same | FAIL (500) | P1 | Leaks parser. `route.ts:101`. |

---

## 3. Static review: components/onboarding

Files reviewed: `OnboardingWizard.tsx`, `WizardStepper.tsx`, `WizardNavigation.tsx`, `FormBuilderWizard.tsx` (skim), `QRConfigWizard.tsx` (skim).

Findings:

- **No `ProgressIndicator` component exists** in `components/onboarding/` despite being requested. Progress is rendered by `WizardStepper` (lines 49-122) and the "Step X of Y" label inside `WizardNavigation` (lines 56-58). If a `ProgressIndicator` is referenced elsewhere it is not in this directory. Severity P2.
- **`WizardNavigation.tsx:67` passes `onSkip` to `onKeyDown` unconditionally** — if a parent omits `onSkip` (it's typed as required in props, but not all step screens may bind it) this will throw. The Skip button is also always rendered even on steps that should not be skippable. Severity P2.
- **`OnboardingWizard.tsx:46`**: `canGoNext = currentStep < steps.length - 1` — a pure positional check. There is no per-step validation gate; users can advance with empty/invalid forms unless the embedded step component blocks itself. Severity P1 (UX/data integrity).
- **`WizardStepper.tsx:69`**: `onClick={() => isClickable && handleStepClick(index)}` — fine, but `onKeyDown` on disabled buttons (`line 70`) still binds. React `disabled` prevents click but not keydown bubbling on focused element. Minor. Severity P2.
- **`OnboardingWizard.tsx:50-55`**: `handleStepClick` permits jumping to any earlier step or completed step but not forward — no way to revisit a completed later step. Combined with `canGoNext` not respecting completion, navigation is inconsistent. Severity P2.

---

## 4. Cross-cutting issues (priority list)

1. **P0** `/api/onboarding/verify-code` with `organizationId` 500s with raw SQLite FK error (`route.ts:86-93`). Blocks the documented onboarding happy path. Also leaks DB internals.
2. **P1** Every POST route returns 500 + raw `error.message` for malformed JSON. Should catch `SyntaxError` from `request.json()` and return 400 with generic message.
3. **P1** `NEXTAUTH_URL` env value contains a trailing `\n` (visible via `/api/test/magic-link-url`). Will cause downstream URL bugs.
4. **P1** No rate-limiting fires on `/api/auth/send-code` or `/api/onboarding/send-verification` (10x in <1s all 200). Either disabled in dev or threshold is far above 10.
5. **P1** `save-form-config` returns 500 (not 400) when client omits `order` on a field. Validation error should be 400.
6. **P1** `OnboardingWizard` lets users press Next without validating the active step.
7. **P2** `verify-code` rejects whitespace-padded codes — paste UX risk.
8. **P2** `WizardStepper`/`WizardNavigation` missing skip-gating and revisit-completed support; no dedicated `ProgressIndicator`.

---

## 5. Test artifacts

- Logged-in cookie jar: `/tmp/sess.jar` (qaorg2-...@example.com session, expires 2026-05-25).
- Sample IDs: org `1289c260-85d1-4ce5-bd12-41c299820456`, qrSet `0a6a8413-99bf-4bdc-a7f1-6558379bce06`.
- Helper endpoint `/api/test/verification-code` works without secret in dev — used to fetch live codes.
