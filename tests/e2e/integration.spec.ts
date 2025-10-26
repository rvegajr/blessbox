/**
 * Integration E2E Tests
 * 
 * Comprehensive tests for complete user journeys and system integration
 */

import { test, expect } from '@playwright/test'

test.describe('Integration E2E Tests', () => {
  test('Complete organization onboarding flow', async ({ page }) => {
    // Start organization registration
    await page.goto('http://localhost:7777/auth/register')
    await expect(page.locator('text=Create Organization')).toBeVisible()
    
    // Step 1: Personal Information
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/email-verification/)
    
    // Step 2: Email Verification
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/onboarding\/form-builder/)
    
    // Step 3: Form Builder
    await page.fill('input[name="formName"]', 'Event Registration Form')
    await page.fill('textarea[name="formDescription"]', 'Registration form for upcoming event')
    
    // Add form fields
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Full Name')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')
    
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Email Address')
    await page.selectOption('select[name="fieldType"]', 'email')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')
    
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Phone Number')
    await page.selectOption('select[name="fieldType"]', 'tel')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')
    
    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/qr-codes/)
    
    // Step 4: QR Code Setup
    await page.fill('input[name="qrCodeSetName"]', 'Event Registration QR Codes')
    await page.fill('textarea[name="qrCodeSetDescription"]', 'QR codes for event registration')
    
    // Add QR codes
    await page.click('text=Add QR Code')
    await page.fill('input[name="qrCodeLabel"]', 'Main Entrance')
    await page.selectOption('select[name="entryPoint"]', 'main')
    await page.check('input[name="isActive"]')
    await page.click('text=Save QR Code')
    
    await page.click('text=Add QR Code')
    await page.fill('input[name="qrCodeLabel"]', 'Side Entrance')
    await page.selectOption('select[name="entryPoint"]', 'side')
    await page.check('input[name="isActive"]')
    await page.click('text=Save QR Code')
    
    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/review/)
    
    // Step 5: Review and Complete
    await expect(page.locator('text=Review Your Setup')).toBeVisible()
    await expect(page.locator('text=Event Registration Form')).toBeVisible()
    await expect(page.locator('text=Event Registration QR Codes')).toBeVisible()
    await expect(page.locator('text=Main Entrance')).toBeVisible()
    await expect(page.locator('text=Side Entrance')).toBeVisible()
    
    await page.click('button:has-text("Complete Setup")')
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('text=Welcome to your dashboard')).toBeVisible()
  })

  test('Complete event registration flow', async ({ page }) => {
    // Login as organization admin
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Create QR code set
    await page.click('text=QR Codes')
    await page.click('text=Create QR Code Set')
    await page.fill('input[name="name"]', 'Event Registration')
    await page.fill('textarea[name="description"]', 'QR codes for event registration')
    
    // Add form fields
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Full Name')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')
    
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Email')
    await page.selectOption('select[name="fieldType"]', 'email')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')
    
    // Add QR codes
    await page.click('text=Add QR Code')
    await page.fill('input[name="qrCodeLabel"]', 'Main Entrance')
    await page.selectOption('select[name="entryPoint"]', 'main')
    await page.click('text=Save QR Code')
    
    await page.click('text=Create QR Code Set')
    await expect(page.locator('text=QR Code Set created successfully')).toBeVisible()
    
    // Generate QR codes
    await page.click('text=Generate QR Codes')
    await expect(page.locator('text=QR codes generated successfully')).toBeVisible()
    
    // Test QR code scanning simulation
    await page.click('text=Test QR Code')
    await expect(page.locator('[data-testid="qr-code-scanner"]')).toBeVisible()
    
    // Simulate QR code scan
    await page.fill('[data-testid="scan-input"]', 'test-qr-code-data')
    await page.click('text=Simulate Scan')
    await expect(page.locator('text=QR code scanned successfully')).toBeVisible()
    
    // Test registration form
    await page.click('text=View Registration Form')
    await expect(page.locator('[data-testid="registration-form"]')).toBeVisible()
    
    // Fill registration form
    await page.fill('input[name="fullName"]', 'Jane Smith')
    await page.fill('input[name="email"]', 'jane@example.com')
    await page.fill('input[name="phone"]', '+1987654321')
    await page.click('text=Submit Registration')
    
    // Verify registration success
    await expect(page.locator('text=Registration submitted successfully')).toBeVisible()
    await expect(page.locator('text=Check-in token generated')).toBeVisible()
    
    // Test check-in process
    await page.click('text=Check In')
    await expect(page.locator('[data-testid="check-in-form"]')).toBeVisible()
    
    await page.fill('input[name="checkInToken"]', 'checkin-token-123')
    await page.click('text=Check In')
    
    // Verify check-in success
    await expect(page.locator('text=Check-in successful')).toBeVisible()
    await expect(page.locator('text=Welcome to the event')).toBeVisible()
  })

  test('Complete analytics and reporting flow', async ({ page }) => {
    // Login as organization admin
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
    
    // Test analytics overview
    await expect(page.locator('text=Key Metrics')).toBeVisible()
    await expect(page.locator('[data-testid="metric-total-registrations"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-active-qr-codes"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-forms-created"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-checkins-today"]')).toBeVisible()
    
    // Test registration trends
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
    await page.hover('[data-testid="registration-trends-chart"]')
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible()
    
    // Test date range selection
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Last 30 days')
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
    
    // Test QR code performance
    await expect(page.locator('[data-testid="qr-code-performance-chart"]')).toBeVisible()
    await page.click('[data-testid="qr-code-selector"]')
    await page.click('text=Event Registration QR')
    await expect(page.locator('[data-testid="qr-code-performance-chart"]')).toBeVisible()
    
    // Test form analytics
    await expect(page.locator('[data-testid="form-analytics-chart"]')).toBeVisible()
    await page.click('[data-testid="form-selector"]')
    await page.click('text=Event Registration Form')
    await expect(page.locator('[data-testid="form-analytics-chart"]')).toBeVisible()
    
    // Test data export
    await page.click('text=Export Analytics')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    await page.check('input[value="csv"]')
    await page.check('input[value="pdf"]')
    await page.click('text=Export Data')
    
    await expect(page.locator('text=Exporting...')).toBeVisible()
    await page.waitForSelector('text=Export completed', { timeout: 30000 })
    
    // Test scheduled reports
    await page.click('text=Schedule Report')
    await expect(page.locator('[data-testid="schedule-modal"]')).toBeVisible()
    
    await page.fill('input[name="reportName"]', 'Weekly Analytics Report')
    await page.selectOption('select[name="frequency"]', 'weekly')
    await page.selectOption('select[name="dayOfWeek"]', 'monday')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.click('text=Schedule Report')
    
    await expect(page.locator('text=Report scheduled successfully')).toBeVisible()
  })

  test('Complete user management flow', async ({ page }) => {
    // Login as organization admin
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Navigate to user management
    await page.click('text=Settings')
    await page.click('text=Users')
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible()
    
    // Invite new user
    await page.click('text=Invite User')
    await expect(page.locator('[data-testid="invite-user-modal"]')).toBeVisible()
    
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.selectOption('select[name="role"]', 'editor')
    await page.fill('textarea[name="message"]', 'Welcome to our organization!')
    await page.click('text=Send Invitation')
    
    await expect(page.locator('text=Invitation sent successfully')).toBeVisible()
    
    // Test user role management
    await page.locator('[data-testid="user-item"]').first().locator('text=Edit').click()
    await page.selectOption('select[name="role"]', 'admin')
    await page.click('text=Save Changes')
    
    await expect(page.locator('text=User role updated successfully')).toBeVisible()
    
    // Test user deactivation
    await page.locator('[data-testid="user-item"]').first().locator('text=Deactivate').click()
    await expect(page.locator('[data-testid="deactivate-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Deactivation')
    await expect(page.locator('text=User deactivated successfully')).toBeVisible()
    
    // Test user reactivation
    await page.locator('[data-testid="user-item"]').first().locator('text=Reactivate').click()
    await expect(page.locator('text=User reactivated successfully')).toBeVisible()
    
    // Test user permissions
    await page.locator('[data-testid="user-item"]').first().locator('text=Permissions').click()
    await expect(page.locator('[data-testid="permissions-modal"]')).toBeVisible()
    
    await page.check('input[value="can-create-forms"]')
    await page.check('input[value="can-manage-qr-codes"]')
    await page.check('input[value="can-view-analytics"]')
    await page.click('text=Save Permissions')
    
    await expect(page.locator('text=Permissions updated successfully')).toBeVisible()
  })

  test('Complete billing and subscription flow', async ({ page }) => {
    // Login as organization admin
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Navigate to billing
    await page.click('text=Settings')
    await page.click('text=Billing')
    await expect(page.locator('[data-testid="billing-settings"]')).toBeVisible()
    
    // Test subscription information
    await expect(page.locator('text=Current Plan')).toBeVisible()
    await expect(page.locator('text=Professional Plan')).toBeVisible()
    await expect(page.locator('text=$29.99/month')).toBeVisible()
    
    // Test plan upgrade
    await page.click('text=Upgrade Plan')
    await expect(page.locator('[data-testid="upgrade-modal"]')).toBeVisible()
    
    await page.click('text=Enterprise Plan')
    await page.fill('input[name="billingEmail"]', 'billing@example.com')
    await page.click('text=Upgrade to Enterprise')
    
    await expect(page.locator('text=Plan upgraded successfully')).toBeVisible()
    
    // Test payment method management
    await page.click('text=Payment Methods')
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible()
    
    await page.click('text=Add Payment Method')
    await expect(page.locator('[data-testid="payment-method-modal"]')).toBeVisible()
    
    await page.fill('input[name="cardNumber"]', '4111111111111111')
    await page.fill('input[name="expiryDate"]', '12/25')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="cardholderName"]', 'John Smith')
    await page.click('text=Add Payment Method')
    
    await expect(page.locator('text=Payment method added successfully')).toBeVisible()
    
    // Test billing history
    await page.click('text=Billing History')
    await expect(page.locator('[data-testid="billing-history"]')).toBeVisible()
    
    await page.locator('[data-testid="invoice-item"]').first().locator('text=Download').click()
    await expect(page.locator('text=Invoice downloaded')).toBeVisible()
    
    // Test subscription cancellation
    await page.click('text=Cancel Subscription')
    await expect(page.locator('[data-testid="cancel-subscription-modal"]')).toBeVisible()
    
    await page.fill('input[name="cancellationReason"]', 'No longer needed')
    await page.fill('textarea[name="feedback"]', 'Great service, but no longer needed')
    await page.click('text=Cancel Subscription')
    
    await expect(page.locator('text=Subscription cancelled successfully')).toBeVisible()
  })

  test('Complete API integration flow', async ({ page }) => {
    // Login as organization admin
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Navigate to API settings
    await page.click('text=Settings')
    await page.click('text=API')
    await expect(page.locator('[data-testid="api-settings"]')).toBeVisible()
    
    // Generate API key
    await page.click('text=Generate API Key')
    await expect(page.locator('[data-testid="api-key-modal"]')).toBeVisible()
    
    await page.fill('input[name="keyName"]', 'Production API Key')
    await page.selectOption('select[name="permissions"]', 'read-write')
    await page.fill('input[name="expiryDate"]', '2025-12-31')
    await page.click('text=Generate Key')
    
    await expect(page.locator('text=API key generated successfully')).toBeVisible()
    await expect(page.locator('[data-testid="api-key-value"]')).toBeVisible()
    
    // Test API key management
    await page.locator('[data-testid="api-key-item"]').first().locator('text=Edit').click()
    await page.selectOption('select[name="permissions"]', 'read-only')
    await page.click('text=Save Changes')
    
    await expect(page.locator('text=API key updated successfully')).toBeVisible()
    
    // Test webhook configuration
    await page.click('text=Webhooks')
    await expect(page.locator('[data-testid="webhook-settings"]')).toBeVisible()
    
    await page.click('text=Add Webhook')
    await expect(page.locator('[data-testid="webhook-modal"]')).toBeVisible()
    
    await page.fill('input[name="webhookUrl"]', 'https://example.com/webhook')
    await page.selectOption('select[name="events"]', 'form_submitted')
    await page.check('input[name="isActive"]')
    await page.click('text=Create Webhook')
    
    await expect(page.locator('text=Webhook created successfully')).toBeVisible()
    
    // Test webhook testing
    await page.locator('[data-testid="webhook-item"]').first().locator('text=Test').click()
    await expect(page.locator('text=Webhook test sent')).toBeVisible()
    
    // Test API documentation
    await page.click('text=API Documentation')
    await expect(page.locator('[data-testid="api-documentation"]')).toBeVisible()
    
    await expect(page.locator('text=Authentication')).toBeVisible()
    await expect(page.locator('text=Endpoints')).toBeVisible()
    await expect(page.locator('text=Examples')).toBeVisible()
    
    // Test API rate limiting
    await page.click('text=Rate Limits')
    await expect(page.locator('[data-testid="rate-limits"]')).toBeVisible()
    
    await expect(page.locator('text=100 requests per minute')).toBeVisible()
    await expect(page.locator('text=1000 requests per hour')).toBeVisible()
    await expect(page.locator('text=10000 requests per day')).toBeVisible()
  })

  test('Complete data export and backup flow', async ({ page }) => {
    // Login as organization admin
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Navigate to data settings
    await page.click('text=Settings')
    await page.click('text=Data')
    await expect(page.locator('[data-testid="data-settings"]')).toBeVisible()
    
    // Test data export
    await page.click('text=Export Data')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    await page.check('input[value="user-data"]')
    await page.check('input[value="organization-data"]')
    await page.check('input[value="form-data"]')
    await page.check('input[value="qr-code-data"]')
    await page.selectOption('select[name="exportFormat"]', 'json')
    await page.click('text=Start Export')
    
    await expect(page.locator('text=Export started successfully')).toBeVisible()
    
    // Test data backup
    await page.click('text=Create Backup')
    await expect(page.locator('[data-testid="backup-modal"]')).toBeVisible()
    
    await page.fill('input[name="backupName"]', 'Monthly Backup')
    await page.check('input[name="includeUserData"]')
    await page.check('input[name="includeFormData"]')
    await page.check('input[name="includeAnalyticsData"]')
    await page.click('text=Create Backup')
    
    await expect(page.locator('text=Backup created successfully')).toBeVisible()
    
    // Test data restoration
    await page.click('text=Restore from Backup')
    await expect(page.locator('[data-testid="restore-modal"]')).toBeVisible()
    
    await page.selectOption('select[name="backupFile"]', 'Monthly Backup')
    await page.fill('input[name="confirmationText"]', 'RESTORE')
    await page.click('text=Restore Data')
    
    await expect(page.locator('text=Data restored successfully')).toBeVisible()
    
    // Test data anonymization
    await page.click('text=Anonymize Data')
    await expect(page.locator('[data-testid="anonymize-modal"]')).toBeVisible()
    
    await page.fill('input[name="confirmationText"]', 'ANONYMIZE')
    await page.check('input[name="confirmAnonymization"]')
    await page.click('text=Anonymize Data')
    
    await expect(page.locator('text=Data anonymized successfully')).toBeVisible()
  })

  test('Complete system administration flow', async ({ page }) => {
    // Login as system admin
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'AdminPassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Navigate to system administration
    await page.click('text=Administration')
    await expect(page.locator('[data-testid="admin-settings"]')).toBeVisible()
    
    // Test system status
    await expect(page.locator('text=System Status')).toBeVisible()
    await expect(page.locator('text=Database')).toBeVisible()
    await expect(page.locator('text=API')).toBeVisible()
    await expect(page.locator('text=Storage')).toBeVisible()
    
    // Test system metrics
    await expect(page.locator('text=System Metrics')).toBeVisible()
    await expect(page.locator('text=CPU Usage')).toBeVisible()
    await expect(page.locator('text=Memory Usage')).toBeVisible()
    await expect(page.locator('text=Disk Usage')).toBeVisible()
    
    // Test system logs
    await page.click('text=System Logs')
    await expect(page.locator('[data-testid="system-logs"]')).toBeVisible()
    
    await page.selectOption('select[name="logLevel"]', 'error')
    await page.selectOption('select[name="logSource"]', 'api')
    await page.fill('input[name="logSearch"]', 'authentication')
    await page.click('text=Filter Logs')
    
    await expect(page.locator('[data-testid="filtered-logs"]')).toBeVisible()
    
    // Test log export
    await page.click('text=Export Logs')
    await expect(page.locator('text=Logs exported successfully')).toBeVisible()
    
    // Test system maintenance
    await page.click('text=System Maintenance')
    await expect(page.locator('[data-testid="maintenance-modal"]')).toBeVisible()
    
    await page.check('input[name="clearCache"]')
    await page.check('input[name="optimizeDatabase"]')
    await page.check('input[name="cleanupLogs"]')
    await page.click('text=Run Maintenance')
    
    await expect(page.locator('text=Maintenance completed successfully')).toBeVisible()
    
    // Test system backup
    await page.click('text=System Backup')
    await expect(page.locator('[data-testid="system-backup-modal"]')).toBeVisible()
    
    await page.fill('input[name="backupName"]', 'System Backup')
    await page.check('input[name="includeDatabase"]')
    await page.check('input[name="includeFiles"]')
    await page.check('input[name="includeLogs"]')
    await page.click('text=Create System Backup')
    
    await expect(page.locator('text=System backup created successfully')).toBeVisible()
  })
})
