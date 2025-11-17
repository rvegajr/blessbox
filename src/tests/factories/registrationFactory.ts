// Registration Factory - Test data generation
import { v4 as uuidv4 } from 'uuid';
import type { Registration, RegistrationFormData } from '@/lib/interfaces/IRegistrationService';

export function createRegistrationFormData(overrides?: Partial<RegistrationFormData>): RegistrationFormData {
  return {
    name: 'John Doe',
    email: `test-${Date.now()}@example.com`,
    phone: '555-1234',
    ...overrides,
  };
}

export function createRegistration(overrides?: Partial<Registration>): Registration {
  const timestamp = Date.now();
  return {
    id: uuidv4(),
    qrCodeSetId: uuidv4(),
    qrCodeId: uuidv4(),
    registrationData: JSON.stringify({
      name: 'John Doe',
      email: `test-${timestamp}@example.com`,
    }),
    deliveryStatus: 'pending',
    registeredAt: new Date().toISOString(),
    ...overrides,
  };
}
