import { getDbClient } from '../db';
import { v4 as uuidv4 } from 'uuid';
import type { 
  IRegistrationService, 
  RegistrationFormConfig, 
  Registration, 
  RegistrationFormData,
  RegistrationMetadata,
  RegistrationFilters,
  RegistrationUpdate
} from '../interfaces/IRegistrationService';
import { EmailService } from './EmailService';
import { NotificationService } from './NotificationService';
import { getUsageLimitChecker } from './UsageLimitChecker';

// Custom error for limit exceeded
export class RegistrationLimitError extends Error {
  public readonly code = 'LIMIT_EXCEEDED';
  public readonly upgradeUrl: string;
  public readonly currentCount: number;
  public readonly limit: number;

  constructor(message: string, currentCount: number, limit: number, upgradeUrl: string) {
    super(message);
    this.name = 'RegistrationLimitError';
    this.currentCount = currentCount;
    this.limit = limit;
    this.upgradeUrl = upgradeUrl;
  }
}

export class RegistrationService implements IRegistrationService {
  private db = getDbClient();
  private emailService = new EmailService();
  private notificationService = new NotificationService();

  private slugify(input: string): string {
    return String(input || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private findMatchingQrCode(qrCodes: any[], qrLabelOrSlug: string): any | null {
    const needle = (qrLabelOrSlug || '').trim();
    if (!needle) return null;

    // Prefer matching the stable URL segment (slug) if present.
    const bySlug = qrCodes.find((qr: any) => typeof qr?.slug === 'string' && qr.slug === needle);
    if (bySlug) return bySlug;

    // Backward compatibility: many rows store the URL segment in `label`.
    const byLabelExact = qrCodes.find((qr: any) => typeof qr?.label === 'string' && qr.label === needle);
    if (byLabelExact) return byLabelExact;

    // Last resort: case-insensitive label compare.
    const lower = needle.toLowerCase();
    const byLabelCi = qrCodes.find((qr: any) => typeof qr?.label === 'string' && qr.label.toLowerCase() === lower);
    return byLabelCi || null;
  }

  async getFormConfig(orgSlug: string, qrLabel: string): Promise<RegistrationFormConfig | null> {
    try {
      // First, find the organization by slug (custom_domain or name-based slug)
      const orgResult = await this.db.execute({
        sql: `
          SELECT id, name, custom_domain 
          FROM organizations 
          WHERE custom_domain = ? OR LOWER(REPLACE(name, ' ', '-')) = ?
        `,
        args: [orgSlug, orgSlug]
      });

      let org: any | null = (orgResult.rows.length > 0 ? (orgResult.rows[0] as any) : null);

      // Fallback: some parts of the app generate slugs using a stricter slugify
      // (removing punctuation etc). If the SQL slug match misses, do a small in-app
      // lookup to keep older QR codes working.
      if (!org) {
        let rows: any[] = [];
        try {
          const all = await this.db.execute({
            sql: `SELECT id, name, custom_domain FROM organizations`,
            args: [],
          });
          rows = Array.isArray((all as any)?.rows) ? ((all as any).rows as any[]) : [];
        } catch {
          rows = [];
        }

        const match = rows.find((row: any) => {
          const cd = typeof row?.custom_domain === 'string' ? row.custom_domain : '';
          if (cd && cd === orgSlug) return true;
          const name = typeof row?.name === 'string' ? row.name : '';
          return !!name && this.slugify(name) === orgSlug;
        });
        org = match || null;
      }

      if (!org) return null;

      // Find QR code set for this organization
      const qrSetResult = await this.db.execute({
        sql: `
          SELECT id, organization_id, name, language, form_fields, qr_codes, is_active
          FROM qr_code_sets 
          WHERE organization_id = ? AND is_active = 1
        `,
        args: [org.id]
      });

      if (qrSetResult.rows.length === 0) {
        return null;
      }

      const qrSet = qrSetResult.rows[0] as any;
      let qrCodes: any[] = [];
      try {
        qrCodes = JSON.parse((qrSet.qr_codes as string) || '[]') || [];
      } catch {
        qrCodes = [];
      }
      
      // Find the specific QR code by label
      const matchingQR = this.findMatchingQrCode(qrCodes, qrLabel);
      
      if (!matchingQR) {
        return null;
      }

      return {
        id: qrSet.id,
        organizationId: qrSet.organization_id,
        name: qrSet.name,
        language: qrSet.language,
        formFields: JSON.parse(qrSet.form_fields),
        qrCodes: qrCodes
      };
    } catch (error) {
      console.error('Error getting form config:', error);
      return null;
    }
  }

  async submitRegistration(
    orgSlug: string,
    qrLabel: string,
    formData: RegistrationFormData,
    metadata?: RegistrationMetadata
  ): Promise<Registration> {
    // Get form configuration first
    const formConfig = await this.getFormConfig(orgSlug, qrLabel);
    
    if (!formConfig) {
      throw new Error('Form configuration not found');
    }

    // Check registration limits BEFORE proceeding
    const usageLimitChecker = getUsageLimitChecker();
    const limitCheck = await usageLimitChecker.canRegister(formConfig.organizationId);
    
    if (!limitCheck.allowed) {
      throw new RegistrationLimitError(
        limitCheck.message || 'Registration limit reached',
        limitCheck.currentCount,
        limitCheck.limit,
        limitCheck.upgradeUrl || '/pricing'
      );
    }

    // Validate required fields
    this.validateFormData(formData, formConfig.formFields);

    // Find the matching QR code
    const matchingQR = this.findMatchingQrCode(formConfig.qrCodes as any[], qrLabel);
    if (!matchingQR) {
      throw new Error('QR code not found');
    }

    const registrationId = uuidv4();
    const now = new Date().toISOString();

    // Insert registration into database
    await this.db.execute({
      sql: `
        INSERT INTO registrations (
          id, qr_code_set_id, qr_code_id, organization_id, registration_data, 
          ip_address, user_agent, referrer, delivery_status, registered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        registrationId,
        formConfig.id,
        matchingQR.id,
        formConfig.organizationId,
        JSON.stringify(formData),
        metadata?.ipAddress || null,
        metadata?.userAgent || null,
        metadata?.referrer || null,
        'pending',
        now
      ]
    });

    // Increment registration counter in subscription
    await this.incrementRegistrationCount(formConfig.organizationId);

    const registration: Registration = {
      id: registrationId,
      qrCodeSetId: formConfig.id,
      qrCodeId: matchingQR.id,
      registrationData: JSON.stringify(formData),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
      deliveryStatus: 'pending',
      registeredAt: now
    };

    // Send email notifications (non-blocking)
    this.sendRegistrationEmails(registration, formConfig, formData, matchingQR).catch(err => {
      console.error('Error sending registration emails:', err);
      // Don't throw - email failure shouldn't block registration
    });

    return registration;
  }

  private async sendRegistrationEmails(
    registration: Registration,
    formConfig: RegistrationFormConfig,
    formData: RegistrationFormData,
    matchingQR: { id: string; label: string; url: string }
  ): Promise<void> {
    try {
      // Get organization details
      const orgResult = await this.db.execute({
        sql: 'SELECT name, contact_email FROM organizations WHERE id = ?',
        args: [formConfig.organizationId]
      });

      // In some test mocks, execute() may return undefined or a shape without rows.
      // Treat that as "org not found" and skip notifications quietly.
      const rows = (orgResult as any)?.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        return; // Organization not found, skip emails
      }

      const org = rows[0] as any;
      const orgName = org.name || 'BlessBox';
      const orgEmail = org.contact_email;

      // Extract registrant email and name from formData
      const registrantEmail = formData.email || formData.Email || formData.emailAddress;
      const registrantName = formData.name || formData.Name || formData.fullName || 'Valued Customer';

      // Send confirmation email to registrant (if email provided)
      if (registrantEmail && typeof registrantEmail === 'string') {
        try {
          await this.notificationService.sendRegistrationConfirmation({
            recipientEmail: registrantEmail,
            recipientName: String(registrantName),
            organizationName: orgName,
            registrationId: registration.id,
            registrationData: formData,
            qrCodeLabel: matchingQR.label,
          });
        } catch (err) {
          console.error('Error sending confirmation email:', err);
        }
      }

      // Send admin notification to organization
      if (orgEmail) {
        try {
          await this.notificationService.notifyAdmin({
            organizationId: formConfig.organizationId,
            adminEmail: orgEmail,
            eventType: 'new_registration',
            eventData: {
              registrant_name: String(registrantName),
              registrant_email: String(registrantEmail || 'Not provided'),
              registration_id: registration.id,
              registration_date: new Date(registration.registeredAt).toLocaleDateString(),
              qr_code_label: matchingQR.label,
            },
            organizationName: orgName,
          });
        } catch (err) {
          console.error('Error sending admin notification:', err);
        }
      }
    } catch (error) {
      console.error('Error in sendRegistrationEmails:', error);
      // Don't throw - email failures shouldn't break registration
    }
  }

  async listRegistrations(
    organizationId: string,
    filters?: RegistrationFilters
  ): Promise<Registration[]> {
    let sql = `
      SELECT r.*, qcs.organization_id
      FROM registrations r
      JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
      WHERE qcs.organization_id = ?
    `;
    const args: any[] = [organizationId];

    // Apply filters
    if (filters) {
      if (filters.qrCodeSetId) {
        sql += ' AND r.qr_code_set_id = ?';
        args.push(filters.qrCodeSetId);
      }
      if (filters.qrCodeId) {
        sql += ' AND r.qr_code_id = ?';
        args.push(filters.qrCodeId);
      }
      if (filters.deliveryStatus) {
        sql += ' AND r.delivery_status = ?';
        args.push(filters.deliveryStatus);
      }
      if (filters.startDate) {
        sql += ' AND r.registered_at >= ?';
        args.push(filters.startDate);
      }
      if (filters.endDate) {
        sql += ' AND r.registered_at <= ?';
        args.push(filters.endDate);
      }
    }

    sql += ' ORDER BY r.registered_at DESC';

    const result = await this.db.execute({ sql, args });

    return result.rows.map((row: any) => ({
      id: row.id,
      qrCodeSetId: row.qr_code_set_id,
      qrCodeId: row.qr_code_id,
      registrationData: row.registration_data,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      referrer: row.referrer,
      deliveryStatus: row.delivery_status,
      deliveredAt: row.delivered_at,
      registeredAt: row.registered_at,
      checkInToken: row.check_in_token,
      checkedInAt: row.checked_in_at,
      checkedInBy: row.checked_in_by,
      tokenStatus: row.token_status
    }));
  }

  async getRegistration(id: string): Promise<Registration | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM registrations WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as any;
    return {
      id: row.id,
      qrCodeSetId: row.qr_code_set_id,
      qrCodeId: row.qr_code_id,
      registrationData: row.registration_data,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      referrer: row.referrer,
      deliveryStatus: row.delivery_status,
      deliveredAt: row.delivered_at,
      registeredAt: row.registered_at,
      checkInToken: row.check_in_token,
      checkedInAt: row.checked_in_at,
      checkedInBy: row.checked_in_by,
      tokenStatus: row.token_status
    };
  }

  async updateRegistration(
    id: string,
    updates: RegistrationUpdate
  ): Promise<Registration> {
    // First, get the current registration
    const currentRegistration = await this.getRegistration(id);
    if (!currentRegistration) {
      throw new Error('Registration not found');
    }

    // Build update query
    const updateFields: string[] = [];
    const args: any[] = [];

    if (updates.deliveryStatus) {
      updateFields.push('delivery_status = ?');
      args.push(updates.deliveryStatus);
    }

    if (updates.deliveredAt) {
      updateFields.push('delivered_at = ?');
      args.push(updates.deliveredAt);
    } else if (updates.deliveryStatus === 'delivered' && !updates.deliveredAt) {
      // Auto-set delivered_at when status changes to delivered
      updateFields.push('delivered_at = ?');
      args.push(new Date().toISOString());
    }

    if (updateFields.length === 0) {
      return currentRegistration;
    }

    args.push(id);

    await this.db.execute({
      sql: `UPDATE registrations SET ${updateFields.join(', ')} WHERE id = ?`,
      args
    });

    // Return updated registration
    return this.getRegistration(id) as Promise<Registration>;
  }

  async deleteRegistration(id: string): Promise<void> {
    const result = await this.db.execute({
      sql: 'DELETE FROM registrations WHERE id = ?',
      args: [id]
    });

    if (result.rowsAffected === 0) {
      throw new Error('Registration not found');
    }
  }

  async checkInRegistration(
    id: string,
    checkedInBy?: string
  ): Promise<Registration> {
    // Get current registration
    const registration = await this.getRegistration(id);
    if (!registration) {
      throw new Error('Registration not found');
    }

    // Check if already checked in
    const currentReg = await this.db.execute({
      sql: 'SELECT checked_in_at, token_status FROM registrations WHERE id = ?',
      args: [id]
    });

    const row = currentReg.rows[0] as any;
    if (row?.checked_in_at) {
      throw new Error('Registration already checked in');
    }

    // Update check-in fields
    const now = new Date().toISOString();
    await this.db.execute({
      sql: `
        UPDATE registrations 
        SET checked_in_at = ?, 
            checked_in_by = ?,
            token_status = 'used'
        WHERE id = ?
      `,
      args: [now, checkedInBy || null, id]
    });

    // Return updated registration
    return this.getRegistration(id) as Promise<Registration>;
  }

  async undoCheckInRegistration(id: string): Promise<Registration> {
    const registration = await this.getRegistration(id);
    if (!registration) {
      throw new Error('Registration not found');
    }

    const currentReg = await this.db.execute({
      sql: 'SELECT checked_in_at FROM registrations WHERE id = ?',
      args: [id],
    });
    const row = currentReg.rows[0] as any;
    if (!row?.checked_in_at) {
      throw new Error('Registration is not checked in');
    }

    await this.db.execute({
      sql: `
        UPDATE registrations
        SET checked_in_at = NULL,
            checked_in_by = NULL,
            token_status = 'active'
        WHERE id = ?
      `,
      args: [id],
    });

    return this.getRegistration(id) as Promise<Registration>;
  }

  async getRegistrationStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    delivered: number;
    cancelled: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      totalResult,
      pendingResult,
      deliveredResult,
      cancelledResult,
      todayResult,
      weekResult,
      monthResult
    ] = await Promise.all([
      this.db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM registrations r
          JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
          WHERE qcs.organization_id = ?
        `,
        args: [organizationId]
      }),
      this.db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM registrations r
          JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
          WHERE qcs.organization_id = ? AND r.delivery_status = 'pending'
        `,
        args: [organizationId]
      }),
      this.db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM registrations r
          JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
          WHERE qcs.organization_id = ? AND r.delivery_status = 'delivered'
        `,
        args: [organizationId]
      }),
      this.db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM registrations r
          JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
          WHERE qcs.organization_id = ? AND r.delivery_status = 'cancelled'
        `,
        args: [organizationId]
      }),
      this.db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM registrations r
          JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
          WHERE qcs.organization_id = ? AND DATE(r.registered_at) = ?
        `,
        args: [organizationId, today]
      }),
      this.db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM registrations r
          JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
          WHERE qcs.organization_id = ? AND DATE(r.registered_at) >= ?
        `,
        args: [organizationId, weekStart]
      }),
      this.db.execute({
        sql: `
          SELECT COUNT(*) as count
          FROM registrations r
          JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
          WHERE qcs.organization_id = ? AND DATE(r.registered_at) >= ?
        `,
        args: [organizationId, monthStart]
      })
    ]);

    return {
      total: (totalResult.rows[0] as any).count,
      pending: (pendingResult.rows[0] as any).count,
      delivered: (deliveredResult.rows[0] as any).count,
      cancelled: (cancelledResult.rows[0] as any).count,
      today: (todayResult.rows[0] as any).count,
      thisWeek: (weekResult.rows[0] as any).count,
      thisMonth: (monthResult.rows[0] as any).count
    };
  }

  private validateFormData(formData: RegistrationFormData, formFields: any[]): void {
    for (const field of formFields) {
      if (field.required && (formData[field.id] === undefined || formData[field.id] === '')) {
        throw new Error(`Missing required field: ${field.id}`);
      }
    }
  }

  /**
   * Increment the registration count for an organization's active subscription.
   * This keeps the subscription_plans.current_registration_count in sync.
   */
  private async incrementRegistrationCount(organizationId: string): Promise<void> {
    try {
      await this.db.execute({
        sql: `
          UPDATE subscription_plans 
          SET current_registration_count = COALESCE(current_registration_count, 0) + 1,
              updated_at = ?
          WHERE organization_id = ? AND status = 'active'
        `,
        args: [new Date().toISOString(), organizationId]
      });
    } catch (error) {
      // Log but don't fail the registration if counter update fails
      console.error('Failed to increment registration count:', error);
    }
  }
}
