/**
 * Landing Page E2E Tests
 * 
 * Comprehensive tests for the BlessBox homepage and marketing content
 */

import { test, expect } from '@playwright/test'

test.describe('Landing Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:7777')
  })

  test('Homepage loads correctly', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/BlessBox/)
    
    // Verify main heading
    await expect(page.locator('h1')).toContainText('Streamline Registration with')
    await expect(page.locator('h1')).toContainText('QR Codes')
    
    // Verify page is fully loaded
    await expect(page.locator('body')).toBeVisible()
  })

  test('Navigation elements are visible and functional', async ({ page }) => {
    // Check header navigation
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('text=BlessBox')).toBeVisible()
    
    // Check navigation links
    await expect(page.locator('text=Features')).toBeVisible()
    await expect(page.locator('text=Pricing')).toBeVisible()
    await expect(page.locator('text=Contact')).toBeVisible()
    
    // Check CTA buttons
    await expect(page.locator('text=Sign In')).toBeVisible()
    await expect(page.locator('text=Get Started')).toBeVisible()
  })

  test('Hero section displays properly', async ({ page }) => {
    // Verify hero content
    await expect(page.locator('h1')).toContainText('Streamline Registration with')
    await expect(page.locator('h1')).toContainText('QR Codes')
    
    // Verify description
    await expect(page.locator('text=Transform your organization')).toBeVisible()
    
    // Verify CTA buttons
    await expect(page.locator('text=Start Free Trial')).toBeVisible()
    await expect(page.locator('text=Watch Demo')).toBeVisible()
  })

  test('Feature cards are interactive', async ({ page }) => {
    // Verify all 4 feature cards are present
    await expect(page.locator('text=1. Organization Setup')).toBeVisible()
    await expect(page.locator('text=2. Generate QR Codes')).toBeVisible()
    await expect(page.locator('text=3. Mobile Registration')).toBeVisible()
    await expect(page.locator('text=4. Verification & Check-in')).toBeVisible()
    
    // Verify card content
    await expect(page.locator('text=Create your organization profile')).toBeVisible()
    await expect(page.locator('text=Create custom QR codes')).toBeVisible()
    await expect(page.locator('text=Recipients scan QR codes')).toBeVisible()
    await expect(page.locator('text=Real-time verification')).toBeVisible()
  })

  test('CTA buttons work correctly', async ({ page }) => {
    // Test "Get Started" button navigation
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)
    
    // Go back to homepage
    await page.goto('http://localhost:7777')
    
    // Test "Start Free Trial" button
    await page.click('text=Start Free Trial')
    await expect(page).toHaveURL(/.*\/auth\/register/)
  })

  test('Footer links are functional', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    
    // Verify footer content
    await expect(page.locator('text=© 2024 BlessBox. All rights reserved.')).toBeVisible()
    
    // Check footer links
    await expect(page.locator('text=Features')).toBeVisible()
    await expect(page.locator('text=Pricing')).toBeVisible()
    await expect(page.locator('text=Demo')).toBeVisible()
    await expect(page.locator('text=Help Center')).toBeVisible()
    await expect(page.locator('text=Contact')).toBeVisible()
    await expect(page.locator('text=Privacy')).toBeVisible()
    await expect(page.locator('text=Terms')).toBeVisible()
    await expect(page.locator('text=Security')).toBeVisible()
  })

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify mobile layout
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('h1')).toBeVisible()
    
    // Check that navigation is hidden on mobile
    await expect(page.locator('nav.hidden')).toBeVisible()
    
    // Verify CTA buttons are still visible
    await expect(page.locator('text=Get Started')).toBeVisible()
  })

  test('SEO meta tags are present', async ({ page }) => {
    // Check title
    await expect(page).toHaveTitle(/BlessBox/)
    
    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content')
    expect(metaDescription).toContain('registration')
    
    // Check meta keywords
    const metaKeywords = await page.locator('meta[name="keywords"]').getAttribute('content')
    expect(metaKeywords).toContain('QR codes')
  })

  test('Performance metrics', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto('http://localhost:7777')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify page loads within reasonable time (5 seconds)
    expect(loadTime).toBeLessThan(5000)
    
    // Check for loading indicators
    await expect(page.locator('body')).toBeVisible()
  })

  test('Accessibility compliance', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h2')).toBeVisible()
    
    // Check for alt text on images (if any)
    const images = await page.locator('img').count()
    for (let i = 0; i < images; i++) {
      const alt = await page.locator('img').nth(i).getAttribute('alt')
      expect(alt).toBeTruthy()
    }
    
    // Check for proper link text
    const links = await page.locator('a').count()
    for (let i = 0; i < links; i++) {
      const linkText = await page.locator('a').nth(i).textContent()
      expect(linkText?.trim()).toBeTruthy()
    }
  })

  test('Navigation menu functionality', async ({ page }) => {
    // Test Features link
    await page.click('text=Features')
    await expect(page.locator('#features')).toBeInViewport()
    
    // Test Pricing link
    await page.click('text=Pricing')
    await expect(page.locator('#pricing')).toBeInViewport()
    
    // Test Contact link
    await page.click('text=Contact')
    await expect(page.locator('#contact')).toBeInViewport()
  })

  test('Content sections are properly structured', async ({ page }) => {
    // Verify hero section
    await expect(page.locator('section').first()).toBeVisible()
    
    // Verify features section
    await expect(page.locator('#features')).toBeVisible()
    await expect(page.locator('text=How BlessBox Works')).toBeVisible()
    
    // Verify CTA section
    await expect(page.locator('text=Ready to Transform Your Registration Process?')).toBeVisible()
    
    // Verify footer
    await expect(page.locator('footer')).toBeVisible()
  })

  test('Button interactions and hover effects', async ({ page }) => {
    // Test button hover effects
    const getStartedButton = page.locator('text=Get Started').first()
    await getStartedButton.hover()
    
    // Verify button is still clickable after hover
    await expect(getStartedButton).toBeVisible()
    
    // Test button click
    await getStartedButton.click()
    await expect(page).toHaveURL(/.*\/auth\/register/)
  })

  test('Page scroll behavior', async ({ page }) => {
    // Test smooth scrolling to sections
    await page.click('text=Features')
    await page.waitForTimeout(500) // Wait for scroll animation
    
    // Verify we're in the features section
    await expect(page.locator('#features')).toBeInViewport()
    
    // Test scroll to top
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page.locator('header')).toBeInViewport()
  })
})
