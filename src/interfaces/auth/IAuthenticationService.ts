// 🎉 JOYFUL AUTHENTICATION SERVICE INTERFACE! 
// Following ISP - Small, focused, BEAUTIFUL interfaces! ✨

export interface IAuthenticationService {
  // 🚀 Passwordless magic - no friction, pure joy!
  requestLoginCode(email: string): Promise<AuthCodeResult>;
  verifyLoginCode(email: string, code: string): Promise<AuthResult>;
  
  // 💪 Traditional password option for power users
  loginWithPassword(email: string, password: string): Promise<AuthResult>;
  
  // 🔐 Dashboard password management - user's choice!
  setPassword(userId: string, password: string): Promise<void>;
  hasPassword(userId: string): Promise<boolean>;
  
  // 🎯 Token management - secure and smooth
  validateToken(token: string): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<string>;
  logout(token: string): Promise<void>;
}

export interface AuthCodeResult {
  success: boolean;
  message: string;
  expiresIn: number; // seconds until code expires
  attemptsRemaining?: number;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  message: string;
  requiresEmailVerification?: boolean;
}

export interface User {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  customDomain?: string;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface LoginCodeData {
  email: string;
  code: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}