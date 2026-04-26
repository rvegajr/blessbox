import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PROD = 'https://www.blessbox.org';
const DEV = 'https://bless-box-git-develop-rvegajrs-projects.vercel.app';
const OUT = '/Users/admin/Dev/YOLOProjects/BlessBox/qa-report/ui-diff/shots';
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  { slug: 'home', path: '/' },
  { slug: 'pricing', path: '/pricing' },
  { slug: 'login', path: '/login' },
  { slug: 'register-orgslug', path: '/register/demo/door-a' },
  { slug: 'onboarding-email', path: '/onboarding/email-verification' },
  { slug: 'onboarding-org', path: '/onboarding/organization-setup' },
  { slug: 'onboarding-form', path: '/onboarding/form-builder' },
  { slug: 'onboarding-qr', path: '/onboarding/qr-configuration' },
  { slug: 'select-org', path: '/select-organization' },
  { slug: 'dashboard', path: '/dashboard' },
  { slug: 'report-bug', path: '/report-bug' },
];

const SIZES = [
  { name: 'mobile', viewport: { width: 390, height: 844 } },
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
];

for (const size of SIZES) {
  for (const page of PAGES) {
    test(`${size.name} ${page.slug}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: size.viewport });
      const tab = await ctx.newPage();
      const errors: string[] = [];
      tab.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      tab.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

      for (const [label, base] of [['prod', PROD], ['dev', DEV]] as const) {
        const url = `${base}${page.path}`;
        try {
          await tab.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
        } catch (e: any) {
          fs.appendFileSync(path.join(OUT, '_errors.log'), `${label} ${page.slug} ${size.name}: nav ${e.message}\n`);
          continue;
        }
        await tab.waitForTimeout(800);
        await tab.screenshot({
          path: path.join(OUT, `${page.slug}_${size.name}_${label}.png`),
          fullPage: true,
        });
      }
      await ctx.close();
      if (errors.length) fs.appendFileSync(path.join(OUT, '_errors.log'), `${page.slug} ${size.name}:\n  ${errors.join('\n  ')}\n`);
    });
  }
}
