import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { EmailService } from '@/lib/services/EmailService';
import { getDbClient } from '@/lib/db';

/**
 * Test endpoint to send a verification email directly
 * Bypasses database to test email sending only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // This endpoint is intended for local/dev.
    // In production, use /api/system/email-health (authorized) instead.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Use /api/system/email-health in production' }, { status: 403 });
    }

    await ensureDbReady();
    const service = new EmailService();
    // Reuse a deterministic org id for local testing
    const orgId = 'org-email-test';

    // Ensure org exists (email templates have a FK to organizations)
    const db = getDbClient();
    await db.execute({
      sql: `INSERT OR IGNORE INTO organizations (id, name, contact_email, email_verified, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [orgId, 'BlessBox Email Test Org', 'email-test@example.com', 1, new Date().toISOString(), new Date().toISOString()],
    });

    await service.ensureDefaultTemplates(orgId);

    const result = await service.sendEmail(orgId, email, 'admin_notification', {
      organization_name: 'BlessBox',
      recipient_name: 'Tester',
      event_type: 'test_email_send',
      registration_id: 'test',
      qr_code_label: 'test',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Test email sent successfully!', email });
  } catch (error) {
    console.error('❌ Test email send error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}
