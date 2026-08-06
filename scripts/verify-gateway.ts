/**
 * Noctusoft gateway contract verification (runbook).
 *
 * Exercises the three gateway paths the app depends on, side-effect-free:
 *   1. Square proxy   — GET /v2/locations            (read-only)
 *   2. Order verify   — GET /v2/orders/{fake}         (read-only; expects NOT_FOUND)
 *   3. SendGrid relay  — POST /v3/mail/send           (sandbox_mode: NOT delivered)
 *
 * Uses NOCTUSOFT_DEPLOY_KEY only (the gateway holds the upstream Square/SendGrid
 * credentials). SQUARE_ENVIRONMENT selects sandbox vs production host.
 *
 *   NOCTUSOFT_DEPLOY_KEY=... SQUARE_ENVIRONMENT=sandbox tsx scripts/verify-gateway.ts
 */
const KEY = process.env.NOCTUSOFT_DEPLOY_KEY;
const IS_PROD = process.env.SQUARE_ENVIRONMENT === 'production';
const SQUARE_BASE = IS_PROD ? 'https://connect.squareup.noctusoft.com' : 'https://connect.squareupsandbox.noctusoft.com';
const SQUARE_ENV = IS_PROD ? 'production' : 'sandbox';
const SENDGRID_BASE = process.env.SENDGRID_API_URL || 'https://api.sendgrid.noctusoft.com';
const FROM = process.env.SENDGRID_FROM_EMAIL || 'noreply@blessbox.org';

if (!KEY) {
  console.error('NOCTUSOFT_DEPLOY_KEY is required');
  process.exit(1);
}

const squareHeaders = {
  Authorization: `Bearer ${KEY}`,
  'X-Square-Env': SQUARE_ENV,
  'X-Test-Store': 'blessbox',
  'Content-Type': 'application/json',
  'Square-Version': '2024-10-17',
};

let failures = 0;
const pass = (m: string) => console.log(`  ✅ ${m}`);
const fail = (m: string) => { console.log(`  ❌ ${m}`); failures++; };

async function main(): Promise<void> {
  console.log(`Gateway contract check (${SQUARE_ENV})`);

  // 1. Square proxy auth + forwarding
  console.log('1) Square proxy — GET /v2/locations');
  const loc = await fetch(`${SQUARE_BASE}/v2/locations`, { headers: squareHeaders });
  const locBody = await loc.json().catch(() => ({} as any));
  if (loc.ok && Array.isArray(locBody.locations)) pass(`auth + proxy OK (${locBody.locations.length} location[s])`);
  else fail(`HTTP ${loc.status}: ${JSON.stringify(locBody).slice(0, 200)}`);

  // 2. Order-verify path (NoctusoftOrderVerifier)
  console.log('2) Order verify — GET /v2/orders/{fake}');
  const ord = await fetch(`${SQUARE_BASE}/v2/orders/FAKE_ORDER_CONTRACT_CHECK`, { headers: squareHeaders });
  const ordBody = await ord.json().catch(() => ({} as any));
  if (ord.status === 404 || /not.?found/i.test(JSON.stringify(ordBody))) pass('reaches Square; NOT_FOUND for fake id (verifier -> null)');
  else if (ord.status === 401 || ord.status === 403) fail(`gateway auth failed: HTTP ${ord.status}`);
  else fail(`unexpected HTTP ${ord.status}: ${JSON.stringify(ordBody).slice(0, 200)}`);

  // 3. SendGrid relay (sandbox mode — validates, does not deliver)
  console.log('3) SendGrid relay — POST /v3/mail/send (sandbox_mode)');
  const mail = await fetch(`${SENDGRID_BASE}/v3/mail/send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'X-Test-Store': 'blessbox' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: 'contract-test@blessbox.org' }] }],
      from: { email: FROM, name: 'BlessBox' },
      subject: 'BlessBox gateway contract test',
      content: [{ type: 'text/plain', value: 'gateway contract test — sandbox mode, not delivered' }],
      mail_settings: { sandbox_mode: { enable: true } },
    }),
  });
  if (mail.status >= 200 && mail.status < 300) pass('relay auth + forward + SendGrid validate OK (not delivered)');
  else fail(`HTTP ${mail.status}: ${(await mail.text().catch(() => '')).slice(0, 200)}`);

  console.log(failures === 0 ? '\nALL GATEWAY CONTRACTS OK ✅' : `\n${failures} check(s) FAILED ❌`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error('verify-gateway error:', e); process.exit(1); });
