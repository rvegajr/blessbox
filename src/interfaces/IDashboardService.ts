/**
 * Dashboard Service Interface
 * 
 * Defines the contract for dashboard analytics and management operations
 * following Interface Segregation Principle (ISP)
 */

export interface OrganizationStats {
  totalRegistrations: number;
  totalQRCodes: number;
  totalScans: number;
  activeUsers: number;
  conversionRate: number;
  averageCheckInTime: number;
  peakHour: number;
  growthRate: number;
}

export interface RegistrationTrend {
  date: string;
  registrations: number;
  checkIns: number;
  scans: number;
  conversionRate: number;
}

export interface Activity {
  id: string;
  type: 'registration' | 'scan' | 'checkin' | 'qr_created' | 'form_updated';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
  userId?: string;
  organizationId: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  permissions: string[];
  isEnabled: boolean;
}

export interface DashboardMetrics {
  registrations: MetricValue;
  scans: MetricValue;
  checkIns: MetricValue;
  conversionRate: MetricValue;
}

export interface MetricValue {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ExportResult {
  format: 'csv' | 'json' | 'pdf' | 'xlsx';
  data: Buffer;
  filename: string;
  size: number;
  createdAt: string;
}

export interface DashboardServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Dashboard Service Interface
 * 
 * Handles all dashboard-related operations including analytics,
 * reporting, and real-time data management.
 */
export interface IDashboardService {
  // Organization Analytics
  getOrganizationStats(orgId: string): Promise<DashboardServiceResult<OrganizationStats>>;
  getRegistrationTrends(orgId: string, timeRange?: TimeRange): Promise<DashboardServiceResult<RegistrationTrend[]>>;
  getRecentActivity(orgId: string, limit?: number): Promise<DashboardServiceResult<Activity[]>>;
  getQuickActions(orgId: string): Promise<DashboardServiceResult<QuickAction[]>>;
  
  // Real-time Metrics
  getLiveMetrics(orgId: string): Promise<DashboardServiceResult<DashboardMetrics>>;
  getRealTimeStats(orgId: string): Promise<DashboardServiceResult<RealTimeStats>>;
  subscribeToUpdates(orgId: string, callback: (update: DashboardUpdate) => void): Promise<string>;
  unsubscribeFromUpdates(subscriptionId: string): Promise<void>;
  
  // Data Export
  exportRegistrationData(orgId: string, format: ExportFormat, filters?: ExportFilters): Promise<DashboardServiceResult<ExportResult>>;
  exportAnalyticsData(orgId: string, format: ExportFormat, timeRange?: TimeRange): Promise<DashboardServiceResult<ExportResult>>;
  exportQRCodeData(orgId: string, format: ExportFormat, qrCodeSetId?: string): Promise<DashboardServiceResult<ExportResult>>;
  
  // Dashboard Customization
  getDashboardLayout(orgId: string): Promise<DashboardServiceResult<DashboardLayout>>;
  updateDashboardLayout(orgId: string, layout: DashboardLayout): Promise<DashboardServiceResult<void>>;
  getWidgetConfig(orgId: string, widgetId: string): Promise<DashboardServiceResult<WidgetConfig>>;
  updateWidgetConfig(orgId: string, widgetId: string, config: WidgetConfig): Promise<DashboardServiceResult<void>>;
  
  // Performance Monitoring
  getPerformanceMetrics(orgId: string, timeRange?: TimeRange): Promise<DashboardServiceResult<PerformanceMetrics>>;
  getSystemHealth(orgId: string): Promise<DashboardServiceResult<SystemHealth>>;
  getAlerts(orgId: string): Promise<DashboardServiceResult<Alert[]>>;
  
  // Data Insights
  getInsights(orgId: string, timeRange?: TimeRange): Promise<DashboardServiceResult<Insight[]>>;
  getRecommendations(orgId: string): Promise<DashboardServiceResult<Recommendation[]>>;
  getAnomalies(orgId: string, timeRange?: TimeRange): Promise<DashboardServiceResult<Anomaly[]>>;
}

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export interface RealTimeStats {
  activeUsers: number;
  currentRegistrations: number;
  currentScans: number;
  currentCheckIns: number;
  systemLoad: number;
  responseTime: number;
}

export interface DashboardUpdate {
  type: 'metric' | 'activity' | 'alert' | 'insight';
  data: any;
  timestamp: string;
}

export interface ExportFormat {
  type: 'csv' | 'json' | 'pdf' | 'xlsx';
  includeMetadata?: boolean;
  compression?: boolean;
}

export interface ExportFilters {
  dateRange?: TimeRange;
  status?: string[];
  searchQuery?: string;
  fields?: string[];
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  columns: number;
  theme: string;
  isDefault: boolean;
}

export interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'custom';
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  isVisible: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfig {
  dataSource: string;
  refreshInterval?: number;
  filters?: Record<string, any>;
  displayOptions?: Record<string, any>;
  customSettings?: Record<string, any>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  peakResponseTime: number;
  errorRate: number;
  throughput: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  services: ServiceHealth[];
  lastCheck: string;
  uptime: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  responseTime: number;
  lastCheck: string;
  error?: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  isRead: boolean;
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  action: string;
  isEnabled: boolean;
}

export interface Insight {
  id: string;
  type: 'trend' | 'anomaly' | 'recommendation' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timestamp: string;
  data?: Record<string, any>;
}

export interface Recommendation {
  id: string;
  category: 'performance' | 'optimization' | 'feature' | 'security';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  isImplemented: boolean;
}

export interface Anomaly {
  id: string;
  type: 'spike' | 'drop' | 'pattern' | 'outlier';
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
}

