import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/onboarding/verify-code/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

const mockDb = db as any;

describe('POST /api/onboarding/verify-code', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify correct code', async () => {
    const mockVerificationCode = {
      id: 'test-id',
      email: 'test@example.com',
      code: '123456',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Future expiry
      attempts: 0,
      verified: false
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([mockVerificationCode]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockSet = vi.fn().mockReturnThis();
    const mockWhereUpdate = vi.fn().mockResolvedValue([]);

    mockDb.update.mockReturnValue({
      set: mockSet,
      where: mockWhereUpdate,
    });

    mockSet.mockReturnValue({
      where: mockWhereUpdate,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '123456' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.verified).toBe(true);
  });

  it('should reject incorrect code', async () => {
    const mockVerificationCode = {
      id: 'test-id',
      email: 'test@example.com',
      code: '123456',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      attempts: 0,
      verified: false
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([mockVerificationCode]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockSet = vi.fn().mockReturnThis();
    const mockWhereUpdate = vi.fn().mockResolvedValue([]);

    mockDb.update.mockReturnValue({
      set: mockSet,
      where: mockWhereUpdate,
    });

    mockSet.mockReturnValue({
      where: mockWhereUpdate,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '999999' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.verified).toBe(false);
  });

  it('should reject expired code', async () => {
    const mockVerificationCode = {
      id: 'test-id',
      email: 'test@example.com',
      code: '123456',
      createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
      expiresAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Expired 5 minutes ago
      attempts: 0,
      verified: false
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([mockVerificationCode]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '123456' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('expired');
  });

  it('should reject after max attempts', async () => {
    const mockVerificationCode = {
      id: 'test-id',
      email: 'test@example.com',
      code: '123456',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      attempts: 5, // Max attempts exceeded
      verified: false
    };

    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([mockVerificationCode]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', code: '999999' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('attempts');
  });

  it('should return 400 for missing email', async () => {
    const request = new NextRequest('http://localhost:7777/api/onboarding/verify-code', {
      method: 'POST',
      body: JSON.stringify({ code: '123456' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 400 for missing code', async () => {
    const request = new NextRequest('http://localhost:7777/api/onboarding/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
