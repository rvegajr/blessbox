// Interface Segregation Principle: Registration-specific database operations
export interface IRegistrationRepository {
  // Create operations
  create(registration: CreateRegistrationData): Promise<Registration>;
  
  // Read operations
  findById(id: string): Promise<Registration | null>;
  findByQRCodeSetId(qrCodeSetId: string, limit?: number, offset?: number): Promise<Registration[]>;
  findByOrganizationId(organizationId: string, limit?: number, offset?: number): Promise<Registration[]>;
  
  // Analytics operations
  countByQRCodeSetId(qrCodeSetId: string): Promise<number>;
  countByOrganizationId(organizationId: string): Promise<number>;
  getRegistrationStats(organizationId: string, dateRange?: DateRange): Promise<RegistrationStats>;
  
  // Export operations
  exportToCSV(qrCodeSetId: string): Promise<string>;
  exportToJSON(qrCodeSetId: string): Promise<Registration[]>;
  
  // Delete operations (for GDPR compliance)
  delete(id: string): Promise<void>;
  deleteByEmail(email: string): Promise<number>; // Returns count of deleted records
}

export interface CreateRegistrationData {
  qrCodeSetId: string;
  qrCodeId: string; // Which specific QR code was scanned
  registrationData: Record<string, any>; // Form field values
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export interface Registration extends CreateRegistrationData {
  id: string;
  registeredAt: Date;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface RegistrationStats {
  totalRegistrations: number;
  registrationsByDate: { date: string; count: number }[];
  registrationsByQRCode: { qrCodeId: string; label: string; count: number }[];
  averageCompletionTime?: number; // In seconds
  conversionRate?: number; // Percentage
}