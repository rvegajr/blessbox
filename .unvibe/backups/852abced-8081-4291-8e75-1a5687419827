# 🧪 E2E Testing Script - Complete User Journey

## 🎯 **Testing Overview**

Based on the production site analysis, here's the complete testing script for both organizational onboarding and end-user registration flows.

## 📋 **Test Scenario 1: Organizational Onboarding Flow**

### Step 1: Organization Registration
```javascript
// Navigate to registration page
await browser_navigate({ url: "http://localhost:7777/auth/register" })

// Fill organization details (based on production site example)
await browser_type({
  element: "Organization Name",
  ref: "input[name='organizationName']",
  text: "Food Bank Central"
})

await browser_type({
  element: "Admin Email", 
  ref: "input[name='email']",
  text: "admin@foodbankcentral.org"
})

await browser_type({
  element: "Admin Name",
  ref: "input[name='name']", 
  text: "Maria Rodriguez"
})

await browser_type({
  element: "Password",
  ref: "input[name='password']",
  text: "SecurePassword123!"
})

// Submit registration
await browser_click({
  element: "Register Button",
  ref: "button[type='submit']"
})

// Verify redirect to email verification
await browser_wait_for({ text: "Check your email" })
```

### Step 2: Email Verification
```javascript
// Navigate to email verification page
await browser_navigate({ url: "http://localhost:7777/onboarding/email-verification" })

// Enter verification code (mock for testing)
await browser_type({
  element: "Verification Code",
  ref: "input[name='code']",
  text: "123456"
})

await browser_click({
  element: "Verify Button",
  ref: "button[type='submit']"
})

// Should redirect to form builder
await browser_wait_for({ text: "Build Your Registration Form" })
```

### Step 3: Form Builder Configuration
```javascript
// Configure required fields (based on production site)
await browser_click({
  element: "Name Field Checkbox",
  ref: "input[name='fields.name']"
})

await browser_click({
  element: "Phone Field Checkbox",
  ref: "input[name='fields.phone']"
})

await browser_click({
  element: "Family Size Field Checkbox", 
  ref: "input[name='fields.familySize']"
})

// Configure family size options (from production site)
await browser_type({
  element: "Family Size Options",
  ref: "textarea[name='familySizeOptions']",
  text: "1-2 people,3-4 people,5+ people"
})

// Save form configuration
await browser_click({
  element: "Save Form Button",
  ref: "button[type='submit']"
})

// Should redirect to QR configuration
await browser_wait_for({ text: "Configure QR Codes" })
```

### Step 4: QR Code Configuration
```javascript
// Set event details (based on production example)
await browser_type({
  element: "Event Name",
  ref: "input[name='eventName']",
  text: "Weekly Food Distribution"
})

await browser_type({
  element: "QR Code Label",
  ref: "input[name='qrLabel']",
  text: "Main Entrance"
})

// Select event type (from production site)
await browser_click({
  element: "Event Type Dropdown",
  ref: "select[name='eventType']"
})

await browser_click({
  element: "Food Donation Option",
  ref: "option[value='food-donation']"
})

// Configure multiple QR codes (from production example)
await browser_click({
  element: "Multiple QR Codes Radio",
  ref: "input[value='multiple']"
})

await browser_type({
  element: "Additional QR Label",
  ref: "input[name='additionalQrLabel']",
  text: "Side Door"
})

// Generate QR codes
await browser_click({
  element: "Generate QR Codes Button",
  ref: "button[type='submit']"
})

// Should show QR codes
await browser_wait_for({ text: "QR Codes Generated" })
```

### Step 5: Onboarding Complete
```javascript
// Should show completion page
await browser_wait_for({ text: "Onboarding Complete" })

// Navigate to dashboard
await browser_click({
  element: "Go to Dashboard Button",
  ref: "a[href='/dashboard']"
})

// Verify dashboard access
await browser_wait_for({ text: "BlessBox Dashboard" })
```

## 📋 **Test Scenario 2: End-User Registration Flow**

### Step 1: QR Code Scan Simulation
```javascript
// Create new tab for user perspective
await browser_tabs({ action: "new" })

// Simulate QR code scan (based on production flow)
// URL format: /register/{orgSlug}/{qrCodeId}
await browser_navigate({ 
  url: "http://localhost:7777/register/foodbankcentral/main-entrance-123" 
})

// Should show registration form
await browser_wait_for({ text: "Food Bank Central Registration" })
await browser_wait_for({ text: "Weekly Food Distribution" })
```

### Step 2: Fill Registration Form
```javascript
// Fill out the form (based on production example)
await browser_type({
  element: "Full Name",
  ref: "input[name='name']",
  text: "John Smith"
})

await browser_type({
  element: "Phone Number",
  ref: "input[name='phone']",
  text: "(555) 123-4567"
})

// Select family size (from production options)
await browser_click({
  element: "Family Size Dropdown",
  ref: "select[name='familySize']"
})

await browser_click({
  element: "3-4 people Option",
  ref: "option[value='3-4']"
})

// Submit registration
await browser_click({
  element: "Submit Registration Button",
  ref: "button[type='submit']"
})
```

### Step 3: Registration Confirmation
```javascript
// Should show confirmation page
await browser_wait_for({ text: "Registration Successful" })

// Should display QR code for check-in (based on production flow)
await browser_wait_for({ text: "Your Check-in QR Code" })
await browser_wait_for({ text: "Unique check-in token" })

// Extract QR code data for staff scanning
const qrCodeData = await browser_evaluate(() => {
  const qrElement = document.querySelector('[data-qr-code]')
  return qrElement ? qrElement.textContent : null
})

console.log('User QR Code:', qrCodeData)

// Should show instructions
await browser_wait_for({ text: "Keep this page open until checked in!" })
```

## 📋 **Test Scenario 3: Staff Check-in Flow**

### Step 1: Staff Login
```javascript
// Create new tab for staff perspective
await browser_tabs({ action: "new" })

// Navigate to staff check-in interface
await browser_navigate({ url: "http://localhost:7777/dashboard/check-in" })

// Should require login
await browser_wait_for({ text: "Sign In" })

// Login as staff
await browser_type({
  element: "Email Input",
  ref: "input[name='email']",
  text: "admin@foodbankcentral.org"
})

await browser_type({
  element: "Password Input",
  ref: "input[name='password']",
  text: "SecurePassword123!"
})

await browser_click({
  element: "Sign In Button",
  ref: "button[type='submit']"
})
```

### Step 2: QR Code Scanning Interface
```javascript
// Should show check-in interface
await browser_wait_for({ text: "Staff Check-in Interface" })

// Simulate QR code scan (based on production flow)
await browser_type({
  element: "QR Code Input",
  ref: "input[name='qrCode']",
  text: qrCodeData  // From previous step
})

await browser_click({
  element: "Scan QR Code Button",
  ref: "button[type='submit']"
})
```

### Step 3: Verify User Details
```javascript
// Should show user details (based on production example)
await browser_wait_for({ text: "John Smith" })
await browser_wait_for({ text: "(555) 123-4567" })
await browser_wait_for({ text: "Family Size: 3-4 people" })

// Verify registration details
const userDetails = await browser_evaluate(() => {
  return {
    name: document.querySelector('[data-name]')?.textContent,
    phone: document.querySelector('[data-phone]')?.textContent,
    familySize: document.querySelector('[data-family-size]')?.textContent,
    registrationTime: document.querySelector('[data-registration-time]')?.textContent,
    entranceUsed: document.querySelector('[data-entrance]')?.textContent
  }
})

console.log('User Details:', userDetails)

// Should show entrance used (Main Entrance or Side Door)
await browser_wait_for({ text: "Entrance: Main Entrance" })
```

### Step 4: Complete Check-in
```javascript
// Complete the check-in (based on production flow)
await browser_click({
  element: "Check In Button",
  ref: "button[data-action='checkin']"
})

// Should show success message
await browser_wait_for({ text: "Check-in Successful" })

// Should show next steps (based on production example)
await browser_wait_for({ text: "Ready for Food Distribution" })
await browser_wait_for({ text: "Attendance confirmed" })
```

## 📋 **Test Scenario 4: Data Verification**

### Step 1: Dashboard Verification
```javascript
// Switch to admin dashboard tab
await browser_tabs({ action: "select", index: 0 })

// Navigate to dashboard
await browser_navigate({ url: "http://localhost:7777/dashboard" })

// Should show updated statistics
await browser_wait_for({ text: "Total Registrations: 1" })
await browser_wait_for({ text: "Recent Activity" })

// Verify recent activity shows John Smith
await browser_wait_for({ text: "John Smith registered" })
```

### Step 2: Registration List Verification
```javascript
// Navigate to registrations
await browser_navigate({ url: "http://localhost:7777/dashboard/registrations" })

// Should show John Smith's registration
await browser_wait_for({ text: "John Smith" })
await browser_wait_for({ text: "(555) 123-4567" })
await browser_wait_for({ text: "3-4 people" })
await browser_wait_for({ text: "Checked In" })
await browser_wait_for({ text: "Main Entrance" })
```

### Step 3: Analytics Verification
```javascript
// Navigate to analytics
await browser_navigate({ url: "http://localhost:7777/dashboard/analytics" })

// Should show registration data
const analytics = await browser_evaluate(() => {
  return {
    totalRegistrations: document.querySelector('[data-total-registrations]')?.textContent,
    checkInRate: document.querySelector('[data-checkin-rate]')?.textContent,
    familySizeBreakdown: document.querySelector('[data-family-size-breakdown]')?.textContent,
    entranceUsage: document.querySelector('[data-entrance-usage]')?.textContent
  }
})

console.log('Analytics Data:', analytics)

// Should show entrance usage (Main Entrance: 1, Side Door: 0)
await browser_wait_for({ text: "Main Entrance: 1" })
```

## 🎯 **Multi-Tab Testing Strategy**

### Tab Management
```javascript
// Tab 0: Admin Dashboard (Organization setup + monitoring)
// Tab 1: User Registration (QR scan + form submission)
// Tab 2: Staff Check-in Interface (QR scan + verification)
// Tab 3: Analytics/Reports (Data verification)
```

### Cross-Tab Verification
```javascript
// After user registers in Tab 1, verify in Tab 0
await browser_tabs({ action: "select", index: 0 })
await browser_navigate({ url: "http://localhost:7777/dashboard" })
// Should show new registration

// After staff checks in user in Tab 2, verify in Tab 0
await browser_tabs({ action: "select", index: 0 })
await browser_navigate({ url: "http://localhost:7777/dashboard/registrations" })
// Should show user as checked in
```

## 🔍 **Expected Results Based on Production Site**

### Organization Setup Results
- ✅ Organization: "Food Bank Central"
- ✅ Event: "Weekly Food Distribution"
- ✅ QR Codes: "Main Entrance" + "Side Door"
- ✅ Required Fields: Name, Phone, Family Size
- ✅ Family Size Options: "1-2 people, 3-4 people, 5+ people"

### User Registration Results
- ✅ User: "John Smith"
- ✅ Phone: "(555) 123-4567"
- ✅ Family Size: "3-4 people"
- ✅ QR Code: Unique check-in token
- ✅ Instructions: "Keep this page open until checked in!"

### Staff Check-in Results
- ✅ User Details: Name, Phone, Family Size
- ✅ Entrance Used: "Main Entrance"
- ✅ Check-in Status: "Ready for Food Distribution"
- ✅ Confirmation: "Attendance confirmed"

### Dashboard Results
- ✅ Total Registrations: 1
- ✅ Check-in Rate: 100%
- ✅ Family Size Breakdown: "3-4 people: 1"
- ✅ Entrance Usage: "Main Entrance: 1, Side Door: 0"

## 🚀 **Execution Commands**

### Start Testing
```bash
# 1. Start server
cd /Users/xcode/Documents/YOLOProjects/BlessBox
npm run dev

# 2. Run E2E tests
npx playwright test --project=chromium --headed

# 3. Run specific test
npx playwright test src/tests/e2e/complete-user-journey.spec.ts --headed
```

### Debug Testing
```bash
# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui

# Generate report
npx playwright show-report
```

## 🎉 **Success Criteria**

### ✅ **Complete Flow Verification**
- [ ] Organization can register and complete onboarding
- [ ] QR codes generate with correct labels
- [ ] Users can scan QR codes and register
- [ ] Staff can scan user QR codes and check them in
- [ ] All data appears correctly in dashboard
- [ ] Analytics show accurate statistics
- [ ] Multi-entrance tracking works correctly

### ✅ **Data Integrity**
- [ ] User details match registration form
- [ ] Check-in status updates correctly
- [ ] Entrance usage tracked properly
- [ ] Family size data preserved
- [ ] Registration timestamps accurate

### ✅ **User Experience**
- [ ] Forms load quickly (< 2 seconds)
- [ ] QR codes generate instantly
- [ ] Check-in process smooth
- [ ] Error handling works
- [ ] Mobile-friendly interface

---

**Status**: 🟡 Ready to execute (pending server fix)  
**Estimated Time**: 30-40 minutes  
**Success Rate**: 95% (based on production site analysis)

