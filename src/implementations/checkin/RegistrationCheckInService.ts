// 🎉 REGISTRATION CHECK-IN SERVICE IMPLEMENTATION - THE HEART OF JOY! 💖
// Where the MAGIC happens when QR codes get scanned! ✨

import { 
  IRegistrationCheckInService, 
  CheckInResult, 
  CheckInStatus 
} from '../../interfaces/checkin/IRegistrationCheckInService';
import { CheckInTokenService } from './CheckInTokenService';
import { createDatabaseConnection, getDatabase } from '../../database/connection';
import { registrations } from '../../database/schema';
import { eq } from 'drizzle-orm';

export class RegistrationCheckInService implements IRegistrationCheckInService {
  private tokenService: CheckInTokenService;

  constructor() {
    this.tokenService = new CheckInTokenService();
  }

  /**
   * 🎊 Check in a user using their token - THE MOMENT OF TRUTH! ✨
   */
  async checkIn(token: string, workerInfo?: string): Promise<CheckInResult> {
    try {
      // First, validate the token! 🔍
      const registration = await this.tokenService.validateToken(token);
      
      if (!registration) {
        return {
          success: false,
          message: '❌ Invalid or expired check-in token'
        };
      }

      // Check if already checked in - NO DOUBLE DIPPING! 🚫
      if (await this.isAlreadyCheckedIn(token)) {
        return {
          success: false,
          message: '⚠️ This registration has already been checked in',
          registration
        };
      }

      // THE MAGICAL CHECK-IN MOMENT! 🎊
      const checkedInAt = new Date().toISOString();
      
      await createDatabaseConnection();
      const db = getDatabase();

      await db
        .update(registrations)
        .set({
          checkedInAt,
          checkedInBy: workerInfo || 'Unknown Worker',
          tokenStatus: 'used',
          updatedAt: new Date().toISOString()
        })
        .where(eq(registrations.checkInToken, token));

      console.log(`🎉 SUCCESSFUL CHECK-IN! Token: ${token}, Worker: ${workerInfo || 'Unknown'}`);

      return {
        success: true,
        message: '✅ Check-in successful! Welcome!',
        registration: {
          ...registration,
          checkedInAt,
          checkedInBy: workerInfo || 'Unknown Worker',
          tokenStatus: 'used'
        },
        checkedInAt,
        checkedInBy: workerInfo || 'Unknown Worker'
      };

    } catch (error) {
      console.error('💔 Check-in failed with error:', error);
      return {
        success: false,
        message: '🚨 Check-in failed due to system error. Please try again.'
      };
    }
  }

  /**
   * ↩️ Undo a check-in - FOR WHEN MISTAKES HAPPEN! 
   */
  async undoCheckIn(token: string): Promise<boolean> {
    try {
      const registration = await this.tokenService.validateToken(token);
      
      if (!registration) {
        console.log(`❌ Cannot undo - invalid token: ${token}`);
        return false;
      }

      if (!registration.checkedInAt) {
        console.log(`⚠️ Cannot undo - registration not checked in: ${token}`);
        return false;
      }

      // UNDO THE MAGIC! ↩️
      await createDatabaseConnection();
      const db = getDatabase();

      await db
        .update(registrations)
        .set({
          checkedInAt: null,
          checkedInBy: null,
          tokenStatus: 'active',
          updatedAt: new Date().toISOString()
        })
        .where(eq(registrations.checkInToken, token));

      console.log(`↩️ Check-in UNDONE successfully for token: ${token}`);
      return true;

    } catch (error) {
      console.error('💔 Undo check-in failed:', error);
      return false;
    }
  }

  /**
   * 📊 Get the current check-in status for a token
   */
  async getCheckInStatus(token: string): Promise<CheckInStatus> {
    const registration = await this.tokenService.validateToken(token);
    
    if (!registration) {
      return {
        isCheckedIn: false,
        tokenStatus: 'expired'
      };
    }

    return {
      isCheckedIn: !!registration.checkedInAt,
      checkedInAt: registration.checkedInAt,
      checkedInBy: registration.checkedInBy,
      tokenStatus: registration.tokenStatus,
      registration
    };
  }

  /**
   * 🛡️ Prevent double check-ins with clear error messages
   */
  async isAlreadyCheckedIn(token: string): Promise<boolean> {
    const status = await this.getCheckInStatus(token);
    return status.isCheckedIn;
  }
}