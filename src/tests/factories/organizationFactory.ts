// Organization Factory - Test data generation
import { v4 as uuidv4 } from 'uuid';
import type { Organization, OrganizationCreate } from '@/lib/interfaces/IOrganizationService';

export function createOrganization(overrides?: Partial<OrganizationCreate>): OrganizationCreate {
  const timestamp = Date.now();
  return {
    name: `Test Organization ${timestamp}`,
    eventName: `Test Event ${timestamp}`,
    contactEmail: `test-org-${timestamp}@example.com`,
    contactPhone: '555-1234',
    contactAddress: '123 Test St',
    contactCity: 'Test City',
    contactState: 'CA',
    contactZip: '12345',
    ...overrides,
  };
}

export function createOrganizationEntity(overrides?: Partial<Organization>): Organization {
  const timestamp = Date.now();
  return {
    id: uuidv4(),
    name: `Test Organization ${timestamp}`,
    eventName: `Test Event ${timestamp}`,
    contactEmail: `test-org-${timestamp}@example.com`,
    contactPhone: '555-1234',
    contactAddress: '123 Test St',
    contactCity: 'Test City',
    contactState: 'CA',
    contactZip: '12345',
    emailVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
