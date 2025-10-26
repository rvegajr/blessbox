/**
 * Analytics Service Interface (ISP Compliant)
 * 
 * Single Responsibility: Analytics and Statistics
 * Following Interface Segregation Principle (ISP)
 */

import { OrganizationStats, RegistrationTrend, Activity, DashboardServiceResult, TimeRange } from '../IDashboardService'

/**
 * Analytics Service Interface
 * 
 * Handles only analytics and statistics operations.
 * Clients that only need analytics don't depend on
 * real-time monitoring, export, or customization methods.
 */
export interface IAnalyticsService {
  // Organization Analytics (Single Responsibility)
  getOrganizationStats(orgId: string): Promise<DashboardServiceResult<OrganizationStats>>;
  getRegistrationTrends(orgId: string, timeRange?: TimeRange): Promise<DashboardServiceResult<RegistrationTrend[]>>;
  getRecentActivity(orgId: string, limit?: number): Promise<DashboardServiceResult<Activity[]>>;
}


