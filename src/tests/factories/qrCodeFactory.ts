// QR Code Factory - Test data generation
import { v4 as uuidv4 } from 'uuid';
import type { QRCode, QRCodeSet } from '@/lib/interfaces/IQRCodeService';

export function createQRCode(overrides?: Partial<QRCode>): QRCode {
  const timestamp = Date.now();
  return {
    id: uuidv4(),
    qrCodeSetId: uuidv4(),
    label: `Test QR ${timestamp}`,
    slug: `test-qr-${timestamp}`,
    url: `https://blessbox.app/register/test-org/test-qr-${timestamp}`,
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    isActive: true,
    scanCount: 0,
    registrationCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createQRCodeSet(overrides?: Partial<QRCodeSet>): QRCodeSet {
  const timestamp = Date.now();
  return {
    id: uuidv4(),
    organizationId: uuidv4(),
    name: `Test QR Set ${timestamp}`,
    language: 'en',
    isActive: true,
    scanCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
