// IAdminService - Interface Segregation Principle Compliant
// Single responsibility: Admin-specific operations and analytics

export interface SubscriptionFilters {
  status?: string;
  planType?: string;
  organizationId?: string;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  offset?: number;
}

export interface RevenueReport {
  period: {
    start: string;
    end: string;
  };
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  revenueByPlan: Array<{
    planType: string;
    revenue: number;
    count: number;
  }>;
}

export interface Refund {
  id: string;
  subscriptionId: string;
  amount: number;
  reason: string;
  processedAt: string;
  processedBy: string;
  squareRefundId?: string;
}

export interface AuditEntry {
  id: string;
  entityType: 'subscription' | 'organization' | 'coupon' | 'payment';
  entityId: string;
  action: string;
  details: Record<string, any>;
  performedBy: string;
  performedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ExportData {
  organizations: any[];
  subscriptions: any[];
  payments: any[];
  coupons: any[];
  redemptions: any[];
  exportedAt: string;
  exportedBy: string;
}

export interface IAdminService {
  // Subscription management
  listAllSubscriptions(filters?: SubscriptionFilters): Promise<any[]>;
  updateOrganizationPlan(organizationId: string, planId: string, reason?: string): Promise<void>;
  
  // Financial operations
  issueRefund(subscriptionId: string, amount: number, reason: string, processedBy: string): Promise<Refund>;
  getRevenueReports(dateRange: { start: string; end: string }): Promise<RevenueReport>;
  
  // Audit and compliance
  getAuditLog(entityId?: string, entityType?: string): Promise<AuditEntry[]>;
  logAuditEntry(entry: Omit<AuditEntry, 'id' | 'performedAt'>): Promise<void>;
  
  // Data export
  exportOrganizationData(organizationId: string, exportedBy: string): Promise<ExportData>;
  exportAllData(exportedBy: string): Promise<ExportData>;
}

