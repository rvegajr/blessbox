/**
 * Simple E2E Test
 * 
 * Basic test to verify the application is working
 */

import { test, expect } from '@playwright/test'

test.describe('Simple Application Test', () => {
  test('Application loads successfully', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:7777')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if the page title contains BlessBox
    const title = await page.title()
    expect(title).toContain('BlessBox')
  })

  test('Homepage has correct elements', async ({ page }) => {
    await page.goto('http://localhost:7777')
    
    // Check for main navigation elements
    await expect(page.locator('text=Get Started')).toBeVisible()
    await expect(page.locator('text=Sign In')).toBeVisible()
    
    // Check for main content
    await expect(page.locator('h1')).toBeVisible()
  })

  test('Navigation works', async ({ page }) => {
    await page.goto('http://localhost:7777')
    
    // Click on Get Started button
    await page.click('text=Get Started')
    
    // Should navigate to registration page
    await expect(page).toHaveURL(/.*\/auth\/register/)
  })
})

