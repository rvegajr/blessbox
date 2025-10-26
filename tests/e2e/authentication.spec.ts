/**
 * Authentication E2E Tests
 * 
 * Comprehensive tests for user authentication flows
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:7777')
  })

  test('User registration flow', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Fill registration form
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')

    // Submit registration
    await page.click('button[type="submit"]')
    
    // Verify redirect to next step
    await expect(page).toHaveURL(/.*\/onboarding/)
  })

  test('Login with valid credentials', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/auth\/login/)

    // Fill login form
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')

    // Submit login
    await page.click('button[type="submit"]')
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Login with invalid credentials', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/auth\/login/)

    // Fill with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')

    // Submit login
    await page.click('button[type="submit"]')
    
    // Verify error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
    
    // Verify still on login page
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('Password reset flow', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/auth\/login/)

    // Click forgot password
    await page.click('text=Forgot Password?')
    
    // Fill email for password reset
    await page.fill('input[name="email"]', 'john@example.com')
    await page.click('button[type="submit"]')
    
    // Verify success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible()
  })

  test('Session management', async ({ page }) => {
    // Login first
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    // Verify dashboard access
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Refresh page and verify session persists
    await page.reload()
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Logout functionality', async ({ page }) => {
    // Login first
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    // Navigate to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Click logout
    await page.click('text=Sign Out')
    
    // Verify redirect to homepage
    await expect(page).toHaveURL(/.*\/$/)
    
    // Verify login button is visible
    await expect(page.locator('text=Sign In')).toBeVisible()
  })

  test('Form validation on registration', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Verify validation errors
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('Form validation on login', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/auth\/login/)

    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Verify validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('Email format validation', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Fill with invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')

    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify email validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('Password confirmation validation', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Fill with mismatched passwords
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')

    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify password confirmation error
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('Password strength validation', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Fill with weak password
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')

    // Submit form
    await page.click('button[type="submit"]')
    
    // Verify password strength error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('Remember me functionality', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/auth\/login/)

    // Check remember me checkbox
    await page.check('input[name="rememberMe"]')
    
    // Fill login form
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')

    // Submit login
    await page.click('button[type="submit"]')
    
    // Verify dashboard access
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Close browser and reopen to test persistence
    await page.close()
    const newPage = await page.context().newPage()
    await newPage.goto('http://localhost:7777')
    
    // Should still be logged in
    await expect(newPage).toHaveURL(/.*\/dashboard/)
  })

  test('Redirect after login', async ({ page }) => {
    // Try to access protected route
    await page.goto('http://localhost:7777/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/)
    
    // Login
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    // Should redirect back to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Mobile authentication flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to registration
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Fill registration form on mobile
    await page.fill('input[name="name"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')

    // Submit registration
    await page.click('button[type="submit"]')
    
    // Verify redirect to next step
    await expect(page).toHaveURL(/.*\/onboarding/)
  })

  test('Loading states during authentication', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/auth\/login/)

    // Fill login form
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')

    // Submit and check loading state
    await page.click('button[type="submit"]')
    
    // Verify loading indicator
    await expect(page.locator('text=Signing in...')).toBeVisible()
    
    // Wait for redirect
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Error handling for network issues', async ({ page }) => {
    // Simulate network failure
    await page.route('**/api/auth/**', route => route.abort())
    
    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/.*\/auth\/login/)

    // Fill login form
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')

    // Submit login
    await page.click('button[type="submit"]')
    
    // Verify error message
    await expect(page.locator('text=Network error. Please try again.')).toBeVisible()
  })
})
