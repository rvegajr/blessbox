# 🔑 Update SendGrid API Key in Vercel

## New API Key

**New SendGrid API Key:**
```
[API key has been set in Vercel - check Vercel dashboard for the value]
```

---

## ✅ Steps to Update in Vercel

### Option 1: Via Vercel Dashboard (Easiest)

1. Go to: https://vercel.com
2. Select your **bless-box** project
3. Go to: **Settings → Environment Variables**
4. Find `SENDGRID_API_KEY`
5. Click on it to edit
6. **Update the value** with the new API key (check Vercel dashboard or ask team lead for the key)
7. Make sure it's set for **Production** environment
8. Click **"Save"**

### Option 2: Via Vercel CLI

```bash
# Update Production environment
# Replace YOUR_API_KEY with the actual API key
echo "YOUR_API_KEY" | vercel env add SENDGRID_API_KEY production

# Also update Preview and Development if needed
echo "YOUR_API_KEY" | vercel env add SENDGRID_API_KEY preview
echo "YOUR_API_KEY" | vercel env add SENDGRID_API_KEY development
```

---

## 🚀 After Updating

### Step 1: Redeploy

After updating the environment variable:
- Go to **Deployments** tab
- Click **"Redeploy"** on the latest deployment
- Or push a new commit to trigger automatic deployment

### Step 2: Test

1. Go to: https://www.blessbox.org/onboarding/organization-setup
2. Enter email: `rvegajr@darkware.net`
3. Click "Send Verification Code"
4. Check your email inbox!

### Step 3: Verify

Check Vercel logs for:
- ✅ `Verification email sent successfully to rvegajr@darkware.net`
- ✅ `SendGrid email sent to rvegajr@darkware.net, status: 202`

---

## ✅ Local Testing

The `.env.local` file has been updated. You can test locally:

```bash
npm run dev

# In another terminal
curl -X POST http://localhost:7777/api/test-email-send \
  -H "Content-Type: application/json" \
  -d '{"email":"rvegajr@darkware.net"}'
```

---

**Last Updated:** December 2025

