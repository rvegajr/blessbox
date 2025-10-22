/**
 * Registration Service Interface
 * 
 * Defines the contract for registration management operations
 * following Interface Segregation Principle (ISP)
 */

export interface Registration {
  id: string;
  organizationId: string;
  qrCodeSetId: string;
  qrCodeId: string;
  registrationData: Record<string, any>;
  checkInToken?: string;
  deliveryStatus: 'pending' | 'delivered' | 'checked-in' | 'cancelled';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  checkedInAt?: string;
  checkedInBy?: string;
}

export interface RegistrationSubmissionData {
  qrCodeSetId: string;
  qrCodeId: string;
  registrationData: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface RegistrationFilters {
  status?: 'pending' | 'delivered' | 'checked-in' | 'cancelled';
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
  qrCodeId?: string;
}

export interface DeliveryStatus {
  status: 'pending' | 'delivered' | 'checked-in' | 'cancelled';
  notes?: string;
  updatedBy?: string;
}

export interface CheckInResult {
  success: boolean;
  registration: Registration;
  message: string;
}

export interface RegistrationServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Registration Service Interface
 * 
 * Handles all registration-related operations including submission,
 * management, check-in processing, and status updates.
 */
export interface IRegistrationService {
  // Registration Management
  submitRegistration(data: RegistrationSubmissionData): Promise<RegistrationServiceResult<Registration>>;
  getRegistration(id: string): Promise<RegistrationServiceResult<Registration>>;
  getRegistrationsByOrganization(orgId: string, filters?: RegistrationFilters): Promise<RegistrationServiceResult<Registration[]>>;
  updateRegistration(id: string, data: Partial<Registration>): Promise<RegistrationServiceResult<Registration>>;
  deleteRegistration(id: string): Promise<RegistrationServiceResult<void>>;
  
  // Delivery Status Management
  updateDeliveryStatus(registrationId: string, status: DeliveryStatus): Promise<RegistrationServiceResult<Registration>>;
  getRegistrationsByStatus(orgId: string, status: string): Promise<RegistrationServiceResult<Registration[]>>;
  
  // Check-in System
  generateCheckInToken(registrationId: string): Promise<RegistrationServiceResult<string>>;
  processCheckIn(token: string, staffId: string): Promise<RegistrationServiceResult<CheckInResult>>;
  getCheckInToken(token: string): Promise<RegistrationServiceResult<Registration>>;
  
  // Analytics & Reporting
  getRegistrationStats(orgId: string, timeRange?: TimeRange): Promise<RegistrationServiceResult<RegistrationStats>>;
  getRegistrationTrends(orgId: string, timeRange?: TimeRange): Promise<RegistrationServiceResult<RegistrationTrend[]>>;
  exportRegistrations(orgId: string, format: 'csv' | 'json' | 'pdf', filters?: RegistrationFilters): Promise<RegistrationServiceResult<Buffer>>;
  
  // Validation & Security
  validateRegistrationAccess(registrationId: string, organizationId: string): Promise<boolean>;
  isRegistrationValid(registrationId: string): Promise<boolean>;
}

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export interface RegistrationStats {
  totalRegistrations: number;
  pendingRegistrations: number;
  deliveredRegistrations: number;
  checkedInRegistrations: number;
  cancelledRegistrations: number;
  conversionRate: number;
  averageCheckInTime: number;
  peakRegistrationHour: number;
}

export interface RegistrationTrend {
  date: string;
  registrations: number;
  checkIns: number;
  conversionRate: number;
}

