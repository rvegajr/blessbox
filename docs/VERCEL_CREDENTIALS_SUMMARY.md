# 🔑 BlessBox Vercel Credentials Summary

**⚠️ SECURITY NOTE:** This document contains sensitive information. Keep it secure and never commit to public repositories.

---

## 📧 Email Configuration (SendGrid)

### Production Environment

**Provider:** SendGrid  
**Status:** ✅ Configured

**Credentials:**
- **API Key:** `SG.bfOft2bRRRK92R_tSAqmQg.6LHtbuAkiRAWHmQLlfL0Dg27L6U_pP3JRWBJfk_re7I`
- **From Email:** `contact@yolovibecodebootcamp.com`
- **From Name:** `BlessBox Support`
- **Email Provider:** `sendgrid`

### ⚠️ Potential Issue

The FROM email `contact@yolovibecodebootcamp.com` **must be verified** in SendGrid for emails to send.

**To Fix:**
1. Go to https://app.sendgrid.com
2. Navigate to: **Settings → Sender Authentication**
3. Verify the email: `contact@yolovibecodebootcamp.com`
4. Or verify the domain: `yolovibecodebootcamp.com`

**Check SendGrid Activity:**
- Go to **Activity → Email Activity** in SendGrid dashboard
- See if emails are being sent
- Check for bounces, blocks, or errors

---

## 💳 Square Payment Configuration

### Production Environment

**Status:** ✅ Configured

**Credentials:**
- **Application ID:** `sq0idp-ILxW5EBGufGuE1-FsJTpbg` (from docs)
- **Access Token:** Configured in Vercel (encrypted)
- **Environment:** `production`

### Sandbox (Development)

**Status:** ✅ Configured

**Credentials:**
- **Application ID:** `sandbox-sq0idb-wmodH19wX_VVwhJOkrunbw` (from docs)
- **Access Token:** Configured in Vercel (encrypted)
- **Environment:** `sandbox`

---

## 🔍 Troubleshooting Email Issues

### Why Emails Might Not Be Sending

1. **SendGrid FROM Email Not Verified** ⚠️ **MOST LIKELY ISSUE**
   - The email `contact@yolovibecodebootcamp.com` must be verified in SendGrid
   - Unverified senders will cause emails to fail silently

2. **API Key Permissions**
   - API key needs "Mail Send" permissions
   - Check in SendGrid: Settings → API Keys

3. **Rate Limiting**
   - SendGrid has rate limits on free accounts
   - Check SendGrid dashboard for rate limit status

4. **Email Going to Spam**
   - Check spam/junk folder
   - Verify domain in SendGrid for better deliverability

### Diagnostic Steps

1. **Check Debug Endpoint:**
   ```
   https://www.blessbox.org/api/debug-email-config
   ```
   Shows current email configuration status

2. **Check Vercel Logs:**
   - Vercel Dashboard → Project → Logs
   - Look for email-related messages when requesting verification code
   - Should see: `✅ Verification email sent successfully` or error messages

3. **Check SendGrid Activity:**
   - SendGrid Dashboard → Activity → Email Activity
   - See if emails are being sent
   - Check for delivery status

4. **Test Email Sending:**
   - Request verification code from onboarding page
   - Immediately check:
     - Vercel logs
     - SendGrid activity dashboard
     - Email inbox (and spam folder)

---

## 🛠️ Quick Fixes

### Fix 1: Verify SendGrid Sender Email

1. Log into SendGrid: https://app.sendgrid.com
2. Go to **Settings → Sender Authentication**
3. Click **"Verify a Single Sender"** or **"Authenticate Your Domain"**
4. Verify: `contact@yolovibecodebootcamp.com`
5. Wait for verification (may take a few minutes)
6. Test sending verification email again

### Fix 2: Check API Key Permissions

1. SendGrid Dashboard → **Settings → API Keys**
2. Find your API key (starts with `SG.bfOft2b...`)
3. Verify it has **"Mail Send"** permission enabled
4. If not, create a new API key with Mail Send permission
5. Update in Vercel: `vercel env add SENDGRID_API_KEY production`

### Fix 3: Check SendGrid Account Status

1. SendGrid Dashboard → **Settings → Account Details**
2. Verify account is active (not suspended)
3. Check if you've hit any limits
4. Verify billing is set up (if required)

---

## 📋 All Environment Variables in Production

### Email
- ✅ `EMAIL_PROVIDER` = `sendgrid`
- ✅ `SENDGRID_API_KEY` = `SG.bfOft2bRRRK92R_tSAqmQg.6LHtbuAkiRAWHmQLlfL0Dg27L6U_pP3JRWBJfk_re7I`
- ✅ `SENDGRID_FROM_EMAIL` = `contact@yolovibecodebootcamp.com`
- ✅ `SENDGRID_FROM_NAME` = `BlessBox Support`
- ✅ `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT` (fallback)

### Payment (Square)
- ✅ `SQUARE_APPLICATION_ID` = Configured
- ✅ `SQUARE_ACCESS_TOKEN` = Configured
- ✅ `SQUARE_ENVIRONMENT` = `production`

### Database
- ✅ `TURSO_DATABASE_URL` = Configured
- ✅ `TURSO_AUTH_TOKEN` = Configured

### Authentication
- ✅ `NEXTAUTH_SECRET` = Configured
- ✅ `NEXTAUTH_URL` = Configured
- ✅ `JWT_SECRET` = Configured

### Application
- ✅ `PUBLIC_APP_URL` = Configured
- ✅ `SUPERADMIN_EMAIL` = Configured

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] SendGrid sender email is verified
- [ ] SendGrid API key has Mail Send permissions
- [ ] SendGrid account is active
- [ ] Square credentials are valid
- [ ] All environment variables are set in Vercel Production
- [ ] Application has been redeployed after any env var changes

---

## 🚀 Next Steps

1. **Verify SendGrid Sender Email** (Priority #1)
   - This is likely why emails aren't sending
   - Go to SendGrid dashboard and verify `contact@yolovibecodebootcamp.com`

2. **Redeploy Application**
   - After verifying sender email, redeploy to ensure changes take effect
   - Or wait a few minutes for SendGrid to process verification

3. **Test Email Sending**
   - Request verification code
   - Check Vercel logs
   - Check SendGrid activity
   - Check email inbox

4. **Monitor SendGrid Activity**
   - Watch SendGrid dashboard for email activity
   - Check for any errors or bounces

---

**Last Updated:** December 2025  
**Security Level:** 🔒 Confidential - Contains API Keys

