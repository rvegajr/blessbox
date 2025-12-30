# 🧪 BlessBox Testing Guide
## A Friendly Step-by-Step Manual Testing Guide

**Welcome, Tester! 👋**

This guide will walk you through testing every feature of BlessBox. Don't worry if you're not technical—we've made this as simple as possible!

---

## 📑 Quick Navigation

**Jump to any section:**
- [Getting Started](#getting-started) - Set up your testing environment
- [Test Coupon Codes](#test-coupon-codes) - All the codes you'll need
- [Part 1: First Time Setup](#part-1-first-time-setup) - Create your account
- [Part 2: Creating Your First Event](#part-2-creating-your-first-event) - Set up QR codes
- [Part 3: Testing Registrations](#part-3-testing-registrations) - People signing up
- [Part 4: Checking People In](#part-4-checking-people-in) - Event day check-in
- [Part 5: Payment & Discounts](#part-5-payment--discounts) - Testing payments and coupons
- [Part 6: Admin Features](#part-6-admin-features) - Advanced features
- [Part 7: Reports & Exports](#part-7-reports--exports) - Getting your data
- [Part 8: Classes & Participants](#part-8-classes--participants) - Managing classes
- [Reporting Issues](#reporting-issues) - How to report bugs

---

## Getting Started

### What You'll Need

✅ A computer with internet  
✅ A web browser (Chrome, Firefox, Safari, or Edge)  
✅ An email address (to receive verification codes)  
✅ About 2-3 hours for complete testing  
✅ A notepad or document to take notes  

### Where to Test

🌐 **Production Website:** https://www.blessbox.org

### Before You Begin

1. **Open this guide** in a separate window or print it
2. **Have your email ready** - you'll receive 6-digit verification codes
3. **Prepare test data:**
   - Your email address
   - A test organization name (e.g., "Test Food Bank")
   - Sample names for registrations (e.g., "John Doe", "Jane Smith")

---

## Test Coupon Codes

🎟️ **These are special discount codes for testing!**

Before you start testing payments, make sure these coupons exist in the system. If you're an admin, you can create them. Otherwise, ask your team lead to set them up.

### ✅ Working Coupons

| Code | What It Does | Result |
|------|--------------|--------|
| **FREE100** | 100% off (FREE!) | Makes any plan $0.00 |
| **WELCOME50** | 50% off | Standard plan: $19 → $9.50 |
| **SAVE20** | $20 off | Standard plan: $19 → $1.00 (minimum charge) |
| **FIRST10** | $10 off | Standard plan: $19 → $9.00 |

### ❌ Test Error Cases

| Code | What Should Happen |
|------|-------------------|
| **EXPIRED** | Should show "Coupon expired" error |
| **MAXEDOUT** | Should show "Coupon limit reached" error |
| **INVALID** | Should show "Invalid coupon code" error |

---

## Part 1: First Time Setup

### Test 1.1: Creating Your Account (Email Verification)

**What you're testing:** Can a new user sign up?

**Steps:**

1. Go to: https://www.blessbox.org/onboarding/organization-setup

2. Fill in your organization information:
   - **Organization Name:** "Test Food Bank" (or any name)
   - **Email:** Your email address
   - **Phone:** (555) 123-4567
   - **Address:** 123 Test Street, Test City, TS 12345

3. Click **Continue** to proceed to email verification.

4. Check your email inbox for a **6-digit verification code**.

5. Enter the code on the verification page.

6. **Expected:** Your account is created and you're signed in automatically.
   - **Organization Type:** Pick one from the dropdown

7. Click **"Continue"** or **"Next"**

**✅ What to check:**
- [ ] Page loads without errors
- [ ] If redirected to login, 6-digit code sign-in returns you to onboarding
- [ ] All fields accept your input
- [ ] Contact email is the signed-in email (case-insensitive)
- [ ] You can click "Continue" and move to next step
- [ ] If you leave a required field empty, you get a helpful error message

---

### Test 1.2: 6-digit code Sign‑In (Email Authentication)

**What you're testing:** Does email-only authentication work (6-digit code)?

**Steps:**

1. Go to: https://www.blessbox.org/login
2. Enter your email address
3. Click **"Send 6-digit code"** / **"Email me a sign-in link"**
4. **Wait for email** (check your inbox - it might take 30 seconds)
5. Click the link in the email
6. **Expected:** You are signed in and redirected to the app (dashboard or your requested page)

**✅ What to check:**
- [ ] You receive an email within 30 seconds
- [ ] The link points to `blessbox.org` (not another domain)
- [ ] Clicking the link signs you in successfully
- [ ] Protected routes redirect to `/login?next=...` and return after login
- [ ] Session persists (refreshing `/dashboard` stays signed in)

**💡 Tip:** If you don't get the email, check your spam folder!

---

### Test 1.3: Building Your Registration Form

**What you're testing:** Can you create a custom form for people to fill out?

**Steps:**

1. You're now on the form builder page
2. **Add these fields** (click "Add Field" for each):
   - **First Name** (Text field, mark as Required)
   - **Last Name** (Text field, mark as Required)
   - **Email** (Email field, mark as Required)
   - **Phone** (Phone field, Optional)
   - **Address** (Text area, Optional)
   - **Date of Birth** (Date field, Optional)

3. Try **reordering fields** (drag them up or down if possible)

4. Click **"Save Form"** or **"Continue"**

**✅ What to check:**
- [ ] You can add new fields
- [ ] You can mark fields as required or optional
- [ ] You can see a preview of your form
- [ ] The form saves successfully
- [ ] You move to the next step

**💡 Tip:** This is the form people will fill out when they scan your QR code!

---

### Test 1.4: Creating QR Codes

**What you're testing:** Can you generate QR codes for your event?

**Steps:**

1. You're now on the QR configuration page
2. Fill in:
   - **QR Code Name:** "Main Entrance"
   - **Entry Point:** "Main Door"
   - **Location:** "Front of Building"
   - **Description:** "Primary registration point"

3. If you can add more entry points, add:
   - "Side Door"
   - "Drive-Through Lane"

4. Click **"Generate QR Codes"**

5. **You should see QR codes appear!**

6. Try clicking **"Download"** to save the QR codes

7. Click **"Complete Setup"** or **"Finish"**

**✅ What to check:**
- [ ] QR codes are generated
- [ ] QR codes look clear and scannable
- [ ] You can download the QR codes
- [ ] You're taken to the dashboard after completion

**💡 Tip:** You can test scanning these QR codes with your phone's camera!

---

## Part 2: Creating Your First Event

### Test 2.1: Viewing Your Dashboard

**What you're testing:** Does the dashboard show your information?

**Steps:**

1. After setup, you should be on the dashboard
2. If not, go to: https://www.blessbox.org/dashboard

3. **Look for:**
   - Statistics cards (total registrations, QR codes, etc.)
   - Recent activity
   - Navigation menu

**✅ What to check:**
- [ ] Dashboard loads without errors
- [ ] You see your organization name
- [ ] Statistics show "0" or accurate numbers
- [ ] Navigation menu works (you can click on different sections)

---

### Test 2.2: Viewing Your QR Codes

**What you're testing:** Can you see and manage your QR codes?

**Steps:**

1. Click on **"QR Codes"** in the navigation (or go to: https://www.blessbox.org/dashboard/qr-codes)

2. **You should see** the QR codes you created during setup

3. Click on one of the QR codes

4. **You should see** details about that QR code

**✅ What to check:**
- [ ] QR codes list displays
- [ ] QR codes are clear and scannable
- [ ] Clicking a QR code shows its details
- [ ] You can see how many times it's been scanned (should be 0 for now)

---

### Test 2.3: Downloading QR Codes

**What you're testing:** Can you download QR codes to print?

**Steps:**

1. On the QR codes page, find a QR code
2. Click the **"Download"** button
3. Choose format (PNG or PDF if available)
4. **The file should download**

5. Open the downloaded file
6. **Try scanning it** with your phone's camera

**✅ What to check:**
- [ ] Download button works
- [ ] File downloads successfully
- [ ] QR code is clear when you open it
- [ ] QR code scans correctly with your phone

---

## Part 3: Testing Registrations

### Test 3.1: Registering as a Public User

**What you're testing:** Can someone sign up using your QR code?

**Steps:**

1. **Option A:** Scan your QR code with your phone
   **Option B:** Get the registration URL from your QR code details and open it in a browser

2. **You should see** the registration form you created

3. Fill in the form:
   - **First Name:** "John"
   - **Last Name:** "Doe"
   - **Email:** "john.doe@example.com"
   - **Phone:** "(555) 987-6543"
   - Fill in any other fields you added

4. Click **"Submit"** or **"Register"**

**✅ What to check:**
- [ ] Form loads correctly
- [ ] All your custom fields appear
- [ ] Required fields are marked (usually with an asterisk *)
- [ ] Form submits successfully
- [ ] You see a success message
- [ ] The registration appears in your dashboard

**❌ Try these error cases:**
- [ ] Leave a required field empty - should show an error
- [ ] Enter an invalid email (like "notanemail") - should show an error
- [ ] Enter an invalid phone number - should show an error

---

### Test 3.2: Viewing Registrations

**What you're testing:** Can you see who has registered?

**Steps:**

1. Go to: https://www.blessbox.org/dashboard/registrations

2. **You should see** a list of registrations

3. Click on one of the registrations

4. **You should see** all the details that person entered

**✅ What to check:**
- [ ] Registrations list displays
- [ ] You can see all registrations
- [ ] Clicking a registration shows full details
- [ ] All information is accurate
- [ ] You can see when they registered (date and time)

**💡 Tip:** Try registering multiple people to see the list grow!

---

### Test 3.3: Searching and Filtering Registrations

**What you're testing:** Can you find specific registrations?

**Steps:**

1. On the registrations page, look for:
   - Search box
   - Filter options (date, status, etc.)

2. **If search exists:**
   - Type a name (like "John")
   - Results should filter

3. **If filters exist:**
   - Select a date range
   - Select a status (checked in, not checked in)
   - Results should filter

**✅ What to check:**
- [ ] Search works (if available)
- [ ] Filters work (if available)
- [ ] Results update correctly
- [ ] You can clear filters and see all results again

---

## Part 4: Checking People In

### Test 4.1: Checking Someone In

**What you're testing:** Can you mark someone as "checked in" at your event?

**Steps:**

1. Go to your registrations list
2. Find a registration that shows "Not Checked In"
3. Click the **"Check In"** button
4. **The status should change** to "Checked In"
5. **You should see** a timestamp (when they were checked in)

**✅ What to check:**
- [ ] Check-in button works
- [ ] Status updates immediately
- [ ] Timestamp is recorded correctly
- [ ] You can see who checked them in (if that feature exists)

**💡 Tip:** This is what you'll do on event day when people arrive!

---

### Test 4.2: Undoing a Check-in

**What you're testing:** Can you fix a mistake if you check someone in by accident?

**Steps:**

1. Find a registration that is "Checked In"
2. Look for an **"Undo Check-in"** or **"Uncheck"** button
3. Click it
4. **The status should change back** to "Not Checked In"

**✅ What to check:**
- [ ] Undo button exists and works
- [ ] Status reverts correctly
- [ ] You can check them in again if needed

---

### Test 4.3: Bulk Check-in (If Available)

**What you're testing:** Can you check in multiple people at once?

**Steps:**

1. On the registrations page, look for checkboxes next to each registration
2. **Select multiple registrations** by checking boxes
3. Look for a **"Check In Selected"** or **"Bulk Check-in"** button
4. Click it
5. **All selected people should be checked in**

**✅ What to check:**
- [ ] You can select multiple registrations
- [ ] Bulk check-in button works
- [ ] All selected people are checked in
- [ ] Status updates for all selected items

**💡 Tip:** This is super helpful for large events!

---

## Part 5: Payment & Discounts

### Test 5.1: Viewing Pricing Plans

**What you're testing:** Can you see what plans are available?

**Steps:**

1. Go to: https://www.blessbox.org/pricing

2. **You should see** three plans:
   - **Free Plan** - $0/month
   - **Standard Plan** - $19/month
   - **Enterprise Plan** - $99/month

3. Read the features for each plan

4. Click **"Get Started"** or **"Subscribe"** on any plan

**✅ What to check:**
- [ ] All three plans display
- [ ] Prices are correct
- [ ] Features are listed for each plan
- [ ] Buttons work and take you to checkout

---

### Test 5.2: Testing FREE Processing (FREE100 Coupon)

**What you're testing:** Can someone get a free subscription with a coupon?

**Steps:**

1. Click on **"Subscribe"** for the Standard plan ($19/month)
2. You should be on the checkout page
3. Look for a **"Coupon Code"** or **"Discount Code"** field
4. Enter: **FREE100**
5. Click **"Apply Coupon"** or **"Apply"**
6. **The total should change to $0.00!**
7. Complete the checkout (you may not need to enter payment info if it's free)
8. **You should be redirected** to the dashboard
9. **Your subscription should be active**

**✅ What to check:**
- [ ] Coupon code field exists
- [ ] FREE100 code works
- [ ] Total shows $0.00
- [ ] Checkout completes without payment
- [ ] Subscription is active in your account

**🎉 This is the free processing test!**

---

### Test 5.3: Testing 50% Discount (WELCOME50 Coupon)

**What you're testing:** Does percentage discount work correctly?

**Steps:**

1. Go to checkout page
2. Select **Standard plan** ($19/month)
3. Enter coupon code: **WELCOME50**
4. Click **"Apply Coupon"**
5. **The discount should show:** 50% off
6. **The total should show:** $9.50 (half of $19)
7. Fill in payment information:
   - **Card Number:** 4111 1111 1111 1111 (test card)
   - **CVV:** 123
   - **Expiry:** Any future date (like 12/25)
   - **ZIP:** 12345
8. Click **"Complete Payment"**
9. **You should be charged $9.50** (not the full $19)

**✅ What to check:**
- [ ] Coupon applies correctly
- [ ] Discount calculates: $19 × 50% = $9.50
- [ ] Payment processes
- [ ] You're charged the discounted amount
- [ ] Receipt shows correct amount

---

### Test 5.4: Testing $20 Off Discount (SAVE20 Coupon)

**What you're testing:** Does fixed amount discount work?

**Steps:**

1. Go to checkout page
2. Select **Standard plan** ($19/month)
3. Enter coupon code: **SAVE20**
4. Click **"Apply Coupon"**
5. **The discount should show:** $20.00 off
6. **The total should show:** $1.00 (because $19 - $20 = -$1, but minimum is $1)
7. Complete payment
8. **You should be charged $1.00**

**✅ What to check:**
- [ ] Fixed discount applies correctly
- [ ] Total is $1.00 (minimum charge)
- [ ] Payment processes correctly

---

### Test 5.5: Testing $10 Off Discount (FIRST10 Coupon)

**What you're testing:** Does a smaller fixed discount work?

**Steps:**

1. Go to checkout page
2. Select **Standard plan** ($19/month)
3. Enter coupon code: **FIRST10**
4. Click **"Apply Coupon"**
5. **The discount should show:** $10.00 off
6. **The total should show:** $9.00 ($19 - $10)
7. Complete payment
8. **You should be charged $9.00**

**✅ What to check:**
- [ ] Discount applies correctly
- [ ] Total is $9.00
- [ ] Payment processes

---

### Test 5.6: Testing Invalid Coupons (Error Cases)

**What you're testing:** Does the system reject bad coupon codes?

**Test 5.6a: Expired Coupon**
1. Enter coupon: **EXPIRED**
2. Click "Apply"
3. **Should show:** "Coupon expired" or "Invalid coupon" error

**Test 5.6b: Max Uses Reached**
1. Enter coupon: **MAXEDOUT**
2. Click "Apply"
3. **Should show:** "Coupon limit reached" error

**Test 5.6c: Invalid Code**
1. Enter coupon: **INVALID**
2. Click "Apply"
3. **Should show:** "Invalid coupon code" error

**Test 5.6d: Empty Code**
1. Leave coupon field empty
2. Click "Apply"
3. **Should show:** Validation error or do nothing

**✅ What to check:**
- [ ] All invalid codes are rejected
- [ ] Error messages are clear and helpful
- [ ] You can try again after an error
- [ ] No payment is processed with invalid coupons

---

### Test 5.7: Viewing Your Subscription

**What you're testing:** Can you see your subscription details?

**Steps:**

1. Go to your dashboard
2. Look for **"Subscription"** or **"Billing"** section
3. **You should see:**
   - Your plan type (Free, Standard, or Enterprise)
   - Billing cycle (monthly, yearly)
   - Next billing date
   - Amount you're paying
   - Status (Active, Cancelled, etc.)

**✅ What to check:**
- [ ] Subscription details display
- [ ] Information is accurate
- [ ] You can see when you'll be charged next
- [ ] Status is correct

---

## Part 6: Admin Features

**⚠️ Note:** You need admin access for these tests. If you don't have admin access, skip this section or ask for admin credentials.

### Test 6.1: Admin Dashboard

**What you're testing:** Can admins see system-wide statistics?

**Steps:**

1. Log in as admin user
2. Go to: https://www.blessbox.org/admin
3. **You should see:**
   - Total organizations
   - Total registrations
   - Total subscriptions
   - Total coupons
   - Other system statistics

**✅ What to check:**
- [ ] Admin dashboard loads
- [ ] Statistics are accurate
- [ ] Navigation works
- [ ] Only admins can access this page

---

### Test 6.2: Viewing All Organizations

**What you're testing:** Can admins see all organizations?

**Steps:**

1. In admin panel, click **"Organizations"** tab
2. **You should see** a list of all organizations
3. Click on an organization
4. **You should see:**
   - Organization name and contact info
   - How many registrations they have
   - How many QR codes they have
   - Their subscription status

**✅ What to check:**
- [ ] Organizations list displays
- [ ] You can see all organizations
- [ ] Details are accurate
- [ ] Counts are correct

---

### Test 6.3: Managing Coupons (Admin)

**What you're testing:** Can admins create and manage coupons?

**Steps:**

1. Go to: https://www.blessbox.org/admin/coupons
2. Click **"Create New Coupon"**
3. Fill in:
   - **Code:** TEST2024
   - **Discount Type:** Percentage
   - **Discount Value:** 25
   - **Status:** Active
   - **Max Uses:** 50
   - **Expires:** 6 months from today
4. Click **"Create Coupon"**
5. **The coupon should appear** in the list

**✅ What to check:**
- [ ] You can create coupons
- [ ] Form validates correctly
- [ ] Coupon appears in list
- [ ] You can edit coupons
- [ ] You can deactivate coupons

---

### Test 6.4: Viewing All Subscriptions

**What you're testing:** Can admins see all subscriptions?

**Steps:**

1. In admin panel, click **"Subscriptions"** tab
2. **You should see** all subscriptions from all organizations
3. **For each subscription, you should see:**
   - Organization name
   - Plan type
   - Status
   - Billing cycle
   - Amount

**✅ What to check:**
- [ ] Subscriptions list displays
- [ ] Information is accurate
- [ ] You can see all organizations' subscriptions

---

## Part 7: Reports & Exports

### Test 7.1: Exporting Registrations as CSV

**What you're testing:** Can you download your registration data?

**Steps:**

1. Go to: https://www.blessbox.org/dashboard/registrations
2. Click **"Export"** button
3. Select format: **"CSV"**
4. Click **"Download"**
5. **The file should download**
6. Open the CSV file (in Excel, Google Sheets, or any spreadsheet program)
7. **You should see** all your registration data

**✅ What to check:**
- [ ] Export button works
- [ ] File downloads successfully
- [ ] CSV file opens correctly
- [ ] All registration data is included
- [ ] Headers are correct (First Name, Last Name, Email, etc.)
- [ ] Data is accurate

**💡 Tip:** CSV files are great for importing into Excel or Google Sheets!

---

### Test 7.2: Exporting Registrations as PDF

**What you're testing:** Can you get a PDF report?

**Steps:**

1. On registrations page, click **"Export"**
2. Select format: **"PDF"**
3. Click **"Download"**
4. **The PDF should download**
5. Open the PDF
6. **You should see** all registrations formatted nicely

**✅ What to check:**
- [ ] PDF downloads
- [ ] PDF opens correctly
- [ ] Format is readable
- [ ] All data is included
- [ ] You can print it if needed

**💡 Tip:** PDFs are great for printing or sharing!

---

### Test 7.3: Exporting with Filters

**What you're testing:** Can you export only specific data?

**Steps:**

1. On registrations page, apply filters:
   - Select a date range
   - Select a status (checked in, not checked in)
2. Click **"Export"**
3. **Only the filtered data should be exported**

**✅ What to check:**
- [ ] Filters apply to export
- [ ] Only matching records are exported
- [ ] Export reflects your current filters

---

## Part 8: Classes & Participants

### Test 8.1: Creating a Class

**What you're testing:** Can you create a class or workshop?

**Steps:**

1. Go to: https://www.blessbox.org/classes/new
2. Fill in class details:
   - **Name:** "Yoga Basics"
   - **Description:** "Introduction to yoga for beginners"
   - **Capacity:** 20
   - **Timezone:** Select your timezone
3. Click **"Create Class"**
4. **The class should appear** in your classes list

**✅ What to check:**
- [ ] Form works correctly
- [ ] Class is created
- [ ] Class appears in list
- [ ] Details are correct

---

### Test 8.2: Adding Class Sessions

**What you're testing:** Can you schedule class sessions?

**Steps:**

1. Open a class you created
2. Click **"Add Session"**
3. Fill in:
   - **Date:** Pick a future date
   - **Time:** 10:00 AM
   - **Duration:** 60 minutes
   - **Location:** "Main Studio"
   - **Instructor:** "Jane Smith"
4. Click **"Save"**
5. **The session should appear** in the class

**✅ What to check:**
- [ ] Session is created
- [ ] Session appears in class
- [ ] Details are correct
- [ ] You can add multiple sessions

---

### Test 8.3: Adding Participants

**What you're testing:** Can you add people to your system?

**Steps:**

1. Go to participants section
2. Click **"Add Participant"**
3. Fill in:
   - **First Name:** "Alice"
   - **Last Name:** "Johnson"
   - **Email:** "alice@example.com"
   - **Phone:** "(555) 111-2222"
4. Click **"Save"**
5. **The participant should appear** in your list

**✅ What to check:**
- [ ] Participant is created
- [ ] Participant appears in list
- [ ] You can enroll them in classes

---

### Test 8.4: Enrolling Participants in Classes

**What you're testing:** Can you enroll people in classes?

**Steps:**

1. Open a class
2. Click **"Enroll Participant"**
3. Select a participant from the list
4. Select a session (if the class has multiple sessions)
5. Click **"Enroll"**
6. **The participant should appear** in the class roster

**✅ What to check:**
- [ ] Enrollment works
- [ ] Participant appears in class
- [ ] You can see who's enrolled
- [ ] Capacity limits work (if you try to enroll more than capacity)

---

## Reporting Issues

### How to Report a Bug

If something doesn't work as expected, here's how to report it:

**1. Take a Screenshot**
   - Press `Print Screen` or use a screenshot tool
   - Save the image

**2. Note the Details:**
   - **What page were you on?** (copy the URL)
   - **What were you trying to do?** (describe the steps)
   - **What happened instead?** (describe the problem)
   - **What browser are you using?** (Chrome, Firefox, Safari, etc.)
   - **What device?** (Windows PC, Mac, iPhone, etc.)

**3. Fill Out This Template:**

```
BUG REPORT

Title: [Brief description of the problem]

What I was doing:
1. Step 1
2. Step 2
3. Step 3

What I expected:
[What should have happened]

What actually happened:
[What actually happened]

Screenshot: [Attach screenshot]

Browser: [Chrome, Firefox, Safari, etc.]
Device: [Windows PC, Mac, iPhone, etc.]
URL: [The page where it happened]
```

**4. Send to your team lead or development team**

---

## Testing Checklist

Use this checklist to track your progress:

### Getting Started
- [ ] Read through this guide
- [ ] Set up test environment
- [ ] Prepared test data

### Part 1: First Time Setup
- [ ] Test 1.1: Creating Your Account
- [ ] Test 1.2: Email Verification
- [ ] Test 1.3: Building Your Registration Form
- [ ] Test 1.4: Creating QR Codes

### Part 2: Creating Your First Event
- [ ] Test 2.1: Viewing Your Dashboard
- [ ] Test 2.2: Viewing Your QR Codes
- [ ] Test 2.3: Downloading QR Codes

### Part 3: Testing Registrations
- [ ] Test 3.1: Registering as a Public User
- [ ] Test 3.2: Viewing Registrations
- [ ] Test 3.3: Searching and Filtering Registrations

### Part 4: Checking People In
- [ ] Test 4.1: Checking Someone In
- [ ] Test 4.2: Undoing a Check-in
- [ ] Test 4.3: Bulk Check-in (If Available)

### Part 5: Payment & Discounts
- [ ] Test 5.1: Viewing Pricing Plans
- [ ] Test 5.2: Testing FREE Processing (FREE100)
- [ ] Test 5.3: Testing 50% Discount (WELCOME50)
- [ ] Test 5.4: Testing $20 Off Discount (SAVE20)
- [ ] Test 5.5: Testing $10 Off Discount (FIRST10)
- [ ] Test 5.6: Testing Invalid Coupons
- [ ] Test 5.7: Viewing Your Subscription

### Part 6: Admin Features
- [ ] Test 6.1: Admin Dashboard
- [ ] Test 6.2: Viewing All Organizations
- [ ] Test 6.3: Managing Coupons (Admin)
- [ ] Test 6.4: Viewing All Subscriptions

### Part 7: Reports & Exports
- [ ] Test 7.1: Exporting Registrations as CSV
- [ ] Test 7.2: Exporting Registrations as PDF
- [ ] Test 7.3: Exporting with Filters

### Part 8: Classes & Participants
- [ ] Test 8.1: Creating a Class
- [ ] Test 8.2: Adding Class Sessions
- [ ] Test 8.3: Adding Participants
- [ ] Test 8.4: Enrolling Participants in Classes

### Final Steps
- [ ] All tests completed
- [ ] All bugs documented
- [ ] Test report submitted

---

## Tips for Successful Testing

✅ **Take your time** - Don't rush through tests  
✅ **Take notes** - Write down anything unusual  
✅ **Test on different browsers** - Chrome, Firefox, Safari  
✅ **Test on mobile** - Use your phone to test mobile features  
✅ **Try to break things** - Enter weird data, click buttons rapidly  
✅ **Ask questions** - If something is unclear, ask!  
✅ **Have fun!** - Testing can be like solving puzzles  

---

## Quick Reference

### Important URLs
- **Homepage:** https://www.blessbox.org
- **Dashboard:** https://www.blessbox.org/dashboard
- **Pricing:** https://www.blessbox.org/pricing
- **Admin Panel:** https://www.blessbox.org/admin

### Test Coupon Codes
- **FREE100** - 100% off (FREE!)
- **WELCOME50** - 50% off
- **SAVE20** - $20 off
- **FIRST10** - $10 off

### Test Payment Card
- **Card Number:** 4111 1111 1111 1111
- **CVV:** 123
- **Expiry:** Any future date
- **ZIP:** 12345

---

## Need Help?

If you get stuck or have questions:

1. **Check this guide** - Your answer might be here!
2. **Take a screenshot** - Visual evidence helps
3. **Note the exact steps** - What did you click?
4. **Check the browser console** - Press F12, look for errors
5. **Ask your team lead** - They're there to help!

---

**Thank you for testing BlessBox! 🎉**

Your testing helps make the app better for everyone. We appreciate your time and effort!

---

*Last Updated: December 2025*  
*Version: 2.0 - User-Friendly Edition*

