# Payment Diagnostics - User Guide

**Purpose:** Diagnose why payments are failing  
**Endpoint:** `/api/system/payment-diagnostics`  
**Created:** January 8, 2026

---

## 🎯 How to Use Payment Diagnostics

### Step 1: Get Your DIAGNOSTICS_SECRET

**Location:** Vercel Dashboard → Settings → Environment Variables

**Find the variable:** `DIAGNOSTICS_SECRET`

**Copy the value** (you'll need it for the API call)

---

### Step 2: Run Diagnostics

**Command:**
```bash
curl -H "Authorization: Bearer YOUR_DIAGNOSTICS_SECRET_HERE" \
  https://www.blessbox.org/api/system/payment-diagnostics | jq '.'
```

**Replace:** `YOUR_DIAGNOSTICS_SECRET_HERE` with actual secret from Step 1

---

### Step 3: Read the Results

The diagnostics will return JSON with these sections:

#### A. Configuration Section
```json
{
  "configuration": {
    "SQUARE_ACCESS_TOKEN": {
      "present": true,
      "prefix": "EAAA...",
      "masked": "EAAA......3456"
    },
    "SQUARE_APPLICATION_ID": {
      "present": true,
      "value": "sq0idp-...",
      "format": "valid"
    },
    "SQUARE_LOCATION_ID": {
      "present": true,
      "value": "LSWR..."
    }
  }
}
```

**What to check:**
- All `present` should be `true`
- `format` should be `"valid"`
- Token prefix should match environment (EAAA = production, EAA = sandbox)

---

#### B. Connectivity Section
```json
{
  "connectivity": {
    "squareAPI": {
      "success": true,
      "locationsFound": 2,
      "configuredLocationValid": true,
      "configuredLocationName": "Main Location"
    }
  }
}
```

**What to check:**
- `success` should be `true`
- `configuredLocationValid` should be `true`
- If `false`, the location ID is wrong

---

#### C. Overall Status
```json
{
  "overall": {
    "status": "READY",
    "canAcceptPayments": true,
    "configurationComplete": true
  }
}
```

**What you want to see:**
- ✅ `"status": "READY"`
- ✅ `"canAcceptPayments": true`

**If you see:**
- ❌ `"status": "NOT READY"` → Check recommendations section
- ❌ `"canAcceptPayments": false` → Payment won't work, see why below

---

#### D. Recommendations Section
```json
{
  "recommendations": [
    {
      "severity": "CRITICAL",
      "message": "Square API authentication failed",
      "action": "Verify SQUARE_ACCESS_TOKEN is valid and not expired"
    }
  ]
}
```

**Follow these recommendations to fix issues!**

---

## 🚨 Common Issues & Fixes

### Issue 1: Token Authentication Failed

**Diagnostics shows:**
```json
{
  "connectivity": {
    "squareAPI": {
      "success": false,
      "statusCode": 401
    }
  },
  "recommendations": [{
    "severity": "CRITICAL",
    "message": "Square API authentication failed"
  }]
}
```

**Fix:**
1. Go to Square Dashboard → Developer → Applications
2. Generate new production access token
3. Copy token (should start with EAAA for production)
4. Go to Vercel → Settings → Environment Variables
5. Update `SQUARE_ACCESS_TOKEN` with new value
6. Save and redeploy

---

### Issue 2: Location ID Invalid

**Diagnostics shows:**
```json
{
  "connectivity": {
    "configuredLocationValid": false,
    "locationNames": [
      {"id": "L123", "name": "Store 1", "configured": false},
      {"id": "L456", "name": "Store 2", "configured": false}
    ]
  }
}
```

**Fix:**
1. Look at the `locationNames` array in diagnostics
2. Pick the correct location (usually first one)
3. Copy the `id` value
4. Update `SQUARE_LOCATION_ID` in Vercel
5. Save and redeploy

---

### Issue 3: Environment Mismatch

**Diagnostics shows:**
```json
{
  "recommendations": [{
    "severity": "WARNING",
    "message": "Environment mismatch: production mode with sandbox token"
  }]
}
```

**Fix:**
- If using production token (EAAA...): Set `SQUARE_ENVIRONMENT=production`
- If using sandbox token (EAA...): Set `SQUARE_ENVIRONMENT=sandbox`
- Update in Vercel and redeploy

---

## 📋 Troubleshooting Workflow

```
1. Run payment diagnostics endpoint
   ↓
2. Check "overall.status"
   ├─ "READY" → Payment should work, check frontend errors
   └─ "NOT READY" → Follow recommendations below
       ↓
3. Read "recommendations" array
   ↓
4. Fix issues in order of severity
   ├─ CRITICAL → Must fix (blocks all payments)
   ├─ WARNING → Should fix (may cause intermittent issues)
   └─ INFO → Nice to fix (best practices)
       ↓
5. Update environment variables in Vercel
   ↓
6. Wait for deployment (~1 minute)
   ↓
7. Re-run diagnostics
   ↓
8. Verify "overall.status" = "READY"
   ↓
9. Test actual payment on checkout page
```

---

## 🔬 What the Diagnostics Tests

### 1. Configuration Presence
- Are all required env vars set?
- SQUARE_ACCESS_TOKEN
- SQUARE_APPLICATION_ID
- SQUARE_LOCATION_ID
- SQUARE_ENVIRONMENT

### 2. Format Validation
- Does access token start with EAA/EAAA?
- Does application ID start with sq0idp-?
- Does environment match token type?

### 3. Square API Connectivity
- Can authenticate with Square?
- Can list locations?
- Does configured location exist?

### 4. Overall Readiness
- All checks passed?
- System ready to accept payments?
- Specific issues identified?

---

## 🎯 Expected Diagnostics Output

### If Everything is Working

```json
{
  "timestamp": "2026-01-08T...",
  "overall": {
    "status": "READY",
    "canAcceptPayments": true,
    "configurationComplete": true,
    "formatsValid": true,
    "apiConnectivity": true
  },
  "configuration": {
    "SQUARE_ACCESS_TOKEN": { "present": true, "format": "valid" },
    "SQUARE_APPLICATION_ID": { "present": true, "format": "valid" },
    "SQUARE_LOCATION_ID": { "present": true }
  },
  "connectivity": {
    "squareAPI": {
      "success": true,
      "configuredLocationValid": true
    }
  },
  "recommendations": []
}
```

**This means:** ✅ Payment system is ready, issue is elsewhere (card details, frontend, etc.)

---

### If Token is Invalid

```json
{
  "overall": {
    "status": "NOT READY",
    "canAcceptPayments": false
  },
  "connectivity": {
    "squareAPI": {
      "success": false,
      "error": "Unauthorized",
      "statusCode": 401
    }
  },
  "recommendations": [
    {
      "severity": "CRITICAL",
      "message": "Square API authentication failed",
      "action": "Verify SQUARE_ACCESS_TOKEN is valid and not expired"
    }
  ]
}
```

**This means:** ❌ Token needs to be regenerated in Square Dashboard

---

## 📞 Next Steps

### After Running Diagnostics

**If status = "READY":**
- Square backend is configured correctly
- Issue is likely frontend (browser console errors)
- Or card-specific (try different card)
- Or user error (incorrect card details)

**If status = "NOT READY":**
- Follow recommendations in order of severity
- Fix CRITICAL issues first
- Update environment variables
- Re-run diagnostics to verify fix
- Test payment again

---

## 🔍 Additional Debugging

### Check Browser Console

While on checkout page:
1. Open DevTools (F12)
2. Go to Console tab
3. Try to make payment
4. Look for errors with `[CHECKOUT]` or `[SQUARE]` prefix
5. Screenshot any errors

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try payment
4. Look for `/api/payment/process` request
5. Check response (should show exact error)

---

**Use the payment diagnostics endpoint to identify the exact blocker preventing payments from processing.**

Endpoint deployed: `/api/system/payment-diagnostics`


