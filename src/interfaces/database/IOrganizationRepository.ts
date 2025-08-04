// Interface Segregation Principle: Organization-specific database operations
export interface IOrganizationRepository {
  // Create operations
  create(organization: CreateOrganizationData): Promise<Organization>;
  
  // Read operations
  findById(id: string): Promise<Organization | null>;
  findByEmail(email: string): Promise<Organization | null>;
  findByDomain(domain: string): Promise<Organization | null>;
  
  // Update operations
  update(id: string, data: Partial<Organization>): Promise<Organization>;
  markEmailVerified(id: string): Promise<void>;
  
  // Delete operations
  delete(id: string): Promise<void>;
  
  // Query operations
  findAll(limit?: number, offset?: number): Promise<Organization[]>;
  count(): Promise<number>;
}

export interface CreateOrganizationData {
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

export interface Organization extends CreateOrganizationData {
  id: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}