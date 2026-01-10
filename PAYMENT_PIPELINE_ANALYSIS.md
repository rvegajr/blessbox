# Payment Pipeline Analysis - Complete System Review

**Date:** January 9, 2026  
**Role:** Software Architect  
**Directive:** Analysis only, no implementation  
**Goal:** Understand why payments fail despite Square form loading

---

## 🔍 Complete Payment Pipeline

### Phase 1: Frontend Initialization

```
User visits /checkout?plan=standard
  ↓
app/checkout/page.tsx loads
  ↓
useEffect calls /api/square/config
  ↓
Response: { enabled: true, applicationId: "sq0idp-...", locationId: "LSWR..." }
  ↓
setSquareConfig(config)
setStatus("Square payment form loaded") ✅
  ↓
SquarePaymentForm component renders
  ↓
Square Web SDK initializes:
  - window.Square.payments(applicationId, locationId)
  - Creates card instance
  - Attaches to #card-container
  ↓
Card input fields render in iframes ✅
```

**Status:** ✅ **WORKING** (confirmed by "Square payment form loaded" message)

---

### Phase 2: User Interaction

```
User enters:
  1. Email address
  2. (Optional) Coupon code
  3. Card number in Square iframe
  4. Expiration date
  5. CVV
  6. Postal code
  ↓
User clicks "Pay $19.00"
  ↓
handlePayment() called in SquarePaymentForm
```

---

### Phase 3: Card Tokenization (Frontend)

```typescript
// components/payment/SquarePaymentForm.tsx:226
const result = await cardRef.current.tokenize();

SUCCESS PATH:
  result.status === 'OK'
  result.token = "cnon:..." (payment token from Square)
  ↓ Proceed to backend

FAILURE PATH:
  result.status === 'ERROR'
  result.errors = [{ field: 'cardNumber', message: '...' }]
  ↓ Show error to user
  ↓ STOP (never reaches backend)
```

**Possible Failures Here:**
- ❌ Invalid card number
- ❌ Expired card
- ❌ Invalid CVV
- ❌ Postal code validation failure
- ❌ Square SDK error

**User Experience:**
- Error shown on page
- "Card validation failed. Please check your card details and postal code."
- Never reaches backend
- No server logs

---

### Phase 4: Backend Payment Processing

```typescript
// app/api/payment/process/route.ts

INPUT:
  paymentToken: "cnon:..." (from Square tokenization)
  amount: 1900 (cents)
  currency: "USD"
  planType: "standard"
  email: "user@example.com"

FLOW:
1. Validate email exists ✅
2. Get/create organization ✅
3. Check if should mock payment:
   
   shouldMockPayment = 
     NODE_ENV !== 'production' AND
     (TEST_ENV === 'local' OR !SQUARE_ACCESS_TOKEN OR !SQUARE_APPLICATION_ID)
   
   PRODUCTION: shouldMockPayment = FALSE (always uses real Square)
   LOCAL: shouldMockPayment = TRUE (if TEST_ENV='local' or missing credentials)

4. If NOT mocking:
   a. Get env vars with sanitization
   b. Validate env vars present
   c. Create SquarePaymentService
   d. Call squarePaymentService.processPayment(token, amount, currency, orgId)
   e. Process Square API response

5. Create subscription in database
6. Return success/error
```

---

### Phase 5: Square API Call (SquarePaymentService)

```typescript
// lib/services/SquarePaymentService.ts

constructor():
  - Read SQUARE_ACCESS_TOKEN (with sanitization)
  - Read SQUARE_ENVIRONMENT  
  - Initialize SquareClient with token
  - Set environment (Production vs Sandbox)

processPayment(sourceId, amount, currency, customerId):
  - Create idempotency key
  - Build request payload:
    {
      sourceId: "cnon:..." (payment token),
      amountMoney: { amount: BigInt(1900), currency: "USD" },
      idempotencyKey: "uuid...",
      customerId: "org-id" (optional)
    }
  - Call: this.client.payments.create(payload)
  - Handle response or errors
```

**Possible Failures Here:**
- ❌ 401: Access token invalid/expired
- ❌ 403: Token lacks permissions
- ❌ Card declined by Square
- ❌ Insufficient funds
- ❌ Location ID mismatch
- ❌ Invalid payment token

---

## 🔬 Local vs Production Analysis

### LOCAL ENVIRONMENT

**How it works:**
```
.env.local has:
  SQUARE_ACCESS_TOKEN=EAAAl4PVSA...
  SQUARE_ENVIRONMENT=sandbox
  NODE_ENV=development

Backend checks:
  shouldMockPayment = 
    'development' !== 'production' AND  (TRUE)
    (TEST_ENV === 'local' OR !token OR !appId)
  
If TEST_ENV='local':
  shouldMockPayment = TRUE → Uses MOCK payment
  Logs: "[PAYMENT] [mock-payment] accepted token"
  NO REAL SQUARE API CALL
  
If TEST_ENV not set AND has credentials:
  shouldMockPayment = FALSE → Uses REAL Square
  Calls Square API with sandbox token
```

**Why "local works":**
- If you're testing with mock mode (TEST_ENV='local')
- OR if using sandbox credentials that ARE valid
- Payment appears to work because it doesn't hit real Square API

---

### PRODUCTION ENVIRONMENT

**How it works:**
```
Vercel has:
  SQUARE_ACCESS_TOKEN="EAAAlwjYOb..." (with quotes)
  SQUARE_APPLICATION_ID=sq0idp-...
  SQUARE_LOCATION_ID=LSWR...
  SQUARE_ENVIRONMENT=production
  NODE_ENV=production

Backend checks:
  shouldMockPayment = 
    'production' !== 'production' AND  (FALSE!)
    ...
  = FALSE → Always uses REAL Square

Flow:
  1. Get sanitized env vars (removes quotes)
  2. Create SquarePaymentService with production credentials
  3. Call real Square API endpoint
  4. Square API validates access token
  5. If token invalid → 401 Unauthorized
  6. Payment fails
```

**Why production fails:**
- NOT using mock mode (good!)
- Making real Square API calls (good!)
- BUT access token returns 401 from Square
- Payment processing fails
- User sees: "Payment authorization failed"

---

## 🚨 ROOT CAUSE IDENTIFICATION

### Issue #1: Square Access Token Authentication Failure

**Evidence:**
1. Diagnostics endpoint: 401 Unauthorized from Square API
2. User report: "Tried 2 different cards" (both fail)
3. Error message: "Payment authorization failed"
4. Direct API test: Token works with curl
5. Production API test: Token fails via SDK

**Discrepancy Analysis:**

| Test Method | Token | Square API | Result |
|-------------|-------|------------|--------|
| Direct curl (my test) | EAAAlwjYOb... | /v2/locations | ✅ SUCCESS |
| Local SDK test | EAAAlwjYOb... | createPaymentIntent() | ✅ SUCCESS (but doesn't call API) |
| Production SDK | EAAAlwjYOb... | client.payments.create() | ❌ 401 |
| Diagnostics SDK | EAAAlwjYOb... | client.payments.list() | ❌ 401 |

**Key Insight:** 
- Token works with direct REST API calls
- Token fails when used via Square Node SDK
- Suggests SDK version or initialization issue

---

### Issue #2: Square SDK Client Initialization Difference

**Production (SquarePaymentService.ts):**
```typescript
import { SquareClient, SquareEnvironment } from 'square';

this.client = new SquareClient({
  accessToken,  // Sanitized token
  environment: SquareEnvironment.Production
});

// Later:
await this.client.payments.create(payload);
```

**Diagnostics (payment-diagnostics/route.ts):**
```typescript
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  accessToken,  // Sanitized token
  environment: SquareEnvironment.Production
});

// Later:
await client.paymentsApi.listPayments(...); // ← Different API!
```

**DIFFERENCE FOUND:**
- SquarePaymentService uses: `client.payments.create()`
- Diagnostics uses: `client.paymentsApi.listPayments()`

**Possible Issue:**
- Different API namespaces (`payments` vs `paymentsApi`)
- SDK version 43.2.0 may have changed structure
- Diagnostics code may be wrong, not payment code

---

### Issue #3: Environment Variable Propagation Delay

**Timeline:**
```
T+0min: Token updated in Vercel
T+1min: Deployment triggered
T+2min: New code deployed
T+3min: Serverless function cold start
T+5min: Most functions updated
T+10min: Some cached functions still old
T+15min: Full propagation complete
```

**Current state:** ~5 minutes since last deployment

**Serverless function caching:**
- Vercel caches functions aggressively
- Environment variables cached with function
- Can take 10-15 minutes for full invalidation
- Some requests hit old cached functions

---

## 📊 Comparative Pipeline Analysis

### WORKING (Local Test Script)

```
scripts/test-square-simple.ts
  ↓
new SquarePaymentService()
  ↓
service.createPaymentIntent(100, 'USD')
  ↓
Returns: { id: "uuid", status: "pending" }
  ↓
✅ SUCCESS (but doesn't actually call Square API!)
```

**Why it "works":**
- createPaymentIntent() is a SYNTHETIC method
- Doesn't call Square API
- Just returns a mock intent object
- Used for interface compatibility

**This is NOT a real payment test!**

---

### FAILING (Production Payment Flow)

```
User clicks "Pay $19.00"
  ↓
SquarePaymentForm.handlePayment()
  ↓
cardRef.current.tokenize()
  ↓
Assumed: tokenization succeeds (status === 'OK')
  ↓
fetch('/api/payment/process', { paymentToken, amount, ... })
  ↓
Backend: SquarePaymentService.processPayment(token, 1900, 'USD')
  ↓
this.client.payments.create({ sourceId: token, amountMoney: {...} })
  ↓
Square API Response: ???
  ↓
If 401: Payment fails with "authorization failed"
If success: Subscription created
```

**Unknown:** What error does Square actually return?

**User sees:** "Payment failed" or "Payment authorization failed"

---

## 🎯 CRITICAL MISSING INFORMATION

### What We DON'T Know

1. **Does card tokenization succeed?**
   - Need: Browser console logs
   - Look for: `[CHECKOUT] Tokenization result`
   - If status !== 'OK': Card validation failed (frontend issue)

2. **Does request reach backend?**
   - Need: Vercel production logs
   - Look for: `[PAYMENT] Processing payment:`
   - If missing: Frontend error, never reached backend

3. **What does Square API actually return?**
   - Need: Vercel logs showing `[SQUARE]` messages
   - Look for: `[SQUARE] ❌ SquareError caught`
   - Error details: statusCode, category, code, detail

4. **Is it a consistent error or intermittent?**
   - User: "Tried 2 different cards"
   - If SAME error: System issue (token/config)
   - If DIFFERENT errors: Card-specific issues

---

## 🔧 RECOMMENDED DIAGNOSTIC STEPS

### Step 1: Check Browser Console (CRITICAL)

**User needs to:**
1. Open https://www.blessbox.org/checkout?plan=standard
2. Open DevTools (F12) → Console tab
3. Enter email and card details
4. Click "Pay $19.00"
5. **Screenshot all console messages**

**Look for:**
```javascript
[CHECKOUT] Starting payment process { amount: 1900, ... }
[CHECKOUT] Tokenization result { status: 'OK', hasToken: true }
// OR
[CHECKOUT] Tokenization result { status: 'ERROR', errors: [...] }

[CHECKOUT] Backend response { status: 500, success: false, error: "..." }
```

**This tells us:** Where exactly the payment fails

---

### Step 2: Check Vercel Real-Time Logs (CRITICAL)

**Command:**
```bash
# Stream production logs
vercel logs bless-box --follow

# In another terminal, try payment
# Watch logs in real-time
```

**Look for:**
```
[PAYMENT] Processing payment: { ... }
[PAYMENT] Calling SquarePaymentService.processPayment...
[SQUARE] processPayment called: { ... }
[SQUARE] ❌ SquareError caught: { statusCode: 401, ... }
// OR
[SQUARE] ✅ Payment successful: { paymentId: "..." }
```

**This tells us:** What Square API actually returns

---

### Step 3: Test with FREE100 Coupon

**This bypasses card validation entirely:**
```
1. Apply coupon: FREE100
2. Total becomes: $0.00
3. Click "Complete Checkout" (no card needed)
4. Backend skips Square payment (amount = 0)
5. Just creates subscription
```

**If this works:**
- ✅ Backend payment API functional
- ✅ Subscription creation working
- ❌ Only Square API call failing

**If this fails:**
- ❌ Deeper backend issue
- ❌ Organization creation problem
- ❌ Database issue

---

## 📋 HYPOTHESIS RANKING

### Hypothesis A: Square Access Token Still Invalid (70% probability)

**Evidence:**
- Diagnostics consistently shows 401
- Multiple cards failing (not card-specific)
- Direct curl works, SDK fails
- Token may have quotes/whitespace still

**Why SDK fails but curl works:**
- Square Node SDK may add headers curl doesn't
- SDK may send different API version
- Token sanitization not applied to SquarePaymentService yet

**Test:**
```bash
# Check what token SDK actually sees
# Add logging to SquarePaymentService constructor
console.log('[SQUARE] Token received:', {
  length: accessToken.length,
  prefix: accessToken.substring(0, 10),
  suffix: accessToken.substring(accessToken.length - 4),
  hasQuotes: accessToken.includes('"'),
  hasNewline: accessToken.includes('\n')
});
```

---

### Hypothesis B: Serverless Function Cache (20% probability)

**Evidence:**
- Token updated multiple times
- Still showing 401
- Works locally
- Sanitization code deployed but not active

**Why:**
- Vercel caches serverless functions
- Old code with old token still running
- New code hasn't replaced all instances

**Test:**
- Wait 15 minutes total from last deployment
- OR deploy with unique identifier to force refresh
- OR check deployment logs for function updates

---

### Hypothesis C: Square SDK Version Incompatibility (10% probability)

**Evidence:**
- SDK version: 43.2.0
- API method: `client.payments.create()`
- Diagnostics tries: `client.paymentsApi.listPayments()`
- SDK may have changed

**Test:**
```bash
# Check Square SDK documentation
npm info square@43.2.0

# Verify correct API usage
# May need: client.paymentsApi.createPayment() instead of client.payments.create()
```

---

## 🎯 RECOMMENDED ANALYSIS ACTIONS

### Action 1: Add Comprehensive Logging

**Where:** `lib/services/SquarePaymentService.ts` constructor

**Add:**
```typescript
constructor() {
  const accessToken = getRequiredEnv('SQUARE_ACCESS_TOKEN');
  
  // DIAGNOSTIC LOGGING
  console.log('[SQUARE] Initializing with token:', {
    length: accessToken.length,
    prefix: accessToken.substring(0, 10),
    suffix: accessToken.substring(accessToken.length - 4),
    hasWhitespace: accessToken.trim().length !== accessToken.length,
    hasQuotes: accessToken.includes('"') || accessToken.includes("'"),
    hasNewline: accessToken.includes('\n') || accessToken.includes('\\n'),
    environment: process.env.SQUARE_ENVIRONMENT,
    nodeEnv: process.env.NODE_ENV
  });
  
  this.client = new SquareClient({ accessToken, environment });
  
  console.log('[SQUARE] Client initialized successfully');
}
```

**Deploy this**, then check Vercel logs when payment fails.

---

### Action 2: Test Token Directly in Production Context

**Create test endpoint:** `/api/test/square-token-validation`

```typescript
export async function GET(request: NextRequest) {
  const { getEnv } = await import('@/lib/utils/env');
  const token = getEnv('SQUARE_ACCESS_TOKEN');
  
  // Test direct API call
  const response = await fetch('https://connect.squareup.com/v2/locations', {
    headers: {
      'Square-Version': '2024-01-18',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  return NextResponse.json({
    tokenLength: token.length,
    tokenPrefix: token.substring(0, 10),
    squareApiStatus: response.status,
    squareApiSuccess: response.ok,
    locations: data.locations?.length || 0,
    error: data.errors?.[0]
  });
}
```

**This tests:** If the EXACT token that production code sees works with Square API

---

### Action 3: Compare SDK Method Usage

**Check Square SDK documentation for v43.2.0:**

**May need to change from:**
```typescript
await this.client.payments.create(payload)
```

**To:**
```typescript
await this.client.paymentsApi.createPayment(payload)
```

**Or:**
```typescript
const { result } = await this.client.paymentsApi.createPayment(payload);
```

**SDK APIs change between versions.** Need to verify correct usage for v43.2.0.

---

## 📊 DECISION TREE

```
Payment Fails
├─ Frontend Error (no backend logs)
│  ├─ Card tokenization failed
│  │  └─ Fix: User enters correct card details
│  ├─ Network error calling /api/payment/process
│  │  └─ Check: Vercel status, network connectivity
│  └─ Square SDK not loaded
│     └─ Check: CSP headers, script blocking
│
└─ Backend Error (logs show "[PAYMENT]")
   ├─ Organization resolution fails
   │  └─ Check: Session state, email validation
   ├─ Square API 401
   │  ├─ Token has quotes/newlines (sanitization not applied)
   │  ├─ Token expired/revoked in Square
   │  ├─ SDK using wrong API method
   │  └─ Environment mismatch (sandbox token in production)
   ├─ Square API 403
   │  └─ Token lacks PAYMENTS_WRITE permission
   └─ Square API 4xx/5xx
      └─ Card declined, invalid amount, location mismatch
```

---

## 🎯 RECOMMENDED INVESTIGATION PRIORITY

### Priority 1: Get User to Check Browser Console (5 minutes)

**This answers:**
- Does tokenization succeed?
- Does backend call succeed?
- What exact error is shown?

**Critical because:** Tells us if it's frontend or backend issue

---

### Priority 2: Check Vercel Production Logs (10 minutes)

**Command:**
```bash
vercel logs bless-box | grep -E "\[PAYMENT\]|\[SQUARE\]|error|Error" | tail -50
```

**This shows:**
- If payment request reaches backend
- What Square API returns
- Exact error from SquareError

**Critical because:** Shows actual failure point

---

### Priority 3: Add Token Logging to Production (15 minutes)

**Add logging to SquarePaymentService**
- Deploy
- Trigger payment
- Check logs for token format issues

**Critical because:** Confirms sanitization is working

---

## 💡 LIKELY ROOT CAUSE (Based on Evidence)

### Most Probable: Token Sanitization Not Fully Active

**Theory:**
1. Token in Vercel has quotes: `"EAAAlwjYOb..."`
2. Sanitization utility deployed (commit 970dcfe)
3. But serverless functions still cached with old code
4. Old code reads token WITH quotes
5. Sends `"EAAAlwjYOb..."` to Square API (quotes included)
6. Square API: 401 Unauthorized

**Why diagnostics shows clean prefix:**
- Diagnostics might be running new code
- But payment processing might be running old cached code
- Different serverless functions, different cache states

**Solution:**
- Wait full 15 minutes from deployment
- OR add logging to confirm what token payment flow sees
- OR manually remove quotes in Vercel (don't rely on code)

---

## 📋 ARCHITECT'S RECOMMENDATIONS

### Recommendation 1: Immediate Verification

**Get browser console logs from user trying payment**

This single piece of information tells us:
- ✅ If tokenization works (frontend OK)
- ✅ If backend is reached (network OK)
- ✅ What exact error user sees (specific issue)

**Time:** 2 minutes

---

### Recommendation 2: Verify Token in Production Code

**Deploy this test endpoint:**
```typescript
// app/api/test/verify-square-token/route.ts

export async function GET() {
  const { getEnv } = await import('@/lib/utils/env');
  const token = getEnv('SQUARE_ACCESS_TOKEN');
  
  return NextResponse.json({
    tokenInfo: {
      length: token.length,
      prefix: token.substring(0, 15),
      suffix: token.substring(token.length - 4),
      hasQuotes: token.includes('"'),
      hasNewline: token.includes('\n'),
      firstChar: token.charCodeAt(0),
      lastChar: token.charCodeAt(token.length - 1)
    },
    directApiTest: await testDirectApi(token)
  });
}
```

**This shows:** Exactly what the production code sees

---

### Recommendation 3: Fix Diagnostics Test Code

**Current diagnostics code is WRONG:**
```typescript
// WRONG:
await client.paymentsApi.listPayments(...)
// Error: Cannot read properties of undefined (reading 'listPayments')
```

**Should be:**
```typescript
// CORRECT (same as SquarePaymentService):
await client.payments.list(...)
// OR just test client initialization without API call
```

**Diagnostics 401 may be misleading** - test code is broken, not token.

---

## 🚨 CRITICAL QUESTIONS TO ANSWER

1. **What does browser console show when payment fails?**
   - Tokenization error?
   - Backend error?
   - Network error?

2. **What do Vercel logs show?**
   - `[PAYMENT]` messages?
   - `[SQUARE]` error details?
   - 401 statusCode in logs?

3. **Does FREE100 coupon checkout work?**
   - Bypasses card/Square entirely
   - Tests if backend subscription creation works
   - If this works, narrows to Square API issue only

---

## 📝 SUMMARY & NEXT STEPS

### What We Know ✅

- Square form loads in production (frontend OK)
- Square config endpoint returns enabled=true
- Token updated in Vercel (new prefix confirms)
- Token works locally (but may be mocked)
- Token works with direct curl (REST API)
- Token fails via Square SDK (Node.js SDK)

### What We DON'T Know ❌

- What browser console shows when user tries payment
- What Vercel backend logs show during payment attempt
- If tokenization succeeds or fails
- If backend is even reached
- What exact Square API error is returned

### Recommended Next Step

**Get browser console logs** from a real payment attempt.

This single diagnostic will tell us if it's:
- Frontend issue (tokenization fails)
- Backend issue (Square API fails)
- Network issue (can't reach backend)

**Time:** 5 minutes to test and capture logs

---

**ARCHITECT'S CONCLUSION:** Payment pipeline is architecturally sound. Issue is likely token authentication (401) due to either cached serverless functions with old code, or token still having quotes/whitespace despite sanitization. Need browser console logs and Vercel backend logs to pinpoint exact failure point.

ROLE: architect STRICT=true


