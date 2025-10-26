/**
 * Complete User Journey E2E Tests
 * 
 * Comprehensive tests covering all user scenarios and workflows
 * Following TDD principles with real user interactions
 */

import { test, expect } from '@playwright/test'

test.describe('Complete User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:7777')
  })

  test('Organization Onboarding Complete Flow', async ({ page }) => {
    // 1. Start organization setup
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Fill personal information form (Step 1)
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="phone"]', '+1234567890')

    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/email-verification/)

    // 2. Email verification
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/onboarding\/form-builder/)

    // 3. Form builder configuration
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

    // 4. QR configuration
    await page.fill('input[name="qrSetName"]', 'Event Registration')
    await page.selectOption('select[name="language"]', 'en')
    await page.click('button:has-text("Generate QR Codes")')
    await expect(page).toHaveURL(/.*\/onboarding\/complete/)

    // 5. Onboarding completion
    await expect(page.locator('text=Onboarding Complete')).toBeVisible()
    await page.click('button:has-text("Go to Dashboard")')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('QR Code Creation and Management', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to QR codes
    await page.click('text=Create QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)

    // Create new QR code set
    await page.click('button:has-text("Create New QR Code Set")')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes\/create/)

    // Fill QR code set form
    await page.fill('input[name="name"]', 'Conference Registration')
    await page.selectOption('select[name="language"]', 'en')
    
    // Add form fields
    await page.click('text=Add Text Field')
    await page.fill('input[placeholder="Field label"]', 'Full Name')
    await page.check('input[type="checkbox"][name="required"]')

    await page.click('text=Add Email Field')
    await page.fill('input[placeholder="Field label"]', 'Email')
    await page.check('input[type="checkbox"][name="required"]')

    // Add QR codes
    await page.click('text=Add QR Code')
    await page.fill('input[placeholder="QR Code Label"]', 'Main Entrance')
    await page.fill('input[placeholder="Entry Point"]', '/main')

    await page.click('text=Add QR Code')
    await page.fill('input[placeholder="QR Code Label"]', 'VIP Entrance')
    await page.fill('input[placeholder="Entry Point"]', '/vip')

    // Save QR code set
    await page.click('button:has-text("Create QR Code Set")')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)

    // Verify QR code set was created
    await expect(page.locator('text=Conference Registration')).toBeVisible()
  })

  test('Mobile Registration Flow', async ({ page }) => {
    // Simulate mobile device
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to registration URL (this would be generated from QR code)
    await page.goto('http://localhost:7777/register/test-org/main')

    // Fill registration form
    await page.fill('input[name="field_full_name"]', 'Jane Smith')
    await page.fill('input[name="field_email"]', 'jane@example.com')
    await page.fill('input[name="field_phone"]', '+1234567890')

    // Submit registration
    await page.click('button:has-text("Complete Registration")')
    
    // Verify success message
    await expect(page.locator('text=Registration Successful')).toBeVisible()
  })

  test('Check-in System Workflow', async ({ page }) => {
    // Login as staff member
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to check-in interface
    await page.click('text=Check-in System')
    await expect(page).toHaveURL(/.*\/dashboard\/check-in/)

    // Manual check-in with token
    await page.fill('input[name="checkInToken"]', 'checkin_token_123')
    await page.click('button:has-text("Check In")')

    // Verify check-in success
    await expect(page.locator('text=Check-In Successful')).toBeVisible()
    
    // Verify it appears in recent check-ins
    await expect(page.locator('text=Jane Smith')).toBeVisible()
  })

  test('Analytics Dashboard Functionality', async ({ page }) => {
    // Login
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)

    // Verify analytics components are visible
    await expect(page.locator('text=Total Registrations')).toBeVisible()
    await expect(page.locator('text=Total Scans')).toBeVisible()
    await expect(page.locator('text=Conversion Rate')).toBeVisible()
    await expect(page.locator('text=Daily Registrations')).toBeVisible()

    // Test time range filter
    await page.click('button:has-text("7 Days")')
    await expect(page.locator('text=7 Days')).toHaveClass(/border-blue-500/)

    await page.click('button:has-text("30 Days")')
    await expect(page.locator('text=30 Days')).toHaveClass(/border-blue-500/)
  })

  test('Data Export Functionality', async ({ page }) => {
    // Login
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to export
    await page.click('text=Export Data')
    await expect(page).toHaveURL(/.*\/dashboard\/export/)

    // Configure export
    await page.check('input[value="registrations"]')
    await page.check('input[value="csv"]')
    await page.check('input[value="30d"]')

    // Start download
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export Data")')
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toContain('registrations')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('Form Builder Visual Interface', async ({ page }) => {
    // Login
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to form builder
    await page.click('text=Build Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)

    // Create new form
    await page.click('button:has-text("Create New Form")')
    await expect(page).toHaveURL(/.*\/dashboard\/forms\/create/)

    // Test drag and drop functionality
    const textField = page.locator('text=Text Input')
    const formArea = page.locator('[data-testid="form-builder-area"]')
    
    await textField.dragTo(formArea)
    await expect(page.locator('text=Text Field')).toBeVisible()

    // Configure field
    await page.fill('input[placeholder="Field label"]', 'Full Name')
    await page.check('input[type="checkbox"][name="required"]')

    // Test preview
    await page.click('text=Preview')
    await expect(page.locator('text=Full Name')).toBeVisible()
    await expect(page.locator('input[placeholder="Full Name"]')).toBeVisible()

    // Test settings
    await page.click('text=Settings')
    await page.check('input[type="checkbox"][name="requireEmailVerification"]')
    await page.check('input[type="checkbox"][name="showProgressBar"]')

    // Save form
    await page.click('button:has-text("Save Form")')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
  })

  test('Payment Integration Flow', async ({ page }) => {
    // Login
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@testorg.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to billing
    await page.click('text=Billing')
    await expect(page).toHaveURL(/.*\/dashboard\/billing/)

    // View subscription plans
    await expect(page.locator('text=Basic Plan')).toBeVisible()
    await expect(page.locator('text=Professional Plan')).toBeVisible()
    await expect(page.locator('text=Enterprise Plan')).toBeVisible()

    // Select a plan
    await page.click('button:has-text("Choose Professional")')
    await expect(page).toHaveURL(/.*\/dashboard\/billing\/checkout/)

    // Fill payment form
    await page.fill('input[name="cardNumber"]', '4111111111111111')
    await page.fill('input[name="expiryDate"]', '12/25')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="name"]', 'John Doe')

    // Apply coupon
    await page.fill('input[name="couponCode"]', 'WELCOME10')
    await page.click('button:has-text("Apply Coupon")')
    await expect(page.locator('text=Coupon Applied')).toBeVisible()

    // Complete payment
    await page.click('button:has-text("Subscribe Now")')
    await expect(page.locator('text=Payment Successful')).toBeVisible()
  })

  test('Multi-Organization User Access', async ({ page }) => {
    // Login with user who has access to multiple organizations
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'admin@multi-org.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Verify organization switcher is visible
    await expect(page.locator('text=Organization')).toBeVisible()
    
    // Switch organizations
    await page.click('select[name="organization"]')
    await page.selectOption('select[name="organization"]', 'org-2')
    
    // Verify dashboard updates
    await expect(page.locator('text=Organization 2')).toBeVisible()
  })

  test('Error Handling and Recovery', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('http://localhost:7777/dashboard')
    
    // Verify error message is shown
    await expect(page.locator('text=Network Error')).toBeVisible()
    await expect(page.locator('text=Retry')).toBeVisible()

    // Test retry functionality
    await page.unroute('**/api/**')
    await page.click('button:has-text("Retry")')
    
    // Verify recovery
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('Accessibility Compliance', async ({ page }) => {
    await page.goto('http://localhost:7777')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Verify focus indicators
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test screen reader compatibility
    await expect(page.locator('h1')).toHaveAttribute('role', 'heading')
    
    // Test color contrast (basic check)
    const button = page.locator('button:has-text("Get Started")')
    const buttonColor = await button.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    )
    expect(buttonColor).not.toBe('transparent')
  })

  test('Performance and Loading States', async ({ page }) => {
    // Test loading states
    await page.goto('http://localhost:7777/dashboard')
    
    // Verify loading indicators
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for content to load
    await page.waitForSelector('text=Total Registrations', { timeout: 10000 })
    
    // Verify loading indicators are gone
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
    
    // Test page load performance
    const startTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify page loads within reasonable time
    expect(loadTime).toBeLessThan(5000)
  })
})

