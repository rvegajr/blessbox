/**
 * Authentication Component Types
 * 
 * ISP Principle: Interface Segregation
 * - Single responsibility: Authentication actions only
 * - No mixing with other concerns (UI, routing, etc.)
 */

/**
 * SignOutButton Component Props
 * 
 * ISP Compliance: Single responsibility for sign-out functionality
 * - No UI styling concerns mixed in
 * - No routing logic mixed in
 * - Focused on authentication action only
 */
export interface SignOutButtonProps {
  /** Button variant for styling */
  variant?: 'default' | 'outline' | 'ghost'
  /** URL to redirect to after sign-out */
  callbackUrl?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Authentication Actions Interface
 * 
 * ISP Principle: Segregated interface for authentication actions
 * - Single responsibility: Authentication operations
 * - No mixing with user management, organization logic, etc.
 * - Can be implemented independently
 */
export interface IAuthenticationActions {
  /**
   * Sign out the current user
   * @param options - Sign out options including callback URL
   * @returns Promise that resolves when sign-out is complete
   */
  signOut: (options?: { callbackUrl: string }) => Promise<void>
}

/**
 * Authentication State Interface
 * 
 * ISP Principle: Separate state management from actions
 * - Single responsibility: Authentication state
 * - No mixing with business logic
 */
export interface IAuthenticationState {
  /** Whether user is currently signed in */
  isAuthenticated: boolean
  /** Whether sign-out is in progress */
  isSigningOut: boolean
  /** Current user session data */
  session: any | null
}

/**
 * Authentication Error Interface
 * 
 * ISP Principle: Separate error handling from main functionality
 * - Single responsibility: Error management
 * - No mixing with success flows
 */
export interface IAuthenticationError {
  /** Error message */
  message: string
  /** Error code for programmatic handling */
  code?: string
  /** Whether error is recoverable */
  recoverable: boolean
}


