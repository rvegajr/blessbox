import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { EmailService } from '@/lib/services/EmailService';
import { getDbClient } from '@/lib/db';
import { requireDiagnosticsSecret } from '@/lib/security/diagnosticsAuth';

/**
 * POST /api/test-production-email
 * Diagnostics-only production email pipeline check.
 *
 * Hardened:
 *  - Requires DIAGNOSTICS_SECRET (404 in prod when missing/invalid).
 *  - `from` is hardcoded to SENDGRID_FROM_EMAIL — client value ignored.
 *  - `replyTo` accepted only if it ends in `@blessbox.org`; otherwise ignored.
 *  - `to` MUST equal DIAGNOSTICS_TEST_RECIPIENT.
 */
export async function POST(request: NextRequest) {
  const authFailure = requireDiagnosticsSecret(request);
  if (authFailure) return authFailure;

  try {
    const body = await request.json().catch(() => ({} as any));
    const requestedTo = typeof body?.email === 'string' ? body.email.trim() : '';
    const requestedReplyTo = typeof body?.replyTo === 'string' ? body.replyTo.trim() : '';

    const allowed = (process.env.DIAGNOSTICS_TEST_RECIPIENT || '').trim();
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'DIAGNOSTICS_TEST_RECIPIENT not configured on server' },
        { status: 500 }
      );
    }
    if (requestedTo && requestedTo.toLowerCase() !== allowed.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Recipient not on diagnostics allowlist' },
        { status: 403 }
      );
    }
    const to = allowed;

    // replyTo: only accept if @blessbox.org domain. Otherwise drop silently.
    const safeReplyTo =
      requestedReplyTo && /^[^\s@]+@blessbox\.org$/i.test(requestedReplyTo)
        ? requestedReplyTo
        : undefined;

    await ensureDbReady();
    const service = new EmailService();
    const orgId = (process.env.TEST_ORG_ID || 'org-email-test') as string;

    const db = getDbClient();
    await db.execute({
      sql: `INSERT OR IGNORE INTO organizations (id, name, contact_email, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [orgId, 'BlessBox Email Test Org', 'email-test@example.com', 1, new Date().toISOString(), new Date().toISOString()],
    });

    await service.ensureDefaultTemplates(orgId);

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || '';
    const result = await service.sendEmail(
      orgId,
      to,
      'admin_notification',
      {
        organization_name: 'BlessBox',
        recipient_name: 'Tester',
        event_type: 'production_email_test',
        registration_id: 'test',
        qr_code_label: 'test',
      },
      {
        ...(fromEmail ? { fromEmailOverride: fromEmail } : {}),
        ...(safeReplyTo ? { replyTo: safeReplyTo } : {}),
      }
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      email: to,
    });
  } catch (error) {
    console.error('Production email test error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
