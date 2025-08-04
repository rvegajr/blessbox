// TDD: Password Service Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordService } from '../../../implementations/auth/PasswordService';
import type { IPasswordService } from '../../../interfaces/auth/IPasswordService';

describe('PasswordService (TDD)', () => {
  let passwordService: IPasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hash()', () => {
    it('should hash a password', async () => {
      // Arrange
      const password = 'TestPassword123!';

      // Act
      const hash = await passwordService.hash(password);

      // Assert
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
      expect(hash.startsWith('$2')).toBe(true); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      // Arrange
      const password = 'TestPassword123!';

      // Act
      const hash1 = await passwordService.hash(password);
      const hash2 = await passwordService.hash(password);

      // Assert
      expect(hash1).not.toBe(hash2); // Salt makes them different
    });
  });

  describe('verify()', () => {
    it('should verify correct password', async () => {
      // Arrange
      const password = 'TestPassword123!';
      const hash = await passwordService.hash(password);

      // Act
      const isValid = await passwordService.verify(password, hash);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      // Arrange
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await passwordService.hash(password);

      // Act
      const isValid = await passwordService.verify(wrongPassword, hash);

      // Assert
      expect(isValid).toBe(false);
    });
  });

  describe('validateStrength()', () => {
    it('should validate strong password', () => {
      // Arrange
      const strongPassword = 'StrongP@ssw0rd123!';

      // Act
      const result = passwordService.validateStrength(strongPassword);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.requirements.minLength).toBe(true);
      expect(result.requirements.hasUppercase).toBe(true);
      expect(result.requirements.hasLowercase).toBe(true);
      expect(result.requirements.hasNumbers).toBe(true);
      expect(result.requirements.hasSpecialChars).toBe(true);
    });

    it('should reject weak password', () => {
      // Arrange
      const weakPassword = '123';

      // Act
      const result = passwordService.validateStrength(weakPassword);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(2);
      expect(result.requirements.minLength).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should reject password without special characters', () => {
      // Arrange
      const password = 'TestPassword123';

      // Act
      const result = passwordService.validateStrength(password);

      // Assert
      expect(result.requirements.hasSpecialChars).toBe(false);
      expect(result.feedback).toContain('Add special characters (!@#$%^&*)');
    });
  });

  describe('generate()', () => {
    it('should generate secure password with default length', () => {
      // Act
      const password = passwordService.generate();

      // Assert
      expect(password).toBeDefined();
      expect(password.length).toBe(16); // Default length
      
      // Should meet strength requirements
      const validation = passwordService.validateStrength(password);
      expect(validation.isValid).toBe(true);
    });

    it('should generate password with custom length', () => {
      // Arrange
      const customLength = 20;

      // Act
      const password = passwordService.generate(customLength);

      // Assert
      expect(password.length).toBe(customLength);
    });

    it('should generate different passwords each time', () => {
      // Act
      const password1 = passwordService.generate();
      const password2 = passwordService.generate();

      // Assert
      expect(password1).not.toBe(password2);
    });
  });

  describe('Interface Segregation Principle', () => {
    it('should only expose password-related methods', () => {
      // Assert that the service only has password-related methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(passwordService));
      const expectedMethods = [
        'constructor',
        'hash',
        'verify',
        'generate',
        'validateStrength',
      ];

      expectedMethods.forEach(method => {
        expect(methods).toContain(method);
      });

      // Should not have token or user methods
      expect(methods).not.toContain('generateToken');
      expect(methods).not.toContain('validateUser');
    });
  });
});