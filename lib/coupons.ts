// CouponService - TDD Implementation
import { getDbClient, ensureSubscriptionSchema, nowIso } from './db';
import { ICouponService, CouponValidationResult, CouponCreate, CouponUpdate, Coupon, CouponAnalytics } from './interfaces/ICouponService';

export class CouponService implements ICouponService {
  private db = getDbClient();

  async ensureSchema(): Promise<void> {
    await ensureSubscriptionSchema();
    
    // Create coupons table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value REAL NOT NULL CHECK (discount_value > 0),
        currency TEXT DEFAULT 'USD' NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        max_uses INTEGER,
        current_uses INTEGER DEFAULT 0 NOT NULL,
        expires_at TEXT,
        applicable_plans TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_by TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Create coupon redemptions table
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS coupon_redemptions (
        id TEXT PRIMARY KEY,
        coupon_id TEXT NOT NULL REFERENCES coupons(id),
        user_id TEXT NOT NULL,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        subscription_id TEXT REFERENCES subscription_plans(id),
        original_amount REAL NOT NULL,
        discount_applied REAL NOT NULL,
        final_amount REAL NOT NULL,
        redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // Create indexes
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_redemptions_coupon ON coupon_redemptions(coupon_id)`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_redemptions_user ON coupon_redemptions(user_id)`);
  }

  async validateCoupon(code: string): Promise<CouponValidationResult> {
    await this.ensureSchema();
    
    const result = await this.db.execute({
      sql: `SELECT * FROM coupons WHERE code = ? AND active = 1`,
      args: [code.toUpperCase().trim()]
    });

    const coupon = (result.rows as any[])[0];
    
    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    if (coupon.active !== 1) {
      return { valid: false, error: 'Coupon is inactive' };
    }

    if (this.isExpired(coupon.expires_at)) {
      return { valid: false, error: 'Coupon has expired' };
    }

    if (this.isExhausted(coupon)) {
      return { valid: false, error: 'Coupon has reached maximum uses' };
    }

    return {
      valid: true,
      discount: {
        type: coupon.discount_type,
        value: coupon.discount_value,
        currency: coupon.currency
      }
    };
  }

  async applyCoupon(code: string, amount: number, planType: string): Promise<number> {
    const validation = await this.validateCoupon(code);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Check if applicable to plan
    if (coupon.applicablePlans) {
      const plans = Array.isArray(coupon.applicablePlans) ? coupon.applicablePlans : JSON.parse(coupon.applicablePlans);
      if (!plans.includes(planType)) {
        throw new Error('Coupon not applicable to this plan');
      }
    }

    let discountedAmount = amount;

    if (coupon.discountType === 'percentage') {
      discountedAmount = amount * (1 - coupon.discountValue / 100);
    } else {
      discountedAmount = amount - coupon.discountValue;
    }

    // Ensure minimum $1 (or $0 for 100% coupons)
    const minimumAmount = coupon.discountValue >= 100 ? 0 : 100;
    return Math.max(discountedAmount, minimumAmount);
  }

  async trackCouponUsage(
    code: string, 
    userId: string, 
    organizationId: string, 
    subscriptionId: string, 
    originalAmount: number, 
    discountApplied: number
  ): Promise<void> {
    await this.ensureSchema();

    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    const finalAmount = originalAmount - discountApplied;
    const redemptionId = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;

    // Record redemption
    await this.db.execute({
      sql: `INSERT INTO coupon_redemptions (
        id, coupon_id, user_id, organization_id, subscription_id,
        original_amount, discount_applied, final_amount, redeemed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [redemptionId, coupon.id, userId, organizationId, subscriptionId, originalAmount, discountApplied, finalAmount, nowIso()]
    });

    // Increment usage counter
    await this.db.execute({
      sql: `UPDATE coupons SET current_uses = current_uses + 1, updated_at = ? WHERE id = ?`,
      args: [nowIso(), coupon.id]
    });
  }

  async createCoupon(coupon: CouponCreate): Promise<Coupon> {
    await this.ensureSchema();

    const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
    const now = nowIso();

    await this.db.execute({
      sql: `INSERT INTO coupons (
        id, code, discount_type, discount_value, currency, active, max_uses,
        current_uses, expires_at, applicable_plans, created_at, created_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        coupon.code.toUpperCase().trim(),
        coupon.discountType,
        coupon.discountValue,
        coupon.currency || 'USD',
        1, // active
        coupon.maxUses || null,
        0, // current_uses
        coupon.expiresAt || null,
        coupon.applicablePlans ? JSON.stringify(coupon.applicablePlans) : null,
        now,
        coupon.createdBy,
        now
      ]
    });

    return this.getCoupon(id) as Promise<Coupon>;
  }

  async getCoupon(id: string): Promise<Coupon | null> {
    await this.ensureSchema();

    const result = await this.db.execute({
      sql: `SELECT * FROM coupons WHERE id = ?`,
      args: [id]
    });

    const row = (result.rows as any[])[0];
    return row ? this.mapRowToCoupon(row) : null;
  }

  async getCouponByCode(code: string): Promise<Coupon | null> {
    await this.ensureSchema();

    const result = await this.db.execute({
      sql: `SELECT * FROM coupons WHERE code = ?`,
      args: [code.toUpperCase().trim()]
    });

    const row = (result.rows as any[])[0];
    return row ? this.mapRowToCoupon(row) : null;
  }

  async updateCoupon(id: string, updates: CouponUpdate): Promise<Coupon> {
    await this.ensureSchema();

    const setClause = [];
    const args = [];

    if (updates.discountValue !== undefined) {
      setClause.push('discount_value = ?');
      args.push(updates.discountValue);
    }
    if (updates.maxUses !== undefined) {
      setClause.push('max_uses = ?');
      args.push(updates.maxUses);
    }
    if (updates.expiresAt !== undefined) {
      setClause.push('expires_at = ?');
      args.push(updates.expiresAt);
    }
    if (updates.applicablePlans !== undefined) {
      setClause.push('applicable_plans = ?');
      args.push(JSON.stringify(updates.applicablePlans));
    }
    if (updates.active !== undefined) {
      setClause.push('active = ?');
      args.push(updates.active ? 1 : 0);
    }

    setClause.push('updated_at = ?');
    args.push(nowIso());
    args.push(id);

    await this.db.execute({
      sql: `UPDATE coupons SET ${setClause.join(', ')} WHERE id = ?`,
      args
    });

    return this.getCoupon(id) as Promise<Coupon>;
  }

  async deactivateCoupon(id: string): Promise<void> {
    await this.updateCoupon(id, { active: false });
  }

  async listCoupons(filters?: { active?: boolean; createdBy?: string }): Promise<Coupon[]> {
    await this.ensureSchema();

    let sql = `SELECT * FROM coupons WHERE 1=1`;
    const args = [];

    if (filters?.active !== undefined) {
      sql += ` AND active = ?`;
      args.push(filters.active ? 1 : 0);
    }
    if (filters?.createdBy) {
      sql += ` AND created_by = ?`;
      args.push(filters.createdBy);
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await this.db.execute({ sql, args });
    return (result.rows as any[]).map(row => this.mapRowToCoupon(row));
  }

  async getCouponAnalytics(couponId?: string): Promise<CouponAnalytics> {
    await this.ensureSchema();

    let sql = `
      SELECT 
        COUNT(cr.id) as totalRedemptions,
        COALESCE(SUM(cr.discount_applied), 0) as totalDiscountGiven,
        COALESCE(AVG(cr.discount_applied), 0) as averageDiscount,
        COALESCE(COUNT(cr.id) * 1.0 / NULLIF(COUNT(DISTINCT c.id), 0), 0) as redemptionRate
      FROM coupons c
      LEFT JOIN coupon_redemptions cr ON c.id = cr.coupon_id
    `;
    const args = [];

    if (couponId) {
      sql += ` WHERE c.id = ?`;
      args.push(couponId);
    }

    const result = await this.db.execute({ sql, args });
    const analytics = (result.rows as any[])[0];

    // Get top users
    const topUsersSql = `
      SELECT 
        cr.user_id,
        COUNT(cr.id) as redemptions,
        SUM(cr.discount_applied) as totalDiscount
      FROM coupon_redemptions cr
      ${couponId ? 'WHERE cr.coupon_id = ?' : ''}
      GROUP BY cr.user_id
      ORDER BY redemptions DESC
      LIMIT 10
    `;
    const topUsersResult = await this.db.execute({
      sql: topUsersSql,
      args: couponId ? [couponId] : []
    });

    return {
      totalRedemptions: analytics.totalRedemptions || 0,
      totalDiscountGiven: analytics.totalDiscountGiven || 0,
      averageDiscount: analytics.averageDiscount || 0,
      redemptionRate: analytics.redemptionRate || 0,
      topUsers: (topUsersResult.rows as any[]).map(row => ({
        userId: row.user_id,
        redemptions: row.redemptions,
        totalDiscount: row.totalDiscount
      }))
    };
  }

  private isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  private isExhausted(coupon: any): boolean {
    if (!coupon.max_uses) return false; // Unlimited
    return coupon.current_uses >= coupon.max_uses;
  }

  private mapRowToCoupon(row: any): Coupon {
    return {
      id: row.id,
      code: row.code,
      discountType: row.discount_type,
      discountValue: row.discount_value,
      currency: row.currency,
      active: row.active === 1,
      maxUses: row.max_uses,
      currentUses: row.current_uses,
      expiresAt: row.expires_at,
      applicablePlans: row.applicable_plans ? JSON.parse(row.applicable_plans) : undefined,
      createdAt: row.created_at,
      createdBy: row.created_by,
      updatedAt: row.updated_at
    };
  }
}
