import { NextRequest, NextResponse } from 'next/server';
import { FormConfigService } from '@/lib/services/FormConfigService';

const formConfigService = new FormConfigService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, formFields, language = 'en', name = 'Registration Form' } = body;

    // Validate inputs
    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(formFields)) {
      return NextResponse.json(
        { success: false, error: 'Form fields must be an array' },
        { status: 400 }
      );
    }

    // Check if form config already exists for this organization
    const existing = await formConfigService.getFormConfigByOrganization(organizationId);

    let config;
    if (existing) {
      // Update existing config
      config = await formConfigService.updateFormConfig(existing.id, {
        formFields,
        language,
        name,
      });
    } else {
      // Create new config
      config = await formConfigService.createFormConfig({
        organizationId,
        name,
        language,
        formFields,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Form configuration saved successfully',
      config: {
        id: config.id,
        name: config.name,
        language: config.language,
        formFields: config.formFields,
      },
    });
  } catch (error) {
    console.error('Save form config error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Organization not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      
      if (error.message.includes('Validation failed')) {
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
