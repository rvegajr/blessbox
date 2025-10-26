/**
 * Mobile Responsiveness E2E Tests
 * 
 * Comprehensive tests for mobile and tablet responsiveness across all features
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile Responsiveness Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Mobile navigation and menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()
    
    // Test mobile menu toggle
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test mobile navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=QR Codes')).toBeVisible()
    await expect(page.locator('text=Forms')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
    
    // Test mobile navigation
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()
    
    // Test mobile menu close
    await page.click('[data-testid="mobile-menu-toggle"]')
    await page.click('[data-testid="mobile-menu"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()
  })

  test('Mobile dashboard layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to dashboard
    await page.goto('http://localhost:7777/dashboard')
    
    // Verify mobile dashboard layout
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-stats-grid"]')).toBeVisible()
    
    // Test mobile stats cards
    await expect(page.locator('[data-testid="mobile-stat-card"]')).toHaveCount(4)
    await expect(page.locator('text=Total Registrations')).toBeVisible()
    await expect(page.locator('text=Active QR Codes')).toBeVisible()
    await expect(page.locator('text=Forms Created')).toBeVisible()
    await expect(page.locator('text=Check-ins Today')).toBeVisible()
    
    // Test mobile quick actions
    await expect(page.locator('[data-testid="mobile-quick-actions"]')).toBeVisible()
    await expect(page.locator('text=Create QR Code Set')).toBeVisible()
    await expect(page.locator('text=Build Form')).toBeVisible()
    await expect(page.locator('text=View Analytics')).toBeVisible()
    
    // Test mobile recent activity
    await expect(page.locator('[data-testid="mobile-recent-activity"]')).toBeVisible()
    await expect(page.locator('text=Recent Activity')).toBeVisible()
  })

  test('Mobile QR code management', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Verify mobile QR code layout
    await expect(page.locator('[data-testid="mobile-qr-codes"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-qr-code-list"]')).toBeVisible()
    
    // Test mobile QR code cards
    await expect(page.locator('[data-testid="mobile-qr-code-card"]')).toBeVisible()
    await expect(page.locator('text=Event Registration')).toBeVisible()
    await expect(page.locator('text=Main Entrance')).toBeVisible()
    
    // Test mobile QR code actions
    await page.locator('[data-testid="mobile-qr-code-card"]').first().click()
    await expect(page.locator('[data-testid="mobile-qr-code-details"]')).toBeVisible()
    
    // Test mobile QR code creation
    await page.goBack()
    await page.click('text=Create QR Code Set')
    await expect(page.locator('[data-testid="mobile-qr-code-form"]')).toBeVisible()
    
    // Test mobile form fields
    await page.fill('input[name="name"]', 'Mobile QR Code Set')
    await page.fill('textarea[name="description"]', 'Mobile-created QR code set')
    
    // Test mobile field addition
    await page.click('text=Add Field')
    await expect(page.locator('[data-testid="mobile-field-form"]')).toBeVisible()
    
    await page.fill('input[name="fieldLabel"]', 'Mobile Field')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.click('text=Save Field')
    
    // Test mobile form submission
    await page.click('text=Create QR Code Set')
    await expect(page.locator('text=QR Code Set created successfully')).toBeVisible()
  })

  test('Mobile form builder', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Verify mobile form layout
    await expect(page.locator('[data-testid="mobile-forms"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-form-list"]')).toBeVisible()
    
    // Test mobile form creation
    await page.click('text=Create Form')
    await expect(page.locator('[data-testid="mobile-form-builder"]')).toBeVisible()
    
    // Test mobile form details
    await page.fill('input[name="name"]', 'Mobile Form')
    await page.fill('textarea[name="description"]', 'Mobile-created form')
    
    // Test mobile field management
    await page.click('text=Add Field')
    await expect(page.locator('[data-testid="mobile-field-editor"]')).toBeVisible()
    
    await page.fill('input[name="fieldLabel"]', 'Mobile Field')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')
    
    // Test mobile field editing
    await page.locator('[data-testid="mobile-field-item"]').first().click()
    await expect(page.locator('[data-testid="mobile-field-edit"]')).toBeVisible()
    
    await page.fill('input[name="fieldLabel"]', 'Updated Mobile Field')
    await page.click('text=Save Changes')
    
    // Test mobile form preview
    await page.click('text=Preview Form')
    await expect(page.locator('[data-testid="mobile-form-preview"]')).toBeVisible()
    
    // Test mobile form submission
    await page.fill('input[name="mobileField"]', 'Test Value')
    await page.click('text=Submit')
    await expect(page.locator('text=Form submitted successfully')).toBeVisible()
  })

  test('Mobile analytics dashboard', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Verify mobile analytics layout
    await expect(page.locator('[data-testid="mobile-analytics"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-analytics-grid"]')).toBeVisible()
    
    // Test mobile analytics cards
    await expect(page.locator('[data-testid="mobile-analytics-card"]')).toHaveCount(4)
    await expect(page.locator('text=Total Registrations')).toBeVisible()
    await expect(page.locator('text=Active QR Codes')).toBeVisible()
    await expect(page.locator('text=Forms Created')).toBeVisible()
    await expect(page.locator('text=Check-ins Today')).toBeVisible()
    
    // Test mobile charts
    await expect(page.locator('[data-testid="mobile-chart"]')).toBeVisible()
    await expect(page.locator('text=Registration Trends')).toBeVisible()
    
    // Test mobile chart interactions
    await page.hover('[data-testid="mobile-chart"]')
    await expect(page.locator('[data-testid="mobile-chart-tooltip"]')).toBeVisible()
    
    // Test mobile date range selection
    await page.click('[data-testid="mobile-date-selector"]')
    await expect(page.locator('[data-testid="mobile-date-picker"]')).toBeVisible()
    
    await page.click('text=Last 7 days')
    await expect(page.locator('[data-testid="mobile-chart"]')).toBeVisible()
  })

  test('Mobile settings and profile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Verify mobile settings layout
    await expect(page.locator('[data-testid="mobile-settings"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-settings-nav"]')).toBeVisible()
    
    // Test mobile settings navigation
    await page.click('text=Profile')
    await expect(page.locator('[data-testid="mobile-profile-settings"]')).toBeVisible()
    
    // Test mobile profile editing
    await page.fill('input[name="name"]', 'Mobile User')
    await page.fill('input[name="email"]', 'mobile@example.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.click('text=Save Profile')
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()
    
    // Test mobile security settings
    await page.click('text=Security')
    await expect(page.locator('[data-testid="mobile-security-settings"]')).toBeVisible()
    
    // Test mobile password change
    await page.click('text=Change Password')
    await expect(page.locator('[data-testid="mobile-password-modal"]')).toBeVisible()
    
    await page.fill('input[name="currentPassword"]', 'SecurePassword123!')
    await page.fill('input[name="newPassword"]', 'NewMobilePassword456!')
    await page.fill('input[name="confirmPassword"]', 'NewMobilePassword456!')
    await page.click('text=Change Password')
    await expect(page.locator('text=Password changed successfully')).toBeVisible()
  })

  test('Tablet responsiveness', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Navigate to dashboard
    await page.goto('http://localhost:7777/dashboard')
    
    // Verify tablet layout
    await expect(page.locator('[data-testid="tablet-dashboard"]')).toBeVisible()
    await expect(page.locator('[data-testid="tablet-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="tablet-main-content"]')).toBeVisible()
    
    // Test tablet navigation
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    await expect(page.locator('[data-testid="tablet-qr-codes"]')).toBeVisible()
    
    // Test tablet QR code grid
    await expect(page.locator('[data-testid="tablet-qr-code-grid"]')).toBeVisible()
    await expect(page.locator('[data-testid="tablet-qr-code-card"]')).toHaveCount(2)
    
    // Test tablet form builder
    await page.click('text=Forms')
    await page.click('text=Create Form')
    await expect(page.locator('[data-testid="tablet-form-builder"]')).toBeVisible()
    
    // Test tablet form fields
    await page.fill('input[name="name"]', 'Tablet Form')
    await page.fill('textarea[name="description"]', 'Tablet-created form')
    
    // Test tablet field addition
    await page.click('text=Add Field')
    await expect(page.locator('[data-testid="tablet-field-editor"]')).toBeVisible()
    
    await page.fill('input[name="fieldLabel"]', 'Tablet Field')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.click('text=Save Field')
    
    // Test tablet form preview
    await page.click('text=Preview Form')
    await expect(page.locator('[data-testid="tablet-form-preview"]')).toBeVisible()
  })

  test('Mobile touch interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to dashboard
    await page.goto('http://localhost:7777/dashboard')
    
    // Test touch scrolling
    await page.touchscreen.tap(200, 300)
    await page.mouse.wheel(0, 500)
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible()
    
    // Test touch navigation
    await page.touchscreen.tap(50, 50) // Mobile menu toggle
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test touch form interactions
    await page.click('text=Forms')
    await page.click('text=Create Form')
    
    // Test touch form fields
    await page.touchscreen.tap(200, 200) // Name field
    await page.fill('input[name="name"]', 'Touch Form')
    
    await page.touchscreen.tap(200, 250) // Description field
    await page.fill('textarea[name="description"]', 'Touch-created form')
    
    // Test touch field addition
    await page.touchscreen.tap(200, 300) // Add Field button
    await page.click('text=Add Field')
    
    await page.touchscreen.tap(200, 200) // Field label
    await page.fill('input[name="fieldLabel"]', 'Touch Field')
    
    await page.touchscreen.tap(200, 250) // Field type
    await page.selectOption('select[name="fieldType"]', 'text')
    
    await page.touchscreen.tap(200, 300) // Save button
    await page.click('text=Save Field')
    
    // Test touch form submission
    await page.touchscreen.tap(200, 400) // Create Form button
    await page.click('text=Create Form')
    await expect(page.locator('text=Form created successfully')).toBeVisible()
  })

  test('Mobile performance and loading', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Measure mobile page load time
    const startTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify mobile page loads within reasonable time
    expect(loadTime).toBeLessThan(4000)
    
    // Test mobile navigation performance
    const navStartTime = Date.now()
    await page.click('text=QR Codes')
    await page.waitForSelector('[data-testid="mobile-qr-codes"]')
    const navTime = Date.now() - navStartTime
    
    // Verify mobile navigation is fast
    expect(navTime).toBeLessThan(2000)
    
    // Test mobile form performance
    await page.click('text=Forms')
    await page.click('text=Create Form')
    
    const formStartTime = Date.now()
    await page.waitForSelector('[data-testid="mobile-form-builder"]')
    const formTime = Date.now() - formStartTime
    
    // Verify mobile form builder loads quickly
    expect(formTime).toBeLessThan(1500)
  })

  test('Mobile accessibility and compliance', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to dashboard
    await page.goto('http://localhost:7777/dashboard')
    
    // Test mobile keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Verify focus indicators
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test mobile screen reader compatibility
    await expect(page.locator('h1')).toHaveAttribute('role', 'heading')
    
    // Test mobile ARIA labels
    await expect(page.locator('[aria-label="Mobile Navigation"]')).toBeVisible()
    await expect(page.locator('[aria-label="Mobile Menu Toggle"]')).toBeVisible()
    
    // Test mobile form accessibility
    await page.click('text=Forms')
    await page.click('text=Create Form')
    
    await expect(page.locator('input[name="name"]')).toHaveAttribute('aria-label', 'Form Name')
    await expect(page.locator('textarea[name="description"]')).toHaveAttribute('aria-label', 'Form Description')
    
    // Test mobile color contrast
    const mobileSection = page.locator('[data-testid="mobile-dashboard"]')
    const backgroundColor = await mobileSection.evaluate(el => getComputedStyle(el).backgroundColor)
    const textColor = await mobileSection.evaluate(el => getComputedStyle(el).color)
    
    // Verify sufficient color contrast (basic check)
    expect(backgroundColor).not.toBe(textColor)
  })

  test('Mobile error handling and recovery', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to dashboard
    await page.goto('http://localhost:7777/dashboard')
    
    // Simulate mobile network error
    await page.route('**/api/**', route => route.abort())
    
    // Reload dashboard
    await page.reload()
    
    // Verify mobile error message
    await expect(page.locator('text=Failed to load data')).toBeVisible()
    
    // Verify mobile retry button
    await expect(page.locator('text=Retry')).toBeVisible()
    
    // Test mobile retry functionality
    await page.unroute('**/api/**')
    await page.click('text=Retry')
    
    // Verify mobile dashboard loads successfully
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible()
    
    // Test mobile form validation
    await page.click('text=Forms')
    await page.click('text=Create Form')
    
    // Test mobile form validation errors
    await page.click('text=Create Form')
    await expect(page.locator('text=Form name is required')).toBeVisible()
    
    // Test mobile field validation
    await page.click('text=Add Field')
    await page.click('text=Save Field')
    await expect(page.locator('text=Field label is required')).toBeVisible()
  })

  test('Mobile data persistence and offline support', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to forms
    await page.click('text=Forms')
    await page.click('text=Create Form')
    
    // Test mobile form data persistence
    await page.fill('input[name="name"]', 'Mobile Form')
    await page.fill('textarea[name="description"]', 'Mobile form description')
    
    // Simulate mobile app backgrounding
    await page.evaluate(() => {
      // Simulate mobile app backgrounding
      window.dispatchEvent(new Event('visibilitychange'))
    })
    
    // Simulate mobile app foregrounding
    await page.evaluate(() => {
      // Simulate mobile app foregrounding
      window.dispatchEvent(new Event('visibilitychange'))
    })
    
    // Verify form data is preserved
    await expect(page.locator('input[name="name"]')).toHaveValue('Mobile Form')
    await expect(page.locator('textarea[name="description"]')).toHaveValue('Mobile form description')
    
    // Test mobile offline support
    await page.route('**/api/**', route => route.abort())
    
    // Try to create form while offline
    await page.click('text=Create Form')
    await expect(page.locator('text=You are offline')).toBeVisible()
    
    // Test mobile offline queue
    await expect(page.locator('text=Form will be created when online')).toBeVisible()
    
    // Restore network
    await page.unroute('**/api/**')
    
    // Test mobile sync
    await page.click('text=Sync Now')
    await expect(page.locator('text=Form created successfully')).toBeVisible()
  })
})
