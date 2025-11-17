// TDD Implementation: JWT Token Service
import jwt from 'jsonwebtoken';
import type { ITokenService, TokenPayload } from '../../interfaces/auth/ITokenService';

export class TokenService implements ITokenService {
  private readonly jwtSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly tokenBlacklist = new Set<string>(); // In production, use Redis

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    if (this.jwtSecret === 'super-secret-key-change-in-production') {
      console.warn('⚠️  Using default JWT secret. Set JWT_SECRET in environment variables for production!');
    }
  }

  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'blessbox',
      audience: 'blessbox-users',
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      this.jwtSecret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'blessbox',
        audience: 'blessbox-users',
      }
    );
  }

  validateAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'blessbox',
        audience: 'blessbox-users',
      }) as TokenPayload;

      // Check if token is blacklisted
      if (this.tokenBlacklist.has(token)) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }

  validateRefreshToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'blessbox',
        audience: 'blessbox-users',
      }) as any;

      if (decoded.type !== 'refresh') {
        return null;
      }

      return decoded.userId;
    } catch (error) {
      return null;
    }
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  async blacklistToken(token: string): Promise<void> {
    this.tokenBlacklist.add(token);
    
    // In production, store in Redis with expiration
    // await redis.setex(`blacklist:${token}`, tokenExpiry, '1');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenBlacklist.has(token);
    
    // In production, check Redis
    // return await redis.exists(`blacklist:${token}`) === 1;
  }
}