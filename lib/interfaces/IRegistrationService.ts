// IRegistrationService - Interface Segregation Principle Compliant
// Single responsibility: Registration form configuration, submission, and management

export interface RegistrationFormData {
  [key: string]: string | number | boolean;
}

export interface Registration {
  id: string;
  qrCodeSetId: string;
  qrCodeId: string;
  registrationData: string; // JSON string
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  deliveryStatus: 'pending' | 'delivered' | 'cancelled';
  deliveredAt?: string;
  registeredAt: string;
  checkInToken?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  tokenStatus?: 'active' | 'used' | 'expired';
}

export interface RegistrationFormConfig {
  id: string;
  organizationId: string;
  name: string;
  language: string;
  formFields: Array<{
    id: string;
    type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
  }>;
  qrCodes: Array<{
    id: string;
    label: string;
    url: string;
    dataUrl?: string;
  }>;
}

export interface RegistrationMetadata {
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export interface RegistrationFilters {
  qrCodeSetId?: string;
  qrCodeId?: string;
  deliveryStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface RegistrationUpdate {
  deliveryStatus?: 'pending' | 'delivered' | 'cancelled';
  deliveredAt?: string;
}

export interface IRegistrationService {
  // Form configuration (read-only from onboarding)
  getFormConfig(orgSlug: string, qrLabel: string): Promise<RegistrationFormConfig | null>;
  
  // Registration submission
  submitRegistration(
    orgSlug: string,
    qrLabel: string,
    formData: RegistrationFormData,
    metadata?: RegistrationMetadata
  ): Promise<Registration>;
  
  // Registration management
  listRegistrations(
    organizationId: string,
    filters?: RegistrationFilters
  ): Promise<Registration[]>;
  
  getRegistration(id: string): Promise<Registration | null>;
  
  updateRegistration(
    id: string,
    updates: RegistrationUpdate
  ): Promise<Registration>;
  
  deleteRegistration(id: string): Promise<void>;
  
  // Check-in functionality
  checkInRegistration(
    id: string,
    checkedInBy?: string
  ): Promise<Registration>;
  
  // Analytics
  getRegistrationStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    delivered: number;
    cancelled: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  }>;
}
