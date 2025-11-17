import { describe, it, expect, beforeEach } from 'vitest';
import type { IValidationService } from '@interfaces/services/IValidationService';
import { ValidationService } from '@implementations/services/ValidationService';

/**
 * ValidationService Test Specification
 * Written BEFORE implementation (TDD)
 */
describe('ValidationService', () => {
  let validationService: IValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'user+tag@example.org',
        'user_name@example-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user@@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone formats', () => {
      const validPhones = [
        '1234567890',
        '123-456-7890',
        '(123) 456-7890',
        '+1 123-456-7890',
        '123.456.7890'
      ];

      validPhones.forEach(phone => {
        expect(validationService.validatePhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone formats', () => {
      const invalidPhones = [
        '123',
        'abcdefghij',
        '123-456',
        '',
        '123 456 789'  // Too short
      ];

      invalidPhones.forEach(phone => {
        expect(validationService.validatePhone(phone)).toBe(false);
      });
    });
  });

  describe('validateDomain', () => {
    it('should validate correct domain formats', () => {
      const validDomains = [
        'example',
        'example-org',
        'example123',
        'my-food-bank',
        'food-bank-2024'
      ];

      validDomains.forEach(domain => {
        expect(validationService.validateDomain(domain)).toBe(true);
      });
    });

    it('should reject invalid domain formats', () => {
      const invalidDomains = [
        'example.com',  // No dots allowed
        'example org',  // No spaces
        'example@org',  // No special chars
        '-example',     // Can't start with dash
        'example-',     // Can't end with dash
        '',
        'a'.repeat(256) // Too long
      ];

      invalidDomains.forEach(domain => {
        expect(validationService.validateDomain(domain)).toBe(false);
      });
    });
  });

  describe('validateZipCode', () => {
    it('should validate correct US zip codes', () => {
      const validZips = [
        '12345',
        '12345-6789',
        '00501',
        '99950'
      ];

      validZips.forEach(zip => {
        expect(validationService.validateZipCode(zip)).toBe(true);
      });
    });

    it('should reject invalid zip codes', () => {
      const invalidZips = [
        '1234',      // Too short
        '123456',    // Too long without dash
        '12345-',    // Incomplete extended
        '12345-67',  // Extended too short
        'ABCDE',     // Letters
        ''
      ];

      invalidZips.forEach(zip => {
        expect(validationService.validateZipCode(zip)).toBe(false);
      });
    });
  });

  describe('validateRequired', () => {
    it('should pass for non-empty values', () => {
      expect(validationService.validateRequired('value')).toBe(true);
      expect(validationService.validateRequired(123)).toBe(true);
      expect(validationService.validateRequired(['item'])).toBe(true);
      expect(validationService.validateRequired({ key: 'value' })).toBe(true);
    });

    it('should fail for empty values', () => {
      expect(validationService.validateRequired('')).toBe(false);
      expect(validationService.validateRequired(null)).toBe(false);
      expect(validationService.validateRequired(undefined)).toBe(false);
      expect(validationService.validateRequired([])).toBe(false);
      expect(validationService.validateRequired({})).toBe(false);
    });

    it('should fail for whitespace-only strings', () => {
      expect(validationService.validateRequired('   ')).toBe(false);
      expect(validationService.validateRequired('\t\n')).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return appropriate error messages', () => {
      expect(validationService.getErrorMessage('email', 'format'))
        .toBe('Please enter a valid email address');
      
      expect(validationService.getErrorMessage('phone', 'format'))
        .toBe('Please enter a valid phone number');
      
      expect(validationService.getErrorMessage('name', 'required'))
        .toBe('Name is required');
      
      expect(validationService.getErrorMessage('zipCode', 'format'))
        .toBe('Please enter a valid zip code');
    });

    it('should return generic message for unknown fields', () => {
      expect(validationService.getErrorMessage('unknown', 'format'))
        .toBe('Please enter a valid unknown');
    });
  });
});