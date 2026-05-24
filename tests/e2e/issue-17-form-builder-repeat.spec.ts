/**
 * Issue #17 RETEST: Custom Registration Form Builder
 *
 * Source: GitHub Issue #17 (label: "retest")
 * Reporter: Aracela (QA)
 *
 * Two regressions reported in the latest QA notes:
 *
 *   1) "Provided fields on event type are only reflected when refreshed,
 *      not when a choice is picked."
 *      → Switching the event type select on /onboarding/form-builder must
 *        live-update the form fields below to match the chosen template.
 *
 *   2) "No field for 'Event Name' … the events page filter shows
 *      'Registration Form' instead of the actual event name."
 *      → The form builder must expose an explicit, distinct "Event Name"
 *        input (not just a generic "Form Title") so that organizers
 *        understand they are naming the event, not a piece of UI.
 *      → The default name on a freshly-picked event type must be the
 *        template's defaultName (e.g. "Food Distribution"), not the
 *        literal string "Registration Form".
 *
 * These tests are RED-first: they describe the expected fixed behavior
 * and will fail against today's code. They drive the implementation.
 *
 * Local:      BASE_URL=http://localhost:7777 npx playwright test issue-17-form-builder-repeat.spec.ts
 * Production: TEST_ENV=production BASE_URL=https://www.blessbox.org npx playwright test issue-17-form-builder-repeat.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';
import { loginAsUser, seedOrg } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

async function gotoOnboardingFormBuilder(page: Page, organizationId: string, contactEmail: string) {
  // Onboarding pages also read from local/sessionStorage, mirror the existing
  // form-builder-regression spec so we land on the page authenticated and
  // with the org context populated.
  await page.goto(BASE_URL);
  await page.evaluate(
    ({ organizationId, contactEmail }: { organizationId: string; contactEmail: string }) => {
      localStorage.setItem('onboarding_organizationId', organizationId);
      localStorage.setItem('onboarding_contactEmail', contactEmail);
      localStorage.setItem('onboarding_emailVerified', 'true');
      sessionStorage.setItem('onboarding_organizationId', organizationId);
      sessionStorage.setItem('onboarding_contactEmail', contactEmail);
      sessionStorage.setItem('onboarding_emailVerified', 'true');
      // Start from the default 'custom' so each test exercises the change.
      localStorage.removeItem('onboarding_eventType');
      localStorage.removeItem('onboarding_formData');
    },
    { organizationId, contactEmail }
  );

  await page.goto(`${BASE_URL}/onboarding/form-builder`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('[data-testid="form-builder-wizard"]', { timeout: 15000 });
}

test.describe('Issue #17 (retest): Form builder reactivity', () => {
  test('Bug 1: changing the event type select updates form fields without a page refresh', async ({ page }) => {
    const seed = await seedOrg(page, `i17-reactivity-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    await gotoOnboardingFormBuilder(page, seed.organizationId, seed.contactEmail);

    // Initial event type is "custom" → the custom template has 2 fields
    // (Full Name + Email Address). Pick "food_distribution" — the food
    // template has 4 fields (Full Name, Phone, Family Size, Role).
    await page.getByTestId('select-event-type').selectOption('food_distribution');

    // The food-distribution template's signature fields must appear LIVE.
    // We assert via a label exclusive to the food template so the test
    // can't pass just because Full Name happens to live in every template.
    const familySizeLabel = page
      .getByTestId('form-builder-wizard')
      .locator('input[value="Family Size"]');
    await expect(familySizeLabel).toBeVisible({ timeout: 5000 });

    // Switch again to seminar. Seminar template has Email Address (the
    // food_distribution template does NOT). After the previous bug, the
    // user had to refresh the whole page to see this swap.
    await page.getByTestId('select-event-type').selectOption('seminar');

    // family_size must disappear, email must appear — both without refresh.
    await expect(familySizeLabel).toHaveCount(0, { timeout: 5000 });
    const emailLabel = page
      .getByTestId('form-builder-wizard')
      .locator('input[value="Email Address"]');
    await expect(emailLabel).toBeVisible({ timeout: 5000 });
  });

  test('Bug 1b: switching event type after the user manually edited a field PRESERVES the customization (no silent data loss)', async ({
    page,
  }) => {
    const seed = await seedOrg(page, `i17-confirm-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    await gotoOnboardingFormBuilder(page, seed.organizationId, seed.contactEmail);

    // Pick a template, then customize one of its fields with a unique label
    // so we can prove it survives the next event-type change.
    await page.getByTestId('select-event-type').selectOption('food_distribution');
    const fullNameInput = page
      .getByTestId('form-builder-wizard')
      .locator('input[value="Full Name"]')
      .first();
    await fullNameInput.fill('Recipient Name (custom)');

    // Switch templates. The bug we're guarding against was the OPPOSITE:
    // the old code silently kept the old template's field set (no swap)
    // and the user had to refresh to see anything change. Our fix preserves
    // user edits when present (no destructive overwrite). Seeing a label
    // typed by the user still on screen after the swap proves we did not
    // silently destroy their work.
    await page.getByTestId('select-event-type').selectOption('seminar');

    const customizedField = page
      .getByTestId('form-builder-wizard')
      .locator('input[value="Recipient Name (custom)"]');
    await expect(customizedField).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Issue #17 (retest): Event Name vs Form Title', () => {
  test('Bug 2: the form builder exposes an explicit "Event Name" input (not the generic "Form Title")', async ({
    page,
  }) => {
    const seed = await seedOrg(page, `i17-event-name-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    await gotoOnboardingFormBuilder(page, seed.organizationId, seed.contactEmail);

    // The fix must add a dedicated, testid-stable Event Name field.
    // We assert on data-testid rather than label text so renaming the
    // copy doesn't break the test.
    const eventNameInput = page.getByTestId('input-event-name');
    await expect(eventNameInput).toBeVisible({ timeout: 5000 });
    await expect(eventNameInput).toBeEditable();

    // The placeholder/help text should make it clear this is the event
    // name shown on the dashboard, not just a form heading.
    const accessibleLabel =
      (await eventNameInput.getAttribute('aria-label')) ??
      (await eventNameInput.getAttribute('placeholder')) ??
      '';
    expect(accessibleLabel.toLowerCase()).toMatch(/event/);
  });

  test('Bug 2b: when picking an event type, the default Event Name matches the template (not "Registration Form")', async ({
    page,
  }) => {
    const seed = await seedOrg(page, `i17-default-name-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    await gotoOnboardingFormBuilder(page, seed.organizationId, seed.contactEmail);

    await page.getByTestId('select-event-type').selectOption('food_distribution');

    const eventNameInput = page.getByTestId('input-event-name');
    await expect(eventNameInput).toHaveValue(/food distribution/i, { timeout: 5000 });

    await page.getByTestId('select-event-type').selectOption('volunteer');
    await expect(eventNameInput).toHaveValue(/volunteer/i, { timeout: 5000 });
  });

  test('Bug 2c: the saved event name flows through to GET /api/events (dashboard event filter)', async ({
    page,
  }) => {
    const seed = await seedOrg(page, `i17-flow-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    await gotoOnboardingFormBuilder(page, seed.organizationId, seed.contactEmail);

    // Pick a template and explicitly name the event so we have a unique value
    // we can grep for via the events API.
    await page.getByTestId('select-event-type').selectOption('food_distribution');
    const uniqueName = `QA Food Drive ${Date.now()}`;
    const eventNameInput = page.getByTestId('input-event-name');
    await eventNameInput.fill(uniqueName);

    // Save. Either Save changes / Next button works — use whichever is present.
    const saveButton = page.getByTestId('btn-next').or(page.getByTestId('btn-save-form'));
    await saveButton.first().click();

    // Wait for navigation away from /onboarding/form-builder OR a "Saved" indicator.
    await Promise.race([
      page.waitForURL((url) => !/\/onboarding\/form-builder$/.test(url.pathname), { timeout: 30000 }),
      page.waitForSelector('text=Saved', { timeout: 30000 }).catch(() => null),
    ]);

    // Now hit the events API directly and verify the event is named correctly.
    const eventsResp = await page.request.get(
      `${BASE_URL}/api/events?organizationId=${seed.organizationId}`
    );
    expect(eventsResp.ok()).toBeTruthy();
    const eventsBody = await eventsResp.json();
    const events: Array<{ name: string }> = eventsBody.events || [];

    expect(events.some((e) => e.name === uniqueName)).toBeTruthy();
    expect(events.every((e) => e.name !== 'Registration Form')).toBeTruthy();
  });
});
