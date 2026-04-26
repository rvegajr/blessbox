import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { EmailService } from '@/lib/services/EmailService';
import { getDbClient } from '@/lib/db';
import { requireDiagnosticsSecret } from '@/lib/security/diagnosticsAuth';

/**
 * POST /api/test-email-send
 * Diagnostics-only test that the email pipeline is wired correctly.
 *
 * Hardened:
 *  - Requires DIAGNOSTICS_SECRET (404 in prod when missing/invalid).
 *  - `from` is hardcoded to SENDGRID_FROM_EMAIL — client cannot set it.
 *  - `replyTo` from client is ignored.
 *  - `to` MUST equal DIAGNOSTICS_TEST_RECIPIENT (server-controlled allowlist).
 */
export async function POST(request: NextRequest) {
  const authFailure = requireDiagnosticsSecret(request);
  if (authFailure) return authFailure;

  try {
    const body = await request.json().catch(() => ({} as any));
    const requestedTo = typeof body?.email === 'string' ? body.email.trim() : '';

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

    await ensureDbReady();
    const service = new EmailService();
    const orgId = 'org-email-test';

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
        event_type: 'test_email_send',
        registration_id: 'test',
        qr_code_label: 'test',
      },
      fromEmail ? { fromEmailOverride: fromEmail } : undefined
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Test email sent successfully!', email: to });
  } catch (error) {
    console.error('Test email send error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
