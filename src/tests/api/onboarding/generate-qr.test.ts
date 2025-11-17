import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/onboarding/generate-qr/route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code-data'),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
}));

const mockDb = db as any;

describe('POST /api/onboarding/generate-qr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate QR codes successfully', async () => {
    const mockOrg = {
      id: 'org-123',
      name: 'Test Org',
      contactEmail: 'test@example.com',
    };

    const mockQRSet = {
      id: 'qr-set-123',
      organizationId: 'org-123',
      formFields: JSON.stringify([]),
    };

    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockOrg]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockQRSet]),
        }),
      });

    mockDb.select.mockImplementation(mockSelect);

    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue([{
      id: 'qr-set-123',
      organizationId: 'org-123',
      name: 'Test QR Set',
      qrCodes: JSON.stringify([]),
    }]);

    mockDb.insert.mockReturnValue({
      values: mockValues,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/generate-qr', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        entryPoints: [
          { label: 'Main Entrance', slug: 'main-entrance' },
          { label: 'Side Door', slug: 'side-door' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.qrCodes).toBeDefined();
    expect(Array.isArray(data.qrCodes)).toBe(true);
  });

  it('should generate QR codes with correct URLs', async () => {
    const mockOrg = {
      id: 'org-123',
      name: 'Test Org',
      contactEmail: 'test@example.com',
    };

    const mockSelect = vi.fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockOrg]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]), // No existing QR set
        }),
      });

    mockDb.select.mockImplementation(mockSelect);

    const mockInsert = vi.fn().mockReturnThis();
    const mockValues = vi.fn().mockResolvedValue([{
      id: 'qr-set-123',
    }]);

    mockDb.insert.mockReturnValue({
      values: mockValues,
    });

    const request = new NextRequest('http://localhost:7777/api/onboarding/generate-qr', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        entryPoints: [
          { label: 'Main Entrance', slug: 'main-entrance' },
        ],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.qrCodes.length).toBeGreaterThan(0);
    expect(data.qrCodes[0].url).toContain('/register/');
    expect(data.qrCodes[0].dataUrl).toContain('data:image/png;base64');
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

    const request = new NextRequest('http://localhost:7777/api/onboarding/generate-qr', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'non-existent',
        entryPoints: [],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it('should validate entry points', async () => {
    const request = new NextRequest('http://localhost:7777/api/onboarding/generate-qr', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'org-123',
        entryPoints: [], // Empty array
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('entryPoints');
  });
});
