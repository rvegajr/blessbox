/**
 * Test Database Setup
 * 
 * Provides mock database operations for testing
 * to avoid real database conflicts and locking issues
 */

import { vi } from 'vitest'

// Mock database connection with proper return values
export const mockDb = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ 
        id: 'test-id-123', 
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 'test-org-123',
        organization_id: 'test-org-123',
        formFields: '[{"id":"field_1","type":"text","label":"Full Name","required":true,"order":1}]',
        qrCodes: '[{"id":"qr_1","label":"Main Entrance","entryPoint":"main","isActive":true}]',
        fields: '[{"id":"field_1","type":"text","label":"Full Name","required":true,"order":1}]',
        settings: '{"allowMultipleSubmissions":false,"requireEmailVerification":true,"showProgressBar":true}',
        validation: '[]',
        conditional_logic: '[]',
        status: 'draft',
        version: 1,
        submissions_count: 0,
        isActive: true,
        scanCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
    })
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: 'reg-123',
            organizationId: 'test-org-123',
            qrCodeSetId: 'qrset-123',
            qrCodeId: 'qr-456',
            registrationData: '{"name":"John Doe","email":"john@example.com","phone":"+1234567890"}',
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]),
        orderBy: vi.fn().mockResolvedValue([
          {
            id: 'reg-123',
            organizationId: 'test-org-123',
            qrCodeSetId: 'qrset-123',
            qrCodeId: 'qr-456',
            registrationData: '{"name":"John Doe","email":"john@example.com","phone":"+1234567890"}',
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
      }),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([
          {
            id: 'reg-123',
            organizationId: 'test-org-123',
            qrCodeSetId: 'qrset-123',
            qrCodeId: 'qr-456',
            registrationData: '{"name":"John Doe","email":"john@example.com","phone":"+1234567890"}',
            status: 'completed',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
      })
    })
  }),
  delete: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ 
          id: 'test-id-123',
          organizationId: 'test-org-123',
          organization_id: 'test-org-123'
        }])
      })
    })
  })
}

// Mock database tables
export const mockTables = {
  organizations: 'organizations',
  users: 'users',
  userOrganizations: 'userOrganizations',
  qrCodeSets: 'qrCodeSets',
  registrations: 'registrations',
  forms: 'forms',
  qrScans: 'qrScans',
  activities: 'activities'
}

// Setup database mocks
export function setupDatabaseMocks() {
  vi.mock('@/lib/database/connection', () => ({
    db: mockDb
  }))
  
  vi.mock('@/lib/database/schema', () => mockTables)
}

// Clean up mocks
export function cleanupDatabaseMocks() {
  vi.clearAllMocks()
}
