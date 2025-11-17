import { IStorageService, StorageKeys } from '@/interfaces/services/IStorageService';

/**
 * SessionStorage implementation of IStorageService
 * Implements storage using browser's sessionStorage
 */
export class SessionStorageService implements IStorageService {
  private readonly prefix = 'blessbox_';

  /**
   * Save data to sessionStorage
   */
  save(key: string, data: any): void {
    try {
      const serialized = JSON.stringify(data);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error);
      throw new Error('Storage save failed');
    }
  }

  /**
   * Get data from sessionStorage
   */
  get<T = any>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to parse stored data:', error);
      return null;
    }
  }

  /**
   * Clear specific key from sessionStorage
   */
  clear(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * Clear all BlessBox keys from sessionStorage
   */
  clearAll(): void {
    const keysToRemove: string[] = [];
    
    // Find all BlessBox keys
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && this.isBlessBoxKey(key)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove them
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Check if key exists in sessionStorage
   */
  has(key: string): boolean {
    return sessionStorage.getItem(key) !== null;
  }

  /**
   * Check if a key belongs to BlessBox
   */
  private isBlessBoxKey(key: string): boolean {
    return Object.values(StorageKeys).includes(key as StorageKeys);
  }
}

/**
 * LocalStorage implementation of IStorageService
 * Can be used for more persistent storage needs
 */
export class LocalStorageService extends SessionStorageService {
  /**
   * Save data to localStorage
   */
  save(key: string, data: any): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw new Error('Storage save failed');
    }
  }

  /**
   * Get data from localStorage
   */
  get<T = any>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to parse stored data:', error);
      return null;
    }
  }

  /**
   * Clear specific key from localStorage
   */
  clear(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all BlessBox keys from localStorage
   */
  clearAll(): void {
    const keysToRemove: string[] = [];
    
    // Find all BlessBox keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && this.isBlessBoxKey(key)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove them
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Check if key exists in localStorage
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}