import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OrganizationService } from '@/lib/services/OrganizationService';
import { MembershipService } from '@/lib/services/MembershipService';
import { ensureDbReady } from '@/lib/db-ready';
import { getServerSession } from '@/lib/auth-helper';
import { normalizeEmail } from '@/lib/utils/normalize-email';

const organizationService = new OrganizationService();
const membershipService = new MembershipService();

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const session = await getServerSession();
    const sessionEmail = normalizeEmail(session?.user?.email);
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      eventName, 
      contactPhone, 
      contactAddress, 
      contactCity, 
      contactState, 
      contactZip,
      customDomain
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Use OrganizationService to create organization
    const organization = await organizationService.createOrganization({
      name: name.trim(),
      eventName: eventName?.trim(),
      contactEmail: sessionEmail,
      contactPhone: contactPhone?.trim(),
      contactAddress: contactAddress?.trim(),
      contactCity: contactCity?.trim(),
      contactState: contactState?.trim(),
      contactZip: contactZip?.trim(),
      customDomain: customDomain?.trim(),
    });

    // Create membership for signed-in user
    const userId = session.user.id;
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
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
