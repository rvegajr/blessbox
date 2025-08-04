/**
 * Form field interface
 * Represents a single field in the registration form
 */
export interface IFormField {
  id: string;
  type: 'text' | 'tel' | 'email' | 'number' | 'select' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: IFieldValidation;
  order: number;
}

/**
 * Field validation rules
 */
export interface IFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number; // For number fields
  max?: number; // For number fields
  customMessage?: string;
}

/**
 * Form builder interface
 * Manages form field operations
 */
export interface IFormBuilder {
  /**
   * Add a new field to the form
   */
  addField(field: IFormField): void;

  /**
   * Remove a field from the form
   */
  removeField(fieldId: string): void;

  /**
   * Update an existing field
   */
  updateField(fieldId: string, updates: Partial<IFormField>): void;

  /**
   * Get all fields in order
   */
  getFields(): IFormField[];

  /**
   * Reorder fields
   */
  reorderFields(fieldIds: string[]): void;

  /**
   * Validate form configuration
   */
  validate(): boolean;
}

/**
 * Default fields that are always present
 */
export const DEFAULT_FIELDS: IFormField[] = [
  {
    id: 'fullName',
    type: 'text',
    label: 'Full Name',
    required: true,
    order: 1,
    validation: {
      minLength: 2,
      maxLength: 100
    }
  },
  {
    id: 'phone',
    type: 'tel',
    label: 'Phone Number',
    required: true,
    order: 2,
    validation: {
      pattern: '^[\\d\\s\\-\\(\\)\\+]+$',
      minLength: 10
    }
  },
  {
    id: 'familySize',
    type: 'number',
    label: 'Family Size',
    required: true,
    order: 3,
    validation: {
      min: 1,
      max: 20
    }
  }
];