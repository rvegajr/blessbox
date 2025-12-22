// IQRCodeService - Interface Segregation Principle Compliant
// Single responsibility: QR code management, analytics, and download

export interface QRCode {
  id: string;
  qrCodeSetId: string;
  /**
   * Immutable URL segment used by `/register/[orgSlug]/[qrLabel]`.
   * Historically named `label` in storage; for safety this should be treated as stable.
   */
  label: string;
  slug: string;
  url: string;
  dataUrl: string; // base64 image
  /**
   * Human-friendly display name (safe to edit in dashboard).
   * In onboarding-generated QR codes, this is typically the entry point label (e.g. "Main Entrance").
   */
  description?: string;
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
  /**
   * @deprecated Do NOT change the URL segment from the dashboard.
   * For backward compatibility, if provided, implementations should treat this as a request
   * to update the human-friendly display name (description) and keep the URL segment stable.
   */
  label?: string;
  /** Human-friendly display name (safe to edit). */
  description?: string;
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
  
  // Update QR code (display name/description, active status). URL segment is intentionally stable.
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

