// TDD Implementation: Organization Repository
import { eq, count } from 'drizzle-orm';
import { getDatabase } from '../../database/connection';
import { organizations } from '../../database/schema';
import type { 
  IOrganizationRepository, 
  CreateOrganizationData, 
  Organization 
} from '../../interfaces/database/IOrganizationRepository';

export class OrganizationRepository implements IOrganizationRepository {
  private db = getDatabase();

  async create(data: CreateOrganizationData): Promise<Organization> {
    try {
      // SQLite-compatible insert - TURSO POWER! 🚀
      const organizationId = crypto.randomUUID();
      await this.db
        .insert(organizations)
        .values({
          id: organizationId,
          ...data,
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      // Get the inserted organization - CLEAN AND BEAUTIFUL! ✨
      const [organization] = await this.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId));

      return organization;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value')) {
          if (error.message.includes('contact_email')) {
            throw new Error('An organization with this email already exists');
          }
          if (error.message.includes('custom_domain')) {
            throw new Error('This custom domain is already taken');
          }
        }
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Organization | null> {
    const [organization] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return organization || null;
  }

  async findByEmail(email: string): Promise<Organization | null> {
    const [organization] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.contactEmail, email))
      .limit(1);

    return organization || null;
  }

  async findByDomain(domain: string): Promise<Organization | null> {
    const [organization] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.customDomain, domain))
      .limit(1);

    return organization || null;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    // SQLite-compatible update - TURSO MAGIC! ✨
    await this.db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(organizations.id, id));

    // Get the updated organization - BEAUTIFUL! 🎯
    const [organization] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));

    if (!organization) {
      throw new Error('Organization not found');
    }

    return organization;
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.db
      .update(organizations)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(organizations)
      .where(eq(organizations.id, id));
  }

  async findAll(limit = 50, offset = 0): Promise<Organization[]> {
    return await this.db
      .select()
      .from(organizations)
      .limit(limit)
      .offset(offset);
  }

  async count(): Promise<number> {
    const [result] = await this.db
      .select({ count: count() })
      .from(organizations);

    return result.count;
  }
}