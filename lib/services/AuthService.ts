/**
 * AuthService - JWT-Based Authentication with 6-Digit Email Verification
 * 
 * Email is the source of truth for identity.
 * No Magic Links - only 6-digit codes sent via email.
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { VerificationService } from './VerificationService';
import { MembershipService } from './MembershipService';
import { normalizeEmail } from '@/lib/utils/normalize-email';
import type { 
  IAuthService, 
  AuthUser, 
  AuthSession 
} from '@/lib/interfaces/IAuthService';

// Cookie and token configuration
const SESSION_COOKIE_NAME = 'bb_session';
const ACTIVE_ORG_COOKIE_NAME = 'bb_active_org_id';
const DEFAULT_SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export class AuthService implements IAuthService {
  private verificationService = new VerificationService();
  private membershipService = new MembershipService();
  private db = getDbClient();
  
  private getJwtSecret(): Uint8Array {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET or NEXTAUTH_SECRET environment variable is required');
    }
    return new TextEncoder().encode(secret);
  }

  /**
   * Send 6-digit verification code to email
   */
  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return { success: false, message: 'Invalid email address' };
    }
    
    const result = await this.verificationService.sendVerificationCode(normalized);
    return { success: result.success, message: result.message };
  }

  /**
   * Verify 6-digit code and create session
   */
  async verifyCodeAndCreateSession(
    email: string,
    code: string,
    options?: { organizationId?: string }
  ): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return { success: false, error: 'Invalid email address' };
    }

    // Verify the code
    const verifyResult = await this.verificationService.verifyCode(normalized, code);
    if (!verifyResult.success || !verifyResult.verified) {
      return { 
        success: false, 
        error: verifyResult.message || 'Invalid verification code'
      };
    }

    // Get or create user
    const user = await this.getOrCreateUser(normalized);
    
    // If organizationId provided, create membership
    if (options?.organizationId) {
      await this.membershipService.ensureMembership(user.id, options.organizationId, 'admin');
      
      // Mark organization email as verified
      const now = new Date().toISOString();
      await this.db.execute({
        sql: `UPDATE organizations SET email_verified = 1, updated_at = ? WHERE id = ? AND contact_email = ?`,
        args: [now, options.organizationId, normalized],
      });
      
      // Set active organization
      user.organizationId = options.organizationId;
    }

    // Create session
    const session = await this.createSession(user);
    
    return { success: true, session };
  }

  /**
   * Create a new JWT session
   */
  async createSession(user: AuthUser, expiresInSeconds: number = DEFAULT_SESSION_DURATION): Promise<AuthSession> {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(this.getJwtSecret());

    return {
      user,
      expires: expiresAt.toISOString(),
      token,
    };
  }

  /**
   * Validate JWT token and return session
   */
  async validateToken(token: string): Promise<AuthSession | null> {
    try {
      const { payload } = await jwtVerify(token, this.getJwtSecret());
      
      if (!payload.sub || !payload.email) {
        return null;
      }

      const user: AuthUser = {
        id: payload.sub as string,
        email: payload.email as string,
        name: payload.name as string | undefined,
        organizationId: payload.organizationId as string | undefined,
        role: payload.role as AuthUser['role'],
      };

      return {
        user,
        expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : '',
        token,
      };
    } catch (error) {
      // Token invalid or expired
      return null;
    }
  }

  /**
   * Get session from cookies (server-side)
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const cookieStore = await cookies();
      
      // Check for test auth bypass (non-production only)
      if (process.env.NODE_ENV !== 'production') {
        const testAuth = cookieStore.get('bb_test_auth')?.value;
        if (testAuth === '1') {
          return this.getTestSession(cookieStore);
        }
      }
      
      // Get session token from cookie
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      if (!token) {
        return null;
      }

      const session = await this.validateToken(token);
      if (!session) {
        return null;
      }

      // Check for active organization override
      const activeOrgId = cookieStore.get(ACTIVE_ORG_COOKIE_NAME)?.value;
      if (activeOrgId && session.user) {
        session.user.organizationId = activeOrgId;
      }

      return session;
    } catch (error) {
      console.error('AuthService.getSession error:', error);
      return null;
    }
  }

  /**
   * Destroy session (logout)
   */
  async destroySession(_token: string): Promise<void> {
    // JWT is stateless, so we just need to clear the cookie on the client
    // This method is a placeholder for potential token blacklisting
  }

  /**
   * Set session cookie (call from API route response)
   */
  static setSessionCookie(response: Response, session: AuthSession): void {
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = Math.floor((new Date(session.expires).getTime() - Date.now()) / 1000);
    
    response.headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${session.token}; Path=/; HttpOnly; SameSite=Lax; ${isProd ? 'Secure; ' : ''}Max-Age=${maxAge}`
    );
  }

  /**
   * Set active organization cookie
   */
  static setActiveOrgCookie(response: Response, organizationId: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    
    response.headers.append(
      'Set-Cookie',
      `${ACTIVE_ORG_COOKIE_NAME}=${organizationId}; Path=/; HttpOnly; SameSite=Lax; ${isProd ? 'Secure; ' : ''}Max-Age=${maxAge}`
    );
  }

  /**
   * Clear session cookie (logout)
   */
  static clearSessionCookie(response: Response): void {
    response.headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
  }

  /**
   * Get or create user by email
   */
  private async getOrCreateUser(email: string): Promise<AuthUser> {
    const normalized = normalizeEmail(email);
    const now = new Date().toISOString();
    
    // Check if user exists
    const existingResult = await this.db.execute({
      sql: `SELECT id, email, name FROM users WHERE email = ? LIMIT 1`,
      args: [normalized],
    });

    if (existingResult.rows.length > 0) {
      const row = existingResult.rows[0] as any;
      return {
        id: String(row.id),
        email: String(row.email),
        name: row.name ? String(row.name) : undefined,
      };
    }

    // Create new user
    const userId = uuidv4();
    await this.db.execute({
      sql: `INSERT INTO users (id, email, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      args: [userId, normalized, now, now],
    });

    return {
      id: userId,
      email: normalized!,
    };
  }

  /**
   * Test session for development/testing
   */
  private getTestSession(cookieStore: any): AuthSession {
    const email = cookieStore.get('bb_test_email')?.value || 'seed-local@example.com';
    const orgId = cookieStore.get('bb_test_org_id')?.value;
    const isAdmin = cookieStore.get('bb_test_admin')?.value === '1';

    const user: AuthUser = {
      id: 'test-user',
      email,
      name: isAdmin ? 'Test Admin' : 'Test User',
      organizationId: orgId,
      role: isAdmin ? 'super_admin' : 'user',
    };

    return {
      user,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      token: 'test-token',
    };
  }
}

// Export singleton instance for convenience
export const authService = new AuthService();

