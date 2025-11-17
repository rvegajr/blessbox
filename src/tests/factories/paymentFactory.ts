// Payment Factory - Test data generation
import { v4 as uuidv4 } from 'uuid';

export interface TestPayment {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  planType: 'free' | 'standard' | 'enterprise';
}

export function createPayment(overrides?: Partial<TestPayment>): TestPayment {
  return {
    id: uuidv4(),
    organizationId: uuidv4(),
    amount: 2999, // $29.99 in cents
    currency: 'USD',
    status: 'pending',
    planType: 'standard',
    ...overrides,
  };
}

export function createSubscriptionPayment(planType: 'standard' | 'enterprise' = 'standard'): TestPayment {
  const amounts = {
    standard: 2999, // $29.99
    enterprise: 9999, // $99.99
  };

  return createPayment({
    planType,
    amount: amounts[planType],
    status: 'completed',
  });
}
