/**
 * QR Code Service Interface
 * 
 * Defines the contract for QR code generation and management operations
 * following Interface Segregation Principle (ISP)
 */

export interface QRCodeSet {
  id: string;
  organizationId: string;
  name: string;
  language: string;
  formFields: FormField[];
  qrCodes: QRCode[];
  isActive: boolean;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QRCode {
  id: string;
  label: string;
  entryPoint: string;
  isActive: boolean;
  url?: string;
  scanCount?: number;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

export interface QRCodeSetConfig {
  name: string;
  language: string;
  formFields: FormField[];
  qrCodes: QRCodeConfig[];
}

export interface QRCodeConfig {
  id: string;
  label: string;
  entryPoint: string;
  isActive: boolean;
}

export interface QRImageOptions {
  size: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  logoUrl?: string;
  logoSize?: number;
}

export interface QRScanData {
  qrCodeId: string;
  qrCodeSetId: string;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface QRCodeAnalytics {
  qrCodeId: string;
  qrCodeSetId: string;
  label: string;
  entryPoint: string;
  totalScans: number;
  uniqueScans: number;
  conversionRate: number;
  lastScanned?: string;
  scansByDay: DailyScanData[];
  topDevices: DeviceData[];
  topBrowsers: BrowserData[];
}

export interface DailyScanData {
  date: string;
  scans: number;
  uniqueScans: number;
  conversions: number;
}

export interface DeviceData {
  deviceType: string;
  count: number;
  percentage: number;
}

export interface BrowserData {
  browser: string;
  count: number;
  percentage: number;
}

export interface QRUsageStats {
  qrCodeSetId: string;
  totalScans: number;
  uniqueScans: number;
  totalConversions: number;
  conversionRate: number;
  averageScansPerDay: number;
  peakScanDay: string;
  peakScanCount: number;
}

export interface QRCodeServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export interface QRBrandingOptions {
  primaryColor?: string;
  backgroundColor?: string;
  logoUrl?: string;
  logoSize?: number;
  cornerRadius?: number;
  pattern?: 'square' | 'circle' | 'rounded';
}

/**
 * QR Code Service Interface
 * 
 * Handles all QR code-related operations including generation,
 * management, tracking, and analytics.
 */
export interface IQRCodeService {
  // QR Code Set Management
  generateQRCodeSet(orgId: string, config: QRCodeSetConfig): Promise<QRCodeServiceResult<QRCodeSet>>;
  getQRCodeSet(id: string): Promise<QRCodeServiceResult<QRCodeSet>>;
  getQRCodeSetsByOrganization(orgId: string): Promise<QRCodeServiceResult<QRCodeSet[]>>;
  updateQRCodeSet(id: string, config: QRCodeSetConfig): Promise<QRCodeServiceResult<QRCodeSet>>;
  deleteQRCodeSet(id: string): Promise<QRCodeServiceResult<void>>;
  
  // QR Code Image Generation
  generateQRCodeImage(url: string, options?: QRImageOptions): Promise<QRCodeServiceResult<Buffer>>;
  generateQRCodeImageBase64(url: string, options?: QRImageOptions): Promise<QRCodeServiceResult<string>>;
  
  // URL Generation
  generateRegistrationURL(orgSlug: string, qrCodeId: string): string;
  generateCheckInURL(checkInToken: string): string;
  
  // QR Code Scanning & Tracking
  trackQRCodeScan(scanData: QRScanData): Promise<QRCodeServiceResult<void>>;
  recordConversion(qrCodeId: string, registrationId: string): Promise<QRCodeServiceResult<void>>;
  
  // Analytics & Statistics
  getQRCodeAnalytics(orgId: string, timeRange?: TimeRange): Promise<QRCodeServiceResult<QRCodeAnalytics[]>>;
  getQRCodeUsageStats(qrCodeSetId: string): Promise<QRCodeServiceResult<QRUsageStats>>;
  getQRCodePerformance(qrCodeId: string, timeRange?: TimeRange): Promise<QRCodeServiceResult<QRCodeAnalytics>>;
  
  // Bulk Operations
  generateBulkQRCodes(orgId: string, configs: QRCodeConfig[]): Promise<QRCodeServiceResult<QRCode[]>>;
  exportQRCodeImages(qrCodeSetId: string, format: 'png' | 'svg' | 'pdf'): Promise<QRCodeServiceResult<Buffer>>;
  
  // Validation & Verification
  validateQRCodeAccess(qrCodeId: string, organizationId: string): Promise<boolean>;
  isQRCodeActive(qrCodeId: string): Promise<boolean>;
  
  // QR Code Customization
  updateQRCodeBranding(qrCodeSetId: string, branding: QRBrandingOptions): Promise<QRCodeServiceResult<void>>;
  getDefaultQRImageOptions(): QRImageOptions;
}

