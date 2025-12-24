import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient, nowIso } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Local/test-only convenience endpoint used by some existing E2E specs.
 * Accepts a "sessionData" payload and materializes it into the sqlite/libsql database.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 404 });
  }

  try {
    await ensureDbReady();
    const db = getDbClient();
    const now = nowIso();

    const { sessionData } = await request.json();
    if (!sessionData || typeof sessionData !== 'object') {
      return NextResponse.json({ success: false, error: 'sessionData is required' }, { status: 400 });
    }

    const organizationId = uuidv4();
    const organizationName = sessionData.organizationName || 'Migrated Organization';
    const orgSlug = slugify(sessionData.customDomain || organizationName) || `org-${Date.now()}`;
    const contactEmail = sessionData.contactEmail || `migrated-${Date.now()}@example.com`;

    await db.execute({
      sql: `INSERT INTO organizations (
              id, name, event_name, custom_domain, contact_email, contact_phone,
              contact_address, contact_city, contact_state, contact_zip,
              email_verified, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        organizationId,
        organizationName,
        sessionData.eventName || '',
        orgSlug,
        contactEmail,
        sessionData.contactPhone || '',
        sessionData.contactAddress || '',
        sessionData.contactCity || '',
        sessionData.contactState || '',
        sessionData.contactZip || '',
        sessionData.emailVerified ? 1 : 0,
        now,
        now,
      ],
    });

    const qrCodeSetId = uuidv4();
    const formFields = Array.isArray(sessionData.formFields) ? sessionData.formFields : [];
    const qrCodes = Array.isArray(sessionData.qrCodes)
      ? sessionData.qrCodes.map((q: any) => ({
          id: q.id || q.label || uuidv4(),
          label: q.label,
          url: q.url || `http://localhost:7777/register/${orgSlug}/${q.label}`,
          dataUrl: q.dataUrl,
          description: q.description,
          language: 'en',
          scanCount: 0,
        }))
      : [];

    await db.execute({
      sql: `INSERT INTO qr_code_sets (
              id, organization_id, name, language, form_fields, qr_codes,
              is_active, scan_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        qrCodeSetId,
        organizationId,
        sessionData.qrSetName || '2025 QR Codes',
        'en',
        JSON.stringify(formFields),
        JSON.stringify(qrCodes),
        1,
        0,
        now,
        now,
      ],
    });

    return NextResponse.json({
      success: true,
      organizationId,
      orgSlug,
      qrCodeSetId,
    });
  } catch (error) {
    console.error('Migrate onboarding error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

