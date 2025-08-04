/**
 * QR Code configuration interface
 */
export interface IQRCodeConfig {
  id: string;
  label: string;
  location?: string;
  language: string;
  isActive: boolean;
  createdAt?: Date;
}

/**
 * QR Code generator interface
 */
export interface IQRCodeGenerator {
  /**
   * Generate QR code data
   * @param label - Label for the QR code
   * @returns QR code identifier
   */
  generate(label: string): string;

  /**
   * Generate multiple QR codes
   * @param labels - Array of labels
   * @returns Array of QR code identifiers
   */
  generateBatch(labels: string[]): string[];
}

/**
 * Language provider interface
 */
export interface ILanguageProvider {
  /**
   * Get available languages for forms
   * @returns Array of available languages
   */
  getAvailableLanguages(): ILanguage[];

  /**
   * Set language for a QR code
   * @param qrCodeId - QR code identifier
   * @param languageCode - Language code
   */
  setLanguage(qrCodeId: string, languageCode: string): void;

  /**
   * Get language for a QR code
   * @param qrCodeId - QR code identifier
   * @returns Language code
   */
  getLanguage(qrCodeId: string): string;
}

/**
 * Language interface
 */
export interface ILanguage {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Available form languages
 */
export const FORM_LANGUAGES: ILanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' }
];