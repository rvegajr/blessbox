// IOrganizationService - Interface Segregation Principle Compliant
// Single responsibility: Organization creation, management, and email verification

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
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationCreate {
  name: string;
  eventName?: string;
  customDomain?: string;
  contactEmail: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  contactState?: string;
  contactZip?: string;
}

export interface OrganizationUpdate {
  name?: string;
  eventName?: string;
  customDomain?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactCity?: string;
  contactState?: string;
  contactZip?: string;
}

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  organization?: Organization;
}

export interface IOrganizationService {
  // Organization creation
  createOrganization(data: OrganizationCreate): Promise<Organization>;
  
  // Organization retrieval
  getOrganization(id: string): Promise<Organization | null>;
  getOrganizationByEmail(email: string): Promise<Organization | null>;
  getOrganizationByDomain(domain: string): Promise<Organization | null>;
  
  // Organization update
  updateOrganization(id: string, updates: OrganizationUpdate): Promise<Organization>;
  
  // Email verification
  verifyEmail(organizationId: string): Promise<EmailVerificationResult>;
  
  // Validation
  validateOrganizationData(data: OrganizationCreate): Promise<{ isValid: boolean; errors?: string[] }>;
  checkEmailUniqueness(email: string, excludeId?: string): Promise<boolean>;
  checkDomainUniqueness(domain: string, excludeId?: string): Promise<boolean>;
}
