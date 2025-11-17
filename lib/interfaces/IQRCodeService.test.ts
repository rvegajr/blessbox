// Tests for IQRCodeService interface
// These tests validate the interface contract expectations

import { describe, it, expect } from 'vitest';
import type { 
  IQRCodeService, 
  QRCode, 
  QRCodeSet, 
  QRCodeUpdate,
  QRCodeAnalytics 
} from './IQRCodeService';

describe('IQRCodeService Interface', () => {
  // Mock implementation for testing
  class MockQRCodeService implements IQRCodeService {
    async listQRCodes(organizationId: string): Promise<QRCode[]> {
      return [];
    }
    
    async getQRCodesBySet(qrCodeSetId: string): Promise<QRCode[]> {
      return [];
    }
    
    async getQRCode(id: string, qrCodeSetId: string): Promise<QRCode | null> {
      return null;
    }
    
    async updateQRCode(id: string, qrCodeSetId: string, updates: QRCodeUpdate): Promise<QRCode> {
      throw new Error('Not implemented');
    }
    
    async deleteQRCode(id: string, qrCodeSetId: string): Promise<void> {
      return;
    }
    
    async downloadQRCode(id: string, qrCodeSetId: string): Promise<string> {
      return '';
    }
    
    async getQRCodeAnalytics(id: string, qrCodeSetId: string): Promise<QRCodeAnalytics> {
      return {
        scanCount: 0,
        registrationCount: 0,
      };
    }
    
    async getQRCodeSets(organizationId: string): Promise<QRCodeSet[]> {
      return [];
    }
    
    async getQRCodeSet(id: string): Promise<QRCodeSet | null> {
      return null;
    }
    
    async updateQRCodeSet(id: string, updates: { name?: string; isActive?: boolean }): Promise<QRCodeSet> {
      throw new Error('Not implemented');
    }
  }

  const service: IQRCodeService = new MockQRCodeService();

  describe('listQRCodes', () => {
    it('should accept organizationId as string', async () => {
      const result = await service.listQRCodes('org-123');
      expect(result).toBeInstanceOf(Array);
    });

    it('should return array of QRCode objects', async () => {
      const result = await service.listQRCodes('org-123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getQRCodesBySet', () => {
    it('should accept qrCodeSetId as string', async () => {
      const result = await service.getQRCodesBySet('set-123');
      expect(result).toBeInstanceOf(Array);
    });

    it('should return array of QRCode objects', async () => {
      const result = await service.getQRCodesBySet('set-123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getQRCode', () => {
    it('should accept id and qrCodeSetId as strings', async () => {
      const result = await service.getQRCode('qr-123', 'set-123');
      expect(result).toBe(null);
    });

    it('should return QRCode or null', async () => {
      const result = await service.getQRCode('qr-123', 'set-123');
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('updateQRCode', () => {
    it('should accept id, qrCodeSetId, and updates object', async () => {
      const updates: QRCodeUpdate = { label: 'New Label' };
      await expect(
        service.updateQRCode('qr-123', 'set-123', updates)
      ).rejects.toThrow();
    });

    it('should accept partial updates (label only)', async () => {
      const updates: QRCodeUpdate = { label: 'New Label' };
      await expect(
        service.updateQRCode('qr-123', 'set-123', updates)
      ).rejects.toThrow();
    });

    it('should accept partial updates (isActive only)', async () => {
      const updates: QRCodeUpdate = { isActive: false };
      await expect(
        service.updateQRCode('qr-123', 'set-123', updates)
      ).rejects.toThrow();
    });
  });

  describe('deleteQRCode', () => {
    it('should accept id and qrCodeSetId as strings', async () => {
      await expect(
        service.deleteQRCode('qr-123', 'set-123')
      ).resolves.toBeUndefined();
    });

    it('should return void', async () => {
      const result = await service.deleteQRCode('qr-123', 'set-123');
      expect(result).toBeUndefined();
    });
  });

  describe('downloadQRCode', () => {
    it('should accept id and qrCodeSetId as strings', async () => {
      const result = await service.downloadQRCode('qr-123', 'set-123');
      expect(typeof result).toBe('string');
    });

    it('should return base64 image string', async () => {
      const result = await service.downloadQRCode('qr-123', 'set-123');
      expect(typeof result).toBe('string');
    });
  });

  describe('getQRCodeAnalytics', () => {
    it('should accept id and qrCodeSetId as strings', async () => {
      const result = await service.getQRCodeAnalytics('qr-123', 'set-123');
      expect(result).toHaveProperty('scanCount');
      expect(result).toHaveProperty('registrationCount');
    });

    it('should return QRCodeAnalytics object', async () => {
      const result = await service.getQRCodeAnalytics('qr-123', 'set-123');
      expect(typeof result.scanCount).toBe('number');
      expect(typeof result.registrationCount).toBe('number');
    });
  });

  describe('getQRCodeSets', () => {
    it('should accept organizationId as string', async () => {
      const result = await service.getQRCodeSets('org-123');
      expect(result).toBeInstanceOf(Array);
    });

    it('should return array of QRCodeSet objects', async () => {
      const result = await service.getQRCodeSets('org-123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getQRCodeSet', () => {
    it('should accept id as string', async () => {
      const result = await service.getQRCodeSet('set-123');
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should return QRCodeSet or null', async () => {
      const result = await service.getQRCodeSet('set-123');
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('updateQRCodeSet', () => {
    it('should accept id and updates object', async () => {
      await expect(
        service.updateQRCodeSet('set-123', { name: 'New Name' })
      ).rejects.toThrow();
    });

    it('should accept partial updates (name only)', async () => {
      await expect(
        service.updateQRCodeSet('set-123', { name: 'New Name' })
      ).rejects.toThrow();
    });

    it('should accept partial updates (isActive only)', async () => {
      await expect(
        service.updateQRCodeSet('set-123', { isActive: false })
      ).rejects.toThrow();
    });
  });

  describe('QRCode type', () => {
    it('should have required fields', () => {
      const qrCode: QRCode = {
        id: 'qr-123',
        qrCodeSetId: 'set-123',
        label: 'Main Entrance',
        slug: 'main-entrance',
        url: 'https://example.com/register/org/main-entrance',
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        isActive: true,
        scanCount: 10,
        registrationCount: 5,
        createdAt: '2025-01-01T00:00:00Z',
      };
      
      expect(qrCode.id).toBe('qr-123');
      expect(qrCode.label).toBe('Main Entrance');
      expect(qrCode.isActive).toBe(true);
    });
  });

  describe('QRCodeAnalytics type', () => {
    it('should have required fields', () => {
      const analytics: QRCodeAnalytics = {
        scanCount: 100,
        registrationCount: 50,
      };
      
      expect(analytics.scanCount).toBe(100);
      expect(analytics.registrationCount).toBe(50);
    });

    it('should support optional fields', () => {
      const analytics: QRCodeAnalytics = {
        scanCount: 100,
        registrationCount: 50,
        lastScanned: '2025-01-01T00:00:00Z',
        lastRegistration: '2025-01-01T00:00:00Z',
        dailyScans: [{ date: '2025-01-01', count: 10 }],
        dailyRegistrations: [{ date: '2025-01-01', count: 5 }],
      };
      
      expect(analytics.lastScanned).toBeDefined();
      expect(analytics.dailyScans).toBeDefined();
    });
  });
});

