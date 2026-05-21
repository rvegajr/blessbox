/**
 * Phase B: QR Code JSON Mapper Implementation
 * Pure mapper extracting QR code JSON-to-domain logic
 */

import type { IQRCodeJsonMapper } from '../interfaces/IQRCodeMapper';
import type { QRCode } from '../interfaces/IQRCodeService';

export class QRCodeJsonMapper implements IQRCodeJsonMapper {
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
  ): QRCode {
    return {
      id: jsonRow.id,
      qrCodeSetId: set.id,
      label: jsonRow.label,
      slug: jsonRow.slug || jsonRow.label.toLowerCase().replace(/\s+/g, '-'),
      url: jsonRow.url,
      dataUrl: jsonRow.dataUrl || '',
      description: jsonRow.description || undefined,
      isActive: jsonRow.isActive !== undefined ? jsonRow.isActive : set.isActive,
      scanCount: set.scanCount,
      registrationCount,
      createdAt: jsonRow.createdAt || set.createdAt,
      updatedAt: set.updatedAt,
    };
  }
}
