/**
 * Form Builder E2E Tests
 * 
 * Comprehensive tests for form creation, editing, and management
 */

import { test, expect } from '@playwright/test'

test.describe('Form Builder Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:7777/auth/login')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('Form creation flow', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click create form
    await page.click('text=Create Form')
    await expect(page).toHaveURL(/.*\/dashboard\/forms\/create/)
    
    // Fill form details
    await page.fill('input[name="name"]', 'Event Registration Form')
    await page.fill('textarea[name="description"]', 'Registration form for upcoming event')
    
    // Add form fields
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Full Name')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.check('input[name="fieldRequired"]')
    await page.fill('input[name="fieldPlaceholder"]', 'Enter your full name')
    await page.click('text=Save Field')
    
    // Add email field
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Email Address')
    await page.selectOption('select[name="fieldType"]', 'email')
    await page.check('input[name="fieldRequired"]')
    await page.fill('input[name="fieldPlaceholder"]', 'Enter your email')
    await page.click('text=Save Field')
    
    // Add phone field
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Phone Number')
    await page.selectOption('select[name="fieldType"]', 'tel')
    await page.check('input[name="fieldRequired"]')
    await page.fill('input[name="fieldPlaceholder"]', 'Enter your phone number')
    await page.click('text=Save Field')
    
    // Configure form settings
    await page.click('text=Form Settings')
    await page.check('input[name="allowMultipleSubmissions"]')
    await page.check('input[name="requireEmailVerification"]')
    await page.check('input[name="showProgressBar"]')
    await page.fill('input[name="completionMessage"]', 'Thank you for registering!')
    
    // Save form
    await page.click('text=Create Form')
    
    // Verify success message
    await expect(page.locator('text=Form created successfully')).toBeVisible()
    
    // Verify redirect to forms list
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
  })

  test('Form field management', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click on a form
    await page.locator('[data-testid="form-item"]').first().click()
    
    // Test field editing
    await page.locator('[data-testid="field-item"]').first().locator('text=Edit').click()
    await page.fill('input[name="fieldLabel"]', 'Updated Full Name')
    await page.fill('input[name="fieldPlaceholder"]', 'Enter your updated name')
    await page.click('text=Save Changes')
    
    // Verify field updated
    await expect(page.locator('text=Updated Full Name')).toBeVisible()
    
    // Test field reordering
    const firstField = page.locator('[data-testid="field-item"]').first()
    const secondField = page.locator('[data-testid="field-item"]').nth(1)
    
    await firstField.dragTo(secondField)
    await expect(page.locator('text=Field order updated')).toBeVisible()
    
    // Test field deletion
    await page.locator('[data-testid="field-item"]').first().locator('text=Delete').click()
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Delete')
    await expect(page.locator('text=Field deleted successfully')).toBeVisible()
  })

  test('Form field types and validation', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click create form
    await page.click('text=Create Form')
    
    // Test different field types
    const fieldTypes = [
      { type: 'text', label: 'Text Field' },
      { type: 'email', label: 'Email Field' },
      { type: 'tel', label: 'Phone Field' },
      { type: 'number', label: 'Number Field' },
      { type: 'date', label: 'Date Field' },
      { type: 'select', label: 'Select Field' },
      { type: 'radio', label: 'Radio Field' },
      { type: 'checkbox', label: 'Checkbox Field' },
      { type: 'textarea', label: 'Textarea Field' }
    ]
    
    for (const fieldType of fieldTypes) {
      await page.click('text=Add Field')
      await page.fill('input[name="fieldLabel"]', fieldType.label)
      await page.selectOption('select[name="fieldType"]', fieldType.type)
      
      // Add options for select/radio/checkbox fields
      if (['select', 'radio', 'checkbox'].includes(fieldType.type)) {
        await page.click('text=Add Option')
        await page.fill('input[name="optionLabel"]', 'Option 1')
        await page.fill('input[name="optionValue"]', 'option1')
        await page.click('text=Save Option')
        
        await page.click('text=Add Option')
        await page.fill('input[name="optionLabel"]', 'Option 2')
        await page.fill('input[name="optionValue"]', 'option2')
        await page.click('text=Save Option')
      }
      
      await page.click('text=Save Field')
      await expect(page.locator(`text=${fieldType.label}`)).toBeVisible()
    }
    
    // Test field validation
    await page.locator('[data-testid="field-item"]').first().locator('text=Edit').click()
    await page.click('text=Validation Rules')
    
    // Add validation rules
    await page.check('input[name="required"]')
    await page.fill('input[name="minLength"]', '2')
    await page.fill('input[name="maxLength"]', '50')
    await page.fill('input[name="pattern"]', '^[a-zA-Z\\s]+$')
    await page.fill('input[name="errorMessage"]', 'Please enter a valid name')
    await page.click('text=Save Validation')
    
    // Verify validation rules saved
    await expect(page.locator('text=Validation rules saved')).toBeVisible()
  })

  test('Form conditional logic', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click on a form
    await page.locator('[data-testid="form-item"]').first().click()
    
    // Test conditional logic setup
    await page.click('text=Conditional Logic')
    await expect(page.locator('[data-testid="conditional-logic-modal"]')).toBeVisible()
    
    // Add conditional rule
    await page.click('text=Add Rule')
    await page.selectOption('select[name="triggerField"]', 'Full Name')
    await page.selectOption('select[name="condition"]', 'is not empty')
    await page.selectOption('select[name="targetField"]', 'Email Address')
    await page.selectOption('select[name="action"]', 'show')
    await page.click('text=Save Rule')
    
    // Verify rule created
    await expect(page.locator('text=Rule created successfully')).toBeVisible()
    
    // Test rule editing
    await page.locator('[data-testid="rule-item"]').first().locator('text=Edit').click()
    await page.selectOption('select[name="condition"]', 'contains')
    await page.fill('input[name="value"]', 'John')
    await page.click('text=Save Changes')
    
    // Verify rule updated
    await expect(page.locator('text=Rule updated successfully')).toBeVisible()
    
    // Test rule deletion
    await page.locator('[data-testid="rule-item"]').first().locator('text=Delete').click()
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Delete')
    await expect(page.locator('text=Rule deleted successfully')).toBeVisible()
  })

  test('Form templates and customization', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Test template selection
    await page.click('text=Create from Template')
    await expect(page.locator('[data-testid="template-modal"]')).toBeVisible()
    
    // Select template
    await page.click('text=Event Registration Template')
    await page.fill('input[name="templateName"]', 'Custom Event Registration')
    await page.click('text=Use Template')
    
    // Verify template applied
    await expect(page.locator('text=Template applied successfully')).toBeVisible()
    
    // Test form customization
    await page.click('text=Customize Form')
    await expect(page.locator('[data-testid="customize-modal"]')).toBeVisible()
    
    // Change form theme
    await page.selectOption('select[name="theme"]', 'modern')
    await page.fill('input[name="primaryColor"]', '#3B82F6')
    await page.fill('input[name="secondaryColor"]', '#F3F4F6')
    
    // Change form layout
    await page.selectOption('select[name="layout"]', 'two-column')
    await page.check('input[name="showProgressBar"]')
    await page.check('input[name="showFieldNumbers"]')
    
    // Save customization
    await page.click('text=Save Customization')
    await expect(page.locator('text=Customization saved successfully')).toBeVisible()
  })

  test('Form preview and testing', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click on a form
    await page.locator('[data-testid="form-item"]').first().click()
    
    // Test form preview
    await page.click('text=Preview Form')
    await expect(page.locator('[data-testid="form-preview"]')).toBeVisible()
    
    // Test form submission in preview
    await page.fill('input[name="fullName"]', 'John Doe')
    await page.fill('input[name="email"]', 'john@example.com')
    await page.fill('input[name="phone"]', '+1234567890')
    await page.click('text=Submit')
    
    // Verify submission success
    await expect(page.locator('text=Form submitted successfully')).toBeVisible()
    
    // Test form validation in preview
    await page.click('text=Test Validation')
    await page.fill('input[name="fullName"]', '')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('text=Submit')
    
    // Verify validation errors
    await expect(page.locator('text=Full name is required')).toBeVisible()
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('Form sharing and collaboration', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click on a form
    await page.locator('[data-testid="form-item"]').first().click()
    
    // Test form sharing
    await page.click('text=Share Form')
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible()
    
    // Generate public link
    await page.click('text=Generate Public Link')
    await expect(page.locator('[data-testid="public-link"]')).toBeVisible()
    
    // Copy link
    await page.click('text=Copy Link')
    await expect(page.locator('text=Link copied to clipboard')).toBeVisible()
    
    // Test email sharing
    await page.click('text=Share via Email')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('textarea[name="message"]', 'Please fill out this form')
    await page.click('text=Send Email')
    
    // Verify email sent
    await expect(page.locator('text=Email sent successfully')).toBeVisible()
    
    // Test collaboration
    await page.click('text=Collaborate')
    await expect(page.locator('[data-testid="collaboration-modal"]')).toBeVisible()
    
    // Add collaborator
    await page.click('text=Add Collaborator')
    await page.fill('input[name="email"]', 'collaborator@example.com')
    await page.selectOption('select[name="role"]', 'editor')
    await page.click('text=Add Collaborator')
    
    // Verify collaborator added
    await expect(page.locator('text=Collaborator added successfully')).toBeVisible()
  })

  test('Form analytics and reporting', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click on a form
    await page.locator('[data-testid="form-item"]').first().click()
    
    // Navigate to analytics
    await page.click('text=Analytics')
    await expect(page.locator('[data-testid="analytics-dashboard"]')).toBeVisible()
    
    // Verify analytics sections
    await expect(page.locator('text=Form Analytics')).toBeVisible()
    await expect(page.locator('text=Submission Trends')).toBeVisible()
    await expect(page.locator('text=Field Performance')).toBeVisible()
    await expect(page.locator('text=Completion Rate')).toBeVisible()
    
    // Test date range selection
    await page.click('[data-testid="date-range-selector"]')
    await page.click('text=Last 30 days')
    
    // Verify data updates
    await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible()
    
    // Test export functionality
    await page.click('text=Export Analytics')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    // Select export format
    await page.check('input[value="csv"]')
    await page.click('text=Export')
    
    // Verify export starts
    await expect(page.locator('text=Exporting...')).toBeVisible()
  })

  test('Form submissions management', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click on a form
    await page.locator('[data-testid="form-item"]').first().click()
    
    // Navigate to submissions
    await page.click('text=Submissions')
    await expect(page.locator('[data-testid="submissions-list"]')).toBeVisible()
    
    // Verify submission data
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=john@example.com')).toBeVisible()
    await expect(page.locator('text=+1234567890')).toBeVisible()
    
    // Test submission filtering
    await page.click('[data-testid="filter-button"]')
    await page.selectOption('select[name="status"]', 'completed')
    await page.click('text=Apply Filters')
    
    // Verify filtered results
    await expect(page.locator('[data-testid="filtered-submissions"]')).toBeVisible()
    
    // Test submission export
    await page.click('text=Export Submissions')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    // Select export format
    await page.check('input[value="csv"]')
    await page.click('text=Export')
    
    // Verify export starts
    await expect(page.locator('text=Exporting...')).toBeVisible()
    
    // Test submission deletion
    await page.locator('[data-testid="submission-item"]').first().locator('text=Delete').click()
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Delete')
    await expect(page.locator('text=Submission deleted successfully')).toBeVisible()
  })

  test('Form versioning and history', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click on a form
    await page.locator('[data-testid="form-item"]').first().click()
    
    // Test versioning
    await page.click('text=Versions')
    await expect(page.locator('[data-testid="versions-modal"]')).toBeVisible()
    
    // Create new version
    await page.click('text=Create New Version')
    await page.fill('input[name="versionName"]', 'Version 2.0')
    await page.fill('textarea[name="versionNotes"]', 'Added new fields and validation')
    await page.click('text=Create Version')
    
    // Verify version created
    await expect(page.locator('text=Version 2.0')).toBeVisible()
    await expect(page.locator('text=Version created successfully')).toBeVisible()
    
    // Test version switching
    await page.click('text=Switch to Version 2.0')
    await expect(page.locator('text=Switched to Version 2.0')).toBeVisible()
    
    // Test version comparison
    await page.click('text=Compare Versions')
    await expect(page.locator('[data-testid="version-comparison"]')).toBeVisible()
    
    // Test version rollback
    await page.click('text=Rollback to Previous Version')
    await expect(page.locator('[data-testid="rollback-confirmation"]')).toBeVisible()
    await page.click('text=Confirm Rollback')
    await expect(page.locator('text=Rolled back successfully')).toBeVisible()
  })

  test('Form integration and webhooks', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Click on a form
    await page.locator('[data-testid="form-item"]').first().click()
    
    // Test webhook configuration
    await page.click('text=Integrations')
    await expect(page.locator('[data-testid="integrations-modal"]')).toBeVisible()
    
    // Add webhook
    await page.click('text=Add Webhook')
    await page.fill('input[name="webhookUrl"]', 'https://example.com/webhook')
    await page.selectOption('select[name="webhookEvent"]', 'form_submitted')
    await page.check('input[name="webhookActive"]')
    await page.click('text=Save Webhook')
    
    // Verify webhook added
    await expect(page.locator('text=Webhook added successfully')).toBeVisible()
    
    // Test webhook testing
    await page.click('text=Test Webhook')
    await expect(page.locator('text=Webhook test sent')).toBeVisible()
    
    // Test webhook editing
    await page.locator('[data-testid="webhook-item"]').first().locator('text=Edit').click()
    await page.fill('input[name="webhookUrl"]', 'https://example.com/updated-webhook')
    await page.click('text=Save Changes')
    
    // Verify webhook updated
    await expect(page.locator('text=Webhook updated successfully')).toBeVisible()
  })

  test('Form performance and optimization', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Measure page load time
    const startTime = Date.now()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verify page loads within reasonable time
    expect(loadTime).toBeLessThan(3000)
    
    // Test form builder performance
    await page.click('text=Create Form')
    const builderStartTime = Date.now()
    await page.waitForSelector('[data-testid="form-builder"]')
    const builderLoadTime = Date.now() - builderStartTime
    
    // Verify form builder loads quickly
    expect(builderLoadTime).toBeLessThan(2000)
    
    // Test large form handling
    for (let i = 0; i < 20; i++) {
      await page.click('text=Add Field')
      await page.fill('input[name="fieldLabel"]', `Field ${i + 1}`)
      await page.selectOption('select[name="fieldType"]', 'text')
      await page.click('text=Save Field')
    }
    
    // Verify form builder handles large forms
    await expect(page.locator('[data-testid="field-item"]')).toHaveCount(20)
    
    // Test form preview performance
    await page.click('text=Preview Form')
    const previewStartTime = Date.now()
    await page.waitForSelector('[data-testid="form-preview"]')
    const previewLoadTime = Date.now() - previewStartTime
    
    // Verify preview loads quickly
    expect(previewLoadTime).toBeLessThan(1500)
  })

  test('Form accessibility and compliance', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
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
    await expect(page.locator('[aria-label="Form Name"]')).toBeVisible()
    await expect(page.locator('[aria-label="Form Description"]')).toBeVisible()
    
    // Test form field accessibility
    await page.click('text=Create Form')
    await page.fill('input[name="name"]', 'Accessible Form')
    
    // Add accessible field
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Accessible Field')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.fill('input[name="fieldAriaLabel"]', 'Enter your information')
    await page.fill('input[name="fieldHelpText"]', 'This field is required')
    await page.click('text=Save Field')
    
    // Verify accessibility attributes
    await expect(page.locator('[aria-label="Enter your information"]')).toBeVisible()
    await expect(page.locator('[aria-describedby="field-help"]')).toBeVisible()
  })

  test('Form error handling and validation', async ({ page }) => {
    // Navigate to forms
    await page.click('text=Forms')
    await expect(page).toHaveURL(/.*\/dashboard\/forms/)
    
    // Test form creation validation
    await page.click('text=Create Form')
    await page.click('text=Create Form')
    
    // Verify validation errors
    await expect(page.locator('text=Form name is required')).toBeVisible()
    await expect(page.locator('text=At least one field is required')).toBeVisible()
    
    // Fill required fields
    await page.fill('input[name="name"]', 'Test Form')
    
    // Add field
    await page.click('text=Add Field')
    await page.fill('input[name="fieldLabel"]', 'Test Field')
    await page.selectOption('select[name="fieldType"]', 'text')
    await page.click('text=Save Field')
    
    // Try to create again
    await page.click('text=Create Form')
    
    // Verify success
    await expect(page.locator('text=Form created successfully')).toBeVisible()
    
    // Test field validation
    await page.locator('[data-testid="field-item"]').first().locator('text=Edit').click()
    await page.fill('input[name="fieldLabel"]', '')
    await page.click('text=Save Changes')
    
    // Verify field validation error
    await expect(page.locator('text=Field label is required')).toBeVisible()
    
    // Fix field
    await page.fill('input[name="fieldLabel"]', 'Valid Field')
    await page.click('text=Save Changes')
    
    // Verify field saved
    await expect(page.locator('text=Field updated successfully')).toBeVisible()
  })
})
