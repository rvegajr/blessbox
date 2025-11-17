import { IValidationService, IValidationError } from '@interfaces/services/IValidationService';

/**
 * Validation service implementation
 * Provides validation methods for various input types
 */
export class ValidationService implements IValidationService {
  /**
   * Email validation regex
   * Matches standard email formats
   */
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Phone validation regex
   * Matches various phone formats (US)
   */
  private readonly phoneRegex = /^[\d\s\-\(\)\+\.]+$/;

  /**
   * Domain validation regex
   * Alphanumeric with hyphens, no dots, can't start/end with hyphen
   */
  private readonly domainRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  /**
   * US Zip code regex
   * Matches 5 digits or 5+4 format
   */
  private readonly zipRegex = /^\d{5}(-\d{4})?$/;

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return this.emailRegex.test(email.trim());
  }

  /**
   * Validate phone number format
   */
  validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove all non-digit characters for length check
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Check if it has at least 10 digits
    if (digitsOnly.length < 10) return false;
    
    // Check if it matches allowed format
    return this.phoneRegex.test(phone);
  }

  /**
   * Validate domain name format
   */
  validateDomain(domain: string): boolean {
    if (!domain || typeof domain !== 'string') return false;
    
    // Check length (1-255 characters)
    if (domain.length === 0 || domain.length > 255) return false;
    
    // Convert to lowercase and check format
    return this.domainRegex.test(domain.toLowerCase());
  }

  /**
   * Validate US zip code
   */
  validateZipCode(zipCode: string): boolean {
    if (!zipCode || typeof zipCode !== 'string') return false;
    return this.zipRegex.test(zipCode.trim());
  }

  /**
   * Validate required field
   */
  validateRequired(value: any): boolean {
    // Handle null/undefined
    if (value === null || value === undefined) return false;
    
    // Handle strings
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    
    // Handle objects
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    
    // Numbers, booleans, etc. are considered valid
    return true;
  }

  /**
   * Get validation error message
   */
  getErrorMessage(field: string, type: string): string {
    const messages: Record<string, Record<string, string>> = {
      email: {
        format: 'Please enter a valid email address',
        required: 'Email is required'
      },
      phone: {
        format: 'Please enter a valid phone number',
        required: 'Phone number is required'
      },
      name: {
        required: 'Name is required',
        format: 'Please enter a valid name'
      },
      zipCode: {
        format: 'Please enter a valid zip code',
        required: 'Zip code is required'
      },
      domain: {
        format: 'Please enter a valid domain name',
        required: 'Domain is required'
      }
    };

    // Get specific message or generate generic one
    if (messages[field] && messages[field][type]) {
      return messages[field][type];
    }

    // Generic messages
    if (type === 'required') {
      return `${this.capitalizeFirst(field)} is required`;
    }

    return `Please enter a valid ${field}`;
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * Create a singleton instance
 */
export const validationService = new ValidationService();