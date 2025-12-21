# 📧 Email Troubleshooting Guide

## ✅ Good News: Sender Email is Verified!

Your SendGrid sender email `contact@yolovibecodebootcamp.com` is **verified** in SendGrid. So the issue is likely something else.

---

## 🔍 Diagnostic Steps

### Step 1: Check Current Email Configuration

Visit the debug endpoint:
```
https://www.blessbox.org/api/debug-email-config
```

This will show:
- Which email service is active
- What environment variables are detected
- Any configuration issues

### Step 2: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Request a verification code from the onboarding page
3. Immediately check the logs for:
   - `✅ Verification email sent successfully` (success)
   - `❌ Failed to send verification email` (failure)
   - `❌ SendGrid error:` (SendGrid specific error)
   - Any error messages

### Step 3: Check SendGrid Activity

1. Go to SendGrid Dashboard: https://app.sendgrid.com
2. Navigate to: **Activity → Email Activity**
3. Request a verification code
4. Check if the email appears in SendGrid activity
5. Look for:
   - **Delivered** (email sent successfully)
   - **Bounced** (email bounced)
   - **Blocked** (email blocked)
   - **Dropped** (email dropped by SendGrid)
   - **No activity** (email never reached SendGrid)

---

## 🐛 Common Issues & Fixes

### Issue 1: Email Not Reaching SendGrid

**Symptoms:**
- No activity in SendGrid dashboard
- Error in Vercel logs about SendGrid

**Possible Causes:**
- API key doesn't have "Mail Send" permissions
- API key is incorrect
- Environment variable not set correctly in production

**Fix:**
1. Check SendGrid API key permissions:
   - SendGrid Dashboard → Settings → API Keys
   - Verify key has "Mail Send" permission
2. Verify API key in Vercel:
   - Vercel Dashboard → Settings → Environment Variables
   - Check `SENDGRID_API_KEY` is set for Production
3. Redeploy after any changes

---

### Issue 2: Email Reaching SendGrid But Not Delivered

**Symptoms:**
- Email appears in SendGrid Activity
- Status shows "Dropped", "Bounced", or "Blocked"

**Possible Causes:**
- Recipient email is invalid
- Email going to spam
- SendGrid rate limiting
- Domain reputation issues

**Fix:**
1. Check SendGrid Activity for specific error
2. Verify recipient email address is valid
3. Check spam/junk folder
4. Check SendGrid rate limits (free tier has limits)

---

### Issue 3: Silent Failures (No Errors, No Emails)

**Symptoms:**
- No errors in logs
- No activity in SendGrid
- Code returns success but email never sent

**Possible Causes:**
- Error being caught and ignored
- Environment variable not available at runtime
- Code path not using SendGrid

**Fix:**
1. Check Vercel logs for any warnings
2. Verify environment variables are set for **Production** environment
3. Check if code is using correct email service
4. Look for `console.log` or `console.error` messages

---

### Issue 4: Email Going to Spam

**Symptoms:**
- Email sent successfully
- Not in inbox
- Found in spam/junk folder

**Fix:**
1. Verify domain in SendGrid (better than single sender)
2. Set up SPF/DKIM records
3. Use a professional FROM email
4. Avoid spam trigger words in subject/content

---

## 🧪 Testing Email Sending

### Test 1: Request Verification Code

1. Go to: https://www.blessbox.org/onboarding/organization-setup
2. Enter your email address
3. Click "Send Verification Code"
4. **Immediately:**
   - Check Vercel logs
   - Check SendGrid Activity dashboard
   - Check email inbox (and spam)

### Test 2: Check Debug Endpoint

After redeploying with the latest code:
```
https://www.blessbox.org/api/debug-email-config
```

Should show:
```json
{
  "status": "ready",
  "activeService": "SendGrid",
  "message": "SendGrid is configured and ready"
}
```

### Test 3: Manual API Test

You can test SendGrid directly:
```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer SG.bfOft2bRRRK92R_tSAqmQg.6LHtbuAkiRAWHmQLlfL0Dg27L6U_pP3JRWBJfk_re7I" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{
      "to": [{"email": "your-test-email@example.com"}]
    }],
    "from": {"email": "contact@yolovibecodebootcamp.com"},
    "subject": "Test Email",
    "content": [{
      "type": "text/plain",
      "value": "This is a test email"
    }]
  }'
```

---

## 🔧 Code Improvements Made

The latest code includes:

1. **Better Error Logging:**
   - Logs when email is sent successfully
   - Logs detailed error messages
   - Shows which email service is being used

2. **Debug Endpoint:**
   - `/api/debug-email-config` shows current configuration
   - Helps diagnose configuration issues

3. **Improved Error Handling:**
   - Catches and logs SendGrid-specific errors
   - Shows SendGrid response details
   - Better error messages

---

## 📋 Checklist

Before reporting an issue, check:

- [ ] SendGrid sender email is verified ✅ (You have this!)
- [ ] SendGrid API key has "Mail Send" permissions
- [ ] Environment variables set in Vercel Production
- [ ] Application redeployed after env var changes
- [ ] Checked Vercel logs for errors
- [ ] Checked SendGrid Activity dashboard
- [ ] Checked spam/junk folder
- [ ] Tested with a valid email address
- [ ] Checked debug endpoint for configuration status

---

## 🚀 Next Steps

1. **Redeploy** the application to get the latest email debugging code
2. **Test** by requesting a verification code
3. **Check** Vercel logs immediately after requesting
4. **Check** SendGrid Activity dashboard
5. **Review** the debug endpoint output

If emails still don't send after these steps, the Vercel logs and SendGrid Activity dashboard will show exactly what's happening.

---

**Last Updated:** December 2025

