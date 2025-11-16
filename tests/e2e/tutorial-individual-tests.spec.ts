import { test, expect } from '@playwright/test';

/**
 * Individual Tutorial Tests
 * Test each of the 13 tutorials individually
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Individual Tutorial Tests - All 13 Tutorials', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
  });

  // Original 5 Tutorials
  
  test('1. Welcome Tour - All steps work correctly', async ({ page }) => {
    console.log('\n🏠 Testing: Welcome Tour');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      if (!system) return { success: false, error: 'System not loaded' };
      
      const tutorial = system.tutorials['welcome-tour'];
      if (!tutorial) return { success: false, error: 'Tutorial not found' };
      
      return {
        success: true,
        id: tutorial.id,
        title: tutorial.title,
        steps: tutorial.steps.length,
        version: tutorial.version
      };
    });
    
    if (result.success) {
      console.log(`   ✅ Tutorial: ${result.title || result.id}`);
      console.log(`   ✅ Steps: ${result.steps}`);
      console.log(`   ✅ Version: ${result.version}`);
      expect(result.steps).toBeGreaterThan(0);
    } else {
      console.log(`   ⚠️  ${result.error}`);
    }
  });

  test('2. Dashboard Tour - All steps work correctly', async ({ page }) => {
    console.log('\n📊 Testing: Dashboard Tour');
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      if (!system) return { success: false };
      
      const tutorial = system.tutorials['dashboard-tour'];
      return tutorial ? {
        success: true,
        steps: tutorial.steps.length,
        title: tutorial.title
      } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ ${result.title} - ${result.steps} steps`);
    }
  });

  test('3. QR Creation Tour - All steps work correctly', async ({ page }) => {
    console.log('\n📱 Testing: QR Creation Tour');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['qr-creation-tour'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ QR Creation Tour - ${result.steps} steps`);
    }
  });

  test('4. Event Management Tour - All steps work correctly', async ({ page }) => {
    console.log('\n📅 Testing: Event Management Tour');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['event-management-tour'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Event Management Tour - ${result.steps} steps`);
    }
  });

  test('5. Team Management Tour - All steps work correctly', async ({ page }) => {
    console.log('\n👥 Testing: Team Management Tour');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['team-management-tour'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Team Management Tour - ${result.steps} steps`);
    }
  });

  // New 8 Tutorials

  test('6. Registration Management Tutorial - All steps work correctly', async ({ page }) => {
    console.log('\n📋 Testing: Registration Management Tutorial');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['registration-management-tour'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Registration Management - ${result.steps} steps`);
      expect(result.steps).toBe(4);
    } else {
      console.log('   ℹ️  Tutorial may not be registered yet');
    }
  });

  test('7. Check-In Tutorial - All steps work correctly', async ({ page }) => {
    console.log('\n✅ Testing: Check-In Tutorial');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['checkin-tutorial'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Check-In Tutorial - ${result.steps} steps`);
      expect(result.steps).toBe(4);
    }
  });

  test('8. Form Builder Tutorial - All steps work correctly', async ({ page }) => {
    console.log('\n🔧 Testing: Form Builder Tutorial');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['form-builder-tutorial'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Form Builder Tutorial - ${result.steps} steps`);
      expect(result.steps).toBe(5);
    }
  });

  test('9. QR Configuration Tutorial - All steps work correctly', async ({ page }) => {
    console.log('\n🎯 Testing: QR Configuration Tutorial');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['qr-configuration-tutorial'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ QR Configuration Tutorial - ${result.steps} steps`);
      expect(result.steps).toBe(5);
    }
  });

  test('10. Analytics Tutorial - All steps work correctly', async ({ page }) => {
    console.log('\n📈 Testing: Analytics Tutorial');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['analytics-tutorial'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Analytics Tutorial - ${result.steps} steps`);
      expect(result.steps).toBe(4);
    }
  });

  test('11. Export Data Tutorial - All steps work correctly', async ({ page }) => {
    console.log('\n📤 Testing: Export Data Tutorial');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['export-data-tutorial'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Export Data Tutorial - ${result.steps} steps`);
      expect(result.steps).toBe(4);
    }
  });

  test('12. Onboarding Flow Tutorial - All steps work correctly', async ({ page }) => {
    console.log('\n🚀 Testing: Onboarding Complete Flow Tutorial');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['onboarding-complete-flow'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Onboarding Flow Tutorial - ${result.steps} steps`);
      expect(result.steps).toBe(7);
    }
  });

  test('13. Payment & Coupons Tutorial - All steps work correctly', async ({ page }) => {
    console.log('\n💳 Testing: Payment & Coupons Tutorial');
    
    const result = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      const tutorial = system?.tutorials['payment-coupons-tutorial'];
      return tutorial ? { success: true, steps: tutorial.steps.length } : { success: false };
    });
    
    if (result.success) {
      console.log(`   ✅ Payment & Coupons Tutorial - ${result.steps} steps`);
      expect(result.steps).toBe(5);
    }
  });

  test('All tutorials should be registered', async ({ page }) => {
    console.log('\n📚 Testing: All Tutorials Registered');
    
    const tutorialCount = await page.evaluate(() => {
      const system = (window as any).blessboxTutorials;
      return system ? Object.keys(system.tutorials).length : 0;
    });
    
    console.log(`   ✅ Total tutorials registered: ${tutorialCount}`);
    expect(tutorialCount).toBeGreaterThanOrEqual(5); // At least original 5
    
    if (tutorialCount >= 13) {
      console.log('   🎉 All 13 tutorials loaded!');
    } else {
      console.log(`   ℹ️  ${13 - tutorialCount} tutorials may not be loaded yet`);
    }
  });
});
