# Subscription UX Architecture

**Approach:** TDD + ISP (Interface Segregation Principle)  
**Goal:** Working product with minimal complexity  
**Principle:** Each interface does ONE thing well

---

## Current State

### Pricing Tiers (Source of Truth: `lib/subscriptions.ts`)

| Plan | Price | Registration Limit |
|------|-------|-------------------|
| Free | $0/mo | 100 |
| Standard | $19/mo | 5,000 |
| Enterprise | $99/mo | 50,000 |

### Working Features ✅
- Payment gateway (Square)
- Coupon system (FREE100, WELCOME50, etc.)
- Subscription creation
- Dashboard subscription display

### Missing Features (Priority Order)

---

## Phase 1: Limit Enforcement (Critical)

### 1.1 Interface: `IUsageLimitChecker`

**Purpose:** Single responsibility - check if action is allowed

```typescript
// lib/interfaces/IUsageLimitChecker.ts
export interface UsageLimitResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  message?: string; // Only when not allowed
}

export interface IUsageLimitChecker {
  canRegister(organizationId: string): Promise<UsageLimitResult>;
}
```

**Why separate interface?**
- Registration API only needs this ONE method
- Doesn't need full subscription details
- Easy to mock in tests

### 1.2 TDD Spec

```typescript
// lib/services/UsageLimitChecker.test.ts
describe('UsageLimitChecker', () => {
  describe('canRegister', () => {
    it('returns allowed=true when under limit', async () => {
      // Given: org with 50/100 registrations (Free plan)
      // When: canRegister(orgId)
      // Then: { allowed: true, currentCount: 50, limit: 100, remaining: 50 }
    });

    it('returns allowed=false when at limit', async () => {
      // Given: org with 100/100 registrations
      // When: canRegister(orgId)
      // Then: { allowed: false, message: 'Registration limit reached...' }
    });

    it('returns allowed=true for enterprise (50k limit)', async () => {
      // Given: org with 49999 registrations on enterprise
      // When: canRegister(orgId)
      // Then: { allowed: true }
    });

    it('returns allowed=true when no subscription (free tier default)', async () => {
      // Given: org with no subscription record
      // When: canRegister(orgId)
      // Then: Uses free tier limits (100)
    });
  });
});
```

### 1.3 Implementation Points

1. **Registration API** (`app/api/registrations/route.ts`):
```typescript
// Add at top of POST handler
const limitCheck = await usageLimitChecker.canRegister(orgId);
if (!limitCheck.allowed) {
  return NextResponse.json({ 
    success: false, 
    error: 'limit_reached',
    message: limitCheck.message,
    upgradeUrl: '/pricing'
  }, { status: 403 });
}
```

2. **Increment counter after success**:
```typescript
// In RegistrationService.submitRegistration, after insert:
await db.execute({
  sql: `UPDATE subscription_plans 
        SET current_registration_count = current_registration_count + 1 
        WHERE organization_id = ?`,
  args: [organizationId]
});
```

---

## Phase 2: Usage Display (High Priority)

### 2.1 Interface: `IUsageDisplay`

**Purpose:** Get displayable usage info for UI

```typescript
// lib/interfaces/IUsageDisplay.ts
export interface UsageDisplayData {
  currentCount: number;
  limit: number;
  percentage: number;
  planType: 'free' | 'standard' | 'enterprise';
  status: 'ok' | 'warning' | 'critical'; // <80%, 80-95%, >95%
}

export interface IUsageDisplay {
  getUsageDisplay(organizationId: string): Promise<UsageDisplayData>;
}
```

### 2.2 TDD Spec

```typescript
describe('UsageDisplay', () => {
  it('returns ok status when under 80%', async () => {
    // Given: 50/100 registrations
    // Then: status: 'ok', percentage: 50
  });

  it('returns warning status at 80-95%', async () => {
    // Given: 85/100 registrations  
    // Then: status: 'warning', percentage: 85
  });

  it('returns critical status above 95%', async () => {
    // Given: 98/100 registrations
    // Then: status: 'critical', percentage: 98
  });
});
```

### 2.3 UI Component

```tsx
// components/dashboard/UsageBar.tsx
export function UsageBar({ usage }: { usage: UsageDisplayData }) {
  const colors = {
    ok: 'bg-green-500',
    warning: 'bg-yellow-500', 
    critical: 'bg-red-500'
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{usage.currentCount} / {usage.limit} registrations</span>
        <span className="text-gray-500">{usage.percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[usage.status]}`}
          style={{ width: `${Math.min(usage.percentage, 100)}%` }}
        />
      </div>
      {usage.status === 'warning' && (
        <p className="text-sm text-yellow-600">
          ⚠️ Approaching limit - <a href="/pricing" className="underline">Upgrade</a>
        </p>
      )}
      {usage.status === 'critical' && (
        <p className="text-sm text-red-600">
          🚨 Nearly at limit - <a href="/pricing" className="underline">Upgrade now</a>
        </p>
      )}
    </div>
  );
}
```

### 2.4 API Endpoint

```typescript
// GET /api/usage
// Returns: UsageDisplayData
```

---

## Phase 3: Plan Upgrade (Medium Priority)

### 3.1 Interface: `IPlanUpgrade`

```typescript
// lib/interfaces/IPlanUpgrade.ts
export interface UpgradePreview {
  currentPlan: 'free' | 'standard' | 'enterprise';
  targetPlan: 'standard' | 'enterprise';
  proratedAmount: number; // Amount to charge now
  newMonthlyAmount: number;
  effectiveImmediately: boolean;
}

export interface UpgradeResult {
  success: boolean;
  message: string;
  newPlanType?: string;
}

export interface IPlanUpgrade {
  previewUpgrade(organizationId: string, targetPlan: string): Promise<UpgradePreview>;
  executeUpgrade(organizationId: string, targetPlan: string): Promise<UpgradeResult>;
}
```

### 3.2 UX Flow

1. User on dashboard sees "Upgrade" button
2. Click → Modal shows upgrade preview (price diff, new limits)
3. Confirm → Redirect to checkout with `?plan=standard&upgrade=true`
4. Checkout handles prorated billing
5. Success → Update subscription_plans record

### 3.3 TDD Spec

```typescript
describe('PlanUpgrade', () => {
  describe('previewUpgrade', () => {
    it('calculates prorated amount for mid-cycle upgrade', async () => {
      // Given: Free plan, 15 days into 30-day cycle
      // When: preview upgrade to Standard ($19)
      // Then: prorated amount = $9.50 (half month)
    });
  });
  
  describe('executeUpgrade', () => {
    it('updates subscription and increases limit', async () => {
      // Given: org on Free (100 limit)
      // When: upgrade to Standard
      // Then: limit becomes 5000, plan_type = 'standard'
    });
  });
});
```

---

## Phase 4: Subscription Cancellation (Medium Priority)

### 4.1 Interface: `ISubscriptionCancel`

```typescript
// lib/interfaces/ISubscriptionCancel.ts
export interface CancelPreview {
  endDate: string; // When access ends
  refundAmount: number; // Prorated refund (if any)
  registrationsWillBeLost: boolean; // If over free limit
}

export interface CancelResult {
  success: boolean;
  message: string;
  accessUntil: string;
}

export interface ISubscriptionCancel {
  previewCancel(organizationId: string): Promise<CancelPreview>;
  executeCancel(organizationId: string, reason?: string): Promise<CancelResult>;
}
```

### 4.2 UX Flow

1. Settings → Subscription → "Cancel" button
2. Modal: "Your subscription will remain active until [date]. You'll be downgraded to Free (100 limit)."
3. Confirm → Mark subscription as `status: 'canceling'`
4. Keep access until period end
5. Cron job at period end → Set `status: 'canceled'`, switch to Free limits

### 4.3 TDD Spec

```typescript
describe('SubscriptionCancel', () => {
  it('keeps access until period end', async () => {
    // Given: Standard plan, 10 days remaining
    // When: cancel
    // Then: status='canceling', access continues for 10 days
  });
  
  it('warns if registrations exceed free limit', async () => {
    // Given: 3000 registrations on Standard
    // When: preview cancel
    // Then: registrationsWillBeLost = true
  });
});
```

---

## Phase 5: Billing History (Low Priority)

### 5.1 Interface: `IBillingHistory`

```typescript
// lib/interfaces/IBillingHistory.ts
export interface BillingEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  receiptUrl?: string;
}

export interface IBillingHistory {
  getHistory(organizationId: string, limit?: number): Promise<BillingEntry[]>;
}
```

### 5.2 Data Source

Use existing `payment_transactions` table or create lightweight billing_history table.

---

## Implementation Order

| Phase | Feature | Effort | Value | Do First? |
|-------|---------|--------|-------|-----------|
| 1 | Limit Enforcement | 2h | Critical | ✅ |
| 2 | Usage Display | 2h | High | ✅ |
| 3 | Plan Upgrade | 4h | Medium | After 1-2 |
| 4 | Cancellation | 3h | Medium | After 3 |
| 5 | Billing History | 2h | Low | Last |

---

## File Structure (ISP Compliant)

```
lib/
├── interfaces/
│   ├── IUsageLimitChecker.ts    # Phase 1
│   ├── IUsageDisplay.ts          # Phase 2  
│   ├── IPlanUpgrade.ts           # Phase 3
│   ├── ISubscriptionCancel.ts    # Phase 4
│   └── IBillingHistory.ts        # Phase 5
├── services/
│   ├── UsageLimitChecker.ts
│   ├── UsageLimitChecker.test.ts
│   ├── UsageDisplay.ts
│   ├── UsageDisplay.test.ts
│   └── ... (one service per interface)
```

---

## API Endpoints (Minimal)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/usage` | Get usage display data |
| GET | `/api/subscription/upgrade/preview?plan=X` | Preview upgrade |
| POST | `/api/subscription/upgrade` | Execute upgrade |
| GET | `/api/subscription/cancel/preview` | Preview cancel |
| POST | `/api/subscription/cancel` | Execute cancel |
| GET | `/api/billing/history` | Get billing history |

---

## Summary

- **6 small interfaces** (not one giant ISubscriptionService)
- **Each does ONE thing** (ISP)
- **Tests first** (TDD)
- **Minimal UI** (progress bar, modals, simple buttons)
- **No over-engineering** (no webhooks, no Stripe, no complex proration)
