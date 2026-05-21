/**
 * Phase E: Fix #34 — Export CSV diagnostics
 * TDD Test Suite for RegistrationsCsvBuilder (Red → Green)
 */

import { describe, it, expect } from 'vitest';
import { buildCsv } from './RegistrationsCsvBuilder';

describe('RegistrationsCsvBuilder', () => {
  it('emits at least the BOM + header row when there are zero registrations', () => {
    const csv = buildCsv({ registrations: [], formFields: [], timezone: 'UTC' });
    
    // Should start with BOM
    expect(csv).toMatch(/^\uFEFF/);
    
    // Should have at least one line (the header)
    const lines = csv.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    
    // Header should contain standard fields
    expect(csv).toContain('Registration ID');
  });

  it('generates proper CSV with headers and one row', () => {
    const registrations = [
      {
        id: 'reg-123',
        qrCodeId: 'qr-456',
        registeredAt: '2024-01-01T12:00:00Z',
        deliveryStatus: 'pending',
        checkedInAt: null,
        registrationData: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
      },
    ];
    
    const formFields = [
      { id: 'name', label: 'Full Name' },
      { id: 'email', label: 'Email Address' },
    ];
    
    const csv = buildCsv({ registrations, formFields, timezone: 'UTC' });
    
    // Should start with BOM
    expect(csv).toMatch(/^\uFEFF/);
    
    // Should have 2 lines (header + 1 data row)
    const lines = csv.split('\n');
    expect(lines.length).toBe(2);
    
    // Header should include custom field labels
    expect(csv).toContain('Full Name');
    expect(csv).toContain('Email Address');
    
    // Data row should include values
    expect(csv).toContain('John Doe');
    expect(csv).toContain('john@example.com');
  });

  it('escapes commas in values correctly', () => {
    const registrations = [
      {
        id: 'reg-123',
        qrCodeId: 'qr-456',
        registeredAt: '2024-01-01T12:00:00Z',
        deliveryStatus: 'pending',
        checkedInAt: null,
        registrationData: JSON.stringify({ name: 'Doe, John' }),
      },
    ];
    
    const formFields = [{ id: 'name', label: 'Name' }];
    
    const csv = buildCsv({ registrations, formFields, timezone: 'UTC' });
    
    // Value with comma should be quoted
    expect(csv).toContain('"Doe, John"');
  });

  it('handles multiple registrations', () => {
    const registrations = [
      {
        id: 'reg-1',
        qrCodeId: 'qr-1',
        registeredAt: '2024-01-01T12:00:00Z',
        deliveryStatus: 'pending',
        checkedInAt: null,
        registrationData: JSON.stringify({ name: 'Alice' }),
      },
      {
        id: 'reg-2',
        qrCodeId: 'qr-2',
        registeredAt: '2024-01-02T12:00:00Z',
        deliveryStatus: 'sent',
        checkedInAt: null,
        registrationData: JSON.stringify({ name: 'Bob' }),
      },
    ];
    
    const formFields = [{ id: 'name', label: 'Name' }];
    
    const csv = buildCsv({ registrations, formFields, timezone: 'UTC' });
    
    // Should have 3 lines (header + 2 data rows)
    const lines = csv.split('\n');
    expect(lines.length).toBe(3);
    
    expect(csv).toContain('Alice');
    expect(csv).toContain('Bob');
  });
});
