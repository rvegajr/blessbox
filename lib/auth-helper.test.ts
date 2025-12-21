// Auth Helper Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getServerSession } from './auth-helper';
import jwt from 'jsonwebtoken';

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock jwt
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

describe('getServerSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret-key';
  });

  it('should return session for valid token', async () => {
    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn((name: string) => {
        if (name === 'authjs.session-token') {
          return { value: 'valid-token' };
        }
        return undefined;
      }),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);

    const mockDecoded = {
      email: 'test@example.com',
      name: 'Test User',
      id: 'user-123',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    };

    (jwt.verify as any).mockReturnValue(mockDecoded);

    const session = await getServerSession();

    expect(session).not.toBeNull();
    expect(session?.user.email).toBe('test@example.com');
    expect(session?.user.name).toBe('Test User');
  });

  it('should return null when no token found', async () => {
    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn(() => undefined),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);

    const session = await getServerSession();

    expect(session).toBeNull();
  });

  it('should return null when NEXTAUTH_SECRET is not set', async () => {
    delete process.env.NEXTAUTH_SECRET;

    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn(() => ({ value: 'token' })),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);

    const session = await getServerSession();

    expect(session).toBeNull();
  });

  it('should return null for invalid JWT token', async () => {
    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn(() => ({ value: 'invalid-token' })),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);
    (jwt.verify as any).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const session = await getServerSession();

    expect(session).toBeNull();
  });

  it('should check multiple cookie names', async () => {
    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn((name: string) => {
        // Try second cookie name
        if (name === '__Secure-authjs.session-token') {
          return { value: 'secure-token' };
        }
        return undefined;
      }),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);

    const mockDecoded = {
      email: 'test@example.com',
      name: 'Test User',
      id: 'user-123',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    (jwt.verify as any).mockReturnValue(mockDecoded);

    const session = await getServerSession();

    expect(session).not.toBeNull();
    expect(mockCookieStore.get).toHaveBeenCalledWith('authjs.session-token');
    expect(mockCookieStore.get).toHaveBeenCalledWith('__Secure-authjs.session-token');
  });

  it('should handle missing email in decoded token', async () => {
    const mockCookies = await import('next/headers');
    const mockCookieStore = {
      get: vi.fn(() => ({ value: 'token' })),
    };

    (mockCookies.cookies as any).mockResolvedValue(mockCookieStore);

    const mockDecoded = {
      name: 'Test User',
      id: 'user-123',
      // Missing email
    };

    (jwt.verify as any).mockReturnValue(mockDecoded);

    const session = await getServerSession();

    expect(session).toBeNull();
  });
});
