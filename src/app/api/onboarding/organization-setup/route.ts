import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/connection'
import { organizations, verificationCodes } from '@/lib/database/schema'
import { z } from 'zod'
import { emailService } from '@/services/EmailService'
import { randomInt } from 'crypto'

const organizationSetupSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  eventName: z.string().optional(),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  contactCity: z.string().optional(),
  contactState: z.string().optional(),
  contactZip: z.string().optional(),
  eventDescription: z.string().optional(),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = organizationSetupSchema.parse(body)

    // Create organization record
    const newOrganization = await db.insert(organizations).values({
      name: validatedData.name,
      eventName: validatedData.eventName,
      contactEmail: validatedData.contactEmail,
      contactPhone: validatedData.contactPhone,
      contactAddress: validatedData.contactAddress,
      contactCity: validatedData.contactCity,
      contactState: validatedData.contactState,
      contactZip: validatedData.contactZip,
      billingStatus: 'trial',
      monthlyPrice: 0,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning()

    // Generate verification code
    const verificationCode = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store verification code in database
    await db.insert(verificationCodes).values({
      email: validatedData.contactEmail,
      code: verificationCode,
      type: 'email_verification',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString()
    })

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail({
      email: validatedData.contactEmail,
      verificationCode,
      organizationName: validatedData.name
    })

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Continue anyway, but log the error
    }

    return NextResponse.json({
      success: true,
      organizationId: newOrganization[0].id,
      message: 'Organization created successfully. Please check your email for verification code.'
    })

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
