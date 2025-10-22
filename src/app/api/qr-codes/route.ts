import { NextRequest, NextResponse } from 'next/server'
import { QRCodeService } from '@/services/QRCodeService'
import { z } from 'zod'

const createQRCodeSetSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Name is required'),
  language: z.string().default('en'),
  formFields: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'email', 'phone', 'select', 'checkbox', 'radio', 'textarea']),
    label: z.string(),
    placeholder: z.string().optional(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    validation: z.object({
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
      pattern: z.string().optional(),
      customMessage: z.string().optional()
    }).optional()
  })),
  qrCodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    entryPoint: z.string(),
    isActive: z.boolean()
  }))
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createQRCodeSetSchema.parse(body)

    const qrCodeService = new QRCodeService()
    const result = await qrCodeService.generateQRCodeSet(
      validatedData.organizationId,
      {
        name: validatedData.name,
        language: validatedData.language,
        formFields: validatedData.formFields,
        qrCodes: validatedData.qrCodes
      }
    )

    if (result.success) {
      return NextResponse.json(result.data, { status: 201 })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating QR code set:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const qrCodeService = new QRCodeService()
    const result = await qrCodeService.getQRCodeSetsByOrganization(organizationId)

    if (result.success) {
      return NextResponse.json(result.data)
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Error getting QR code sets:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

