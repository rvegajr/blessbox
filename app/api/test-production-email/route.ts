import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { EmailService } from '@/lib/services/EmailService';
import { getDbClient } from '@/lib/db';

/**
 * Comprehensive production email test endpoint
 * Tests email sending and provides detailed diagnostics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fromEmail, replyTo } = body as { email?: string; fromEmail?: string; replyTo?: string };

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

    // This endpoint is restricted in production (use diagnostics secret).
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
    const secret = process.env.DIAGNOSTICS_SECRET || process.env.CRON_SECRET;
    if (process.env.NODE_ENV === 'production' && (!secret || token !== secret)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDbReady();
    const service = new EmailService();
    const orgId = (process.env.TEST_ORG_ID || 'org-email-test') as string;

    // Ensure org exists (email_templates has FK to organizations).
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
      event_type: 'production_email_test',
      registration_id: 'test',
      qr_code_label: 'test',
    }, {
      ...(typeof fromEmail === 'string' && fromEmail.trim() ? { fromEmailOverride: fromEmail.trim() } : {}),
      ...(typeof replyTo === 'string' && replyTo.trim() ? { replyTo: replyTo.trim() } : {}),
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error || 'Failed to send' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      email,
      note: 'Prefer /api/system/email-health for full diagnostics.',
    });
  } catch (error) {
    console.error('❌ Production email test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

