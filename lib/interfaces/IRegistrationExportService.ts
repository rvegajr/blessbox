/**
 * IRegistrationExportService - ISP Compliant
 *
 * Single responsibility: generate export content (CSV string) from
 * registration data. Does NOT handle HTTP concerns (auth, response headers).
 */

import type { Registration } from './IRegistrationService';
import type { FormField } from '@/lib/utils/registration-field-parser';

export interface IRegistrationExportService {
  /**
   * Generate a CSV string from registrations.
   * Includes UTF-8 BOM, custom field labels, and formula-injection escaping.
   */
  exportToCSV(
    registrations: Registration[],
    timezone: string,
    formFields?: FormField[],
  ): string;
}
