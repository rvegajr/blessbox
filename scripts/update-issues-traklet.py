#!/usr/bin/env python3
"""Update all BlessBox use-case issues to Traklet structured format."""
import subprocess, tempfile, os, sys

OPEN = '<span style="display:none">'
CLOSE = '</span>'

def section(name, content):
    return f'{OPEN}{{traklet:section:{name}}}{CLOSE}\n{content}\n{OPEN}{{/traklet:section:{name}}}{CLOSE}'

def compose(objective, prerequisites, steps, expected):
    steps_md = '\n'.join(f'{i+1}. {s}' for i, s in enumerate(steps))
    expected_md = '\n'.join(f'- ✅ {e}' for e in expected)
    return '\n\n'.join([
        section('objective', f'## Objective\n{objective}'),
        section('prerequisites', prerequisites),
        section('steps', f'## Steps\n\n{steps_md}'),
        section('expected-result', f'## Expected Result\n\n{expected_md}'),
        section('actual-result', '## Actual Result\n_Not yet tested._'),
        section('evidence', '## Evidence\n_No recordings or screenshots attached yet._\n\n> **Tip:** Use [Jam.dev](https://jam.dev) to record your testing session, then paste the link here.'),
        section('diagnostics', '## Diagnostics\n_Diagnostics will be auto-attached when submitting results via Traklet._'),
        section('notes', '## Notes\n_Routes involved:_\n_Area:_'),
    ])

ISSUES = {
    15: {
        'title': '[Use Case]: Passwordless email login (6-digit code)',
        'body': compose(
            objective='Users can log in without a password by requesting a 6-digit verification code sent to their email address.',
            prerequisites='''## Prerequisites

```bash
# Dev server must be running
npm run dev  # http://localhost:7777
```

- No seed required — use any email address
- In dev mode the verification code is printed to the server console (no real email sent)
- For production testing: use a real deliverable email address''',
            steps=[
                'Go to http://localhost:7777/login',
                'Enter any email address (e.g. `qa@example.com`)',
                'Click **Send Code**',
                'In dev mode: copy the 6-digit code from the server console output',
                'Enter the code in the verification field and submit',
                'Observe the redirect destination',
                '**Edge case — wrong code:** Enter an incorrect code 5 times and observe the lockout response',
                '**Edge case — expired code:** Wait 10+ minutes then submit the valid code and observe the expiry error',
                '**API smoke test (no browser):**\n```bash\ncurl -s -X POST http://localhost:7777/api/auth/send-code \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"email":"qa@example.com"}\' | jq .\n```',
            ],
            expected=[
                'Code delivered within 30 seconds (or shown in console in dev)',
                'Redirected to /dashboard or /onboarding/organization-setup after correct code',
                'Session cookie set and persists across page refreshes',
                'Code expires after 10 minutes (expiry error shown)',
                '5 incorrect attempts trigger lockout response',
            ],
        ),
    },
    16: {
        'title': '[Use Case]: Organization onboarding wizard (4 steps)',
        'body': compose(
            objective='A new user who has no organization is guided through a 4-step onboarding wizard to create their org, configure settings, and arrive at a ready-to-use dashboard.',
            prerequisites='''## Prerequisites

```bash
# Seed a fresh user with no org
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"onboard-test"}')
echo $SEED | jq '{orgSlug, contactEmail}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Test auth cookie: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Or log in with a fresh email that has no organization''',
            steps=[
                'Log in with a new email that has no existing organization',
                'Observe redirect to /onboarding/organization-setup (Step 1)',
                'Fill in Organization Name and click **Next**',
                'Step 2 — fill in contact details and click **Next**',
                'Step 3 — configure timezone / locale settings and click **Next**',
                'Step 4 — review summary and click **Finish**',
                'Observe redirect to /dashboard',
                '**Edge case:** Refresh the browser mid-wizard and verify progress is preserved',
                '**Edge case:** Click **Back** on step 3 and verify prior data is retained',
            ],
            expected=[
                'Each step validates required fields before advancing',
                'Back navigation preserves previously entered data',
                'Finishing the wizard creates the organization in the database',
                'User is redirected to /dashboard with their new org context',
                'Dashboard shows the org name just created',
            ],
        ),
    },
    17: {
        'title': '[Use Case]: Custom registration form builder',
        'body': compose(
            objective='An admin can open the form builder, add/remove/reorder custom fields, save the configuration, and have those fields appear on the public registration page.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"form-builder-test"}')
echo $SEED | jq '{orgSlug, contactEmail, organizationId}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Navigate to: http://localhost:7777/dashboard/form-builder''',
            steps=[
                'Log in and navigate to http://localhost:7777/dashboard/form-builder',
                'Click **Add Field** and add a Text field with label "T-Shirt Size"',
                'Click **Add Field** again and add a Dropdown field with options: S, M, L, XL',
                'Drag the Dropdown field above the Text field to reorder',
                'Click **Save**',
                'Navigate to the public registration page: http://localhost:7777/register/<orgSlug>/<qrLabel>',
                'Verify the custom fields appear on the registration form',
                '**Edge case:** Delete one custom field, save, and verify it no longer appears on the public form',
                '**Edge case:** Add a Required field and verify the public form enforces it',
            ],
            expected=[
                'Form builder loads with existing fields displayed',
                'New fields can be added, labeled, and configured',
                'Drag-and-drop reordering persists after save',
                'Saved configuration is reflected immediately on the public registration page',
                'Required fields are enforced on the public form',
                'Deleted fields no longer appear on the public form',
            ],
        ),
    },
    18: {
        'title': '[Use Case]: QR code generation and management',
        'body': compose(
            objective='An admin can create named QR codes for their event, view them, download/print them, and have each QR code route attendees to the correct registration form.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"qr-test"}')
echo $SEED | jq '{orgSlug, contactEmail, qrCodes}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Navigate to: http://localhost:7777/dashboard/qr-codes''',
            steps=[
                'Log in and navigate to http://localhost:7777/dashboard/qr-codes',
                'Click **Create QR Code** and enter label "main-entrance"',
                'Click **Save** and verify the new QR appears in the list',
                'Click the QR code image to enlarge / download it',
                'Copy the URL encoded in the QR (should be /register/<orgSlug>/main-entrance)',
                'Open that URL in the browser and verify the registration form loads',
                '**Edge case:** Create a QR with a duplicate label and verify an error is shown',
                '**Edge case:** Delete a QR code and verify navigating to its URL returns 404 or a graceful error page',
            ],
            expected=[
                'QR codes are generated instantly on save',
                'Each QR encodes the correct /register/<orgSlug>/<label> URL',
                'QR image is downloadable/printable',
                'Duplicate label is rejected with a clear error',
                'Deleted QR URLs no longer serve the registration form',
            ],
        ),
    },
    19: {
        'title': '[Use Case]: Public QR-triggered attendee registration',
        'body': compose(
            objective='An attendee scans a QR code, fills in the public registration form with any custom fields, submits it, and is redirected to the success page — no login required.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"reg-flow-test"}')
echo $SEED | jq '{orgSlug, contactEmail, qrCodes}'
# Use qrCodes[0].label for <qrLabel>
```

- Dev server running: `npm run dev` (http://localhost:7777)
- **No auth cookies needed** — this is a public page
- URL pattern: http://localhost:7777/register/<orgSlug>/<qrLabel>''',
            steps=[
                'Open http://localhost:7777/register/<orgSlug>/<qrLabel> in an incognito window (no cookies)',
                'Verify the registration form loads with the org\'s branding and custom fields',
                'Fill in First Name: "Playwright", Last Name: "User", Email: unique test email',
                'Fill in any custom fields shown',
                'Click **Submit**',
                'Verify redirect to /registration-success',
                '**Edge case:** Submit with missing required fields and verify inline validation errors',
                '**Edge case:** Submit the same email twice and verify the response (duplicate or allowed)',
                '**Edge case:** Navigate to /register/<orgSlug>/nonexistent-qr and verify graceful 404',
            ],
            expected=[
                'Registration form loads without requiring login',
                'Custom fields configured in form builder are visible',
                'Successful submission redirects to /registration-success',
                'Success page shows a check-in QR code',
                'Missing required fields show validation errors',
                'Invalid QR label returns a graceful error page',
            ],
        ),
    },
    20: {
        'title': '[Use Case]: Registration success page and check-in QR delivery',
        'body': compose(
            objective='After a successful registration submission, the attendee sees a success page containing their personalized check-in QR code that staff can scan at the event.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"success-page-test"}')
echo $SEED | jq '{orgSlug, contactEmail, qrCodes}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Complete a registration via /register/<orgSlug>/<qrLabel> first
- Or navigate directly to /registration-success?token=<token> if you have a token''',
            steps=[
                'Complete a registration at http://localhost:7777/register/<orgSlug>/<qrLabel>',
                'Observe the redirect to /registration-success',
                'Verify a personalized check-in QR code is displayed on the page',
                'Verify the QR encodes a /check-in/<token> URL',
                'Open the /check-in/<token> URL in another browser tab and verify it loads the check-in confirmation',
                '**Edge case:** Reload the success page and verify the QR is still shown (session persistence)',
                '**Edge case:** Navigate directly to /registration-success without completing a form and verify graceful handling',
            ],
            expected=[
                'Success page displays immediately after form submission',
                'A personalized check-in QR code is visible',
                'QR encodes a unique /check-in/<token> URL',
                'Scanning or opening the check-in URL loads the check-in confirmation',
                'Success page is accessible after a page reload',
            ],
        ),
    },
    21: {
        'title': '[Use Case]: Staff check-in dashboard (scan, search, browse)',
        'body': compose(
            objective='A staff member can open the check-in dashboard, search for attendees by name or email, browse the registrant list, and manually mark attendees as checked in.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"checkin-staff-test"}')
echo $SEED | jq '{orgSlug, contactEmail, organizationId}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Navigate to: http://localhost:7777/dashboard/check-in''',
            steps=[
                'Log in and navigate to http://localhost:7777/dashboard/check-in',
                'Verify the registrant list loads with at least one attendee from the seed',
                'Use the search box to search for "Playwright" — verify filtered results',
                'Click on a registrant row to open their detail view',
                'Click **Check In** to mark them as checked in',
                'Verify the check-in status updates in the list (green badge or similar)',
                '**Edge case:** Search for a non-existent name and verify empty-state message',
                '**Edge case:** Try to check in an already-checked-in attendee and verify the UI response',
            ],
            expected=[
                'Registrant list loads and is paginated or scrollable',
                'Search filters results in real-time or on submit',
                'Check-in action updates the attendee\'s status immediately',
                'Already-checked-in attendees are visually distinguished',
                'Empty search returns a clear "no results" message',
            ],
        ),
    },
    22: {
        'title': '[Use Case]: Token-based check-in flow (/check-in/[token])',
        'body': compose(
            objective='An attendee navigates to their unique /check-in/[token] URL (from their registration QR) and the system records their check-in and shows a confirmation.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"token-checkin-test"}')
echo $SEED | jq '{orgSlug, contactEmail}'
# Then complete a registration to get a check-in token
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Complete a registration at /register/<orgSlug>/<qrLabel> to obtain a token
- Token is embedded in the QR shown on the success page''',
            steps=[
                'Complete a registration at http://localhost:7777/register/<orgSlug>/<qrLabel>',
                'On the success page, note the /check-in/<token> URL from the QR code',
                'Open http://localhost:7777/check-in/<token> in a new incognito tab',
                'Verify the page shows a check-in confirmation with the attendee\'s name',
                'Check the staff dashboard (http://localhost:7777/dashboard/check-in) and verify the attendee is now marked as checked in',
                '**Edge case:** Open the same /check-in/<token> URL a second time and verify it handles the duplicate gracefully',
                '**Edge case:** Navigate to /check-in/invalid-token and verify a graceful error page',
            ],
            expected=[
                'Valid token URL shows a check-in confirmation page',
                'Attendee is marked as checked in in the staff dashboard',
                'Second scan of the same token shows "already checked in" message',
                'Invalid token returns a graceful error page (not a 500)',
            ],
        ),
    },
    23: {
        'title': '[Use Case]: Dashboard overview — stats, analytics, recent activity',
        'body': compose(
            objective='A logged-in admin can view the dashboard overview showing registration counts, check-in rates, recent activity, and key metrics for their organization.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"dashboard-test"}')
echo $SEED | jq '{orgSlug, contactEmail, organizationId}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Navigate to: http://localhost:7777/dashboard''',
            steps=[
                'Log in and navigate to http://localhost:7777/dashboard',
                'Verify the overview cards load: total registrations, check-ins, QR codes, etc.',
                'Verify recent activity feed shows the seeded registration',
                'Click a stat card (e.g. "Registrations") and verify it navigates to the detail view',
                '**Edge case:** Log in as a brand-new org with zero data and verify the dashboard shows empty-state prompts, not zeros or errors',
            ],
            expected=[
                'Dashboard loads within 3 seconds',
                'Stat cards show accurate counts matching the seeded data',
                'Recent activity feed lists the most recent registrations',
                'Clicking a card navigates to the corresponding detail page',
                'Empty-state org shows helpful onboarding prompts',
            ],
        ),
    },
    24: {
        'title': '[Use Case]: Registration management, detail view, and CSV/PDF export',
        'body': compose(
            objective='An admin can view all registrations, open an individual registration detail, and export the full registration list as CSV or PDF.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"reg-mgmt-test"}')
echo $SEED | jq '{orgSlug, contactEmail, organizationId}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Navigate to: http://localhost:7777/dashboard/registrations''',
            steps=[
                'Log in and navigate to http://localhost:7777/dashboard/registrations',
                'Verify the registrations table loads with the seeded attendee',
                'Click the seeded attendee row to open the detail view',
                'Verify all fields (name, email, custom fields, check-in status) are shown',
                'Return to the list and click **Export CSV**',
                'Verify a CSV file downloads with correct headers and data',
                'Click **Export PDF** and verify a PDF downloads',
                '**Edge case:** Filter by check-in status "Checked In" and verify only checked-in attendees appear',
            ],
            expected=[
                'Registrations table loads with accurate data',
                'Detail view shows all registration fields including custom fields',
                'CSV export downloads with all columns and correct values',
                'PDF export is readable and formatted correctly',
                'Filters narrow the list accurately',
            ],
        ),
    },
    25: {
        'title': '[Use Case]: Multi-organization support and switching',
        'body': compose(
            objective='A user who belongs to multiple organizations can switch between them from the dashboard, and all data displayed reflects the selected organization.',
            prerequisites='''## Prerequisites

```bash
# Create two orgs with the same email
SEED1=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"multi-org-1"}')
SEED2=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"multi-org-2","contactEmail":"'$(echo $SEED1 | jq -r .contactEmail)'"}')
echo $SEED1 | jq '{orgSlug, contactEmail}'
echo $SEED2 | jq '{orgSlug}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail from SEED1>`''',
            steps=[
                'Log in as a user belonging to two organizations',
                'Navigate to http://localhost:7777/dashboard',
                'Locate the org switcher (top nav or sidebar) and verify both orgs are listed',
                'Click the second organization name to switch',
                'Verify the dashboard data changes to reflect org 2\'s registrations',
                'Navigate to /dashboard/registrations and verify only org 2\'s registrations appear',
                '**Edge case:** Switch back to org 1 and verify data reverts correctly',
            ],
            expected=[
                'Org switcher shows all organizations the user belongs to',
                'Switching org updates all dashboard data immediately',
                'Navigation between pages retains the selected org context',
                'Data from org 1 is never shown while org 2 is selected',
            ],
        ),
    },
    26: {
        'title': '[Use Case]: Subscription plans, checkout, and plan management',
        'body': compose(
            objective='An admin can view available subscription plans, initiate a checkout, complete payment, and see their subscription status updated in the dashboard.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"subscription-test"}')
echo $SEED | jq '{orgSlug, contactEmail, organizationId}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Stripe test mode must be configured (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY)
- Test card: 4242 4242 4242 4242, any future expiry, any CVC''',
            steps=[
                'Log in and navigate to http://localhost:7777/dashboard/subscription',
                'Verify the current plan is shown (free/trial)',
                'Click **Upgrade** or **Choose Plan**',
                'Select a paid plan and click **Checkout**',
                'On the Stripe checkout page, enter test card: 4242 4242 4242 4242',
                'Complete the payment',
                'Verify redirect back to the app with subscription success message',
                'Navigate to /dashboard/subscription and verify the plan is now upgraded',
                '**Edge case:** Use a declined card (4000 0000 0000 0002) and verify graceful error handling',
            ],
            expected=[
                'Plan selection page shows all available tiers with pricing',
                'Stripe checkout loads securely',
                'Successful payment updates subscription status immediately',
                'Declined card shows a clear error message without losing the form',
                'Subscription page reflects the new plan after successful payment',
            ],
        ),
    },
    27: {
        'title': '[Use Case]: Coupon code validation and application at checkout',
        'body': compose(
            objective='During checkout, a user can enter a valid coupon code, see the discount applied to their total, and complete the purchase at the discounted price.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"coupon-checkout-test"}')
echo $SEED | jq '{orgSlug, contactEmail}'
# Note the coupon code returned or create one via admin panel first
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- A valid coupon code must exist (create via /dashboard/coupons or seed)''',
            steps=[
                'Log in and navigate to the subscription checkout page',
                'Locate the coupon code input field',
                'Enter a valid coupon code and click **Apply**',
                'Verify the discount amount is shown and the total is reduced',
                'Complete checkout with test card: 4242 4242 4242 4242',
                'Verify the charge reflects the discounted amount',
                '**Edge case:** Enter an invalid coupon code and verify "Invalid code" error',
                '**Edge case:** Enter an expired coupon code and verify "Expired" error',
                '**Edge case:** Enter a coupon that has reached its usage limit and verify appropriate error',
            ],
            expected=[
                'Valid coupon applies immediately and shows discount breakdown',
                'Final charge matches the discounted price',
                'Invalid/expired/maxed-out coupons show distinct, clear error messages',
                'Checkout completes successfully with the coupon discount applied',
            ],
        ),
    },
    28: {
        'title': '[Use Case]: Super-admin dashboard — system-wide stats and org management',
        'body': compose(
            objective='A super-admin user can access the admin panel, view system-wide statistics across all organizations, and manage individual organizations (view, suspend, delete).',
            prerequisites='''## Prerequisites

- Dev server running: `npm run dev` (http://localhost:7777)
- Super-admin account required — check `.env.local` for `SUPER_ADMIN_EMAIL` or set `bb_test_auth=1; bb_test_email=<super-admin-email>`
- At least 2 organizations must exist (run seed twice with different keys)

```bash
curl -s -X POST http://localhost:7777/api/test/seed -H 'Content-Type: application/json' -d '{"seedKey":"sa-org-1"}' | jq .orgSlug
curl -s -X POST http://localhost:7777/api/test/seed -H 'Content-Type: application/json' -d '{"seedKey":"sa-org-2"}' | jq .orgSlug
```''',
            steps=[
                'Log in as a super-admin user',
                'Navigate to http://localhost:7777/admin (or /dashboard/admin)',
                'Verify system-wide stats are shown: total orgs, total registrations, total users',
                'Click into an individual organization to view its details',
                'Verify org detail shows registration count, plan, and admin users',
                '**Edge case:** Attempt to access /admin as a non-super-admin and verify 403 / redirect',
            ],
            expected=[
                'Admin panel is accessible only to super-admin users',
                'System-wide stats aggregate across all organizations accurately',
                'Individual org view shows complete org data',
                'Non-super-admin access returns 403 or redirects to dashboard',
            ],
        ),
    },
    29: {
        'title': '[Use Case]: Admin coupon management (create, edit, analytics)',
        'body': compose(
            objective='An admin can create new coupon codes with discount type, amount, and usage limits; edit existing coupons; view redemption analytics; and delete coupons.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"coupon-admin-test"}')
echo $SEED | jq '{orgSlug, contactEmail, organizationId}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Navigate to: http://localhost:7777/dashboard/coupons''',
            steps=[
                'Log in and navigate to http://localhost:7777/dashboard/coupons',
                'Click **Create Coupon**',
                'Fill in: Code "SAVE20", Type "Percentage", Amount "20", Max Uses "100"',
                'Set expiry date to 30 days from today and click **Save**',
                'Verify the coupon appears in the list with correct details',
                'Click the coupon to edit it — change Max Uses to "50" and save',
                'Verify the updated value is reflected in the list',
                'View the analytics/redemption count for the coupon',
                '**Edge case:** Create a coupon with a duplicate code and verify an error is shown',
                '**Edge case:** Delete a coupon and verify it no longer appears',
            ],
            expected=[
                'Coupon is created and listed immediately',
                'Edit saves correctly and reflects in the list',
                'Analytics show redemption count (0 for new coupons)',
                'Duplicate coupon code is rejected with a clear error',
                'Deleted coupon disappears from the list and cannot be applied at checkout',
            ],
        ),
    },
    30: {
        'title': '[Use Case]: Classes and participant enrollment management',
        'body': compose(
            objective='An admin can create classes/events, view enrolled participants, and manage enrollment — including manual enrollment and removal of participants.',
            prerequisites='''## Prerequisites

```bash
SEED=$(curl -s -X POST http://localhost:7777/api/test/seed \\
  -H 'Content-Type: application/json' \\
  -d '{"seedKey":"classes-test"}')
echo $SEED | jq '{orgSlug, contactEmail, classId, organizationId}'
```

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<contactEmail>`
- Navigate to: http://localhost:7777/dashboard/classes''',
            steps=[
                'Log in and navigate to http://localhost:7777/dashboard/classes',
                'Verify the seeded class appears in the list',
                'Click the class to open its detail/enrollment view',
                'Verify the participant list shows seeded enrollments',
                'Click **Add Participant** and add a test email manually',
                'Verify the new participant appears in the list',
                'Select a participant and click **Remove** — verify they are removed',
                '**Edge case:** Create a new class with a capacity limit and try to exceed it',
                '**Edge case:** Add a participant who is already enrolled and verify the duplicate handling',
            ],
            expected=[
                'Classes list loads with accurate participant counts',
                'Class detail shows all enrolled participants',
                'Manual enrollment adds the participant immediately',
                'Removal updates the list without a page reload',
                'Capacity limits are enforced at enrollment',
                'Duplicate enrollment is handled gracefully',
            ],
        ),
    },
    31: {
        'title': '[Use Case]: System health diagnostics and monitoring',
        'body': compose(
            objective='The system exposes a health endpoint and an admin can view a diagnostics page showing service status, environment config, and recent error counts.',
            prerequisites='''## Prerequisites

- Dev server running: `npm run dev` (http://localhost:7777)
- Set cookies: `bb_test_auth=1; bb_test_email=<admin-email>` (super-admin preferred)

```bash
# Quick API health check
curl -s http://localhost:7777/api/health | jq .
```''',
            steps=[
                'Run: `curl -s http://localhost:7777/api/health | jq .` and verify `{"status":"ok"}` (or similar)',
                'Log in as admin and navigate to http://localhost:7777/dashboard/diagnostics (if available)',
                'Verify service statuses are shown: database, email, storage',
                'Verify environment indicators show expected values (region, node version, etc.)',
                '**Edge case:** Check the health endpoint response time is under 500ms',
                '**Edge case:** Verify the health endpoint is accessible without authentication',
            ],
            expected=[
                '/api/health returns 200 with status: ok',
                'Health endpoint responds in under 500ms',
                'Health endpoint requires no authentication',
                'Diagnostics page (if present) shows all services as healthy',
                'Error counts are shown accurately',
            ],
        ),
    },
    32: {
        'title': '[Use Case]: In-app bug report submission',
        'body': compose(
            objective='A logged-in user can open the Traklet QA widget, browse open issues, view a use-case test guide, and submit a bug report with a Jam.dev recording link.',
            prerequisites='''## Prerequisites

- `NEXT_PUBLIC_TRAKLET_ENABLED=true` must be set in `.env.local`
- `TRAKLET_PAT` must be set (GitHub PAT with repo read/write access)
- Dev server running: `npm run dev` (http://localhost:7777)
- Optional: Install [Jam.dev browser extension](https://jam.dev) for recording

```bash
# Verify the proxy endpoint is working
curl -s http://localhost:7777/api/dev/traklet-proxy/repos/rvegajr/blessbox/issues | jq '.[0].title'
```''',
            steps=[
                'Navigate to http://localhost:7777/dashboard',
                'Verify the Traklet QA widget appears in the top-right corner of the screen',
                'Click the widget icon to open it',
                'Verify the issue list loads and shows BlessBox use-case issues',
                'Click an issue to open the guided test view',
                'Verify the Objective, Prerequisites, Steps, Expected Result sections are shown',
                'Click **Submit Result** or the feedback action',
                'Paste a Jam.dev recording URL in the Evidence field',
                'Submit and verify the issue body is updated with the evidence',
                '**Edge case:** Disable `NEXT_PUBLIC_TRAKLET_ENABLED` and verify the widget does not appear',
            ],
            expected=[
                'Traklet widget appears top-right when enabled',
                'Issue list loads from GitHub via the proxy',
                'Guided test view shows all sections from the use-case template',
                'Evidence field accepts a Jam.dev URL',
                'Widget is completely absent when disabled',
            ],
        ),
    },
    33: {
        'title': '[Use Case]: Public landing page and product marketing',
        'body': compose(
            objective='An unauthenticated visitor lands on blessbox.org, reads the product value proposition, clicks a CTA, and is taken to the signup/login flow.',
            prerequisites='''## Prerequisites

- Dev server running: `npm run dev` (http://localhost:7777)
- **No auth cookies** — test in incognito mode
- Production check: https://www.blessbox.org''',
            steps=[
                'Open http://localhost:7777 in an incognito window (no cookies)',
                'Verify the landing page loads with hero section and product description',
                'Scroll through the page and verify all sections render (features, pricing, CTA)',
                'Click the primary CTA button (e.g. "Get Started" or "Sign Up Free")',
                'Verify redirect to /login or /signup',
                'Verify the page is mobile-responsive at 375px width',
                '**Edge case:** Load the page while logged in and verify any "dashboard" shortcut or redirect',
                '**SEO check:** View page source and verify og:title, og:description, and meta description are present',
            ],
            expected=[
                'Landing page loads in under 2 seconds',
                'All sections render without layout breaks',
                'Primary CTA navigates to the login/signup flow',
                'Page is fully responsive on mobile (375px)',
                'og: meta tags are present for social sharing',
                'Logged-in users see a link to their dashboard',
            ],
        ),
    },
}

def update_issue(number, data):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.md', delete=False) as f:
        f.write(data['body'])
        tmp = f.name
    try:
        result = subprocess.run(
            ['gh', 'issue', 'edit', str(number), '--body-file', tmp],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f'  ERROR #{number}: {result.stderr.strip()}', file=sys.stderr)
            return False
        print(f'  ✅ #{number}: {data["title"]}')
        return True
    finally:
        os.unlink(tmp)

def main():
    print(f'Updating {len(ISSUES)} issues to Traklet structured format...\n')
    ok = err = 0
    for number in sorted(ISSUES):
        if update_issue(number, ISSUES[number]):
            ok += 1
        else:
            err += 1
    print(f'\nDone: {ok} updated, {err} errors')

if __name__ == '__main__':
    main()
