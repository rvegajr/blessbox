/**
 * QR Code Image Service Interface (ISP Compliant)
 * 
 * Single Responsibility: QR Code Image Generation
 * Following Interface Segregation Principle (ISP)
 */

import { QRImageOptions, QRCodeServiceResult } from '../IQRCodeService'

/**
 * QR Code Image Service Interface
 * 
 * Handles only QR code image generation operations.
 * Clients that only need image generation don't depend on
 * management, tracking, or analytics methods.
 */
export interface IQRCodeImageService {
  // QR Code Image Generation (Single Responsibility)
  generateQRCodeImage(url: string, options?: QRImageOptions): Promise<QRCodeServiceResult<Buffer>>;
  generateQRCodeImageBase64(url: string, options?: QRImageOptions): Promise<QRCodeServiceResult<string>>;
  getDefaultQRImageOptions(): QRImageOptions;
}


