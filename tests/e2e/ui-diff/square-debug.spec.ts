import { test } from '@playwright/test';

test('debug square init on prod checkout', async ({ page }) => {
  const errors: string[] = [];
  const blocked: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => blocked.push(`${r.failure()?.errorText} ${r.url()}`));
  page.on('response', (r) => {
    if (r.status() >= 400) blocked.push(`HTTP ${r.status()} ${r.url()}`);
  });

  test.setTimeout(120_000);
  await page.goto('https://www.blessbox.org/checkout?plan=standard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(8000);

  console.log('=== CONSOLE ===');
  errors.forEach((e) => console.log(e));
  console.log('=== FAILED REQUESTS ===');
  blocked.forEach((b) => console.log(b));
});
