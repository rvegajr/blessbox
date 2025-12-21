/**
 * BlessBox Context-Aware Tutorial Triggers
 * Smart triggers that respond to user behavior
 */

// Wait for context system to be available
(function() {
  function registerTriggers() {
    if (typeof window === 'undefined' || !window.contextTutorials) {
      setTimeout(registerTriggers, 500);
      return;
    }

    const ctx = window.contextTutorials;

    // Trigger 1: No QR codes created after 24 hours
    ctx.registerTrigger({
      id: 'no-qr-codes-24h',
      name: 'No QR Codes After 24 Hours',
      priority: 15,
      maxShows: 3,
      cooldown: 24, // hours
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const registeredAt = localStorage.getItem('user_registered_at');
        if (!registeredAt) return false;
        
        const hoursSince = (Date.now() - parseInt(registeredAt)) / (1000 * 60 * 60);
        if (hoursSince < 24) return false;
        
        // Check if any QR codes exist in dashboard
        const qrCount = document.querySelectorAll('[data-qr-code], .qr-code-item').length;
        return qrCount === 0;
      },
      tutorial: 'qr-creation-tour'
    });

    // Trigger 2: No registrations after 7 days
    ctx.registerTrigger({
      id: 'no-registrations-7d',
      name: 'No Registrations After QR Creation',
      priority: 12,
      maxShows: 2,
      cooldown: 168, // 7 days in hours
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const qrCreatedAt = localStorage.getItem('first_qr_created_at');
        if (!qrCreatedAt) return false;
        
        const hoursSince = (Date.now() - parseInt(qrCreatedAt)) / (1000 * 60 * 60);
        if (hoursSince < 168) return false; // 7 days
        
        const regCount = document.querySelectorAll('[data-registration], .registration-row').length;
        return regCount === 0;
      },
      tutorial: 'welcome-tour' // Guide them back to basics
    });

    // Trigger 3: Never exported data (5+ dashboard views)
    ctx.registerTrigger({
      id: 'never-exported-data',
      name: 'Power User Who Never Exported',
      priority: 10,
      maxShows: 1,
      cooldown: 72, // 3 days
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const dashboardViews = parseInt(localStorage.getItem('dashboard_view_count') || '0');
        const dataExports = parseInt(localStorage.getItem('data_export_count') || '0');
        
        return dashboardViews >= 5 && dataExports === 0;
      },
      tutorial: 'export-data-tutorial'
    });

    // Trigger 4: Incomplete onboarding
    ctx.registerTrigger({
      id: 'incomplete-onboarding',
      name: 'Incomplete Onboarding Flow',
      priority: 20,
      maxShows: 5,
      cooldown: 12, // 12 hours
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const onboardingStarted = localStorage.getItem('onboarding_started');
        const onboardingComplete = localStorage.getItem('onboarding_complete');
        
        if (!onboardingStarted || onboardingComplete) return false;
        
        const hoursSince = (Date.now() - parseInt(onboardingStarted)) / (1000 * 60 * 60);
        return hoursSince > 6 && hoursSince < 168; // Between 6 hours and 7 days
      },
      tutorial: 'onboarding-complete-flow'
    });

    // Trigger 5: First-time dashboard visit
    ctx.registerTrigger({
      id: 'first-dashboard-visit',
      name: 'First Dashboard Visit',
      priority: 25,
      maxShows: 1,
      cooldown: 0,
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const isDashboard = window.location.pathname.includes('/dashboard');
        const hasVisited = localStorage.getItem('visited_dashboard');
        
        if (isDashboard && !hasVisited) {
          localStorage.setItem('visited_dashboard', 'true');
          return true;
        }
        return false;
      },
      tutorial: 'dashboard-tour'
    });

    // Trigger 6: First-time form builder visit
    ctx.registerTrigger({
      id: 'first-form-builder-visit',
      name: 'First Form Builder Visit',
      priority: 25,
      maxShows: 1,
      cooldown: 0,
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const isFormBuilder = window.location.pathname.includes('/form-builder');
        const hasVisited = localStorage.getItem('visited_form_builder');
        
        if (isFormBuilder && !hasVisited) {
          localStorage.setItem('visited_form_builder', 'true');
          return true;
        }
        return false;
      },
      tutorial: 'form-builder-tutorial'
    });

    // Trigger 7: Pending check-ins accumulating
    ctx.registerTrigger({
      id: 'many-pending-checkins',
      name: 'Many Pending Check-Ins',
      priority: 18,
      maxShows: 5,
      cooldown: 1, // 1 hour
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const pendingCount = document.querySelectorAll('[data-status="pending"], .status-pending').length;
        return pendingCount > 20;
      },
      tutorial: 'checkin-tutorial'
    });

    // Trigger 8: Registration page but no form configured
    ctx.registerTrigger({
      id: 'viewing-registration-no-form',
      name: 'Viewing Registration Without Form',
      priority: 22,
      maxShows: 2,
      cooldown: 24,
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const isRegPage = window.location.pathname.includes('/register/');
        const hasFormConfig = localStorage.getItem('form_configured');
        
        return isRegPage && !hasFormConfig;
      },
      tutorial: 'form-builder-tutorial'
    });

    // Trigger 9: Checkout page first visit
    ctx.registerTrigger({
      id: 'first-checkout-visit',
      name: 'First Checkout/Payment Visit',
      priority: 25,
      maxShows: 1,
      cooldown: 0,
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const isCheckout = window.location.pathname.includes('/checkout');
        const hasVisited = localStorage.getItem('visited_checkout');
        
        if (isCheckout && !hasVisited) {
          localStorage.setItem('visited_checkout', 'true');
          return true;
        }
        return false;
      },
      tutorial: 'payment-coupons-tutorial'
    });

    // Trigger 10: QR codes page first visit
    ctx.registerTrigger({
      id: 'first-qr-page-visit',
      name: 'First QR Codes Page Visit',
      priority: 25,
      maxShows: 1,
      cooldown: 0,
      condition: () => {
        if (typeof window === 'undefined') return false;
        
        const isQRPage = window.location.pathname.includes('/qr-codes') || 
                         window.location.pathname.includes('/qr-configuration');
        const hasVisited = localStorage.getItem('visited_qr_page');
        
        if (isQRPage && !hasVisited) {
          localStorage.setItem('visited_qr_page', 'true');
          return true;
        }
        return false;
      },
      tutorial: 'qr-configuration-tutorial'
    });

    console.log('[BlessBox] Registered 10 context-aware triggers');
  }

  // Start registration when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerTriggers);
  } else {
    registerTriggers();
  }
})();
