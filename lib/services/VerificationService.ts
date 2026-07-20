import { randomInt } from 'crypto';
import { getDbClient } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '../utils/env';
import { hasGatewayAuth } from './gatewayConfig';
import { sendViaGatewayEmail } from './gatewayEmail';
import type {
  IVerificationService,
  VerificationCode,
  VerificationResult,
  RateLimitInfo
} from '../interfaces/IVerificationService';

export class VerificationService implements IVerificationService {
  private db = getDbClient();
  
  // Configuration constants
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 15;
  private readonly MAX_ATTEMPTS = 5;
  // Per-email code requests allowed per window. Was disabled (999999); a lenient
  // cap stops email-bombing / brute-force priming without annoying real users.
  private readonly RATE_LIMIT_COUNT = 10;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  async generateCode(_email: string): Promise<string> {
    // Cryptographically-secure 6-digit code. Math.random() is a predictable PRNG
    // and must never generate a login secret — an attacker sampling the stream
    // could predict a victim's code and defeat the email-possession factor.
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string; code?: string }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: 'Invalid email format'
      };
    }

    // Check rate limit
    const rateLimitInfo = await this.checkRateLimit(email);
    if (!rateLimitInfo.canSend) {
      const resetTime = rateLimitInfo.resetAt 
        ? new Date(rateLimitInfo.resetAt).toLocaleTimeString()
        : 'in 1 hour';
      return {
        success: false,
        message: `Rate limit exceeded. You can request a new code ${resetTime}.`
      };
    }

    // Invalidate any existing unverified codes for this email
    await this.invalidateCode(email);

    // Generate new code
    const code = await this.generateCode(email);
    const id = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

    // Store verification code
    await this.db.execute({
      sql: `
        INSERT INTO verification_codes (
          id, email, code, attempts, created_at, expires_at, verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, email, code, 0, now.toISOString(), expiresAt.toISOString(), 0]
    });

    // Send email with retry logic
    // For verification emails during onboarding, we don't have an organization yet
    // So we send directly without using the template system
    let emailSent = false;
    let lastError: Error | null = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.sendVerificationEmailDirect(email, code);
        if (getEnv('NODE_ENV') !== 'test') {
          console.log(`✅ Verification email sent successfully to ${email}${attempt > 0 ? ` (after ${attempt} retries)` : ''}`);
        }
        emailSent = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt < maxRetries) {
          console.warn(`⚠️ Email send attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        }
      }
    }
    
    if (!emailSent) {
      console.error('❌ Failed to send verification email after retries:', lastError);
      console.error('Email configuration check:');
      console.error('  gateway auth (OIDC or NOCTUSOFT_DEPLOY_KEY):', hasGatewayAuth() ? 'AVAILABLE' : 'NOT AVAILABLE');

      // Delete the code we just created since email failed
      await this.db.execute({
        sql: `DELETE FROM verification_codes WHERE id = ?`,
        args: [id]
      });

      // Return error with helpful message
      const errorMessage = lastError?.message || 'Unknown error';
      const hasGateway = hasGatewayAuth();

      if (!hasGateway) {
        return {
          success: false,
          message: 'Email service not configured. Please contact support.'
        };
      }
      
      return {
        success: false,
        message: `Failed to send verification email after ${maxRetries + 1} attempts: ${errorMessage}. Please try again or contact support.`
      };
    }

    // In development/test mode, return the code
    const isDev = getEnv('NODE_ENV') !== 'production';
    return {
      success: true,
      message: 'Verification code sent successfully',
      code: isDev ? code : undefined
    };
  }

  async verifyCode(email: string, code: string): Promise<VerificationResult> {
    const verificationCode = await this.getLatestVerificationCode(email);

    if (!verificationCode) {
      return {
        success: false,
        message: 'No verification code found for this email'
      };
    }

    // Check if already verified
    if (this.isCodeVerified(verificationCode)) {
      return {
        success: false,
        message: 'This code has already been verified'
      };
    }

    // Check if expired
    if (this.isCodeExpired(verificationCode)) {
      return {
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      };
    }

    // Check if max attempts exceeded
    if (this.hasExceededMaxAttempts(verificationCode)) {
      return {
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new code.',
        remainingAttempts: 0
      };
    }

    // Verify code
    if (verificationCode.code !== code) {
      // Increment attempts
      await this.incrementAttempts(email, code);
      
      const remainingAttempts = this.MAX_ATTEMPTS - (verificationCode.attempts + 1);
      return {
        success: false,
        message: 'Incorrect verification code',
        remainingAttempts: Math.max(0, remainingAttempts)
      };
    }

    // Code is correct - mark as verified
    await this.db.execute({
      sql: 'UPDATE verification_codes SET verified = ? WHERE id = ?',
      args: [1, verificationCode.id]
    });

    return {
      success: true,
      message: 'Email verified successfully',
      verified: true
    };
  }

  async getVerificationCode(email: string): Promise<VerificationCode | null> {
    const result = await this.db.execute({
      sql: `
        SELECT * FROM verification_codes 
        WHERE email = ? AND verified = 0
        ORDER BY created_at DESC 
        LIMIT 1
      `,
      args: [email]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToVerificationCode(result.rows[0] as any);
  }

  async getLatestVerificationCode(email: string): Promise<VerificationCode | null> {
    return this.getVerificationCode(email);
  }

  async checkRateLimit(email: string): Promise<RateLimitInfo> {
    const oneHourAgo = new Date(Date.now() - this.RATE_LIMIT_WINDOW_MS);

    // Count only PENDING (unverified) codes: a successful send→verify cycle must
    // not count against the user, or a legit high-frequency flow (kiosk / E2E)
    // gets falsely blocked. Per-IP / per-email edge limits on the send routes are
    // the primary anti-abuse control.
    const result = await this.db.execute({
      sql: `
        SELECT id, created_at
        FROM verification_codes
        WHERE email = ? AND created_at > ? AND verified = 0
        ORDER BY created_at DESC
      `,
      args: [email, oneHourAgo.toISOString()]
    });

    const recentCodes = result.rows.length;
    const canSend = recentCodes < this.RATE_LIMIT_COUNT;
    const remainingAttempts = Math.max(0, this.RATE_LIMIT_COUNT - recentCodes);

    // Calculate reset time (1 hour from oldest recent code)
    let resetAt: string | undefined;
    if (!canSend && result.rows.length > 0) {
      const oldestCode = result.rows[result.rows.length - 1] as any;
      const oldestTime = new Date(oldestCode.created_at).getTime();
      resetAt = new Date(oldestTime + this.RATE_LIMIT_WINDOW_MS).toISOString();
    }

    return {
      canSend,
      remainingAttempts,
      resetAt
    };
  }

  async invalidateCode(email: string): Promise<void> {
    // Mark all unverified codes for this email as invalid
    // We'll use a soft delete by setting a flag, or just let them expire
    // For simplicity, we'll update them to mark as "used" by setting verified to a special state
    // Actually, we can just delete old unverified codes
    await this.db.execute({
      sql: `
        DELETE FROM verification_codes 
        WHERE email = ? AND verified = 0
      `,
      args: [email]
    });
  }

  async incrementAttempts(email: string, code: string): Promise<void> {
    // Find the code
    const verificationCode = await this.getLatestVerificationCode(email);
    if (!verificationCode) {
      return;
    }

    // Increment attempts
    await this.db.execute({
      sql: 'UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?',
      args: [verificationCode.id]
    });
  }

  isCodeExpired(code: VerificationCode): boolean {
    const expiresAt = new Date(code.expiresAt);
    return expiresAt < new Date();
  }

  isCodeVerified(code: VerificationCode): boolean {
    return code.verified;
  }

  hasExceededMaxAttempts(code: VerificationCode): boolean {
    return code.attempts >= this.MAX_ATTEMPTS;
  }

  private async sendVerificationEmailDirect(email: string, code: string): Promise<void> {
    // All email goes through the Noctusoft gateway relay, authenticated with
    // the Vercel OIDC identity or the NOCTUSOFT_DEPLOY_KEY fallback (the relay
    // holds the real SendGrid key — the app holds no email secret).
    if (hasGatewayAuth()) {
      const fromEmail = getEnv('SENDGRID_FROM_EMAIL', 'noreply@blessbox.org');
      const fromName = getEnv('SENDGRID_FROM_NAME', 'BlessBox');
      const html = `
          <h2>Verify Your BlessBox Email</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `;
      const text = `Your verification code is: ${code}. This code will expire in 15 minutes.`;

      const result = await sendViaGatewayEmail({
        to: email,
        subject: 'Verify Your BlessBox Email',
        html,
        text,
        from: { email: fromEmail, name: fromName },
      });
      if (!result.success) {
        console.error('❌ Email gateway error:', result.error);
        throw new Error(`Email gateway failed: ${result.error || 'unknown'}`);
      }
      if (getEnv('NODE_ENV') !== 'test') {
        console.log(`✅ Verification email sent to ${email} via Noctusoft gateway`);
      }
      return;
    }

    // In development, just log the code (so flows work without a gateway key).
    if (getEnv("NODE_ENV") === 'development') {
      console.log(`📧 [DEV] Verification code for ${email}: ${code}`);
      console.log('⚠️  [DEV] No email gateway configured - code logged to console only');
      return;
    }

    // In production, this is an error.
    const errorMsg = 'Email service not configured. Enable Vercel OIDC or set NOCTUSOFT_DEPLOY_KEY (the Noctusoft gateway handles SendGrid).';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  private mapRowToVerificationCode(row: any): VerificationCode {
    return {
      id: row.id,
      email: row.email,
      code: row.code,
      attempts: row.attempts || 0,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      verified: Boolean(row.verified),
    };
  }
}
