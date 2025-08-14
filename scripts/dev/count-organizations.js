// Quick org count using libsql; prefers TURSO env, falls back to local file DB
import { createClient } from '@libsql/client';

async function main() {
  const preferLocal = process.env.LOCAL_SQLITE === '1';
  const url = preferLocal
    ? 'file:./.tmp/test-db.sqlite'
    : (process.env.TURSO_DATABASE_URL || 'file:./.tmp/test-db.sqlite');
  const authToken = process.env.TURSO_AUTH_TOKEN || '';
  const client = createClient({ url, authToken });
  try {
    const rs = await client.execute('SELECT COUNT(*) AS c FROM organizations');
    const c = rs.rows?.[0]?.c ?? 0;
    console.log(String(c));
  } catch (e) {
    try {
      await client.execute('SELECT 1');
      console.log('0');
    } catch {
      console.log('0');
    }
  }
}

main().then(() => process.exit(0));


