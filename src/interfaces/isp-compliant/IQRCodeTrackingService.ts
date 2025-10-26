/**
 * QR Code Tracking Service Interface (ISP Compliant)
 * 
 * Single Responsibility: QR Code Scan Tracking
 * Following Interface Segregation Principle (ISP)
 */

import { QRScanData, QRCodeServiceResult } from '../IQRCodeService'

/**
 * QR Code Tracking Service Interface
 * 
 * Handles only QR code tracking and conversion operations.
 * Clients that only need tracking don't depend on
 * management, analytics, or image generation methods.
 */
export interface IQRCodeTrackingService {
  // QR Code Scanning & Tracking (Single Responsibility)
  trackQRCodeScan(scanData: QRScanData): Promise<QRCodeServiceResult<void>>;
  recordConversion(qrCodeId: string, registrationId: string): Promise<QRCodeServiceResult<void>>;
}


