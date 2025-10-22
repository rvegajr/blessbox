import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'radio', 'textarea']),
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.string()).optional()
})

const formSettingsSchema = z.object({
  allowMultipleSubmissions: z.boolean(),
  requireEmailVerification: z.boolean(),
  showProgressBar: z.boolean(),
  customTheme: z.string().optional()
})

const formBuilderSchema = z.object({
  formFields: z.array(formFieldSchema),
  formSettings: formSettingsSchema
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = formBuilderSchema.parse(body)

    // In a real implementation, you would:
    // 1. Save the form configuration to the database
    // 2. Associate it with the organization
    // 3. Generate form IDs and validation rules
    // 4. Store form settings

    console.log('Form configuration saved:', {
      fieldsCount: validatedData.formFields.length,
      settings: validatedData.formSettings
    })
    
    return NextResponse.json({
      success: true,
      message: 'Form configuration saved successfully',
      formId: 'form_' + Date.now() // Mock form ID
    })

  } catch (error) {
    console.error('Error saving form configuration:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

