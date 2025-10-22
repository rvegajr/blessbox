import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/database/connection'
import { activities } from '@/lib/database/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get recent activities for user's organizations
    const recentActivities = await db.select()
      .from(activities)
      .where(eq(activities.organizationId, session.user.id))
      .orderBy(desc(activities.createdAt))
      .limit(10)

    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description || '',
      timestamp: activity.createdAt,
      user: activity.userEmail
    }))

    return NextResponse.json(formattedActivities)

  } catch (error) {
    console.error('Error fetching dashboard activities:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

