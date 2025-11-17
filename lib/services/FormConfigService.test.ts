// FormConfigService Tests - TDD Approach
// Tests the actual implementation against the interface

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormConfigService } from './FormConfigService';
import type { 
  FormConfig,
  FormConfigCreate,
  FormConfigUpdate,
  FormField
} from '../interfaces/IFormConfigService';
import { getDbClient } from '../db';

// Mock the database
vi.mock('../db', () => ({
  getDbClient: vi.fn(),
}));

describe('FormConfigService', () => {
  let service: FormConfigService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDb = {
      execute: vi.fn(),
    };
    
    (getDbClient as any).mockReturnValue(mockDb);
    mockDb.execute.mockResolvedValue({ rows: [] });
    
    service = new FormConfigService();
  });

  describe('createFormConfig', () => {
    it('should create form configuration successfully', async () => {
      const formFields: FormField[] = [
        {
          id: 'firstName',
          type: 'text',
          label: 'First Name',
          placeholder: 'Enter your first name',
          required: true,
          order: 0,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
          order: 1,
        },
      ];

      const configData: FormConfigCreate = {
        organizationId: 'org-123',
        name: 'Registration Form',
        language: 'en',
        formFields,
      };

      // Mock organization check
      mockDb.execute.mockResolvedValueOnce({
        rows: [{ id: 'org-123', name: 'Test Org' }]
      });

      // Mock QR code set creation (form config is stored in qr_code_sets)
      const mockId = 'qr-set-123';
      const now = new Date().toISOString();
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      // Mock retrieval
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: mockId,
          organization_id: 'org-123',
          name: 'Registration Form',
          language: 'en',
          form_fields: JSON.stringify(formFields),
          qr_codes: JSON.stringify([]),
          is_active: 1,
          created_at: now,
          updated_at: now,
        }]
      });

      const config = await service.createFormConfig(configData);

      expect(config).toBeDefined();
      expect(config.id).toBe(mockId);
      expect(config.organizationId).toBe('org-123');
      expect(config.name).toBe('Registration Form');
      expect(config.formFields).toHaveLength(2);
      expect(config.formFields[0].id).toBe('firstName');
    });

    it('should throw error for non-existent organization', async () => {
      const configData: FormConfigCreate = {
        organizationId: 'non-existent',
        name: 'Registration Form',
        formFields: [],
      };

      // Mock organization check - not found
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.createFormConfig(configData)
      ).rejects.toThrow('Organization not found');
    });

    it('should validate form fields structure', async () => {
      const configData: FormConfigCreate = {
        organizationId: 'org-123',
        name: 'Registration Form',
        formFields: [
          {
            id: '',
            type: 'text',
            label: '',
            required: false,
            order: 0,
          } as FormField,
        ],
      };

      // Mock organization check
      mockDb.execute.mockResolvedValueOnce({
        rows: [{ id: 'org-123' }]
      });

      await expect(
        service.createFormConfig(configData)
      ).rejects.toThrow();
    });
  });

  describe('getFormConfig', () => {
    it('should return form config for valid ID', async () => {
      const formFields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          order: 0,
        },
      ];

      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'qr-set-123',
          organization_id: 'org-123',
          name: 'Registration Form',
          language: 'en',
          form_fields: JSON.stringify(formFields),
          qr_codes: JSON.stringify([]),
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      });

      const config = await service.getFormConfig('qr-set-123');

      expect(config).toBeDefined();
      expect(config?.id).toBe('qr-set-123');
      expect(config?.formFields).toHaveLength(1);
    });

    it('should return null for invalid ID', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const config = await service.getFormConfig('invalid-id');

      expect(config).toBeNull();
    });
  });

  describe('getFormConfigByOrganization', () => {
    it('should return form config for organization', async () => {
      const formFields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          order: 0,
        },
      ];

      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'qr-set-123',
          organization_id: 'org-123',
          name: 'Registration Form',
          language: 'en',
          form_fields: JSON.stringify(formFields),
          qr_codes: JSON.stringify([]),
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      });

      const config = await service.getFormConfigByOrganization('org-123');

      expect(config).toBeDefined();
      expect(config?.organizationId).toBe('org-123');
    });

    it('should return null if no config exists', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const config = await service.getFormConfigByOrganization('org-123');

      expect(config).toBeNull();
    });
  });

  describe('updateFormConfig', () => {
    it('should update form configuration', async () => {
      const existingFields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          order: 0,
        },
      ];

      const updatedFields: FormField[] = [
        ...existingFields,
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
          order: 1,
        },
      ];

      // Mock get existing config
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'qr-set-123',
          organization_id: 'org-123',
          name: 'Registration Form',
          language: 'en',
          form_fields: JSON.stringify(existingFields),
          qr_codes: JSON.stringify([]),
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      });

      // Mock update
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      // Mock retrieval after update
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'qr-set-123',
          organization_id: 'org-123',
          name: 'Updated Form',
          language: 'en',
          form_fields: JSON.stringify(updatedFields),
          qr_codes: JSON.stringify([]),
          is_active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      });

      const updates: FormConfigUpdate = {
        name: 'Updated Form',
        formFields: updatedFields,
      };

      const config = await service.updateFormConfig('qr-set-123', updates);

      expect(config.name).toBe('Updated Form');
      expect(config.formFields).toHaveLength(2);
    });

    it('should throw error for non-existent config', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const updates: FormConfigUpdate = {
        name: 'Updated Form',
      };

      await expect(
        service.updateFormConfig('invalid-id', updates)
      ).rejects.toThrow('Form configuration not found');
    });
  });

  describe('validateFormConfig', () => {
    it('should validate correct form configuration', async () => {
      const configData: FormConfigCreate = {
        organizationId: 'org-123',
        name: 'Registration Form',
        formFields: [
          {
            id: 'name',
            type: 'text',
            label: 'Name',
            required: true,
            order: 0,
          },
        ],
      };

      const result = await service.validateFormConfig(configData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid configuration', async () => {
      const configData = {
        organizationId: '',
        name: '',
        formFields: [],
      } as FormConfigCreate;

      const result = await service.validateFormConfig(configData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('validateFormFields', () => {
    it('should validate correct form fields', async () => {
      const fields: FormField[] = [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          order: 0,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
          order: 1,
        },
      ];

      const result = await service.validateFormFields(fields);

      expect(result.isValid).toBe(true);
    });

    it('should return errors for invalid fields', async () => {
      const fields: FormField[] = [
        {
          id: '',
          type: 'text',
          label: '',
          required: false,
          order: 0,
        } as FormField,
      ];

      const result = await service.validateFormFields(fields);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate select fields have options', async () => {
      const fields: FormField[] = [
        {
          id: 'size',
          type: 'select',
          label: 'Size',
          required: true,
          order: 0,
          // Missing options
        } as FormField,
      ];

      const result = await service.validateFormFields(fields);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});
