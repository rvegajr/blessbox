# Update Square Token in Vercel - Instructions

**Date:** January 9, 2026  
**Status:** ✅ Token validated locally, ready to update in Vercel

---

## ✅ Confirmed Working Token

**Token from `.env.production`:**
```
EAAAlwtff8-YBlj4Hr5AVYfnb-4LbY9k0b8_59Ej5WOyTShOx37iT4w9Nut2PcIW
```

**Local Test Results:**
```
✅ Token authenticates correctly
✅ Payment API accessible
✅ Service initialized
✅ Payment intent created
```

**This token is VALID and ready to use!**

---

## 🎯 Update via Vercel Web UI (Recommended)

### Step 1: Go to Vercel Environment Variables

**URL:** https://vercel.com/rvegajrs-projects/bless-box/settings/environment-variables

---

### Step 2: Find SQUARE_ACCESS_TOKEN

Scroll down to find the `SQUARE_ACCESS_TOKEN` variable.

---

### Step 3: Edit the Variable

1. Click the **"..."** menu button next to SQUARE_ACCESS_TOKEN
2. Click **"Edit"**

---

### Step 4: Paste Clean Token

**Delete the old value completely**

**Paste this exact token:**
```
EAAAlwtff8-YBlj4Hr5AVYfnb-4LbY9k0b8_59Ej5WOyTShOx37iT4w9Nut2PcIW
```

**CRITICAL:**
- ❌ NO quotes
- ❌ NO newlines
- ❌ NO spaces at beginning or end
- ✅ Just the raw 64-character token

---

### Step 5: Verify Environment

**Make sure the checkbox is set:**
- ✅ **Production** (must be checked)
- ⬜ Preview (optional)
- ⬜ Development (optional)

---

### Step 6: Save

1. Click **"Save"** button
2. Wait for **"Saved successfully"** message
3. **Verify the "Last updated" timestamp changed**

---

### Step 7: Verify the Value (Double-Check)

1. Click **"Edit"** again on SQUARE_ACCESS_TOKEN
2. Verify the value shows:
   ```
   EAAAlwtff8-YBlj4Hr5AVYfnb-4LbY9k0b8_59Ej5WOyTShOx37iT4w9Nut2PcIW
   ```
3. Verify "Production" is checked
4. If correct, click "Cancel" (don't save again)

---

### Step 8: Trigger Redeploy

**Option A: Automatic (Recommended)**
- Vercel automatically redeploys when env vars change
- Wait 1-2 minutes for deployment

**Option B: Manual**
1. Go to Deployments tab
2. Find latest deployment
3. Click "..." → "Redeploy"

---

### Step 9: Wait for Deployment

- Monitor deployment status in Vercel
- Should complete in ~1 minute
- Wait additional 2-3 minutes for serverless function refresh

---

### Step 10: Test Payment Diagnostics

```bash
curl -H "Authorization: Bearer YhvE1G1WTwFZCIR8TkoiBPpY2I-N8mRwf1LAMNcynRQ" \
  https://www.blessbox.org/api/system/payment-diagnostics | jq '.overall'
```

**Expected Output:**
```json
{
  "status": "READY",
  "canAcceptPayments": true,
  "configurationComplete": true,
  "formatsValid": true,
  "apiConnectivity": true
}
```

---

### Step 11: Test Actual Payment

1. Go to: https://www.blessbox.org/checkout?plan=standard
2. Enter email
3. Enter card details (use real card or test card if sandbox)
4. Click "Pay $19.00"
5. **Should process successfully!** ✅

---

## 📋 Alternative: Vercel CLI (Non-Interactive)

If you want to use CLI, here's a workaround:

```bash
# Delete old variable (requires 'yes' confirmation)
echo "y" | vercel env rm SQUARE_ACCESS_TOKEN production

# Wait a moment
sleep 2

# Add new variable
echo "EAAAlwtff8-YBlj4Hr5AVYfnb-4LbY9k0b8_59Ej5WOyTShOx37iT4w9Nut2PcIW" | \
  vercel env add SQUARE_ACCESS_TOKEN production
```

**Note:** CLI can be finicky. Web UI is more reliable.

---

## ✅ Verification Checklist

After updating token:

- [ ] Token saved in Vercel (check "Last updated" timestamp)
- [ ] "Production" environment checkbox is checked
- [ ] Token value matches: `EAAAlwtff8-YBlj4Hr5AVYfnb-4LbY9k0b8_59Ej5WOyTShOx37iT4w9Nut2PcIW`
- [ ] No quotes, newlines, or spaces in the value
- [ ] Deployment triggered (automatically or manually)
- [ ] Waited 2-3 minutes for serverless function refresh
- [ ] Payment diagnostics shows "READY"
- [ ] Tested actual payment on checkout page
- [ ] Payment processes successfully

---

## 🎯 Expected Timeline

- **Update token:** 2 minutes
- **Deployment:** 1 minute
- **Serverless refresh:** 2-3 minutes
- **Test and verify:** 2 minutes

**Total:** ~8 minutes from update to working payments

---

## 📊 Current Status

**Local Token:** ✅ Validated and working  
**Token Value:** `EAAAlwtff8-YBlj4Hr5AVYfnb-4LbY9k0b8_59Ej5WOyTShOx37iT4w9Nut2PcIW`  
**Vercel Status:** ⏳ Awaiting update  
**Next Step:** Update in Vercel web UI (easiest method)

**Once updated, environment sanitization utility will ensure newlines/quotes never cause issues again!**


