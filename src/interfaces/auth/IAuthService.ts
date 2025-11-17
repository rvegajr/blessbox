// Interface Segregation Principle: Authentication service interface
export interface IAuthService {
  // User registration
  register(userData: UserRegistrationData): Promise<AuthResult>;
  
  // User login
  login(email: string, password: string): Promise<AuthResult>;
  
  // Token operations
  validateToken(token: string): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<string>;
  
  // Session management
  logout(token: string): Promise<void>;
  
  // Password operations
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  organizationName: string;
  eventName?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  contactState?: string;
  contactZip?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  organizationId: string;
  iat: number;
  exp: number;
}