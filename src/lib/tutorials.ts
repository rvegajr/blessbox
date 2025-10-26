import { Tutorial } from '@/hooks/useTutorial';

export const TUTORIALS: Record<string, Tutorial> = {
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard Tour',
    steps: [
      {
        element: '#dashboard-stats',
        popover: {
          title: 'Your Dashboard Stats',
          description: 'Here you can see your key metrics: total registrations, QR code scans, active QR codes, and recent activity.',
          side: 'bottom',
        },
      },
      {
        element: '#qr-codes-section',
        popover: {
          title: 'QR Code Management',
          description: 'View and manage all your QR code sets. You can create new sets, edit existing ones, or download QR codes for printing.',
          side: 'bottom',
        },
      },
      {
        element: '#recent-activity',
        popover: {
          title: 'Recent Activity',
          description: 'Track real-time activity including new registrations, QR code scans, and system events.',
          side: 'left',
        },
      },
      {
        element: '#quick-actions',
        popover: {
          title: 'Quick Actions',
          description: 'Use these buttons to quickly create new QR codes, build forms, view registrations, or manage settings.',
          side: 'top',
        },
      },
    ],
  },

  formBuilder: {
    id: 'form-builder',
    name: 'Form Builder Tutorial',
    steps: [
      {
        element: '#field-types',
        popover: {
          title: 'Available Field Types',
          description: 'Choose from text, email, phone, select, checkbox, radio, and textarea fields to build your registration form.',
          side: 'right',
        },
      },
      {
        element: '#form-preview',
        popover: {
          title: 'Live Preview',
          description: 'See exactly how your form will look to registrants as you build it. Changes appear in real-time.',
          side: 'left',
        },
      },
      {
        element: '#field-editor',
        popover: {
          title: 'Field Configuration',
          description: 'Click any field to edit its label, placeholder, and whether it\'s required. You can also reorder or delete fields.',
          side: 'bottom',
        },
      },
      {
        element: '#form-settings',
        popover: {
          title: 'Form Settings',
          description: 'Configure global settings like allowing multiple submissions, requiring email verification, and showing a progress bar.',
          side: 'top',
        },
      },
    ],
  },

  qrConfiguration: {
    id: 'qr-configuration',
    name: 'QR Code Configuration Tutorial',
    steps: [
      {
        element: '#qr-code-set-name',
        popover: {
          title: 'QR Code Set Name',
          description: 'Give your QR code set a descriptive name like "Main Event Registration" or "VIP Check-in".',
          side: 'bottom',
        },
      },
      {
        element: '#entry-point-selector',
        popover: {
          title: 'Entry Points',
          description: 'Choose the purpose of this QR code: Registration, Check-in, Survey, Feedback, or Custom. This helps you track different interactions.',
          side: 'bottom',
        },
      },
      {
        element: '#qr-code-list',
        popover: {
          title: 'Your QR Codes',
          description: 'Create multiple QR codes for different locations or purposes. Each can be toggled active/inactive and configured independently.',
          side: 'left',
        },
      },
      {
        element: '#qr-preview',
        popover: {
          title: 'QR Code Preview',
          description: 'See a live preview of your QR code. You can download it for printing or sharing once you\'re done.',
          side: 'left',
        },
      },
    ],
  },

  onboarding: {
    id: 'onboarding',
    name: 'Getting Started',
    steps: [
      {
        element: '#progress-indicator',
        popover: {
          title: 'Your Progress',
          description: 'Follow these 5 steps to complete your setup: Organization Setup, Email Verification, Form Builder, QR Configuration, and Complete!',
          side: 'bottom',
        },
      },
      {
        element: '#organization-form',
        popover: {
          title: 'Organization Details',
          description: 'Fill in your organization and event details. We\'ll use this information to personalize your registration experience.',
          side: 'bottom',
        },
      },
      {
        element: '#submit-button',
        popover: {
          title: 'Continue to Next Step',
          description: 'Once you\'ve filled in the required fields, click here to proceed to email verification.',
          side: 'top',
        },
      },
    ],
  },

  emailVerification: {
    id: 'email-verification',
    name: 'Email Verification Help',
    steps: [
      {
        element: '#verification-code-input',
        popover: {
          title: 'Enter Your Code',
          description: 'Check your email for a 6-digit verification code. Enter it here to verify your organization email.',
          side: 'bottom',
        },
      },
      {
        element: '#resend-code',
        popover: {
          title: 'Didn\'t Receive Code?',
          description: 'If you haven\'t received your code after a few minutes, click here to resend it. Check your spam folder too!',
          side: 'bottom',
        },
      },
      {
        element: '#help-section',
        popover: {
          title: 'Need Help?',
          description: 'Having trouble? Click here for common issues and troubleshooting tips.',
          side: 'left',
        },
      },
    ],
  },

  registrations: {
    id: 'registrations',
    name: 'Managing Registrations',
    steps: [
      {
        element: '#registrations-table',
        popover: {
          title: 'Registration Data',
          description: 'View all registrations with details like name, email, registration date, and QR code used.',
          side: 'bottom',
        },
      },
      {
        element: '#export-button',
        popover: {
          title: 'Export Data',
          description: 'Download your registration data as CSV or Excel for further analysis or record-keeping.',
          side: 'left',
        },
      },
      {
        element: '#filter-options',
        popover: {
          title: 'Filter & Search',
          description: 'Filter registrations by date, QR code set, or search for specific registrants.',
          side: 'bottom',
        },
      },
      {
        element: '#check-in-status',
        popover: {
          title: 'Check-in Status',
          description: 'See which registrants have checked in at your event. You can manually mark check-ins here too.',
          side: 'left',
        },
      },
    ],
  },
};

export function getTutorial(tutorialId: string): Tutorial | undefined {
  return TUTORIALS[tutorialId];
}
