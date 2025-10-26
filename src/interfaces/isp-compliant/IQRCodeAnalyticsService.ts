/**
 * QR Code Analytics Service Interface (ISP Compliant)
 * 
 * Single Responsibility: QR Code Analytics and Statistics
 * Following Interface Segregation Principle (ISP)
 */

import { QRCodeAnalytics, QRUsageStats, TimeRange, QRCodeServiceResult } from '../IQRCodeService'

/**
 * QR Code Analytics Service Interface
 * 
 * Handles only QR code analytics and statistics operations.
 * Clients that only need analytics don't depend on
 * management, tracking, or image generation methods.
 */
export interface IQRCodeAnalyticsService {
  // Analytics & Statistics (Single Responsibility)
  getQRCodeAnalytics(orgId: string, timeRange?: TimeRange): Promise<QRCodeServiceResult<QRCodeAnalytics[]>>;
  getQRCodeUsageStats(qrCodeSetId: string): Promise<QRCodeServiceResult<QRUsageStats>>;
  getQRCodePerformance(qrCodeId: string, timeRange?: TimeRange): Promise<QRCodeServiceResult<QRCodeAnalytics>>;
}


