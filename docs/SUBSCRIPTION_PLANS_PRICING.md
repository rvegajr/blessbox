# BlessBox Subscription Plans & Pricing

**Source:** `lib/subscriptions.ts` and `app/pricing/page.tsx`  
**Last Updated:** January 8, 2026

---

## 📊 Plan Tiers & Registration Limits

| Plan | Price | Registration Limit | Features |
|------|-------|-------------------|----------|
| **Free** | $0/month | **100 registrations** | Basic QR registration system |
| **Standard** | **$19/month** | **5,000 registrations** | Email support, Advanced analytics |
| **Enterprise** | **$99/month** | **50,000 registrations** | Priority support, Custom features |

---

## 💰 Pricing Details

### Free Plan
- **Price:** $0/month (no credit card required)
- **Registration Limit:** 100 total registrations
- **Best For:** Small events, pilot programs, testing
- **Features:**
  - ✅ QR code generation
  - ✅ Registration forms
  - ✅ Basic dashboard
  - ✅ Check-in system
  - ✅ Email notifications

### Standard Plan  
- **Price:** $19/month ($228/year if annual)
- **Registration Limit:** 5,000 registrations per billing period
- **Best For:** Regular events, food banks, community organizations
- **Features:**
  - ✅ Everything in Free
  - ✅ Email support
  - ✅ Advanced analytics
  - ✅ Custom email templates
  - ✅ Export to CSV
  - ✅ Multiple QR entry points

### Enterprise Plan
- **Price:** $99/month ($1,188/year if annual)
- **Registration Limit:** 50,000 registrations per billing period
- **Best For:** Large organizations, multi-location events
- **Features:**
  - ✅ Everything in Standard
  - ✅ Priority support
  - ✅ Custom branding
  - ✅ API access
  - ✅ Dedicated account manager
  - ✅ SLA guarantee

---

## 🔢 Technical Configuration

### Source Code

**File:** `lib/subscriptions.ts`

```typescript
export const planPricingCents: Record<PlanType, number> = {
  free: 0,           // $0.00
  standard: 1900,    // $19.00
  enterprise: 9900,  // $99.00
};

export const planRegistrationLimits: Record<PlanType, number> = {
  free: 100,
  standard: 5000,
  enterprise: 50000,
};
```

### Database Schema

**Table:** `subscription_plans`

**Key Fields:**
- `plan_type`: 'free' | 'standard' | 'enterprise'
- `registration_limit`: Number (based on plan type)
- `current_registration_count`: Running counter
- `amount`: Price in cents
- `currency`: 'USD'
- `billing_cycle`: 'monthly' | 'yearly'
- `status`: 'active' | 'canceling' | 'canceled'

---

## 🎯 Usage Limits & Enforcement

### Registration Limit Enforcement

**Service:** `UsageLimitChecker`  
**Checked at:** Registration submission

**Flow:**
```
1. User submits registration
2. System checks current count vs. limit
3. If under limit: Accept registration, increment counter
4. If at limit: Reject with upgrade message
```

**Code:** `lib/services/UsageLimitChecker.ts`

```typescript
const allowed = currentCount < limit;

if (!allowed) {
  return {
    allowed: false,
    message: `Registration limit reached. Your ${planType} plan allows ${limit} registrations. Please upgrade to continue.`,
    upgradeUrl: '/pricing'
  };
}
```

---

## 📈 Plan Comparison

| Feature | Free | Standard | Enterprise |
|---------|------|----------|------------|
| **Registrations/Month** | 100 | 5,000 | 50,000 |
| **QR Codes** | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Check-In System** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Email Notifications** | ✅ Basic | ✅ Advanced | ✅ Custom |
| **Dashboard Analytics** | ✅ Basic | ✅ Advanced | ✅ Premium |
| **Email Support** | ❌ No | ✅ Yes | ✅ Priority |
| **Custom Branding** | ❌ No | ❌ No | ✅ Yes |
| **API Access** | ❌ No | ❌ No | ✅ Yes |
| **SLA** | ❌ No | ❌ No | ✅ 99.9% |

---

## 🛍️ Upgrade Paths

### From Free → Standard
- **Cost:** $19/month
- **Benefit:** 4,900 more registrations (100 → 5,000)
- **Per Registration:** $0.0038 per additional registration
- **ROI:** Excellent for regular events

### From Standard → Enterprise
- **Cost:** +$80/month ($99 total)
- **Benefit:** 45,000 more registrations (5,000 → 50,000)
- **Per Registration:** $0.0018 per additional registration
- **ROI:** Cost-effective for large organizations

---

## 💳 Payment & Billing

### Payment Processor
- **Provider:** Square
- **Supported Cards:** Visa, MasterCard, American Express, Discover
- **Security:** PCI-DSS compliant
- **Processing:** Real-time

### Billing Cycle
- **Monthly:** Billed on the same date each month
- **Yearly:** Pay upfront, save ~10-15% (if implemented)
- **Prorated:** Upgrades are prorated for current period

### Cancellation
- **Policy:** Cancel anytime
- **Access:** Continues until end of billing period
- **Data:** Retained for 90 days after cancellation
- **Refunds:** Prorated refunds available (contact support)

---

## 🎁 Coupon System

### Available Coupons (for testing/promotions)

| Code | Discount | Valid For |
|------|----------|-----------|
| FREE100 | 100% off | Any plan (makes it free) |
| SAVE20 | $20 off | Standard or Enterprise |
| WELCOME50 | 50% off | First month only |

### How Coupons Work
1. Enter code at checkout
2. System validates (active, not expired, usage limits)
3. Discount applied to total
4. Final amount charged via Square
5. Coupon usage tracked in database

---

## 🔄 Registration Counter

### How It Works

**Incremented When:**
- New registration submitted successfully
- Count updated atomically in database

**Reset When:**
- New billing period starts (monthly/yearly)
- Plan upgraded (inherits current count)
- Manual admin action (rare)

**Displayed:**
- Dashboard usage bar
- Stats cards
- Upgrade prompts

**Formula:**
```
Remaining = Registration Limit - Current Count
Usage % = (Current Count / Registration Limit) × 100
```

---

## 🎯 Plan Selection Guide

### Choose **Free** If:
- Testing the system
- Small pilot program
- < 100 participants expected
- No budget for tools

### Choose **Standard** If:
- Regular weekly/monthly events
- 100-5,000 participants
- Need email support
- Want advanced analytics
- Budget: < $20/month

### Choose **Enterprise** If:
- Multiple locations
- Large-scale events
- > 5,000 participants
- Need custom features
- Want API access
- Require SLA guarantee

---

## 📞 Upgrade Process

### Steps to Upgrade

1. **Click "Upgrade Plan" on dashboard**
2. **Select desired plan (Standard or Enterprise)**
3. **Review pricing and features**
4. **Apply coupon code (optional)**
5. **Enter payment details (Square checkout)**
6. **Submit payment**
7. **Instant upgrade** - New limits apply immediately

### What Happens When You Upgrade

**Immediately:**
- ✅ Registration limit increased
- ✅ New features unlocked
- ✅ Current registrations preserved

**Next Billing Cycle:**
- Charged for new plan
- Limits reset for new period
- Confirmation email sent

---

## 🔐 Free Tier Details

### What You Get for Free

**Core Features:**
- QR code generation (unlimited codes)
- Custom registration forms
- 100 registrations total
- Check-in system
- Email notifications (basic)
- Dashboard analytics (basic)
- Export to CSV

**Limitations:**
- 100 registration cap (hard limit)
- Basic email templates
- Community support only
- No custom branding
- No API access

**Perfect For:**
- Testing the platform
- Small one-time events
- Pilot programs
- Nonprofit evaluation

---

## 💡 Pricing Strategy Notes

### Value Proposition

**Free Plan:**
- Gateway to platform
- No risk trial
- Converts to paid at scale

**Standard Plan ($19/mo):**
- Sweet spot for most users
- $0.0038 per registration (at full capacity)
- Competitive with manual processes

**Enterprise Plan ($99/mo):**
- $0.00198 per registration (at full capacity)
- Massive cost savings for large events
- 18x faster than manual check-in

### ROI Example

**Scenario:** Weekly food distribution, 200 families

**Manual Process:**
- Time: ~10 hours/week manual check-in
- Cost: $15/hour labor = $150/week = $600/month
- Error rate: ~5%

**With BlessBox Standard ($19/month):**
- Time: ~33 minutes/week QR check-in
- Savings: 9.5 hours/week = $570/month
- ROI: 3,000% ($570 saved vs $19 cost)
- Error rate: < 0.1%

---

## 📝 Plan Pricing Source of Truth

**Configuration File:** `lib/subscriptions.ts`

```typescript
export type PlanType = 'free' | 'standard' | 'enterprise';

export const planPricingCents: Record<PlanType, number> = {
  free: 0,
  standard: 1900,    // $19.00
  enterprise: 9900,  // $99.00
};

export const planRegistrationLimits: Record<PlanType, number> = {
  free: 100,
  standard: 5000,
  enterprise: 50000,
};
```

**To Change Pricing:**
1. Update `lib/subscriptions.ts`
2. Update `app/pricing/page.tsx` (UI display)
3. Redeploy to production
4. Existing subscriptions keep their original pricing

---

**Summary:**
- **Free:** $0/mo, 100 registrations
- **Standard:** $19/mo, 5,000 registrations  
- **Enterprise:** $99/mo, 50,000 registrations

All plans include core QR registration and check-in features. Paid plans add support, analytics, and scale.


