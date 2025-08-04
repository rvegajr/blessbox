/**
 * Usage Tracking Service Interface - ISP Compliant
 * Handles ONLY usage monitoring and tracking operations
 */

export interface UsageStats {
  organizationId: string;
  currentPlan: 'free' | 'standard' | 'enterprise';
  registrationCount: number;
  registrationLimit: number;
  usagePercentage: number;
  isLimitReached: boolean;
  isNearLimit: boolean; // 80% or more of limit used
  resetDate?: Date; // For plans with monthly limits
}

export interface UsageHistory {
  date: Date;
  registrationCount: number;
  qrCodeScans: number;
  exportCount: number;
  searchCount: number;
}

export interface UsageAlert {
  id: string;
  organizationId: string;
  type: 'limit_warning' | 'limit_reached' | 'plan_upgrade_suggested';
  threshold: number; // Percentage that triggered the alert
  message: string;
  isActive: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
}

export interface PlanLimits {
  free: {
    registrations: 10;
    exports: 5;
    qrCodes: 1;
  };
  standard: {
    registrations: 100000;
    exports: 100;
    qrCodes: 50;
  };
  enterprise: {
    registrations: -1; // Unlimited
    exports: -1; // Unlimited
    qrCodes: -1; // Unlimited
  };
}

/**
 * Usage Tracking Service - Focused ONLY on usage monitoring
 * Following Interface Segregation Principle
 */
export interface IUsageTrackingService {
  /**
   * Get current usage statistics for an organization
   */
  getUsageStats(organizationId: string): Promise<UsageStats>;

  /**
   * Track a new registration (increment counter)
   */
  trackRegistration(organizationId: string): Promise<void>;

  /**
   * Track QR code scan
   */
  trackQRCodeScan(organizationId: string, qrCodeId: string): Promise<void>;

  /**
   * Track export operation
   */
  trackExport(organizationId: string, recordCount: number): Promise<void>;

  /**
   * Track search operation
   */
  trackSearch(organizationId: string, searchQuery: string): Promise<void>;

  /**
   * Check if organization can perform action based on limits
   */
  canPerformAction(
    organizationId: string,
    action: 'registration' | 'export' | 'qr_code_creation'
  ): Promise<boolean>;

  /**
   * Get usage history for an organization
   */
  getUsageHistory(
    organizationId: string,
    days?: number
  ): Promise<UsageHistory[]>;

  /**
   * Get active usage alerts for an organization
   */
  getUsageAlerts(organizationId: string): Promise<UsageAlert[]>;

  /**
   * Acknowledge a usage alert
   */
  acknowledgeAlert(alertId: string): Promise<void>;

  /**
   * Get plan limits
   */
  getPlanLimits(): PlanLimits;

  /**
   * Reset usage counters (for monthly plans)
   */
  resetUsageCounters(organizationId: string): Promise<void>;
}