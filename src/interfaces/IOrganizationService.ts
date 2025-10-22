/**
 * Organization Service Interface
 * 
 * Defines the contract for organization management operations
 * following Interface Segregation Principle (ISP)
 */

export interface Organization {
  id: string;
  name: string;
  eventName?: string;
  customDomain?: string;
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  contactState?: string;
  contactZip?: string;
  slug?: string;
  billingStatus: 'trial' | 'active' | 'suspended' | 'cancelled';
  monthlyPrice: number;
  priceOverride?: number;
  couponCode?: string;
  couponDiscount?: number;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  squareSubscriptionId?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface OrganizationCreateData {
  name: string;
  eventName?: string;
  customDomain?: string;
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  contactState?: string;
  contactZip?: string;
  slug?: string;
}

export interface OrganizationUpdateData {
  name?: string;
  eventName?: string;
  customDomain?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  contactState?: string;
  contactZip?: string;
  slug?: string;
}

export interface OnboardingData {
  organizationDetails: OrganizationDetails;
  formConfiguration: FormConfiguration;
  qrCodeConfiguration: QRCodeConfiguration;
}

export interface OrganizationDetails {
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  contactState?: string;
  contactZip?: string;
  eventDescription?: string;
  eventDate?: string;
  eventLocation?: string;
}

export interface FormConfiguration {
  name: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: FieldValidation;
}

export interface FormSettings {
  allowMultipleSubmissions: boolean;
  requireEmailVerification: boolean;
  showProgressBar: boolean;
  customTheme?: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

export interface QRCodeConfiguration {
  qrCodes: QRCodeConfig[];
  language: string;
  defaultEntryPoint: string;
}

export interface QRCodeConfig {
  id: string;
  label: string;
  entryPoint: string;
  isActive: boolean;
}

export interface OnboardingStatus {
  organizationSetup: boolean;
  emailVerified: boolean;
  formConfigured: boolean;
  qrCodesGenerated: boolean;
  completed: boolean;
  currentStep: 'organization-setup' | 'verify-email' | 'form-builder' | 'qr-configuration' | 'completed';
}

export interface OrganizationServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Organization Service Interface
 * 
 * Handles all organization-related operations including creation,
 * management, onboarding, and access control.
 */
export interface IOrganizationService {
  // Organization Management
  createOrganization(data: OrganizationCreateData): Promise<OrganizationServiceResult<Organization>>;
  updateOrganization(id: string, data: OrganizationUpdateData): Promise<OrganizationServiceResult<Organization>>;
  getOrganization(id: string): Promise<OrganizationServiceResult<Organization>>;
  getOrganizationBySlug(slug: string): Promise<OrganizationServiceResult<Organization>>;
  getOrganizationByEmail(email: string): Promise<OrganizationServiceResult<Organization>>;
  
  // Access Control
  validateOrganizationAccess(userId: string, orgId: string): Promise<boolean>;
  getUserOrganizations(userId: string): Promise<OrganizationServiceResult<Organization[]>>;
  
  // Onboarding
  completeOnboarding(orgId: string, onboardingData: OnboardingData): Promise<OrganizationServiceResult<void>>;
  getOnboardingStatus(orgId: string): Promise<OrganizationServiceResult<OnboardingStatus>>;
  updateOnboardingStep(orgId: string, step: string, completed: boolean): Promise<OrganizationServiceResult<void>>;
  
  // Slug Management
  generateSlug(name: string): Promise<string>;
  validateSlug(slug: string, excludeOrgId?: string): Promise<boolean>;
  
  // Organization Statistics
  getOrganizationCount(): Promise<number>;
  getActiveOrganizations(): Promise<OrganizationServiceResult<Organization[]>>;
}

