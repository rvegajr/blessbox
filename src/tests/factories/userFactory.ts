// User Factory - Test data generation
import { v4 as uuidv4 } from 'uuid';

export interface TestUser {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin' | 'super_admin';
}

export function createUser(overrides?: Partial<TestUser>): TestUser {
  const timestamp = Date.now();
  return {
    id: uuidv4(),
    email: `test-user-${timestamp}@example.com`,
    name: `Test User ${timestamp}`,
    role: 'user',
    ...overrides,
  };
}

export function createAdminUser(overrides?: Partial<TestUser>): TestUser {
  return createUser({
    role: 'admin',
    ...overrides,
  });
}

export function createSuperAdminUser(overrides?: Partial<TestUser>): TestUser {
  return createUser({
    role: 'super_admin',
    email: 'admin@blessbox.app',
    ...overrides,
  });
}
