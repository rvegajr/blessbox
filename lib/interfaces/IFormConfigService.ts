// IFormConfigService - Interface Segregation Principle Compliant
// Single responsibility: Form configuration management for registration forms

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'number' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  order: number;
}

export interface FormConfig {
  id: string;
  organizationId: string;
  name: string;
  language: string;
  formFields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface FormConfigCreate {
  organizationId: string;
  name: string;
  language?: string;
  formFields: FormField[];
}

export interface FormConfigUpdate {
  name?: string;
  language?: string;
  formFields?: FormField[];
}

export interface FormConfigValidationResult {
  isValid: boolean;
  errors?: string[];
}

export interface IFormConfigService {
  // Form configuration creation
  createFormConfig(data: FormConfigCreate): Promise<FormConfig>;
  
  // Form configuration retrieval
  getFormConfig(id: string): Promise<FormConfig | null>;
  getFormConfigByOrganization(organizationId: string): Promise<FormConfig | null>;
  
  // Form configuration update
  updateFormConfig(id: string, updates: FormConfigUpdate): Promise<FormConfig>;
  
  // Form configuration deletion
  deleteFormConfig(id: string): Promise<void>;
  
  // Validation
  validateFormConfig(data: FormConfigCreate | FormConfigUpdate): Promise<FormConfigValidationResult>;
  validateFormFields(fields: FormField[]): Promise<{ isValid: boolean; errors?: string[] }>;
}
