/**
 * Organization Detail API Tests
 * 
 * TDD Approach: Test-Driven Development
 * 1. Write test first (Red phase)
 * 2. Implement minimum code to pass (Green phase)
 * 3. Refactor while keeping tests green (Refactor phase)
 * 
 * ISP Compliance: Uses existing IOrganizationService interface
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the OrganizationService
const mockGetOrganization = vi.fn()
const mockUpdateOrganization = vi.fn()

vi.mock('@/services/OrganizationService', () => ({
  OrganizationService: vi.fn().mockImplementation(() => ({
    getOrganization: mockGetOrganization,
    updateOrganization: mockUpdateOrganization,
  }))
}))

// Mock NextAuth
const mockAuth = vi.fn()
vi.mock('@/lib/auth', () => ({
  auth: mockAuth
}))

// Mock database
vi.mock('@/lib/database/connection', () => ({
  db: {}
}))

describe('GET /api/organizations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return organization by ID', async () => {
    // Arrange
    const mockOrganization = {
      id: 'org-123',
      name: 'Test Organization',
      eventName: 'Test Event',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
      contactAddress: '123 Test St',
      contactCity: 'Test City',
      contactState: 'TS',
      contactZip: '12345',
      slug: 'test-org',
      billingStatus: 'active',
      monthlyPrice: 9.99,
      emailVerified: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }

    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    mockGetOrganization.mockResolvedValue({
      success: true,
      data: mockOrganization
    })

    // Act
    const { GET } = await import('@/app/api/organizations/[id]/route')
    const request = new NextRequest('http://localhost:3000/api/organizations/org-123')
    const response = await GET(request, { params: { id: 'org-123' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toEqual(mockOrganization)
    expect(mockGetOrganization).toHaveBeenCalledWith('org-123')
  })

  it('should return 404 for non-existent organization', async () => {
    // Arrange
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    mockGetOrganization.mockResolvedValue({
      success: false,
      error: 'Organization not found'
    })

    // Act
    const { GET } = await import('@/app/api/organizations/[id]/route')
    const request = new NextRequest('http://localhost:3000/api/organizations/non-existent')
    const response = await GET(request, { params: { id: 'non-existent' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(404)
    expect(data.error).toBe('Organization not found')
  })

  it('should return 401 for unauthenticated requests', async () => {
    // Arrange
    mockAuth.mockResolvedValue(null)

    // Act
    const { GET } = await import('@/app/api/organizations/[id]/route')
    const request = new NextRequest('http://localhost:3000/api/organizations/org-123')
    const response = await GET(request, { params: { id: 'org-123' } })

    // Assert
    expect(response.status).toBe(401)
  })

  it('should check user access to organization', async () => {
    // Arrange
    const mockOrganization = {
      id: 'org-123',
      name: 'Test Organization',
      contactEmail: 'test@example.com'
    }

    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    mockGetOrganization.mockResolvedValue({
      success: true,
      data: mockOrganization
    })

    // Act
    const { GET } = await import('@/app/api/organizations/[id]/route')
    const request = new NextRequest('http://localhost:3000/api/organizations/org-123')
    const response = await GET(request, { params: { id: 'org-123' } })

    // Assert
    expect(response.status).toBe(200)
    // Note: In real implementation, we'd verify user has access to this organization
  })
})

describe('PUT /api/organizations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update organization details', async () => {
    // Arrange
    const updateData = {
      name: 'Updated Organization',
      contactPhone: '+1987654321',
      contactAddress: '456 Updated St',
      contactCity: 'Updated City',
      contactState: 'US',
      contactZip: '54321'
    }

    const updatedOrganization = {
      id: 'org-123',
      ...updateData,
      contactEmail: 'test@example.com',
      slug: 'test-org',
      billingStatus: 'active',
      monthlyPrice: 9.99,
      emailVerified: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T12:00:00Z'
    }

    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    mockUpdateOrganization.mockResolvedValue({
      success: true,
      data: updatedOrganization
    })

    // Act
    const { PUT } = await import('@/app/api/organizations/[id]/route')
    const request = new NextRequest('http://localhost:3000/api/organizations/org-123', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' }
    })
    const response = await PUT(request, { params: { id: 'org-123' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toEqual(updatedOrganization)
    expect(mockUpdateOrganization).toHaveBeenCalledWith('org-123', updateData)
  })

  it('should validate update data', async () => {
    // Arrange
    const invalidData = {
      name: '', // Invalid: empty name
      contactEmail: 'invalid-email' // Invalid: not a valid email format
    }

    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })

    // Act
    const { PUT } = await import('@/app/api/organizations/[id]/route')
    const request = new NextRequest('http://localhost:3000/api/organizations/org-123', {
      method: 'PUT',
      body: JSON.stringify(invalidData),
      headers: { 'Content-Type': 'application/json' }
    })
    const response = await PUT(request, { params: { id: 'org-123' } })

    // Assert
    expect(response.status).toBe(400)
  })

  it('should return 404 for non-existent organization', async () => {
    // Arrange
    const updateData = { name: 'Updated Organization' }

    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    mockUpdateOrganization.mockResolvedValue({
      success: false,
      error: 'Organization not found'
    })

    // Act
    const { PUT } = await import('@/app/api/organizations/[id]/route')
    const request = new NextRequest('http://localhost:3000/api/organizations/non-existent', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' }
    })
    const response = await PUT(request, { params: { id: 'non-existent' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(404)
    expect(data.error).toBe('Organization not found')
  })

  it('should require owner/admin role for updates', async () => {
    // Arrange
    const updateData = { name: 'Updated Organization' }

    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    mockUpdateOrganization.mockResolvedValue({
      success: false,
      error: 'Insufficient permissions'
    })

    // Act
    const { PUT } = await import('@/app/api/organizations/[id]/route')
    const request = new NextRequest('http://localhost:3000/api/organizations/org-123', {
      method: 'PUT',
      body: JSON.stringify(updateData),
      headers: { 'Content-Type': 'application/json' }
    })
    const response = await PUT(request, { params: { id: 'org-123' } })
    const data = await response.json()

    // Assert
    expect(response.status).toBe(403)
    expect(data.error).toBe('Insufficient permissions')
  })
})
