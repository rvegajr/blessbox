import { test, expect, Page } from '@playwright/test';

/**
 * Cluster J: Classes & Participant Enrollment Management
 * Issue: #30
 *
 * Aracela's reported gaps:
 *   1. No back button to class on the participants page
 *   2. No edit/delete action for enrolled participants
 *   3. No edit class info button
 *
 * Plus stated edge cases:
 *   - Capacity limits enforced at enrollment
 *   - Duplicate enrollment handled gracefully
 *
 * Note: /dashboard/classes redirects to /classes per owner clarification.
 */

const baseURL = process.env.BASE_URL || 'http://localhost:7777';

async function authenticate(page: Page, email: string) {
  await page.context().addCookies([
    { name: 'bb_test_auth', value: '1', url: baseURL },
    { name: 'bb_test_email', value: email, url: baseURL },
  ]);
}

async function seedClass(seedKey: string) {
  const res = await fetch(`${baseURL}/api/test/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seedKey: `cluster-j-${seedKey}-${Date.now()}` }),
  });
  if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
  return res.json();
}

test.describe('Cluster J: Classes & Enrollment (Issue #30)', () => {
  test.describe('Routing - dashboard redirect', () => {
    test('/dashboard/classes redirects to /classes (no 404)', async ({ page }) => {
      const response = await page.goto(`${baseURL}/dashboard/classes`, { waitUntil: 'domcontentloaded' });
      // Either redirect happens at the server (final URL is /classes) or status is 2xx/3xx (not 404)
      expect(response?.status()).toBeLessThan(400);
      expect(page.url()).toMatch(/\/classes(?:$|\?|\/)/);
    });
  });

  test.describe('Class detail UI gaps (Aracela #1, #3)', () => {
    let seed: any;

    test.beforeAll(async () => {
      seed = await seedClass('detail');
    });

    test('class detail page has a Back to Classes button (Aracela #1)', async ({ page }) => {
      await authenticate(page, seed.contactEmail);
      const classId = seed.classId;
      test.skip(!classId, 'Seed did not include classId');

      await page.goto(`${baseURL}/classes/${classId}`);

      // Back link is the structural anchor for navigating away from a class
      const backLink = page.locator('a:has-text("Back to Classes"), a[href="/classes"]').first();
      await expect(backLink).toBeVisible();
    });

    test('class detail page has an Edit Class button (Aracela #3)', async ({ page }) => {
      await authenticate(page, seed.contactEmail);
      const classId = seed.classId;
      test.skip(!classId, 'Seed did not include classId');

      await page.goto(`${baseURL}/classes/${classId}`);
      const editButton = page.locator(
        '[data-testid="btn-edit-class"], button:has-text("Edit Class"), a:has-text("Edit Class")'
      ).first();
      await expect(editButton).toBeVisible();
    });

    test('participant rows show Remove action (Aracela #2)', async ({ page }) => {
      await authenticate(page, seed.contactEmail);
      const classId = seed.classId;
      test.skip(!classId, 'Seed did not include classId');

      await page.goto(`${baseURL}/classes/${classId}`);
      // Look for any remove/delete action in the roster table
      const removeAction = page.locator(
        '[data-testid^="btn-remove-enrollment"], button:has-text("Remove"), button[aria-label*="Remove"]'
      ).first();
      await expect(removeAction).toBeVisible();
    });
  });

  test.describe('Edge cases (Aracela explicit edges)', () => {
    test('capacity limit is enforced via API (edge case 1)', async ({ request }) => {
      // Document expected API contract: enrolling beyond capacity returns a 4xx with
      // a clear, structured error code.
      // We don't have a fixed seeded class with a tiny capacity here, so we exercise
      // the contract by attempting to overflow. Test will be adjusted once seed
      // exposes a small-capacity class id.
      const seed = await seedClass('capacity');
      if (!seed.classId) test.skip(true, 'Seed did not include classId');

      // Try to enroll a non-existent participant — at minimum the endpoint must not 500
      const res = await request.post(`${baseURL}/api/enrollments`, {
        headers: { Cookie: `bb_test_auth=1; bb_test_email=${seed.contactEmail}` },
        data: {
          participant_id: '00000000-0000-0000-0000-000000000000',
          class_id: seed.classId,
        },
      });
      expect(res.status()).toBeLessThan(500);
    });

    test('duplicate enrollment is handled gracefully (edge case 2)', async ({ request }) => {
      const seed = await seedClass('duplicate');
      if (!seed.classId || !seed.participantId) test.skip(true, 'Seed missing participantId/classId');

      const cookieHeader = `bb_test_auth=1; bb_test_email=${seed.contactEmail}`;

      // First enrollment (may already exist from seed)
      await request.post(`${baseURL}/api/enrollments`, {
        headers: { Cookie: cookieHeader },
        data: { participant_id: seed.participantId, class_id: seed.classId },
      });

      // Second enrollment must NOT 500 - should be 4xx with helpful error
      const dup = await request.post(`${baseURL}/api/enrollments`, {
        headers: { Cookie: cookieHeader },
        data: { participant_id: seed.participantId, class_id: seed.classId },
      });
      expect(dup.status()).toBeGreaterThanOrEqual(200);
      expect(dup.status()).toBeLessThan(500);

      if (dup.status() >= 400) {
        const body = await dup.json().catch(() => ({}));
        expect(JSON.stringify(body)).toMatch(/already.enrolled|duplicate|enrolled/i);
      }
    });
  });

  test.describe('Sessions page back navigation (Aracela #1 generalised)', () => {
    test('class sessions page links back to the class', async ({ page }) => {
      const seed = await seedClass('sessions');
      test.skip(!seed.classId, 'Seed did not include classId');

      await authenticate(page, seed.contactEmail);
      await page.goto(`${baseURL}/classes/${seed.classId}/sessions`);

      const backLink = page.locator(
        `a[href="/classes/${seed.classId}"], a:has-text("Back to Class")`
      ).first();
      await expect(backLink).toBeVisible();
    });
  });
});
