import { NextRequest, NextResponse } from 'next/server'
import { OrganizationService } from '@/services/OrganizationService'
import { z } from 'zod'

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  eventName: z.string().optional(),
  customDomain: z.string().optional(),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  contactCity: z.string().optional(),
  contactState: z.string().optional(),
  contactZip: z.string().optional(),
  slug: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createOrganizationSchema.parse(body)

    const organizationService = new OrganizationService()
    const result = await organizationService.createOrganization(validatedData)

    if (result.success) {
      return NextResponse.json(result.data, { status: 201 })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating organization:', error)
    
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
    const organizationService = new OrganizationService()
    const result = await organizationService.getActiveOrganizations()

    if (result.success) {
      return NextResponse.json(result.data)
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Error getting organizations:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

