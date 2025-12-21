import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test('DIAGNOSTIC: Check tutorial system step by step', async ({ page }) => {
  console.log('\n🔍 DIAGNOSTIC TEST - Checking Tutorial System');
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.text().includes('BlessBox') || msg.text().includes('Driver') || msg.text().includes('tutorial')) {
      console.log(`   [Browser Console] ${msg.type()}: ${msg.text()}`);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log(`   [Browser Error] ${error.message}`);
  });
  
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // Check what scripts loaded
  const scriptsLoaded = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[data-tutorial-system]'));
    return scripts.map(s => (s as HTMLScriptElement).src);
  });
  
  console.log('\n📜 Scripts Loaded:');
  scriptsLoaded.forEach(src => console.log(`   - ${src}`));
  
  await page.waitForTimeout(8000); // Wait longer for all scripts and Driver.js CDN
  
  // Step 1: Check if tutorial system loaded
  const step1 = await page.evaluate(() => {
    return {
      hasBlessBoxTutorials: typeof (window as any).blessboxTutorials !== 'undefined',
      hasContextTutorials: typeof (window as any).contextTutorials !== 'undefined',
      hasDriver: typeof (window as any).driver !== 'undefined',
      driverType: typeof (window as any).driver
    };
  });
  
  console.log('\n📊 Step 1: System Status');
  console.log(`   BlessBoxTutorials loaded: ${step1.hasBlessBoxTutorials}`);
  console.log(`   ContextTutorials loaded: ${step1.hasContextTutorials}`);
  console.log(`   Driver.js loaded: ${step1.hasDriver}`);
  
  if (!step1.hasBlessBoxTutorials) {
    console.log('   ❌ Tutorial system not loaded - check TutorialSystemLoader');
    return;
  }
  
  // Step 2: Check tutorial registration
  const step2 = await page.evaluate(() => {
    const system = (window as any).blessboxTutorials;
    const tutorials = system.tutorials || {};
    return {
      count: Object.keys(tutorials).length,
      ids: Object.keys(tutorials),
      welcomeTour: tutorials['welcome-tour'] ? {
        exists: true,
        steps: tutorials['welcome-tour'].steps.length,
        elements: tutorials['welcome-tour'].steps.map((s: any) => s.element)
      } : { exists: false }
    };
  });
  
  console.log('\n📚 Step 2: Tutorial Registration');
  console.log(`   Total tutorials: ${step2.count}`);
  console.log(`   Tutorial IDs: ${step2.ids.join(', ')}`);
  console.log(`   Welcome tour exists: ${step2.welcomeTour.exists}`);
  if (step2.welcomeTour.exists) {
    console.log(`   Welcome tour steps: ${step2.welcomeTour.steps}`);
    console.log(`   Welcome tour targets: ${step2.welcomeTour.elements.join(', ')}`);
  }
  
  // Step 3: Check if target elements exist
  const step3 = await page.evaluate(() => {
    const elements = [
      { id: '#welcome-section', exists: document.querySelector('#welcome-section') !== null },
      { id: '#create-org-btn', exists: document.querySelector('#create-org-btn') !== null },
      { id: '#dashboard-link', exists: document.querySelector('#dashboard-link') !== null }
    ];
    return elements;
  });
  
  console.log('\n🎯 Step 3: Target Elements');
  step3.forEach(el => {
    console.log(`   ${el.id}: ${el.exists ? '✅ EXISTS' : '❌ MISSING'}`);
  });
  
  // Step 4: Try to start tutorial
  const step4 = await page.evaluate(async () => {
    const system = (window as any).blessboxTutorials;
    if (!system) return { attempted: false, error: 'System not loaded' };
    
    try {
      const result = await system.startTutorial('welcome-tour', true);
      return {
        attempted: true,
        result: result,
        currentTutorial: system.currentTutorial !== null,
        hasDriver: typeof (window as any).driver !== 'undefined'
      };
    } catch (error) {
      return {
        attempted: true,
        error: error.message,
        hasDriver: typeof (window as any).driver !== 'undefined'
      };
    }
  });
  
  console.log('\n▶️  Step 4: Tutorial Start Attempt');
  console.log(`   Attempted: ${step4.attempted}`);
  console.log(`   Result: ${step4.result}`);
  console.log(`   Has Driver.js: ${step4.hasDriver}`);
  if (step4.error) {
    console.log(`   Error: ${step4.error}`);
  }
  if (step4.currentTutorial !== undefined) {
    console.log(`   Current tutorial set: ${step4.currentTutorial}`);
  }
  
  // Step 5: Check for Driver popover
  await page.waitForTimeout(3000);
  
  const step5 = await page.evaluate(() => {
    const popover = document.querySelector('.driver-popover');
    const overlay = document.querySelector('.driver-overlay');
    return {
      hasPopover: popover !== null,
      hasOverlay: overlay !== null,
      popoverClasses: popover?.className || 'none',
      bodyClasses: document.body.className
    };
  });
  
  console.log('\n🎨 Step 5: Driver UI Elements');
  console.log(`   Popover exists: ${step5.hasPopover}`);
  console.log(`   Overlay exists: ${step5.hasOverlay}`);
  console.log(`   Popover classes: ${step5.popoverClasses}`);
  
  console.log('\n' + '═'.repeat(70));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('═'.repeat(70));
});
