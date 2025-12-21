# 📋 Vercel Environment Variables Summary

## ✅ Currently Configured in Production

Based on Vercel environment variables check, here's what's configured:

### 📧 Email Configuration (Production)

**SendGrid (Primary):**
- ✅ `SENDGRID_API_KEY` - Configured
- ✅ `SENDGRID_FROM_EMAIL` - Configured  
- ✅ `SENDGRID_FROM_NAME` - Configured
- ✅ `EMAIL_PROVIDER` - Configured

**SMTP (Fallback):**
- ✅ `SMTP_HOST` - Configured
- ✅ `SMTP_USER` - Configured
- ✅ `SMTP_PASS` - Configured
- ✅ `SMTP_PORT` - Configured

**Status:** Both SendGrid and SMTP are configured. The code will try SendGrid first, then fall back to SMTP.

---

### 💳 Square Payment Configuration (Production)

- ✅ `SQUARE_APPLICATION_ID` - Configured
- ✅ `SQUARE_ACCESS_TOKEN` - Configured
- ✅ `SQUARE_ENVIRONMENT` - Configured

**Status:** Square is fully configured for production payments.

---

## 🔍 Why Emails Might Not Be Sending

Even though SendGrid is configured, emails might not be sending due to:

1. **SendGrid FROM email not verified** - The `SENDGRID_FROM_EMAIL` must be verified in SendGrid
2. **API key permissions** - The API key needs "Mail Send" permissions
3. **Rate limiting** - SendGrid might be rate limiting
4. **Email going to spam** - Check spam folder
5. **Code using wrong service** - Check which service is actually being used

---

## 🛠️ Troubleshooting Steps

### Step 1: Check Which Email Service is Active

Visit the debug endpoint (after deployment):
```
https://www.blessbox.org/api/debug-email-config
```

This will show:
- Which email service is configured
- What environment variables are set
- Recommendations for fixing issues

### Step 2: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Look for email-related logs when you request a verification code
3. Look for:
   - `✅ Verification email sent successfully` (success)
   - `❌ Failed to send verification email` (failure)
   - `❌ SendGrid error:` (SendGrid specific error)

### Step 3: Verify SendGrid Configuration

1. **Check SendGrid Dashboard:**
   - Go to https://app.sendgrid.com
   - Settings → API Keys
   - Verify the API key exists and has "Mail Send" permissions

2. **Verify Sender Email:**
   - Settings → Sender Authentication
   - Verify that `SENDGRID_FROM_EMAIL` is verified
   - If not verified, verify it now

3. **Check SendGrid Activity:**
   - Activity → Email Activity
   - See if emails are being sent
   - Check for bounces or blocks

### Step 4: Test Email Sending

1. Request a verification code from the onboarding page
2. Check Vercel logs immediately
3. Check SendGrid activity dashboard
4. Check your email (including spam)

---

## 📝 Viewing Actual Values

To see the actual values (they're encrypted in Vercel CLI), you can:

### Option 1: Vercel Dashboard
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Click on each variable to see if it's set (values are hidden for security)

### Option 2: Pull to Local (Development Only)
```bash
vercel env pull .env.vercel
# Then check .env.vercel file (be careful not to commit this!)
```

### Option 3: Check Debug Endpoint
After deploying the latest changes, visit:
```
https://www.blessbox.org/api/debug-email-config
```

---

## 🔑 Square Credentials Reference

According to documentation, Square is configured with:

**Production:**
- Application ID: `sq0idp-ILxW5EBGufGuE1-FsJTpbg`
- Environment: `production`
- Access Token: Configured in Vercel

**Sandbox (Development):**
- Application ID: `sandbox-sq0idb-wmodH19wX_VVwhJOkrunbw`
- Environment: `sandbox`
- Access Token: Configured in Vercel

---

## ✅ Next Steps

1. **Redeploy** to get the latest email debugging improvements
2. **Check the debug endpoint** to see current email configuration
3. **Check Vercel logs** when requesting verification codes
4. **Verify SendGrid sender email** is verified in SendGrid dashboard
5. **Test email sending** and check both inbox and spam folder

---

**Last Updated:** December 2025

