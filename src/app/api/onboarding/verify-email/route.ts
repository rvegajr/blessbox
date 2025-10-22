import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/database/connection'
import { organizations, verificationCodes } from '@/lib/database/schema'
import { eq, and, gt } from 'drizzle-orm'
import { emailService } from '@/services/EmailService'

const verifyEmailSchema = z.object({
  email: z.string().email('Valid email is required'),
  verificationCode: z.string().min(6, 'Verification code must be 6 digits')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = verifyEmailSchema.parse(body)

    // Check if the verification code exists and is valid
    const verificationRecord = await db.select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, validatedData.email),
          eq(verificationCodes.code, validatedData.verificationCode),
          eq(verificationCodes.type, 'email_verification'),
          gt(verificationCodes.expiresAt, new Date().toISOString())
        )
      )
      .limit(1)

    if (verificationRecord.length === 0) {
      return NextResponse.json({
        error: 'Invalid or expired verification code'
      }, { status: 400 })
    }

    // Mark the email as verified
    await db.update(organizations)
      .set({ 
        emailVerified: true,
        updatedAt: new Date().toISOString()
      })
      .where(eq(organizations.contactEmail, validatedData.email))

    // Delete the verification code
    await db.delete(verificationCodes)
      .where(eq(verificationCodes.id, verificationRecord[0].id))

    // Send welcome email
    const org = await db.select()
      .from(organizations)
      .where(eq(organizations.contactEmail, validatedData.email))
      .limit(1)

    if (org.length > 0) {
      await emailService.sendWelcomeEmail(validatedData.email, org[0].name)
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    })

  } catch (error) {
    console.error('Error verifying email:', error)
    
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
