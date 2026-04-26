import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrganizationService } from '@/lib/services/OrganizationService';
import { MembershipService } from '@/lib/services/MembershipService';
import { ensureDbReady } from '@/lib/db-ready';
import { getServerSession } from '@/lib/auth-helper';
import { normalizeEmail } from '@/lib/utils/normalize-email';
import { z } from 'zod';
import { internalErrorResponse } from '@/lib/api/errorResponse';
import { parseBody } from '@/lib/api/validate';

const organizationService = new OrganizationService();
const membershipService = new MembershipService();

const SaveOrgSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required').max(200),
  eventName: z.string().trim().max(200).optional(),
  contactPhone: z.string().trim().max(50).optional(),
  contactAddress: z.string().trim().max(300).optional(),
  contactCity: z.string().trim().max(100).optional(),
  contactState: z.string().trim().max(100).optional(),
  contactZip: z.string().trim().max(20).optional(),
  customDomain: z.string().trim().max(253).optional(),
});

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const session = await getServerSession();
    const sessionEmail = normalizeEmail(session?.user?.email);
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, SaveOrgSchema);
    if ('error' in parsed) return parsed.error;
    const {
      name,
      eventName,
      contactPhone,
      contactAddress,
      contactCity,
      contactState,
      contactZip,
      customDomain,
    } = parsed.data;

    // Use OrganizationService to create organization
    const organization = await organizationService.createOrganization({
      name,
      eventName,
      contactEmail: sessionEmail,
      contactPhone,
      contactAddress,
      contactCity,
      contactState,
      contactZip,
      customDomain,
    });

    // Create membership for signed-in user
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found in session' },
        { status: 401 }
      );
    }

    await membershipService.ensureMembership(userId, organization.id, 'admin');

    // Set active org context via cookie
    const cookieStore = await cookies();
    const response = NextResponse.json(
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

    // Set active org cookie
    const isProd = process.env.NODE_ENV === 'production';
    response.cookies.set('bb_active_org_id', organization.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Save organization error:', error);
    
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
    
    return internalErrorResponse(error, 'Save organization');
  }
}
