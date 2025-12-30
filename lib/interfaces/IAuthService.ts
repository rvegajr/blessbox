/**
 * IAuthService - Interface for Authentication Service (ISP Compliant)
 * 
 * Handles user authentication via 6-digit email verification codes.
 * Email is the source of truth for identity.
 */

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
  role?: 'user' | 'admin' | 'super_admin';
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
  token: string;
}

export interface IAuthSessionReader {
  /**
   * Get current session from request context
   */
  getSession(): Promise<AuthSession | null>;
  
  /**
   * Validate a JWT token and return the session
   */
  validateToken(token: string): Promise<AuthSession | null>;
}

export interface IAuthSessionWriter {
  /**
   * Create a new session after successful verification
   */
  createSession(user: AuthUser, expiresInSeconds?: number): Promise<AuthSession>;
  
  /**
   * Invalidate/destroy a session
   */
  destroySession(token: string): Promise<void>;
}

export interface IAuthService extends IAuthSessionReader, IAuthSessionWriter {
  /**
   * Send verification code to email
   */
  sendVerificationCode(email: string): Promise<{ success: boolean; message: string }>;
  
  /**
   * Verify code and create session if valid
   * Returns session on success, null on failure
   */
  verifyCodeAndCreateSession(
    email: string, 
    code: string,
    options?: { organizationId?: string }
  ): Promise<{ success: boolean; session?: AuthSession; error?: string }>;
}

