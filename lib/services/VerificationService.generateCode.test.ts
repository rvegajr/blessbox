/**
 * Verification code generation must be cryptographically secure (Prod-readiness
 * P4). Math.random() is a predictable PRNG and must never mint a login secret.
 */
import { describe, it, expect, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('../db', () => ({ getDbClient: () => mockDb }));
vi.mock('./gatewayEmail', () => ({ sendViaGatewayEmail: vi.fn(async () => ({ success: true })) }));

import { VerificationService } from './VerificationService';

describe('VerificationService.generateCode', () => {
  it('always returns a zero-padded 6-digit numeric string', async () => {
    const svc = new VerificationService();
    for (let i = 0; i < 300; i++) {
      const code = await svc.generateCode('a@b.com');
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it('produces varied values (not a constant / stuck PRNG)', async () => {
    const svc = new VerificationService();
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) seen.add(await svc.generateCode('a@b.com'));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('can produce codes in the low range (proves zero-padding, not 100000+ floor bias)', async () => {
    const svc = new VerificationService();
    let sawLow = false;
    for (let i = 0; i < 5000 && !sawLow; i++) {
      const code = await svc.generateCode('a@b.com');
      if (code[0] === '0') sawLow = true; // < 100000, only possible with padding
    }
    expect(sawLow).toBe(true);
  });
});
