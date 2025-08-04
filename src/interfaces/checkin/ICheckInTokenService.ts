// 🎉 CHECK-IN TOKEN SERVICE INTERFACE - ISP PERFECTION! ✨
// Interface Segregation Principle at its FINEST! 🏆

export interface ICheckInTokenService {
  /**
   * 🎊 Generate a secure, unique check-in token for a registration
   * @param registrationId - The registration ID to generate token for
   * @returns Promise resolving to the generated token string
   */
  generateToken(registrationId: string): Promise<string>;

  /**
   * 🔍 Validate a check-in token and return registration details
   * @param token - The token to validate
   * @returns Promise resolving to Registration object or null if invalid
   */
  validateToken(token: string): Promise<Registration | null>;

  /**
   * ⚡ Check if a token is unique (no collisions)
   * @param token - The token to check for uniqueness
   * @returns Promise resolving to true if unique, false if collision
   */
  isTokenUnique(token: string): Promise<boolean>;

  /**
   * 🎯 Validate token format (UUID-based validation)
   * @param token - The token to validate format
   * @returns True if format is valid, false otherwise
   */
  isValidTokenFormat(token: string): boolean;
}

// 📋 Registration interface for type safety - PURE JOY! 🌟
export interface Registration {
  id: string;
  qrCodeSetId: string;
  qrCodeId: string;
  registrationData: any; // JSON data from form
  checkInToken?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  tokenStatus: 'active' | 'used' | 'expired';
  registeredAt: string;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
}