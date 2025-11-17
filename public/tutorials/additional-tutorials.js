/**
 * Additional BlessBox Tutorial Definitions
 * 8 Critical Tutorials for Complete Feature Coverage
 */

export const additionalTutorials = [
  // Tutorial 6: Registration Management
  {
    id: 'registration-management-tour',
    version: 1,
    title: 'Managing Registrations',
    description: 'Learn how to view, filter, and manage your registrations',
    dismissible: true,
    autoStart: false,
    steps: [
      {
        element: '#registrations-table',
        popover: {
          title: 'Registrations Table',
          description: 'View all your event registrations in one place. Each row shows attendee details, registration time, and status.',
          side: 'top'
        }
      },
      {
        element: '#filter-section',
        popover: {
          title: 'Filter & Search',
          description: 'Filter registrations by status, date, or search by name/email to find specific attendees quickly.',
          side: 'right'
        }
      },
      {
        element: '#export-button',
        popover: {
          title: 'Export Data',
          description: 'Download your registrations as CSV or PDF for offline analysis and record-keeping.',
          side: 'left'
        }
      },
      {
        element: '#bulk-actions',
        popover: {
          title: 'Bulk Actions',
          description: 'Select multiple registrations to perform bulk check-ins or status updates.',
          side: 'bottom'
        }
      }
    ]
  },

  // Tutorial 7: Check-In Process
  {
    id: 'checkin-tutorial',
    version: 1,
    title: 'Check-In Process',
    description: 'Master the check-in workflow for your events',
    dismissible: true,
    autoStart: false,
    steps: [
      {
        element: '#checkin-scanner',
        popover: {
          title: 'QR Code Scanner',
          description: 'Use this scanner to quickly check people in by scanning their registration QR codes.',
          side: 'top'
        }
      },
      {
        element: '#manual-checkin',
        popover: {
          title: 'Manual Check-In',
          description: 'No QR code? Search by name or email to manually check someone in.',
          side: 'right'
        }
      },
      {
        element: '#checkin-status',
        popover: {
          title: 'Check-In Status',
          description: 'See real-time stats: who\'s checked in, who\'s pending, and attendance rate.',
          side: 'bottom'
        }
      },
      {
        element: '#checkin-history',
        popover: {
          title: 'Check-In History',
          description: 'View complete check-in history with timestamps and staff member who processed each check-in.',
          side: 'left'
        }
      }
    ]
  },

  // Tutorial 8: Form Builder
  {
    id: 'form-builder-tutorial',
    version: 1,
    title: 'Building Custom Forms',
    description: 'Create custom registration forms with drag-and-drop ease',
    dismissible: true,
    autoStart: false,
    steps: [
      {
        element: '#field-types-panel',
        popover: {
          title: 'Field Types',
          description: 'Choose from text, email, phone, select, checkbox, and more to collect the exact information you need.',
          side: 'right'
        }
      },
      {
        element: '#form-canvas',
        popover: {
          title: 'Form Canvas',
          description: 'Drag fields here to build your form. Reorder fields by dragging them up or down.',
          side: 'left'
        }
      },
      {
        element: '#field-properties',
        popover: {
          title: 'Field Properties',
          description: 'Configure each field: set labels, placeholders, validation rules, and whether it\'s required.',
          side: 'left'
        }
      },
      {
        element: '#form-preview',
        popover: {
          title: 'Live Preview',
          description: 'See exactly how your form will look to users as you build it.',
          side: 'top'
        }
      },
      {
        element: '#save-form-btn',
        popover: {
          title: 'Save Your Form',
          description: 'Click here to save your form and make it available for QR code registration.',
          side: 'top'
        }
      }
    ]
  },

  // Tutorial 9: QR Configuration
  {
    id: 'qr-configuration-tutorial',
    version: 1,
    title: 'QR Code Configuration',
    description: 'Set up multiple entry points with unique QR codes',
    dismissible: true,
    autoStart: false,
    steps: [
      {
        element: '#qr-set-name',
        popover: {
          title: 'QR Code Set Name',
          description: 'Give this set a name like "Holiday Food Drive 2025" to organize multiple events.',
          side: 'top'
        }
      },
      {
        element: '#entry-points-list',
        popover: {
          title: 'Entry Points',
          description: 'Create different QR codes for different doors, stations, or locations. Track which entry point each person used.',
          side: 'right'
        }
      },
      {
        element: '#add-entry-point-btn',
        popover: {
          title: 'Add Entry Point',
          description: 'Click to add a new entry point. Common examples: "Main Entrance", "Side Door", "VIP Entry".',
          side: 'bottom'
        }
      },
      {
        element: '#generate-qr-btn',
        popover: {
          title: 'Generate QR Codes',
          description: 'Generate all your QR codes at once. You\'ll get downloadable PDFs and PNGs for each entry point.',
          side: 'bottom'
        }
      },
      {
        element: '#qr-preview-grid',
        popover: {
          title: 'QR Code Preview',
          description: 'Preview all your QR codes before downloading. Test them by scanning with your phone.',
          side: 'top'
        }
      }
    ]
  },

  // Tutorial 10: Analytics Dashboard
  {
    id: 'analytics-tutorial',
    version: 1,
    title: 'Understanding Analytics',
    description: 'Make data-driven decisions with your event analytics',
    dismissible: true,
    autoStart: false,
    steps: [
      {
        element: '#key-metrics',
        popover: {
          title: 'Key Metrics',
          description: 'Track total registrations, check-ins, no-shows, and attendance rate at a glance.',
          side: 'bottom'
        }
      },
      {
        element: '#trends-chart',
        popover: {
          title: 'Registration Trends',
          description: 'See how registrations are trending over time. Spot patterns and plan better.',
          side: 'top'
        }
      },
      {
        element: '#entry-point-breakdown',
        popover: {
          title: 'Entry Point Analytics',
          description: 'See which entry points are most popular to optimize your event layout.',
          side: 'left'
        }
      },
      {
        element: '#export-analytics',
        popover: {
          title: 'Export Analytics',
          description: 'Download detailed reports for offline analysis or sharing with your team.',
          side: 'bottom'
        }
      }
    ]
  },

  // Tutorial 11: Export Data
  {
    id: 'export-data-tutorial',
    version: 1,
    title: 'Exporting Your Data',
    description: 'Download registration data in multiple formats',
    dismissible: true,
    autoStart: false,
    steps: [
      {
        element: '#export-button',
        popover: {
          title: 'Export Button',
          description: 'Click here to start the export process for your registration data.',
          side: 'left'
        }
      },
      {
        element: '#format-selector',
        popover: {
          title: 'Choose Format',
          description: 'Select CSV for spreadsheets, PDF for printable lists, or JSON for custom integrations.',
          side: 'bottom'
        }
      },
      {
        element: '#date-range-filter',
        popover: {
          title: 'Date Range',
          description: 'Filter exports by date range to get exactly the data period you need.',
          side: 'top'
        }
      },
      {
        element: '#download-button',
        popover: {
          title: 'Download',
          description: 'Click to download your filtered data. Files are ready instantly!',
          side: 'bottom'
        }
      }
    ]
  },

  // Tutorial 12: Onboarding Flow
  {
    id: 'onboarding-complete-flow',
    version: 1,
    title: 'Complete Onboarding Guide',
    description: 'Step-by-step walkthrough of the entire setup process',
    dismissible: true,
    autoStart: true, // Auto-start for new users
    steps: [
      {
        element: '#org-name-input',
        popover: {
          title: 'Organization Name',
          description: 'Enter your organization\'s name. This will appear on registration forms and QR codes.',
          side: 'top'
        }
      },
      {
        element: '#email-input',
        popover: {
          title: 'Contact Email',
          description: 'We\'ll send registration notifications and system updates to this email.',
          side: 'top'
        }
      },
      {
        element: '#submit-org-btn',
        popover: {
          title: 'Save Organization',
          description: 'Click to save your organization details and move to email verification.',
          side: 'bottom'
        }
      },
      {
        element: '#verification-code-input',
        popover: {
          title: 'Email Verification',
          description: 'Check your email for a 6-digit code and enter it here to verify your account.',
          side: 'top'
        }
      },
      {
        element: '#form-builder-section',
        popover: {
          title: 'Build Your Form',
          description: 'Create a custom registration form to collect the information you need from attendees.',
          side: 'bottom'
        }
      },
      {
        element: '#qr-config-section',
        popover: {
          title: 'Generate QR Codes',
          description: 'Create QR codes for different entry points. Print and post them at your event!',
          side: 'bottom'
        }
      },
      {
        element: '#complete-setup-btn',
        popover: {
          title: 'Complete Setup',
          description: 'You\'re all set! Click to finish setup and access your dashboard.',
          side: 'top'
        }
      }
    ]
  },

  // Tutorial 13: Payment & Coupons
  {
    id: 'payment-coupons-tutorial',
    version: 1,
    title: 'Payment Plans & Coupons',
    description: 'Understand pricing, plans, and how to apply discount coupons',
    dismissible: true,
    autoStart: false,
    steps: [
      {
        element: '#plan-selector',
        popover: {
          title: 'Choose Your Plan',
          description: 'Select from Free, Standard ($29/mo), or Enterprise ($99/mo) based on your event size.',
          side: 'top'
        }
      },
      {
        element: '#coupon-input',
        popover: {
          title: 'Apply Coupon Code',
          description: 'Have a discount code? Enter it here to save on your subscription. Try WELCOME25 for 25% off!',
          side: 'right'
        }
      },
      {
        element: '#price-summary',
        popover: {
          title: 'Price Summary',
          description: 'See your total with any discounts applied. Prices update in real-time as you apply coupons.',
          side: 'left'
        }
      },
      {
        element: '#payment-form',
        popover: {
          title: 'Secure Payment',
          description: 'Enter your payment details. We use Square for PCI-compliant, secure payment processing.',
          side: 'top'
        }
      },
      {
        element: '#subscribe-btn',
        popover: {
          title: 'Complete Subscription',
          description: 'Click to complete your subscription and unlock all features!',
          side: 'bottom'
        }
      }
    ]
  }
];

// Auto-register all tutorials when this script loads
if (typeof window !== 'undefined' && window.blessboxTutorials) {
  additionalTutorials.forEach(tutorial => {
    window.blessboxTutorials.registerTutorial(tutorial.id, tutorial);
  });
  console.log('[BlessBox] Registered 8 additional tutorials');
}
