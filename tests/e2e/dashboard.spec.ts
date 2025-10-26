/**
 * Dashboard E2E Tests
 * 
 * Comprehensive tests for the main dashboard interface
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Dashboard loads after login', async ({ page }) => {
    // Verify dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Welcome, John')).toBeVisible()
    
    // Verify navigation menu
    await expect(page.locator('text=QR Codes')).toBeVisible()
    await expect(page.locator('text=Forms')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('Navigation menu functionality', async ({ page }) => {
    // Test QR Codes navigation
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Test Forms navigation
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Test Analytics navigation
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test Settings navigation
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
  })

  test('Quick stats display', async ({ page }) => {
    // Verify quick stats are visible
    await expect(page.locator('text=Total Registrations')).toBeVisible()
    await expect(page.locator('text=Active QR Codes')).toBeVisible()
    await expect(page.locator('text=Forms Created')).toBeVisible()
    await expect(page.locator('text=Check-ins Today')).toBeVisible()
    
    // Verify stats have values
    await expect(page.locator('[data-testid="total-registrations"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-qr-codes"]')).toBeVisible()
    await expect(page.locator('[data-testid="forms-created"]')).toBeVisible()
    await expect(page.locator('[data-testid="checkins-today"]')).toBeVisible()
  })

  test('Recent activity feed', async ({ page }) => {
    // Verify recent activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible()
    
    // Check for activity items
    const activityItems = await page.locator('[data-testid="activity-item"]').count()
    expect(activityItems).toBeGreaterThan(0)
    
    // Verify activity timestamps
    await expect(page.locator('text=ago')).toBeVisible()
  })

  test('Quick actions panel', async ({ page }) => {
    // Verify quick actions
    await expect(page.locator('text=Quick Actions')).toBeVisible()
    await expect(page.locator('text=Create QR Code Set')).toBeVisible()
    await expect(page.locator('text=Build Form')).toBeVisible()
    await expect(page.locator('text=View Analytics')).toBeVisible()
    
    // Test quick action buttons
    await page.click('text=Create QR Code Set')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes\/create/)
    
    // Go back to dashboard
    await page.goto('http://localhost:7777/dashboard')
    
    await page.click('text=Build Form')
    await expect(page).toHaveURL(/.*\/dashboard\/forms\/create/)
  })

  test('User profile dropdown', async ({ page }) => {
    // Click user profile dropdown
    await page.click('[data-testid="user-menu"]')
    
    // Verify dropdown options
    await expect(page.locator('text=Profile')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
    await expect(page.locator('text=Sign Out')).toBeVisible()
    
    // Test profile navigation
    await page.click('text=Profile')
    await expect(page).toHaveURL(/.*\/dashboard\/profile/)
  })

  test('Organization switcher functionality', async ({ page }) => {
    // Check if organization switcher is visible (for multi-org users)
    const orgSwitcher = page.locator('[data-testid="organization-switcher"]')
    
    if (await orgSwitcher.isVisible()) {
      // Click organization switcher
      await orgSwitcher.click()
      
      // Verify organization options
      await expect(page.locator('text=Test Organization')).toBeVisible()
      
      // Test organization switching
      await page.click('text=Test Organization')
      
      // Verify dashboard updates
      await expect(page.locator('text=Test Organization')).toBeVisible()
    }
  })

  test('Responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test mobile menu toggle
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test mobile navigation items
    await expect(page.locator('text=QR Codes')).toBeVisible()
    await expect(page.locator('text=Forms')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()
  })

  test('Real-time updates', async ({ page }) => {
    // Verify real-time indicators
    await expect(page.locator('[data-testid="live-indicator"]')).toBeVisible()
    
    // Wait for potential updates
    await page.waitForTimeout(2000)
    
    // Verify stats are updated
    await expect(page.locator('[data-testid="total-registrations"]')).toBeVisible()
  })

  test('Dashboard loading states', async ({ page }) => {
    // Reload dashboard
    await page.reload()
    
    // Verify loading indicators
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for content to load
    await page.waitForSelector('text=Total Registrations', { timeout: 10000 })
    
    // Verify loading indicators are gone
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('Dashboard error handling', async ({ page }) => {
    // Simulate API error
    await page.route('**/api/dashboard/**', route => route.abort())
    
    // Reload dashboard
    await page.reload()
    
    // Verify error message
    await expect(page.locator('text=Failed to load dashboard data')).toBeVisible()
    
    // Verify retry button
    await expect(page.locator('text=Retry')).toBeVisible()
    
    // Test retry functionality
    await page.unroute('**/api/dashboard/**')
    await page.click('text=Retry')
    
    // Verify dashboard loads successfully
    await expect(page.locator('text=Total Registrations')).toBeVisible()
  })

  test('Dashboard data refresh', async ({ page }) => {
    // Click refresh button
    await page.click('[data-testid="refresh-button"]')
    
    // Verify loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for refresh to complete
    await page.waitForSelector('text=Total Registrations', { timeout: 10000 })
    
    // Verify data is refreshed
    await expect(page.locator('[data-testid="total-registrations"]')).toBeVisible()
  })

  test('Dashboard shortcuts and keyboard navigation', async ({ page }) => {
    // Test keyboard shortcuts
    await page.keyboard.press('Control+k')
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible()
    
    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Verify navigation works
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
  })

  test('Dashboard notifications', async ({ page }) => {
    // Check for notification bell
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible()
    
    // Click notification bell
    await page.click('[data-testid="notification-bell"]')
    
    // Verify notification dropdown
    await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible()
    
    // Check for notifications
    const notifications = await page.locator('[data-testid="notification-item"]').count()
    expect(notifications).toBeGreaterThanOrEqual(0)
  })

  test('Dashboard search functionality', async ({ page }) => {
    // Test search functionality
    await page.click('[data-testid="search-button"]')
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
    
    // Type search query
    await page.fill('[data-testid="search-input"]', 'QR Code')
    
    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Test search result selection
    await page.click('[data-testid="search-result"]')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
  })

  test('Dashboard customization', async ({ page }) => {
    // Test dashboard customization
    await page.click('[data-testid="customize-button"]')
    await expect(page.locator('[data-testid="customize-panel"]')).toBeVisible()
    
    // Test widget reordering
    const widget = page.locator('[data-testid="widget-total-registrations"]')
    await widget.dragTo('[data-testid="widget-active-qr-codes"]')
    
    // Save customization
    await page.click('text=Save Layout')
    await expect(page.locator('text=Layout saved')).toBeVisible()
  })

  test('Dashboard export functionality', async ({ page }) => {
    // Test dashboard export
    await page.click('[data-testid="export-button"]')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    // Select export format
    await page.check('input[value="pdf"]')
    
    // Start export
    await page.click('text=Export Dashboard')
    
    // Verify export starts
    await expect(page.locator('text=Exporting...')).toBeVisible()
    
    // Wait for export to complete
    await page.waitForSelector('text=Export completed', { timeout: 30000 })
  })

  test('Dashboard accessibility', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Verify focus indicators
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test screen reader compatibility
    await expect(page.locator('h1')).toHaveAttribute('role', 'heading')
    
    // Test ARIA labels
    await expect(page.locator('[aria-label="Dashboard"]')).toBeVisible()
  })

  test('Dashboard performance', async ({ page }) => {
    // Measure dashboard load time
    const startTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify dashboard loads within reasonable time
    expect(loadTime).toBeLessThan(5000)
    
    // Verify all components are loaded
    await expect(page.locator('text=Total Registrations')).toBeVisible()
    await expect(page.locator('text=Recent Activity')).toBeVisible()
  })
})
