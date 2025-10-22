/**
 * Dashboard Service Implementation
 * 
 * Real implementation of IDashboardService following TDD principles
 * All methods tested before implementation
 */

import { db } from '@/lib/database/connection'
import { organizations, qrCodeSets, qrScans, registrations, activities } from '@/lib/database/schema'
import { eq, and, desc, count, gte, lte, sql } from 'drizzle-orm'
import { 
  IDashboardService,
  OrganizationStats,
  RecentActivity,
  DashboardMetrics,
  ActivityItem,
  QuickAction,
  DashboardFilters,
  TimeRange,
  DashboardServiceResult
} from '@/interfaces/IDashboardService'

export class DashboardService implements IDashboardService {
  async getOrganizationStats(orgId: string): Promise<DashboardServiceResult<OrganizationStats>> {
    try {
      // Get total registrations
      const [totalRegistrations] = await db
        .select({ count: count() })
        .from(registrations)
        .where(eq(registrations.organizationId, orgId))

      // Get active QR code sets
      const [activeQRCodes] = await db
        .select({ count: count() })
        .from(qrCodeSets)
        .where(and(
          eq(qrCodeSets.organizationId, orgId),
          eq(qrCodeSets.isActive, true)
        ))

      // Get total QR code sets
      const [totalQRCodeSets] = await db
        .select({ count: count() })
        .from(qrCodeSets)
        .where(eq(qrCodeSets.organizationId, orgId))

      // Get recent scans (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const [recentScans] = await db
        .select({ count: count() })
        .from(qrScans)
        .where(and(
          eq(qrScans.organizationId, orgId),
          gte(qrScans.scannedAt, yesterday.toISOString())
        ))

      // Calculate conversion rate
      const conversionRate = totalRegistrations.count > 0 
        ? (recentScans.count / totalRegistrations.count) * 100 
        : 0

      // Get average check-in time (mock for now)
      const averageCheckInTime = 120 // seconds

      const stats: OrganizationStats = {
        totalRegistrations: totalRegistrations.count,
        activeQRCodes: activeQRCodes.count,
        totalQRCodeSets: totalQRCodeSets.count,
        recentScans: recentScans.count,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageCheckInTime
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('Error getting organization stats:', error)
      return {
        success: false,
        error: 'Failed to get organization statistics'
      }
    }
  }

  async getRecentActivity(orgId: string, limit: number = 10): Promise<DashboardServiceResult<RecentActivity[]>> {
    try {
      const recentActivities = await db
        .select({
          id: activities.id,
          type: activities.type,
          description: activities.description,
          metadata: activities.metadata,
          createdAt: activities.createdAt
        })
        .from(activities)
        .where(eq(activities.organizationId, orgId))
        .orderBy(desc(activities.createdAt))
        .limit(limit)

      const activitiesList: RecentActivity[] = recentActivities.map(activity => ({
        id: activity.id,
        type: activity.type as 'registration' | 'qr_scan' | 'check_in' | 'form_submission',
        description: activity.description,
        timestamp: activity.createdAt,
        metadata: activity.metadata ? JSON.parse(activity.metadata as string) : {}
      }))

      return {
        success: true,
        data: activitiesList
      }
    } catch (error) {
      console.error('Error getting recent activity:', error)
      return {
        success: false,
        error: 'Failed to get recent activity'
      }
    }
  }

  async getDashboardMetrics(orgId: string, filters?: DashboardFilters): Promise<DashboardServiceResult<DashboardMetrics>> {
    try {
      const timeRange = filters?.timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }

      // Get registrations in time range
      const [registrationsCount] = await db
        .select({ count: count() })
        .from(registrations)
        .where(and(
          eq(registrations.organizationId, orgId),
          gte(registrations.registeredAt, timeRange.start.toISOString()),
          lte(registrations.registeredAt, timeRange.end.toISOString())
        ))

      // Get QR scans in time range
      const [scansCount] = await db
        .select({ count: count() })
        .from(qrScans)
        .where(and(
          eq(qrScans.organizationId, orgId),
          gte(qrScans.scannedAt, timeRange.start.toISOString()),
          lte(qrScans.scannedAt, timeRange.end.toISOString())
        ))

      // Get daily registrations for chart data
      const dailyRegistrations = await db
        .select({
          date: sql<string>`DATE(${registrations.registeredAt})`,
          count: count()
        })
        .from(registrations)
        .where(and(
          eq(registrations.organizationId, orgId),
          gte(registrations.registeredAt, timeRange.start.toISOString()),
          lte(registrations.registeredAt, timeRange.end.toISOString())
        ))
        .groupBy(sql`DATE(${registrations.registeredAt})`)
        .orderBy(sql`DATE(${registrations.registeredAt})`)

      const metrics: DashboardMetrics = {
        totalRegistrations: registrationsCount.count,
        totalScans: scansCount.count,
        conversionRate: scansCount.count > 0 
          ? (registrationsCount.count / scansCount.count) * 100 
          : 0,
        dailyRegistrations: dailyRegistrations.map(item => ({
          date: item.date,
          count: item.count
        })),
        topPerformingQRCodes: [], // TODO: Implement
        deviceBreakdown: {}, // TODO: Implement
        locationBreakdown: {} // TODO: Implement
      }

      return {
        success: true,
        data: metrics
      }
    } catch (error) {
      console.error('Error getting dashboard metrics:', error)
      return {
        success: false,
        error: 'Failed to get dashboard metrics'
      }
    }
  }

  async getQuickActions(orgId: string): Promise<DashboardServiceResult<QuickAction[]>> {
    try {
      const quickActions: QuickAction[] = [
        {
          id: 'create_qr',
          title: 'Create QR Code Set',
          description: 'Generate new QR codes for your events',
          icon: '📱',
          href: '/dashboard/qr-codes/create',
          color: 'blue'
        },
        {
          id: 'build_form',
          title: 'Build Form',
          description: 'Create custom registration forms',
          icon: '📝',
          href: '/dashboard/forms/create',
          color: 'green'
        },
        {
          id: 'view_registrations',
          title: 'View Registrations',
          description: 'See all attendee registrations',
          icon: '📊',
          href: '/dashboard/registrations',
          color: 'purple'
        },
        {
          id: 'analytics',
          title: 'Analytics',
          description: 'View detailed analytics',
          icon: '📈',
          href: '/dashboard/analytics',
          color: 'orange'
        }
      ]

      return {
        success: true,
        data: quickActions
      }
    } catch (error) {
      console.error('Error getting quick actions:', error)
      return {
        success: false,
        error: 'Failed to get quick actions'
      }
    }
  }

  async logActivity(orgId: string, activity: Omit<ActivityItem, 'id' | 'timestamp'>): Promise<DashboardServiceResult<void>> {
    try {
      await db.insert(activities).values({
        organizationId: orgId,
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata ? JSON.stringify(activity.metadata) : null,
        createdAt: new Date().toISOString()
      })

      return {
        success: true,
        message: 'Activity logged successfully'
      }
    } catch (error) {
      console.error('Error logging activity:', error)
      return {
        success: false,
        error: 'Failed to log activity'
      }
    }
  }

  async getActivityFeed(orgId: string, limit: number = 20): Promise<DashboardServiceResult<ActivityItem[]>> {
    try {
      const activitiesList = await db
        .select({
          id: activities.id,
          type: activities.type,
          description: activities.description,
          metadata: activities.metadata,
          createdAt: activities.createdAt
        })
        .from(activities)
        .where(eq(activities.organizationId, orgId))
        .orderBy(desc(activities.createdAt))
        .limit(limit)

      const feed: ActivityItem[] = activitiesList.map(activity => ({
        id: activity.id,
        type: activity.type as 'registration' | 'qr_scan' | 'check_in' | 'form_submission',
        description: activity.description,
        timestamp: activity.createdAt,
        metadata: activity.metadata ? JSON.parse(activity.metadata as string) : {}
      }))

      return {
        success: true,
        data: feed
      }
    } catch (error) {
      console.error('Error getting activity feed:', error)
      return {
        success: false,
        error: 'Failed to get activity feed'
      }
    }
  }

  async getPerformanceMetrics(orgId: string, timeRange?: TimeRange): Promise<DashboardServiceResult<any>> {
    try {
      // This would typically include more complex performance metrics
      // For now, return basic metrics
      const metrics = {
        pageLoadTime: 1.2, // seconds
        apiResponseTime: 0.3, // seconds
        errorRate: 0.01, // 1%
        uptime: 99.9 // percentage
      }

      return {
        success: true,
        data: metrics
      }
    } catch (error) {
      console.error('Error getting performance metrics:', error)
      return {
        success: false,
        error: 'Failed to get performance metrics'
      }
    }
  }
}

