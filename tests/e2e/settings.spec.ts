/**
 * Settings and Administration E2E Tests
 * 
 * Comprehensive tests for user settings, organization management, and system administration
 */

import { test, expect } from '@playwright/test'

test.describe('Settings and Administration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('User profile settings', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test profile tab
    await page.click('text=Profile')
    await expect(page.locator('[data-testid="profile-settings"]')).toBeVisible()
    
    // Test profile information editing
    await page.fill('input[name="name"]', 'John Smith')
    await page.fill('input[name="email"]', 'john.smith@example.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.fill('textarea[name="bio"]', 'Software developer and event organizer')
    
    // Save profile changes
    await page.click('text=Save Profile')
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()
    
    // Test profile picture upload
    await page.click('text=Change Profile Picture')
    await expect(page.locator('[data-testid="profile-picture-modal"]')).toBeVisible()
    
    // Test file upload
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-files/profile-picture.jpg')
    await page.click('text=Upload Picture')
    
    // Verify upload success
    await expect(page.locator('text=Profile picture updated successfully')).toBeVisible()
  })

  test('Account security settings', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test security tab
    await page.click('text=Security')
    await expect(page.locator('[data-testid="security-settings"]')).toBeVisible()
    
    // Test password change
    await page.click('text=Change Password')
    await expect(page.locator('[data-testid="password-change-modal"]')).toBeVisible()
    
    await page.fill('input[name="currentPassword"]', 'SecurePassword123!')
    await page.fill('input[name="newPassword"]', 'NewSecurePassword456!')
    await page.fill('input[name="confirmPassword"]', 'NewSecurePassword456!')
    await page.click('text=Change Password')
    
    // Verify password change success
    await expect(page.locator('text=Password changed successfully')).toBeVisible()
    
    // Test two-factor authentication
    await page.click('text=Enable Two-Factor Authentication')
    await expect(page.locator('[data-testid="2fa-setup-modal"]')).toBeVisible()
    
    // Test 2FA setup
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('text=Verify and Enable')
    
    // Verify 2FA enabled
    await expect(page.locator('text=Two-factor authentication enabled')).toBeVisible()
    
    // Test backup codes
    await page.click('text=View Backup Codes')
    await expect(page.locator('[data-testid="backup-codes-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="backup-code"]')).toHaveCount(10)
    
    // Test session management
    await page.click('text=Active Sessions')
    await expect(page.locator('[data-testid="active-sessions"]')).toBeVisible()
    
    // Test session termination
    await page.locator('[data-testid="session-item"]').first().locator('text=Terminate').click()
    await expect(page.locator('[data-testid="terminate-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Termination')
    await expect(page.locator('text=Session terminated successfully')).toBeVisible()
  })

  test('Organization settings and management', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test organization tab
    await page.click('text=Organization')
    await expect(page.locator('[data-testid="organization-settings"]')).toBeVisible()
    
    // Test organization information editing
    await page.fill('input[name="organizationName"]', 'Updated Organization Name')
    await page.fill('input[name="organizationSlug"]', 'updated-organization')
    await page.fill('textarea[name="description"]', 'Updated organization description')
    await page.fill('input[name="contactEmail"]', 'contact@updated-org.com')
    await page.fill('input[name="contactPhone"]', '+1987654321')
    await page.fill('input[name="contactAddress"]', '123 Updated Street')
    await page.fill('input[name="contactCity"]', 'Updated City')
    await page.fill('input[name="contactState"]', 'Updated State')
    await page.fill('input[name="contactZip"]', '12345')
    
    // Save organization changes
    await page.click('text=Save Organization')
    await expect(page.locator('text=Organization updated successfully')).toBeVisible()
    
    // Test organization branding
    await page.click('text=Branding')
    await expect(page.locator('[data-testid="branding-settings"]')).toBeVisible()
    
    // Test logo upload
    await page.click('text=Upload Logo')
    await expect(page.locator('[data-testid="logo-upload-modal"]')).toBeVisible()
    
    const logoInput = page.locator('input[type="file"]')
    await logoInput.setInputFiles('test-files/logo.png')
    await page.click('text=Upload Logo')
    
    // Verify logo upload success
    await expect(page.locator('text=Logo uploaded successfully')).toBeVisible()
    
    // Test color scheme
    await page.fill('input[name="primaryColor"]', '#3B82F6')
    await page.fill('input[name="secondaryColor"]', '#F3F4F6')
    await page.fill('input[name="accentColor"]', '#10B981')
    await page.click('text=Save Branding')
    
    // Verify branding saved
    await expect(page.locator('text=Branding updated successfully')).toBeVisible()
  })

  test('User management and permissions', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test users tab
    await page.click('text=Users')
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible()
    
    // Test user invitation
    await page.click('text=Invite User')
    await expect(page.locator('[data-testid="invite-user-modal"]')).toBeVisible()
    
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.selectOption('select[name="role"]', 'editor')
    await page.fill('textarea[name="message"]', 'Welcome to our organization!')
    await page.click('text=Send Invitation')
    
    // Verify invitation sent
    await expect(page.locator('text=Invitation sent successfully')).toBeVisible()
    
    // Test user role management
    await page.locator('[data-testid="user-item"]').first().locator('text=Edit').click()
    await page.selectOption('select[name="role"]', 'admin')
    await page.click('text=Save Changes')
    
    // Verify role updated
    await expect(page.locator('text=User role updated successfully')).toBeVisible()
    
    // Test user deactivation
    await page.locator('[data-testid="user-item"]').first().locator('text=Deactivate').click()
    await expect(page.locator('[data-testid="deactivate-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Deactivation')
    await expect(page.locator('text=User deactivated successfully')).toBeVisible()
    
    // Test user reactivation
    await page.locator('[data-testid="user-item"]').first().locator('text=Reactivate').click()
    await expect(page.locator('text=User reactivated successfully')).toBeVisible()
  })

  test('Billing and subscription management', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test billing tab
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
    
    // Verify upgrade success
    await expect(page.locator('text=Plan upgraded successfully')).toBeVisible()
    
    // Test payment method management
    await page.click('text=Payment Methods')
    await expect(page.locator('[data-testid="payment-methods"]')).toBeVisible()
    
    // Test adding payment method
    await page.click('text=Add Payment Method')
    await expect(page.locator('[data-testid="payment-method-modal"]')).toBeVisible()
    
    await page.fill('input[name="cardNumber"]', '4111111111111111')
    await page.fill('input[name="expiryDate"]', '12/25')
    await page.fill('input[name="cvv"]', '123')
    await page.fill('input[name="cardholderName"]', 'John Smith')
    await page.click('text=Add Payment Method')
    
    // Verify payment method added
    await expect(page.locator('text=Payment method added successfully')).toBeVisible()
    
    // Test billing history
    await page.click('text=Billing History')
    await expect(page.locator('[data-testid="billing-history"]')).toBeVisible()
    
    // Test invoice download
    await page.locator('[data-testid="invoice-item"]').first().locator('text=Download').click()
    await expect(page.locator('text=Invoice downloaded')).toBeVisible()
  })

  test('API keys and integrations', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test API tab
    await page.click('text=API')
    await expect(page.locator('[data-testid="api-settings"]')).toBeVisible()
    
    // Test API key generation
    await page.click('text=Generate API Key')
    await expect(page.locator('[data-testid="api-key-modal"]')).toBeVisible()
    
    await page.fill('input[name="keyName"]', 'Production API Key')
    await page.selectOption('select[name="permissions"]', 'read-write')
    await page.fill('input[name="expiryDate"]', '2025-12-31')
    await page.click('text=Generate Key')
    
    // Verify API key generated
    await expect(page.locator('text=API key generated successfully')).toBeVisible()
    await expect(page.locator('[data-testid="api-key-value"]')).toBeVisible()
    
    // Test API key management
    await page.locator('[data-testid="api-key-item"]').first().locator('text=Edit').click()
    await page.selectOption('select[name="permissions"]', 'read-only')
    await page.click('text=Save Changes')
    
    // Verify API key updated
    await expect(page.locator('text=API key updated successfully')).toBeVisible()
    
    // Test API key revocation
    await page.locator('[data-testid="api-key-item"]').first().locator('text=Revoke').click()
    await expect(page.locator('[data-testid="revoke-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Revocation')
    await expect(page.locator('text=API key revoked successfully')).toBeVisible()
    
    // Test webhook configuration
    await page.click('text=Webhooks')
    await expect(page.locator('[data-testid="webhook-settings"]')).toBeVisible()
    
    // Test webhook creation
    await page.click('text=Add Webhook')
    await expect(page.locator('[data-testid="webhook-modal"]')).toBeVisible()
    
    await page.fill('input[name="webhookUrl"]', 'https://example.com/webhook')
    await page.selectOption('select[name="events"]', 'form_submitted')
    await page.check('input[name="isActive"]')
    await page.click('text=Create Webhook')
    
    // Verify webhook created
    await expect(page.locator('text=Webhook created successfully')).toBeVisible()
  })

  test('System preferences and configuration', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test preferences tab
    await page.click('text=Preferences')
    await expect(page.locator('[data-testid="preferences-settings"]')).toBeVisible()
    
    // Test notification preferences
    await page.click('text=Notifications')
    await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible()
    
    await page.check('input[name="emailNotifications"]')
    await page.check('input[name="pushNotifications"]')
    await page.check('input[name="smsNotifications"]')
    await page.selectOption('select[name="notificationFrequency"]', 'immediate')
    await page.click('text=Save Notification Settings')
    
    // Verify notification settings saved
    await expect(page.locator('text=Notification settings saved successfully')).toBeVisible()
    
    // Test language and timezone
    await page.click('text=Language & Timezone')
    await expect(page.locator('[data-testid="language-settings"]')).toBeVisible()
    
    await page.selectOption('select[name="language"]', 'en')
    await page.selectOption('select[name="timezone"]', 'America/New_York')
    await page.selectOption('select[name="dateFormat"]', 'MM/DD/YYYY')
    await page.selectOption('select[name="timeFormat"]', '12-hour')
    await page.click('text=Save Language Settings')
    
    // Verify language settings saved
    await expect(page.locator('text=Language settings saved successfully')).toBeVisible()
    
    // Test theme preferences
    await page.click('text=Theme')
    await expect(page.locator('[data-testid="theme-settings"]')).toBeVisible()
    
    await page.selectOption('select[name="theme"]', 'dark')
    await page.selectOption('select[name="accentColor"]', 'blue')
    await page.check('input[name="autoTheme"]')
    await page.click('text=Save Theme Settings')
    
    // Verify theme settings saved
    await expect(page.locator('text=Theme settings saved successfully')).toBeVisible()
  })

  test('Data export and backup', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test data tab
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
    
    // Verify export started
    await expect(page.locator('text=Export started successfully')).toBeVisible()
    
    // Test data backup
    await page.click('text=Create Backup')
    await expect(page.locator('[data-testid="backup-modal"]')).toBeVisible()
    
    await page.fill('input[name="backupName"]', 'Monthly Backup')
    await page.check('input[name="includeUserData"]')
    await page.check('input[name="includeFormData"]')
    await page.check('input[name="includeAnalyticsData"]')
    await page.click('text=Create Backup')
    
    // Verify backup created
    await expect(page.locator('text=Backup created successfully')).toBeVisible()
    
    // Test data deletion
    await page.click('text=Delete Account')
    await expect(page.locator('[data-testid="delete-account-modal"]')).toBeVisible()
    
    await page.fill('input[name="confirmationText"]', 'DELETE')
    await page.check('input[name="confirmDeletion"]')
    await page.click('text=Delete Account')
    
    // Verify deletion confirmation
    await expect(page.locator('[data-testid="final-deletion-confirmation"]')).toBeVisible()
    await page.click('text=Cancel')
    await expect(page.locator('[data-testid="final-deletion-confirmation"]')).not.toBeVisible()
  })

  test('System administration and monitoring', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test admin tab
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
    
    // Test log filtering
    await page.selectOption('select[name="logLevel"]', 'error')
    await page.selectOption('select[name="logSource"]', 'api')
    await page.fill('input[name="logSearch"]', 'authentication')
    await page.click('text=Filter Logs')
    
    // Verify filtered logs
    await expect(page.locator('[data-testid="filtered-logs"]')).toBeVisible()
    
    // Test log export
    await page.click('text=Export Logs')
    await expect(page.locator('text=Logs exported successfully')).toBeVisible()
  })

  test('Settings validation and error handling', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Test profile validation
    await page.click('text=Profile')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('text=Save Profile')
    
    // Verify validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
    
    // Test password validation
    await page.click('text=Security')
    await page.click('text=Change Password')
    await page.fill('input[name="currentPassword"]', 'wrong-password')
    await page.fill('input[name="newPassword"]', '123')
    await page.fill('input[name="confirmPassword"]', '456')
    await page.click('text=Change Password')
    
    // Verify validation errors
    await expect(page.locator('text=Current password is incorrect')).toBeVisible()
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
    
    // Test organization validation
    await page.click('text=Organization')
    await page.fill('input[name="organizationName"]', '')
    await page.fill('input[name="contactEmail"]', 'invalid-email')
    await page.click('text=Save Organization')
    
    // Verify validation errors
    await expect(page.locator('text=Organization name is required')).toBeVisible()
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('Settings performance and loading', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
    // Measure page load time
    const startTime = Date.now()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify page loads within reasonable time
    expect(loadTime).toBeLessThan(3000)
    
    // Test tab switching performance
    const tabStartTime = Date.now()
    await page.click('text=Profile')
    await page.waitForSelector('[data-testid="profile-settings"]')
    const tabTime = Date.now() - tabStartTime
    
    // Verify tab switching is fast
    expect(tabTime).toBeLessThan(1000)
    
    // Test form submission performance
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    
    const submitStartTime = Date.now()
    await page.click('text=Save Profile')
    await page.waitForSelector('text=Profile updated successfully')
    const submitTime = Date.now() - submitStartTime
    
    // Verify form submission is fast
    expect(submitTime).toBeLessThan(2000)
  })

  test('Settings accessibility and compliance', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings')
    await expect(page).toHaveURL(/.*\/dashboard\/settings/)
    
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
    await expect(page.locator('[aria-label="Settings Navigation"]')).toBeVisible()
    await expect(page.locator('[aria-label="Profile Settings"]')).toBeVisible()
    
    // Test form accessibility
    await page.click('text=Profile')
    await expect(page.locator('input[name="name"]')).toHaveAttribute('aria-label', 'Full Name')
    await expect(page.locator('input[name="email"]')).toHaveAttribute('aria-label', 'Email Address')
    await expect(page.locator('textarea[name="bio"]')).toHaveAttribute('aria-label', 'Biography')
    
    // Test color contrast
    const profileSection = page.locator('[data-testid="profile-settings"]')
    const backgroundColor = await profileSection.evaluate(el => getComputedStyle(el).backgroundColor)
    const textColor = await profileSection.evaluate(el => getComputedStyle(el).color)
    
    // Verify sufficient color contrast (basic check)
    expect(backgroundColor).not.toBe(textColor)
  })
})
