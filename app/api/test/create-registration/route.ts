import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient, nowIso } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Local/test-only endpoint used by some older E2E specs to insert registrations quickly.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 404 });
  }

  try {
    await ensureDbReady();
    const db = getDbClient();
    const now = nowIso();

    const body = await request.json();
    const { qrCodeSetId, qrCodeId, registrationData } = body || {};

    if (!qrCodeSetId || !qrCodeId || !registrationData) {
      return NextResponse.json(
        { success: false, error: 'qrCodeSetId, qrCodeId, and registrationData are required' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO registrations (
              id, qr_code_set_id, qr_code_id, registration_data, ip_address, user_agent,
              delivery_status, registered_at, token_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        qrCodeSetId,
        qrCodeId,
        JSON.stringify(registrationData),
        '127.0.0.1',
        'E2E-Test-User-Agent',
        'pending',
        now,
        'active',
      ],
    });

    return NextResponse.json({ success: true, registrationId: id, message: 'Registration created successfully' });
  } catch (error) {
    console.error('Create registration error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

