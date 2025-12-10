# 🧪 BlessBox Manual QA Testing Script

**Version:** 1.0  
**Date:** December 2025  
**Production URL:** https://www.blessbox.org  
**Test Environment:** Production

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Test Accounts & Credentials](#test-accounts--credentials)
3. [Coupon Codes for Testing](#coupon-codes-for-testing)
4. [Test Scenarios](#test-scenarios)
   - [Authentication & Login](#1-authentication--login)
   - [Onboarding Flow](#2-onboarding-flow)
   - [Dashboard Features](#3-dashboard-features)
   - [QR Code Management](#4-qr-code-management)
   - [Registration System](#5-registration-system)
   - [Check-in Process](#6-check-in-process)
   - [Payment & Subscriptions](#7-payment--subscriptions)
   - [Coupon System](#8-coupon-system)
   - [Admin Panel](#9-admin-panel)
   - [Export Functionality](#10-export-functionality)
   - [Classes & Participants](#11-classes--participants)
   - [Analytics & Reporting](#12-analytics--reporting)

---

## Pre-Testing Setup

### Required Tools
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Mobile device or browser dev tools (for mobile testing)
- Email access (for verification codes)
- Note-taking tool (to document findings)

### Test Data Preparation
Before starting, prepare:
- 2-3 test email addresses (for different organizations)
- Test organization names
- Sample registration data (names, emails, phone numbers)
- Payment test cards (if testing Square integration)

---

## Test Accounts & Credentials

### Super Admin Account
**Note:** You'll need to create this account or request access from the development team.

**Email:** `admin@blessbox.org` (or provided test account)  
**Purpose:** Testing admin panel features

### Regular User Accounts
Create new accounts during onboarding flow testing.

**Test Emails:**
- `testorg1@example.com`
- `testorg2@example.com`
- `testorg3@example.com`

---

## Coupon Codes for Testing

### 🎟️ Pre-Created Test Coupons

**IMPORTANT:** These coupons should be created in the admin panel before testing. If they don't exist, create them using the instructions in [Section 8: Coupon System](#8-coupon-system).

**Quick Setup Instructions:**
1. Log in as admin user
2. Navigate to: `https://www.blessbox.org/admin/coupons`
3. Click "Create New Coupon"
4. Create each coupon listed below with the exact specifications
5. Save all coupons before starting payment testing

#### 1. **FREE100** - 100% Off (Free Processing)
- **Code:** `FREE100`
- **Type:** Percentage
- **Value:** 100%
- **Status:** Active
- **Max Uses:** Unlimited (or 100 for testing)
- **Expires:** 1 year from now
- **Purpose:** Test free subscription processing
- **Expected Result:** Final amount should be $0.00

#### 2. **WELCOME50** - 50% Off Welcome Discount
- **Code:** `WELCOME50`
- **Type:** Percentage
- **Value:** 50%
- **Status:** Active
- **Max Uses:** 50
- **Expires:** 3 months from now
- **Purpose:** Test percentage discount
- **Expected Result:** $19 Standard plan → $9.50

#### 3. **SAVE20** - $20 Fixed Discount
- **Code:** `SAVE20`
- **Type:** Fixed
- **Value:** $20.00
- **Status:** Active
- **Max Uses:** 25
- **Expires:** 6 months from now
- **Purpose:** Test fixed amount discount
- **Expected Result:** $19 Standard plan → $0.00 (minimum $1, but $20 off makes it free)

#### 4. **FIRST10** - $10 Off First Purchase
- **Code:** `FIRST10`
- **Type:** Fixed
- **Value:** $10.00
- **Status:** Active
- **Max Uses:** 100
- **Expires:** 1 year from now
- **Purpose:** Test smaller fixed discount
- **Expected Result:** $19 Standard plan → $9.00 (minimum $1 applies)

#### 5. **EXPIRED** - Expired Coupon (Negative Test)
- **Code:** `EXPIRED`
- **Type:** Percentage
- **Value:** 25%
- **Status:** Inactive/Expired
- **Purpose:** Test expired coupon handling
- **Expected Result:** Should show "Coupon expired" error

#### 6. **MAXEDOUT** - Max Uses Reached (Negative Test)
- **Code:** `MAXEDOUT`
- **Type:** Percentage
- **Value:** 30%
- **Status:** Active
- **Max Uses:** 1 (already used)
- **Purpose:** Test max uses validation
- **Expected Result:** Should show "Coupon limit reached" error

#### 7. **INVALID** - Invalid Code (Negative Test)
- **Code:** `INVALID`
- **Purpose:** Test invalid code handling
- **Expected Result:** Should show "Invalid coupon code" error

---

## Test Scenarios

---

## 1. Authentication & Login

### Test Case 1.1: Email Verification Flow

**Objective:** Verify email verification system works correctly

**Steps:**
1. Navigate to: `https://www.blessbox.org/onboarding/organization-setup`
2. Enter a test email address (e.g., `testorg1@example.com`)
3. Click "Send Verification Code"
4. **Expected:** Success message appears
5. Check email inbox for verification code
6. Enter the 6-digit code
7. Click "Verify Email"
8. **Expected:** Email verified successfully, proceed to next step

**Pass Criteria:**
- ✅ Verification code is sent
- ✅ Code is received in email within 30 seconds
- ✅ Code validation works correctly
- ✅ Invalid codes are rejected
- ✅ Expired codes (after 15 minutes) are rejected

**Negative Tests:**
- Try invalid code (e.g., `000000`)
- Try expired code (wait 16 minutes)
- Try code from different email

---

### Test Case 1.2: Login/Authentication

**Objective:** Verify user can log in after account creation

**Steps:**
1. Complete onboarding flow (see Section 2)
2. Log out (if logout button exists)
3. Navigate to login page (if exists) or dashboard
4. Enter email and password (if password-based) or request magic link
5. Complete authentication
6. **Expected:** Redirected to dashboard

**Pass Criteria:**
- ✅ User can authenticate
- ✅ Session persists
- ✅ Protected routes require authentication

---

## 2. Onboarding Flow

### Test Case 2.1: Organization Setup (Step 1)

**Objective:** Verify organization information can be saved

**Steps:**
1. Navigate to: `https://www.blessbox.org/onboarding/organization-setup`
2. Fill in organization details:
   - **Organization Name:** "Test Food Bank"
   - **Email:** Use test email (e.g., `testorg1@example.com`)
   - **Phone:** `(555) 123-4567`
   - **Address:** `123 Test Street, Test City, TS 12345`
   - **Organization Type:** Select from dropdown
3. Click "Continue" or "Next"
4. **Expected:** Proceed to email verification step

**Pass Criteria:**
- ✅ All required fields validated
- ✅ Form saves data correctly
- ✅ Navigation to next step works
- ✅ Data persists if user goes back

**Negative Tests:**
- Submit with empty required fields
- Submit with invalid email format
- Submit with invalid phone format

---

### Test Case 2.2: Email Verification (Step 2)

**Objective:** Verify email verification process

**Steps:**
1. After Step 1, you should be on email verification page
2. Verify email is pre-filled from Step 1
3. Click "Send Verification Code"
4. Check email for code
5. Enter code
6. Click "Verify"
7. **Expected:** Proceed to form builder step

**Pass Criteria:**
- ✅ Code sent successfully
- ✅ Code received in email
- ✅ Verification succeeds with correct code
- ✅ Invalid codes rejected

---

### Test Case 2.3: Form Builder (Step 3)

**Objective:** Verify custom form can be created

**Steps:**
1. On form builder page, add fields:
   - **First Name** (Text, Required)
   - **Last Name** (Text, Required)
   - **Email** (Email, Required)
   - **Phone** (Phone, Optional)
   - **Address** (Textarea, Optional)
   - **Date of Birth** (Date, Optional)
   - **Emergency Contact** (Text, Optional)
2. Reorder fields (drag and drop if available)
3. Mark required fields
4. Click "Save Form" or "Continue"
5. **Expected:** Form saved, proceed to QR configuration

**Pass Criteria:**
- ✅ Fields can be added
- ✅ Fields can be reordered
- ✅ Required/optional can be toggled
- ✅ Form preview shows correctly
- ✅ Form saves successfully

**Negative Tests:**
- Try to save form with no fields
- Try to add duplicate field names
- Try invalid field configurations

---

### Test Case 2.4: QR Configuration (Step 4)

**Objective:** Verify QR codes can be generated

**Steps:**
1. On QR configuration page, configure:
   - **QR Code Name/Label:** "Main Entrance"
   - **Entry Point:** "Main Door"
   - **Location:** "Front of Building"
   - **Description:** "Primary registration point"
2. Add additional entry points (if multiple supported):
   - "Side Door"
   - "Drive-Through Lane"
3. Click "Generate QR Codes"
4. **Expected:** QR codes generated and displayed
5. Download QR codes (if download button available)
6. Click "Complete Setup" or "Finish"
7. **Expected:** Redirected to dashboard

**Pass Criteria:**
- ✅ QR codes generated successfully
- ✅ QR codes are scannable
- ✅ Multiple entry points supported
- ✅ QR codes can be downloaded
- ✅ Onboarding completes successfully

---

## 3. Dashboard Features

### Test Case 3.1: Dashboard Overview

**Objective:** Verify dashboard displays correctly

**Steps:**
1. Navigate to: `https://www.blessbox.org/dashboard`
2. Verify dashboard loads
3. Check for:
   - Statistics cards (total registrations, QR codes, etc.)
   - Recent activity feed
   - Quick action buttons
   - Navigation menu
4. **Expected:** All elements visible and functional

**Pass Criteria:**
- ✅ Dashboard loads without errors
- ✅ Statistics are accurate
- ✅ Recent activity shows correctly
- ✅ Navigation works

---

### Test Case 3.2: Dashboard Statistics

**Objective:** Verify statistics are accurate

**Steps:**
1. On dashboard, note current statistics:
   - Total Registrations
   - Total QR Codes
   - Active Subscriptions
   - Today's Registrations
2. Create a new registration (see Section 5)
3. Refresh dashboard
4. **Expected:** Statistics updated correctly

**Pass Criteria:**
- ✅ Statistics update in real-time (or after refresh)
- ✅ Numbers are accurate
- ✅ No negative numbers
- ✅ Percentages calculate correctly

---

## 4. QR Code Management

### Test Case 4.1: View QR Codes

**Objective:** Verify QR codes can be viewed

**Steps:**
1. Navigate to: `https://www.blessbox.org/dashboard/qr-codes`
2. **Expected:** List of QR codes displayed
3. Click on a QR code
4. **Expected:** QR code details shown

**Pass Criteria:**
- ✅ QR codes list displays
- ✅ QR codes are scannable
- ✅ Details page shows correct information
- ✅ QR code images load correctly

---

### Test Case 4.2: Download QR Codes

**Objective:** Verify QR codes can be downloaded

**Steps:**
1. Navigate to QR codes page
2. Click "Download" on a QR code
3. Select format (PNG or PDF if available)
4. **Expected:** File downloads successfully
5. Open downloaded file
6. **Expected:** QR code is valid and scannable

**Pass Criteria:**
- ✅ Download initiates
- ✅ File downloads successfully
- ✅ QR code is valid
- ✅ QR code scans correctly

---

### Test Case 4.3: QR Code Analytics

**Objective:** Verify QR code analytics work

**Steps:**
1. Navigate to a specific QR code details page
2. Check analytics section:
   - Total scans
   - Registrations from this QR
   - Check-ins
   - Date range data
3. **Expected:** Analytics display correctly

**Pass Criteria:**
- ✅ Analytics load
- ✅ Data is accurate
- ✅ Charts/graphs render (if applicable)
- ✅ Date filters work

---

## 5. Registration System

### Test Case 5.1: Public Registration Form

**Objective:** Verify public can register via QR code

**Steps:**
1. Scan a QR code (or navigate to registration URL)
2. **Expected:** Registration form loads
3. Fill in form fields:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@example.com"
   - Phone: "(555) 987-6543"
   - Other custom fields as configured
4. Submit form
5. **Expected:** Success message and confirmation

**Pass Criteria:**
- ✅ Form loads correctly
- ✅ All configured fields display
- ✅ Required field validation works
- ✅ Form submits successfully
- ✅ Success message appears
- ✅ Registration appears in dashboard

**Negative Tests:**
- Submit with empty required fields
- Submit with invalid email
- Submit with invalid phone
- Submit duplicate email (if uniqueness enforced)

---

### Test Case 5.2: View Registrations

**Objective:** Verify registrations can be viewed

**Steps:**
1. Navigate to: `https://www.blessbox.org/dashboard/registrations`
2. **Expected:** List of registrations displayed
3. Click on a registration
4. **Expected:** Registration details shown

**Pass Criteria:**
- ✅ Registrations list displays
- ✅ Search/filter works (if available)
- ✅ Pagination works (if many registrations)
- ✅ Details page shows all information

---

### Test Case 5.3: Registration Details

**Objective:** Verify registration details are complete

**Steps:**
1. Open a registration from the list
2. Verify all fields display:
   - Personal information
   - Registration date/time
   - QR code source
   - Check-in status
   - Custom fields
3. **Expected:** All data visible and accurate

**Pass Criteria:**
- ✅ All fields display
- ✅ Data is accurate
- ✅ Timestamps are correct
- ✅ Status indicators work

---

## 6. Check-in Process

### Test Case 6.1: Check-in a Registration

**Objective:** Verify registrations can be checked in

**Steps:**
1. Navigate to registrations list
2. Find a registration that hasn't been checked in
3. Click "Check In" button
4. **Expected:** Status changes to "Checked In"
5. Verify timestamp is recorded
6. **Expected:** Check-in time displayed

**Pass Criteria:**
- ✅ Check-in button works
- ✅ Status updates immediately
- ✅ Timestamp recorded correctly
- ✅ Cannot check in twice (if prevented)

---

### Test Case 6.2: Undo Check-in

**Objective:** Verify check-in can be undone

**Steps:**
1. Find a checked-in registration
2. Click "Undo Check-in" (if available)
3. **Expected:** Status reverts to "Not Checked In"
4. Verify timestamp removed/updated

**Pass Criteria:**
- ✅ Undo works
- ✅ Status reverts correctly
- ✅ History maintained (if applicable)

---

### Test Case 6.3: Bulk Check-in

**Objective:** Verify multiple registrations can be checked in

**Steps:**
1. Navigate to registrations list
2. Select multiple registrations (if bulk select available)
3. Click "Check In Selected"
4. **Expected:** All selected registrations checked in

**Pass Criteria:**
- ✅ Bulk selection works
- ✅ All selected items checked in
- ✅ Status updates for all items

---

## 7. Payment & Subscriptions

### Test Case 7.1: View Pricing Page

**Objective:** Verify pricing information displays

**Steps:**
1. Navigate to: `https://www.blessbox.org/pricing`
2. **Expected:** Pricing plans displayed:
   - Free Plan ($0)
   - Standard Plan ($19/month)
   - Enterprise Plan ($99/month)
3. Verify features listed for each plan
4. Click "Get Started" or "Subscribe" button
5. **Expected:** Redirected to checkout

**Pass Criteria:**
- ✅ All plans displayed
- ✅ Pricing accurate
- ✅ Features listed correctly
- ✅ Buttons work

---

### Test Case 7.2: Checkout Process (Without Coupon)

**Objective:** Verify checkout works without coupon

**Steps:**
1. Navigate to checkout page (or from pricing page)
2. Select a plan (e.g., Standard - $19/month)
3. Fill in payment information (use Square test card):
   - **Test Card:** `4111 1111 1111 1111`
   - **CVV:** `123`
   - **Expiry:** Any future date
   - **ZIP:** `12345`
4. Click "Complete Payment"
5. **Expected:** Payment processes successfully
6. **Expected:** Redirected to dashboard
7. **Expected:** Subscription active

**Pass Criteria:**
- ✅ Payment form loads
- ✅ Card validation works
- ✅ Payment processes
- ✅ Success message appears
- ✅ Subscription created
- ✅ Redirect works

**Negative Tests:**
- Invalid card number
- Expired card
- Insufficient funds (if test mode supports)

---

### Test Case 7.3: Checkout with Coupon (FREE100)

**Objective:** Verify free processing with 100% coupon

**Steps:**
1. Navigate to checkout page
2. Select Standard plan ($29.99/month)
3. Enter coupon code: `FREE100`
4. Click "Apply Coupon"
5. **Expected:** Discount applied, total shows $0.00
6. Complete checkout (may skip payment if $0)
7. **Expected:** Subscription created for $0.00
8. **Expected:** Redirected to dashboard

**Pass Criteria:**
- ✅ Coupon code field works
- ✅ Coupon validates correctly
- ✅ Discount calculates correctly (100% = $0.00)
- ✅ Total updates to $0.00
- ✅ Checkout completes without payment
- ✅ Subscription active

---

### Test Case 7.4: Checkout with Percentage Coupon (WELCOME50)

**Objective:** Verify percentage discount works

**Steps:**
1. Navigate to checkout page
2. Select Standard plan ($19/month)
3. Enter coupon code: `WELCOME50`
4. Click "Apply Coupon"
5. **Expected:** Discount shows 50% off
6. **Expected:** Total shows $9.50 (50% of $19.00)
7. Complete payment with test card
8. **Expected:** Charged $9.50 (not full amount)

**Pass Criteria:**
- ✅ Coupon applies correctly
- ✅ Discount calculates: $29.99 × 50% = $14.99
- ✅ Payment amount is discounted
- ✅ Receipt shows correct amount

---

### Test Case 7.5: Checkout with Fixed Coupon (SAVE20)

**Objective:** Verify fixed amount discount works

**Steps:**
1. Navigate to checkout page
2. Select Standard plan ($19/month)
3. Enter coupon code: `SAVE20`
4. Click "Apply Coupon"
5. **Expected:** Discount shows $20.00 off
6. **Expected:** Total shows $1.00 (minimum amount, since $19 - $20 would be negative)
7. Complete payment
8. **Expected:** Charged $1.00 (minimum charge applies)

**Pass Criteria:**
- ✅ Fixed discount applies correctly
- ✅ Calculation: $29.99 - $20.00 = $9.99
- ✅ Payment amount correct

---

### Test Case 7.6: Invalid Coupon Codes

**Objective:** Verify invalid coupons are rejected

**Test 7.6a: Expired Coupon**
1. Enter coupon: `EXPIRED`
2. **Expected:** Error: "Coupon expired" or "Invalid coupon"

**Test 7.6b: Max Uses Reached**
1. Enter coupon: `MAXEDOUT`
2. **Expected:** Error: "Coupon limit reached"

**Test 7.6c: Invalid Code**
1. Enter coupon: `INVALID`
2. **Expected:** Error: "Invalid coupon code"

**Test 7.6d: Empty Code**
1. Leave coupon field empty
2. Click "Apply"
3. **Expected:** Validation error or no action

**Pass Criteria:**
- ✅ All invalid codes rejected
- ✅ Error messages are clear
- ✅ User can try again
- ✅ No payment processed with invalid coupon

---

### Test Case 7.7: Subscription Management

**Objective:** Verify subscription can be viewed/managed

**Steps:**
1. Navigate to dashboard or subscription page
2. View current subscription:
   - Plan type
   - Billing cycle
   - Next billing date
   - Amount
   - Status
3. If cancel option available, test cancellation
4. **Expected:** Subscription details accurate

**Pass Criteria:**
- ✅ Subscription details display
- ✅ Information is accurate
- ✅ Cancellation works (if available)
- ✅ Status updates correctly

---

## 8. Coupon System

### Test Case 8.1: Create New Coupon (Admin)

**Objective:** Verify coupons can be created

**Steps:**
1. Log in as admin
2. Navigate to: `https://www.blessbox.org/admin/coupons`
3. Click "Create New Coupon"
4. Fill in form:
   - **Code:** `TEST2024`
   - **Discount Type:** Percentage
   - **Discount Value:** `25`
   - **Currency:** USD
   - **Status:** Active
   - **Max Uses:** `50`
   - **Expires:** 6 months from today
   - **Description:** "Test coupon for QA"
5. Click "Create Coupon"
6. **Expected:** Coupon created successfully
7. **Expected:** Appears in coupons list

**Pass Criteria:**
- ✅ Form validates correctly
- ✅ Coupon created
- ✅ Appears in list
- ✅ Can be used in checkout

**Negative Tests:**
- Duplicate code (should fail)
- Invalid discount value (negative, >100% for percentage)
- Past expiration date

---

### Test Case 8.2: Edit Coupon

**Objective:** Verify coupons can be edited

**Steps:**
1. Navigate to coupons list
2. Click "Edit" on a coupon
3. Modify fields (e.g., change max uses)
4. Click "Save"
5. **Expected:** Changes saved
6. **Expected:** Updated in list

**Pass Criteria:**
- ✅ Edit form loads with current data
- ✅ Changes save successfully
- ✅ Updates reflect in list

---

### Test Case 8.3: View Coupon Analytics

**Objective:** Verify coupon usage analytics

**Steps:**
1. Navigate to coupons list
2. Click on a coupon to view details
3. Check analytics:
   - Total redemptions
   - Total discount given
   - Conversion rate
   - Recent redemptions
4. **Expected:** Analytics display correctly

**Pass Criteria:**
- ✅ Analytics load
- ✅ Data is accurate
- ✅ Calculations correct
- ✅ Charts/graphs render (if applicable)

---

### Test Case 8.4: Deactivate Coupon

**Objective:** Verify coupons can be deactivated

**Steps:**
1. Navigate to coupons list
2. Find an active coupon
3. Click "Deactivate" or toggle status
4. **Expected:** Status changes to inactive
5. Try to use coupon in checkout
6. **Expected:** Coupon rejected

**Pass Criteria:**
- ✅ Status updates
- ✅ Deactivated coupons cannot be used
- ✅ Can be reactivated

---

## 9. Admin Panel

### Test Case 9.1: Admin Dashboard Overview

**Objective:** Verify admin dashboard displays correctly

**Steps:**
1. Log in as super admin
2. Navigate to: `https://www.blessbox.org/admin`
3. **Expected:** Admin dashboard loads
4. Check for:
   - System statistics
   - Total organizations
   - Total registrations
   - Total subscriptions
   - Total coupons
5. **Expected:** All statistics display

**Pass Criteria:**
- ✅ Dashboard loads
- ✅ Statistics accurate
- ✅ Navigation works
- ✅ Access restricted to admins

---

### Test Case 9.2: View All Organizations

**Objective:** Verify organizations can be viewed

**Steps:**
1. Navigate to admin panel
2. Click "Organizations" tab
3. **Expected:** List of all organizations
4. Click on an organization
5. **Expected:** Organization details shown:
   - Name, email, contact info
   - Registration count
   - QR code count
   - Subscription status

**Pass Criteria:**
- ✅ Organizations list displays
- ✅ Details are accurate
- ✅ Counts are correct
- ✅ Search/filter works (if available)

---

### Test Case 9.3: View All Subscriptions

**Objective:** Verify subscriptions can be viewed

**Steps:**
1. Navigate to admin panel
2. Click "Subscriptions" tab
3. **Expected:** List of all subscriptions
4. Verify information:
   - Organization
   - Plan type
   - Status
   - Billing cycle
   - Amount
5. Test cancel subscription (if available)
6. **Expected:** Subscription cancelled

**Pass Criteria:**
- ✅ Subscriptions list displays
- ✅ Information accurate
- ✅ Cancellation works
- ✅ Status updates

---

### Test Case 9.4: Admin Coupon Management

**Objective:** Verify admin can manage all coupons

**Steps:**
1. Navigate to admin coupons section
2. View all coupons (not just own organization)
3. Create, edit, delete coupons
4. **Expected:** Full coupon management works

**Pass Criteria:**
- ✅ Can view all coupons
- ✅ Can create coupons
- ✅ Can edit any coupon
- ✅ Can delete coupons

---

## 10. Export Functionality

### Test Case 10.1: Export Registrations as CSV

**Objective:** Verify CSV export works

**Steps:**
1. Navigate to: `https://www.blessbox.org/dashboard/registrations`
2. Click "Export" button
3. Select format: "CSV"
4. Click "Download"
5. **Expected:** CSV file downloads
6. Open CSV file
7. **Expected:** All registration data included
8. **Expected:** Headers are correct
9. **Expected:** Data is properly formatted

**Pass Criteria:**
- ✅ Export initiates
- ✅ File downloads
- ✅ CSV format correct
- ✅ All fields included
- ✅ Data accurate
- ✅ Opens in Excel/Sheets correctly

---

### Test Case 10.2: Export Registrations as PDF

**Objective:** Verify PDF export works

**Steps:**
1. Navigate to registrations page
2. Click "Export"
3. Select format: "PDF"
4. Click "Download"
5. **Expected:** PDF file downloads
6. Open PDF
7. **Expected:** Registrations formatted nicely
8. **Expected:** All data included

**Pass Criteria:**
- ✅ PDF downloads
- ✅ Format is readable
- ✅ All data included
- ✅ Can be printed

---

### Test Case 10.3: Export with Filters

**Objective:** Verify filtered exports work

**Steps:**
1. Apply filters (date range, status, etc.)
2. Click "Export"
3. **Expected:** Only filtered data exported

**Pass Criteria:**
- ✅ Filters apply to export
- ✅ Only matching records exported
- ✅ Export reflects current filters

---

## 11. Classes & Participants

### Test Case 11.1: Create a Class

**Objective:** Verify classes can be created

**Steps:**
1. Navigate to: `https://www.blessbox.org/classes/new`
2. Fill in class details:
   - **Name:** "Yoga Basics"
   - **Description:** "Introduction to yoga"
   - **Capacity:** `20`
   - **Timezone:** Select timezone
3. Click "Create Class"
4. **Expected:** Class created
5. **Expected:** Appears in classes list

**Pass Criteria:**
- ✅ Form validates
- ✅ Class created
- ✅ Appears in list
- ✅ Details are correct

---

### Test Case 11.2: Add Class Sessions

**Objective:** Verify sessions can be added to classes

**Steps:**
1. Open a class
2. Click "Add Session"
3. Fill in:
   - **Date:** Future date
   - **Time:** `10:00 AM`
   - **Duration:** `60` minutes
   - **Location:** "Main Studio"
   - **Instructor:** "Jane Smith"
4. Click "Save"
5. **Expected:** Session added

**Pass Criteria:**
- ✅ Session created
- ✅ Appears in class sessions list
- ✅ Details correct

---

### Test Case 11.3: Add Participants

**Objective:** Verify participants can be added

**Steps:**
1. Navigate to participants section
2. Click "Add Participant"
3. Fill in:
   - **First Name:** "Alice"
   - **Last Name:** "Johnson"
   - **Email:** "alice@example.com"
   - **Phone:** "(555) 111-2222"
4. Click "Save"
5. **Expected:** Participant added

**Pass Criteria:**
- ✅ Participant created
- ✅ Appears in list
- ✅ Can be enrolled in classes

---

### Test Case 11.4: Enroll Participant in Class

**Objective:** Verify enrollment works

**Steps:**
1. Open a class
2. Click "Enroll Participant"
3. Select a participant
4. Select a session (optional)
5. Click "Enroll"
6. **Expected:** Participant enrolled
7. **Expected:** Enrollment appears in class

**Pass Criteria:**
- ✅ Enrollment works
- ✅ Participant appears in class roster
- ✅ Capacity limits enforced (if applicable)

---

## 12. Analytics & Reporting

### Test Case 12.1: Dashboard Analytics

**Objective:** Verify analytics display correctly

**Steps:**
1. Navigate to dashboard
2. Check analytics section:
   - Registration trends
   - QR code performance
   - Check-in rates
   - Time-based data
3. **Expected:** Charts/graphs display
4. Test date range filters
5. **Expected:** Data updates based on filters

**Pass Criteria:**
- ✅ Analytics load
- ✅ Charts render correctly
- ✅ Data is accurate
- ✅ Filters work
- ✅ No errors in console

---

### Test Case 12.2: QR Code Analytics

**Objective:** Verify QR code analytics

**Steps:**
1. Navigate to a QR code
2. View analytics:
   - Total scans
   - Registrations from this QR
   - Check-ins
   - Time-based breakdown
3. **Expected:** Analytics accurate

**Pass Criteria:**
- ✅ Analytics display
- ✅ Data matches actual usage
- ✅ Time filters work

---

### Test Case 12.3: Coupon Analytics

**Objective:** Verify coupon analytics

**Steps:**
1. Navigate to admin coupons
2. View coupon analytics:
   - Total redemptions
   - Total discount given
   - Conversion rate
   - Top performing coupons
3. **Expected:** Analytics accurate

**Pass Criteria:**
- ✅ Analytics display
- ✅ Calculations correct
- ✅ Data matches redemptions

---

## 🐛 Bug Reporting Template

When you find issues, document them using this template:

```markdown
### Bug Report

**Title:** [Brief description]

**Severity:** [Critical / High / Medium / Low]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Attach if applicable]

**Browser/Device:**
[Chrome 120, iPhone 14, etc.]

**URL:**
[Page where issue occurred]

**Additional Notes:**
[Any other relevant information]
```

---

## ✅ Test Completion Checklist

Before marking testing complete, verify:

- [ ] All test cases executed
- [ ] All coupon codes tested
- [ ] Free processing works (FREE100)
- [ ] Payment processing works
- [ ] All exports work (CSV, PDF)
- [ ] Mobile responsiveness tested
- [ ] Cross-browser testing done (Chrome, Firefox, Safari)
- [ ] All bugs documented
- [ ] Performance acceptable (< 3s page loads)
- [ ] No console errors
- [ ] All forms validate correctly
- [ ] All navigation works
- [ ] Admin features accessible only to admins
- [ ] Email verification works
- [ ] QR codes are scannable
- [ ] Check-in process works
- [ ] Analytics are accurate

---

## 📞 Support & Questions

If you encounter issues or have questions during testing:

1. **Document the issue** using the bug report template
2. **Take screenshots** of errors
3. **Note the exact steps** that led to the issue
4. **Check browser console** for errors (F12 → Console tab)
5. **Report to development team** with all details

---

## 🎯 Priority Test Areas

If time is limited, focus on these critical areas:

1. **Payment & Coupons** (Section 7 & 8) - Revenue critical
2. **Registration System** (Section 5) - Core functionality
3. **Onboarding Flow** (Section 2) - User acquisition
4. **Check-in Process** (Section 6) - Event management
5. **Export Functionality** (Section 10) - Data management

---

**Good luck with testing! 🚀**

*Last Updated: December 2025*

