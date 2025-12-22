/**
 * CheckoutValidationService Tests (TDD)
 * 
 * Tests the checkout validation service:
 * - Email validation
 * - Form validation
 * - ISP compliance verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  CheckoutValidationService, 
  validateEmail, 
  validateCheckoutForm 
} from './CheckoutValidationService';

describe('CheckoutValidationService', () => {
  let service: CheckoutValidationService;

  beforeEach(() => {
    service = new CheckoutValidationService();
  });

  describe('validateEmail', () => {
    describe('valid emails', () => {
      it('should accept valid email format', () => {
        const result = service.validateEmail('test@example.com');
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should accept email with subdomain', () => {
        const result = service.validateEmail('user@mail.example.com');
        expect(result.isValid).toBe(true);
      });

      it('should accept email with plus sign', () => {
        const result = service.validateEmail('user+tag@example.com');
        expect(result.isValid).toBe(true);
      });

      it('should accept email with numbers', () => {
        const result = service.validateEmail('user123@example123.com');
        expect(result.isValid).toBe(true);
      });

      it('should trim whitespace from valid email', () => {
        const result = service.validateEmail('  test@example.com  ');
        expect(result.isValid).toBe(true);
      });
    });

    describe('invalid emails', () => {
      it('should reject empty string', () => {
        const result = service.validateEmail('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Email is required to complete checkout');
      });

      it('should reject whitespace-only string', () => {
        const result = service.validateEmail('   ');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Email is required to complete checkout');
      });

      it('should reject email without @', () => {
        const result = service.validateEmail('testexample.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid email address');
      });

      it('should reject email without domain', () => {
        const result = service.validateEmail('test@');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid email address');
      });

      it('should reject email without TLD', () => {
        const result = service.validateEmail('test@example');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid email address');
      });

      it('should reject email with spaces', () => {
        const result = service.validateEmail('test @example.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid email address');
      });
    });
  });

  describe('validateCheckoutForm', () => {
    it('should validate complete valid form', () => {
      const result = service.validateCheckoutForm({
        email: 'test@example.com',
        planType: 'standard',
        amount: 1900,
      });

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should validate form with coupon code', () => {
      const result = service.validateCheckoutForm({
        email: 'test@example.com',
        planType: 'standard',
        couponCode: 'FREE100',
        amount: 0,
      });

      expect(result.isValid).toBe(true);
    });

    it('should reject form with invalid email', () => {
      const result = service.validateCheckoutForm({
        email: '',
        planType: 'standard',
        amount: 1900,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should reject form with invalid plan type', () => {
      const result = service.validateCheckoutForm({
        email: 'test@example.com',
        planType: 'invalid' as any,
        amount: 1900,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.planType).toBe('Invalid plan type selected');
    });

    it('should reject form with negative amount', () => {
      const result = service.validateCheckoutForm({
        email: 'test@example.com',
        planType: 'standard',
        amount: -100,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.amount).toBe('Invalid amount');
    });

    it('should allow zero amount (free plan or 100% coupon)', () => {
      const result = service.validateCheckoutForm({
        email: 'test@example.com',
        planType: 'free',
        amount: 0,
      });

      expect(result.isValid).toBe(true);
    });

    it('should return multiple errors when multiple fields invalid', () => {
      const result = service.validateCheckoutForm({
        email: '',
        planType: 'invalid' as any,
        amount: -100,
      });

      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('isEmailRequired', () => {
    it('should return true when no session', () => {
      expect(service.isEmailRequired(false)).toBe(true);
    });

    it('should return false when session exists', () => {
      expect(service.isEmailRequired(true)).toBe(false);
    });
  });

  describe('All plan types', () => {
    it('should accept free plan', () => {
      const result = service.validateCheckoutForm({
        email: 'test@example.com',
        planType: 'free',
        amount: 0,
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept standard plan', () => {
      const result = service.validateCheckoutForm({
        email: 'test@example.com',
        planType: 'standard',
        amount: 1900,
      });
      expect(result.isValid).toBe(true);
    });

    it('should accept enterprise plan', () => {
      const result = service.validateCheckoutForm({
        email: 'test@example.com',
        planType: 'enterprise',
        amount: 9900,
      });
      expect(result.isValid).toBe(true);
    });
  });
});

// Test the exported helper functions
describe('Exported helper functions', () => {
  describe('validateEmail', () => {
    it('should work as standalone function', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCheckoutForm', () => {
    it('should work as standalone function', () => {
      const result = validateCheckoutForm({
        email: 'test@example.com',
        planType: 'standard',
        amount: 1900,
      });
      expect(result.isValid).toBe(true);
    });
  });
});
