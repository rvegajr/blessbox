import { describe, it, expect, beforeEach } from 'vitest';
import type { IStorageService } from '@interfaces/services/IStorageService';
import { StorageKeys } from '@interfaces/services/IStorageService';
import { SessionStorageService } from '@implementations/services/SessionStorageService';

/**
 * StorageService Test Specification
 * Written BEFORE implementation (TDD)
 */
describe('StorageService', () => {
  let storageService: IStorageService;

  beforeEach(() => {
    storageService = new SessionStorageService();
  });

  describe('save', () => {
    it('should save string data', () => {
      const key = StorageKeys.SESSION_ID;
      const data = 'test-session-123';
      
      storageService.save(key, data);
      
      expect(sessionStorage.getItem(key)).toBe(JSON.stringify(data));
    });

    it('should save object data', () => {
      const key = StorageKeys.ONBOARDING_DATA;
      const data = { name: 'Test Org', email: 'test@example.com' };
      
      storageService.save(key, data);
      
      expect(sessionStorage.getItem(key)).toBe(JSON.stringify(data));
    });

    it('should overwrite existing data', () => {
      const key = StorageKeys.WIZARD_STATE;
      
      storageService.save(key, { step: 1 });
      storageService.save(key, { step: 2 });
      
      expect(storageService.get(key)).toEqual({ step: 2 });
    });
  });

  describe('get', () => {
    it('should retrieve saved data', () => {
      const key = StorageKeys.FORM_CONFIG;
      const data = { fields: ['name', 'email'] };
      
      storageService.save(key, data);
      const retrieved = storageService.get(key);
      
      expect(retrieved).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const result = storageService.get('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should handle corrupted data gracefully', () => {
      sessionStorage.setItem(StorageKeys.ONBOARDING_DATA, 'invalid-json{');
      
      const result = storageService.get(StorageKeys.ONBOARDING_DATA);
      
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear specific key', () => {
      const key = StorageKeys.QR_CONFIG;
      
      storageService.save(key, { qrCodes: [] });
      storageService.clear(key);
      
      expect(storageService.has(key)).toBe(false);
    });

    it('should not affect other keys', () => {
      storageService.save(StorageKeys.SESSION_ID, 'session-123');
      storageService.save(StorageKeys.WIZARD_STATE, { step: 1 });
      
      storageService.clear(StorageKeys.SESSION_ID);
      
      expect(storageService.has(StorageKeys.SESSION_ID)).toBe(false);
      expect(storageService.has(StorageKeys.WIZARD_STATE)).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should clear all BlessBox keys', () => {
      storageService.save(StorageKeys.SESSION_ID, 'session-123');
      storageService.save(StorageKeys.WIZARD_STATE, { step: 1 });
      storageService.save(StorageKeys.FORM_CONFIG, { fields: [] });
      
      storageService.clearAll();
      
      expect(storageService.has(StorageKeys.SESSION_ID)).toBe(false);
      expect(storageService.has(StorageKeys.WIZARD_STATE)).toBe(false);
      expect(storageService.has(StorageKeys.FORM_CONFIG)).toBe(false);
    });

    it('should not clear non-BlessBox keys', () => {
      sessionStorage.setItem('other-app-key', 'value');
      storageService.save(StorageKeys.SESSION_ID, 'session-123');
      
      storageService.clearAll();
      
      expect(sessionStorage.getItem('other-app-key')).toBe('value');
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      storageService.save(StorageKeys.ONBOARDING_DATA, { test: true });
      
      expect(storageService.has(StorageKeys.ONBOARDING_DATA)).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(storageService.has(StorageKeys.QR_CONFIG)).toBe(false);
    });
  });
});