// 🎉 CHECK-IN TOKEN SERVICE IMPLEMENTATION - TDD PERFECTION! ✨
// The MAGICAL token generator that makes QR codes work! 🪄

import { ICheckInTokenService, Registration } from '../../interfaces/checkin/ICheckInTokenService';
import { createDatabaseConnection, getDatabase } from '../../database/connection';
import { registrations } from '../../database/schema';
import { eq } from 'drizzle-orm';

export class CheckInTokenService implements ICheckInTokenService {
  
  /**
   * 🎊 Generate a secure, unique check-in token for a registration
   */
  async generateToken(registrationId: string): Promise<string> {
    let token: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    // Keep generating until we get a unique token! 🎯
    while (!isUnique && attempts < maxAttempts) {
      token = this.createSecureToken();
      isUnique = await this.isTokenUnique(token);
      attempts++;
      
      if (!isUnique && attempts >= maxAttempts) {
        throw new Error('🚨 Failed to generate unique token after maximum attempts');
      }
    }

    // Update the registration with the magical token! ✨
    await createDatabaseConnection();
    const db = getDatabase();
    
    await db
      .update(registrations)
      .set({ 
        checkInToken: token!,
        tokenStatus: 'active',
        updatedAt: new Date().toISOString()
      })
      .where(eq(registrations.id, registrationId));

    console.log(`🎉 Generated check-in token for registration ${registrationId}: ${token!}`);
    return token!;
  }

  /**
   * 🔍 Validate a check-in token and return registration details
   */
  async validateToken(token: string): Promise<Registration | null> {
    if (!this.isValidTokenFormat(token)) {
      console.log(`❌ Invalid token format: ${token}`);
      return null;
    }

    await createDatabaseConnection();
    const db = getDatabase();

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.checkInToken, token));

    if (!registration) {
      console.log(`❌ Token not found: ${token}`);
      return null;
    }

    console.log(`✅ Token validated successfully: ${token}`);
    return {
      id: registration.id,
      qrCodeSetId: registration.qrCodeSetId,
      qrCodeId: registration.qrCodeId,
      registrationData: registration.registrationData,
      checkInToken: registration.checkInToken,
      checkedInAt: registration.checkedInAt,
      checkedInBy: registration.checkedInBy,
      tokenStatus: registration.tokenStatus as 'active' | 'used' | 'expired',
      registeredAt: registration.registeredAt,
      deliveryStatus: registration.deliveryStatus as 'pending' | 'delivered' | 'failed'
    };
  }

  /**
   * ⚡ Check if a token is unique (no collisions)
   */
  async isTokenUnique(token: string): Promise<boolean> {
    await createDatabaseConnection();
    const db = getDatabase();

    const [existing] = await db
      .select({ id: registrations.id })
      .from(registrations)
      .where(eq(registrations.checkInToken, token));

    return !existing;
  }

  /**
   * 🎯 Validate token format (UUID-based validation)
   */
  isValidTokenFormat(token: string): boolean {
    // UUID v4 format with timestamp - SECURE AND BEAUTIFUL! 🔒
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-\d{13}$/i;
    return uuidRegex.test(token);
  }

  /**
   * 🪄 Create a secure token with timestamp
   * Private method for internal token generation
   */
  private createSecureToken(): string {
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    return `${uuid}-${timestamp}`;
  }
}