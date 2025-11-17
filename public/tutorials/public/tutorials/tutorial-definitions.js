/**
 * BlessBox Tutorial Definitions
 * Pre-configured tutorials for the BlessBox application
 */
/**
 * Tutorial Definitions
 * These are the actual tutorial content and steps
 */
export const tutorialDefinitions = [
    {
        id: 'welcome-tour',
        version: 1,
        title: 'Welcome Tour',
        description: 'Get started with BlessBox',
        dismissible: true,
        autoStart: false,
        steps: [
            {
                element: '#welcome-section',
                popover: {
                    title: 'Welcome to BlessBox!',
                    description: 'BlessBox helps you create beautiful QR code check-in experiences for your events and organizations.',
                    side: 'bottom'
                }
            },
            {
                element: '#create-org-btn',
                popover: {
                    title: 'Create Your Organization',
                    description: 'Start by creating your organization to manage events and QR codes.',
                    side: 'right'
                }
            },
            {
                element: '#dashboard-link',
                popover: {
                    title: 'Access Your Dashboard',
                    description: 'Once logged in, you\'ll find all your tools and analytics here.',
                    side: 'bottom'
                }
            }
        ]
    },
    {
        id: 'dashboard-tour',
        version: 1,
        title: 'Dashboard Tour',
        description: 'Learn about your dashboard',
        dismissible: true,
        autoStart: false,
        steps: [
            {
                element: '#stats-cards',
                popover: {
                    title: 'Your Statistics',
                    description: 'Track check-ins, active QR codes, and event performance at a glance.',
                    side: 'bottom'
                }
            },
            {
                element: '#recent-activity',
                popover: {
                    title: 'Recent Activity',
                    description: 'See the latest check-ins and events happening in real-time.',
                    side: 'left'
                }
            },
            {
                element: '#quick-actions',
                popover: {
                    title: 'Quick Actions',
                    description: 'Create new QR codes, manage events, or invite team members quickly.',
                    side: 'top'
                }
            }
        ]
    },
    {
        id: 'qr-creation-tour',
        version: 1,
        title: 'QR Creation Tour',
        description: 'Create your first QR code',
        dismissible: true,
        autoStart: false,
        steps: [
            {
                element: '#create-qr-btn',
                popover: {
                    title: 'Create QR Code',
                    description: 'Click here to create a new QR code for your event or organization.',
                    side: 'right'
                }
            },
            {
                element: '#qr-form',
                popover: {
                    title: 'QR Code Settings',
                    description: 'Configure your QR code with custom labels, expiration dates, and check-in requirements.',
                    side: 'bottom'
                }
            },
            {
                element: '#preview-section',
                popover: {
                    title: 'Preview & Test',
                    description: 'Preview your QR code and test the check-in flow before going live.',
                    side: 'left'
                }
            }
        ]
    },
    {
        id: 'event-management-tour',
        version: 1,
        title: 'Event Management Tour',
        description: 'Manage your events',
        dismissible: true,
        autoStart: false,
        steps: [
            {
                element: '#events-list',
                popover: {
                    title: 'Your Events',
                    description: 'Manage all your events, view analytics, and track check-in performance.',
                    side: 'right'
                }
            },
            {
                element: '#event-analytics',
                popover: {
                    title: 'Event Analytics',
                    description: 'See detailed insights about check-ins, peak times, and attendee behavior.',
                    side: 'bottom'
                }
            },
            {
                element: '#export-data',
                popover: {
                    title: 'Export Data',
                    description: 'Download check-in data, reports, and analytics for external analysis.',
                    side: 'left'
                }
            }
        ]
    },
    {
        id: 'team-management-tour',
        version: 1,
        title: 'Team Management Tour',
        description: 'Invite and manage team members',
        dismissible: true,
        autoStart: false,
        steps: [
            {
                element: '#team-section',
                popover: {
                    title: 'Team Management',
                    description: 'Invite team members, assign roles, and manage permissions for your organization.',
                    side: 'right'
                }
            },
            {
                element: '#invite-member-btn',
                popover: {
                    title: 'Invite Members',
                    description: 'Add new team members by sending them invitation emails with appropriate permissions.',
                    side: 'bottom'
                }
            },
            {
                element: '#permissions-settings',
                popover: {
                    title: 'Role Permissions',
                    description: 'Configure what each team member can access and modify in your organization.',
                    side: 'left'
                }
            }
        ]
    }
];
/**
 * Context-Aware Triggers
 * These trigger tutorials based on user behavior and application state
 */
export const contextTriggers = [
    {
        id: 'first-visit-welcome',
        name: 'First Visit Welcome',
        condition: () => {
            // Check if this is the user's first visit
            const visitCount = parseInt(localStorage.getItem('blessbox_visit_count') || '0');
            return visitCount === 0;
        },
        tutorial: 'welcome-tour',
        priority: 100,
        cooldown: 24, // 24 hours
        maxShows: 1,
        dismissible: true
    },
    {
        id: 'dashboard-empty-state',
        name: 'Dashboard Empty State Help',
        condition: () => {
            // Check if dashboard is empty (no QR codes, no events)
            const qrCount = document.querySelectorAll('[data-testid="qr-code-card"]').length;
            const eventCount = document.querySelectorAll('[data-testid="event-card"]').length;
            return qrCount === 0 && eventCount === 0 && window.location.pathname.includes('/dashboard');
        },
        tutorial: 'dashboard-tour',
        priority: 80,
        cooldown: 12, // 12 hours
        maxShows: 2,
        dismissible: true
    },
    {
        id: 'qr-creation-help',
        name: 'QR Creation Help',
        condition: () => {
            // Trigger when user clicks create QR button multiple times without success
            const clickCount = parseInt(localStorage.getItem('blessbox_qr_create_clicks') || '0');
            return clickCount >= 3 && window.location.pathname.includes('/qr/create');
        },
        tutorial: 'qr-creation-tour',
        priority: 70,
        cooldown: 6, // 6 hours
        maxShows: 1,
        dismissible: true
    },
    {
        id: 'event-management-help',
        name: 'Event Management Help',
        condition: () => {
            // Trigger when user has events but hasn't viewed analytics
            const hasEvents = document.querySelectorAll('[data-testid="event-card"]').length > 0;
            const viewedAnalytics = localStorage.getItem('blessbox_viewed_analytics') === 'true';
            return hasEvents && !viewedAnalytics && window.location.pathname.includes('/events');
        },
        tutorial: 'event-management-tour',
        priority: 60,
        cooldown: 8, // 8 hours
        maxShows: 1,
        dismissible: true
    },
    {
        id: 'team-invite-help',
        name: 'Team Invite Help',
        condition: () => {
            // Trigger when user tries to invite team members
            const inviteAttempts = parseInt(localStorage.getItem('blessbox_invite_attempts') || '0');
            return inviteAttempts >= 2 && window.location.pathname.includes('/team');
        },
        tutorial: 'team-management-tour',
        priority: 50,
        cooldown: 4, // 4 hours
        maxShows: 1,
        dismissible: true
    },
    {
        id: 'feature-discovery',
        name: 'Feature Discovery',
        condition: () => {
            // Trigger for users who haven't explored certain features
            const hasUsedQR = localStorage.getItem('blessbox_used_qr') === 'true';
            const hasUsedEvents = localStorage.getItem('blessbox_used_events') === 'true';
            const hasUsedAnalytics = localStorage.getItem('blessbox_used_analytics') === 'true';
            // Show if user has used basic features but not advanced ones
            return hasUsedQR && hasUsedEvents && !hasUsedAnalytics;
        },
        tutorial: 'event-management-tour',
        priority: 40,
        cooldown: 24, // 24 hours
        maxShows: 1,
        dismissible: true
    }
];
/**
 * Helper Functions for Tutorial Management
 */
export function initializeTutorials() {
    // Initialize context-independent tutorials
    if (typeof window !== 'undefined' && window.BlessBoxTutorials) {
        const tutorials = new window.BlessBoxTutorials();
        // Register all tutorial definitions
        tutorialDefinitions.forEach(tutorial => {
            tutorials.registerTutorial(tutorial.id, tutorial);
        });
        // Store reference globally
        window.blessboxTutorials = tutorials;
    }
    // Initialize context-aware tutorials
    if (typeof window !== 'undefined' && window.ContextAwareTutorials) {
        const contextTutorials = new window.ContextAwareTutorials();
        // Register all context triggers
        contextTriggers.forEach(trigger => {
            contextTutorials.registerTrigger(trigger);
        });
        // Store reference globally
        window.contextTutorials = contextTutorials;
    }
}
export function trackUserAction(action, data) {
    // Track user actions for context-aware triggers
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('appEvent', {
            detail: { type: action, data }
        });
        document.dispatchEvent(event);
    }
}
export function incrementVisitCount() {
    const count = parseInt(localStorage.getItem('blessbox_visit_count') || '0');
    localStorage.setItem('blessbox_visit_count', (count + 1).toString());
}
export function trackQRCreateClick() {
    const count = parseInt(localStorage.getItem('blessbox_qr_create_clicks') || '0');
    localStorage.setItem('blessbox_qr_create_clicks', (count + 1).toString());
}
export function trackInviteAttempt() {
    const count = parseInt(localStorage.getItem('blessbox_invite_attempts') || '0');
    localStorage.setItem('blessbox_invite_attempts', (count + 1).toString());
}
export function markFeatureUsed(feature) {
    localStorage.setItem(`blessbox_used_${feature}`, 'true');
}
export function markAnalyticsViewed() {
    localStorage.setItem('blessbox_viewed_analytics', 'true');
}
/**
 * Auto-initialize tutorials when this module is loaded
 */
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeTutorials();
            incrementVisitCount();
        });
    }
    else {
        initializeTutorials();
        incrementVisitCount();
    }
}
