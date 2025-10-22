import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/database/connection'
import { registrations, qrCodeSets, qrScans } from '@/lib/database/schema'
import { eq, and, gte, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organizations
    const userOrgs = await db.select({
      organizationId: qrCodeSets.organizationId
    })
    .from(qrCodeSets)
    .where(eq(qrCodeSets.organizationId, session.user.id))

    if (userOrgs.length === 0) {
      return NextResponse.json({
        totalRegistrations: 0,
        qrCodeSets: 0,
        recentActivity: 0,
        activeUsers: 0
      })
    }

    const orgId = userOrgs[0].organizationId

    // Get total registrations
    const registrationCount = await db.select({ count: count() })
      .from(registrations)
      .where(eq(registrations.organizationId, orgId))

    // Get QR code sets count
    const qrCodeSetsCount = await db.select({ count: count() })
      .from(qrCodeSets)
      .where(eq(qrCodeSets.organizationId, orgId))

    // Get recent activity (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const recentActivityCount = await db.select({ count: count() })
      .from(qrScans)
      .where(and(
        eq(qrScans.organizationId, orgId),
        gte(qrScans.scannedAt, yesterday.toISOString())
      ))

    // Mock active users (would typically come from real-time tracking)
    const activeUsers = Math.floor(Math.random() * 10)

    return NextResponse.json({
      totalRegistrations: registrationCount[0]?.count || 0,
      qrCodeSets: qrCodeSetsCount[0]?.count || 0,
      recentActivity: recentActivityCount[0]?.count || 0,
      activeUsers
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

