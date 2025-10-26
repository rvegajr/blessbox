/**
 * Organization Service Tests
 * 
 * Test-Driven Development (TDD) for Organization Service
 * Tests the interface contract before implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IOrganizationService, OrganizationCreateData, OrganizationUpdateData } from '@/interfaces/IOrganizationService'

// Mock implementation for testing
class MockOrganizationService implements IOrganizationService {
  private organizations: Map<string, any> = new Map()
  private userOrganizations: Map<string, string[]> = new Map()

  async createOrganization(data: OrganizationCreateData) {
    const id = `org_${Date.now()}`
    const organization = {
      id,
      ...data,
      billingStatus: 'trial' as const,
      monthlyPrice: 9.99,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.organizations.set(id, organization)
    return { success: true, data: organization }
  }

  async updateOrganization(id: string, data: OrganizationUpdateData) {
    const org = this.organizations.get(id)
    if (!org) {
      return { success: false, error: 'Organization not found' }
    }
    
    const updated = { ...org, ...data, updatedAt: new Date().toISOString() }
    this.organizations.set(id, updated)
    return { success: true, data: updated }
  }

  async getOrganization(id: string) {
    const org = this.organizations.get(id)
    if (!org) {
      return { success: false, error: 'Organization not found' }
    }
    return { success: true, data: org }
  }

  async getOrganizationBySlug(slug: string) {
    for (const org of this.organizations.values()) {
      if (org.slug === slug) {
        return { success: true, data: org }
      }
    }
    return { success: false, error: 'Organization not found' }
  }

  async getOrganizationByEmail(email: string) {
    for (const org of this.organizations.values()) {
      if (org.contactEmail === email) {
        return { success: true, data: org }
      }
    }
    return { success: false, error: 'Organization not found' }
  }

  async validateOrganizationAccess(userId: string, orgId: string) {
    const userOrgs = this.userOrganizations.get(userId) || []
    return userOrgs.includes(orgId)
  }

  async getUserOrganizations(userId: string) {
    const userOrgIds = this.userOrganizations.get(userId) || []
    const orgs = userOrgIds.map(id => this.organizations.get(id)).filter(Boolean)
    return { success: true, data: orgs }
  }

  async completeOnboarding(orgId: string, onboardingData: any) {
    const org = this.organizations.get(orgId)
    if (!org) {
      return { success: false, error: 'Organization not found' }
    }
    return { success: true }
  }

  async getOnboardingStatus(orgId: string) {
    return {
      success: true,
      data: {
        organizationSetup: true,
        emailVerified: false,
        formConfigured: false,
        qrCodesGenerated: false,
        completed: false,
        currentStep: 'organization-setup' as const
      }
    }
  }

  async updateOnboardingStep(orgId: string, step: string, completed: boolean) {
    return { success: true }
  }

  async generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async validateSlug(slug: string, excludeOrgId?: string) {
    for (const [id, org] of this.organizations.entries()) {
      if (excludeOrgId && id === excludeOrgId) continue
      if (org.slug === slug) return false
    }
    return true
  }

  async getOrganizationCount() {
    return this.organizations.size
  }

  async getActiveOrganizations() {
    const activeOrgs = Array.from(this.organizations.values()).filter(
      org => org.billingStatus === 'active' || org.billingStatus === 'trial'
    )
    return { success: true, data: activeOrgs }
  }
}

describe('OrganizationService', () => {
  let service: IOrganizationService

  beforeEach(() => {
    service = new MockOrganizationService()
  })

  describe('createOrganization', () => {
    it('should create a new organization with valid data', async () => {
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com',
        contactPhone: '+1234567890'
      }

      const result = await service.createOrganization(orgData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('Test Organization')
      expect(result.data?.contactEmail).toBe('test@example.com')
      expect(result.data?.billingStatus).toBe('trial')
    })

    it('should generate unique ID for organization', async () => {
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com'
      }

      const result = await service.createOrganization(orgData)

      expect(result.success).toBe(true)
      expect(result.data?.id).toBeDefined()
      expect(result.data?.id).toMatch(/^org_\d+$/)
    })
  })

  describe('updateOrganization', () => {
    it('should update organization with valid data', async () => {
      // First create an organization
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com'
      }
      const createResult = await service.createOrganization(orgData)
      expect(createResult.success).toBe(true)

      // Then update it
      const updateData: OrganizationUpdateData = {
        name: 'Updated Organization',
        contactPhone: '+1234567890'
      }
      const updateResult = await service.updateOrganization(createResult.data!.id, updateData)

      expect(updateResult.success).toBe(true)
      expect(updateResult.data?.name).toBe('Updated Organization')
      expect(updateResult.data?.contactPhone).toBe('+1234567890')
    })

    it('should return error for non-existent organization', async () => {
      const updateData: OrganizationUpdateData = {
        name: 'Updated Organization'
      }
      const result = await service.updateOrganization('non-existent', updateData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Organization not found')
    })
  })

  describe('getOrganization', () => {
    it('should retrieve organization by ID', async () => {
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com'
      }
      const createResult = await service.createOrganization(orgData)
      expect(createResult.success).toBe(true)

      const getResult = await service.getOrganization(createResult.data!.id)

      expect(getResult.success).toBe(true)
      expect(getResult.data?.name).toBe('Test Organization')
    })

    it('should return error for non-existent organization', async () => {
      const result = await service.getOrganization('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Organization not found')
    })
  })

  describe('slug management', () => {
    it('should generate valid slug from organization name', async () => {
      const slug = await service.generateSlug('Test Organization Name')
      expect(slug).toBe('test-organization-name')
    })

    it('should handle special characters in slug generation', async () => {
      const slug = await service.generateSlug('Test & Organization!')
      expect(slug).toBe('test-organization')
    })

    it('should validate unique slugs', async () => {
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com',
        slug: 'test-org'
      }
      await service.createOrganization(orgData)

      const isValid = await service.validateSlug('test-org')
      expect(isValid).toBe(false)

      const isValidNew = await service.validateSlug('new-org')
      expect(isValidNew).toBe(true)
    })
  })

  describe('onboarding', () => {
    it('should get onboarding status', async () => {
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com'
      }
      const createResult = await service.createOrganization(orgData)
      expect(createResult.success).toBe(true)

      const statusResult = await service.getOnboardingStatus(createResult.data!.id)

      expect(statusResult.success).toBe(true)
      expect(statusResult.data?.organizationSetup).toBe(true)
      expect(statusResult.data?.completed).toBe(false)
    })

    it('should update onboarding step', async () => {
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com'
      }
      const createResult = await service.createOrganization(orgData)
      expect(createResult.success).toBe(true)

      const updateResult = await service.updateOnboardingStep(
        createResult.data!.id, 
        'email-verification', 
        true
      )

      expect(updateResult.success).toBe(true)
    })
  })

  describe('statistics', () => {
    it('should return organization count', async () => {
      const count = await service.getOrganizationCount()
      expect(count).toBe(0)

      // Create an organization
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com'
      }
      await service.createOrganization(orgData)

      const newCount = await service.getOrganizationCount()
      expect(newCount).toBe(1)
    })

    it('should return active organizations', async () => {
      const orgData: OrganizationCreateData = {
        name: 'Test Organization',
        contactEmail: 'test@example.com'
      }
      await service.createOrganization(orgData)

      const activeResult = await service.getActiveOrganizations()
      expect(activeResult.success).toBe(true)
      expect(activeResult.data?.length).toBe(1)
    })
  })
})

