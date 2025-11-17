// IQRCodeService - Interface Segregation Principle Compliant
// Single responsibility: QR code management, analytics, and download

export interface QRCode {
  id: string;
  qrCodeSetId: string;
  label: string;
  slug: string;
  url: string;
  dataUrl: string; // base64 image
  isActive: boolean;
  scanCount: number;
  registrationCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface QRCodeSet {
  id: string;
  organizationId: string;
  name: string;
  language: string;
  isActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeUpdate {
  label?: string;
  isActive?: boolean;
}

export interface QRCodeAnalytics {
  scanCount: number;
  registrationCount: number;
  lastScanned?: string;
  lastRegistration?: string;
  dailyScans?: Array<{ date: string; count: number }>;
  dailyRegistrations?: Array<{ date: string; count: number }>;
}

export interface IQRCodeService {
  // List QR codes for an organization
  listQRCodes(organizationId: string): Promise<QRCode[]>;
  
  // Get QR codes by QR code set
  getQRCodesBySet(qrCodeSetId: string): Promise<QRCode[]>;
  
  // Get single QR code by ID
  getQRCode(id: string, qrCodeSetId: string): Promise<QRCode | null>;
  
  // Update QR code (label, active status)
  updateQRCode(id: string, qrCodeSetId: string, updates: QRCodeUpdate): Promise<QRCode>;
  
  // Delete QR code (soft delete - set inactive)
  deleteQRCode(id: string, qrCodeSetId: string): Promise<void>;
  
  // Download QR code (get base64 image)
  downloadQRCode(id: string, qrCodeSetId: string): Promise<string>;
  
  // Get QR code analytics
  getQRCodeAnalytics(id: string, qrCodeSetId: string): Promise<QRCodeAnalytics>;
  
  // Get QR code sets for an organization
  getQRCodeSets(organizationId: string): Promise<QRCodeSet[]>;
  
  // Get QR code set by ID
  getQRCodeSet(id: string): Promise<QRCodeSet | null>;
  
  // Update QR code set (name, active status)
  updateQRCodeSet(id: string, updates: { name?: string; isActive?: boolean }): Promise<QRCodeSet>;
}

