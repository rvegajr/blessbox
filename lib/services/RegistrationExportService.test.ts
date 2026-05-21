/**
 * RegistrationExportService Tests (TDD)
 *
 * Covers CSV generation with:
 *   - UTF-8 BOM for Windows Excel
 *   - Custom field labels from form config
 *   - Formula injection escaping
 *   - Empty registration handling
 */

import { describe, it, expect } from 'vitest';
import { RegistrationExportService } from './RegistrationExportService';
import type { Registration } from '@/lib/interfaces/IRegistrationService';
import type { FormField } from '@/lib/utils/registration-field-parser';

const UTF8_BOM = '\uFEFF';

function makeReg(overrides: Partial<Registration> = {}): Registration {
  return {
    id: 'reg-1',
    qrCodeSetId: 'qrs-1',
    qrCodeId: 'qr-1',
    registrationData: JSON.stringify({ Field_001: 'Alice', Field_002: 'alice@test.com' }),
    deliveryStatus: 'delivered',
    registeredAt: '2026-05-10T14:00:00Z',
    ...overrides,
  };
}

const formFields: FormField[] = [
  { id: 'Field_001', type: 'text', label: 'Full Name', required: true },
  { id: 'Field_002', type: 'email', label: 'Email Address', required: true },
];

describe('RegistrationExportService (ISP + TDD)', () => {
  const svc = new RegistrationExportService();

  it('exportToCSV returns BOM-prefixed CSV with custom field labels', () => {
    const csv = svc.exportToCSV([makeReg()], 'America/Los_Angeles', formFields);

    expect(csv.startsWith(UTF8_BOM)).toBe(true);
    expect(csv).toContain('Full Name');
    expect(csv).toContain('Email Address');
    expect(csv).toContain('Alice');
    expect(csv).toContain('alice@test.com');
  });

  it('exportToCSV escapes formula injection characters', () => {
    const reg = makeReg({
      registrationData: JSON.stringify({ Field_001: '=CMD()', Field_002: '+danger' }),
    });

    const csv = svc.exportToCSV([reg], 'UTC', formFields);

    // Formula-starting chars must be prefixed with single quote
    expect(csv).toContain("'=CMD()");
    expect(csv).toContain("'+danger");
  });

  it('exportToCSV returns empty message for zero registrations', () => {
    const csv = svc.exportToCSV([], 'UTC');

    expect(csv.startsWith(UTF8_BOM)).toBe(true);
    expect(csv).toContain('No registrations to export');
  });

  it('exportToCSV falls back to camelCase labels without formFields', () => {
    const reg = makeReg({
      registrationData: JSON.stringify({ firstName: 'Bob', emailAddress: 'bob@test.com' }),
    });

    const csv = svc.exportToCSV([reg], 'UTC');

    // camelCase keys should be split: firstName → "First Name"
    expect(csv).toContain('First Name');
    expect(csv).toContain('Email Address');
    expect(csv).toContain('Bob');
  });

  it('exportToCSV includes standard columns', () => {
    const csv = svc.exportToCSV([makeReg()], 'UTC', formFields);
    const headerLine = csv.replace(UTF8_BOM, '').split('\n')[0];

    expect(headerLine).toContain('Registration ID');
    expect(headerLine).toContain('QR Code ID');
    expect(headerLine).toContain('Registered At');
    expect(headerLine).toContain('Status');
    expect(headerLine).toContain('Checked In');
  });
});
