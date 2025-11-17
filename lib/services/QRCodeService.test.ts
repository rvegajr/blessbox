import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QRCodeService } from './QRCodeService';
import type { QRCode, QRCodeUpdate } from '../interfaces/IQRCodeService';

// Mock the database client
const mockDb = {
  execute: vi.fn(),
};

// Mock getDbClient
vi.mock('../db', () => ({
  getDbClient: () => mockDb,
}));

describe('QRCodeService', () => {
  let service: QRCodeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new QRCodeService();
  });

  describe('listQRCodes', () => {
    it('should return empty array if no QR code sets found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const result = await service.listQRCodes('org-123');

      expect(result).toEqual([]);
      expect(mockDb.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT'),
        args: ['org-123'],
      });
    });

    it('should parse QR codes from QR code sets', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
          {
            id: 'qr-2',
            label: 'Side Door',
            slug: 'side-door',
            url: 'https://example.com/register/org/side-door',
            dataUrl: 'data:image/png;base64,test2',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockQRCodeSet] }) // Get QR code sets
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // Count registrations for qr-1
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Count registrations for qr-2

      const result = await service.listQRCodes('org-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'qr-1',
        qrCodeSetId: 'set-123',
        label: 'Main Entrance',
        slug: 'main-entrance',
        url: 'https://example.com/register/org/main-entrance',
        dataUrl: 'data:image/png;base64,test1',
        isActive: true,
      });
    });

    it('should include registration count for each QR code', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockQRCodeSet] }) // Get QR code sets
        .mockResolvedValueOnce({ rows: [{ count: 5 }] }); // Count registrations

      const result = await service.listQRCodes('org-123');

      expect(result[0].registrationCount).toBe(5);
    });
  });

  describe('getQRCodesBySet', () => {
    it('should return QR codes for a specific set', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockQRCodeSet] }) // Get QR code set
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Count registrations

      const result = await service.getQRCodesBySet('set-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('qr-1');
      expect(result[0].qrCodeSetId).toBe('set-123');
    });

    it('should return empty array if QR code set not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const result = await service.getQRCodesBySet('set-123');

      expect(result).toEqual([]);
    });
  });

  describe('getQRCode', () => {
    it('should return QR code by ID', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockQRCodeSet] }) // Get QR code set
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Count registrations

      const result = await service.getQRCode('qr-1', 'set-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('qr-1');
      expect(result?.label).toBe('Main Entrance');
    });

    it('should return null if QR code not found', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockQRCodeSet] }) // Get QR code set
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Count registrations

      const result = await service.getQRCode('qr-999', 'set-123');

      expect(result).toBeNull();
    });

    it('should return null if QR code set not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const result = await service.getQRCode('qr-1', 'set-123');

      expect(result).toBeNull();
    });
  });

  describe('updateQRCode', () => {
    it('should update QR code label', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Get QR code set (before update)
      mockDb.execute.mockResolvedValueOnce({ rows: [mockQRCodeSet] });
      
      // Update QR code set
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      // Get QR code set (after update)
      const updatedQRCodeSet = {
        ...mockQRCodeSet,
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Updated Label',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
      };
      mockDb.execute.mockResolvedValueOnce({ rows: [updatedQRCodeSet] });
      
      // Count registrations
      mockDb.execute.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      const updates: QRCodeUpdate = { label: 'Updated Label' };
      const result = await service.updateQRCode('qr-1', 'set-123', updates);

      expect(result.label).toBe('Updated Label');
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('UPDATE'),
        })
      );
    });

    it('should update QR code active status', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Get QR code set (before update)
      mockDb.execute.mockResolvedValueOnce({ rows: [mockQRCodeSet] });
      
      // Update QR code set
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      // Get QR code set (after update) - with isActive in qr_codes
      const updatedQRCodeSet = {
        ...mockQRCodeSet,
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
            isActive: false,
          },
        ]),
      };
      mockDb.execute.mockResolvedValueOnce({ rows: [updatedQRCodeSet] });
      
      // Count registrations
      mockDb.execute.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      const updates: QRCodeUpdate = { isActive: false };
      const result = await service.updateQRCode('qr-1', 'set-123', updates);

      expect(result.isActive).toBe(false);
    });

    it('should throw error if QR code not found', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute.mockResolvedValueOnce({ rows: [mockQRCodeSet] });

      const updates: QRCodeUpdate = { label: 'Updated Label' };

      await expect(
        service.updateQRCode('qr-999', 'set-123', updates)
      ).rejects.toThrow('QR code not found');
    });
  });

  describe('deleteQRCode', () => {
    it('should set QR code as inactive', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      // Get QR code set (before update)
      mockDb.execute.mockResolvedValueOnce({ rows: [mockQRCodeSet] });
      
      // Update QR code set
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      // Get QR code set (after update)
      const updatedQRCodeSet = {
        ...mockQRCodeSet,
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
            isActive: false,
          },
        ]),
      };
      mockDb.execute.mockResolvedValueOnce({ rows: [updatedQRCodeSet] });
      
      // Count registrations
      mockDb.execute.mockResolvedValueOnce({ rows: [{ count: 0 }] });

      await service.deleteQRCode('qr-1', 'set-123');

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('UPDATE'),
        })
      );
    });

    it('should throw error if QR code not found', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute.mockResolvedValueOnce({ rows: [mockQRCodeSet] });

      await expect(
        service.deleteQRCode('qr-999', 'set-123')
      ).rejects.toThrow('QR code not found');
    });
  });

  describe('downloadQRCode', () => {
    it('should return base64 image data', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test123',
          },
        ]),
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockQRCodeSet] }) // Get QR code set
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }); // Count registrations

      const result = await service.downloadQRCode('qr-1', 'set-123');

      expect(result).toBe('data:image/png;base64,test123');
    });

    it('should throw error if QR code not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.downloadQRCode('qr-999', 'set-123')
      ).rejects.toThrow('QR code not found');
    });
  });

  describe('getQRCodeAnalytics', () => {
    it('should return analytics data', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        qr_codes: JSON.stringify([
          {
            id: 'qr-1',
            label: 'Main Entrance',
            slug: 'main-entrance',
            url: 'https://example.com/register/org/main-entrance',
            dataUrl: 'data:image/png;base64,test1',
          },
        ]),
        scan_count: 10,
        is_active: 1,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute
        .mockResolvedValueOnce({ rows: [mockQRCodeSet] }) // Get QR code set (for getQRCode)
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // Count registrations (for getQRCode)
        .mockResolvedValueOnce({ rows: [{ scan_count: 10 }] }) // Get scan count
        .mockResolvedValueOnce({ rows: [{ count: 5 }] }) // Count registrations
        .mockResolvedValueOnce({ rows: [{ registered_at: '2025-01-01T12:00:00Z' }] }); // Last registration

      const result = await service.getQRCodeAnalytics('qr-1', 'set-123');

      expect(result.scanCount).toBe(10);
      expect(result.registrationCount).toBe(5);
      expect(result.lastRegistration).toBeDefined();
    });

    it('should throw error if QR code not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.getQRCodeAnalytics('qr-999', 'set-123')
      ).rejects.toThrow('QR code not found');
    });
  });

  describe('getQRCodeSets', () => {
    it('should return QR code sets for organization', async () => {
      const mockQRCodeSets = [
        {
          id: 'set-1',
          organization_id: 'org-123',
          name: 'Set 1',
          language: 'en',
          is_active: 1,
          scan_count: 10,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'set-2',
          organization_id: 'org-123',
          name: 'Set 2',
          language: 'en',
          is_active: 1,
          scan_count: 5,
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ];

      mockDb.execute.mockResolvedValueOnce({ rows: mockQRCodeSets });

      const result = await service.getQRCodeSets('org-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'set-1',
        organizationId: 'org-123',
        name: 'Set 1',
        isActive: true,
        scanCount: 10,
      });
    });

    it('should return empty array if no sets found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const result = await service.getQRCodeSets('org-123');

      expect(result).toEqual([]);
    });
  });

  describe('getQRCodeSet', () => {
    it('should return QR code set by ID', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        name: 'Test Set',
        language: 'en',
        is_active: 1,
        scan_count: 10,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute.mockResolvedValueOnce({ rows: [mockQRCodeSet] });

      const result = await service.getQRCodeSet('set-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('set-123');
      expect(result?.name).toBe('Test Set');
    });

    it('should return null if QR code set not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const result = await service.getQRCodeSet('set-999');

      expect(result).toBeNull();
    });
  });

  describe('updateQRCodeSet', () => {
    it('should update QR code set name', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        name: 'Old Name',
        language: 'en',
        is_active: 1,
        scan_count: 10,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute.mockResolvedValueOnce({ rows: [mockQRCodeSet] });
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      const updatedQRCodeSet = {
        ...mockQRCodeSet,
        name: 'New Name',
      };
      mockDb.execute.mockResolvedValueOnce({ rows: [updatedQRCodeSet] });

      const result = await service.updateQRCodeSet('set-123', { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('should update QR code set active status', async () => {
      const mockQRCodeSet = {
        id: 'set-123',
        organization_id: 'org-123',
        name: 'Test Set',
        language: 'en',
        is_active: 1,
        scan_count: 10,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockDb.execute.mockResolvedValueOnce({ rows: [mockQRCodeSet] });
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      const updatedQRCodeSet = {
        ...mockQRCodeSet,
        is_active: 0,
      };
      mockDb.execute.mockResolvedValueOnce({ rows: [updatedQRCodeSet] });

      const result = await service.updateQRCodeSet('set-123', { isActive: false });

      expect(result.isActive).toBe(false);
    });

    it('should throw error if QR code set not found', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.updateQRCodeSet('set-999', { name: 'New Name' })
      ).rejects.toThrow('QR code set not found');
    });
  });
});

