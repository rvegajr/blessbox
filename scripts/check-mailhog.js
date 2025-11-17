// Check if a local MailHog instance is running (UI at 8025, SMTP at 1025)
// Usage: node scripts/check-mailhog.js

import net from 'node:net';

const UI_URL = process.env.MAILHOG_UI_URL || 'http://localhost:8025';
const SMTP_HOST = process.env.SMTP_HOST || '127.0.0.1';
const SMTP_PORT = Number(process.env.SMTP_PORT || 1025);

async function checkUI() {
  try {
    const res = await fetch(`${UI_URL}/api/v2/messages`, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

function checkSMTP() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (ok, error) => {
      if (done) return;
      done = true;
      try { socket.destroy(); } catch {}
      resolve({ ok, error });
    };

    socket.setTimeout(2000);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, 'timeout'));
    socket.once('error', (e) => finish(false, e?.message || 'error'));
    socket.connect(SMTP_PORT, SMTP_HOST);
  });
}

async function main() {
  console.log('🔎 Checking for local MailHog...');
  console.log(`🌐 UI:   ${UI_URL}`);
  console.log(`📨 SMTP: ${SMTP_HOST}:${SMTP_PORT}`);

  const [ui, smtp] = await Promise.all([checkUI(), checkSMTP()]);

  if (ui.ok) {
    console.log('✅ MailHog UI reachable');
  } else {
    console.log(`❌ MailHog UI not reachable: ${ui.error}`);
  }

  if (smtp.ok) {
    console.log('✅ SMTP port reachable');
  } else {
    console.log(`❌ SMTP not reachable: ${smtp.error}`);
  }

  const ok = ui.ok && smtp.ok;
  console.log(ok ? '🎉 Local MailHog is running' : '⚠️  Local MailHog not detected');
  process.exitCode = ok ? 0 : 1;
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exitCode = 1;
});



