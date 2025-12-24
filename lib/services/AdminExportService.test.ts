import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => {
  const execute = vi.fn();
  return {
    getDbClient: () => ({ execute }),
    nowIso: () => '2025-01-01T00:00:00.000Z',
  };
});

describe('AdminExportService (ISP + TDD)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('exportAllData returns snapshot with expected shape', async () => {
    const { getDbClient } = await import('@/lib/db');
    const db = getDbClient() as any;
    db.execute
      .mockResolvedValueOnce({ rows: [{ id: 'org1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'sub1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'pay1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'coupon1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'red1' }] });

    const { AdminExportService } = await import('@/lib/services/AdminExportService');
    const svc = new AdminExportService();
    const out = await svc.exportAllData('admin@example.com');

    expect(out.scope).toBe('all');
    expect(out.exportedBy).toBe('admin@example.com');
    expect(out.exportedAt).toBe('2025-01-01T00:00:00.000Z');
    expect(out.organizations).toEqual([{ id: 'org1' }]);
    expect(out.subscriptions).toEqual([{ id: 'sub1' }]);
    expect(out.payments).toEqual([{ id: 'pay1' }]);
    expect(out.coupons).toEqual([{ id: 'coupon1' }]);
    expect(out.redemptions).toEqual([{ id: 'red1' }]);
  });

  it('exportOrganizationData scopes data to organizationId', async () => {
    const { getDbClient } = await import('@/lib/db');
    const db = getDbClient() as any;
    db.execute
      .mockResolvedValueOnce({ rows: [{ id: 'orgX' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'subX', organization_id: 'orgX' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'payX', organization_id: 'orgX' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'coupon1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'redX', organization_id: 'orgX', coupon_code: 'FREE100' }] });

    const { AdminExportService } = await import('@/lib/services/AdminExportService');
    const svc = new AdminExportService();
    const out = await svc.exportOrganizationData('orgX', 'admin@example.com');

    expect(out.scope).toBe('organization');
    expect(out.organizationId).toBe('orgX');
    expect(out.organizations).toEqual([{ id: 'orgX' }]);
    expect(out.subscriptions[0].organization_id).toBe('orgX');
    expect(out.payments[0].organization_id).toBe('orgX');
    expect(out.redemptions[0].organization_id).toBe('orgX');
  });
});

