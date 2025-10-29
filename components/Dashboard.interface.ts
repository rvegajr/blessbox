// src/interfaces/Dashboard.interface.ts
import type { ReactNode } from 'react';

export interface DashboardStats {
  totalRegistrations: number;
  totalQRCodes: number;
  activeEvents: number;
  conversionRate: number;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export interface QRCodeSet {
  id: string;
  name: string;
  description?: string;
  registrations: number;
  createdAt: string;
  status: 'active' | 'inactive' | 'draft';
}

export interface QRCodeSetsListProps {
  qrCodeSets: QRCodeSet[];
  onCreateNew: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  className?: string;
  'data-testid'?: string;
}

export interface ActivityItem {
  id: string;
  type: 'registration' | 'qr_created' | 'qr_updated' | 'event_started' | 'event_ended';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RecentActivityProps {
  activities: ActivityItem[];
  onViewAll: () => void;
  isLoading?: boolean;
  className?: string;
  'data-testid'?: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
  'data-testid'?: string;
}

export interface DashboardLayoutProps {
  stats: DashboardStats;
  qrCodeSets: QRCodeSet[];
  activities: ActivityItem[];
  quickActions: QuickAction[];
  onCreateQRCode: () => void;
  onEditQRCode: (id: string) => void;
  onDeleteQRCode: (id: string) => void;
  onViewAllActivities: () => void;
  isLoading?: boolean;
  className?: string;
  'data-testid'?: string;
}

export interface DashboardHeaderProps {
  organizationName: string;
  userEmail: string;
  onSignOut: () => void;
  className?: string;
  'data-testid'?: string;
}
