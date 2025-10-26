import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...')
  
  // Start browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for application to be ready
    console.log('⏳ Waiting for application to be ready...')
    await page.goto('http://localhost:7777', { waitUntil: 'networkidle' })
    
    // Verify application is running
    const title = await page.title()
    if (!title.includes('BlessBox')) {
      throw new Error('Application not ready or incorrect title')
    }
    
    console.log('✅ Application is ready for testing')
    
    // Seed test data if needed
    console.log('🌱 Seeding test data...')
    await seedTestData(page)
    
    console.log('✅ Global setup completed successfully')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function seedTestData(page: any) {
  try {
    // Navigate to seed endpoint
    await page.goto('http://localhost:7777/api/seed', { waitUntil: 'networkidle' })
    
    // Check if seeding was successful
    const response = await page.waitForResponse('**/api/seed')
    if (response.status() !== 200) {
      throw new Error(`Seeding failed with status ${response.status()}`)
    }
    
    console.log('✅ Test data seeded successfully')
    
  } catch (error) {
    console.warn('⚠️ Test data seeding failed, continuing with existing data:', error)
  }
}

export default globalSetup


