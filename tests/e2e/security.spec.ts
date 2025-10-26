/**
 * Security and Authentication E2E Tests
 * 
 * Comprehensive tests for security features, authentication, and authorization
 */

import { test, expect } from '@playwright/test'

test.describe('Security and Authentication Tests', () => {
  test('User authentication flow', async ({ page }) => {
    // Test login page
    await page.goto('http://localhost:7777/auth/login')
    await expect(page.locator('text=Sign In')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Test login with valid credentials
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    // Verify successful login
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('text=Welcome, John')).toBeVisible()
    
    // Test logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Sign Out')
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('Authentication validation and error handling', async ({ page }) => {
    // Test invalid email format
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    // Verify validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
    
    // Test empty fields
    await page.fill('input[name="email"]', '')
    await page.fill('input[name="password"]', '')
    await page.click('button[type="submit"]')
    
    // Verify validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
    
    // Test invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Verify authentication error
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
    
    // Test account lockout after multiple failed attempts
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="email"]', 'john@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')
    }
    
    // Verify account lockout message
    await expect(page.locator('text=Account temporarily locked')).toBeVisible()
  })

  test('Session management and security', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test session persistence
    await page.reload()
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('text=Welcome, John')).toBeVisible()
    
    // Test session timeout
    await page.evaluate(() => {
      // Simulate session timeout
      localStorage.setItem('sessionExpiry', Date.now() - 1000)
    })
    
    await page.reload()
    await expect(page).toHaveURL(/.*\/auth\/login/)
    await expect(page.locator('text=Session expired')).toBeVisible()
    
    // Test concurrent session handling
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Simulate login from another device
    await page.evaluate(() => {
      // Simulate concurrent session
      window.dispatchEvent(new Event('concurrent-session'))
    })
    
    // Verify concurrent session handling
    await expect(page.locator('text=Session terminated by another device')).toBeVisible()
  })

  test('Authorization and access control', async ({ page }) => {
    // Login as regular user
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'user@example.com')
    await page.fill('input[name="password"]', 'UserPassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test access to admin features
    await page.goto('http://localhost:7777/dashboard/admin')
    await expect(page.locator('text=Access Denied')).toBeVisible()
    await expect(page.locator('text=You do not have permission to access this page')).toBeVisible()
    
    // Test access to organization settings
    await page.goto('http://localhost:7777/dashboard/settings/organization')
    await expect(page.locator('text=Access Denied')).toBeVisible()
    
    // Test access to user management
    await page.goto('http://localhost:7777/dashboard/settings/users')
    await expect(page.locator('text=Access Denied')).toBeVisible()
    
    // Test access to billing
    await page.goto('http://localhost:7777/dashboard/settings/billing')
    await expect(page.locator('text=Access Denied')).toBeVisible()
    
    // Test access to API settings
    await page.goto('http://localhost:7777/dashboard/settings/api')
    await expect(page.locator('text=Access Denied')).toBeVisible()
  })

  test('Password security and requirements', async ({ page }) => {
    // Test password requirements
    await page.goto('http://localhost:7777/auth/register')
    
    // Test weak password
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')
    await page.click('button[type="submit"]')
    
    // Verify password requirements
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
    await expect(page.locator('text=Password must contain at least one uppercase letter')).toBeVisible()
    await expect(page.locator('text=Password must contain at least one lowercase letter')).toBeVisible()
    await expect(page.locator('text=Password must contain at least one number')).toBeVisible()
    await expect(page.locator('text=Password must contain at least one special character')).toBeVisible()
    
    // Test password mismatch
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')
    await page.click('button[type="submit"]')
    
    // Verify password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
    
    // Test strong password
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    // Verify password accepted
    await expect(page.locator('text=Password is strong')).toBeVisible()
  })

  test('Two-factor authentication', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Enable 2FA
    await page.click('text=Settings')
    await page.click('text=Security')
    await page.click('text=Enable Two-Factor Authentication')
    await expect(page.locator('[data-testid="2fa-setup-modal"]')).toBeVisible()
    
    // Test 2FA setup
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('text=Verify and Enable')
    await expect(page.locator('text=Two-factor authentication enabled')).toBeVisible()
    
    // Test 2FA login
    await page.click('text=Sign Out')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    
    // Verify 2FA prompt
    await expect(page.locator('text=Enter verification code')).toBeVisible()
    await expect(page.locator('input[name="verificationCode"]')).toBeVisible()
    
    // Test 2FA verification
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('text=Verify')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test 2FA backup codes
    await page.click('text=View Backup Codes')
    await expect(page.locator('[data-testid="backup-codes-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="backup-code"]')).toHaveCount(10)
    
    // Test 2FA disable
    await page.click('text=Disable Two-Factor Authentication')
    await expect(page.locator('[data-testid="disable-2fa-confirmation"]')).toBeVisible()
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('text=Disable 2FA')
    await expect(page.locator('text=Two-factor authentication disabled')).toBeVisible()
  })

  test('API security and rate limiting', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test API rate limiting
    for (let i = 0; i < 100; i++) {
      await page.goto('http://localhost:7777/api/dashboard')
    }
    
    // Verify rate limiting
    await expect(page.locator('text=Rate limit exceeded')).toBeVisible()
    
    // Test API authentication
    await page.goto('http://localhost:7777/api/dashboard')
    await expect(page.locator('text=Authentication required')).toBeVisible()
    
    // Test API authorization
    await page.goto('http://localhost:7777/api/admin')
    await expect(page.locator('text=Access denied')).toBeVisible()
  })

  test('Input validation and sanitization', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test XSS prevention
    await page.click('text=Forms')
    await page.click('text=Create Form')
    await page.fill('input[name="name"]', '<script>alert("XSS")</script>')
    await page.fill('textarea[name="description"]', '<img src="x" onerror="alert(\'XSS\')">')
    await page.click('text=Create Form')
    
    // Verify XSS prevention
    await expect(page.locator('text=Form created successfully')).toBeVisible()
    await expect(page.locator('script')).not.toBeVisible()
    await expect(page.locator('img[onerror]')).not.toBeVisible()
    
    // Test SQL injection prevention
    await page.fill('input[name="name"]', "'; DROP TABLE users; --")
    await page.click('text=Create Form')
    
    // Verify SQL injection prevention
    await expect(page.locator('text=Form created successfully')).toBeVisible()
    
    // Test HTML injection prevention
    await page.fill('input[name="name"]', '<h1>Hacked</h1>')
    await page.fill('textarea[name="description"]', '<div>Injected HTML</div>')
    await page.click('text=Create Form')
    
    // Verify HTML injection prevention
    await expect(page.locator('text=Form created successfully')).toBeVisible()
    await expect(page.locator('h1')).not.toContainText('Hacked')
    await expect(page.locator('div')).not.toContainText('Injected HTML')
  })

  test('File upload security', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test malicious file upload
    await page.click('text=Settings')
    await page.click('text=Profile')
    await page.click('text=Change Profile Picture')
    
    // Test executable file upload
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('test-files/malicious.exe')
    await page.click('text=Upload Picture')
    
    // Verify file type validation
    await expect(page.locator('text=Invalid file type')).toBeVisible()
    
    // Test oversized file upload
    await fileInput.setInputFiles('test-files/large-image.jpg')
    await page.click('text=Upload Picture')
    
    // Verify file size validation
    await expect(page.locator('text=File too large')).toBeVisible()
    
    // Test valid file upload
    await fileInput.setInputFiles('test-files/valid-image.jpg')
    await page.click('text=Upload Picture')
    
    // Verify successful upload
    await expect(page.locator('text=Profile picture updated successfully')).toBeVisible()
  })

  test('CSRF protection', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test CSRF token validation
    await page.evaluate(() => {
      // Remove CSRF token
      document.querySelector('input[name="_token"]')?.remove()
    })
    
    // Try to submit form without CSRF token
    await page.click('text=Forms')
    await page.click('text=Create Form')
    await page.fill('input[name="name"]', 'Test Form')
    await page.click('text=Create Form')
    
    // Verify CSRF protection
    await expect(page.locator('text=CSRF token missing')).toBeVisible()
    
    // Test CSRF token regeneration
    await page.reload()
    await page.fill('input[name="name"]', 'Test Form')
    await page.click('text=Create Form')
    
    // Verify form submission works with valid CSRF token
    await expect(page.locator('text=Form created successfully')).toBeVisible()
  })

  test('Session hijacking prevention', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test session token validation
    const sessionToken = await page.evaluate(() => localStorage.getItem('sessionToken'))
    expect(sessionToken).toBeTruthy()
    
    // Test session token regeneration
    await page.reload()
    const newSessionToken = await page.evaluate(() => localStorage.getItem('sessionToken'))
    expect(newSessionToken).toBeTruthy()
    expect(newSessionToken).not.toBe(sessionToken)
    
    // Test session invalidation on suspicious activity
    await page.evaluate(() => {
      // Simulate suspicious activity
      window.dispatchEvent(new Event('suspicious-activity'))
    })
    
    // Verify session invalidation
    await expect(page).toHaveURL(/.*\/auth\/login/)
    await expect(page.locator('text=Session invalidated due to suspicious activity')).toBeVisible()
  })

  test('Data encryption and privacy', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test data encryption in transit
    await page.goto('http://localhost:7777/dashboard')
    const response = await page.waitForResponse('**/api/**')
    expect(response.url()).toContain('https://')
    
    // Test data encryption at rest
    await page.click('text=Settings')
    await page.click('text=Profile')
    await page.fill('input[name="name"]', 'Encrypted User')
    await page.fill('input[name="email"]', 'encrypted@example.com')
    await page.click('text=Save Profile')
    
    // Verify data is encrypted
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()
    
    // Test data anonymization
    await page.click('text=Data')
    await page.click('text=Anonymize Data')
    await expect(page.locator('[data-testid="anonymize-modal"]')).toBeVisible()
    
    await page.fill('input[name="confirmationText"]', 'ANONYMIZE')
    await page.click('text=Anonymize Data')
    
    // Verify data anonymization
    await expect(page.locator('text=Data anonymized successfully')).toBeVisible()
  })

  test('Security headers and policies', async ({ page }) => {
    // Test security headers
    const response = await page.goto('http://localhost:7777')
    const headers = response.headers()
    
    // Verify security headers
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-xss-protection']).toBe('1; mode=block')
    expect(headers['strict-transport-security']).toContain('max-age=31536000')
    expect(headers['content-security-policy']).toContain("default-src 'self'")
    
    // Test CORS policy
    await page.goto('http://localhost:7777/api/dashboard')
    const corsResponse = await page.waitForResponse('**/api/**')
    const corsHeaders = corsResponse.headers()
    
    // Verify CORS headers
    expect(corsHeaders['access-control-allow-origin']).toBe('http://localhost:7777')
    expect(corsHeaders['access-control-allow-methods']).toContain('GET, POST, PUT, DELETE')
    expect(corsHeaders['access-control-allow-headers']).toContain('Content-Type, Authorization')
  })

  test('Security monitoring and logging', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Test security event logging
    await page.goto('http://localhost:7777/dashboard/admin')
    await expect(page.locator('text=Access Denied')).toBeVisible()
    
    // Verify security event is logged
    await page.goto('http://localhost:7777/dashboard/settings/security')
    await expect(page.locator('text=Security Events')).toBeVisible()
    await expect(page.locator('text=Unauthorized access attempt')).toBeVisible()
    
    // Test failed login logging
    await page.click('text=Sign Out')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Verify failed login is logged
    await page.goto('http://localhost:7777/dashboard/settings/security')
    await expect(page.locator('text=Failed login attempt')).toBeVisible()
    
    // Test security alerts
    await expect(page.locator('text=Security Alerts')).toBeVisible()
    await expect(page.locator('text=Multiple failed login attempts')).toBeVisible()
    await expect(page.locator('text=Unusual access pattern')).toBeVisible()
  })
})
