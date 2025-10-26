/**
 * QR Code URL Service Interface (ISP Compliant)
 * 
 * Single Responsibility: QR Code URL Generation
 * Following Interface Segregation Principle (ISP)
 */

/**
 * QR Code URL Service Interface
 * 
 * Handles only QR code URL generation operations.
 * Clients that only need URL generation don't depend on
 * management, tracking, or analytics methods.
 */
export interface IQRCodeURLService {
  // URL Generation (Single Responsibility)
  generateRegistrationURL(orgSlug: string, qrCodeId: string): string;
  generateCheckInURL(checkInToken: string): string;
}


