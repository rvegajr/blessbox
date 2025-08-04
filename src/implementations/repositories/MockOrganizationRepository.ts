// Mock Organization Repository for testing without database
import type { 
  IOrganizationRepository, 
  CreateOrganizationData, 
  Organization 
} from '../../interfaces/database/IOrganizationRepository';

export class MockOrganizationRepository implements IOrganizationRepository {
  private organizations = new Map<string, Organization>();
  private emailIndex = new Map<string, string>(); // email -> id
  private domainIndex = new Map<string, string>(); // domain -> id

  async create(data: CreateOrganizationData): Promise<Organization> {
    // Check for duplicate email
    if (this.emailIndex.has(data.contactEmail)) {
      throw new Error('duplicate key value violates unique constraint "organizations_contact_email_unique"');
    }

    // Check for duplicate domain
    if (data.customDomain && this.domainIndex.has(data.customDomain)) {
      throw new Error('duplicate key value violates unique constraint "organizations_custom_domain_unique"');
    }

    const id = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const organization: Organization = {
      id,
      ...data,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    this.organizations.set(id, organization);
    this.emailIndex.set(data.contactEmail, id);
    if (data.customDomain) {
      this.domainIndex.set(data.customDomain, id);
    }

    console.log(`📝 Mock: Created organization ${organization.name} (${id})`);
    return organization;
  }

  async findById(id: string): Promise<Organization | null> {
    return this.organizations.get(id) || null;
  }

  async findByEmail(email: string): Promise<Organization | null> {
    const id = this.emailIndex.get(email);
    return id ? this.organizations.get(id) || null : null;
  }

  async findByDomain(domain: string): Promise<Organization | null> {
    const id = this.domainIndex.get(domain);
    return id ? this.organizations.get(id) || null : null;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const existing = this.organizations.get(id);
    if (!existing) {
      throw new Error('Organization not found');
    }

    const updated: Organization = {
      ...existing,
      ...data,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.organizations.set(id, updated);

    // Update indexes if email or domain changed
    if (data.contactEmail && data.contactEmail !== existing.contactEmail) {
      this.emailIndex.delete(existing.contactEmail);
      this.emailIndex.set(data.contactEmail, id);
    }

    if (data.customDomain !== undefined) {
      if (existing.customDomain) {
        this.domainIndex.delete(existing.customDomain);
      }
      if (data.customDomain) {
        this.domainIndex.set(data.customDomain, id);
      }
    }

    return updated;
  }

  async markEmailVerified(id: string): Promise<void> {
    const existing = this.organizations.get(id);
    if (existing) {
      existing.emailVerified = true;
      existing.updatedAt = new Date();
      this.organizations.set(id, existing);
    }
  }

  async delete(id: string): Promise<void> {
    const existing = this.organizations.get(id);
    if (existing) {
      this.organizations.delete(id);
      this.emailIndex.delete(existing.contactEmail);
      if (existing.customDomain) {
        this.domainIndex.delete(existing.customDomain);
      }
    }
  }

  async findAll(limit = 50, offset = 0): Promise<Organization[]> {
    const all = Array.from(this.organizations.values());
    return all.slice(offset, offset + limit);
  }

  async count(): Promise<number> {
    return this.organizations.size;
  }

  // Mock-specific methods for testing
  clear(): void {
    this.organizations.clear();
    this.emailIndex.clear();
    this.domainIndex.clear();
  }

  getAll(): Organization[] {
    return Array.from(this.organizations.values());
  }
}