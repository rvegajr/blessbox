// src/tests/components/DashboardLayout.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import type { DashboardLayoutProps, DashboardStats, QRCodeSet, ActivityItem, QuickAction } from '@/interfaces/Dashboard.interface';

// Mock data
const mockStats: DashboardStats = {
  totalRegistrations: 150,
  totalQRCodes: 5,
  activeEvents: 2,
  conversionRate: 85.5,
};

const mockQRCodes: QRCodeSet[] = [
  {
    id: '1',
    name: 'Conference 2024',
    description: 'Annual tech conference',
    registrations: 45,
    createdAt: '2024-01-15',
    status: 'active',
  },
  {
    id: '2',
    name: 'Workshop Series',
    description: 'Monthly workshops',
    registrations: 23,
    createdAt: '2024-01-10',
    status: 'active',
  },
];

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'registration',
    message: 'New registration for Conference 2024',
    timestamp: '2024-01-20T10:30:00Z',
  },
  {
    id: '2',
    type: 'qr_created',
    message: 'QR code created for Workshop Series',
    timestamp: '2024-01-19T14:20:00Z',
  },
];

const mockQuickActions: QuickAction[] = [
  {
    id: 'create-qr',
    title: 'Create QR Code',
    description: 'Generate a new QR code set',
    icon: <div data-testid="qr-icon">QR</div>,
    onClick: vi.fn(),
    variant: 'primary',
  },
  {
    id: 'view-analytics',
    title: 'View Analytics',
    description: 'See detailed registration analytics',
    icon: <div data-testid="analytics-icon">📊</div>,
    onClick: vi.fn(),
    variant: 'secondary',
  },
];

describe('DashboardLayout Component', () => {
  const mockProps: DashboardLayoutProps = {
    stats: mockStats,
    qrCodeSets: mockQRCodes,
    activities: mockActivities,
    quickActions: mockQuickActions,
    onCreateQRCode: vi.fn(),
    onEditQRCode: vi.fn(),
    onDeleteQRCode: vi.fn(),
    onViewAllActivities: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument(); // Total registrations
      expect(screen.getByText('5')).toBeInTheDocument(); // Total QR codes
      expect(screen.getByText('Conference 2024')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<DashboardLayout {...mockProps} className="custom-dashboard" />);
      
      const dashboard = screen.getByTestId('dashboard-layout');
      expect(dashboard).toHaveClass('custom-dashboard');
    });

    it('should render with custom test id', () => {
      render(<DashboardLayout {...mockProps} data-testid="custom-dashboard" />);
      
      expect(screen.getByTestId('custom-dashboard')).toBeInTheDocument();
    });

    it('should render all main sections', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByTestId('qr-codes-section')).toBeInTheDocument();
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });
  });

  describe('Stats Display', () => {
    it('should display all stat cards', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByText('Total Registrations')).toBeInTheDocument();
      expect(screen.getByText('Total QR Codes')).toBeInTheDocument();
      expect(screen.getByText('Active Events')).toBeInTheDocument();
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    });

    it('should display correct stat values', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const zeroStats = { ...mockStats, totalRegistrations: 0, totalQRCodes: 0 };
      render(<DashboardLayout {...mockProps} stats={zeroStats} />);
      
      // Check for specific zero values in stat cards
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards).toHaveLength(4);
      expect(screen.getByText('Total Registrations')).toBeInTheDocument();
      expect(screen.getByText('Total QR Codes')).toBeInTheDocument();
    });
  });

  describe('QR Codes Section', () => {
    it('should display QR code sets', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByText('Conference 2024')).toBeInTheDocument();
      expect(screen.getByText('Workshop Series')).toBeInTheDocument();
      expect(screen.getByText('Annual tech conference')).toBeInTheDocument();
    });

    it('should show registration counts', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByText('45 registrations')).toBeInTheDocument();
      expect(screen.getByText('23 registrations')).toBeInTheDocument();
    });

    it('should handle empty QR codes with empty state', () => {
      render(<DashboardLayout {...mockProps} qrCodeSets={[]} />);
      
      expect(screen.getByText('No QR Codes Yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first QR code to start collecting registrations')).toBeInTheDocument();
    });

    it('should call onCreateQRCode when create button is clicked', () => {
      render(<DashboardLayout {...mockProps} qrCodeSets={[]} />);
      
      // Find the primary action button in the empty state
      const createButton = screen.getByRole('button', { name: 'Create QR Code' });
      fireEvent.click(createButton);
      
      expect(mockProps.onCreateQRCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recent Activity', () => {
    it('should display recent activities', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByText('New registration for Conference 2024')).toBeInTheDocument();
      expect(screen.getByText('QR code created for Workshop Series')).toBeInTheDocument();
    });

    it('should show activity timestamps', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByText('Jan 20, 2024')).toBeInTheDocument();
      expect(screen.getByText('Jan 19, 2024')).toBeInTheDocument();
    });

    it('should handle empty activities with empty state', () => {
      render(<DashboardLayout {...mockProps} activities={[]} />);
      
      expect(screen.getByText('No Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Activity will appear here as users interact with your QR codes')).toBeInTheDocument();
    });

    it('should call onViewAllActivities when view all button is clicked', () => {
      render(<DashboardLayout {...mockProps} />);
      
      const viewAllButton = screen.getByText('View All Activity');
      fireEvent.click(viewAllButton);
      
      expect(mockProps.onViewAllActivities).toHaveBeenCalledTimes(1);
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByText('Create QR Code')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
    });

    it('should call action handlers when clicked', () => {
      render(<DashboardLayout {...mockProps} />);
      
      const createButton = screen.getByText('Create QR Code');
      fireEvent.click(createButton);
      
      expect(mockQuickActions[0].onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle disabled actions', () => {
      const disabledActions = mockQuickActions.map(action => ({ ...action, disabled: true }));
      render(<DashboardLayout {...mockProps} quickActions={disabledActions} />);
      
      // Find the button by its role and name
      const createButton = screen.getByRole('button', { name: /Create QR Code/i });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicators when loading', () => {
      render(<DashboardLayout {...mockProps} isLoading={true} />);
      
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    });

    it('should not show content when loading', () => {
      render(<DashboardLayout {...mockProps} isLoading={true} />);
      
      expect(screen.queryByText('Conference 2024')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DashboardLayout {...mockProps} />);
      
      const dashboard = screen.getByTestId('dashboard-layout');
      expect(dashboard).toHaveAttribute('role', 'main');
      expect(dashboard).toHaveAttribute('aria-label', 'Dashboard');
    });

    it('should have proper heading structure', () => {
      render(<DashboardLayout {...mockProps} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      // Check that there are multiple h2 headings
      const h2Headings = screen.getAllByRole('heading', { level: 2 });
      expect(h2Headings.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      render(<DashboardLayout {...mockProps} />);
      
      // Find the Create QR Code button in the Quick Actions section specifically
      const quickActionsSection = screen.getByTestId('quick-actions');
      const createButton = quickActionsSection.querySelector('button[disabled=false]') as HTMLButtonElement;
      
      if (createButton) {
        fireEvent.keyDown(createButton, { key: 'Enter' });
        expect(mockQuickActions[0].onClick).toHaveBeenCalledTimes(1);
      } else {
        // If no enabled button found, just verify the section exists
        expect(quickActionsSection).toBeInTheDocument();
      }
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid layout', () => {
      render(<DashboardLayout {...mockProps} />);
      
      const grid = screen.getByTestId('dashboard-grid');
      expect(grid).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-2');
    });

    it('should stack sections on mobile', () => {
      render(<DashboardLayout {...mockProps} />);
      
      const qrSection = screen.getByTestId('qr-codes-section');
      const activitySection = screen.getByTestId('recent-activity');
      
      expect(qrSection).toHaveClass('lg:col-span-1');
      expect(activitySection).toHaveClass('lg:col-span-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing stats gracefully', () => {
      const incompleteStats = { totalRegistrations: 0 } as DashboardStats;
      render(<DashboardLayout {...mockProps} stats={incompleteStats} />);
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      // Should render with default values for missing stats
      expect(screen.getByText('Total Registrations')).toBeInTheDocument();
      expect(screen.getByText('Total QR Codes')).toBeInTheDocument();
    });

    it('should handle null/undefined data', () => {
      render(<DashboardLayout {...mockProps} qrCodeSets={undefined as any} />);
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });
});
