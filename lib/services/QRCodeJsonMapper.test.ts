/**
 * Phase B: Fix #18 — QR Soft-Delete
 * TDD Test Suite for QRCodeJsonMapper (Red → Green)
 */

import { describe, it, expect } from 'vitest';
import { QRCodeJsonMapper } from './QRCodeJsonMapper';

describe('QRCodeJsonMapper', () => {
  const mapper = new QRCodeJsonMapper();
  
  const mockSet = {
    id: 'set-123',
    isActive: true,
    scanCount: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  it('returns isActive=false when JSON has isActive=false (preserves soft delete)', () => {
    const result = mapper.mapJsonToQRCode(
      { 
        id: 'qr-1', 
        label: 'Door A', 
        url: 'https://example.com/register/org/door-a',
        dataUrl: 'data:image/png;base64,...',
        isActive: false 
      },
      mockSet,
      5
    );
    
    expect(result.isActive).toBe(false);
    expect(result.id).toBe('qr-1');
    expect(result.label).toBe('Door A');
  });

  it('defaults to set isActive when JSON omits the field (legacy rows)', () => {
    const result = mapper.mapJsonToQRCode(
      { 
        id: 'qr-2', 
        label: 'Door B', 
        url: 'https://example.com/register/org/door-b',
        dataUrl: 'data:image/png;base64,...'
      },
      mockSet,
      3
    );
    
    expect(result.isActive).toBe(true);
  });

  it('respects explicit isActive=true', () => {
    const result = mapper.mapJsonToQRCode(
      { 
        id: 'qr-3', 
        label: 'Door C', 
        url: 'https://example.com/register/org/door-c',
        dataUrl: 'data:image/png;base64,...',
        isActive: true 
      },
      mockSet,
      7
    );
    
    expect(result.isActive).toBe(true);
  });

  it('defaults to set isActive=false when JSON omits field and set is inactive', () => {
    const inactiveSet = { ...mockSet, isActive: false };
    const result = mapper.mapJsonToQRCode(
      { 
        id: 'qr-4', 
        label: 'Door D', 
        url: 'https://example.com/register/org/door-d',
        dataUrl: 'data:image/png;base64,...'
      },
      inactiveSet,
      0
    );
    
    expect(result.isActive).toBe(false);
  });

  it('uses registrationCount parameter for registrationCount field', () => {
    const result = mapper.mapJsonToQRCode(
      { 
        id: 'qr-5', 
        label: 'Door E', 
        url: 'https://example.com/register/org/door-e',
        dataUrl: 'data:image/png;base64,...'
      },
      mockSet,
      42
    );
    
    expect(result.registrationCount).toBe(42);
  });

  it('generates slug from label when slug is missing', () => {
    const result = mapper.mapJsonToQRCode(
      { 
        id: 'qr-6', 
        label: 'Main Entrance Door', 
        url: 'https://example.com/register/org/main',
        dataUrl: 'data:image/png;base64,...'
      },
      mockSet,
      0
    );
    
    expect(result.slug).toBe('main-entrance-door');
  });

  it('uses provided slug when present', () => {
    const result = mapper.mapJsonToQRCode(
      { 
        id: 'qr-7', 
        label: 'VIP Entrance', 
        slug: 'vip-custom-slug',
        url: 'https://example.com/register/org/vip',
        dataUrl: 'data:image/png;base64,...'
      },
      mockSet,
      0
    );
    
    expect(result.slug).toBe('vip-custom-slug');
  });
});
