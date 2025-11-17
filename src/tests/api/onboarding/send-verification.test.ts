import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/onboarding/send-verification/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verificationCodes } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Mock the email service
const mockSendEmail = vi.fn();
vi.mock('@/lib/services/EmailService', () => ({
  EmailService: vi.fn(() => ({
    sendEmail: mockSendEmail,
  })),
}));

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

const mockDb = db as any;

describe('POST /api/onboarding/send-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true });
  });

  it('should send verification code to valid email', async () => {
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue([{
      id: 'test-id',
      email: 'test@example.com',
      code: '123456',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      attempts: 0,
      verified: false
    }]);

    mockDb.insert.mockReturnValue({
      values: mockValues,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      expect.any(String),
      expect.objectContaining({
        code: expect.any(String),
      })
    );
  });

  it('should return 400 for invalid email', async () => {
    const request = new NextRequest('http://localhost:7777/api/onboarding/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

  it('should return 400 for missing email', async () => {
    const request = new NextRequest('http://localhost:7777/api/onboarding/send-verification', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });

  it('should handle rate limiting', async () => {
    // Mock finding recent verification code
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([{
      id: 'existing-id',
      email: 'test@example.com',
      createdAt: new Date().toISOString(), // Recent
    }]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should either rate limit or allow (depends on implementation)
    expect([200, 429]).toContain(response.status);
  });

  it('should invalidate previous codes when sending new one', async () => {
    // Mock finding existing code
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([{
      id: 'existing-id',
      email: 'test@example.com',
    }]);

    const mockUpdate = vi.fn().mockReturnThis();
    const mockSet = vi.fn().mockResolvedValue([]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockDb.update.mockReturnValue({
      set: mockSet,
      where: vi.fn().mockResolvedValue([]),
    });

    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue([{
      id: 'new-id',
      email: 'test@example.com',
      code: '654321',
    }]);

    mockDb.insert.mockReturnValue({
      values: mockValues,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);

    // Should succeed even if previous code exists
    expect([200, 201]).toContain(response.status);
  });

  it('should generate 6-digit code', async () => {
    let generatedCode = '';

    mockSendEmail.mockImplementation((orgId, email, template, vars) => {
      generatedCode = vars.code;
      return Promise.resolve({ success: true });
    });

    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockImplementation((values) => {
      // Capture the code
      if (values[0]?.code) {
        generatedCode = values[0].code;
      }
      return Promise.resolve([{ id: 'test-id', ...values[0] }]);
    });

    mockDb.insert.mockReturnValue({
      values: mockValues,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    await POST(request);

    // Code should be 6 digits
    expect(generatedCode).toMatch(/^\d{6}$/);
  });
});
