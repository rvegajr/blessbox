// Interface Segregation Principle: Password hashing and validation
export interface IPasswordService {
  // Hash password for storage
  hash(password: string): Promise<string>;
  
  // Verify password against hash
  verify(password: string, hash: string): Promise<boolean>;
  
  // Generate secure password
  generate(length?: number): string;
  
  // Validate password strength
  validateStrength(password: string): PasswordValidationResult;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4 (weak to strong)
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}