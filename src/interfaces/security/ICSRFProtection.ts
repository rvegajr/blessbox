// Interface Segregation Principle: CSRF protection service
export interface ICSRFProtection {
  // Generate CSRF token for session
  generateToken(sessionId: string): Promise<string>;
  
  // Validate CSRF token
  validateToken(sessionId: string, token: string): Promise<boolean>;
  
  // Invalidate token (for logout)
  invalidateToken(sessionId: string): Promise<void>;
  
  // Clean up expired tokens
  cleanupExpiredTokens(): Promise<void>;
  
  // Get token from request headers
  extractTokenFromRequest(headers: Record<string, string>): string | null;
}

export interface CSRFConfig {
  tokenLength: number;
  expirationMs: number;
  headerName: string;
  cookieName?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}