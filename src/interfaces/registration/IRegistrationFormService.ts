// 🎉 REGISTRATION FORM SERVICE - PURE ISP BLISS! ✨
// No mocks, only HARDENED database power! 💪

export interface IRegistrationFormService {
  // 🚀 Create registration with REAL data persistence!
  createRegistration(data: RegistrationFormData): Promise<RegistrationResult>;
  
  // 🎯 Get registration by QR code scan
  getRegistrationByQRCode(qrCodeId: string, entryPoint?: string): Promise<RegistrationForm | null>;
  
  // 🌟 Get registration form by organization slug and QR label (for beautiful URLs!)
  getRegistrationFormBySlug(orgSlug: string, qrLabel: string): Promise<RegistrationForm | null>;
  
  // 📊 Get all registrations for organization
  getRegistrationsByOrganization(organizationId: string, filters?: RegistrationFilters): Promise<RegistrationEntry[]>;
  
  // ✅ Update registration status (delivered, etc.)
  updateRegistrationStatus(registrationId: string, status: RegistrationStatus, deliveredAt?: Date): Promise<void>;
  
  // 📈 Get registration analytics
  getRegistrationAnalytics(organizationId: string): Promise<RegistrationAnalytics>;
}

export interface RegistrationFormData {
  qrCodeId: string;
  entryPoint?: string; // Door A, Lane 1, etc.
  formData: Record<string, any>; // Dynamic form fields
  ipAddress?: string;
  userAgent?: string;
  submittedAt: Date;
}

export interface RegistrationResult {
  success: boolean;
  registrationId?: string;
  message: string;
  errors?: ValidationError[];
}

export interface RegistrationForm {
  id: string;
  organizationId: string;
  organizationName: string;
  eventName?: string;
  qrCodeLabel: string;
  entryPoint?: string;
  formFields: FormField[];
  customDomain?: string;
  language: string;
  createdAt: Date;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[]; // For select fields
  placeholder?: string;
  validation?: FieldValidation;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface RegistrationEntry {
  id: string;
  organizationId: string;
  qrCodeId: string;
  qrCodeLabel: string;
  entryPoint?: string;
  registrationData: Record<string, any>;
  status: RegistrationStatus;
  ipAddress?: string;
  userAgent?: string;
  registeredAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationFilters {
  qrCodeLabel?: string;
  entryPoint?: string;
  status?: RegistrationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Search in registration data
  limit?: number;
  offset?: number;
}

export interface RegistrationAnalytics {
  totalRegistrations: number;
  registrationsByStatus: Record<RegistrationStatus, number>;
  registrationsByQRCode: Array<{
    qrCodeLabel: string;
    entryPoint?: string;
    count: number;
  }>;
  registrationsByDate: Array<{
    date: string;
    count: number;
  }>;
  averageRegistrationsPerDay: number;
}

export type RegistrationStatus = 'pending' | 'delivered' | 'failed' | 'cancelled';

export interface ValidationError {
  field: string;
  message: string;
}