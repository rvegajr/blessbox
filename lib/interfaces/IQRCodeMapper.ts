/**
 * Phase B: ISP interface for QR Code JSON mapping
 * Extracts QR code JSON-to-domain mapping logic from QRCodeService
 */

import type { QRCode } from './IQRCodeService';

export interface IQRCodeJsonMapper {
  /**
   * Maps a single QR code from JSON blob to domain model
   * @param jsonRow - Raw QR code data from JSON blob
   * @param set - Parent QR code set metadata
   * @param registrationCount - Number of registrations for this QR code
   * @returns Mapped QRCode domain object
   */
  mapJsonToQRCode(
    jsonRow: any,
    set: { 
      id: string; 
      isActive: boolean; 
      scanCount: number; 
      createdAt: string; 
      updatedAt: string 
    },
    registrationCount: number
  ): QRCode;
}
