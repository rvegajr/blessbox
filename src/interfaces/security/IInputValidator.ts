// Interface Segregation Principle: Input validation service
export interface IInputValidator {
  // Sanitize input to prevent XSS
  sanitizeHtml(input: string): string;
  
  // Validate and sanitize email
  validateEmail(email: string): ValidationResult;
  
  // Validate password strength
  validatePassword(password: string): ValidationResult;
  
  // Validate phone number
  validatePhone(phone: string): ValidationResult;
  
  // Validate URL
  validateUrl(url: string): ValidationResult;
  
  // Validate domain name
  validateDomain(domain: string): ValidationResult;
  
  // Validate against SQL injection
  validateSqlSafe(input: string): ValidationResult;
  
  // Validate JSON input
  validateJson(input: string): ValidationResult<any>;
  
  // Validate file upload
  validateFile(file: FileValidationInput): ValidationResult;
  
  // Custom validation with regex
  validateRegex(input: string, pattern: RegExp, errorMessage: string): ValidationResult;
}

export interface ValidationResult<T = string> {
  isValid: boolean;
  value?: T;
  sanitizedValue?: T;
  errors: string[];
  warnings?: string[];
}

export interface FileValidationInput {
  filename: string;
  mimeType: string;
  size: number;
  content?: Buffer | string;
}

export interface ValidationConfig {
  email?: {
    maxLength?: number;
    allowedDomains?: string[];
    blockedDomains?: string[];
  };
  password?: {
    minLength?: number;
    maxLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    blockedPasswords?: string[];
  };
  file?: {
    maxSize?: number;
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
    scanForMalware?: boolean;
  };
}