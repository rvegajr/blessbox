# 🔧 Fix SendGrid API Key Issue

## ❌ Problem Identified

The SendGrid API key is returning: **"The provided authorization grant is invalid, expired, or revoked"**

This means the API key needs to be regenerated or verified in SendGrid.

---

## ✅ Solution: Regenerate SendGrid API Key

### Step 1: Go to SendGrid Dashboard

1. Visit: https://app.sendgrid.com
2. Log in to your SendGrid account

### Step 2: Create New API Key

1. Navigate to: **Settings → API Keys**
2. Click **"Create API Key"**
3. **Name:** "BlessBox Production" (or any name)
4. **API Key Permissions:** Select **"Full Access"** or at minimum:
   - ✅ **Mail Send** (required)
   - ✅ **Mail Send - Read** (optional, for activity)
5. Click **"Create & View"**
6. **IMPORTANT:** Copy the API key immediately (you won't see it again!)
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Update in Vercel

1. Go to Vercel Dashboard: https://vercel.com
2. Your Project → **Settings → Environment Variables**
3. Find `SENDGRID_API_KEY`
4. Click on it and **update** with the new API key
5. Make sure it's set for **Production** environment
6. Click **"Save"**

### Step 4: Update Local .env.local (Optional)

If you want to test locally:
```bash
# Edit .env.local
SENDGRID_API_KEY=SG.your-new-api-key-here
```

### Step 5: Redeploy

After updating the API key in Vercel:
- Go to **Deployments** tab
- Click **"Redeploy"** on the latest deployment
- Or push a new commit to trigger deployment

---

## 🧪 Test After Fix

### Test Locally

```bash
# Start dev server
npm run dev

# In another terminal, test email
curl -X POST http://localhost:7777/api/test-email-send \
  -H "Content-Type: application/json" \
  -d '{"email":"rvegajr@darkware.net"}'
```

### Test in Production

After redeploy, test:
1. Go to: https://www.blessbox.org/onboarding/organization-setup
2. Enter your email: `rvegajr@darkware.net`
3. Click "Send Verification Code"
4. Check your email inbox

---

## 🔍 Verify API Key Status

### Check in SendGrid

1. SendGrid Dashboard → **Settings → API Keys**
2. Find your API key
3. Check:
   - ✅ Status is "Active"
   - ✅ Has "Mail Send" permission
   - ✅ Not expired or revoked

### Check via API

```bash
# Test API key directly
curl -X GET https://api.sendgrid.com/v3/user/profile \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

Should return your SendGrid profile if key is valid.

---

## 📋 Quick Checklist

- [ ] Created new API key in SendGrid
- [ ] API key has "Mail Send" permission
- [ ] Updated `SENDGRID_API_KEY` in Vercel Production
- [ ] Redeployed application
- [ ] Tested email sending
- [ ] Verified email received

---

## 🚨 If Still Not Working

1. **Check SendGrid Account Status:**
   - Account not suspended
   - Billing is current (if required)
   - Not hitting rate limits

2. **Verify Sender Email:**
   - `contact@yolovibecodebootcamp.com` is verified ✅ (You have this!)

3. **Check Vercel Logs:**
   - Look for detailed error messages
   - Check if API key is being read correctly

4. **Test API Key Directly:**
   - Use curl command above to test key validity
   - Verify key works outside of application

---

**Last Updated:** December 2025

