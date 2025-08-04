// TDD Implementation: Password Service
import bcrypt from 'bcryptjs';
import type { IPasswordService, PasswordValidationResult } from '../../interfaces/auth/IPasswordService';

export class PasswordService implements IPasswordService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  generate(length = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + specialChars;
    
    // Ensure at least one character from each category
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  validateStrength(password: string): PasswordValidationResult {
    const feedback: string[] = [];
    let score = 0;

    // Check requirements
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    };

    // Calculate score and feedback
    if (!requirements.minLength) {
      feedback.push('Use at least 8 characters');
    } else {
      score += 1;
    }

    if (!requirements.hasUppercase) {
      feedback.push('Add uppercase letters (A-Z)');
    } else {
      score += 1;
    }

    if (!requirements.hasLowercase) {
      feedback.push('Add lowercase letters (a-z)');
    } else {
      score += 1;
    }

    if (!requirements.hasNumbers) {
      feedback.push('Add numbers (0-9)');
    } else {
      score += 1;
    }

    if (!requirements.hasSpecialChars) {
      feedback.push('Add special characters (!@#$%^&*)');
    } else {
      score += 1;
    }

    // Additional scoring for length
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Check for common patterns (reduce score)
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters');
      score = Math.max(0, score - 1);
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      feedback.push('Avoid common patterns and words');
      score = Math.max(0, score - 2);
    }

    const isValid = score >= 4 && Object.values(requirements).every(req => req);

    return {
      isValid,
      score: Math.min(score, 4), // Cap at 4
      feedback,
      requirements,
    };
  }
}