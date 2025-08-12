// Inspect Turso/libsql DB for onboarding persistence
import 'dotenv/config';
import { createClient } from '@libsql/client';

function getClient() {
  const url = process.env.TURSO_DATABASE_URL || 'file:./.tmp/test-db.sqlite';
  const authToken = process.env.TURSO_AUTH_TOKEN || '';
  return createClient({ url, authToken });
}

async function main() {
  const client = getClient();
  const out = {};
  try {
    const orgCount = await client.execute('SELECT COUNT(*) AS c FROM organizations');
    out.organizations = { count: Number(orgCount.rows?.[0]?.c ?? 0) };
  } catch (e) {
    out.organizations = { error: e?.message };
  }

  try {
    const qrCount = await client.execute('SELECT COUNT(*) AS c FROM qr_code_sets');
    out.qr_code_sets = { count: Number(qrCount.rows?.[0]?.c ?? 0) };
  } catch (e) {
    out.qr_code_sets = { error: e?.message };
  }

  try {
    const latestOrgs = await client.execute(
      "SELECT id, name, contact_email, created_at FROM organizations ORDER BY created_at DESC LIMIT 5"
    );
    out.latest_organizations = latestOrgs.rows || [];
  } catch (e) {
    out.latest_organizations = { error: e?.message };
  }

  try {
    const latestQR = await client.execute(
      "SELECT id, organization_id, name, created_at FROM qr_code_sets ORDER BY created_at DESC LIMIT 5"
    );
    out.latest_qr_code_sets = latestQR.rows || [];
  } catch (e) {
    out.latest_qr_code_sets = { error: e?.message };
  }

  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


