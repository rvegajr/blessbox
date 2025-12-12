import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/lib/services/RegistrationService';

const registrationService = new RegistrationService();

/**
 * Backwards-compatible alias for older tests/specs that call `/api/registrations/submit`.
 * The canonical endpoint is `POST /api/registrations`.
 */
export async function POST(request: NextRequest) {
  try {
    const { orgSlug, qrLabel, formData, metadata } = await request.json();

    if (!orgSlug || !qrLabel || !formData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orgSlug, qrLabel, and formData are required' },
        { status: 400 }
      );
    }

    if (typeof formData !== 'object' || formData === null) {
      return NextResponse.json({ success: false, error: 'formData must be an object' }, { status: 400 });
    }

    const registration = await registrationService.submitRegistration(orgSlug, qrLabel, formData, metadata);

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

