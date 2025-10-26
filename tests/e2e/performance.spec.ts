/**
 * Performance and Load Testing E2E Tests
 * 
 * Comprehensive tests for application performance, load handling, and optimization
 */

import { test, expect } from '@playwright/test'

test.describe('Performance and Load Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Page load performance', async ({ page }) => {
    // Test dashboard load time
    const startTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify dashboard loads within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Test QR codes page load time
    const qrStartTime = Date.now()
    await page.click('text=QR Codes')
    await page.waitForLoadState('networkidle')
    const qrLoadTime = Date.now() - qrStartTime
    
    // Verify QR codes page loads within 2 seconds
    expect(qrLoadTime).toBeLessThan(2000)
    
    // Test forms page load time
    const formsStartTime = Date.now()
    await page.click('text=Forms')
    await page.waitForLoadState('networkidle')
    const formsLoadTime = Date.now() - formsStartTime
    
    // Verify forms page loads within 2 seconds
    expect(formsLoadTime).toBeLessThan(2000)
    
    // Test analytics page load time
    const analyticsStartTime = Date.now()
    await page.click('text=Analytics')
    await page.waitForLoadState('networkidle')
    const analyticsLoadTime = Date.now() - analyticsStartTime
    
    // Verify analytics page loads within 3 seconds
    expect(analyticsLoadTime).toBeLessThan(3000)
  })

  test('Form builder performance', async ({ page }) => {
    // Test form builder load time
    const startTime = Date.now()
    await page.click('text=Forms')
    await page.click('text=Create Form')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify form builder loads within 2 seconds
    expect(loadTime).toBeLessThan(2000)
    
    // Test form field addition performance
    const fieldStartTime = Date.now()
    await page.click('text=Add Field')
    await page.waitForSelector('[data-testid="field-editor"]')
    const fieldTime = Date.now() - fieldStartTime
    
    // Verify field editor loads within 500ms
    expect(fieldTime).toBeLessThan(500)
    
    // Test form field saving performance
    await page.fill('input[name="fieldLabel"]', 'Performance Test Field')
    await page.selectOption('select[name="fieldType"]', 'text')
    
    const saveStartTime = Date.now()
    await page.click('text=Save Field')
    await page.waitForSelector('[data-testid="field-item"]')
    const saveTime = Date.now() - saveStartTime
    
    // Verify field saving completes within 1 second
    expect(saveTime).toBeLessThan(1000)
    
    // Test large form performance
    for (let i = 0; i < 50; i++) {
      await page.click('text=Add Field')
      await page.fill('input[name="fieldLabel"]', `Field ${i + 1}`)
      await page.selectOption('select[name="fieldType"]', 'text')
      await page.click('text=Save Field')
    }
    
    // Verify large form handles 50 fields efficiently
    await expect(page.locator('[data-testid="field-item"]')).toHaveCount(51)
    
    // Test form preview performance
    const previewStartTime = Date.now()
    await page.click('text=Preview Form')
    await page.waitForSelector('[data-testid="form-preview"]')
    const previewTime = Date.now() - previewStartTime
    
    // Verify form preview loads within 2 seconds
    expect(previewTime).toBeLessThan(2000)
  })

  test('QR code generation performance', async ({ page }) => {
    // Test QR code creation performance
    const startTime = Date.now()
    await page.click('text=QR Codes')
    await page.click('text=Create QR Code Set')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify QR code creation loads within 2 seconds
    expect(loadTime).toBeLessThan(2000)
    
    // Test QR code form performance
    await page.fill('input[name="name"]', 'Performance Test QR Code')
    await page.fill('textarea[name="description"]', 'Performance test description')
    
    // Test QR code generation performance
    const generateStartTime = Date.now()
    await page.click('text=Generate QR Codes')
    await page.waitForSelector('[data-testid="qr-code-generated"]')
    const generateTime = Date.now() - generateStartTime
    
    // Verify QR code generation completes within 3 seconds
    expect(generateTime).toBeLessThan(3000)
    
    // Test bulk QR code generation
    for (let i = 0; i < 10; i++) {
      await page.click('text=Add QR Code')
      await page.fill('input[name="qrCodeLabel"]', `QR Code ${i + 1}`)
      await page.selectOption('select[name="entryPoint"]', 'main')
      await page.click('text=Save QR Code')
    }
    
    // Test bulk generation performance
    const bulkStartTime = Date.now()
    await page.click('text=Generate All QR Codes')
    await page.waitForSelector('[data-testid="bulk-generation-complete"]')
    const bulkTime = Date.now() - bulkStartTime
    
    // Verify bulk generation completes within 5 seconds
    expect(bulkTime).toBeLessThan(5000)
  })

  test('Analytics dashboard performance', async ({ page }) => {
    // Test analytics load time
    const startTime = Date.now()
    await page.click('text=Analytics')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify analytics loads within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Test chart rendering performance
    const chartStartTime = Date.now()
    await page.waitForSelector('[data-testid="registration-trends-chart"]')
    const chartTime = Date.now() - chartStartTime
    
    // Verify charts render within 2 seconds
    expect(chartTime).toBeLessThan(2000)
    
    // Test data refresh performance
    const refreshStartTime = Date.now()
    await page.click('[data-testid="refresh-button"]')
    await page.waitForSelector('[data-testid="live-metrics"]')
    const refreshTime = Date.now() - refreshStartTime
    
    // Verify data refresh completes within 1 second
    expect(refreshTime).toBeLessThan(1000)
    
    // Test date range change performance
    const dateStartTime = Date.now()
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Last 30 days')
    await page.waitForSelector('[data-testid="analytics-chart"]')
    const dateTime = Date.now() - dateStartTime
    
    // Verify date range change completes within 1.5 seconds
    expect(dateTime).toBeLessThan(1500)
  })

  test('Database query performance', async ({ page }) => {
    // Test large dataset handling
    const startTime = Date.now()
    await page.click('text=Forms')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify forms page loads within 2 seconds
    expect(loadTime).toBeLessThan(2000)
    
    // Test pagination performance
    const paginationStartTime = Date.now()
    await page.click('text=Load More')
    await page.waitForSelector('[data-testid="form-item"]').nth(20)
    const paginationTime = Date.now() - paginationStartTime
    
    // Verify pagination completes within 1 second
    expect(paginationTime).toBeLessThan(1000)
    
    // Test search performance
    const searchStartTime = Date.now()
    await page.fill('[data-testid="search-input"]', 'Test')
    await page.press('[data-testid="search-input"]', 'Enter')
    await page.waitForSelector('[data-testid="search-results"]')
    const searchTime = Date.now() - searchStartTime
    
    // Verify search completes within 500ms
    expect(searchTime).toBeLessThan(500)
    
    // Test filtering performance
    const filterStartTime = Date.now()
    await page.click('[data-testid="filter-button"]')
    await page.check('input[value="active"]')
    await page.click('text=Apply Filters')
    await page.waitForSelector('[data-testid="filtered-results"]')
    const filterTime = Date.now() - filterStartTime
    
    // Verify filtering completes within 500ms
    expect(filterTime).toBeLessThan(500)
  })

  test('API response performance', async ({ page }) => {
    // Test API response times
    const apiStartTime = Date.now()
    const response = await page.waitForResponse('**/api/dashboard/**')
    const apiTime = Date.now() - apiStartTime
    
    // Verify API responds within 1 second
    expect(apiTime).toBeLessThan(1000)
    expect(response.status()).toBe(200)
    
    // Test concurrent API calls
    const concurrentStartTime = Date.now()
    await Promise.all([
      page.goto('http://localhost:7777/api/forms'),
      page.goto('http://localhost:7777/api/qr-codes'),
      page.goto('http://localhost:7777/api/analytics')
    ])
    const concurrentTime = Date.now() - concurrentStartTime
    
    // Verify concurrent API calls complete within 2 seconds
    expect(concurrentTime).toBeLessThan(2000)
    
    // Test API error handling performance
    await page.route('**/api/**', route => route.abort())
    
    const errorStartTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForSelector('text=Failed to load data')
    const errorTime = Date.now() - errorStartTime
    
    // Verify error handling completes within 2 seconds
    expect(errorTime).toBeLessThan(2000)
    
    // Restore API
    await page.unroute('**/api/**')
  })

  test('Memory usage and optimization', async ({ page }) => {
    // Test memory usage during form building
    const initialMemory = await page.evaluate(() => performance.memory.usedJSHeapSize)
    
    // Create large form
    await page.click('text=Forms')
    await page.click('text=Create Form')
    
    for (let i = 0; i < 100; i++) {
      await page.click('text=Add Field')
      await page.fill('input[name="fieldLabel"]', `Field ${i + 1}`)
      await page.selectOption('select[name="fieldType"]', 'text')
      await page.click('text=Save Field')
    }
    
    const finalMemory = await page.evaluate(() => performance.memory.usedJSHeapSize)
    const memoryIncrease = finalMemory - initialMemory
    
    // Verify memory increase is reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    
    // Test memory cleanup
    await page.reload()
    const cleanedMemory = await page.evaluate(() => performance.memory.usedJSHeapSize)
    
    // Verify memory is cleaned up
    expect(cleanedMemory).toBeLessThan(finalMemory)
  })

  test('Concurrent user simulation', async ({ page, context }) => {
    // Create multiple browser contexts to simulate concurrent users
    const contexts = []
    const pages = []
    
    for (let i = 0; i < 5; i++) {
      const newContext = await context.browser().newContext()
      const newPage = await newContext.newPage()
      contexts.push(newContext)
      pages.push(newPage)
    }
    
    // Simulate concurrent login
    const loginPromises = pages.map(async (page, index) => {
      await page.goto('http://localhost:7777/auth/login')
      await page.fill('input[name="email"]', `user${index}@example.com`)
      await page.fill('input[name="password"]', 'SecurePassword123!')
      await page.click('button[type="submit"]')
      return page.waitForURL(/.*\/dashboard/)
    })
    
    const loginStartTime = Date.now()
    await Promise.all(loginPromises)
    const loginTime = Date.now() - loginStartTime
    
    // Verify concurrent login completes within 5 seconds
    expect(loginTime).toBeLessThan(5000)
    
    // Simulate concurrent dashboard access
    const dashboardPromises = pages.map(async (page) => {
      await page.goto('http://localhost:7777/dashboard')
      return page.waitForLoadState('networkidle')
    })
    
    const dashboardStartTime = Date.now()
    await Promise.all(dashboardPromises)
    const dashboardTime = Date.now() - dashboardStartTime
    
    // Verify concurrent dashboard access completes within 3 seconds
    expect(dashboardTime).toBeLessThan(3000)
    
    // Clean up contexts
    for (const context of contexts) {
      await context.close()
    }
  })

  test('Large dataset handling', async ({ page }) => {
    // Test large form handling
    await page.click('text=Forms')
    await page.click('text=Create Form')
    
    // Create form with many fields
    for (let i = 0; i < 200; i++) {
      await page.click('text=Add Field')
      await page.fill('input[name="fieldLabel"]', `Field ${i + 1}`)
      await page.selectOption('select[name="fieldType"]', 'text')
      await page.click('text=Save Field')
    }
    
    // Test form preview with large dataset
    const previewStartTime = Date.now()
    await page.click('text=Preview Form')
    await page.waitForSelector('[data-testid="form-preview"]')
    const previewTime = Date.now() - previewStartTime
    
    // Verify large form preview loads within 5 seconds
    expect(previewTime).toBeLessThan(5000)
    
    // Test form submission with large dataset
    await page.fill('input[name="field1"]', 'Test Value 1')
    await page.fill('input[name="field2"]', 'Test Value 2')
    // Fill a few more fields for testing
    for (let i = 3; i <= 10; i++) {
      await page.fill(`input[name="field${i}"]`, `Test Value ${i}`)
    }
    
    const submitStartTime = Date.now()
    await page.click('text=Submit')
    await page.waitForSelector('text=Form submitted successfully')
    const submitTime = Date.now() - submitStartTime
    
    // Verify large form submission completes within 3 seconds
    expect(submitTime).toBeLessThan(3000)
  })

  test('Network optimization', async ({ page }) => {
    // Test image optimization
    const imageStartTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForLoadState('networkidle')
    const imageTime = Date.now() - imageStartTime
    
    // Verify page loads within 3 seconds
    expect(imageTime).toBeLessThan(3000)
    
    // Test CSS optimization
    const cssStartTime = Date.now()
    await page.click('text=QR Codes')
    await page.waitForLoadState('networkidle')
    const cssTime = Date.now() - cssStartTime
    
    // Verify CSS loads quickly
    expect(cssTime).toBeLessThan(1000)
    
    // Test JavaScript optimization
    const jsStartTime = Date.now()
    await page.click('text=Forms')
    await page.waitForLoadState('networkidle')
    const jsTime = Date.now() - jsStartTime
    
    // Verify JavaScript loads quickly
    expect(jsTime).toBeLessThan(1000)
    
    // Test API optimization
    const apiStartTime = Date.now()
    await page.click('text=Analytics')
    await page.waitForResponse('**/api/analytics/**')
    const apiTime = Date.now() - apiStartTime
    
    // Verify API optimization
    expect(apiTime).toBeLessThan(1500)
  })

  test('Caching and optimization', async ({ page }) => {
    // Test initial load
    const initialStartTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForLoadState('networkidle')
    const initialTime = Date.now() - initialStartTime
    
    // Test cached load
    const cachedStartTime = Date.now()
    await page.reload()
    await page.waitForLoadState('networkidle')
    const cachedTime = Date.now() - cachedStartTime
    
    // Verify cached load is faster
    expect(cachedTime).toBeLessThan(initialTime)
    
    // Test browser caching
    const cacheStartTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForLoadState('networkidle')
    const cacheTime = Date.now() - cacheStartTime
    
    // Verify browser caching works
    expect(cacheTime).toBeLessThan(1000)
    
    // Test API caching
    const apiStartTime = Date.now()
    await page.click('text=Analytics')
    await page.waitForResponse('**/api/analytics/**')
    const apiTime = Date.now() - apiStartTime
    
    // Verify API caching works
    expect(apiTime).toBeLessThan(500)
  })

  test('Error handling performance', async ({ page }) => {
    // Test error page load time
    const errorStartTime = Date.now()
    await page.goto('http://localhost:7777/nonexistent-page')
    await page.waitForLoadState('networkidle')
    const errorTime = Date.now() - errorStartTime
    
    // Verify error page loads within 2 seconds
    expect(errorTime).toBeLessThan(2000)
    
    // Test API error handling
    await page.route('**/api/**', route => route.abort())
    
    const apiErrorStartTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForSelector('text=Failed to load data')
    const apiErrorTime = Date.now() - apiErrorStartTime
    
    // Verify API error handling completes within 2 seconds
    expect(apiErrorTime).toBeLessThan(2000)
    
    // Restore API
    await page.unroute('**/api/**')
    
    // Test form validation performance
    await page.click('text=Forms')
    await page.click('text=Create Form')
    
    const validationStartTime = Date.now()
    await page.click('text=Create Form')
    await page.waitForSelector('text=Form name is required')
    const validationTime = Date.now() - validationStartTime
    
    // Verify validation completes within 500ms
    expect(validationTime).toBeLessThan(500)
  })

  test('Performance monitoring and metrics', async ({ page }) => {
    // Test performance metrics collection
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      const paint = performance.getEntriesByType('paint')
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
      }
    })
    
    // Verify performance metrics are reasonable
    expect(metrics.loadTime).toBeLessThan(3000)
    expect(metrics.domContentLoaded).toBeLessThan(2000)
    expect(metrics.firstPaint).toBeLessThan(1500)
    expect(metrics.firstContentfulPaint).toBeLessThan(2000)
    
    // Test Core Web Vitals
    const vitals = await page.evaluate(() => {
      return {
        lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
        fid: performance.getEntriesByType('first-input')[0]?.processingStart,
        cls: performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0)
      }
    })
    
    // Verify Core Web Vitals are within acceptable ranges
    expect(vitals.lcp).toBeLessThan(2500)
    expect(vitals.fid).toBeLessThan(100)
    expect(vitals.cls).toBeLessThan(0.1)
  })
})
