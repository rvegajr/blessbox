// IAdminExportService - Interface Segregation Principle Compliant
// Single responsibility: exporting admin/org data snapshots

export interface ExportDataSnapshot {
  organizations: any[];
  subscriptions: any[];
  payments: any[];
  coupons: any[];
  redemptions: any[];
  exportedAt: string;
  exportedBy: string;
  scope: 'all' | 'organization';
  organizationId?: string;
}

export interface IAdminExportService {
  exportOrganizationData(organizationId: string, exportedBy: string): Promise<ExportDataSnapshot>;
  exportAllData(exportedBy: string): Promise<ExportDataSnapshot>;
}

