/**
 * Organization Onboarding E2E Tests
 * 
 * Comprehensive tests for the multi-step onboarding process
 */

import { test, expect } from '@playwright/test'

test.describe('Organization Onboarding Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:7777')
  })

  test('Complete onboarding flow', async ({ page }) => {
    // Start onboarding
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Step 1: Organization setup
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.fill('input[name="organizationDescription"]', 'A test organization for BlessBox')

    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/email-verification/)

    // Step 2: Email verification
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/onboarding\/form-builder/)

    // Step 3: Form builder configuration
    await page.click('text=Add Text Field')
    await page.fill('input[placeholder="Field label"]', 'Full Name')
    await page.check('input[type="checkbox"][name="required"]')

    await page.click('text=Add Email Field')
    await page.fill('input[placeholder="Field label"]', 'Email Address')
    await page.check('input[type="checkbox"][name="required"]')

    await page.click('text=Add Phone Field')
    await page.fill('input[placeholder="Field label"]', 'Phone Number')

    await page.click('button:has-text("Save Form")')
    await expect(page).toHaveURL(/.*\/onboarding\/qr-configuration/)

    // Step 4: QR configuration
    await page.fill('input[name="qrSetName"]', 'Event Registration')
    await page.selectOption('select[name="language"]', 'en')
    await page.click('button:has-text("Generate QR Codes")')
    await expect(page).toHaveURL(/.*\/onboarding\/complete/)

    // Step 5: Onboarding completion
    await expect(page.locator('text=Onboarding Complete')).toBeVisible()
    await page.click('button:has-text("Go to Dashboard")')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Step validation and error handling', async ({ page }) => {
    // Start onboarding
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next Step")')
    
    // Verify validation errors
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Organization name is required')).toBeVisible()
  })

  test('Progress indicator functionality', async ({ page }) => {
    // Start onboarding
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Verify progress indicator shows step 1
    await expect(page.locator('text=Step 1 of 5')).toBeVisible()
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible()

    // Complete step 1
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.click('button:has-text("Next Step")')

    // Verify progress indicator shows step 2
    await expect(page.locator('text=Step 2 of 5')).toBeVisible()
  })

  test('Back navigation between steps', async ({ page }) => {
    // Start onboarding and complete step 1
    await page.click('text=Get Started')
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.click('button:has-text("Next Step")')

    // Go to step 2
    await expect(page).toHaveURL(/.*\/onboarding\/email-verification/)

    // Click back button
    await page.click('button:has-text("Back")')
    
    // Should return to step 1
    await expect(page).toHaveURL(/.*\/auth\/register/)
    
    // Verify data is preserved
    await expect(page.locator('input[name="name"]')).toHaveValue('John Doe')
    await expect(page.locator('input[name="email"]')).toHaveValue('john@testorg.com')
  })

  test('Email verification step', async ({ page }) => {
    // Complete step 1
    await page.click('text=Get Started')
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.click('button:has-text("Next Step")')

    // Verify email verification step
    await expect(page.locator('text=Check your email')).toBeVisible()
    await expect(page.locator('text=We sent a verification code to john@testorg.com')).toBeVisible()
    
    // Test invalid verification code
    await page.fill('input[name="verificationCode"]', '000000')
    await page.click('button[type="submit"]')
    
    // Verify error message
    await expect(page.locator('text=Invalid verification code')).toBeVisible()
    
    // Test valid verification code
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('button[type="submit"]')
    
    // Should proceed to next step
    await expect(page).toHaveURL(/.*\/onboarding\/form-builder/)
  })

  test('Form builder configuration', async ({ page }) => {
    // Navigate to form builder step
    await page.goto('http://localhost:7777/onboarding/form-builder')

    // Add text field
    await page.click('text=Add Text Field')
    await page.fill('input[placeholder="Field label"]', 'Full Name')
    await page.check('input[type="checkbox"][name="required"]')
    
    // Verify field appears in preview
    await expect(page.locator('text=Full Name')).toBeVisible()
    await expect(page.locator('input[placeholder="Full Name"]')).toBeVisible()

    // Add email field
    await page.click('text=Add Email Field')
    await page.fill('input[placeholder="Field label"]', 'Email Address')
    await page.check('input[type="checkbox"][name="required"]')

    // Add phone field
    await page.click('text=Add Phone Field')
    await page.fill('input[placeholder="Field label"]', 'Phone Number')

    // Test field reordering
    await page.dragTo('text=Phone Number', '[data-testid="form-preview"]')
    
    // Test field deletion
    await page.click('button[aria-label="Delete field"]')
    await expect(page.locator('text=Phone Number')).not.toBeVisible()

    // Save form
    await page.click('button:has-text("Save Form")')
    await expect(page).toHaveURL(/.*\/onboarding\/qr-configuration/)
  })

  test('QR configuration step', async ({ page }) => {
    // Navigate to QR configuration step
    await page.goto('http://localhost:7777/onboarding/qr-configuration')

    // Configure QR code set
    await page.fill('input[name="qrSetName"]', 'Event Registration')
    await page.selectOption('select[name="language"]', 'en')
    
    // Add QR codes
    await page.click('text=Add QR Code')
    await page.fill('input[placeholder="QR Code Label"]', 'Main Entrance')
    await page.fill('input[placeholder="Entry Point"]', '/main')

    await page.click('text=Add QR Code')
    await page.fill('input[placeholder="QR Code Label"]', 'VIP Entrance')
    await page.fill('input[placeholder="Entry Point"]', '/vip')

    // Preview QR codes
    await page.click('text=Preview QR Codes')
    await expect(page.locator('text=Main Entrance')).toBeVisible()
    await expect(page.locator('text=VIP Entrance')).toBeVisible()

    // Generate QR codes
    await page.click('button:has-text("Generate QR Codes")')
    await expect(page).toHaveURL(/.*\/onboarding\/complete/)
  })

  test('Onboarding completion', async ({ page }) => {
    // Navigate to completion step
    await page.goto('http://localhost:7777/onboarding/complete')

    // Verify completion message
    await expect(page.locator('text=Onboarding Complete')).toBeVisible()
    await expect(page.locator('text=Your organization is ready')).toBeVisible()
    
    // Verify summary information
    await expect(page.locator('text=Test Organization')).toBeVisible()
    await expect(page.locator('text=Event Registration')).toBeVisible()
    
    // Test dashboard navigation
    await page.click('button:has-text("Go to Dashboard")')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Data persistence between steps', async ({ page }) => {
    // Start onboarding
    await page.click('text=Get Started')
    
    // Fill step 1 data
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.fill('input[name="organizationDescription"]', 'A test organization')
    
    // Navigate to step 2
    await page.click('button:has-text("Next Step")')
    
    // Go back to step 1
    await page.click('button:has-text("Back")')
    
    // Verify data is preserved
    await expect(page.locator('input[name="name"]')).toHaveValue('John Doe')
    await expect(page.locator('input[name="email"]')).toHaveValue('john@testorg.com')
    await expect(page.locator('input[name="organizationName"]')).toHaveValue('Test Organization')
    await expect(page.locator('input[name="organizationDescription"]')).toHaveValue('A test organization')
  })

  test('Mobile onboarding flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Start onboarding
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Complete step 1 on mobile
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    
    // Verify mobile layout
    await expect(page.locator('text=Step 1 of 5')).toBeVisible()
    
    // Proceed to next step
    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/email-verification/)
  })

  test('Onboarding step validation', async ({ page }) => {
    // Test each step's validation
    
    // Step 1 validation
    await page.click('text=Get Started')
    await page.click('button:has-text("Next Step")')
    await expect(page.locator('text=Name is required')).toBeVisible()
    
    // Fill required fields
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    
    // Should proceed to next step
    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/email-verification/)
  })

  test('Onboarding cancellation', async ({ page }) => {
    // Start onboarding
    await page.click('text=Get Started')
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    
    // Click cancel
    await page.click('button:has-text("Cancel")')
    
    // Should return to homepage
    await expect(page).toHaveURL(/.*\/$/)
    
    // Verify homepage is displayed
    await expect(page.locator('text=Streamline Registration with')).toBeVisible()
  })

  test('Onboarding timeout handling', async ({ page }) => {
    // Start onboarding
    await page.click('text=Get Started')
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="organizationName"]', 'Test Organization')
    await page.click('button:has-text("Next Step")')
    
    // Wait for timeout (simulate long delay)
    await page.waitForTimeout(30000)
    
    // Verify timeout message
    await expect(page.locator('text=Session expired')).toBeVisible()
    
    // Verify redirect to homepage
    await page.click('button:has-text("Start Over")')
    await expect(page).toHaveURL(/.*\/$/)
  })
})
