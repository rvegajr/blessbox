/**
 * Analytics E2E Tests
 * 
 * Comprehensive tests for analytics dashboard, reporting, and data visualization
 */

import { test, expect } from '@playwright/test'

test.describe('Analytics Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Analytics dashboard overview', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Verify main analytics sections
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible()
    await expect(page.locator('text=Key Metrics')).toBeVisible()
    await expect(page.locator('text=Registration Trends')).toBeVisible()
    await expect(page.locator('text=QR Code Performance')).toBeVisible()
    await expect(page.locator('text=Form Analytics')).toBeVisible()
    
    // Verify key metrics cards
    await expect(page.locator('[data-testid="metric-total-registrations"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-active-qr-codes"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-forms-created"]')).toBeVisible()
    await expect(page.locator('[data-testid="metric-checkins-today"]')).toBeVisible()
    
    // Verify metric values
    await expect(page.locator('[data-testid="metric-total-registrations"]')).toContainText('100')
    await expect(page.locator('[data-testid="metric-active-qr-codes"]')).toContainText('5')
    await expect(page.locator('[data-testid="metric-forms-created"]')).toContainText('3')
    await expect(page.locator('[data-testid="metric-checkins-today"]')).toContainText('15')
  })

  test('Registration trends analysis', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test registration trends chart
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
    
    // Test date range selection
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Last 30 days')
    
    // Verify chart updates
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
    
    // Test different time periods
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Last 7 days')
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
    
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Last 90 days')
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
    
    // Test custom date range
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Custom Range')
    await page.fill('input[name="startDate"]', '2024-01-01')
    await page.fill('input[name="endDate"]', '2024-01-31')
    await page.click('text=Apply Range')
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
  })

  test('QR Code performance analytics', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test QR code performance section
    await expect(page.locator('text=QR Code Performance')).toBeVisible()
    await expect(page.locator('[data-testid="qr-code-performance-chart"]')).toBeVisible()
    
    // Test QR code selection
    await page.click('[data-testid="qr-code-selector"]')
    await page.click('text=Event Registration QR')
    
    // Verify chart updates
    await expect(page.locator('[data-testid="qr-code-performance-chart"]')).toBeVisible()
    
    // Test performance metrics
    await expect(page.locator('text=Total Scans')).toBeVisible()
    await expect(page.locator('text=Unique Scans')).toBeVisible()
    await expect(page.locator('text=Conversion Rate')).toBeVisible()
    await expect(page.locator('text=Average Scan Time')).toBeVisible()
    
    // Test device breakdown
    await expect(page.locator('[data-testid="device-breakdown-chart"]')).toBeVisible()
    await expect(page.locator('text=Mobile')).toBeVisible()
    await expect(page.locator('text=Desktop')).toBeVisible()
    await expect(page.locator('text=Tablet')).toBeVisible()
    
    // Test browser breakdown
    await expect(page.locator('[data-testid="browser-breakdown-chart"]')).toBeVisible()
    await expect(page.locator('text=Chrome')).toBeVisible()
    await expect(page.locator('text=Safari')).toBeVisible()
    await expect(page.locator('text=Firefox')).toBeVisible()
  })

  test('Form analytics and insights', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test form analytics section
    await expect(page.locator('text=Form Analytics')).toBeVisible()
    await expect(page.locator('[data-testid="form-analytics-chart"]')).toBeVisible()
    
    // Test form selection
    await page.click('[data-testid="form-selector"]')
    await page.click('text=Event Registration Form')
    
    // Verify chart updates
    await expect(page.locator('[data-testid="form-analytics-chart"]')).toBeVisible()
    
    // Test form performance metrics
    await expect(page.locator('text=Total Submissions')).toBeVisible()
    await expect(page.locator('text=Completion Rate')).toBeVisible()
    await expect(page.locator('text=Average Completion Time')).toBeVisible()
    await expect(page.locator('text=Abandonment Rate')).toBeVisible()
    
    // Test field performance
    await expect(page.locator('[data-testid="field-performance-chart"]')).toBeVisible()
    await expect(page.locator('text=Full Name')).toBeVisible()
    await expect(page.locator('text=Email')).toBeVisible()
    await expect(page.locator('text=Phone')).toBeVisible()
    
    // Test form insights
    await expect(page.locator('text=Form Insights')).toBeVisible()
    await expect(page.locator('text=Most Common Abandonment Point')).toBeVisible()
    await expect(page.locator('text=Field Validation Issues')).toBeVisible()
    await expect(page.locator('text=User Experience Score')).toBeVisible()
  })

  test('Real-time analytics and live updates', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test real-time indicators
    await expect(page.locator('[data-testid="live-indicator"]')).toBeVisible()
    await expect(page.locator('text=Live Data')).toBeVisible()
    
    // Test real-time metrics
    await expect(page.locator('[data-testid="live-metrics"]')).toBeVisible()
    await expect(page.locator('text=Active Users')).toBeVisible()
    await expect(page.locator('text=Scans in Last Hour')).toBeVisible()
    await expect(page.locator('text=Submissions in Last Hour')).toBeVisible()
    
    // Test auto-refresh
    await page.waitForTimeout(5000)
    await expect(page.locator('[data-testid="live-indicator"]')).toBeVisible()
    
    // Test manual refresh
    await page.click('[data-testid="refresh-button"]')
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    await page.waitForSelector('[data-testid="live-metrics"]', { timeout: 10000 })
  })

  test('Analytics filtering and segmentation', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test organization filter
    await page.click('[data-testid="organization-filter"]')
    await page.click('text=Test Organization')
    
    // Verify filter applied
    await expect(page.locator('[data-testid="active-filters"]')).toBeVisible()
    await expect(page.locator('text=Test Organization')).toBeVisible()
    
    // Test QR code set filter
    await page.click('[data-testid="qr-code-set-filter"]')
    await page.click('text=Event Registration')
    
    // Verify filter applied
    await expect(page.locator('text=Event Registration')).toBeVisible()
    
    // Test form filter
    await page.click('[data-testid="form-filter"]')
    await page.click('text=Event Registration Form')
    
    // Verify filter applied
    await expect(page.locator('text=Event Registration Form')).toBeVisible()
    
    // Test user segment filter
    await page.click('[data-testid="user-segment-filter"]')
    await page.click('text=New Users')
    
    // Verify filter applied
    await expect(page.locator('text=New Users')).toBeVisible()
    
    // Test clear filters
    await page.click('text=Clear All Filters')
    await expect(page.locator('[data-testid="active-filters"]')).not.toBeVisible()
  })

  test('Analytics export and reporting', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test export functionality
    await page.click('text=Export Analytics')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    // Test export format selection
    await page.check('input[value="csv"]')
    await page.check('input[value="pdf"]')
    await page.check('input[value="excel"]')
    
    // Test date range selection for export
    await page.click('[data-testid="export-date-range"]')
    await page.click('text=Last 30 days')
    
    // Test data selection for export
    await page.check('input[value="registration-data"]')
    await page.check('input[value="qr-code-data"]')
    await page.check('input[value="form-data"]')
    await page.check('input[value="user-data"]')
    
    // Start export
    await page.click('text=Export Data')
    
    // Verify export starts
    await expect(page.locator('text=Exporting...')).toBeVisible()
    
    // Wait for export to complete
    await page.waitForSelector('text=Export completed', { timeout: 30000 })
    
    // Test scheduled reports
    await page.click('text=Schedule Report')
    await expect(page.locator('[data-testid="schedule-modal"]')).toBeVisible()
    
    // Configure scheduled report
    await page.fill('input[name="reportName"]', 'Weekly Analytics Report')
    await page.selectOption('select[name="frequency"]', 'weekly')
    await page.selectOption('select[name="dayOfWeek"]', 'monday')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.click('text=Schedule Report')
    
    // Verify report scheduled
    await expect(page.locator('text=Report scheduled successfully')).toBeVisible()
  })

  test('Analytics dashboard customization', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test dashboard customization
    await page.click('text=Customize Dashboard')
    await expect(page.locator('[data-testid="customize-modal"]')).toBeVisible()
    
    // Test widget selection
    await page.check('input[value="registration-trends"]')
    await page.check('input[value="qr-code-performance"]')
    await page.check('input[value="form-analytics"]')
    await page.check('input[value="user-activity"]')
    
    // Test widget arrangement
    const registrationWidget = page.locator('[data-testid="widget-registration-trends"]')
    const qrCodeWidget = page.locator('[data-testid="widget-qr-code-performance"]')
    
    await registrationWidget.dragTo(qrCodeWidget)
    
    // Test widget sizing
    await page.click('[data-testid="widget-registration-trends"]')
    await page.selectOption('select[name="widgetSize"]', 'large')
    
    // Save customization
    await page.click('text=Save Layout')
    await expect(page.locator('text=Layout saved successfully')).toBeVisible()
    
    // Test dashboard themes
    await page.click('text=Change Theme')
    await page.selectOption('select[name="theme"]', 'dark')
    await page.click('text=Apply Theme')
    
    // Verify theme applied
    await expect(page.locator('[data-testid="dark-theme"]')).toBeVisible()
  })

  test('Analytics alerts and notifications', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test alert configuration
    await page.click('text=Set Up Alerts')
    await expect(page.locator('[data-testid="alerts-modal"]')).toBeVisible()
    
    // Create registration alert
    await page.click('text=Add Alert')
    await page.fill('input[name="alertName"]', 'High Registration Volume')
    await page.selectOption('select[name="metric"]', 'total-registrations')
    await page.selectOption('select[name="condition"]', 'greater-than')
    await page.fill('input[name="threshold"]', '50')
    await page.selectOption('select[name="timeframe"]', 'hourly')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.click('text=Save Alert')
    
    // Verify alert created
    await expect(page.locator('text=Alert created successfully')).toBeVisible()
    
    // Create QR code scan alert
    await page.click('text=Add Alert')
    await page.fill('input[name="alertName"]', 'Low QR Code Scans')
    await page.selectOption('select[name="metric"]', 'qr-code-scans')
    await page.selectOption('select[name="condition"]', 'less-than')
    await page.fill('input[name="threshold"]', '10')
    await page.selectOption('select[name="timeframe"]', 'daily')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.click('text=Save Alert')
    
    // Verify alert created
    await expect(page.locator('text=Alert created successfully')).toBeVisible()
    
    // Test alert management
    await expect(page.locator('[data-testid="alert-item"]')).toHaveCount(2)
    
    // Test alert editing
    await page.locator('[data-testid="alert-item"]').first().locator('text=Edit').click()
    await page.fill('input[name="threshold"]', '75')
    await page.click('text=Save Changes')
    
    // Verify alert updated
    await expect(page.locator('text=Alert updated successfully')).toBeVisible()
    
    // Test alert deletion
    await page.locator('[data-testid="alert-item"]').first().locator('text=Delete').click()
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Delete')
    await expect(page.locator('text=Alert deleted successfully')).toBeVisible()
  })

  test('Analytics data visualization', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Test chart interactions
    await page.hover('[data-testid="registration-trends-chart"]')
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible()
    
    // Test chart zoom
    await page.locator('[data-testid="registration-trends-chart"]').click()
    await page.mouse.wheel(0, 100)
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
    
    // Test chart legend
    await page.click('[data-testid="chart-legend"]')
    await expect(page.locator('[data-testid="legend-item"]')).toBeVisible()
    
    // Test chart type switching
    await page.click('[data-testid="chart-type-selector"]')
    await page.click('text=Bar Chart')
    await expect(page.locator('[data-testid="bar-chart"]')).toBeVisible()
    
    await page.click('[data-testid="chart-type-selector"]')
    await page.click('text=Line Chart')
    await expect(page.locator('[data-testid="line-chart"]')).toBeVisible()
    
    await page.click('[data-testid="chart-type-selector"]')
    await page.click('text=Pie Chart')
    await expect(page.locator('[data-testid="pie-chart"]')).toBeVisible()
    
    // Test chart data export
    await page.click('[data-testid="chart-export"]')
    await expect(page.locator('text=Chart data exported')).toBeVisible()
  })

  test('Analytics performance and loading', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Measure page load time
    const startTime = Date.now()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify page loads within reasonable time
    expect(loadTime).toBeLessThan(5000)
    
    // Test chart loading performance
    const chartStartTime = Date.now()
    await page.waitForSelector('[data-testid="registration-trends-chart"]')
    const chartLoadTime = Date.now() - chartStartTime
    
    // Verify charts load quickly
    expect(chartLoadTime).toBeLessThan(3000)
    
    // Test data refresh performance
    await page.click('[data-testid="refresh-button"]')
    const refreshStartTime = Date.now()
    await page.waitForSelector('[data-testid="live-metrics"]')
    const refreshTime = Date.now() - refreshStartTime
    
    // Verify refresh is fast
    expect(refreshTime).toBeLessThan(2000)
    
    // Test large dataset handling
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Last 90 days')
    
    const largeDataStartTime = Date.now()
    await page.waitForSelector('[data-testid="registration-trends-chart"]')
    const largeDataTime = Date.now() - largeDataStartTime
    
    // Verify large datasets are handled efficiently
    expect(largeDataTime).toBeLessThan(4000)
  })

  test('Analytics accessibility and compliance', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
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
    await expect(page.locator('[aria-label="Analytics Dashboard"]')).toBeVisible()
    await expect(page.locator('[aria-label="Registration Trends Chart"]')).toBeVisible()
    
    // Test chart accessibility
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toHaveAttribute('role', 'img')
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toHaveAttribute('aria-label', 'Registration trends over time')
    
    // Test color contrast
    const chartElement = page.locator('[data-testid="registration-trends-chart"]')
    const backgroundColor = await chartElement.evaluate(el => getComputedStyle(el).backgroundColor)
    const textColor = await chartElement.evaluate(el => getComputedStyle(el).color)
    
    // Verify sufficient color contrast (basic check)
    expect(backgroundColor).not.toBe(textColor)
  })

  test('Analytics error handling and recovery', async ({ page }) => {
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page).toHaveURL(/.*\/dashboard\/analytics/)
    
    // Simulate API error
    await page.route('**/api/analytics/**', route => route.abort())
    
    // Reload analytics
    await page.reload()
    
    // Verify error message
    await expect(page.locator('text=Failed to load analytics data')).toBeVisible()
    
    // Verify retry button
    await expect(page.locator('text=Retry')).toBeVisible()
    
    // Test retry functionality
    await page.unroute('**/api/analytics/**')
    await page.click('text=Retry')
    
    // Verify analytics loads successfully
    await expect(page.locator('text=Key Metrics')).toBeVisible()
    
    // Test partial data loading
    await page.route('**/api/analytics/registration-trends', route => route.abort())
    
    // Reload analytics
    await page.reload()
    
    // Verify partial data is shown
    await expect(page.locator('text=Key Metrics')).toBeVisible()
    await expect(page.locator('text=Some data unavailable')).toBeVisible()
    
    // Test data recovery
    await page.unroute('**/api/analytics/registration-trends')
    await page.click('text=Refresh Data')
    
    // Verify all data loads
    await expect(page.locator('[data-testid="registration-trends-chart"]')).toBeVisible()
  })
})
