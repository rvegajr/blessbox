// Interface Segregation Principle: Data migration service
export interface IDataMigration {
  // Migrate onboarding data from sessionStorage to database
  migrateOnboardingData(sessionData: OnboardingSessionData): Promise<MigrationResult>;
  
  // Migrate QR code data to database
  migrateQRCodeData(organizationId: string, qrData: QRCodeSessionData[]): Promise<MigrationResult>;
  
  // Check if data needs migration
  needsMigration(sessionData: OnboardingSessionData): boolean;
  
  // Clean up session data after successful migration
  cleanupSessionData(): void;
  
  // Get migration status
  getMigrationStatus(organizationId: string): Promise<MigrationStatus>;
}

export interface OnboardingSessionData {
  organizationName: string;
  eventName?: string;
  customDomain?: string;
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  contactState?: string;
  contactZip?: string;
  emailVerified?: boolean;
  formFields?: FormFieldData[];
  qrCodes?: QRCodeSessionData[];
  formLanguage?: string;
  onboardingComplete?: boolean;
  completedAt?: string;
}

export interface QRCodeSessionData {
  id: string;
  label: string;
  language: string;
  url: string;
  dataUrl: string;
  generatedAt: string;
}

export interface FormFieldData {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export interface MigrationResult {
  success: boolean;
  organizationId?: string;
  qrCodeSetId?: string;
  errors?: string[];
  warnings?: string[];
}

export interface MigrationStatus {
  isMigrated: boolean;
  migratedAt?: Date;
  organizationId?: string;
  qrCodeSetId?: string;
  hasQRCodes: boolean;
  totalRegistrations?: number;
}