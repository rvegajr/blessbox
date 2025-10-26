import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/database/connection'
import { verificationCodes, organizations } from '@/lib/database/schema'
import { eq, and, gt } from 'drizzle-orm'
import { emailService } from '@/services/EmailService'
import { randomInt } from 'crypto'

const resendVerificationSchema = z.object({
  email: z.string().email('Valid email is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = resendVerificationSchema.parse(body)

    // Check if email exists in organizations
    const org = await db.select()
      .from(organizations)
      .where(eq(organizations.contactEmail, validatedData.email))
      .limit(1)

    if (org.length === 0) {
      return NextResponse.json({
        error: 'Email not found'
      }, { status: 404 })
    }

    // Check for existing unexpired verification codes
    const existingCode = await db.select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.email, validatedData.email),
          gt(verificationCodes.expiresAt, new Date().toISOString())
        )
      )
      .limit(1)

    if (existingCode.length > 0) {
      return NextResponse.json({
        error: 'Verification code already sent. Please wait before requesting another.'
      }, { status: 429 })
    }

    // Generate new verification code
    const verificationCode = randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store verification code in database
    await db.insert(verificationCodes).values({
      email: validatedData.email,
      code: verificationCode,
      expiresAt: expiresAt.toISOString()
    })

    // Send verification email
    const emailResult = await emailService.sendVerificationEmail({
      email: validatedData.email,
      verificationCode,
      organizationName: org[0].name
    })

    if (!emailResult.success) {
      return NextResponse.json({
        error: 'Failed to send verification email'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully'
    })

  } catch (error) {
    console.error('Error resending verification:', error)
    
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
