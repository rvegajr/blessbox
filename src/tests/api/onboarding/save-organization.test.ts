import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/onboarding/save-organization/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

const mockDb = db as any;

describe('POST /api/onboarding/save-organization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create organization successfully', async () => {
    const mockOrganization = {
      id: 'org-123',
      name: 'Test Organization',
      eventName: 'Test Event',
      contactEmail: 'test@example.com',
      contactPhone: '555-1234',
      contactAddress: '123 Main St',
      contactCity: 'Anytown',
      contactState: 'CA',
      contactZip: '12345',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Mock no existing organization
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    // Mock insert
    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue([mockOrganization]);

    mockDb.insert.mockReturnValue({
      values: mockValues,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/save-organization', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Organization',
        eventName: 'Test Event',
        contactEmail: 'test@example.com',
        contactPhone: '555-1234',
        contactAddress: '123 Main St',
        contactCity: 'Anytown',
        contactState: 'CA',
        contactZip: '12345',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.organization).toBeDefined();
    expect(data.organization.name).toBe('Test Organization');
  });

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost:7777/api/onboarding/save-organization', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Organization',
        // Missing contactEmail
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('contactEmail');
  });

  it('should return 409 for duplicate email', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockFrom = vi.fn().mockReturnThis();
    const mockWhere = vi.fn().mockResolvedValue([{
      id: 'existing-org',
      contactEmail: 'test@example.com',
    }]);

    mockDb.select.mockReturnValue({
      from: mockFrom,
      where: mockWhere,
    });

    mockFrom.mockReturnValue({
      where: mockWhere,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/save-organization', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Organization',
        contactEmail: 'test@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toContain('already exists');
  });

  it('should validate email format', async () => {
    const request = new NextRequest('http://localhost:7777/api/onboarding/save-organization', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Organization',
        contactEmail: 'invalid-email',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('email');
  });
});
