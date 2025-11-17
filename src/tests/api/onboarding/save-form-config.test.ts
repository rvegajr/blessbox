import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/onboarding/save-form-config/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn(),
    select: vi.fn(),
  },
}));

const mockDb = db as any;

describe('POST /api/onboarding/save-form-config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save form configuration', async () => {
    const mockFormFields = [
      { id: 'firstName', label: 'First Name', type: 'text', required: true },
      { id: 'lastName', label: 'Last Name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([{
      id: 'org-123',
      name: 'Test Org',
    }]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    const mockUpdate = vi.fn().mockReturnThis();
    const mockSet = vi.fn().mockResolvedValue([{
      id: 'org-123',
      formFields: JSON.stringify(mockFormFields),
    }]);

    mockDb.update.mockReturnValue({
      set: mockSet,
      where: vi.fn().mockResolvedValue([]),
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/save-form-config', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        formFields: mockFormFields,
        language: 'en',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should validate form fields structure', async () => {
    const request = new NextRequest('http://localhost:7777/api/onboarding/save-form-config', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        formFields: 'invalid', // Not an array
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should return 404 for non-existent organization', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([]); // No org found

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/save-form-config', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'non-existent',
        formFields: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
