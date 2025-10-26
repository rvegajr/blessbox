/**
 * Complete Donation Flow E2E Tests
 * 
 * Comprehensive test covering the complete donation workflow:
 * 1. Organization creation and setup
 * 2. QR code generation for donation doors
 * 3. Donor registration via QR code scanning
 * 4. Check-in process with generated QR codes
 */

import { test, expect } from '@playwright/test'

test.describe('Complete Donation Flow Tests', () => {
  test('Complete Donation Organization Setup to Donor Registration Flow', async ({ page }) => {
    console.log('🏢 Starting Complete Donation Flow Test...')
    
    // ========================================
    // PHASE 1: ORGANIZATION CREATION & SETUP
    // ========================================
    
    console.log('📋 Phase 1: Creating Donation Organization...')
    
    // Navigate to registration
    await page.goto('http://localhost:7777')
    await page.click('text=Get Started')
    await expect(page).toHaveURL(/.*\/auth\/register/)

    // Fill organization information
    await page.fill('input[name="name"]', 'Sarah Johnson')
    await page.fill('input[name="email"]', 'sarah@charityfoundation.org')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.fill('input[name="organizationName"]', 'Charity Foundation')
    await page.fill('input[name="organizationDescription"]', 'Non-profit organization accepting donations for community programs')

    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/email-verification/)

    // Email verification
    await page.fill('input[name="verificationCode"]', '123456')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/onboarding\/form-builder/)

    // Configure donation form
    console.log('📝 Configuring Donation Registration Form...')
    
    await page.fill('input[name="formName"]', 'Donation Registration Form')
    await page.fill('textarea[name="formDescription"]', 'Registration form for donors to receive their check-in QR codes')
    
    // Add donor information fields
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

    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Donation Amount')
    await page.selectOption('select[name="fieldType"]', 'number')
    await page.check('input[name="fieldRequired"]')
    await page.click('text=Save Field')

    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Donation Type')
    await page.selectOption('select[name="fieldType"]', 'select')
    await page.click('text=Add Option')
    await page.fill('input[name="optionLabel"]', 'Cash')
    await page.fill('input[name="optionValue"]', 'cash')
    await page.click('text=Save Option')
    await page.click('text=Add Option')
    await page.fill('input[name="optionLabel"]', 'Check')
    await page.fill('input[name="optionValue"]', 'check')
    await page.click('text=Save Option')
    await page.click('text=Save Field')

    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/qr-configuration/)

    // ========================================
    // PHASE 2: QR CODE GENERATION FOR DONATION DOORS
    // ========================================
    
    console.log('🚪 Phase 2: Creating QR Codes for Donation Doors...')
    
    await page.fill('input[name="qrSetName"]', 'Donation Doors QR Codes')
    await page.fill('textarea[name="qrSetDescription"]', 'QR codes for different donation collection points')
    await page.selectOption('select[name="language"]', 'en')

    // Create QR codes for different donation doors
    await page.click('text=Add QR Code')
    await page.fill('input[name="qrCodeLabel"]', 'Main Donation Door')
    await page.fill('input[name="entryPoint"]', '/donation/main')
    await page.check('input[name="isActive"]')
    await page.click('text=Save QR Code')

    await page.click('text=Add QR Code')
    await page.fill('input[name="qrCodeLabel"]', 'Side Donation Door')
    await page.fill('input[name="entryPoint"]', '/donation/side')
    await page.check('input[name="isActive"]')
    await page.click('text=Save QR Code')

    await page.click('text=Add QR Code')
    await page.fill('input[name="qrCodeLabel"]', 'VIP Donation Door')
    await page.fill('input[name="entryPoint"]', '/donation/vip')
    await page.check('input[name="isActive"]')
    await page.click('text=Save QR Code')

    await page.click('button:has-text("Next Step")')
    await expect(page).toHaveURL(/.*\/onboarding\/review/)

    // Review and complete setup
    await expect(page.locator('text=Review Your Setup')).toBeVisible()
    await expect(page.locator('text=Charity Foundation')).toBeVisible()
    await expect(page.locator('text=Donation Registration Form')).toBeVisible()
    await expect(page.locator('text=Donation Doors QR Codes')).toBeVisible()

    await page.click('button:has-text("Complete Setup")')
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('text=Welcome to your dashboard')).toBeVisible()

    console.log('✅ Organization setup completed successfully!')

    // ========================================
    // PHASE 3: GENERATE QR CODES FOR DONATION DOORS
    // ========================================
    
    console.log('📱 Phase 3: Generating QR Codes for Donation Doors...')
    
    // Navigate to QR codes management
    await page.click('text=QR Codes')
    await expect(page).toHaveURL(/.*\/dashboard\/qr-codes/)

    // Verify QR code set was created
    await expect(page.locator('text=Donation Doors QR Codes')).toBeVisible()
    await page.locator('[data-testid="qr-code-set"]').first().click()

    // Generate QR codes
    await page.click('text=Generate QR Codes')
    await expect(page.locator('text=Generating QR codes...')).toBeVisible()
    await page.waitForSelector('text=QR codes generated successfully', { timeout: 10000 })

    // Verify QR codes were generated
    await expect(page.locator('text=Main Donation Door')).toBeVisible()
    await expect(page.locator('text=Side Donation Door')).toBeVisible()
    await expect(page.locator('text=VIP Donation Door')).toBeVisible()

    // Download QR codes for printing
    await page.click('text=Download QR Codes')
    await expect(page.locator('text=Downloading...')).toBeVisible()
    await page.waitForSelector('text=Download completed', { timeout: 10000 })

    console.log('✅ QR codes generated and downloaded successfully!')

    // ========================================
    // PHASE 4: DONOR REGISTRATION VIA QR CODE SCANNING
    // ========================================
    
    console.log('👥 Phase 4: Testing Donor Registration via QR Code...')
    
    // Simulate donor scanning QR code (Main Donation Door)
    await page.goto('http://localhost:7777/register/charity-foundation/main')
    
    // Verify donation registration form loads
    await expect(page.locator('text=Donation Registration Form')).toBeVisible()
    await expect(page.locator('text=Charity Foundation')).toBeVisible()
    await expect(page.locator('text=Main Donation Door')).toBeVisible()

    // Fill donation registration form
    await page.fill('input[name="field_full_name"]', 'John Smith')
    await page.fill('input[name="field_email"]', 'john.smith@email.com')
    await page.fill('input[name="field_phone"]', '+1987654321')
    await page.fill('input[name="field_donation_amount"]', '50')
    await page.selectOption('select[name="field_donation_type"]', 'cash')

    // Submit registration
    await page.click('button:has-text("Complete Registration")')
    
    // Verify registration success and QR code generation
    await expect(page.locator('text=Registration Successful')).toBeVisible()
    await expect(page.locator('text=Your check-in QR code has been generated')).toBeVisible()
    await expect(page.locator('[data-testid="donor-qr-code"]')).toBeVisible()
    await expect(page.locator('text=John Smith')).toBeVisible()

    console.log('✅ Donor registration completed successfully!')

    // ========================================
    // PHASE 5: CHECK-IN PROCESS WITH GENERATED QR CODE
    // ========================================
    
    console.log('🔍 Phase 5: Testing Check-in Process...')
    
    // Navigate to check-in interface (organization side)
    await page.goto('http://localhost:7777/dashboard/check-in')
    await expect(page.locator('text=Check-in System')).toBeVisible()

    // Simulate QR code scanning for check-in
    await page.fill('input[name="checkInToken"]', 'donor_qr_token_123')
    await page.click('button:has-text("Check In")')

    // Verify check-in success
    await expect(page.locator('text=Check-In Successful')).toBeVisible()
    await expect(page.locator('text=John Smith')).toBeVisible()
    await expect(page.locator('text=Donation Amount: $50')).toBeVisible()
    await expect(page.locator('text=Donation Type: Cash')).toBeVisible()

    console.log('✅ Check-in process completed successfully!')

    // ========================================
    // PHASE 6: VERIFY ANALYTICS AND REPORTING
    // ========================================
    
    console.log('📊 Phase 6: Verifying Analytics and Reporting...')
    
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()

    // Verify donation metrics
    await expect(page.locator('text=Total Registrations')).toBeVisible()
    await expect(page.locator('text=Total Donations')).toBeVisible()
    await expect(page.locator('text=Active QR Codes')).toBeVisible()

    // Check donation trends
    await expect(page.locator('[data-testid="donation-trends-chart"]')).toBeVisible()
    await expect(page.locator('text=Donation Trends')).toBeVisible()

    // Verify QR code performance
    await page.click('[data-testid="qr-code-selector"]')
    await page.click('text=Main Donation Door')
    await expect(page.locator('[data-testid="qr-code-performance-chart"]')).toBeVisible()

    console.log('✅ Analytics verification completed successfully!')

    // ========================================
    // PHASE 7: TEST MULTIPLE DONATION DOORS
    // ========================================
    
    console.log('🚪 Phase 7: Testing Multiple Donation Doors...')
    
    // Test Side Donation Door
    await page.goto('http://localhost:7777/register/charity-foundation/side')
    await expect(page.locator('text=Side Donation Door')).toBeVisible()
    
    await page.fill('input[name="field_full_name"]', 'Jane Doe')
    await page.fill('input[name="field_email"]', 'jane.doe@email.com')
    await page.fill('input[name="field_phone"]', '+1555123456')
    await page.fill('input[name="field_donation_amount"]', '100')
    await page.selectOption('select[name="field_donation_type"]', 'check')
    
    await page.click('button:has-text("Complete Registration")')
    await expect(page.locator('text=Registration Successful')).toBeVisible()

    // Test VIP Donation Door
    await page.goto('http://localhost:7777/register/charity-foundation/vip')
    await expect(page.locator('text=VIP Donation Door')).toBeVisible()
    
    await page.fill('input[name="field_full_name"]', 'Robert Johnson')
    await page.fill('input[name="field_email"]', 'robert.johnson@email.com')
    await page.fill('input[name="field_phone"]', '+1555987654')
    await page.fill('input[name="field_donation_amount"]', '500')
    await page.selectOption('select[name="field_donation_type"]', 'cash')
    
    await page.click('button:has-text("Complete Registration")')
    await expect(page.locator('text=Registration Successful')).toBeVisible()

    console.log('✅ Multiple donation doors tested successfully!')

    // ========================================
    // PHASE 8: VERIFY COMPLETE WORKFLOW
    // ========================================
    
    console.log('🎯 Phase 8: Verifying Complete Workflow...')
    
    // Return to dashboard and verify all data
    await page.goto('http://localhost:7777/dashboard')
    
    // Verify dashboard shows updated metrics
    await expect(page.locator('text=Total Registrations')).toBeVisible()
    await expect(page.locator('text=Active QR Codes')).toBeVisible()
    
    // Check recent activity
    await expect(page.locator('text=Recent Activity')).toBeVisible()
    await expect(page.locator('text=John Smith')).toBeVisible()
    await expect(page.locator('text=Jane Doe')).toBeVisible()
    await expect(page.locator('text=Robert Johnson')).toBeVisible()

    // Verify QR code management
    await page.click('text=QR Codes')
    await expect(page.locator('text=Donation Doors QR Codes')).toBeVisible()
    await expect(page.locator('text=Main Donation Door')).toBeVisible()
    await expect(page.locator('text=Side Donation Door')).toBeVisible()
    await expect(page.locator('text=VIP Donation Door')).toBeVisible()

    // Test QR code analytics
    await page.locator('[data-testid="qr-code-set"]').first().click()
    await page.click('text=Analytics')
    
    // Verify analytics show all three doors
    await expect(page.locator('text=QR Code Analytics')).toBeVisible()
    await expect(page.locator('text=Main Donation Door')).toBeVisible()
    await expect(page.locator('text=Side Donation Door')).toBeVisible()
    await expect(page.locator('text=VIP Donation Door')).toBeVisible()

    console.log('🎉 Complete Donation Flow Test Completed Successfully!')
    console.log('✅ Organization created and configured')
    console.log('✅ QR codes generated for multiple donation doors')
    console.log('✅ Donors registered via QR code scanning')
    console.log('✅ Check-in process validated')
    console.log('✅ Analytics and reporting verified')
  })

  test('Donation Flow Error Handling and Edge Cases', async ({ page }) => {
    console.log('🔧 Testing Donation Flow Error Handling...')
    
    // Test invalid QR code scanning
    await page.goto('http://localhost:7777/register/invalid-org/invalid-door')
    await expect(page.locator('text=Invalid QR Code')).toBeVisible()
    await expect(page.locator('text=Please scan a valid QR code')).toBeVisible()

    // Test form validation
    await page.goto('http://localhost:7777/register/charity-foundation/main')
    await page.click('button:has-text("Complete Registration")')
    
    // Verify validation errors
    await expect(page.locator('text=Full Name is required')).toBeVisible()
    await expect(page.locator('text=Email Address is required')).toBeVisible()
    await expect(page.locator('text=Phone Number is required')).toBeVisible()

    // Test invalid email format
    await page.fill('input[name="field_email"]', 'invalid-email')
    await page.click('button:has-text("Complete Registration")')
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()

    // Test invalid donation amount
    await page.fill('input[name="field_donation_amount"]', '-10')
    await page.click('button:has-text("Complete Registration")')
    await expect(page.locator('text=Donation amount must be positive')).toBeVisible()

    console.log('✅ Error handling and validation tested successfully!')
  })

  test('Donation Flow Performance and Load Testing', async ({ page }) => {
    console.log('⚡ Testing Donation Flow Performance...')
    
    // Login to organization
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'sarah@charityfoundation.org')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Test dashboard load performance
    const startTime = Date.now()
    await page.goto('http://localhost:7777/dashboard')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify dashboard loads within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    console.log(`✅ Dashboard loaded in ${loadTime}ms`)

    // Test QR code generation performance
    await page.click('text=QR Codes')
    const qrStartTime = Date.now()
    await page.waitForSelector('[data-testid="qr-code-set"]')
    const qrLoadTime = Date.now() - qrStartTime
    
    // Verify QR codes load within 2 seconds
    expect(qrLoadTime).toBeLessThan(2000)
    console.log(`✅ QR codes loaded in ${qrLoadTime}ms`)

    // Test form submission performance
    await page.goto('http://localhost:7777/register/charity-foundation/main')
    await page.fill('input[name="field_full_name"]', 'Performance Test')
    await page.fill('input[name="field_email"]', 'performance@test.com')
    await page.fill('input[name="field_phone"]', '+1555000000')
    await page.fill('input[name="field_donation_amount"]', '25')
    await page.selectOption('select[name="field_donation_type"]', 'cash')
    
    const submitStartTime = Date.now()
    await page.click('button:has-text("Complete Registration")')
    await page.waitForSelector('text=Registration Successful')
    const submitTime = Date.now() - submitStartTime
    
    // Verify form submission within 2 seconds
    expect(submitTime).toBeLessThan(2000)
    console.log(`✅ Form submitted in ${submitTime}ms`)

    console.log('✅ Performance testing completed successfully!')
  })

  test('Donation Flow Mobile Responsiveness', async ({ page }) => {
    console.log('📱 Testing Donation Flow Mobile Responsiveness...')
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Test mobile donation registration
    await page.goto('http://localhost:7777/register/charity-foundation/main')
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-donation-form"]')).toBeVisible()
    await expect(page.locator('text=Donation Registration Form')).toBeVisible()
    
    // Test mobile form interaction
    await page.fill('input[name="field_full_name"]', 'Mobile User')
    await page.fill('input[name="field_email"]', 'mobile@test.com')
    await page.fill('input[name="field_phone"]', '+1555111111')
    await page.fill('input[name="field_donation_amount"]', '75')
    await page.selectOption('select[name="field_donation_type"]', 'cash')
    
    // Test mobile form submission
    await page.click('button:has-text("Complete Registration")')
    await expect(page.locator('text=Registration Successful')).toBeVisible()
    
    // Verify mobile QR code display
    await expect(page.locator('[data-testid="mobile-donor-qr-code"]')).toBeVisible()
    
    console.log('✅ Mobile responsiveness testing completed successfully!')
  })
})

