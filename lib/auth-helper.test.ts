// Auth Helper Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getServerSession } from './auth-helper';

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('getServerSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return test/dev bypass session when bb_test_auth=1', async () => {
    process.env.NODE_ENV = 'development';
    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn((name: string) => {
        if (name === 'bb_test_auth') return { value: '1' };
        if (name === 'bb_test_email') return { value: 'Case@Example.com' };
        if (name === 'bb_test_org_id') return { value: 'org-123' };
        return undefined;
      }),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);

    const session = await getServerSession();

    expect(session).not.toBeNull();
    expect(session?.user.email).toBe('Case@Example.com');
    expect(session?.user.organizationId).toBe('org-123');
  });

  it('should return null when no token found', async () => {
    process.env.NODE_ENV = 'production';
    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn(() => undefined),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);

    const session = await getServerSession();

    expect(session).toBeNull();
  });

  it('should return null when token is invalid (no JWT_SECRET)', async () => {
    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn((name: string) => {
        if (name === 'bb_session') return { value: 'invalid-token' };
        return undefined;
      }),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);

    // Without JWT_SECRET, the token validation will fail
    const session = await getServerSession();

    expect(session).toBeNull();
  });
});
