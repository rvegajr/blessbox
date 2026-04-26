import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { requireDiagnosticsSecret } from '@/lib/security/diagnosticsAuth';

export async function GET(request: NextRequest) {
  const authFailure = requireDiagnosticsSecret(request);
  if (authFailure) return authFailure;
  try {
    const registrationService = new RegistrationService();
    
    // Test getFormConfig
    const formConfig = await registrationService.getFormConfig('hopefoodbank', 'main-entrance');
    
    return NextResponse.json({ 
      success: true, 
      formConfig,
      message: 'RegistrationService working'
    });
  } catch (error) {
    console.error('RegistrationService test error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
