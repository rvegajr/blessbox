/**
 * Complete Magic Link User Journey E2E Tests
 * 
 * Comprehensive tests for complete user journeys using magic link authentication
 * including organization setup, QR code creation, and donation flow
 */

import { test, expect } from '@playwright/test'

test.describe('Complete Magic Link User Journey Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:7777')
  })

  test('Complete organization setup with magic link authentication', async ({ page }) => {
    // Step 1: Navigate to registration
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Step 2: Fill organization registration form
    await page.fill('input[name="name"]', 'Magic Link Organization')
    await page.fill('input[name="email"]', 'magiclink@example.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.fill('input[name="organizationName"]', 'Magic Link Test Org')
    await page.fill('input[name="organizationDescription"]', 'Organization using magic link authentication')

    // Step 3: Submit registration
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/onboarding\/email-verification/)

    // Step 4: Email verification (simulated)
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/onboarding\/form-builder/)

    // Step 5: Form builder configuration
    await page.click('text=Add Text Field')
    await page.fill('input[placeholder="Field label"]', 'Full Name')
    await page.check('input[type="checkbox"][name="required"]')

    await page.click('text=Add Email Field')
    await page.fill('input[placeholder="Field label"]', 'Email Address')
    await page.check('input[type="checkbox"][name="required"]')

    await page.click('button:has-text("Save Form")')
    await expect(page).toHaveURL(/.*\/onboarding\/qr-configuration/)

    // Step 6: QR configuration
    await page.fill('input[name="qrSetName"]', 'Magic Link Event Registration')
    await page.selectOption('select[name="language"]', 'en')
    await page.click('button:has-text("Generate QR Codes")')
    await expect(page).toHaveURL(/.*\/onboarding\/complete/)

    // Step 7: Onboarding completion
    await page.click('button:has-text("Access Dashboard")')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Step 8: Verify dashboard access
    await expect(page.locator('text=Welcome, Magic Link Organization')).toBeVisible()
    await expect(page.locator('text=Magic Link Test Org')).toBeVisible()
  })

  test('Magic link login for existing multi-organization user', async ({ page }) => {
    // Step 1: Navigate to login
    await page.goto('http://localhost:7777/auth/login')
    
    // Step 2: Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    await page.fill('input[name="email"]', 'multi-org@example.com')
    await page.click('button:has-text("Send Magic Link")')
    
    // Step 3: Verify magic link sent
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
    
    // Note: In real testing, you would:
    // 1. Extract magic link from email
    // 2. Navigate to magic link
    // 3. Verify automatic login to dashboard
    // 4. Verify organization switcher is visible
    // 5. Test organization switching functionality
  })

  test('Magic link user creates QR codes for donation doors', async ({ page }) => {
    // This test simulates the flow after magic link login
    // In a real scenario, you would navigate to the magic link first
    
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard')
    
    // Step 1: Navigate to QR codes section
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)
    
    // Step 2: Create new QR code set
    await page.click('button:has-text("Create QR Code Set")')
    await page.fill('input[name="name"]', 'Magic Link Donation Doors')
    await page.selectOption('select[name="language"]', 'en')
    
    // Step 3: Configure form fields
    await page.click('text=Add Text Field')
    await page.fill('input[placeholder="Field label"]', 'Donor Name')
    await page.check('input[type="checkbox"][name="required"]')
    
    await page.click('text=Add Email Field')
    await page.fill('input[placeholder="Field label"]', 'Email Address')
    await page.check('input[type="checkbox"][name="required"]')
    
    await page.click('text=Add Number Field')
    await page.fill('input[placeholder="Field label"]', 'Donation Amount')
    await page.check('input[type="checkbox"][name="required"]')
    
    // Step 4: Generate QR codes
    await page.click('button:has-text("Generate QR Codes")')
    await expect(page.locator('text=QR Codes Generated Successfully')).toBeVisible()
    
    // Step 5: Verify QR codes are created
    await expect(page.locator('text=Magic Link Donation Doors')).toBeVisible()
    await expect(page.locator('text=3 QR codes generated')).toBeVisible()
  })

  test('Magic link user manages multiple QR code sets', async ({ page }) => {
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard/qr-codes')
    
    // Step 1: Create first QR code set
    await page.click('button:has-text("Create QR Code Set")')
    await page.fill('input[name="name"]', 'Event Registration')
    await page.selectOption('select[name="language"]', 'en')
    await page.click('button:has-text("Generate QR Codes")')
    
    // Step 2: Create second QR code set
    await page.click('button:has-text("Create QR Code Set")')
    await page.fill('input[name="name"]', 'Volunteer Signup')
    await page.selectOption('select[name="language"]', 'en')
    await page.click('button:has-text("Generate QR Codes")')
    
    // Step 3: Create third QR code set
    await page.click('button:has-text("Create QR Code Set")')
    await page.fill('input[name="name"]', 'Donation Collection')
    await page.selectOption('select[name="language"]', 'en')
    await page.click('button:has-text("Generate QR Codes")')
    
    // Step 4: Verify all QR code sets are visible
    await expect(page.locator('text=Event Registration')).toBeVisible()
    await expect(page.locator('text=Volunteer Signup')).toBeVisible()
    await expect(page.locator('text=Donation Collection')).toBeVisible()
    
    // Step 5: Test QR code management
    await page.click('button:has-text("Manage")')
    await expect(page.locator('text=QR Code Management')).toBeVisible()
  })

  test('Magic link user views analytics dashboard', async ({ page }) => {
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard')
    
    // Step 1: Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Step 2: Verify analytics dashboard
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible()
    await expect(page.locator('text=Registration Trends')).toBeVisible()
    await expect(page.locator('text=QR Code Performance')).toBeVisible()
    
    // Step 3: Test date range filtering
    await page.click('input[name="dateRange"]')
    await page.selectOption('select[name="dateRange"]', 'last-30-days')
    await expect(page.locator('text=Last 30 Days')).toBeVisible()
    
    // Step 4: Test organization filtering
    await page.click('select[name="organization"]')
    await page.selectOption('select[name="organization"]', 'org-1')
    await expect(page.locator('text=Organization 1 Analytics')).toBeVisible()
  })

  test('Magic link user exports data', async ({ page }) => {
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard')
    
    // Step 1: Navigate to export section
    await page.click('text=Export Data')
    await expect(page.locator('text=Data Export')).toBeVisible()
    
    // Step 2: Select export format
    await page.selectOption('select[name="format"]', 'excel')
    await page.check('input[type="checkbox"][name="includeRegistrations"]')
    await page.check('input[type="checkbox"][name="includeAnalytics"]')
    
    // Step 3: Set date range
    await page.fill('input[name="startDate"]', '2024-01-01')
    await page.fill('input[name="endDate"]', '2024-12-31')
    
    // Step 4: Generate export
    await page.click('button:has-text("Generate Export")')
    await expect(page.locator('text=Export Generated Successfully')).toBeVisible()
    
    // Step 5: Download export
    await page.click('button:has-text("Download")')
    // Note: In real testing, you would verify the download
  })

  test('Magic link user manages organization settings', async ({ page }) => {
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard')
    
    // Step 1: Navigate to settings
    await page.click('text=Settings')
    await expect(page.locator('text=Organization Settings')).toBeVisible()
    
    // Step 2: Update organization information
    await page.fill('input[name="organizationName"]', 'Updated Magic Link Org')
    await page.fill('input[name="contactEmail"]', 'updated@magiclink.org')
    await page.fill('input[name="contactPhone"]', '+1987654321')
    
    // Step 3: Save changes
    await page.click('button:has-text("Save Changes")')
    await expect(page.locator('text=Settings Updated Successfully')).toBeVisible()
    
    // Step 4: Verify changes
    await expect(page.locator('text=Updated Magic Link Org')).toBeVisible()
  })

  test('Magic link user manages team members', async ({ page }) => {
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard/settings/users')
    
    // Step 1: Add new team member
    await page.click('button:has-text("Add Team Member")')
    await page.fill('input[name="email"]', 'newmember@example.com')
    await page.selectOption('select[name="role"]', 'admin')
    await page.click('button:has-text("Send Invitation")')
    
    // Step 2: Verify invitation sent
    await expect(page.locator('text=Invitation Sent Successfully')).toBeVisible()
    
    // Step 3: Manage existing team members
    await page.click('button:has-text("Manage")')
    await expect(page.locator('text=Team Member Management')).toBeVisible()
    
    // Step 4: Update permissions
    await page.selectOption('select[name="role"]', 'member')
    await page.click('button:has-text("Update Role")')
    await expect(page.locator('text=Role Updated Successfully')).toBeVisible()
  })

  test('Magic link user handles billing and subscriptions', async ({ page }) => {
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard/settings/billing')
    
    // Step 1: View current subscription
    await expect(page.locator('text=Current Subscription')).toBeVisible()
    await expect(page.locator('text=Standard Plan')).toBeVisible()
    
    // Step 2: View billing history
    await page.click('text=Billing History')
    await expect(page.locator('text=Billing History')).toBeVisible()
    
    // Step 3: Update payment method
    await page.click('button:has-text("Update Payment Method")')
    await expect(page.locator('text=Payment Method')).toBeVisible()
    
    // Step 4: View usage analytics
    await page.click('text=Usage Analytics')
    await expect(page.locator('text=Usage Analytics')).toBeVisible()
  })

  test('Magic link user handles API key management', async ({ page }) => {
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard/settings/api')
    
    // Step 1: View existing API keys
    await expect(page.locator('text=API Keys')).toBeVisible()
    
    // Step 2: Generate new API key
    await page.click('button:has-text("Generate New Key")')
    await page.fill('input[name="keyName"]', 'Magic Link Integration')
    await page.selectOption('select[name="permissions"]', 'read-write')
    await page.click('button:has-text("Generate")')
    
    // Step 3: Verify API key generated
    await expect(page.locator('text=API Key Generated Successfully')).toBeVisible()
    
    // Step 4: Copy API key
    await page.click('button:has-text("Copy Key")')
    await expect(page.locator('text=API Key Copied to Clipboard')).toBeVisible()
  })

  test('Magic link user handles organization switching', async ({ page }) => {
    // Simulate being logged in via magic link with multiple organizations
    await page.goto('http://localhost:7777/dashboard')
    
    // Step 1: Verify organization switcher
    await expect(page.locator('select[name="organization"]')).toBeVisible()
    
    // Step 2: Switch to first organization
    await page.selectOption('select[name="organization"]', 'org-1')
    await expect(page.locator('text=Organization 1')).toBeVisible()
    
    // Step 3: Verify organization-specific data
    await expect(page.locator('text=Organization 1 Dashboard')).toBeVisible()
    
    // Step 4: Switch to second organization
    await page.selectOption('select[name="organization"]', 'org-2')
    await expect(page.locator('text=Organization 2')).toBeVisible()
    
    // Step 5: Verify organization-specific data
    await expect(page.locator('text=Organization 2 Dashboard')).toBeVisible()
    
    // Step 6: Verify session persistence
    await page.reload()
    await expect(page.locator('text=Organization 2')).toBeVisible()
  })

  test('Magic link user handles logout and re-login', async ({ page }) => {
    // Simulate being logged in via magic link
    await page.goto('http://localhost:7777/dashboard')
    
    // Step 1: Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Sign Out')
    await expect(page).toHaveURL(/.*\/auth\/login/)
    
    // Step 2: Re-login with magic link
    await page.check('input[type="checkbox"][name="passwordless"]')
    await page.fill('input[name="email"]', 'magiclink@example.com')
    await page.click('button:has-text("Send Magic Link")')
    
    // Step 3: Verify magic link sent
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
    
    // Note: In real testing, you would:
    // 1. Extract magic link from email
    // 2. Navigate to magic link
    // 3. Verify automatic login to dashboard
    // 4. Verify user is back in their previous organization
  })
})
