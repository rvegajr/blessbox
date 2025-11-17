import { getDbClient } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { 
  IFormConfigService,
  FormConfig,
  FormConfigCreate,
  FormConfigUpdate,
  FormField,
  FormConfigValidationResult
} from '../interfaces/IFormConfigService';

export class FormConfigService implements IFormConfigService {
  private db = getDbClient();

  async createFormConfig(data: FormConfigCreate): Promise<FormConfig> {
    // Validate data
    const validation = await this.validateFormConfig(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    // Check if organization exists
    const orgResult = await this.db.execute({
      sql: 'SELECT id FROM organizations WHERE id = ?',
      args: [data.organizationId]
    });

    if (orgResult.rows.length === 0) {
      throw new Error('Organization not found');
    }

    // Validate form fields
    const fieldsValidation = await this.validateFormFields(data.formFields);
    if (!fieldsValidation.isValid) {
      throw new Error(`Form fields validation failed: ${fieldsValidation.errors?.join(', ')}`);
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Create QR code set with form configuration
    // Form config is stored in qr_code_sets table
    await this.db.execute({
      sql: `
        INSERT INTO qr_code_sets (
          id, organization_id, name, language, form_fields, qr_codes, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        data.organizationId,
        data.name,
        data.language || 'en',
        JSON.stringify(data.formFields),
        JSON.stringify([]), // Empty QR codes initially
        1, // is_active
        now,
        now,
      ]
    });

    // Return created config
    const config = await this.getFormConfig(id);
    if (!config) {
      throw new Error('Failed to create form configuration');
    }
    return config;
  }

  async getFormConfig(id: string): Promise<FormConfig | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM qr_code_sets WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFormConfig(result.rows[0] as any);
  }

  async getFormConfigByOrganization(organizationId: string): Promise<FormConfig | null> {
    const result = await this.db.execute({
      sql: `
        SELECT * FROM qr_code_sets 
        WHERE organization_id = ? AND is_active = 1
        ORDER BY created_at DESC 
        LIMIT 1
      `,
      args: [organizationId]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFormConfig(result.rows[0] as any);
  }

  async updateFormConfig(id: string, updates: FormConfigUpdate): Promise<FormConfig> {
    // Check if config exists
    const existing = await this.getFormConfig(id);
    if (!existing) {
      throw new Error('Form configuration not found');
    }

    // Validate updates if provided
    if (updates.formFields) {
      const fieldsValidation = await this.validateFormFields(updates.formFields);
      if (!fieldsValidation.isValid) {
        throw new Error(`Form fields validation failed: ${fieldsValidation.errors?.join(', ')}`);
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.language !== undefined) {
      updateFields.push('language = ?');
      updateValues.push(updates.language);
    }
    if (updates.formFields !== undefined) {
      updateFields.push('form_fields = ?');
      updateValues.push(JSON.stringify(updates.formFields));
    }

    if (updateFields.length === 0) {
      return existing; // No updates
    }

    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(id);

    await this.db.execute({
      sql: `UPDATE qr_code_sets SET ${updateFields.join(', ')} WHERE id = ?`,
      args: updateValues
    });

    // Return updated config
    const updated = await this.getFormConfig(id);
    if (!updated) {
      throw new Error('Failed to update form configuration');
    }
    return updated;
  }

  async deleteFormConfig(id: string): Promise<void> {
    // Check if config exists
    const existing = await this.getFormConfig(id);
    if (!existing) {
      throw new Error('Form configuration not found');
    }

    // Soft delete by setting is_active = 0
    await this.db.execute({
      sql: 'UPDATE qr_code_sets SET is_active = 0, updated_at = ? WHERE id = ?',
      args: [new Date().toISOString(), id]
    });
  }

  async validateFormConfig(data: FormConfigCreate | FormConfigUpdate): Promise<FormConfigValidationResult> {
    const errors: string[] = [];

    if ('organizationId' in data) {
      if (!data.organizationId || data.organizationId.trim().length === 0) {
        errors.push('Organization ID is required');
      }
    }

    if ('name' in data && data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Form name is required');
      }
    }

    if ('formFields' in data && data.formFields !== undefined) {
      if (!Array.isArray(data.formFields)) {
        errors.push('Form fields must be an array');
      } else if (data.formFields.length === 0) {
        errors.push('At least one form field is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async validateFormFields(fields: FormField[]): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!Array.isArray(fields)) {
      return {
        isValid: false,
        errors: ['Form fields must be an array']
      };
    }

    if (fields.length === 0) {
      return {
        isValid: false,
        errors: ['At least one form field is required']
      };
    }

    fields.forEach((field, index) => {
      if (!field.id || field.id.trim().length === 0) {
        errors.push(`Field ${index + 1}: ID is required`);
      }

      if (!field.label || field.label.trim().length === 0) {
        errors.push(`Field ${index + 1}: Label is required`);
      }

      const validTypes = ['text', 'email', 'phone', 'select', 'textarea', 'checkbox', 'number', 'date'];
      if (!validTypes.includes(field.type)) {
        errors.push(`Field ${index + 1}: Invalid type. Must be one of: ${validTypes.join(', ')}`);
      }

      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        errors.push(`Field ${index + 1}: Select fields must have options`);
      }

      if (typeof field.required !== 'boolean') {
        errors.push(`Field ${index + 1}: Required must be a boolean`);
      }

      if (typeof field.order !== 'number') {
        errors.push(`Field ${index + 1}: Order must be a number`);
      }
    });

    // Check for duplicate IDs
    const ids = fields.map(f => f.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate field IDs: ${duplicateIds.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private mapRowToFormConfig(row: any): FormConfig {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      language: row.language || 'en',
      formFields: JSON.parse(row.form_fields || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
