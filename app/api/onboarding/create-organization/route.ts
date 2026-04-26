/**
 * POST /api/onboarding/create-organization
 * 
 * Create a new organization during onboarding.
 * This endpoint does NOT require authentication - it's called before email verification.
 * The organization is created with email_verified = 0 until the email is verified.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { OrganizationService } from '@/lib/services/OrganizationService';
import { ensureDbReady } from '@/lib/db-ready';
import { normalizeEmail } from '@/lib/utils/normalize-email';
import { internalErrorResponse } from '@/lib/api/errorResponse';
import { parseBody } from '@/lib/api/validate';

const organizationService = new OrganizationService();

const CreateOrgSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(200),
  eventName: z.string().trim().max(200).optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().trim().max(50).optional(),
  contactAddress: z.string().trim().max(300).optional(),
  contactCity: z.string().trim().max(100).optional(),
  contactState: z.string().trim().max(100).optional(),
  contactZip: z.string().trim().max(20).optional(),
  customDomain: z.string().trim().max(253).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, CreateOrgSchema);
  if ('error' in parsed) return parsed.error;
  try {
    await ensureDbReady();

    const {
      name,
      eventName,
      contactEmail,
      contactPhone,
      contactAddress,
      contactCity,
      contactState,
      contactZip,
      customDomain,
    } = parsed.data;

    const normalizedEmail = normalizeEmail(contactEmail) || contactEmail;

    // Create organization (email_verified will be set to 0 by default)
    const organization = await organizationService.createOrganization({
      name,
      eventName,
      contactEmail: normalizedEmail,
      contactPhone,
      contactAddress,
      contactCity,
      contactState,
      contactZip,
      customDomain,
    });

    return NextResponse.json(
      {
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          eventName: organization.eventName,
          contactEmail: organization.contactEmail,
          contactPhone: organization.contactPhone,
          contactAddress: organization.contactAddress,
          contactCity: organization.contactCity,
          contactState: organization.contactState,
          contactZip: organization.contactZip,
          emailVerified: organization.emailVerified,
          createdAt: organization.createdAt,
          updatedAt: organization.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create organization error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Validation failed') || error.message.includes('email')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 }
        );
      }
    }
    
    return internalErrorResponse(error, 'Create organization');
  }
}

