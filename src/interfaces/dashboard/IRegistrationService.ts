/**
 * Registration Service Interface - ISP Compliant
 * Handles ONLY registration-related operations
 */

export interface RegistrationData {
  id: string;
  qrCodeSetId: string;
  qrCodeId: string;
  registrationData: any; // Form data collected from user
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  registeredAt: Date;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  deliveredAt?: Date;
}

export interface RegistrationFilters {
  qrCodeLabels?: string[];
  deliveryStatus?: ('pending' | 'delivered' | 'failed')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customFields?: Record<string, any>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface RegistrationListResult {
  registrations: RegistrationData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Registration Service - Focused ONLY on registration operations
 * Following Interface Segregation Principle
 */
export interface IRegistrationService {
  /**
   * Get paginated list of registrations for an organization
   */
  getRegistrations(
    organizationId: string,
    filters?: RegistrationFilters,
    pagination?: PaginationOptions
  ): Promise<RegistrationListResult>;

  /**
   * Get a single registration by ID
   */
  getRegistrationById(id: string): Promise<RegistrationData | null>;

  /**
   * Update delivery status of a registration
   */
  updateDeliveryStatus(
    id: string,
    status: 'pending' | 'delivered' | 'failed'
  ): Promise<RegistrationData | null>;

  /**
   * Get registration count by QR code
   */
  getRegistrationCountByQRCode(qrCodeId: string): Promise<number>;

  /**
   * Bulk update delivery status
   */
  bulkUpdateDeliveryStatus(
    ids: string[],
    status: 'pending' | 'delivered' | 'failed'
  ): Promise<number>;
}