/**
 * Global Test Teardown
 * 
 * Cleans up the test environment after running E2E tests
 * Includes database cleanup and resource disposal
 */

import { FullConfig } from '@playwright/test'
import { db } from '@/lib/database/connection'
import { organizations, users, userOrganizations, qrCodeSets, registrations, qrScans } from '@/lib/database/schema'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...')

  try {
    // Clean up test data
    console.log('🗑️ Cleaning up test data...')
    await cleanupTestData()

    // Database connections are automatically managed for SQLite
    console.log('🔌 Database connections managed automatically')

    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  }
}

async function cleanupTestData() {
  try {
    // Delete test data in reverse order of dependencies
    await db.delete(qrScans)
    await db.delete(registrations)
    await db.delete(qrCodeSets)
    await db.delete(userOrganizations)
    await db.delete(users)
    await db.delete(organizations)

    console.log('✅ Test data cleaned up successfully')
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error)
    // Continue with teardown even if cleanup fails
  }
}

export default globalTeardown

