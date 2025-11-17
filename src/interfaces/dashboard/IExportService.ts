/**
 * Export Service Interface - ISP Compliant
 * Handles ONLY data export operations
 */

export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  includeHeaders: boolean;
  columns?: string[]; // Specific columns to export
  fileName?: string;
}

export interface ExportFilters {
  qrCodeLabels?: string[];
  deliveryStatus?: ('pending' | 'delivered' | 'failed')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  customFields?: Record<string, any>;
  searchQuery?: string;
}

export interface ExportJob {
  id: string;
  organizationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: 'excel' | 'csv' | 'pdf';
  totalRecords: number;
  processedRecords: number;
  downloadUrl?: string;
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface ExportResult {
  success: boolean;
  jobId?: string;
  downloadUrl?: string;
  fileName: string;
  fileSize: number;
  recordCount: number;
  error?: string;
}

export interface ScheduledExport {
  id: string;
  organizationId: string;
  name: string;
  schedule: string; // Cron expression
  filters: ExportFilters;
  options: ExportOptions;
  emailRecipients: string[];
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
  createdAt: Date;
}

/**
 * Export Service - Focused ONLY on export operations
 * Following Interface Segregation Principle
 */
export interface IExportService {
  /**
   * Export registrations based on filters
   */
  exportRegistrations(
    organizationId: string,
    filters: ExportFilters,
    options: ExportOptions
  ): Promise<ExportResult>;

  /**
   * Get export job status
   */
  getExportJob(jobId: string): Promise<ExportJob | null>;

  /**
   * Get export history for an organization
   */
  getExportHistory(
    organizationId: string,
    limit?: number
  ): Promise<ExportJob[]>;

  /**
   * Download export file
   */
  downloadExport(jobId: string): Promise<Buffer>;

  /**
   * Delete export file
   */
  deleteExport(jobId: string): Promise<boolean>;

  /**
   * Create scheduled export
   */
  createScheduledExport(
    organizationId: string,
    name: string,
    schedule: string,
    filters: ExportFilters,
    options: ExportOptions,
    emailRecipients: string[]
  ): Promise<ScheduledExport>;

  /**
   * Get scheduled exports for an organization
   */
  getScheduledExports(organizationId: string): Promise<ScheduledExport[]>;

  /**
   * Update scheduled export
   */
  updateScheduledExport(
    id: string,
    updates: Partial<ScheduledExport>
  ): Promise<ScheduledExport | null>;

  /**
   * Delete scheduled export
   */
  deleteScheduledExport(id: string): Promise<boolean>;
}