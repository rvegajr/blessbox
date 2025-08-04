export interface QRCodeConfig {
  id: string;
  label?: string;
  eventType: 'food-donation' | 'seminar-registration' | 'volunteer-signup' | 'custom-event';
  eventName: string;
  organizationId: string;
  requiredFields: RequiredField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  qrCodeUrl?: string;
  registrationUrl: string;
  totalScans?: number;
  totalRegistrations?: number;
}

export interface RequiredField {
  id: string;
  name: string;
  type: 'text' | 'phone' | 'email' | 'select' | 'number';
  label: string;
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

export interface QRCodeSet {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  eventType: 'food-donation' | 'seminar-registration' | 'volunteer-signup' | 'custom-event';
  eventName: string;
  requiredFields: RequiredField[];
  qrCodes: QRCodeConfig[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalRegistrations?: number;
}

export interface QRCodeRegistration {
  id: string;
  qrCodeId: string;
  qrCodeLabel?: string;
  registrationData: Record<string, any>;
  submittedAt: Date;
  registrationTimestamp: Date; // When user filled out the form
  ipAddress?: string;
  userAgent?: string;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  distributed: boolean;
  distributedAt?: Date; // When item was distributed
  distributedBy?: string;
  actionTaken?: string;
  actionTakenAt?: Date;
  actionTakenBy?: string;
  notes?: string;
}

export interface QRCodeAnalytics {
  qrCodeId: string;
  qrCodeLabel?: string;
  totalScans: number;
  totalRegistrations: number;
  conversionRate: number;
  scansByHour: Array<{
    hour: string;
    scans: number;
    registrations: number;
  }>;
  scansByDay: Array<{
    date: string;
    scans: number;
    registrations: number;
  }>;
  topDevices: Array<{
    device: string;
    count: number;
  }>;
  topLocations?: Array<{
    location: string;
    count: number;
  }>;
}

export interface OrganizationQRSettings {
  organizationId: string;
  defaultEventTypes: string[];
  defaultRequiredFields: RequiredField[];
  maxQRCodesPerSet: number;
  allowCustomLabels: boolean;
  autoArchiveAfterDays?: number;
  emailNotifications: {
    newRegistrations: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
  };
  customDomain?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}