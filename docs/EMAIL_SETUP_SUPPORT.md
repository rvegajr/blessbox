# 📧 BlessBox Email Setup Guide - Support Email

## Current Status

✅ **Email System:** Working  
❌ **Support Email:** `support@blessbox.org` not configured  
⚠️ **FROM Email:** `noreply@blessbox.org` not verified in SendGrid

---

## Problem

The website links to `support@blessbox.org` for support, but:
1. This email address doesn't exist or isn't monitored
2. It's not verified in SendGrid (can't send FROM it)
3. Users clicking "Contact Support" won't reach you

---

## Solutions

### Option 1: Use Your Personal Email (Quickest)

**Change the support email to your actual email address:**

1. Update `components/ui/GlobalHelpButton.tsx`:
   ```tsx
   href="mailto:your-email@example.com"  // Replace with your real email
   ```

2. **Pros:** Instant, no setup needed
3. **Cons:** Exposes your personal email

---

### Option 2: Set Up Email Forwarding (Recommended)

**Forward `support@blessbox.org` → Your Email**

#### Step 1: Set Up Email Forwarding

**If you own `blessbox.org` domain:**

1. **Go to your domain registrar** (e.g., Namecheap, GoDaddy, Cloudflare)
2. **Set up email forwarding:**
   - Create email alias: `support@blessbox.org`
   - Forward to: `your-email@example.com`

**OR use a service:**
- **Cloudflare Email Routing** (free, if domain on Cloudflare)
- **Google Workspace** (if you have it)
- **Zoho Mail** (free tier available)

#### Step 2: Update Website

No code changes needed - `mailto:support@blessbox.org` will work once forwarding is set up.

---

### Option 3: Verify `support@blessbox.org` in SendGrid (For Sending)

**If you want to SEND emails FROM `support@blessbox.org`:**

1. **Go to SendGrid Dashboard:** https://app.sendgrid.com
2. **Settings → Sender Authentication → Single Sender Verification**
3. **Add New Sender:**
   - Email: `support@blessbox.org`
   - From Name: `BlessBox Support`
   - Reply To: `your-email@example.com`
4. **Verify the email** (check inbox for verification link)
5. **Update Vercel Environment Variable:**
   ```bash
   SENDGRID_FROM_EMAIL=support@blessbox.org
   ```

**Note:** This only allows SENDING emails FROM this address. You still need forwarding to RECEIVE emails.

---

### Option 4: Use Existing Verified Email (Easiest)

**Change support email to `contact@yolovibecodebootcamp.com`:**

1. Update `components/ui/GlobalHelpButton.tsx`:
   ```tsx
   href="mailto:contact@yolovibecodebootcamp.com"
   ```

2. **Pros:** Already verified, works immediately
3. **Cons:** Not a `blessbox.org` address

---

## Recommended Setup

**Best Practice:** Use **Option 2 (Email Forwarding)** + **Option 3 (SendGrid Verification)**

1. **Set up forwarding:** `support@blessbox.org` → `your-email@example.com`
2. **Verify in SendGrid:** So you can send emails FROM `support@blessbox.org`
3. **Update Vercel:** Set `SENDGRID_FROM_EMAIL=support@blessbox.org`
4. **Set Reply-To:** Set `EMAIL_REPLY_TO=your-email@example.com` in Vercel

---

## Testing

After setup, test with:

```bash
# Test email sending
npx tsx scripts/test-blessbox-email.ts your-email@example.com

# Test support link (manual)
# Click "Contact Support" on website and send yourself a test email
```

---

## Current Configuration

| Setting | Value | Status |
|---------|-------|--------|
| **FROM Email (Production)** | `noreply@blessbox.org` | ⚠️ Not verified |
| **FROM Email (Local)** | `contact@yolovibecodebootcamp.com` | ✅ Verified |
| **Support Link** | `support@blessbox.org` | ❌ Not configured |
| **Reply-To** | Not set | ⚠️ Optional |

---

## Quick Fix (Right Now)

**Immediate solution - Update support email to your real email:**

1. Edit `components/ui/GlobalHelpButton.tsx` line 305
2. Change `mailto:support@blessbox.org` to `mailto:your-email@example.com`
3. Deploy

This will work immediately while you set up proper email forwarding.

