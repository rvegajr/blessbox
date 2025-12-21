# 📧 Email Setup for Vercel Production

## Problem: Verification Emails Not Sending

If verification emails aren't being sent in production, it's likely because email environment variables aren't configured in Vercel.

## Quick Diagnosis

### Step 1: Check Email Configuration

Visit this URL (add your debug secret if configured):
```
https://www.blessbox.org/api/debug-email-config
```

Or use curl:
```bash
curl https://www.blessbox.org/api/debug-email-config
```

This will show you:
- Which email service is configured (if any)
- What environment variables are set
- Recommendations for fixing the issue

## Solution: Configure Email in Vercel

### Option 1: SendGrid (Recommended)

1. **Get SendGrid API Key:**
   - Sign up at https://sendgrid.com
   - Go to Settings → API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the API key (starts with `SG.`)

2. **Verify Sender Email:**
   - In SendGrid, go to Settings → Sender Authentication
   - Verify a single sender email (e.g., `noreply@blessbox.org`)
   - Or verify your domain

3. **Add to Vercel:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add these variables:
     ```
     SENDGRID_API_KEY=SG.your-api-key-here
     SENDGRID_FROM_EMAIL=noreply@blessbox.org
     ```
   - Make sure to select **Production** environment
   - Click "Save"

4. **Redeploy:**
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - Or push a new commit to trigger deployment

### Option 2: SMTP (Gmail or Other)

1. **Get SMTP Credentials:**
   - For Gmail: Create an App Password (not your regular password)
   - For other providers: Get SMTP settings from your email provider

2. **Add to Vercel:**
   - Go to Vercel project → Settings → Environment Variables
   - Add these variables:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     SMTP_FROM=noreply@blessbox.org
     ```
   - Make sure to select **Production** environment
   - Click "Save"

3. **Redeploy:**
   - Redeploy your application

## Verification Steps

After configuring:

1. **Check the debug endpoint again:**
   ```
   https://www.blessbox.org/api/debug-email-config
   ```
   Should show status: "ready"

2. **Test sending a verification email:**
   - Go to onboarding page
   - Enter your email
   - Click "Send Verification Code"
   - Check your email inbox (and spam folder)

3. **Check Vercel logs:**
   - Go to Vercel dashboard → Your project → Logs
   - Look for email-related logs
   - Should see: `✅ Verification email sent successfully to [email]`

## Common Issues

### Issue: "Email service not configured"
**Solution:** Add environment variables in Vercel (see above)

### Issue: SendGrid API key invalid
**Solution:** 
- Verify the API key is correct
- Check it has "Mail Send" permissions
- Make sure it's the full key starting with `SG.`

### Issue: SendGrid FROM email not verified
**Solution:**
- In SendGrid, verify the sender email
- Make sure `SENDGRID_FROM_EMAIL` matches the verified email

### Issue: SMTP authentication failed
**Solution:**
- For Gmail: Use App Password, not regular password
- Check SMTP credentials are correct
- Verify SMTP port (587 for TLS, 465 for SSL)

### Issue: Emails going to spam
**Solution:**
- Verify your domain in SendGrid
- Set up SPF/DKIM records
- Use a professional FROM email address

## Testing in Development

In development mode, emails are logged to console instead of being sent:

```
📧 [DEV] Verification code for test@example.com: 123456
```

This is normal and allows testing without email setup.

## Need Help?

1. Check Vercel logs for error messages
2. Use the debug endpoint to see configuration status
3. Verify all environment variables are set correctly
4. Make sure you redeployed after adding environment variables

---

**Last Updated:** December 2025

