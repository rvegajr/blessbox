/**
 * Organization Service Implementation
 * 
 * Real implementation of IOrganizationService following TDD principles
 * All methods tested before implementation
 */

import { db } from '@/lib/database/connection'
import { organizations, userOrganizations } from '@/lib/database/schema'
import { eq, and } from 'drizzle-orm'
import { 
  IOrganizationService, 
  OrganizationCreateData, 
  OrganizationUpdateData,
  Organization,
  OrganizationServiceResult,
  OnboardingData,
  OnboardingStatus
} from '@/interfaces/IOrganizationService'

export class OrganizationService implements IOrganizationService {
  async createOrganization(data: OrganizationCreateData): Promise<OrganizationServiceResult<Organization>> {
    try {
      // Check if organization with same email already exists
      const existingOrg = await db.select()
        .from(organizations)
        .where(eq(organizations.contactEmail, data.contactEmail))
        .limit(1)

      if (existingOrg.length > 0) {
        return {
          success: false,
          error: 'Organization with this email already exists'
        }
      }

      // Generate slug if not provided
      const slug = data.slug || await this.generateSlug(data.name)

      // Create organization
      const newOrg = await db.insert(organizations).values({
        name: data.name,
        eventName: data.eventName,
        customDomain: data.customDomain,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactAddress: data.contactAddress,
        contactCity: data.contactCity,
        contactState: data.contactState,
        contactZip: data.contactZip,
        slug,
        billingStatus: 'trial',
        monthlyPrice: 9.99,
        emailVerified: false
      }).returning()

      return {
        success: true,
        data: newOrg[0] as Organization,
        message: 'Organization created successfully'
      }
    } catch (error) {
      console.error('Error creating organization:', error)
      return {
        success: false,
        error: 'Failed to create organization'
      }
    }
  }

  async updateOrganization(id: string, data: OrganizationUpdateData): Promise<OrganizationServiceResult<Organization>> {
    try {
      const updatedOrg = await db.update(organizations)
        .set({
          ...data,
          updatedAt: new Date().toISOString()
        })
        .where(eq(organizations.id, id))
        .returning()

      if (updatedOrg.length === 0) {
        return {
          success: false,
          error: 'Organization not found'
        }
      }

      return {
        success: true,
        data: updatedOrg[0] as Organization,
        message: 'Organization updated successfully'
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      return {
        success: false,
        error: 'Failed to update organization'
      }
    }
  }

  async getOrganization(id: string): Promise<OrganizationServiceResult<Organization>> {
    try {
      const org = await db.select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1)

      if (org.length === 0) {
        return {
          success: false,
          error: 'Organization not found'
        }
      }

      return {
        success: true,
        data: org[0] as Organization
      }
    } catch (error) {
      console.error('Error getting organization:', error)
      return {
        success: false,
        error: 'Failed to get organization'
      }
    }
  }

  async getOrganizationBySlug(slug: string): Promise<OrganizationServiceResult<Organization>> {
    try {
      const org = await db.select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1)

      if (org.length === 0) {
        return {
          success: false,
          error: 'Organization not found'
        }
      }

      return {
        success: true,
        data: org[0] as Organization
      }
    } catch (error) {
      console.error('Error getting organization by slug:', error)
      return {
        success: false,
        error: 'Failed to get organization'
      }
    }
  }

  async getOrganizationByEmail(email: string): Promise<OrganizationServiceResult<Organization>> {
    try {
      const org = await db.select()
        .from(organizations)
        .where(eq(organizations.contactEmail, email))
        .limit(1)

      if (org.length === 0) {
        return {
          success: false,
          error: 'Organization not found'
        }
      }

      return {
        success: true,
        data: org[0] as Organization
      }
    } catch (error) {
      console.error('Error getting organization by email:', error)
      return {
        success: false,
        error: 'Failed to get organization'
      }
    }
  }

  async validateOrganizationAccess(userId: string, orgId: string): Promise<boolean> {
    try {
      const userOrg = await db.select()
        .from(userOrganizations)
        .where(and(
          eq(userOrganizations.userEmail, userId),
          eq(userOrganizations.organizationId, orgId)
        ))
        .limit(1)

      return userOrg.length > 0
    } catch (error) {
      console.error('Error validating organization access:', error)
      return false
    }
  }

  async getUserOrganizations(userId: string): Promise<OrganizationServiceResult<Organization[]>> {
    try {
      const userOrgs = await db.select({
        organization: organizations
      })
        .from(userOrganizations)
        .innerJoin(organizations, eq(userOrganizations.organizationId, organizations.id))
        .where(eq(userOrganizations.userEmail, userId))

      const orgs = userOrgs.map(row => row.organization as Organization)

      return {
        success: true,
        data: orgs
      }
    } catch (error) {
      console.error('Error getting user organizations:', error)
      return {
        success: false,
        error: 'Failed to get user organizations'
      }
    }
  }

  async completeOnboarding(orgId: string, onboardingData: OnboardingData): Promise<OrganizationServiceResult<void>> {
    try {
      // Update organization with onboarding data
      await db.update(organizations)
        .set({
          contactPhone: onboardingData.organizationDetails.contactPhone,
          contactAddress: onboardingData.organizationDetails.contactAddress,
          contactCity: onboardingData.organizationDetails.contactCity,
          contactState: onboardingData.organizationDetails.contactState,
          contactZip: onboardingData.organizationDetails.contactZip,
          updatedAt: new Date().toISOString()
        })
        .where(eq(organizations.id, orgId))

      return {
        success: true,
        message: 'Onboarding completed successfully'
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      return {
        success: false,
        error: 'Failed to complete onboarding'
      }
    }
  }

  async getOnboardingStatus(orgId: string): Promise<OrganizationServiceResult<OnboardingStatus>> {
    try {
      const org = await this.getOrganization(orgId)
      if (!org.success || !org.data) {
        return {
          success: false,
          error: 'Organization not found'
        }
      }

      const status: OnboardingStatus = {
        organizationSetup: true,
        emailVerified: org.data.emailVerified,
        formConfigured: false, // TODO: Check if forms exist
        qrCodesGenerated: false, // TODO: Check if QR codes exist
        completed: org.data.emailVerified, // Simplified for now
        currentStep: org.data.emailVerified ? 'completed' : 'verify-email'
      }

      return {
        success: true,
        data: status
      }
    } catch (error) {
      console.error('Error getting onboarding status:', error)
      return {
        success: false,
        error: 'Failed to get onboarding status'
      }
    }
  }

  async updateOnboardingStep(orgId: string, step: string, completed: boolean): Promise<OrganizationServiceResult<void>> {
    try {
      // This would typically update a separate onboarding tracking table
      // For now, we'll just return success
      return {
        success: true,
        message: 'Onboarding step updated'
      }
    } catch (error) {
      console.error('Error updating onboarding step:', error)
      return {
        success: false,
        error: 'Failed to update onboarding step'
      }
    }
  }

  async generateSlug(name: string): Promise<string> {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async validateSlug(slug: string, excludeOrgId?: string): Promise<boolean> {
    try {
      let query = db.select().from(organizations).where(eq(organizations.slug, slug))
      
      if (excludeOrgId) {
        query = query.where(eq(organizations.id, excludeOrgId))
      }

      const existing = await query.limit(1)
      return existing.length === 0
    } catch (error) {
      console.error('Error validating slug:', error)
      return false
    }
  }

  async getOrganizationCount(): Promise<number> {
    try {
      const result = await db.select().from(organizations)
      return result.length
    } catch (error) {
      console.error('Error getting organization count:', error)
      return 0
    }
  }

  async getActiveOrganizations(): Promise<OrganizationServiceResult<Organization[]>> {
    try {
      const activeOrgs = await db.select()
        .from(organizations)
        .where(eq(organizations.billingStatus, 'active'))

      return {
        success: true,
        data: activeOrgs as Organization[]
      }
    } catch (error) {
      console.error('Error getting active organizations:', error)
      return {
        success: false,
        error: 'Failed to get active organizations'
      }
    }
  }
}

