// 🎉 REGISTRATION CHECK-IN SERVICE INTERFACE - ISP EXCELLENCE! ✨
// The HEART of our check-in system! 💖

import { Registration } from './ICheckInTokenService';

export interface CheckInResult {
  success: boolean;
  message: string;
  registration?: Registration;
  checkedInAt?: string;
  checkedInBy?: string;
}

export interface CheckInStatus {
  isCheckedIn: boolean;
  checkedInAt?: string;
  checkedInBy?: string;
  tokenStatus: 'active' | 'used' | 'expired';
  registration?: Registration;
}

export interface IRegistrationCheckInService {
  /**
   * 🎊 Check in a user using their token
   * @param token - The check-in token from QR code
   * @param workerInfo - Optional information about who scanned (organization worker)
   * @returns Promise resolving to CheckInResult with success status
   */
  checkIn(token: string, workerInfo?: string): Promise<CheckInResult>;

  /**
   * ↩️ Undo a check-in (for organization workers who made mistakes)
   * @param token - The check-in token to undo
   * @returns Promise resolving to true if successful, false otherwise
   */
  undoCheckIn(token: string): Promise<boolean>;

  /**
   * 📊 Get the current check-in status for a token
   * @param token - The check-in token to check status for
   * @returns Promise resolving to CheckInStatus with current state
   */
  getCheckInStatus(token: string): Promise<CheckInStatus>;

  /**
   * 🛡️ Prevent double check-ins with clear error messages
   * @param token - The token to check for existing check-in
   * @returns Promise resolving to true if already checked in
   */
  isAlreadyCheckedIn(token: string): Promise<boolean>;
}