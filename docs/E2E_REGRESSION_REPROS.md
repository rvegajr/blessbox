# E2E Regression Repro Tests (User-Reported Issues)

## Purpose

This suite exists to **reliably reproduce user-reported UX regressions** so they never get “lost” again:

- Dashboard registrations page can **spin forever** when unauthenticated.
- Onboarding can **lose user-entered data** when navigating Back.

## Running the repro suite

### Non-blocking mode (known failures allowed)

Use this mode while the issues are still being fixed. Tests will run, capture screenshots, and **not break CI**.

```bash
npm run test:e2e:regressions
```

### Strict mode (enforced)

Use this mode after fixes land. Tests must pass; any regression will fail the build.

```bash
npm run test:e2e:regressions:strict
```

## Artifacts

On reproduction, the suite writes screenshots to:

- `test-results/repro-dashboard-registrations-infinite-spinner.png`
- `test-results/repro-onboarding-back-navigation-resets.png`

## What “good” looks like (acceptance criteria)

### Dashboard registrations

When the user is not authenticated, the page must **not** spin indefinitely. It must do one of:

- Redirect to login/auth
- Show “Unauthorized / Please log in”
- Show “Organization selection required”

### Onboarding back-navigation

When the user navigates back during onboarding, either:

- Inputs are restored (draft persisted), **or**
- The UI explicitly warns “progress will be lost” before navigation

Once your chosen behavior is implemented, run strict mode and keep it in CI.

