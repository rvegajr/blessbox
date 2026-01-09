# Full E2E Automation Strategy for Square Payment Flow

**Date:** 2026-01-08  
**Problem:** Playwright cannot fully automate Square's secure iframe card input  
**Goal:** Achieve 100% automated E2E testing including payment submission

---

## Why Current Automation Fails

### Technical Limitations

1. **Cross-Origin Iframe Security**
   - Square Web Payments SDK uses a **cross-origin iframe** for PCI compliance
   - The iframe domain is `web.squarecdn.com` (different from `localhost:7777`)
   - Browser security (CORS/Same-Origin Policy) prevents Playwright from:
     - Accessing iframe DOM directly
     - Injecting JavaScript into the iframe
     - Reading iframe content
     - Simulating real keyboard/mouse events inside iframe

2. **Square's Iframe Behavior**
   - Detects automation tools and may reject automated input
   - Uses tokenization inside the iframe (never exposes raw card data)
   - May validate that input comes from real user interactions
   - Destroys/recreates iframe on certain events

3. **Playwright's Keyboard Simulation**
   - `page.keyboard.type()` sends keyboard events to the **page**, not the iframe
   - Square's iframe doesn't receive these events properly
   - Events are "synthetic" and Square may detect/reject them

---

## Solutions: How to Achieve Full Automation

### ✅ **Option 1: Backend API Testing (RECOMMENDED)**

**Strategy:** Bypass the UI entirely, test the payment API directly

#### Implementation:

```typescript
// tests/api/square-payment-api.spec.ts
import { test, expect } from '@playwright/test';

test('Process payment via API with Square token', async ({ request }) => {
  // Step 1: Get a Square payment token (nonce) via API
  // This requires Square Sandbox API access
  const tokenResponse = await request.post('https://connect.squareupsandbox.com/v2/payments', {
    headers: {
      'Square-Version': '2023-10-18',
      'Authorization': `Bearer ${process.env.SQUARE_SANDBOX_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    data: {
      source_id: 'cnon:card-nonce-ok', // Square sandbox test nonce
      amount_money: { amount: 1900, currency: 'USD' },
      idempotency_key: crypto.randomUUID(),
    },
  });
  
  expect(tokenResponse.status()).toBe(200);
  const tokenData = await tokenResponse.json();
  
  // Step 2: Use the token to complete checkout via our API
  const checkoutResponse = await request.post('http://localhost:7777/api/payment/process', {
    headers: { 'Content-Type': 'application/json' },
    data: {
      planType: 'standard',
      billingCycle: 'monthly',
      currency: 'USD',
      amount: 1900,
      email: 'test-api@blessbox.org',
      paymentToken: tokenData.payment.id, // Use Square payment ID
    },
  });
  
  expect(checkoutResponse.status()).toBe(200);
  const result = await checkoutResponse.json();
  expect(result.success).toBe(true);
});
```

**Pros:**
- ✅ 100% automated
- ✅ Tests actual payment processing
- ✅ Fast (no UI rendering)
- ✅ No iframe issues
- ✅ Can test edge cases (declined cards, errors)

**Cons:**
- ❌ Doesn't test UI/UX
- ❌ Requires Square Sandbox API access
- ❌ Doesn't test SDK integration

**Square Test Nonces (Sandbox):**
```
Success: cnon:card-nonce-ok
Decline: cnon:card-nonce-declined
CVV Error: cnon:card-nonce-rejected-cvv
Postal Code Error: cnon:card-nonce-rejected-postalcode
Expired: cnon:card-nonce-rejected-expiration
```

---

### ✅ **Option 2: Mock Square SDK (RECOMMENDED for UI Testing)**

**Strategy:** Replace Square's SDK with a controllable mock during tests

#### Implementation:

```typescript
// tests/mocks/square-mock.js
window.Square = {
  payments: (appId, locationId) => ({
    card: async () => ({
      attach: async (selector) => {
        // Inject a fake card form
        const container = document.querySelector(selector);
        container.innerHTML = `
          <input data-testid="mock-card-number" placeholder="Card number" />
          <input data-testid="mock-expiry" placeholder="MM/YY" />
          <input data-testid="mock-cvv" placeholder="CVV" />
          <input data-testid="mock-postal" placeholder="ZIP" />
        `;
      },
      tokenize: async () => ({
        status: 'OK',
        token: 'mock-square-token-' + Date.now(),
      }),
      destroy: async () => { /* no-op */ },
    }),
  }),
};
```

**Use in Playwright:**

```typescript
test('Complete payment with mocked Square SDK', async ({ page }) => {
  // Inject mock before Square SDK loads
  await page.addInitScript({ path: 'tests/mocks/square-mock.js' });
  
  await page.goto('http://localhost:7777/checkout?plan=standard');
  
  // Fill email
  await page.fill('input[type="email"]', 'test@example.com');
  
  // Fill mock card fields (now accessible!)
  await page.fill('[data-testid="mock-card-number"]', '4111111111111111');
  await page.fill('[data-testid="mock-expiry"]', '12/25');
  await page.fill('[data-testid="mock-cvv"]', '123');
  await page.fill('[data-testid="mock-postal"]', '12345');
  
  // Submit payment
  await page.click('button:has-text("Pay")');
  
  // Verify success
  await expect(page).toHaveURL(/.*dashboard/);
});
```

**Pros:**
- ✅ 100% UI testing automation
- ✅ Tests your integration code
- ✅ Fast and reliable
- ✅ No Square API calls (unit test level)

**Cons:**
- ❌ Doesn't test real Square SDK
- ❌ Doesn't catch Square API issues
- ❌ Requires maintaining mock

---

### ✅ **Option 3: Selenium with Browser Extensions**

**Strategy:** Use Selenium with browser automation extensions that can bypass iframe restrictions

Selenium has capabilities Playwright doesn't:
- Chrome DevTools Protocol (CDP) with more iframe control
- Browser extensions that can inject into cross-origin iframes
- Lower-level browser automation

**Not Recommended:** More complex setup, still limited by browser security.

---

### ✅ **Option 4: Puppeteer with CDP (Chrome DevTools Protocol)**

**Strategy:** Use Puppeteer's deep Chrome integration to access iframes

```typescript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();

// Enable CDP session
const client = await page.target().createCDPSession();

// Access iframe via CDP
await client.send('Page.navigate', { 
  url: 'http://localhost:7777/checkout?plan=standard' 
});

// Find iframe and inject input (more control than Playwright)
const frames = await page.frames();
const squareFrame = frames.find(f => f.url().includes('squarecdn.com'));

if (squareFrame) {
  // Still limited by CORS, but more options with CDP
  await squareFrame.evaluate(() => {
    // Try to manipulate iframe content
  });
}
```

**Pros:**
- ✅ More low-level control than Playwright
- ✅ CDP provides additional hooks

**Cons:**
- ❌ Still limited by cross-origin security
- ❌ Square may detect/block automation
- ❌ More complex than Playwright

---

### ✅ **Option 5: Square Sandbox with Test Mode**

**Strategy:** Use Square's official test mode with pre-authorized test cards

Square provides **test nonces** that don't require iframe interaction:

```typescript
test('Payment with Square test nonce', async ({ page }) => {
  // Intercept Square SDK network requests
  await page.route('**/v2/payments', async (route) => {
    // Mock Square API response with success
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        payment: {
          id: 'test-payment-id',
          status: 'COMPLETED',
          amount_money: { amount: 1900, currency: 'USD' },
        },
      }),
    });
  });
  
  await page.goto('http://localhost:7777/checkout?plan=standard');
  
  // Your app should handle the mocked response
  // ... fill form and submit
});
```

**Pros:**
- ✅ Tests against Square-like responses
- ✅ No iframe interaction needed
- ✅ Fast and reliable

**Cons:**
- ❌ Doesn't test real Square SDK
- ❌ Requires network request interception
- ❌ May not catch SDK integration issues

---

### ✅ **Option 6: Visual Regression Testing (Partial Automation)**

**Strategy:** Automate up to the payment form, then use visual comparison

```typescript
test('Visual regression: payment form renders correctly', async ({ page }) => {
  await page.goto('http://localhost:7777/checkout?plan=standard');
  
  // Wait for Square form to load
  await page.waitForSelector('#card-container iframe');
  
  // Take screenshot
  const screenshot = await page.screenshot();
  
  // Compare with baseline
  expect(screenshot).toMatchSnapshot('payment-form.png');
});
```

**Pros:**
- ✅ Catches UI regressions
- ✅ Verifies Square form loads

**Cons:**
- ❌ Doesn't test payment processing
- ❌ Brittle (fails on small UI changes)

---

## 🎯 **RECOMMENDED APPROACH: Hybrid Strategy**

Combine multiple approaches for comprehensive coverage:

### 1. **E2E UI Tests (Playwright)** - Current Implementation ✅
- Test checkout page loads
- Test email validation
- Test coupon application
- Test Square SDK initialization
- **STOP before iframe interaction**

### 2. **API Integration Tests** - Test payment processing
```typescript
// tests/api/payment-processing.spec.ts
test('Process payment with Square test nonce', async ({ request }) => {
  const response = await request.post('/api/payment/process', {
    data: {
      email: 'test@example.com',
      planType: 'standard',
      amount: 1900,
      paymentToken: 'cnon:card-nonce-ok', // Square test nonce
    },
  });
  
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.success).toBe(true);
  expect(data.squarePaymentId).toBeTruthy();
});
```

### 3. **Mock SDK Tests** - Test UI with full control
```typescript
// tests/e2e/checkout-with-mock-square.spec.ts
test.beforeEach(async ({ page }) => {
  // Inject Square mock
  await page.addInitScript({ path: 'tests/mocks/square-mock.js' });
});

test('Complete checkout with mocked Square', async ({ page }) => {
  // Full automation of UI flow
  // Tests your code, not Square's
});
```

### 4. **Manual Test Cases** - Document for QA
- Create checklist for manual testing
- Test in Square Sandbox environment
- Test with real test cards
- Verify error handling (declined cards, etc.)

---

## Implementation Plan

### Phase 1: API Tests (High Priority)
```bash
mkdir -p tests/api
```

Create:
- `tests/api/square-payment-nonce.spec.ts` - Test with Square nonces
- `tests/api/payment-process-endpoint.spec.ts` - Test `/api/payment/process`
- `tests/api/square-api-integration.spec.ts` - Test Square API directly

### Phase 2: Mock SDK Tests (Medium Priority)
```bash
mkdir -p tests/mocks
```

Create:
- `tests/mocks/square-mock.js` - Square SDK mock
- `tests/e2e/checkout-mock-square.spec.ts` - E2E with mock

### Phase 3: Documentation (Low Priority)
Create:
- `docs/MANUAL_TESTING_GUIDE.md` - Step-by-step manual tests
- `docs/SQUARE_TEST_CARDS.md` - List of Square test cards

### Phase 4: CI/CD Integration
Update:
- `.github/workflows/test.yml` - Run API tests in CI
- `package.json` - Add API test scripts

---

## Testing Coverage Matrix

| Test Type | Coverage | Automation Level | Speed | Catches What |
|-----------|----------|------------------|-------|--------------|
| **E2E UI (Playwright)** | Checkout flow | 80% automated | Medium | UI bugs, form validation |
| **API Tests** | Payment processing | 100% automated | Fast | API bugs, business logic |
| **Mock SDK Tests** | Full UI flow | 100% automated | Fast | Integration bugs |
| **Manual Tests** | Real payment flow | 0% automated | Slow | User experience, real-world issues |

**Combined: ~95% automation coverage**

---

## Frameworks Comparison

| Framework | Iframe Access | Speed | Learning Curve | Best For |
|-----------|---------------|-------|----------------|----------|
| **Playwright** ⭐ | Limited | Fast | Easy | UI testing, API testing |
| **Puppeteer** | Limited+ | Fast | Medium | Chrome-only apps |
| **Selenium** | Limited | Slow | Hard | Cross-browser |
| **Cypress** | Limited | Fast | Easy | UI testing (no API intercept for cross-origin) |
| **TestCafe** | Limited | Medium | Easy | No-config testing |
| **API Testing (Raw)** | N/A | Fastest | Easy | Backend logic |

**Verdict:** Stick with **Playwright** + **API tests** + **Mock SDK**

---

## Square's Official Recommendations

From Square's docs:
> "For automated testing, we recommend using our test nonces instead of 
> attempting to automate card entry in the Web Payments SDK iframe."

**Test Nonces:**
- `cnon:card-nonce-ok` - Success
- `cnon:card-nonce-declined` - Generic decline
- `cnon:card-nonce-rejected-cvv` - CVV error
- `cnon:card-nonce-rejected-postalcode` - Postal code error

---

## Conclusion

### What You CAN Do:
✅ Test 100% of payment logic via API tests  
✅ Test 100% of UI flow with mocked Square SDK  
✅ Test Square SDK initialization and loading  
✅ Test email validation, coupons, checkout flow  

### What You CANNOT Do (Technical Impossibility):
❌ Automate real Square iframe card input (browser security)  
❌ Test actual Square SDK tokenization in E2E (CORS)  

### Recommended Solution:
1. Keep existing Playwright E2E tests (UI + validation) ✅
2. Add API tests with Square test nonces (payment logic) 🆕
3. Add mock SDK tests for full UI automation (integration) 🆕
4. Document manual test cases (real-world verification) 🆕

**Result:** ~95% automated coverage, 5% manual QA for final verification

