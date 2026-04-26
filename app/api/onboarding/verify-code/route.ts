import { NextRequest, NextResponse } from 'next/server';
import { VerificationService } from '@/lib/services/VerificationService';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import {
  badRequestResponse,
  internalErrorResponse,
} from '@/lib/api/errorResponse';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

const verificationService = new VerificationService();

const OnboardingVerifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  organizationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Per-IP rate limit: 10/min — guards OTP brute force
  const ipLimit = rateLimit(request, { key: 'onboarding/verify-code:ip', limit: 10, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const parsed = await parseBody(request, OnboardingVerifyCodeSchema);
  if ('error' in parsed) return parsed.error;
  const { email, code, organizationId } = parsed.data;

  try {
    const result = await verificationService.verifyCode(email, code);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: result.message,
          remainingAttempts: result.remainingAttempts,
        },
        { status: 400 }
      );
    }

    // If verified, ensure we have a user record and optionally attach membership.
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

    // Optionally create membership if org was provided.
    // IMPORTANT: verify the org exists FIRST. Per spec, verify-code may be called
    // before create-organization runs; in that case we must not write a membership
    // row (FK violation -> SQLITE_CONSTRAINT_FOREIGNKEY 500). Return a clean 400.
    let membershipCreated = false;
    if (typeof organizationId === 'string' && organizationId.trim()) {
      const orgId = organizationId.trim();

      const orgCheck = await db.execute({
        sql: `SELECT id FROM organizations WHERE id = ? LIMIT 1`,
        args: [orgId],
      });

      if (!orgCheck.rows || orgCheck.rows.length === 0) {
        // Parent row does not exist — return clean error, never leak SQLite text.
        return badRequestResponse('Invalid organization', {
          verified: result.verified || false,
          userId: resolvedUserId,
          membershipCreated: false,
        });
      }

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
    return internalErrorResponse(error, 'Verify code');
  }
}
