import { getDbClient, nowIso } from '@/lib/db';
import type { IAdminExportService, ExportDataSnapshot } from '@/lib/interfaces/IAdminExportService';

export class AdminExportService implements IAdminExportService {
  private db = getDbClient();

  async exportOrganizationData(organizationId: string, exportedBy: string): Promise<ExportDataSnapshot> {
    const exportedAt = nowIso();

    const [orgs, subs, payments, coupons, redemptions] = await Promise.all([
      this.db.execute({
        sql: `SELECT * FROM organizations WHERE id = ?`,
        args: [organizationId],
      }),
      this.db.execute({
        sql: `SELECT * FROM subscription_plans WHERE organization_id = ? ORDER BY created_at DESC`,
        args: [organizationId],
      }),
      this.db.execute({
        sql: `SELECT * FROM payment_transactions WHERE organization_id = ? ORDER BY created_at DESC`,
        args: [organizationId],
      }),
      this.db.execute({
        // coupons are global; include coupon_redemptions scoped to org below
        sql: `SELECT * FROM coupons ORDER BY created_at DESC`,
        args: [],
      }),
      this.db.execute({
        sql: `SELECT cr.*, c.code as coupon_code
              FROM coupon_redemptions cr
              JOIN coupons c ON c.id = cr.coupon_id
              WHERE cr.organization_id = ?
              ORDER BY cr.redeemed_at DESC`,
        args: [organizationId],
      }),
    ]);

    return {
      organizations: (orgs.rows as any[]) || [],
      subscriptions: (subs.rows as any[]) || [],
      payments: (payments.rows as any[]) || [],
      coupons: (coupons.rows as any[]) || [],
      redemptions: (redemptions.rows as any[]) || [],
      exportedAt,
      exportedBy,
      scope: 'organization',
      organizationId,
    };
  }

  async exportAllData(exportedBy: string): Promise<ExportDataSnapshot> {
    const exportedAt = nowIso();

    const [orgs, subs, payments, coupons, redemptions] = await Promise.all([
      this.db.execute({ sql: `SELECT * FROM organizations ORDER BY created_at DESC`, args: [] }),
      this.db.execute({ sql: `SELECT * FROM subscription_plans ORDER BY created_at DESC`, args: [] }),
      this.db.execute({ sql: `SELECT * FROM payment_transactions ORDER BY created_at DESC`, args: [] }),
      this.db.execute({ sql: `SELECT * FROM coupons ORDER BY created_at DESC`, args: [] }),
      this.db.execute({
        sql: `SELECT cr.*, c.code as coupon_code
              FROM coupon_redemptions cr
              JOIN coupons c ON c.id = cr.coupon_id
              ORDER BY cr.redeemed_at DESC`,
        args: [],
      }),
    ]);

    return {
      organizations: (orgs.rows as any[]) || [],
      subscriptions: (subs.rows as any[]) || [],
      payments: (payments.rows as any[]) || [],
      coupons: (coupons.rows as any[]) || [],
      redemptions: (redemptions.rows as any[]) || [],
      exportedAt,
      exportedBy,
      scope: 'all',
    };
  }
}

