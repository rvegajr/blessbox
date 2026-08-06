import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';
import { getServerSession } from '@/lib/auth-helper';
import { EmailService } from '@/lib/services/EmailService';
import { getEnv } from '@/lib/utils/env';
import { hasGatewayAuth } from '@/lib/services/gatewayConfig';

export const dynamic = 'force-dynamic';

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ ok: boolean; status: number; json?: any; text?: string }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json().catch(() => undefined);
      return { ok: res.ok, status: res.status, json };
    }
    const text = await res.text().catch(() => undefined);
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(t);
  }
}

async function getSendGridDiagnostics() {
  const apiKey = getEnv('SENDGRID_API_KEY');
  if (!apiKey) return null;

  const fromEmail = getEnv('SENDGRID_FROM_EMAIL');
  // Canonical sender we expect to be verified in the SendGrid account.
  // Reads from env first so changing the brand doesn't require a code edit.
  const desiredFrom = (fromEmail || 'noreply@blessbox.org').toLowerCase();
  const desiredDomain = desiredFrom.split('@')[1] || 'blessbox.org';

  const out: any = {
    apiKeyPresent: true,
    apiKeyValid: false,
    profile: { username: null as string | null },
    senderIdentities: {
      checked: false,
      total: null as number | null,
      verifiedTotal: null as number | null,
      hasConfiguredFromEmail: null as boolean | null,
      hasNoreplyBlessbox: null as boolean | null,
      configuredFromEmail: fromEmail || null,
    },
    authenticatedDomains: {
      checked: false,
      total: null as number | null,
      verifiedTotal: null as number | null,
      hasBlessboxOrg: null as boolean | null,
    },
    errors: [] as string[],
  };

  const headers = {
    authorization: `Bearer ${apiKey}`,
    'content-type': 'application/json',
  };

  // 1) Who does this key belong to?
  try {
    const r = await fetchJsonWithTimeout('https://api.sendgrid.com/v3/user/profile', { headers }, 5000);
    if (r.ok) {
      out.apiKeyValid = true;
      out.profile.username = typeof r.json?.username === 'string' ? r.json.username : null;
    } else {
      out.errors.push(`sendgrid:user/profile status=${r.status}`);
    }
  } catch (e: any) {
    out.errors.push(`sendgrid:user/profile error=${e?.name === 'AbortError' ? 'timeout' : e?.message || String(e)}`);
  }

  // 2) Single Sender identities (verified FROM addresses)
  try {
    const r = await fetchJsonWithTimeout('https://api.sendgrid.com/v3/senders', { headers }, 5000);
    out.senderIdentities.checked = true;
    if (r.ok) {
      const list: any[] = Array.isArray(r.json?.result) ? r.json.result : [];
      const verified = list.filter((s) => s?.verified === true);
      const verifiedEmails = verified
        .map((s) => (typeof s?.from?.email === 'string' ? s.from.email.trim() : ''))
        .filter(Boolean);

      out.senderIdentities.total = list.length;
      out.senderIdentities.verifiedTotal = verifiedEmails.length;
      out.senderIdentities.hasConfiguredFromEmail =
        !!fromEmail && verifiedEmails.some((e) => e.toLowerCase() === fromEmail.toLowerCase());
      out.senderIdentities.hasNoreplyBlessbox = verifiedEmails.some((e) => e.toLowerCase() === desiredFrom);
    } else {
      out.errors.push(`sendgrid:senders status=${r.status}`);
    }
  } catch (e: any) {
    out.senderIdentities.checked = true;
    out.errors.push(`sendgrid:senders error=${e?.name === 'AbortError' ? 'timeout' : e?.message || String(e)}`);
  }

  // 3) Domain authentication status
  try {
    const r = await fetchJsonWithTimeout('https://api.sendgrid.com/v3/whitelabel/domains', { headers }, 5000);
    out.authenticatedDomains.checked = true;
    if (r.ok) {
      const list: any[] = Array.isArray(r.json) ? r.json : [];
      const verifiedDomains = list
        .filter((d) => d?.valid === true)
        .map((d) => (typeof d?.domain === 'string' ? d.domain.trim().toLowerCase() : ''))
        .filter(Boolean);

      out.authenticatedDomains.total = list.length;
      out.authenticatedDomains.verifiedTotal = verifiedDomains.length;
      out.authenticatedDomains.hasBlessboxOrg = verifiedDomains.includes(desiredDomain);
    } else {
      out.errors.push(`sendgrid:whitelabel/domains status=${r.status}`);
    }
  } catch (e: any) {
    out.authenticatedDomains.checked = true;
    out.errors.push(
      `sendgrid:whitelabel/domains error=${e?.name === 'AbortError' ? 'timeout' : e?.message || String(e)}`
    );
  }

  return out;
}

function isAuthorizedBySecret(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  const cronSecret = getEnv('CRON_SECRET');
  const diagnosticsSecret = getEnv('DIAGNOSTICS_SECRET');
  return !!token && Boolean((cronSecret && token === cronSecret) || (diagnosticsSecret && token === diagnosticsSecret));
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (getEnv('NODE_ENV') !== 'production') return true;
  if (isAuthorizedBySecret(req)) return true;

  const session = await getServerSession();
  const superAdmin = getEnv('SUPERADMIN_EMAIL');
  return !!session?.user?.email && !!superAdmin && session.user.email === superAdmin;
}

function providerStatus() {
  const sendgridApiKey = getEnv('SENDGRID_API_KEY');
  const sendgridFromEmail = getEnv('SENDGRID_FROM_EMAIL');
  const sendgridFromName = getEnv('SENDGRID_FROM_NAME');
  const smtpHost = getEnv('SMTP_HOST');
  const smtpUser = getEnv('SMTP_USER');
  const smtpPass = getEnv('SMTP_PASS');
  const gmailUser = getEnv('GMAIL_USER');
  const gmailPass = getEnv('GMAIL_PASS');

  const hasSendGrid = !!sendgridApiKey && !!sendgridFromEmail;
  const hasSmtp = !!smtpHost && !!smtpUser && !!smtpPass;
  const hasGmail = !!gmailUser && !!gmailPass;

  const hasGateway = hasGatewayAuth();
  // The Noctusoft gateway relay is the canonical (and only) email path; legacy
  // direct SendGrid/SMTP/Gmail are no longer used by the app.
  const provider = hasGateway ? 'noctusoft_gateway' : hasSendGrid ? 'sendgrid' : hasSmtp ? 'smtp' : hasGmail ? 'gmail_smtp' : 'none';
  return {
    provider,
    configured: provider !== 'none',
    gateway: { configured: hasGateway, hasDeployKey: hasGateway },
    sendgrid: {
      configured: hasSendGrid,
      hasApiKey: !!sendgridApiKey,
      hasFromEmail: !!sendgridFromEmail,
      fromName: !!sendgridFromName,
    },
    smtp: {
      configured: hasSmtp,
      host: !!smtpHost,
      port: getEnv('SMTP_PORT') || null,
      secure: getEnv('SMTP_SECURE') || null,
      from: getEnv('SMTP_FROM') || null,
      fromName: getEnv('SMTP_FROM_NAME') || null,
    },
    gmailSmtp: {
      configured: hasGmail,
      user: !!gmailUser,
      pass: !!gmailPass,
    },
  };
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = req.nextUrl.searchParams.get('orgId') || undefined;
  const db = getDbClient();

  // Basic status (no secrets)
  const provider = providerStatus();
  const sendgridDiagnostics = provider.sendgrid.configured ? await getSendGridDiagnostics() : null;

  let templates: { ensured?: boolean; count?: number } | undefined;
  let logs: { total?: number } | undefined;
  let org: { exists: boolean } | undefined;

  if (orgId) {
    await ensureDbReady();
    const orgResult = await db.execute({
      sql: 'SELECT id FROM organizations WHERE id = ? LIMIT 1',
      args: [orgId],
    });
    const exists = (orgResult.rows || []).length > 0;
    org = { exists };

    if (exists) {
      const emailService = new EmailService();
      await emailService.ensureDefaultTemplates(orgId);
    }

    const t = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM email_templates WHERE organization_id = ? AND is_active = 1',
      args: [orgId],
    });
    templates = { ensured: exists ? true : false, count: Number((t.rows?.[0] as any)?.count || 0) };

    const l = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM email_logs WHERE organization_id = ?',
      args: [orgId],
    });
    logs = { total: Number((l.rows?.[0] as any)?.count || 0) };
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    env: getEnv('NODE_ENV'),
    provider,
    ...(sendgridDiagnostics ? { sendgridDiagnostics } : {}),
    ...(orgId ? { organizationId: orgId, organization: org, templates, logs } : {}),
    recommendations:
      provider.configured
        ? []
        : [
            'Set NOCTUSOFT_DEPLOY_KEY — the Noctusoft gateway handles SendGrid for the app (no SendGrid key in the app).',
            'Optionally set DIAGNOSTICS_SECRET to protect this endpoint in production.',
          ],
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { orgId, to, templateType } = body as { orgId?: string; to?: string; templateType?: string };

  if (!orgId || typeof orgId !== 'string') {
    return NextResponse.json({ success: false, error: 'orgId is required' }, { status: 400 });
  }
  if (!to || typeof to !== 'string') {
    return NextResponse.json({ success: false, error: 'to is required' }, { status: 400 });
  }

  await ensureDbReady();
  const db = getDbClient();
  const orgResult = await db.execute({
    sql: 'SELECT id FROM organizations WHERE id = ? LIMIT 1',
    args: [orgId],
  });
  if ((orgResult.rows || []).length === 0) {
    return NextResponse.json({ success: false, error: 'Organization not found for orgId' }, { status: 404 });
  }

  const emailService = new EmailService();
  await emailService.ensureDefaultTemplates(orgId);

  const result = await emailService.sendEmail(orgId, to, (templateType || 'admin_notification') as any, {
    organization_name: 'BlessBox',
    recipient_name: 'Tester',
    event_type: 'email_health_test',
    registration_id: 'test',
    qr_code_label: 'test',
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Email sent' });
}

