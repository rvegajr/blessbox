/**
 * Form Builder Service Interface
 * 
 * Defines the contract for dynamic form creation and management operations
 * following Interface Segregation Principle (ISP)
 */

export interface Form {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'number';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
  order: number;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
  min?: number;
  max?: number;
}

export interface FormSettings {
  allowMultipleSubmissions: boolean;
  requireEmailVerification: boolean;
  showProgressBar: boolean;
  customTheme?: string;
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
}

export interface FormSubmission {
  formId: string;
  fieldValues: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FieldError[];
  warnings: FieldWarning[];
}

export interface FieldError {
  fieldId: string;
  message: string;
  code: string;
}

export interface FieldWarning {
  fieldId: string;
  message: string;
  code: string;
}

export interface FormBuilderServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Form Builder Service Interface
 * 
 * Handles all form-related operations including creation, management,
 * validation, and submission processing.
 */
export interface IFormBuilderService {
  // Form Management
  createForm(orgId: string, formData: FormCreateData): Promise<FormBuilderServiceResult<Form>>;
  updateForm(formId: string, formData: FormUpdateData): Promise<FormBuilderServiceResult<Form>>;
  getForm(formId: string): Promise<FormBuilderServiceResult<Form>>;
  getFormsByOrganization(orgId: string): Promise<FormBuilderServiceResult<Form[]>>;
  deleteForm(formId: string): Promise<FormBuilderServiceResult<void>>;
  duplicateForm(formId: string, newName: string): Promise<FormBuilderServiceResult<Form>>;
  
  // Form Field Management
  addField(formId: string, field: FormField): Promise<FormBuilderServiceResult<Form>>;
  updateField(formId: string, fieldId: string, field: Partial<FormField>): Promise<FormBuilderServiceResult<Form>>;
  removeField(formId: string, fieldId: string): Promise<FormBuilderServiceResult<Form>>;
  reorderFields(formId: string, fieldIds: string[]): Promise<FormBuilderServiceResult<Form>>;
  
  // Form Validation
  validateFormSubmission(formId: string, submission: FormSubmission): Promise<FormBuilderServiceResult<ValidationResult>>;
  validateField(field: FormField, value: any): Promise<FieldValidationResult>;
  
  // Form Rendering
  renderForm(formId: string): Promise<FormBuilderServiceResult<FormRenderData>>;
  getFormSchema(formId: string): Promise<FormBuilderServiceResult<FormSchema>>;
  
  // Form Analytics
  getFormSubmissions(formId: string, filters?: FormSubmissionFilters): Promise<FormBuilderServiceResult<FormSubmission[]>>;
  getFormAnalytics(formId: string, timeRange?: TimeRange): Promise<FormBuilderServiceResult<FormAnalytics>>;
  exportFormData(formId: string, format: 'csv' | 'json' | 'xlsx'): Promise<FormBuilderServiceResult<Buffer>>;
  
  // Form Templates
  getFormTemplates(): Promise<FormBuilderServiceResult<FormTemplate[]>>;
  createFormFromTemplate(templateId: string, orgId: string, customizations?: FormCustomizations): Promise<FormBuilderServiceResult<Form>>;
}

export interface FormCreateData {
  name: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
}

export interface FormUpdateData {
  name?: string;
  description?: string;
  fields?: FormField[];
  settings?: FormSettings;
  isActive?: boolean;
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface FormRenderData {
  form: Form;
  html: string;
  css: string;
  javascript: string;
}

export interface FormSchema {
  formId: string;
  fields: FormFieldSchema[];
  validation: FormValidationSchema;
}

export interface FormFieldSchema {
  id: string;
  type: string;
  label: string;
  required: boolean;
  validation: FieldValidation;
}

export interface FormValidationSchema {
  rules: ValidationRule[];
  messages: ValidationMessage[];
}

export interface ValidationRule {
  fieldId: string;
  type: string;
  value: any;
}

export interface ValidationMessage {
  fieldId: string;
  type: string;
  message: string;
}

export interface FormSubmissionFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
  status?: string;
}

export interface FormAnalytics {
  totalSubmissions: number;
  completionRate: number;
  averageCompletionTime: number;
  fieldAnalytics: FieldAnalytics[];
  submissionTrends: SubmissionTrend[];
}

export interface FieldAnalytics {
  fieldId: string;
  fieldLabel: string;
  completionRate: number;
  averageTime: number;
  commonValues: string[];
}

export interface SubmissionTrend {
  date: string;
  submissions: number;
  completions: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  settings: FormSettings;
  preview: string;
}

export interface FormCustomizations {
  name?: string;
  description?: string;
  theme?: string;
  additionalFields?: FormField[];
}

export interface TimeRange {
  startDate: string;
  endDate: string;
}

