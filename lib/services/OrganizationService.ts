import { getDbClient } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { 
  IOrganizationService,
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  EmailVerificationResult
} from '../interfaces/IOrganizationService';

export class OrganizationService implements IOrganizationService {
  private db = getDbClient();

  async createOrganization(data: OrganizationCreate): Promise<Organization> {
    // Validate data
    const validation = await this.validateOrganizationData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors?.join(', ')}`);
    }

    // Check domain uniqueness if provided
    if (data.customDomain) {
      const domainExists = await this.checkDomainUniqueness(data.customDomain);
      if (!domainExists) {
        throw new Error('Organization with this domain already exists');
      }
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    // Insert organization
    await this.db.execute({
      sql: `
        INSERT INTO organizations (
          id, name, event_name, custom_domain,
          contact_email, contact_phone, contact_address,
          contact_city, contact_state, contact_zip,
          email_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        data.name,
        data.eventName || null,
        data.customDomain || null,
        data.contactEmail,
        data.contactPhone || null,
        data.contactAddress || null,
        data.contactCity || null,
        data.contactState || null,
        data.contactZip || null,
        0, // email_verified = false
        now,
        now,
      ]
    });

    // Return created organization
    const result = await this.db.execute({
      sql: 'SELECT * FROM organizations WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      throw new Error('Failed to create organization');
    }

    return this.mapRowToOrganization(result.rows[0] as any);
  }

  async getOrganization(id: string): Promise<Organization | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM organizations WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToOrganization(result.rows[0] as any);
  }

  async getOrganizationByEmail(email: string): Promise<Organization | null> {
    const result = await this.db.execute({
      // Multi-org per email: return the most recently created organization for this email.
      sql: 'SELECT * FROM organizations WHERE contact_email = ? ORDER BY created_at DESC LIMIT 1',
      args: [email]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToOrganization(result.rows[0] as any);
  }

  async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM organizations WHERE custom_domain = ?',
      args: [domain]
    });

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToOrganization(result.rows[0] as any);
  }

  async updateOrganization(id: string, updates: OrganizationUpdate): Promise<Organization> {
    // Check if organization exists
    const existing = await this.getOrganization(id);
    if (!existing) {
      throw new Error('Organization not found');
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.eventName !== undefined) {
      updateFields.push('event_name = ?');
      updateValues.push(updates.eventName);
    }
    if (updates.customDomain !== undefined) {
      // Check domain uniqueness if changing
      if (updates.customDomain !== existing.customDomain) {
        const domainExists = await this.checkDomainUniqueness(updates.customDomain, id);
        if (!domainExists) {
          throw new Error('Organization with this domain already exists');
        }
      }
      updateFields.push('custom_domain = ?');
      updateValues.push(updates.customDomain);
    }
    if (updates.contactPhone !== undefined) {
      updateFields.push('contact_phone = ?');
      updateValues.push(updates.contactPhone);
    }
    if (updates.contactAddress !== undefined) {
      updateFields.push('contact_address = ?');
      updateValues.push(updates.contactAddress);
    }
    if (updates.contactCity !== undefined) {
      updateFields.push('contact_city = ?');
      updateValues.push(updates.contactCity);
    }
    if (updates.contactState !== undefined) {
      updateFields.push('contact_state = ?');
      updateValues.push(updates.contactState);
    }
    if (updates.contactZip !== undefined) {
      updateFields.push('contact_zip = ?');
      updateValues.push(updates.contactZip);
    }

    if (updateFields.length === 0) {
      return existing; // No updates
    }

    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    updateValues.push(id);

    await this.db.execute({
      sql: `UPDATE organizations SET ${updateFields.join(', ')} WHERE id = ?`,
      args: updateValues
    });

    // Return updated organization
    const updated = await this.getOrganization(id);
    if (!updated) {
      throw new Error('Failed to update organization');
    }
    return updated;
  }

  async verifyEmail(organizationId: string): Promise<EmailVerificationResult> {
    const organization = await this.getOrganization(organizationId);
    
    if (!organization) {
      return {
        success: false,
        message: 'Organization not found'
      };
    }

    if (organization.emailVerified) {
      return {
        success: true,
        message: 'Email already verified',
        organization
      };
    }

    // Update email_verified flag
    await this.db.execute({
      sql: 'UPDATE organizations SET email_verified = ?, updated_at = ? WHERE id = ?',
      args: [1, new Date().toISOString(), organizationId]
    });

    // Get updated organization
    const updated = await this.getOrganization(organizationId);
    if (!updated) {
      return {
        success: false,
        message: 'Failed to verify email'
      };
    }

    return {
      success: true,
      message: 'Email verified successfully',
      organization: updated
    };
  }

  async validateOrganizationData(data: OrganizationCreate): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.contactEmail || data.contactEmail.trim().length === 0) {
      errors.push('Contact email is required');
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.contactEmail)) {
        errors.push('Invalid email format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async checkEmailUniqueness(email: string, excludeId?: string): Promise<boolean> {
    // Multi-org per email: organization contact_email is no longer unique.
    // Keep for backward compatibility with existing callers.
    void email;
    void excludeId;
    return true;
  }

  async checkDomainUniqueness(domain: string, excludeId?: string): Promise<boolean> {
    let sql = 'SELECT id FROM organizations WHERE custom_domain = ?';
    const args: any[] = [domain];

    if (excludeId) {
      sql += ' AND id != ?';
      args.push(excludeId);
    }

    const result = await this.db.execute({ sql, args });
    return result.rows.length === 0;
  }

  private mapRowToOrganization(row: any): Organization {
    return {
      id: row.id,
      name: row.name,
      eventName: row.event_name || undefined,
      customDomain: row.custom_domain || undefined,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone || undefined,
      contactAddress: row.contact_address || undefined,
      contactCity: row.contact_city || undefined,
      contactState: row.contact_state || undefined,
      contactZip: row.contact_zip || undefined,
      emailVerified: Boolean(row.email_verified),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
