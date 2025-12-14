/**
 * Usage Limit Checker Interface - ISP Compliant
 * 
 * Single Responsibility: Check if an organization can perform an action
 * based on their subscription limits.
 * 
 * This interface is intentionally minimal - it does ONE thing well.
 * The Registration API only needs to know: "Can this org register?"
 */

export interface UsageLimitResult {
  /** Whether the action is allowed */
  allowed: boolean;
  
  /** Current registration count */
  currentCount: number;
  
  /** Maximum allowed registrations for this plan */
  limit: number;
  
  /** Registrations remaining before limit */
  remaining: number;
  
  /** Plan type for context */
  planType: 'free' | 'standard' | 'enterprise';
  
  /** Human-readable message (only when not allowed) */
  message?: string;
  
  /** Upgrade URL hint for UI */
  upgradeUrl?: string;
}

export interface IUsageLimitChecker {
  /**
   * Check if an organization can create a new registration.
   * 
   * @param organizationId - The organization to check
   * @returns UsageLimitResult with allowed status and context
   */
  canRegister(organizationId: string): Promise<UsageLimitResult>;
}
