/**
 * Global Test Setup
 * 
 * Sets up the test environment before running E2E tests
 * Includes database seeding, user creation, and environment preparation
 */

import { chromium, FullConfig } from '@playwright/test'
import { db } from '@/lib/database/connection'
import { organizations, users, userOrganizations } from '@/lib/database/schema'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...')

  // Start browser for setup tasks
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // 1. Database Setup
    console.log('📊 Setting up test database...')
    await setupTestDatabase()

    // 2. Create test users and organizations
    console.log('👥 Creating test users and organizations...')
    await createTestData()

    // 3. Verify application is running
    console.log('🌐 Verifying application is running...')
    await page.goto('http://localhost:7777')
    await page.waitForLoadState('networkidle')
    
    const title = await page.title()
    if (!title.includes('BlessBox')) {
      throw new Error('Application not running or not accessible')
    }

    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function setupTestDatabase() {
  try {
    // This would typically run database migrations
    // For now, we'll just verify the connection
    console.log('🔗 Testing database connection...')
    
    // Test a simple query
    const result = await db.select().from(organizations).limit(1)
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  }
}

async function createTestData() {
  try {
    // Create test organization
    const [testOrg] = await db.insert(organizations).values({
      name: 'Test Organization',
      slug: 'test-org',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning()

    // Create test user
    const [testUser] = await db.insert(users).values({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning()

    // Associate user with organization
    await db.insert(userOrganizations).values({
      userEmail: testUser.email,
      organizationId: testOrg.id,
      role: 'admin',
      joinedAt: new Date().toISOString()
    })

    console.log('✅ Test data created successfully')
  } catch (error) {
    console.error('❌ Test data creation failed:', error)
    throw error
  }
}

export default globalSetup

