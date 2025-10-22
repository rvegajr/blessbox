import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/connection'
import { registrations, organizations } from '@/lib/database/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { emailService } from '@/services/EmailService'

const registrationSchema = z.object({
  qrCodeSetId: z.string().min(1, 'QR Code Set ID is required'),
  qrCodeId: z.string().min(1, 'QR Code ID is required'),
  registrationData: z.record(z.any())
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registrationSchema.parse(body)

    // Get organization ID from QR code set (this would be a real lookup)
    const organizationId = 'org_123' // This would be determined from the QR code set

    // Create registration record
    const newRegistration = await db.insert(registrations).values({
      organizationId,
      qrCodeSetId: validatedData.qrCodeSetId,
      qrCodeId: validatedData.qrCodeId,
      registrationData: JSON.stringify(validatedData.registrationData),
      ipAddress: request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      deliveryStatus: 'pending'
    }).returning()

    // Get organization details for notification
    const org = await db.select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)

    // Send notification email to organization
    if (org.length > 0) {
      await emailService.sendRegistrationNotification(
        org[0].contactEmail,
        validatedData.registrationData
      )
    }

    return NextResponse.json({
      success: true,
      registrationId: newRegistration[0].id,
      message: 'Registration successful'
    })

  } catch (error) {
    console.error('Error creating registration:', error)
    
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

    const registrationsList = await db.select()
      .from(registrations)
      .where(eq(registrations.organizationId, organizationId))
      .orderBy(desc(registrations.registeredAt))

    return NextResponse.json(registrationsList)

  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
