/**
 * Tests for event_type persistence through the onboarding form-config flow.
 * TDD: These tests verify that eventType round-trips through:
 *   FormConfigService.createFormConfig -> SQL INSERT -> SELECT -> mapRowToFormConfig
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormConfigService } from './FormConfigService';
import type { FormField } from '../interfaces/IFormConfigService';
import { getDbClient } from '../db';

vi.mock('../db', () => ({
  getDbClient: vi.fn(),
}));

describe('FormConfigService — eventType persistence (Phase 1)', () => {
  let service: FormConfigService;
  let mockDb: any;

  const validFields: FormField[] = [
    { id: 'full_name', type: 'text', label: 'Full Name', required: true, order: 0 },
    { id: 'email', type: 'email', label: 'Email', required: true, order: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = { execute: vi.fn() };
    (getDbClient as any).mockReturnValue(mockDb);
    service = new FormConfigService();
  });

  it('persists eventType in the INSERT statement when creating a new form config', async () => {
    // Arrange: org-exists check + insert + read-back
    mockDb.execute.mockImplementation((req: any) => {
      const sql = String(req.sql || '');
      if (sql.includes('SELECT id FROM organizations')) {
        return Promise.resolve({ rows: [{ id: 'org-1' }] });
      }
      if (sql.includes('INSERT INTO qr_code_sets')) {
        return Promise.resolve({ rows: [] });
      }
      if (sql.includes('SELECT * FROM qr_code_sets')) {
        return Promise.resolve({
          rows: [
            {
              id: 'config-1',
              organization_id: 'org-1',
              name: 'Sunday Distribution',
              language: 'en',
              form_fields: JSON.stringify(validFields),
              event_type: 'food_distribution',
              description: null,
              created_at: '2026-05-20T20:00:00Z',
              updated_at: '2026-05-20T20:00:00Z',
            },
          ],
        });
      }
      return Promise.resolve({ rows: [] });
    });

    // Act
    const config = await service.createFormConfig({
      organizationId: 'org-1',
      name: 'Sunday Distribution',
      eventType: 'food_distribution',
      formFields: validFields,
    });

    // Assert: eventType was sent through the INSERT args, and round-trips on read
    const insertCall = (mockDb.execute as any).mock.calls.find((call: any[]) =>
      String(call[0]?.sql || '').includes('INSERT INTO qr_code_sets')
    );
    expect(insertCall).toBeDefined();
    const insertArgs = insertCall![0].args as unknown[];
    expect(insertArgs).toContain('food_distribution');

    expect(config.eventType).toBe('food_distribution');
    expect(config.description).toBeNull();
  });

  it('persists null eventType when omitted (backwards compatibility)', async () => {
    mockDb.execute.mockImplementation((req: any) => {
      const sql = String(req.sql || '');
      if (sql.includes('SELECT id FROM organizations')) {
        return Promise.resolve({ rows: [{ id: 'org-1' }] });
      }
      if (sql.includes('INSERT INTO qr_code_sets')) {
        return Promise.resolve({ rows: [] });
      }
      if (sql.includes('SELECT * FROM qr_code_sets')) {
        return Promise.resolve({
          rows: [
            {
              id: 'config-2',
              organization_id: 'org-1',
              name: 'Legacy Form',
              language: 'en',
              form_fields: JSON.stringify(validFields),
              event_type: null,
              description: null,
              created_at: '2026-05-20T20:00:00Z',
              updated_at: '2026-05-20T20:00:00Z',
            },
          ],
        });
      }
      return Promise.resolve({ rows: [] });
    });

    const config = await service.createFormConfig({
      organizationId: 'org-1',
      name: 'Legacy Form',
      formFields: validFields,
    });

    expect(config.eventType).toBeNull();
  });

  it('updates eventType via updateFormConfig and round-trips through SELECT', async () => {
    // Sequence: getFormConfig (existing) -> validateFormFields (no DB) -> UPDATE -> getFormConfig (new)
    let selectCallCount = 0;
    mockDb.execute.mockImplementation((req: any) => {
      const sql = String(req.sql || '');
      if (sql.startsWith('SELECT * FROM qr_code_sets')) {
        selectCallCount += 1;
        const eventType = selectCallCount === 1 ? null : 'seminar';
        return Promise.resolve({
          rows: [
            {
              id: 'config-3',
              organization_id: 'org-1',
              name: 'Workshop',
              language: 'en',
              form_fields: JSON.stringify(validFields),
              event_type: eventType,
              description: null,
              created_at: '2026-05-20T20:00:00Z',
              updated_at: '2026-05-20T20:00:00Z',
            },
          ],
        });
      }
      if (sql.startsWith('UPDATE qr_code_sets')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });

    const updated = await service.updateFormConfig('config-3', {
      eventType: 'seminar',
    });

    const updateCall = (mockDb.execute as any).mock.calls.find((call: any[]) =>
      String(call[0]?.sql || '').startsWith('UPDATE qr_code_sets')
    );
    expect(updateCall).toBeDefined();
    expect(String(updateCall![0].sql)).toContain('event_type = ?');
    expect((updateCall![0].args as unknown[])).toContain('seminar');
    expect(updated.eventType).toBe('seminar');
  });
});
