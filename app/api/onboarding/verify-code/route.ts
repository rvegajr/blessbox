import { NextRequest, NextResponse } from 'next/server';
import { VerificationService } from '@/lib/services/VerificationService';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const verificationService = new VerificationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, organizationId } = body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, verified: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, verified: false, error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, verified: false, error: 'Invalid code format. Code must be 6 digits.' },
        { status: 400 }
      );
    }

    // Use VerificationService to verify code
    const result = await verificationService.verifyCode(email, code);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          verified: false,
          error: result.message,
          remainingAttempts: result.remainingAttempts
        },
        { status: 400 }
      );
    }

    // If verified, ensure we have a user record (account identity) and optionally attach membership to organization.
    await ensureDbReady();
    const db = getDbClient();
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();

    // Upsert user by email
    const userId = uuidv4();
    await db.execute({
      sql: `
        INSERT INTO users (id, email, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET updated_at = excluded.updated_at
      `,
      args: [userId, normalizedEmail, now, now],
    });

    const userRow = await db.execute({
      sql: `SELECT id, email FROM users WHERE email = ? LIMIT 1`,
      args: [normalizedEmail],
    });
    const resolvedUserId = String((userRow.rows?.[0] as any)?.id || userId);

    // Optionally create membership if org was provided
    let membershipCreated = false;
    if (typeof organizationId === 'string' && organizationId.trim()) {
      const orgId = organizationId.trim();

      // Mark org email as verified (only if it matches this email)
      await db.execute({
        sql: `UPDATE organizations SET email_verified = 1, updated_at = ? WHERE id = ? AND contact_email = ?`,
        args: [now, orgId, normalizedEmail],
      });

      await db.execute({
        sql: `
          INSERT INTO memberships (id, user_id, organization_id, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, organization_id) DO UPDATE SET updated_at = excluded.updated_at
        `,
        args: [uuidv4(), resolvedUserId, orgId, 'admin', now, now],
      });
      membershipCreated = true;
    }

    return NextResponse.json({
      success: true,
      verified: result.verified || false,
      message: result.message,
      userId: resolvedUserId,
      membershipCreated,
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { 
        success: false, 
        verified: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
