// TDD Implementation: Input Validator Service
import type { 
  IInputValidator, 
  ValidationResult, 
  FileValidationInput, 
  ValidationConfig 
} from '../../interfaces/security/IInputValidator';

export class InputValidator implements IInputValidator {
  private config: ValidationConfig;

  constructor(config?: ValidationConfig) {
    this.config = {
      email: {
        maxLength: 255,
        allowedDomains: [],
        blockedDomains: ['tempmail.org', '10minutemail.com', 'guerrillamail.com'],
        ...config?.email,
      },
      password: {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        blockedPasswords: ['password', '123456', 'qwerty', 'admin', 'letmein'],
        ...config?.password,
      },
      file: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
        scanForMalware: false,
        ...config?.file,
      },
    };
  }

  sanitizeHtml(input: string): string {
    // Basic HTML sanitization - remove dangerous tags and attributes
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove object tags
      .replace(/<embed[^>]*>/gi, '') // Remove embed tags
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/data:(?!image\/)/gi, '') // Remove non-image data URLs
      .trim();
  }

  validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!email) {
      errors.push('Email is required');
      return { isValid: false, errors, warnings };
    }

    // Length check
    if (email.length > this.config.email!.maxLength!) {
      errors.push(`Email must be less than ${this.config.email!.maxLength} characters`);
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    // Domain validation
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      // Check blocked domains
      if (this.config.email!.blockedDomains!.includes(domain)) {
        errors.push('Email domain is not allowed');
      }

      // Check allowed domains (if specified)
      if (this.config.email!.allowedDomains!.length > 0 && 
          !this.config.email!.allowedDomains!.includes(domain)) {
        errors.push('Email domain is not in allowed list');
      }
    }

    // Sanitize email
    const sanitizedValue = email.toLowerCase().trim();

    return {
      isValid: errors.length === 0,
      value: email,
      sanitizedValue,
      errors,
      warnings,
    };
  }

  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors, warnings };
    }

    const config = this.config.password!;

    // Length checks
    if (password.length < config.minLength!) {
      errors.push(`Password must be at least ${config.minLength} characters long`);
    }
    if (password.length > config.maxLength!) {
      errors.push(`Password must be less than ${config.maxLength} characters long`);
    }

    // Character requirements
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (config.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check against common passwords
    const lowercasePassword = password.toLowerCase();
    if (config.blockedPasswords!.some(blocked => lowercasePassword.includes(blocked))) {
      errors.push('Password contains common words or patterns');
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      warnings.push('Avoid repeating the same character multiple times');
    }

    return {
      isValid: errors.length === 0,
      value: password,
      errors,
      warnings,
    };
  }

  validatePhone(phone: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phone) {
      return { isValid: true, value: phone, errors }; // Phone is optional
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Basic phone validation - should be 10-15 digits
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      errors.push('Phone number must be between 10 and 15 digits');
    }

    // Sanitize phone number to standard format
    const sanitizedValue = phone.replace(/[^\d+\-\(\)\s]/g, '').trim();

    return {
      isValid: errors.length === 0,
      value: phone,
      sanitizedValue,
      errors,
    };
  }

  validateUrl(url: string): ValidationResult {
    const errors: string[] = [];

    if (!url) {
      errors.push('URL is required');
      return { isValid: false, errors };
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }

      // Check for suspicious patterns
      if (url.includes('javascript:') || url.includes('data:')) {
        errors.push('URL contains potentially dangerous content');
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      value: url,
      sanitizedValue: url.trim(),
      errors,
    };
  }

  validateDomain(domain: string): ValidationResult {
    const errors: string[] = [];

    if (!domain) {
      errors.push('Domain is required');
      return { isValid: false, errors };
    }

    // Domain regex - allows subdomains, letters, numbers, hyphens
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!domainRegex.test(domain)) {
      errors.push('Invalid domain format');
    }

    if (domain.length > 253) {
      errors.push('Domain name is too long (max 253 characters)');
    }

    const sanitizedValue = domain.toLowerCase().trim();

    return {
      isValid: errors.length === 0,
      value: domain,
      sanitizedValue,
      errors,
    };
  }

  validateSqlSafe(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input) {
      return { isValid: true, value: input, errors, warnings };
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\|\||\/\*|\*\/)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        errors.push('Input contains potentially dangerous SQL patterns');
        break;
      }
    }

    // Sanitize by escaping single quotes
    const sanitizedValue = input.replace(/'/g, "''");

    return {
      isValid: errors.length === 0,
      value: input,
      sanitizedValue,
      errors,
      warnings,
    };
  }

  validateJson(input: string): ValidationResult<any> {
    const errors: string[] = [];

    if (!input) {
      errors.push('JSON input is required');
      return { isValid: false, errors };
    }

    try {
      const parsed = JSON.parse(input);
      
      // Check for potentially dangerous properties
      if (typeof parsed === 'object' && parsed !== null) {
        const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
        const hasDangerousKeys = dangerousKeys.some(key => key in parsed);
        
        if (hasDangerousKeys) {
          errors.push('JSON contains potentially dangerous properties');
        }
      }

      return {
        isValid: errors.length === 0,
        value: parsed,
        sanitizedValue: parsed,
        errors,
      };
    } catch (error) {
      errors.push('Invalid JSON format');
      return { isValid: false, errors };
    }
  }

  validateFile(file: FileValidationInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const config = this.config.file!;

    // Size validation
    if (file.size > config.maxSize!) {
      errors.push(`File size exceeds maximum allowed size of ${Math.round(config.maxSize! / 1024 / 1024)}MB`);
    }

    // MIME type validation
    if (config.allowedMimeTypes!.length > 0 && !config.allowedMimeTypes!.includes(file.mimeType)) {
      errors.push(`File type '${file.mimeType}' is not allowed`);
    }

    // Extension validation
    const extension = '.' + file.filename.split('.').pop()?.toLowerCase();
    if (config.allowedExtensions!.length > 0 && !config.allowedExtensions!.includes(extension)) {
      errors.push(`File extension '${extension}' is not allowed`);
    }

    // Basic filename validation
    if (!/^[a-zA-Z0-9._-]+$/.test(file.filename)) {
      warnings.push('Filename contains special characters that may cause issues');
    }

    return {
      isValid: errors.length === 0,
      value: file,
      errors,
      warnings,
    };
  }

  validateRegex(input: string, pattern: RegExp, errorMessage: string): ValidationResult {
    const errors: string[] = [];

    if (!pattern.test(input)) {
      errors.push(errorMessage);
    }

    return {
      isValid: errors.length === 0,
      value: input,
      errors,
    };
  }
}