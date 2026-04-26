import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

const registrationService = new RegistrationService();

const RegistrationSubmitAliasSchema = z.object({
  orgSlug: z.string().min(1).max(200),
  qrLabel: z.string().min(1).max(200),
  formData: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Backwards-compatible alias for older tests/specs that call `/api/registrations/submit`.
 * The canonical endpoint is `POST /api/registrations`.
 */
export async function POST(request: NextRequest) {
  // Per-IP rate limit: 30/min — shares the registrations submit policy
  const ipLimit = rateLimit(request, { key: 'registrations/submit:ip', limit: 30, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const parsed = await parseBody(request, RegistrationSubmitAliasSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const { orgSlug, qrLabel, formData, metadata } = parsed.data;

    const registration = await registrationService.submitRegistration(orgSlug, qrLabel, formData as any, metadata as any);

    return NextResponse.json({
      success: true,
      registration,
      message: 'Registration submitted successfully',
    });
  } catch (error) {
    console.error('Registration submission (alias) error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

