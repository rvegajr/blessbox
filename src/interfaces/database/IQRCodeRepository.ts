// Interface Segregation Principle: QR Code-specific database operations
export interface IQRCodeRepository {
  // Create operations
  create(qrCodeSet: CreateQRCodeSetData): Promise<QRCodeSet>;
  
  // Read operations
  findById(id: string): Promise<QRCodeSet | null>;
  findByOrganizationId(organizationId: string): Promise<QRCodeSet[]>;
  
  // Update operations
  update(id: string, data: Partial<QRCodeSet>): Promise<QRCodeSet>;
  updateStatus(id: string, isActive: boolean): Promise<void>;
  
  // Delete operations
  delete(id: string): Promise<void>;
  
  // Analytics operations
  incrementScanCount(id: string): Promise<void>;
  getAnalytics(id: string, dateRange?: DateRange): Promise<QRCodeAnalytics>;
}

export interface CreateQRCodeSetData {
  organizationId: string;
  name: string;
  language: string;
  formFields: FormField[];
  qrCodes: QRCodeData[];
}

export interface QRCodeSet extends CreateQRCodeSetData {
  id: string;
  isActive: boolean;
  scanCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRCodeData {
  id: string;
  label: string;
  url: string;
  dataUrl: string; // Base64 image
  language: string;
  scanCount: number;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select fields
  validation?: FieldValidation;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface QRCodeAnalytics {
  totalScans: number;
  uniqueScans: number;
  scansByDate: { date: string; count: number }[];
  scansByQRCode: { qrCodeId: string; label: string; count: number }[];
}