/**
 * QR Code Management Service Interface (ISP Compliant)
 * 
 * Single Responsibility: QR Code Set CRUD Operations
 * Following Interface Segregation Principle (ISP)
 */

import { QRCodeSet, QRCodeSetConfig, QRCodeServiceResult } from '../IQRCodeService'

/**
 * QR Code Management Service Interface
 * 
 * Handles only QR code set management operations.
 * Clients that only need CRUD operations don't depend on
 * analytics, tracking, or image generation methods.
 */
export interface IQRCodeManagementService {
  // QR Code Set Management (Single Responsibility)
  generateQRCodeSet(orgId: string, config: QRCodeSetConfig): Promise<QRCodeServiceResult<QRCodeSet>>;
  getQRCodeSet(id: string): Promise<QRCodeServiceResult<QRCodeSet>>;
  getQRCodeSetsByOrganization(orgId: string): Promise<QRCodeServiceResult<QRCodeSet[]>>;
  updateQRCodeSet(id: string, config: QRCodeSetConfig): Promise<QRCodeServiceResult<QRCodeSet>>;
  deleteQRCodeSet(id: string): Promise<QRCodeServiceResult<void>>;
}


