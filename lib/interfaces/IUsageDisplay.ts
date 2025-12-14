/**
 * Usage Display Interface - ISP Compliant
 * 
 * Single Responsibility: Get displayable usage information for UI.
 * This interface is intentionally separate from IUsageLimitChecker
 * because the dashboard needs different data than the registration API.
 */

export type UsageStatus = 'ok' | 'warning' | 'critical';

export interface UsageDisplayData {
  /** Current registration count */
  currentCount: number;
  
  /** Maximum allowed registrations for this plan */
  limit: number;
  
  /** Usage as a percentage (0-100+) */
  percentage: number;
  
  /** Plan type for display */
  planType: 'free' | 'standard' | 'enterprise';
  
  /** Visual status indicator */
  status: UsageStatus;
  
  /** Registrations remaining */
  remaining: number;
}

export interface IUsageDisplay {
  /**
   * Get usage display data for dashboard/UI.
   * 
   * @param organizationId - The organization to get usage for
   * @returns UsageDisplayData with counts, percentage, and status
   */
  getUsageDisplay(organizationId: string): Promise<UsageDisplayData>;
}

/**
 * Calculate usage status based on percentage.
 * - ok: < 80%
 * - warning: 80-95%
 * - critical: > 95%
 */
export function calculateUsageStatus(percentage: number): UsageStatus {
  if (percentage >= 95) return 'critical';
  if (percentage >= 80) return 'warning';
  return 'ok';
}
