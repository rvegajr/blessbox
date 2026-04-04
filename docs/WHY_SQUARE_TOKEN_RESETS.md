# Why Does Square Token Keep Resetting/Failing?

**Issue:** "Why does it keep on resetting?"  
**Context:** Square access token works briefly then fails  
**Date:** January 8, 2026

---

## 🔍 Possible Reasons for Token "Resetting"

### Reason 1: Token Never Actually Saved in Vercel ⭐ MOST LIKELY

**Symptom:**
- You update SQUARE_ACCESS_TOKEN in Vercel
- Click Save
- Page refreshes
- Token appears to be set
- BUT it's actually not saved or reverts

**Causes:**
- Clicked "Cancel" instead of "Save"
- Browser lost connection during save
- Vercel UI glitch
- Environment not selected properly (Dev vs Preview vs Production)

**How to verify:**
1. Go to Vercel → bless-box → Settings → Environment Variables
2. Find SQUARE_ACCESS_TOKEN
3. Check "Last updated" timestamp
4. Click "Edit" and verify the actual value
5. Make sure it shows the correct token

**Fix:**
- Re-save the token in Vercel
- Wait for "Saved" confirmation
- Verify "Last updated" timestamp changes
- Trigger manual redeploy

---

### Reason 2: Multiple Environment Variables Conflicting

**Symptom:**
- Token works locally
- Fails in production
- Keeps reverting to old value

**Causes:**
- Token set in Development but not Production
- Token set in Preview but not Production
- Old token in Production environment overriding

**Vercel has 3 separate environments:**
- Development (local dev with `vercel dev`)
- Preview (branch deploys)
- **Production** (main branch deploys)

**How to verify:**
1. In Vercel env vars, each variable shows which environments it's in
2. Check if SQUARE_ACCESS_TOKEN shows "Production" checkbox
3. If only "Development" is checked, production won't have it

**Fix:**
- Edit SQUARE_ACCESS_TOKEN
- Check ✅ Production checkbox
- Save
- Redeploy

---

### Reason 3: Token Has Expiration Date

**Symptom:**
- Token works for days/weeks
- Suddenly stops working
- Need to regenerate periodically

**Square Access Tokens:**
- Personal access tokens: **No expiration** (should work indefinitely)
- OAuth tokens: **Can expire** (30-90 days)
- Revoked tokens: **Immediate failure** (if regenerated in Square Dashboard)

**How to check:**
1. Go to Square Dashboard → Developer → Applications
2. Check if token type is "Personal Access Token" or "OAuth"
3. Look for expiration date
4. Check if token was revoked/regenerated

**Fix:**
- Use Personal Access Tokens (don't expire)
- If using OAuth, implement refresh token flow
- Don't regenerate token (invalidates old one)

---

### Reason 4: Square Account Issue

**Symptom:**
- Token format correct
- Token saved correctly
- Still gets 401 errors

**Possible Issues:**
- Square account suspended
- Payment processing disabled
- Account under review
- Region restrictions
- API access revoked

**How to check:**
1. Login to Square Dashboard
2. Check for any alerts/warnings
3. Verify account status is "Active"
4. Check if payments are enabled
5. Look for any restrictions

---

### Reason 5: Token Permissions Changed

**Symptom:**
- Token worked before
- Now returns 401 or 403
- Nothing changed on your end

**What happened:**
- Square application settings changed
- Permissions were modified
- Token was regenerated (old one revoked)
- Someone else regenerated token

**How to check:**
1. Square Dashboard → Applications
2. Check application permissions
3. Verify PAYMENTS_WRITE is enabled
4. Check if token was recently regenerated

**Fix:**
- Ensure application has correct permissions
- Generate NEW token (old one may be revoked)
- Update Vercel with new token

---

### Reason 6: Vercel Deployment Overwrites

**Symptom:**
- Update token in Vercel
- Works briefly
- Next deployment breaks it

**Possible causes:**
- `.env.production.local` in git (bad practice)
- Vercel CLI deployment overrides web UI settings
- Multiple people deploying with different env files

**How to check:**
```bash
# Check if .env files are in git (they shouldn't be)
git ls-files | grep "\.env"

# Should only show:
# .env.example (safe)
# NOT .env.local or .env.production.local
```

**Fix:**
- Remove .env files from git
- Set env vars ONLY in Vercel web UI
- Use .env.example for documentation

---

## 🧪 Local Test Script

**File:** `scripts/test-square-token-local.ts`

**Usage:**
```bash
# Test token from .env.local
npx tsx scripts/test-square-token-local.ts

# Or provide token directly
npx tsx scripts/test-square-token-local.ts "YOUR_TOKEN_HERE" "LOCATION_ID"
```

**What it tests:**
1. Token format validation (EAA vs EAAA)
2. Token length and whitespace
3. Square API authentication
4. Location ID verification
5. Payment API permissions
6. Provides detailed diagnostics

---

## 🎯 How to Permanently Fix "Resetting" Issue

### Step 1: Verify Token in Square Dashboard

1. Login to Square Dashboard
2. Go to: **Developer → Applications**
3. Find your application (or create one)
4. Click **Production** tab
5. **Generate new Personal Access Token**
6. **COPY IT IMMEDIATELY** (only shown once)
7. Note the token prefix (should be EAAA for production)

---

### Step 2: Set Token in Vercel (Correctly)

1. Go to Vercel Dashboard
2. Select project: **bless-box**
3. Go to: **Settings → Environment Variables**
4. Find: **SQUARE_ACCESS_TOKEN**
5. Click **Edit** (or Add if missing)
6. **Paste token** (no extra spaces/newlines!)
7. Check **✅ Production** checkbox
8. Click **Save**
9. **Wait for "Saved successfully" message**
10. **Verify "Last updated" timestamp changed**

---

### Step 3: Verify Token Saved

1. Click **Edit** on SQUARE_ACCESS_TOKEN again
2. Verify value matches what you pasted
3. Verify "Production" is checked
4. If wrong, fix and save again

---

### Step 4: Trigger Redeploy

**Option A: Via Vercel UI**
1. Go to Deployments tab
2. Find latest production deployment
3. Click "..." menu
4. Select "Redeploy"

**Option B: Via Git**
```bash
git commit --allow-empty -m "redeploy: trigger rebuild with new Square token"
git push origin main
```

---

### Step 5: Test Locally First

```bash
# Set token in .env.local
echo "SQUARE_ACCESS_TOKEN=YOUR_NEW_TOKEN" >> .env.local
echo "SQUARE_LOCATION_ID=YOUR_LOCATION_ID" >> .env.local
echo "SQUARE_ENVIRONMENT=production" >> .env.local

# Test token
npx tsx scripts/test-square-token-local.ts

# If successful, update Vercel
```

---

### Step 6: Verify in Production

After Vercel deployment completes:

```bash
# Run diagnostics
curl -H "Authorization: Bearer YhvE1G1WTwFZCIR8TkoiBPpY2I-N8mRwf1LAMNcynRQ" \
  https://www.blessbox.org/api/system/payment-diagnostics | jq '.overall'

# Should show:
# "status": "READY"
# "canAcceptPayments": true
```

---

## 🚨 Common Mistakes

### Mistake 1: Copying Token with Extra Spaces

**Problem:**
```
Token copied: "EAAA...xyz "  ← extra space at end
```

**Result:** 401 Unauthorized

**Fix:** Trim token before pasting

---

### Mistake 2: Wrong Environment Checkbox

**Problem:**
- Token set in "Development" only
- Production uses old/missing token

**Result:** Works with `vercel dev`, fails in production

**Fix:** Check "Production" checkbox

---

### Mistake 3: Not Waiting for Deployment

**Problem:**
- Update token in Vercel
- Test immediately
- Still uses old token (deployment not complete)

**Result:** Appears to "reset" because new token not deployed yet

**Fix:** Wait 1-2 minutes for deployment after env var change

---

### Mistake 4: Using Old Token After Regenerating

**Problem:**
- Generate new token in Square Dashboard
- Old token immediately revoked
- Vercel still has old token
- Payments fail

**Result:** "Worked before, now broken"

**Fix:** Update Vercel immediately after generating new token

---

## 📊 Token Lifecycle Management

```
DAY 1: Generate token in Square
  ↓
DAY 1: Save in Vercel (Production)
  ↓
DAY 1-∞: Token works indefinitely (Personal Access Tokens don't expire)
  ↓
  IF you regenerate token in Square:
  ↓
  Old token = IMMEDIATELY REVOKED
  ↓
  Must update Vercel within minutes
  ↓
  Otherwise: All payments fail with 401
```

**Key Insight:** Don't regenerate tokens in Square unless necessary. If you do, update Vercel immediately.

---

## 🎯 Debugging "Keeps Resetting" Issue

### Check 1: Vercel Env Var History

**Question:** Does "Last updated" timestamp match when you think you updated it?

- If NO → Token update didn't save
- If YES → Token is saved, issue is elsewhere

---

### Check 2: Local .env Files in Git

```bash
# Check what's in git
git ls-files | grep "\.env"

# Should be EMPTY or only show .env.example
# If shows .env.local or .env.production.local → PROBLEM
```

**If .env files are in git:**
- They override Vercel settings
- Remove from git: `git rm --cached .env.production.local`
- Add to .gitignore
- Commit and push

---

### Check 3: Multiple Developers

**Question:** Is someone else also updating Square tokens?

- Last person to deploy wins
- Could be overwriting each other's changes
- Coordinate token updates

---

## 📋 Recommended Solution

### Make Token Changes "Stick"

1. **Generate NEW token** in Square Dashboard
2. **Test locally first** (use script above)
3. **Update Vercel** (Production checkbox!)
4. **Screenshot the "Saved" confirmation**
5. **Trigger manual redeploy**
6. **Wait 2 minutes** for deployment
7. **Run diagnostics** to verify
8. **Test payment** on checkout page
9. **Check Square Dashboard** for transaction attempt

---

### Prevent Future "Resets"

- ✅ Never commit .env files to git
- ✅ Only update env vars via Vercel web UI
- ✅ Always check "Production" checkbox
- ✅ Wait for deployment after env var changes
- ✅ Don't regenerate tokens unnecessarily
- ✅ Document token in password manager (not git)

---

## 🎯 Summary

**Why it "keeps resetting":**
- Token likely not saving in Vercel properly
- OR environment checkbox not set to Production
- OR someone regenerating token in Square (revoking old one)

**How to fix permanently:**
1. Generate fresh token in Square
2. Test it locally with script
3. Save in Vercel with Production checked
4. Verify it saved (check timestamp)
5. Redeploy
6. Verify with diagnostics endpoint

**The token itself doesn't "reset" - it's either not being saved correctly in Vercel, or being regenerated in Square (which revokes the old one).**

---

**Local test script created:** `scripts/test-square-token-local.ts`

**Run with:** `npx tsx scripts/test-square-token-local.ts YOUR_TOKEN YOUR_LOCATION_ID`

ROLE: engineer STRICT=true


