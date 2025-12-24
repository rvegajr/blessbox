import { NextRequest, NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/OrganizationService';
import { ensureDbReady } from '@/lib/db-ready';

const organizationService = new OrganizationService();

export async function POST(request: NextRequest) {
  try {
    await ensureDbReady();
    const body = await request.json();
    const { 
      name, 
      eventName, 
      contactEmail, 
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

    if (!contactEmail || typeof contactEmail !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Contact email is required' },
        { status: 400 }
      );
    }

    // Use OrganizationService to create organization
    const organization = await organizationService.createOrganization({
      name: name.trim(),
      eventName: eventName?.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone?.trim(),
      contactAddress: contactAddress?.trim(),
      contactCity: contactCity?.trim(),
      contactState: contactState?.trim(),
      contactZip: contactZip?.trim(),
      customDomain: customDomain?.trim(),
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
