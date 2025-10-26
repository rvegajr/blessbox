import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...')
  
  // Start browser for cleanup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Clean up test data if needed
    console.log('🗑️ Cleaning up test data...')
    await cleanupTestData(page)
    
    console.log('✅ Global teardown completed successfully')
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid masking test results
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page: any) {
  try {
    // Navigate to cleanup endpoint if it exists
    await page.goto('http://localhost:7777/api/cleanup', { waitUntil: 'networkidle' })
    
    console.log('✅ Test data cleaned up successfully')
    
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed, continuing:', error)
  }
}

export default globalTeardown


