/**
 * Export Service Interface (ISP Compliant)
 * 
 * Single Responsibility: Data Export Operations
 * Following Interface Segregation Principle (ISP)
 */

import { ExportResult, ExportFormat, ExportFilters, TimeRange, DashboardServiceResult } from '../IDashboardService'

/**
 * Export Service Interface
 * 
 * Handles only data export operations.
 * Clients that only need export don't depend on
 * analytics, real-time monitoring, or customization methods.
 */
export interface IExportService {
  // Data Export (Single Responsibility)
  exportRegistrationData(orgId: string, format: ExportFormat, filters?: ExportFilters): Promise<DashboardServiceResult<ExportResult>>;
  exportAnalyticsData(orgId: string, format: ExportFormat, timeRange?: TimeRange): Promise<DashboardServiceResult<ExportResult>>;
  exportQRCodeData(orgId: string, format: ExportFormat, qrCodeSetId?: string): Promise<DashboardServiceResult<ExportResult>>;
}


