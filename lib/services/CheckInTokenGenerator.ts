/**
 * CheckInTokenGenerator - Implementation
 * 
 * Generates and validates check-in tokens following ISP.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ICheckInTokenGenerator } from '../interfaces/ICheckInTokenGenerator';

export class CheckInTokenGenerator implements ICheckInTokenGenerator {
  
  generateToken(registrationId: string): string {
    return uuidv4();
  }

  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // UUID v4 format: 8-4-4-4-12 hex characters with version 4 indicator
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Regex.test(token);
  }

  generateCheckInUrl(token: string, baseUrl?: string): string {
    const base = baseUrl || this.getBaseUrl();
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${cleanBase}/check-in/${token}`;
  }

  private getBaseUrl(): string {
    // Prioritize public URL, then fallback to NEXTAUTH_URL or localhost
    return (
      process.env.PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:7777')
    );
  }
}

/**
 * Singleton instance for dependency injection
 */
let instance: CheckInTokenGenerator | null = null;

export function getCheckInTokenGenerator(): CheckInTokenGenerator {
  if (!instance) {
    instance = new CheckInTokenGenerator();
  }
  return instance;
}

