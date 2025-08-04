/**
 * Storage service interface
 * Abstracts storage mechanism (sessionStorage, localStorage, etc.)
 */
export interface IStorageService {
  /**
   * Save data to storage
   * @param key - Storage key
   * @param data - Data to store
   */
  save(key: string, data: any): void;

  /**
   * Retrieve data from storage
   * @param key - Storage key
   * @returns Stored data or null
   */
  get<T = any>(key: string): T | null;

  /**
   * Clear specific key from storage
   * @param key - Storage key to clear
   */
  clear(key: string): void;

  /**
   * Clear all storage
   */
  clearAll(): void;

  /**
   * Check if key exists
   * @param key - Storage key
   * @returns true if key exists
   */
  has(key: string): boolean;
}

/**
 * Storage keys enum for type safety
 */
export enum StorageKeys {
  ONBOARDING_DATA = 'blessbox_onboarding_data',
  WIZARD_STATE = 'blessbox_wizard_state',
  FORM_CONFIG = 'blessbox_form_config',
  QR_CONFIG = 'blessbox_qr_config',
  SESSION_ID = 'blessbox_session_id'
}