// Interface Segregation Principle: JWT token operations
export interface ITokenService {
  // Generate tokens
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(userId: string): string;
  
  // Validate tokens
  validateAccessToken(token: string): TokenPayload | null;
  validateRefreshToken(token: string): string | null; // Returns userId if valid
  
  // Token utilities
  extractTokenFromHeader(authHeader: string): string | null;
  isTokenExpired(token: string): boolean;
  
  // Blacklist management (for logout)
  blacklistToken(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  organizationId: string;
  iat?: number;
  exp?: number;
}