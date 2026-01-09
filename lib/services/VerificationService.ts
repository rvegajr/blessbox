import { getDbClient } from '../db';
import { v4 as uuidv4 } from 'uuid';
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
  private readonly RATE_LIMIT_COUNT = 999999; // DISABLED - was 3 (user request)
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  async generateCode(email: string): Promise<string> {
    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    return code;
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

    // Send email (required - fail if email cannot be sent)
    // For verification emails during onboarding, we don't have an organization yet
    // So we send directly without using the template system
    try {
      await this.sendVerificationEmailDirect(email, code);
      if (process.env.NODE_ENV !== 'test') {
        console.log(`✅ Verification email sent successfully to ${email}`);
      }
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      console.error('Email configuration check:');
      console.error('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET');
      console.error('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
      console.error('  SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
      
      // Delete the code we just created since email failed
      await this.db.execute({
        sql: `DELETE FROM verification_codes WHERE id = ?`,
        args: [id]
      });
      
      // Return error with helpful message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const hasSendGrid = !!process.env.SENDGRID_API_KEY;
      const hasSMTP = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
      
      if (!hasSendGrid && !hasSMTP) {
        return {
          success: false,
          message: 'Email service not configured. Please contact support.'
        };
      }
      
      return {
        success: false,
        message: `Failed to send verification email: ${errorMessage}. Please check your email address and try again.`
      };
    }

    // In development/test mode, return the code
    const isDev = process.env.NODE_ENV !== 'production';
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

    const result = await this.db.execute({
      sql: `
        SELECT id, created_at 
        FROM verification_codes 
        WHERE email = ? AND created_at > ?
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
    // Try to use SendGrid if available
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@blessbox.app';
        
        const html = `
          <h2>Verify Your BlessBox Email</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `;
        const text = `Your verification code is: ${code}. This code will expire in 15 minutes.`;

        const result = await sgMail.send({
          to: email,
          from: fromEmail,
          subject: 'Verify Your BlessBox Email',
          html,
          text,
        });
        
        if (process.env.NODE_ENV !== 'test') {
          console.log(`✅ SendGrid email sent to ${email}, status: ${result[0]?.statusCode}`);
        }
        return;
      } catch (sendGridError: any) {
        console.error('❌ SendGrid error:', sendGridError);
        console.error('SendGrid response:', sendGridError.response?.body);
        throw new Error(`SendGrid failed: ${sendGridError.message}`);
      }
    }

    // Fallback to Gmail SMTP if SendGrid not available
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_PORT === '465', // SSL for port 465
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const html = `
          <h2>Verify Your BlessBox Email</h2>
          <p>Your verification code is: <strong>${code}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `;
        const text = `Your verification code is: ${code}. This code will expire in 15 minutes.`;

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Verify Your BlessBox Email',
          html,
          text,
        });
        
        if (process.env.NODE_ENV !== 'test') {
          console.log(`✅ SMTP email sent to ${email}, messageId: ${info.messageId}`);
        }
        return;
      } catch (smtpError: any) {
        console.error('❌ SMTP error:', smtpError);
        throw new Error(`SMTP failed: ${smtpError.message}`);
      }
    }

    // In development, just log (for testing without email setup)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 [DEV] Verification code for ${email}: ${code}`);
      console.log('⚠️  [DEV] No email service configured - code logged to console only');
      return;
    }

    // In production, this is an error
    const errorMsg = 'Email service not configured. Please set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL, or SMTP_HOST, SMTP_USER, and SMTP_PASS in Vercel environment variables.';
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
