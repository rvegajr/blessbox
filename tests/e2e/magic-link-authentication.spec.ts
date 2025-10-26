/**
 * Magic Link Authentication E2E Tests
 * 
 * Comprehensive tests for NextAuth Email Provider (magic link authentication)
 * including multi-organizational scenarios
 */

import { test, expect } from '@playwright/test'

test.describe('Magic Link Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:7777')
  })

  test('Magic link authentication flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:7777/auth/login')
    await expect(page.locator('text=Sign In')).toBeVisible()
    
    // Verify magic link option is available
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="checkbox"][name="passwordless"]')).toBeVisible()
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    await expect(page.locator('text=Use passwordless login')).toBeChecked()
    
    // Fill email for magic link
    await page.fill('input[name="email"]', 'test@example.com')
    
    // Send magic link
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify magic link sent message
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
    
    // Note: In a real test environment, you would need to:
    // 1. Set up email testing (like MailHog or similar)
    // 2. Extract the magic link from the email
    // 3. Navigate to the magic link
    // 4. Verify automatic login
  })

  test('Magic link with valid email format', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    
    // Test with valid email
    await page.fill('input[name="email"]', 'user@organization.com')
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify success message
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
  })

  test('Magic link with invalid email format', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    
    // Test with invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify error message
    await expect(page.locator('text=Failed to send magic link')).toBeVisible()
  })

  test('Magic link loading states', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    await page.fill('input[name="email"]', 'test@example.com')
    
    // Click send magic link and verify loading state
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify button shows loading state
    await expect(page.locator('button:has-text("Send Magic Link")')).toBeDisabled()
  })

  test('Magic link error handling', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    
    // Test with empty email
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify validation error
    await expect(page.locator('text=Email is required')).toBeVisible()
  })

  test('Magic link with existing user', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    
    // Use email of existing user
    await page.fill('input[name="email"]', 'existing@example.com')
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify magic link sent
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
  })

  test('Magic link with new user', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    
    // Use email of new user
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify magic link sent
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
  })

  test('Magic link session persistence', async ({ page }) => {
    // This test would require actual magic link testing
    // In a real scenario, you would:
    // 1. Send magic link
    // 2. Extract link from email
    // 3. Navigate to link
    // 4. Verify automatic login
    // 5. Test session persistence across page refreshes
    
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    await page.fill('input[name="email"]', 'session-test@example.com')
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify magic link sent
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
  })

  test('Magic link with multiple organizations', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    
    // Use email of user with multiple organizations
    await page.fill('input[name="email"]', 'multi-org@example.com')
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify magic link sent
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
    
    // Note: After magic link login, user should see organization switcher
    // This would be tested in the actual magic link flow
  })

  test('Magic link rate limiting', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    await page.fill('input[name="email"]', 'ratelimit@example.com')
    
    // Send multiple magic links quickly
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Send Magic Link")')
      await page.waitForTimeout(100) // Small delay between requests
    }
    
    // Verify rate limiting is applied
    await expect(page.locator('text=Too many requests')).toBeVisible()
  })

  test('Magic link with different email providers', async ({ page }) => {
    const emailProviders = [
      'test@gmail.com',
      'test@outlook.com',
      'test@yahoo.com',
      'test@company.org',
      'test@university.edu'
    ]
    
    for (const email of emailProviders) {
      await page.goto('http://localhost:7777/auth/login')
      
      // Enable passwordless login
      await page.check('input[type="checkbox"][name="passwordless"]')
      await page.fill('input[name="email"]', email)
      await page.click('button:has-text("Send Magic Link")')
      
      // Verify magic link sent
      await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
      
      // Clear form for next iteration
      await page.reload()
    }
  })

  test('Magic link accessibility', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab') // Focus on email field
    await page.keyboard.press('Tab') // Focus on password field
    await page.keyboard.press('Tab') // Focus on passwordless checkbox
    await page.keyboard.press('Space') // Check passwordless option
    
    // Verify passwordless mode is enabled
    await expect(page.locator('input[type="checkbox"][name="passwordless"]')).toBeChecked()
    
    // Test screen reader support
    await expect(page.locator('label[for="passwordless"]')).toBeVisible()
    await expect(page.locator('text=Use passwordless login')).toBeVisible()
  })

  test('Magic link mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('http://localhost:7777/auth/login')
    
    // Verify mobile layout
    await expect(page.locator('text=Sign In')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    
    // Enable passwordless login on mobile
    await page.check('input[type="checkbox"][name="passwordless"]')
    await page.fill('input[name="email"]', 'mobile@example.com')
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify magic link sent on mobile
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
  })

  test('Magic link with international email addresses', async ({ page }) => {
    const internationalEmails = [
      'test@example.co.uk',
      'test@example.de',
      'test@example.fr',
      'test@example.jp',
      'test@example.cn'
    ]
    
    for (const email of internationalEmails) {
      await page.goto('http://localhost:7777/auth/login')
      
      // Enable passwordless login
      await page.check('input[type="checkbox"][name="passwordless"]')
      await page.fill('input[name="email"]', email)
      await page.click('button:has-text("Send Magic Link")')
      
      // Verify magic link sent
      await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
      
      // Clear form for next iteration
      await page.reload()
    }
  })

  test('Magic link error recovery', async ({ page }) => {
    await page.goto('http://localhost:7777/auth/login')
    
    // Enable passwordless login
    await page.check('input[type="checkbox"][name="passwordless"]')
    await page.fill('input[name="email"]', 'error-test@example.com')
    
    // Simulate network error
    await page.route('**/api/auth/signin/email', route => route.abort())
    
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify error message
    await expect(page.locator('text=Failed to send magic link')).toBeVisible()
    
    // Test retry functionality
    await page.unroute('**/api/auth/signin/email')
    await page.click('button:has-text("Send Magic Link")')
    
    // Verify retry works
    await expect(page.locator('text=Check your email for a magic link')).toBeVisible()
  })
})
