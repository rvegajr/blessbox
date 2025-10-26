/**
 * QR Code Management E2E Tests
 * 
 * Comprehensive tests for QR code creation, management, and tracking
 */

import { test, expect } from '@playwright/test'

test.describe('QR Code Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('QR Code creation flow', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click create QR code set
    await page.click('text=Create QR Code Set')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes\/create/)
    
    // Fill QR code set form
    await page.fill('input[name="name"]', 'Event Registration')
    await page.fill('textarea[name="description"]', 'QR codes for event registration')
    await page.selectOption('select[name="language"]', 'en')
    
    // Add form fields
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Full Name')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')
    
    // Add another field
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Email')
    await page.selectOption('select[name="fieldType"]', 'email')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')
    
    // Configure QR codes
    await page.click('text=Configure QR Codes')
    await page.fill('input[name="qrCodeLabel"]', 'Main Entrance')
    await page.selectOption('select[name="entryPoint"]', 'main')
    await page.check('input[name="isActive"]')
    await page.click('text=Add QR Code')
    
    // Save QR code set
    await page.click('text=Create QR Code Set')
    
    // Verify success message
    await expect(page.locator('text=QR Code Set created successfully')).toBeVisible()
    
    // Verify redirect to QR codes list
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
  })

  test('QR Code set listing and management', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Verify QR code sets are listed
    await expect(page.locator('[data-testid="qr-code-set"]')).toBeVisible()
    
    // Test QR code set actions
    const qrCodeSet = page.locator('[data-testid="qr-code-set"]').first()
    
    // Test edit button
    await qrCodeSet.locator('text=Edit').click()
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes\/edit\/.*/)
    
    // Go back to list
    await page.goBack()
    
    // Test view button
    await qrCodeSet.locator('text=View').click()
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes\/view\/.*/)
    
    // Go back to list
    await page.goBack()
    
    // Test delete button
    await qrCodeSet.locator('text=Delete').click()
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    
    // Cancel deletion
    await page.click('text=Cancel')
    await expect(page.locator('[data-testid="delete-confirmation"]')).not.toBeVisible()
  })

  test('QR Code set editing', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click edit on first QR code set
    await page.locator('[data-testid="qr-code-set"]').first().locator('text=Edit').click()
    
    // Edit QR code set details
    await page.fill('input[name="name"]', 'Updated Event Registration')
    await page.fill('textarea[name="description"]', 'Updated description')
    
    // Edit form fields
    await page.click('[data-testid="field-item"]').first().locator('text=Edit').click()
    await page.fill('input[name="fieldLabel"]', 'Updated Full Name')
    await page.click('text=Save Changes')
    
    // Add new field
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Phone Number')
    await page.selectOption('select[name="fieldType"]', 'tel')
    await page.click('text=Save Field')
    
    // Save changes
    await page.click('text=Save Changes')
    
    // Verify success message
    await expect(page.locator('text=QR Code Set updated successfully')).toBeVisible()
  })

  test('QR Code generation and download', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click on a QR code set
    await page.locator('[data-testid="qr-code-set"]').first().click()
    
    // Verify QR code set details
    await expect(page.locator('text=Event Registration')).toBeVisible()
    await expect(page.locator('text=Main Entrance')).toBeVisible()
    
    // Test QR code generation
    await page.click('text=Generate QR Codes')
    await expect(page.locator('text=Generating QR codes...')).toBeVisible()
    
    // Wait for generation to complete
    await page.waitForSelector('text=QR codes generated successfully', { timeout: 10000 })
    
    // Test QR code download
    await page.click('text=Download QR Code')
    await expect(page.locator('text=Downloading...')).toBeVisible()
    
    // Verify download starts
    await page.waitForSelector('text=Download completed', { timeout: 10000 })
  })

  test('QR Code scanning and tracking', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click on a QR code set
    await page.locator('[data-testid="qr-code-set"]').first().click()
    
    // Test QR code scanning
    await page.click('text=Test QR Code')
    await expect(page.locator('[data-testid="qr-code-scanner"]')).toBeVisible()
    
    // Simulate QR code scan
    await page.fill('[data-testid="scan-input"]', 'test-qr-code-data')
    await page.click('text=Simulate Scan')
    
    // Verify scan is tracked
    await expect(page.locator('text=QR code scanned successfully')).toBeVisible()
    
    // Check scan analytics
    await page.click('text=View Analytics')
    await expect(page.locator('text=Scan Statistics')).toBeVisible()
    await expect(page.locator('text=Total Scans')).toBeVisible()
    await expect(page.locator('text=Unique Scans')).toBeVisible()
  })

  test('QR Code analytics and reporting', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click on a QR code set
    await page.locator('[data-testid="qr-code-set"]').first().click()
    
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes\/analytics/)
    
    // Verify analytics dashboard
    await expect(page.locator('text=QR Code Analytics')).toBeVisible()
    await expect(page.locator('text=Scan Trends')).toBeVisible()
    await expect(page.locator('text=Device Breakdown')).toBeVisible()
    await expect(page.locator('text=Location Data')).toBeVisible()
    
    // Test date range selection
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Last 30 days')
    
    // Verify data updates
    await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible()
    
    // Test export functionality
    await page.click('text=Export Data')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    // Select export format
    await page.check('input[value="csv"]')
    await page.click('text=Export')
    
    // Verify export starts
    await expect(page.locator('text=Exporting...')).toBeVisible()
  })

  test('QR Code bulk operations', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Select multiple QR code sets
    await page.check('[data-testid="qr-code-set-checkbox"]')
    await page.check('[data-testid="qr-code-set-checkbox"]').nth(1)
    
    // Test bulk actions
    await page.click('text=Bulk Actions')
    await expect(page.locator('[data-testid="bulk-actions-menu"]')).toBeVisible()
    
    // Test bulk activation
    await page.click('text=Activate Selected')
    await expect(page.locator('text=Activating QR code sets...')).toBeVisible()
    await expect(page.locator('text=QR code sets activated successfully')).toBeVisible()
    
    // Test bulk deactivation
    await page.click('text=Bulk Actions')
    await page.click('text=Deactivate Selected')
    await expect(page.locator('text=Deactivating QR code sets...')).toBeVisible()
    await expect(page.locator('text=QR code sets deactivated successfully')).toBeVisible()
    
    // Test bulk deletion
    await page.click('text=Bulk Actions')
    await page.click('text=Delete Selected')
    await expect(page.locator('[data-testid="bulk-delete-confirmation"]')).toBeVisible()
    
    // Cancel bulk deletion
    await page.click('text=Cancel')
    await expect(page.locator('[data-testid="bulk-delete-confirmation"]')).not.toBeVisible()
  })

  test('QR Code search and filtering', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'Event')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    await expect(page.locator('text=Event Registration')).toBeVisible()
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Test filtering
    await page.click('[data-testid="filter-button"]')
    await page.check('input[value="active"]')
    await page.click('text=Apply Filters')
    
    // Verify filtered results
    await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible()
    
    // Clear filters
    await page.click('text=Clear Filters')
    await expect(page.locator('[data-testid="filtered-results"]')).not.toBeVisible()
  })

  test('QR Code set duplication', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click on a QR code set
    await page.locator('[data-testid="qr-code-set"]').first().click()
    
    // Test duplication
    await page.click('text=Duplicate')
    await expect(page.locator('[data-testid="duplicate-modal"]')).toBeVisible()
    
    // Fill duplicate form
    await page.fill('input[name="duplicateName"]', 'Copy of Event Registration')
    await page.click('text=Duplicate QR Code Set')
    
    // Verify duplication success
    await expect(page.locator('text=QR Code Set duplicated successfully')).toBeVisible()
    
    // Verify new QR code set appears in list
    await page.goto('http://localhost:7777/dashboard/qr-codes')
    await expect(page.locator('text=Copy of Event Registration')).toBeVisible()
  })

  test('QR Code set sharing', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click on a QR code set
    await page.locator('[data-testid="qr-code-set"]').first().click()
    
    // Test sharing
    await page.click('text=Share')
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible()
    
    // Test public link generation
    await page.click('text=Generate Public Link')
    await expect(page.locator('[data-testid="public-link"]')).toBeVisible()
    
    // Copy link
    await page.click('text=Copy Link')
    await expect(page.locator('text=Link copied to clipboard')).toBeVisible()
    
    // Test email sharing
    await page.click('text=Share via Email')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('textarea[name="message"]', 'Check out this QR code set')
    await page.click('text=Send Email')
    
    // Verify email sent
    await expect(page.locator('text=Email sent successfully')).toBeVisible()
  })

  test('QR Code set permissions', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click on a QR code set
    await page.locator('[data-testid="qr-code-set"]').first().click()
    
    // Test permissions
    await page.click('text=Permissions')
    await expect(page.locator('[data-testid="permissions-modal"]')).toBeVisible()
    
    // Add user permission
    await page.click('text=Add User')
    await page.fill('input[name="userEmail"]', 'user@example.com')
    await page.selectOption('select[name="permission"]', 'view')
    await page.click('text=Add Permission')
    
    // Verify permission added
    await expect(page.locator('text=user@example.com')).toBeVisible()
    await expect(page.locator('text=View')).toBeVisible()
    
    // Test permission removal
    await page.locator('[data-testid="permission-item"]').first().locator('text=Remove').click()
    await expect(page.locator('text=Permission removed')).toBeVisible()
  })

  test('QR Code set versioning', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click on a QR code set
    await page.locator('[data-testid="qr-code-set"]').first().click()
    
    // Test versioning
    await page.click('text=Versions')
    await expect(page.locator('[data-testid="versions-modal"]')).toBeVisible()
    
    // Create new version
    await page.click('text=Create New Version')
    await page.fill('input[name="versionName"]', 'Version 2.0')
    await page.fill('textarea[name="versionNotes"]', 'Updated form fields')
    await page.click('text=Create Version')
    
    // Verify version created
    await expect(page.locator('text=Version 2.0')).toBeVisible()
    await expect(page.locator('text=Version created successfully')).toBeVisible()
    
    // Test version switching
    await page.click('text=Switch to Version 2.0')
    await expect(page.locator('text=Switched to Version 2.0')).toBeVisible()
  })

  test('QR Code set templates', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Test template creation
    await page.click('text=Create from Template')
    await expect(page.locator('[data-testid="template-modal"]')).toBeVisible()
    
    // Select template
    await page.click('text=Event Registration Template')
    await page.fill('input[name="templateName"]', 'Custom Event Registration')
    await page.click('text=Use Template')
    
    // Verify template applied
    await expect(page.locator('text=Template applied successfully')).toBeVisible()
    
    // Verify form fields are populated
    await expect(page.locator('text=Full Name')).toBeVisible()
    await expect(page.locator('text=Email')).toBeVisible()
    await expect(page.locator('text=Phone')).toBeVisible()
  })

  test('QR Code set validation', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Click create QR code set
    await page.click('text=Create QR Code Set')
    
    // Test validation errors
    await page.click('text=Create QR Code Set')
    
    // Verify validation errors
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=At least one form field is required')).toBeVisible()
    
    // Fill required fields
    await page.fill('input[name="name"]', 'Test QR Code Set')
    
    // Add form field
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Full Name')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.click('text=Save Field')
    
    // Try to create again
    await page.click('text=Create QR Code Set')
    
    // Verify success
    await expect(page.locator('text=QR Code Set created successfully')).toBeVisible()
  })

  test('QR Code set performance', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Measure page load time
    const startTime = Date.now()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify page loads within reasonable time
    expect(loadTime).toBeLessThan(3000)
    
    // Test large dataset handling
    await page.click('text=Load More')
    await expect(page.locator('[data-testid="loading-more"]')).toBeVisible()
    
    // Wait for more items to load
    await page.waitForSelector('[data-testid="qr-code-set"]').nth(10)
    
    // Verify performance with large dataset
    const scrollStartTime = Date.now()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const scrollTime = Date.now() - scrollStartTime
    
    // Verify scrolling is smooth
    expect(scrollTime).toBeLessThan(1000)
  })

  test('QR Code set accessibility', async ({ page }) => {
    // Navigate to QR codes
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
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
    await expect(page.locator('[aria-label="QR Code Set"]')).toBeVisible()
    
    // Test form accessibility
    await page.click('text=Create QR Code Set')
    await expect(page.locator('input[name="name"]')).toHaveAttribute('aria-label', 'QR Code Set Name')
    await expect(page.locator('textarea[name="description"]')).toHaveAttribute('aria-label', 'Description')
  })
})
