import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/lib/services/RegistrationService';

const registrationService = new RegistrationService();

// GET /api/registrations/form-config?orgSlug=xxx&qrLabel=xxx - Get form configuration
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgSlug = searchParams.get('orgSlug');
    const qrLabel = searchParams.get('qrLabel');
    
    if (!orgSlug || !qrLabel) {
      return NextResponse.json(
        { success: false, error: 'orgSlug and qrLabel query parameters are required' },
        { status: 400 }
      );
    }

    const formConfig = await registrationService.getFormConfig(orgSlug, qrLabel);
    
    if (!formConfig) {
      return NextResponse.json(
        { success: false, error: 'Form configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      config: formConfig 
    });
  } catch (error) {
    console.error('Get form config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
