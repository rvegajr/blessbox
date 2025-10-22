import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/connection'
import { users, organizations, userOrganizations } from '@/lib/database/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  organizationName: z.string().min(1, 'Organization name is required'),
  contactEmail: z.string().email('Invalid organization email'),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  contactCity: z.string().optional(),
  contactState: z.string().optional(),
  contactZip: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1)
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Check if organization email already exists
    const existingOrg = await db.select().from(organizations).where(eq(organizations.contactEmail, validatedData.contactEmail)).limit(1)
    if (existingOrg.length > 0) {
      return NextResponse.json({ error: 'Organization email already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const newUser = await db.insert(users).values({
      email: validatedData.email,
      name: validatedData.name,
      phone: validatedData.phone,
    }).returning()

    // Create organization
    const newOrg = await db.insert(organizations).values({
      name: validatedData.organizationName,
      contactEmail: validatedData.contactEmail,
      contactPhone: validatedData.contactPhone,
      contactAddress: validatedData.contactAddress,
      contactCity: validatedData.contactCity,
      contactState: validatedData.contactState,
      contactZip: validatedData.contactZip,
      passwordHash: hashedPassword,
      emailVerified: false,
    }).returning()

    // Link user to organization
    await db.insert(userOrganizations).values({
      userEmail: newUser[0].email,
      organizationId: newOrg[0].id,
      role: 'owner',
    })

    return NextResponse.json({ 
      message: 'Registration successful',
      userId: newUser[0].email,
      organizationId: newOrg[0].id
    })

  } catch (error) {
    console.error('Registration error:', error)
    
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

