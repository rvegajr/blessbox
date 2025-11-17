import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/lib/services/RegistrationService';

const registrationService = new RegistrationService();

// GET /api/registrations/[id] - Get registration details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = context.params;
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const registration = await registrationService.getRegistration(id);
    
    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      registration 
    });
  } catch (error) {
    console.error('Get registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/registrations/[id] - Update registration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Validate updates
    if (updates.deliveryStatus && !['pending', 'delivered', 'cancelled'].includes(updates.deliveryStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid delivery status. Must be pending, delivered, or cancelled' },
        { status: 400 }
      );
    }

    const registration = await registrationService.updateRegistration(id, updates);
    
    return NextResponse.json({ 
      success: true, 
      registration,
      message: 'Registration updated successfully'
    });
  } catch (error) {
    console.error('Update registration error:', error);
    
    if (error instanceof Error && error.message.includes('Registration not found')) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/registrations/[id] - Delete registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    await registrationService.deleteRegistration(id);
    
    return NextResponse.json({ 
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    
    if (error instanceof Error && error.message.includes('Registration not found')) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
