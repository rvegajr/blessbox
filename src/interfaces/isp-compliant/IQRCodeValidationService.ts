/**
 * QR Code Validation Service Interface (ISP Compliant)
 * 
 * Single Responsibility: QR Code Validation and Verification
 * Following Interface Segregation Principle (ISP)
 */

/**
 * QR Code Validation Service Interface
 * 
 * Handles only QR code validation and verification operations.
 * Clients that only need validation don't depend on
 * management, tracking, or analytics methods.
 */
export interface IQRCodeValidationService {
  // Validation & Verification (Single Responsibility)
  validateQRCodeAccess(qrCodeId: string, organizationId: string): Promise<boolean>;
  isQRCodeActive(qrCodeId: string): Promise<boolean>;
}


