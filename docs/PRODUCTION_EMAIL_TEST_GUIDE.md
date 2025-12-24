# 🧪 Production Email Testing Guide

## Quick Test Commands

### Test 1: Check Email Configuration
```bash
curl https://www.blessbox.org/api/system/email-health \
  -H "Authorization: Bearer $DIAGNOSTICS_SECRET"
```

### Test 2: Comprehensive Email Test
```bash
curl -X POST https://www.blessbox.org/api/test-production-email \
  -H "Authorization: Bearer $DIAGNOSTICS_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### Test 3: Onboarding Flow Test
```bash
curl -X POST https://www.blessbox.org/api/onboarding/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

---

## 🔍 Diagnostic Checklist

### Step 1: Verify Environment Variables

1. **Check Vercel Dashboard:**
   - Go to: Settings → Environment Variables
   - Verify these are set for **Production**:
     - `SENDGRID_API_KEY` = `SG.***`
     - `SENDGRID_FROM_EMAIL` = *(a verified sender identity)*
     - `DIAGNOSTICS_SECRET` = *(required to call protected diagnostics endpoints)*

2. **Verify via Debug Endpoint:**
   ```
   https://www.blessbox.org/api/system/email-health
   ```
   Should show:
   ```json
   {
     "success": true
   }
   ```

### Step 2: Verify SendGrid Configuration

1. **Check SendGrid Dashboard:**
   - Go to: https://app.sendgrid.com
   - Settings → API Keys
   - Verify API key exists and is **Active**
   - Verify it has **"Mail Send"** permission

2. **Verify Sender Email:**
   - Settings → Sender Authentication
   - Verify `contact@yolovibecodebootcamp.com` is **Verified** ✅

### Step 3: Test Email Sending

1. **Use Test Endpoint:**
   ```bash
   curl -X POST https://www.blessbox.org/api/test-production-email \
     -H "Content-Type: application/json" \
     -d '{"email":"rvegajr@darkware.net"}'
   ```

2. **Check Response:**
   - Should return `"success": true`
   - Should include test code
   - Should show diagnostics

3. **Check Your Email:**
   - Inbox: `rvegajr@darkware.net`
   - Spam/junk folder
   - Wait 30-60 seconds

### Step 4: Check SendGrid Activity

1. **Go to SendGrid Dashboard:**
   - Activity → Email Activity
   - Look for the test email
   - Check status:
     - **Delivered** = ✅ Working!
     - **Dropped** = Check reason
     - **Bounced** = Invalid recipient?
     - **Blocked** = Check reason
     - **No activity** = Email never reached SendGrid (API issue)

### Step 5: Check Vercel Logs

1. **Go to Vercel Dashboard:**
   - Your Project → Logs
   - Look for:
     - ✅ `Verification email sent successfully`
     - ✅ `SendGrid email sent to [email], status: 202`
     - ❌ `SendGrid error:` (with error details)
     - ❌ `Failed to send verification email:`

---

## 🐛 Common Issues & Fixes

### Issue: "Unauthorized" Error

**Cause:** SendGrid API key is invalid, expired, or revoked

**Fix:**
1. Create new API key in SendGrid
2. Update in Vercel
3. **Redeploy application**

### Issue: "Sender not verified"

**Cause:** FROM email not verified in SendGrid

**Fix:**
1. SendGrid → Settings → Sender Authentication
2. Verify `contact@yolovibecodebootcamp.com`
3. Wait for verification to complete

### Issue: Email sent but not received

**Possible Causes:**
- Email in spam folder
- SendGrid rate limiting
- Invalid recipient email
- Domain reputation issues

**Fix:**
1. Check spam folder
2. Check SendGrid Activity for delivery status
3. Verify recipient email is valid
4. Check SendGrid account limits

### Issue: No email activity in SendGrid

**Cause:** Email never reached SendGrid (API issue)

**Fix:**
1. Verify API key is correct
2. Check API key permissions
3. Verify environment variables in Vercel
4. **Redeploy after env var changes**

---

## ✅ Success Indicators

You'll know emails are working when:

1. ✅ Test endpoint returns `"success": true`
2. ✅ Email appears in SendGrid Activity as "Delivered"
3. ✅ Vercel logs show `✅ Verification email sent successfully`
4. ✅ You receive the email in your inbox
5. ✅ Debug endpoint shows `"status": "ready"`

---

## 📋 Complete Test Procedure

```bash
# 1. Check configuration
curl https://www.blessbox.org/api/debug-email-config

# 2. Send test email
curl -X POST https://www.blessbox.org/api/test-production-email \
  -H "Content-Type: application/json" \
  -d '{"email":"rvegajr@darkware.net"}'

# 3. Check SendGrid Activity dashboard
# 4. Check Vercel logs
# 5. Check email inbox
```

---

**Last Updated:** December 2025

