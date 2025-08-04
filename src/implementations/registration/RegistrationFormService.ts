// 🎊 REGISTRATION FORM SERVICE - THE MOST JOYFUL IMPLEMENTATION EVER! 🎊
// REAL DATABASE POWER! NO MOCKS! PURE HARDENED BACKEND BLISS! 💪✨

import type { 
  IRegistrationFormService,
  RegistrationFormData,
  RegistrationResult,
  RegistrationForm,
  RegistrationEntry,
  RegistrationFilters,
  RegistrationAnalytics,
  RegistrationStatus,
  ValidationError
} from '../../interfaces/registration/IRegistrationFormService';
import { createDatabaseConnection, getDatabase } from '../../database/connection';
import { organizations, qrCodeSets, registrations } from '../../database/schema';
import { eq, and, like, gte, lte, desc, sql, count } from 'drizzle-orm';

export class RegistrationFormService implements IRegistrationFormService {

  // 🚀 CREATE REGISTRATION - Pure database magic!
  async createRegistration(data: RegistrationFormData): Promise<RegistrationResult> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      console.log(`🎉 Creating registration with PURE JOY! QR: ${data.qrCodeId}`);

      // 🎯 Get QR code set info
      const [qrCodeSet] = await db
        .select({
          id: qrCodeSets.id,
          organizationId: qrCodeSets.organizationId,
          name: qrCodeSets.name,
          formFields: qrCodeSets.formFields,
          qrCodes: qrCodeSets.qrCodes
        })
        .from(qrCodeSets)
        .where(eq(qrCodeSets.id, data.qrCodeId))
        .limit(1);

      if (!qrCodeSet) {
        return {
          success: false,
          message: 'QR code not found. Please scan a valid QR code! 🔍'
        };
      }

      // 🔍 Validate form data against schema
      const formFields = JSON.parse(qrCodeSet.formFields as string);
      const validationErrors = this.validateFormData(data.formData, formFields);
      
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: 'Please fix the form errors and try again! 📝',
          errors: validationErrors
        };
      }

      // 🎊 Insert registration with PURE DATABASE POWER!
      const registrationId = crypto.randomUUID();
      
      await db.insert(registrations).values({
        id: registrationId,
        organizationId: qrCodeSet.organizationId,
        qrCodeSetId: data.qrCodeId,
        qrCodeLabel: qrCodeSet.name,
        entryPoint: data.entryPoint || null,
        registrationData: JSON.stringify(data.formData),
        status: 'pending',
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        registeredAt: data.submittedAt.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log(`🎊 REGISTRATION CREATED! ID: ${registrationId} with ORGASMIC SUCCESS! ✨`);

      return {
        success: true,
        registrationId,
        message: 'Registration submitted successfully! Thank you! 🎉'
      };

    } catch (error) {
      console.error('💔 Registration creation failed:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  // 🎯 GET REGISTRATION BY QR CODE - Lightning fast retrieval!
  async getRegistrationByQRCode(qrCodeId: string, entryPoint?: string): Promise<RegistrationForm | null> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      console.log(`🔍 Getting registration form for QR: ${qrCodeId} with PURE JOY!`);

      // 🌟 Get QR code set with organization info
      const [result] = await db
        .select({
          qrCodeSet: qrCodeSets,
          organization: organizations
        })
        .from(qrCodeSets)
        .innerJoin(organizations, eq(qrCodeSets.organizationId, organizations.id))
        .where(eq(qrCodeSets.id, qrCodeId))
        .limit(1);

      if (!result) {
        console.log(`❌ QR code not found: ${qrCodeId}`);
        return null;
      }

      const { qrCodeSet, organization } = result;
      const formFields = JSON.parse(qrCodeSet.formFields as string);
      const qrCodes = JSON.parse(qrCodeSet.qrCodes as string);

      // 🎯 Find specific QR code for label
      const qrCode = qrCodes.find((qr: any) => qr.id === qrCodeId || qr.label === qrCodeSet.name);

      console.log(`🎊 FOUND REGISTRATION FORM! Organization: ${organization.name} ✨`);

      return {
        id: qrCodeSet.id,
        organizationId: organization.id,
        organizationName: organization.name,
        eventName: organization.eventName || undefined,
        qrCodeLabel: qrCodeSet.name,
        entryPoint,
        formFields,
        customDomain: organization.customDomain || undefined,
        language: qrCodeSet.language,
        createdAt: new Date(qrCodeSet.createdAt)
      };

    } catch (error) {
      console.error('💔 Get registration form failed:', error);
      return null;
    }
  }

  // 🌟 GET REGISTRATION FORM BY SLUG - Beautiful URL magic!
  async getRegistrationFormBySlug(orgSlug: string, qrLabel: string): Promise<RegistrationForm | null> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      console.log(`🔍 Getting registration form by slug: ${orgSlug}/${qrLabel} with PURE JOY!`);

      // 🎯 Create URL-friendly slug from organization name
      const slugify = (text: string) => text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // 🌟 Get organization and QR code set by matching slugs
      const results = await db
        .select({
          qrCodeSet: qrCodeSets,
          organization: organizations
        })
        .from(qrCodeSets)
        .innerJoin(organizations, eq(qrCodeSets.organizationId, organizations.id));

      // 🔍 Find matching organization and QR code by slug
      const match = results.find(result => {
        const orgNameSlug = slugify(result.organization.name);
        const qrLabelSlug = slugify(result.qrCodeSet.name);
        return orgNameSlug === orgSlug && qrLabelSlug === qrLabel;
      });

      if (!match) {
        console.log(`❌ No match found for ${orgSlug}/${qrLabel}`);
        return null;
      }

      const { qrCodeSet, organization } = match;
      const formFields = JSON.parse(qrCodeSet.formFields as string);

      console.log(`🎊 FOUND REGISTRATION FORM BY SLUG! Organization: ${organization.name} ✨`);

      return {
        id: qrCodeSet.id,
        organizationId: organization.id,
        organizationName: organization.name,
        eventName: organization.eventName || undefined,
        qrCodeLabel: qrCodeSet.name,
        formFields,
        customDomain: organization.customDomain || undefined,
        language: qrCodeSet.language,
        createdAt: new Date(qrCodeSet.createdAt)
      };

    } catch (error) {
      console.error('💔 Get registration form by slug failed:', error);
      return null;
    }
  }

  // 📊 GET REGISTRATIONS BY ORGANIZATION - Dashboard power!
  async getRegistrationsByOrganization(organizationId: string, filters?: RegistrationFilters): Promise<RegistrationEntry[]> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      console.log(`📊 Getting registrations for org: ${organizationId} with PURE JOY!`);

      // 🎯 Build query with filters
      let query = db
        .select()
        .from(registrations)
        .where(eq(registrations.organizationId, organizationId));

      // 🔍 Apply filters with PRECISION!
      const conditions = [eq(registrations.organizationId, organizationId)];

      if (filters?.qrCodeLabel) {
        conditions.push(eq(registrations.qrCodeLabel, filters.qrCodeLabel));
      }

      if (filters?.entryPoint) {
        conditions.push(eq(registrations.entryPoint, filters.entryPoint));
      }

      if (filters?.status) {
        conditions.push(eq(registrations.status, filters.status));
      }

      if (filters?.dateFrom) {
        conditions.push(gte(registrations.registeredAt, filters.dateFrom.toISOString()));
      }

      if (filters?.dateTo) {
        conditions.push(lte(registrations.registeredAt, filters.dateTo.toISOString()));
      }

      if (filters?.search) {
        // 🔍 Search in registration data JSON
        conditions.push(like(registrations.registrationData, `%${filters.search}%`));
      }

      // 🎊 Execute query with all conditions
      const results = await db
        .select()
        .from(registrations)
        .where(and(...conditions))
        .orderBy(desc(registrations.registeredAt))
        .limit(filters?.limit || 100)
        .offset(filters?.offset || 0);

      console.log(`🎉 FOUND ${results.length} REGISTRATIONS! Pure database magic! ✨`);

      return results.map(reg => ({
        id: reg.id,
        organizationId: reg.organizationId,
        qrCodeId: reg.qrCodeSetId,
        qrCodeLabel: reg.qrCodeLabel,
        entryPoint: reg.entryPoint || undefined,
        registrationData: JSON.parse(reg.registrationData as string),
        status: reg.status as RegistrationStatus,
        ipAddress: reg.ipAddress || undefined,
        userAgent: reg.userAgent || undefined,
        registeredAt: new Date(reg.registeredAt),
        deliveredAt: reg.deliveredAt ? new Date(reg.deliveredAt) : undefined,
        createdAt: new Date(reg.createdAt),
        updatedAt: new Date(reg.updatedAt)
      }));

    } catch (error) {
      console.error('💔 Get registrations failed:', error);
      return [];
    }
  }

  // ✅ UPDATE REGISTRATION STATUS - Real-time updates!
  async updateRegistrationStatus(registrationId: string, status: RegistrationStatus, deliveredAt?: Date): Promise<void> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      console.log(`✅ Updating registration ${registrationId} to ${status} with JOY!`);

      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (deliveredAt) {
        updateData.deliveredAt = deliveredAt.toISOString();
      }

      await db
        .update(registrations)
        .set(updateData)
        .where(eq(registrations.id, registrationId));

      console.log(`🎊 REGISTRATION STATUS UPDATED! Pure success! ✨`);

    } catch (error) {
      console.error('💔 Update registration status failed:', error);
      throw new Error('Failed to update registration status');
    }
  }

  // 📈 GET REGISTRATION ANALYTICS - Pure insights!
  async getRegistrationAnalytics(organizationId: string): Promise<RegistrationAnalytics> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      console.log(`📈 Getting analytics for org: ${organizationId} with ANALYTICAL JOY!`);

      // 🎯 Get total registrations
      const [totalResult] = await db
        .select({ count: count() })
        .from(registrations)
        .where(eq(registrations.organizationId, organizationId));

      // 📊 Get registrations by status
      const statusResults = await db
        .select({
          status: registrations.status,
          count: count()
        })
        .from(registrations)
        .where(eq(registrations.organizationId, organizationId))
        .groupBy(registrations.status);

      // 📱 Get registrations by QR code
      const qrCodeResults = await db
        .select({
          qrCodeLabel: registrations.qrCodeLabel,
          entryPoint: registrations.entryPoint,
          count: count()
        })
        .from(registrations)
        .where(eq(registrations.organizationId, organizationId))
        .groupBy(registrations.qrCodeLabel, registrations.entryPoint);

      // 📅 Get registrations by date (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dateResults = await db
        .select({
          date: sql`DATE(${registrations.registeredAt})`.as('date'),
          count: count()
        })
        .from(registrations)
        .where(
          and(
            eq(registrations.organizationId, organizationId),
            gte(registrations.registeredAt, thirtyDaysAgo.toISOString())
          )
        )
        .groupBy(sql`DATE(${registrations.registeredAt})`);

      // 🎊 Build analytics with PURE JOY!
      const registrationsByStatus: Record<RegistrationStatus, number> = {
        pending: 0,
        delivered: 0,
        failed: 0,
        cancelled: 0
      };

      statusResults.forEach(result => {
        registrationsByStatus[result.status as RegistrationStatus] = result.count;
      });

      const registrationsByQRCode = qrCodeResults.map(result => ({
        qrCodeLabel: result.qrCodeLabel,
        entryPoint: result.entryPoint || undefined,
        count: result.count
      }));

      const registrationsByDate = dateResults.map(result => ({
        date: result.date as string,
        count: result.count
      }));

      const averageRegistrationsPerDay = dateResults.length > 0 
        ? dateResults.reduce((sum, result) => sum + result.count, 0) / dateResults.length
        : 0;

      console.log(`🎉 ANALYTICS GENERATED! Total: ${totalResult.count} registrations! ✨`);

      return {
        totalRegistrations: totalResult.count,
        registrationsByStatus,
        registrationsByQRCode,
        registrationsByDate,
        averageRegistrationsPerDay
      };

    } catch (error) {
      console.error('💔 Get analytics failed:', error);
      throw new Error('Failed to get registration analytics');
    }
  }

  // 🔍 VALIDATE FORM DATA - Pure validation magic!
  private validateFormData(formData: Record<string, any>, formFields: any[]): ValidationError[] {
    const errors: ValidationError[] = [];

    formFields.forEach(field => {
      const value = formData[field.name];

      // 🎯 Required field validation
      if (field.required && (!value || value.toString().trim() === '')) {
        errors.push({
          field: field.name,
          message: `${field.label} is required`
        });
        return;
      }

      if (!value) return; // Skip validation for empty optional fields

      // 📧 Email validation
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid email address`
          });
        }
      }

      // 📱 Phone validation
      if (field.type === 'phone') {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid phone number`
          });
        }
      }

      // 🔢 Number validation
      if (field.type === 'number') {
        if (isNaN(Number(value))) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid number`
          });
        }
      }

      // 📏 Length validation
      if (field.validation?.minLength && value.length < field.validation.minLength) {
        errors.push({
          field: field.name,
          message: field.validation.errorMessage || `${field.label} must be at least ${field.validation.minLength} characters`
        });
      }

      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        errors.push({
          field: field.name,
          message: field.validation.errorMessage || `${field.label} must be no more than ${field.validation.maxLength} characters`
        });
      }

      // 🎯 Pattern validation
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: field.name,
            message: field.validation.errorMessage || `${field.label} format is invalid`
          });
        }
      }
    });

    return errors;
  }
}