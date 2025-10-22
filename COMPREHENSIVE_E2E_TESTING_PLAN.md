# 🧪 Comprehensive E2E Testing Plan - BlessBox Application

## 🎯 **Testing Objectives**

### Primary Test Scenarios:
1. **Organizational Onboarding Flow** - Complete organization setup
2. **End-User Registration Flow** - QR scan → form → registration
3. **Staff Check-in Flow** - Scan user QR → verify → check-in
4. **Data Verification** - Verify data appears in dashboard

## 📋 **Test Scenario 1: Organizational Onboarding**

### Step 1: Organization Registration
```javascript
// Navigate to registration
await browser_navigate({ url: "http://localhost:7777/auth/register" })

// Fill organization details
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
```

### Step 2: Email Verification
```javascript
// Should redirect to email verification page
await browser_wait_for({ text: "Check your email" })

// Simulate email verification (in real scenario, user clicks email link)
await browser_navigate({ url: "http://localhost:7777/onboarding/email-verification" })

// Enter verification code (mock)
await browser_type({
  element: "Verification Code",
  ref: "input[name='code']",
  text: "123456"
})

await browser_click({
  element: "Verify Button",
  ref: "button[type='submit']"
})
```

### Step 3: Form Builder Configuration
```javascript
// Should redirect to form builder
await browser_wait_for({ text: "Build Your Registration Form" })

// Add required fields
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

// Configure field options
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
```

### Step 4: QR Code Configuration
```javascript
// Should redirect to QR configuration
await browser_wait_for({ text: "Configure QR Codes" })

// Set QR code parameters
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

// Configure multiple QR codes
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
```

### Step 5: Onboarding Complete
```javascript
// Should show completion page
await browser_wait_for({ text: "Onboarding Complete" })

// Verify dashboard access
await browser_click({
  element: "Go to Dashboard Button",
  ref: "a[href='/dashboard']"
})

// Should redirect to dashboard
await browser_wait_for({ text: "BlessBox Dashboard" })
```

## 📋 **Test Scenario 2: End-User Registration Flow**

### Step 1: QR Code Scan Simulation
```javascript
// Create new tab for user perspective
await browser_tabs({ action: "new" })

// Simulate QR code scan (navigate to registration URL)
// In real scenario, this would be: https://blessbox.org/register/foodbankcentral/abc123
await browser_navigate({ 
  url: "http://localhost:7777/register/foodbankcentral/abc123" 
})

// Should show registration form
await browser_wait_for({ text: "Food Bank Central Registration" })
```

### Step 2: Fill Registration Form
```javascript
// Fill out the form
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

// Select family size
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

// Should display QR code for check-in
await browser_wait_for({ text: "Your Check-in QR Code" })

// Extract QR code data for staff scanning
const qrCodeData = await browser_evaluate(() => {
  const qrElement = document.querySelector('[data-qr-code]')
  return qrElement ? qrElement.textContent : null
})

console.log('User QR Code:', qrCodeData)
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

// Simulate QR code scan
// In real scenario, staff would scan the user's QR code
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
// Should show user details
await browser_wait_for({ text: "John Smith" })
await browser_wait_for({ text: "(555) 123-4567" })
await browser_wait_for({ text: "Family Size: 3-4 people" })

// Verify registration details
const userDetails = await browser_evaluate(() => {
  return {
    name: document.querySelector('[data-name]')?.textContent,
    phone: document.querySelector('[data-phone]')?.textContent,
    familySize: document.querySelector('[data-family-size]')?.textContent,
    registrationTime: document.querySelector('[data-registration-time]')?.textContent
  }
})

console.log('User Details:', userDetails)
```

### Step 4: Complete Check-in
```javascript
// Complete the check-in
await browser_click({
  element: "Check In Button",
  ref: "button[data-action='checkin']"
})

// Should show success message
await browser_wait_for({ text: "Check-in Successful" })

// Should show next steps
await browser_wait_for({ text: "Ready for Food Distribution" })
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
    familySizeBreakdown: document.querySelector('[data-family-size-breakdown]')?.textContent
  }
})

console.log('Analytics Data:', analytics)
```

## 🎯 **Multi-Tab Testing Strategy**

### Tab Management
```javascript
// Tab 0: Admin Dashboard
// Tab 1: User Registration (QR scan)
// Tab 2: Staff Check-in Interface
// Tab 3: Analytics/Reports
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

## 🔍 **Error Handling & Edge Cases**

### Test Error Scenarios
```javascript
// Invalid QR code
await browser_navigate({ url: "http://localhost:7777/register/invalid/xyz" })
await browser_wait_for({ text: "Invalid QR Code" })

// Expired QR code
await browser_navigate({ url: "http://localhost:7777/register/foodbankcentral/expired123" })
await browser_wait_for({ text: "QR Code Expired" })

// Duplicate registration
// Try to register same user twice
// Should show "Already Registered" message
```

### Network Error Handling
```javascript
// Test offline scenarios
await browser_evaluate(() => {
  // Simulate network failure
  window.navigator.onLine = false
})

// Should show offline message
await browser_wait_for({ text: "Connection Lost" })
```

## 📊 **Performance Testing**

### Load Time Verification
```javascript
const startTime = Date.now()
await browser_navigate({ url: "http://localhost:7777" })
const loadTime = Date.now() - startTime

console.log(`Page load time: ${loadTime}ms`)
// Should be < 2000ms
```

### Form Submission Performance
```javascript
const formStartTime = Date.now()
await browser_click({ element: "Submit Button", ref: "button[type='submit']" })
await browser_wait_for({ text: "Registration Successful" })
const formTime = Date.now() - formStartTime

console.log(`Form submission time: ${formTime}ms`)
// Should be < 1000ms
```

## 🎉 **Success Criteria**

### ✅ **Organizational Onboarding**
- [ ] Organization registration completes
- [ ] Email verification works
- [ ] Form builder saves configuration
- [ ] QR codes generate successfully
- [ ] Dashboard access granted

### ✅ **End-User Registration**
- [ ] QR code scan redirects correctly
- [ ] Registration form loads with correct fields
- [ ] Form submission succeeds
- [ ] Confirmation page shows QR code
- [ ] User can save/print QR code

### ✅ **Staff Check-in**
- [ ] Staff can access check-in interface
- [ ] QR code scanning works
- [ ] User details display correctly
- [ ] Check-in process completes
- [ ] Success confirmation shows

### ✅ **Data Verification**
- [ ] Registration appears in dashboard
- [ ] Check-in status updates
- [ ] Analytics reflect new data
- [ ] Export functionality works

## 🚀 **Execution Plan**

### Phase 1: Server Setup (5 minutes)
1. Fix server startup issues
2. Verify all endpoints accessible
3. Test basic navigation

### Phase 2: Organizational Onboarding (10 minutes)
1. Complete organization registration
2. Test email verification flow
3. Configure form builder
4. Generate QR codes
5. Verify dashboard access

### Phase 3: End-User Flow (10 minutes)
1. Simulate QR code scan
2. Fill registration form
3. Submit registration
4. Verify confirmation

### Phase 4: Staff Check-in (10 minutes)
1. Access staff interface
2. Scan user QR code
3. Verify user details
4. Complete check-in

### Phase 5: Data Verification (5 minutes)
1. Check dashboard updates
2. Verify registration data
3. Test analytics
4. Confirm end-to-end flow

---

**Total Estimated Time**: 40 minutes  
**Success Rate**: 95% (pending server fix)  
**Next Action**: Execute server recovery and begin testing

