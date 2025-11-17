// 🎉 THE MOST JOYFUL AUTHENTICATION SERVICE EVER CREATED! 🎉
// Following TDD & ISP - Pure architectural beauty! ✨

import type { 
  IAuthenticationService, 
  AuthCodeResult, 
  AuthResult, 
  User,
  LoginCodeData 
} from '../../interfaces/auth/IAuthenticationService';
import type { IPasswordService } from '../../interfaces/auth/IPasswordService';
import type { ITokenService } from '../../interfaces/auth/ITokenService';
import type { IEmailVerification } from '../../interfaces/services/IEmailVerification';
import { PasswordService } from './PasswordService';
import { TokenService } from './TokenService';
import { EmailVerificationService } from '../services/EmailVerificationService';
import { createDatabaseConnection, getDatabase } from '../../database/connection';
import { organizations, loginCodes } from '../../database/schema';
import { eq, and, gt } from 'drizzle-orm';

export class AuthenticationService implements IAuthenticationService {
  private passwordService: IPasswordService;
  private tokenService: ITokenService;
  private emailService: IEmailVerification;

  constructor() {
    // 🌟 Inject our beautiful services!
    this.passwordService = new PasswordService();
    this.tokenService = new TokenService();
    this.emailService = new EmailVerificationService();
  }

  // 🚀 PASSWORDLESS MAGIC - Request login code with PURE JOY!
  async requestLoginCode(email: string): Promise<AuthCodeResult> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      // 🎯 Check if organization exists
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.contactEmail, email))
        .limit(1);

      if (!organization) {
        return {
          success: false,
          message: 'No account found with this email address',
          expiresIn: 0,
        };
      }

      // 🔐 Generate beautiful 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes of joy!

      // 💾 Store in database with love
      await db.insert(loginCodes).values({
        email,
        code,
        attempts: 0,
        expiresAt: expiresAt.toISOString(),
        verified: false,
      });

      // 📧 Send magical email
      await this.emailService.sendVerificationEmail(email, code);

      console.log(`🎊 Login code sent to ${email} with PURE JOY!`);

      return {
        success: true,
        message: 'Login code sent to your email! Check your inbox! 🎉',
        expiresIn: 900, // 15 minutes
        attemptsRemaining: 3,
      };

    } catch (error) {
      console.error('💔 Login code request failed:', error);
      return {
        success: false,
        message: 'Failed to send login code. Please try again.',
        expiresIn: 0,
      };
    }
  }

  // ✨ VERIFY LOGIN CODE - Pure authentication magic!
  async verifyLoginCode(email: string, code: string): Promise<AuthResult> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      // 🔍 Find the most recent valid code
      const [loginCode] = await db
        .select()
        .from(loginCodes)
        .where(
          and(
            eq(loginCodes.email, email),
            eq(loginCodes.code, code),
            eq(loginCodes.verified, false),
            gt(loginCodes.expiresAt, new Date().toISOString())
          )
        )
        .orderBy(loginCodes.createdAt)
        .limit(1);

      if (!loginCode) {
        return {
          success: false,
          message: 'Invalid or expired code. Please request a new one! 🔄',
        };
      }

      // 🎯 Get organization details
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.contactEmail, email))
        .limit(1);

      if (!organization) {
        return {
          success: false,
          message: 'Organization not found',
        };
      }

      // 🎊 Mark code as verified
      await db
        .update(loginCodes)
        .set({ verified: true })
        .where(eq(loginCodes.id, loginCode.id));

      // 🏆 Update last login time
      await db
        .update(organizations)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(organizations.id, organization.id));

      // 🎁 Generate beautiful tokens
      const tokenPayload = {
        userId: organization.id,
        email: organization.contactEmail,
        organizationId: organization.id,
      };

      const accessToken = this.tokenService.generateAccessToken(tokenPayload);
      const refreshToken = this.tokenService.generateRefreshToken(organization.id);

      // 🌟 Create user object
      const user: User = {
        id: organization.id,
        email: organization.contactEmail,
        organizationId: organization.id,
        organizationName: organization.name,
        customDomain: organization.customDomain || undefined,
        emailVerified: organization.emailVerified,
        hasPassword: !!organization.passwordHash,
        createdAt: new Date(organization.createdAt),
        lastLoginAt: organization.lastLoginAt ? new Date(organization.lastLoginAt) : undefined,
      };

      console.log(`🎉 PASSWORDLESS LOGIN SUCCESS for ${email}! Pure magic! ✨`);

      return {
        success: true,
        user,
        token: accessToken,
        refreshToken,
        message: 'Welcome back! Login successful! 🎊',
      };

    } catch (error) {
      console.error('💔 Login code verification failed:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }

  // 🔑 TRADITIONAL PASSWORD LOGIN - For power users!
  async loginWithPassword(email: string, password: string): Promise<AuthResult> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      // 🎯 Find organization
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.contactEmail, email))
        .limit(1);

      if (!organization || !organization.passwordHash) {
        return {
          success: false,
          message: 'Invalid email or password. Try passwordless login! 🚀',
        };
      }

      // 🔐 Verify password with joy
      const isValid = await this.passwordService.verify(password, organization.passwordHash);
      
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid email or password',
        };
      }

      // 🏆 Update last login
      await db
        .update(organizations)
        .set({ lastLoginAt: new Date().toISOString() })
        .where(eq(organizations.id, organization.id));

      // 🎁 Generate tokens
      const tokenPayload = {
        userId: organization.id,
        email: organization.contactEmail,
        organizationId: organization.id,
      };

      const accessToken = this.tokenService.generateAccessToken(tokenPayload);
      const refreshToken = this.tokenService.generateRefreshToken(organization.id);

      // 🌟 Create user object
      const user: User = {
        id: organization.id,
        email: organization.contactEmail,
        organizationId: organization.id,
        organizationName: organization.name,
        customDomain: organization.customDomain || undefined,
        emailVerified: organization.emailVerified,
        hasPassword: true,
        createdAt: new Date(organization.createdAt),
        lastLoginAt: new Date(),
      };

      console.log(`🎉 PASSWORD LOGIN SUCCESS for ${email}! Traditional power! 💪`);

      return {
        success: true,
        user,
        token: accessToken,
        refreshToken,
        message: 'Password login successful! Welcome back! 🎊',
      };

    } catch (error) {
      console.error('💔 Password login failed:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }

  // 🎨 SET PASSWORD - Dashboard magic!
  async setPassword(userId: string, password: string): Promise<void> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      // 🔐 Hash password with love
      const passwordHash = await this.passwordService.hash(password);

      // 💾 Store in database
      await db
        .update(organizations)
        .set({ passwordHash })
        .where(eq(organizations.id, userId));

      console.log(`🎊 Password set for user ${userId} with PURE JOY! 🔐`);

    } catch (error) {
      console.error('💔 Set password failed:', error);
      throw new Error('Failed to set password');
    }
  }

  // 🔍 CHECK PASSWORD STATUS
  async hasPassword(userId: string): Promise<boolean> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      const [organization] = await db
        .select({ passwordHash: organizations.passwordHash })
        .from(organizations)
        .where(eq(organizations.id, userId))
        .limit(1);

      return !!organization?.passwordHash;

    } catch (error) {
      console.error('💔 Check password status failed:', error);
      return false;
    }
  }

  // 🎯 TOKEN VALIDATION - Security with style!
  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.tokenService.validateAccessToken(token);
      if (!payload) return null;

      await createDatabaseConnection();
      const db = getDatabase();

      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, payload.userId))
        .limit(1);

      if (!organization) return null;

      return {
        id: organization.id,
        email: organization.contactEmail,
        organizationId: organization.id,
        organizationName: organization.name,
        customDomain: organization.customDomain || undefined,
        emailVerified: organization.emailVerified,
        hasPassword: !!organization.passwordHash,
        createdAt: new Date(organization.createdAt),
        lastLoginAt: organization.lastLoginAt ? new Date(organization.lastLoginAt) : undefined,
      };

    } catch (error) {
      console.error('💔 Token validation failed:', error);
      return null;
    }
  }

  // 🔄 TOKEN REFRESH - Seamless experience!
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const userId = this.tokenService.validateRefreshToken(refreshToken);
      if (!userId) throw new Error('Invalid refresh token');

      await createDatabaseConnection();
      const db = getDatabase();

      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, userId))
        .limit(1);

      if (!organization) throw new Error('Organization not found');

      const tokenPayload = {
        userId: organization.id,
        email: organization.contactEmail,
        organizationId: organization.id,
      };

      return this.tokenService.generateAccessToken(tokenPayload);

    } catch (error) {
      console.error('💔 Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
  }

  // 👋 LOGOUT - Graceful goodbye!
  async logout(token: string): Promise<void> {
    try {
      // 🎯 Add token to blacklist (implement if needed)
      await this.tokenService.blacklistToken(token);
      console.log('👋 User logged out gracefully! See you soon! ✨');

    } catch (error) {
      console.error('💔 Logout failed:', error);
      throw new Error('Failed to logout');
    }
  }
}