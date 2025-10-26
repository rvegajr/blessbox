/**
 * Global Test Mocks
 * 
 * Sets up mocks for all tests to avoid database conflicts
 */

import { vi } from 'vitest'
import { setupServiceMocks } from './service-mocks'

// Mock database connection with proper return values
const mockDb = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockImplementation((data) => {
        // Check if this is a QR scan tracking with invalid data
        if (data && data.organizationId === '') {
          return Promise.reject(new Error('FOREIGN KEY constraint failed'))
        }
        return Promise.resolve([{ 
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
const mockTables = {
  organizations: 'organizations',
  users: 'users',
  userOrganizations: 'userOrganizations',
  qrCodeSets: 'qrCodeSets',
  registrations: 'registrations',
  forms: 'forms',
  qrScans: 'qrScans',
  activities: 'activities'
}

// Mock NextAuth
const mockAuth = vi.fn()

// Setup all mocks
vi.mock('@/lib/database/connection', () => ({
  db: mockDb
}))

vi.mock('@/lib/database/schema', () => mockTables)

vi.mock('@/lib/auth', () => ({
  auth: mockAuth
}))

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'http://localhost:7777',
    NEXTAUTH_URL: 'http://localhost:7777',
    NEXTAUTH_SECRET: 'test-secret'
  }
}))

// Also set the actual process.env for direct access
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:7777'
process.env.NEXTAUTH_URL = 'http://localhost:7777'
process.env.NEXTAUTH_SECRET = 'test-secret'

// Setup service mocks
setupServiceMocks()

// Export mocks for use in tests
export { mockDb, mockAuth }
