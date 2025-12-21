# 🏗️ BlessBox Payment, Coupon & Admin System - Architecture Analysis & Recommendations

**Software Architecture Analysis**  
**Focus**: TDD, ISP, OData, E2E Testing, UX Excellence  
**Status**: Analysis & Recommendations (No Implementation)  
**Date**: October 30, 2025

---

## 📋 EXECUTIVE SUMMARY

This document provides a comprehensive gap analysis and architectural recommendations for completing the BlessBox payment, coupon, and admin management system. The analysis emphasizes:

1. **Test-Driven Development (TDD)**: Write tests first, implementation second
2. **Interface Segregation Principle (ISP)**: Single-responsibility interfaces
3. **OData Integration**: RESTful querying, filtering, and pagination
4. **End-to-End (E2E) Testing**: Complete user journey validation
5. **User Experience (UX)**: Intuitive, responsive, accessible interfaces

---

## 🔍 CURRENT STATE ASSESSMENT

### ✅ What's Implemented (80% Backend, 50% Frontend, 30% Admin)

#### Backend Services (ISP Compliant)
- ✅ `IPaymentProcessor` interface (payment-only contract)
- ✅ Shared payment types in `IPaymentService.ts` (types only; avoids a fat interface)
- ✅ `SquarePaymentService` implementation (real Square integration)
- ✅ `ICouponService` interface (78 lines, comprehensive)
- ✅ `CouponService` implementation (352 lines, full CRUD)
- ✅ Database schemas: `coupons`, `coupon_redemptions` with proper indexes
- ✅ Coupon validation logic (expiry, max uses, plan restrictions)

#### API Endpoints
- ✅ `POST /api/payment/process` - Square payment processing
- ✅ `POST /api/coupons/validate` - Coupon validation
- ✅ `GET /api/admin/subscriptions` - List subscriptions (admin only)
- ✅ `DELETE /api/admin/subscriptions` - Cancel subscription (admin only)

#### Frontend Components
- ✅ `/checkout` page with Square Web Payments SDK
- ✅ `SquarePaymentForm` component (190 lines, PCI compliant)
- ✅ `/pricing` page with plan selection
- ✅ `/admin` page with basic subscription table
- ✅ `/dashboard` page with subscription display

#### Authentication & Authorization
- ✅ NextAuth configuration
- ✅ Super admin role detection (`admin@blessbox.app`)
- ✅ Session-based authentication
- ✅ API route protection

---

## ❌ WHAT'S MISSING - GAP ANALYSIS

### 1. Coupon UI in Checkout (Critical - 0% Complete)

#### Missing Components
- ❌ Coupon input field on checkout page
- ❌ Real-time coupon validation UI feedback
- ❌ Discount calculation display
- ❌ Applied coupon badge/chip
- ❌ Coupon removal functionality
- ❌ Price breakdown (original, discount, final)
- ❌ Coupon error handling with user-friendly messages

#### UX Concerns
- Users have no way to apply coupons during checkout
- No visual feedback on discount savings
- No clear indication of coupon restrictions (plan-specific, expiry)
- Missing "Have a coupon?" prompt/CTA

---

### 2. Admin Coupon Management API (Critical - 0% Complete)

#### Missing Endpoints
- ❌ `GET /api/admin/coupons` - List all coupons with OData filtering
- ❌ `POST /api/admin/coupons` - Create new coupon
- ❌ `GET /api/admin/coupons/:id` - Get coupon details
- ❌ `PATCH /api/admin/coupons/:id` - Update coupon
- ❌ `DELETE /api/admin/coupons/:id` - Deactivate coupon
- ❌ `GET /api/admin/coupons/analytics` - Coupon performance analytics
- ❌ `GET /api/admin/coupons/:id/redemptions` - View coupon redemptions

#### OData Requirements
**Query Parameters Needed**:
- `$filter` - Filter by status, type, expiry, creator
- `$orderby` - Sort by usage, discount, created date
- `$top` / `$skip` - Pagination
- `$select` - Partial field selection
- `$expand` - Include redemption details
- `$count` - Get total count without fetching all

**Example OData Queries**:
```
GET /api/admin/coupons?$filter=active eq true and currentUses lt maxUses
GET /api/admin/coupons?$orderby=currentUses desc&$top=10
GET /api/admin/coupons?$filter=discountType eq 'percentage'&$expand=redemptions
GET /api/admin/coupons?$filter=expiresAt gt 2025-11-01&$count=true
```

---

### 3. Admin Coupon Management UI (Critical - 0% Complete)

#### Missing Pages
- ❌ `/admin/coupons` - Coupon list/management page
- ❌ `/admin/coupons/new` - Create coupon form
- ❌ `/admin/coupons/[id]/edit` - Edit coupon form
- ❌ `/admin/coupons/[id]` - Coupon details/analytics page

#### Missing Components
- ❌ `CouponListTable` - Searchable, filterable table
- ❌ `CouponCreateForm` - Validation-enabled create form
- ❌ `CouponEditForm` - Edit with audit trail
- ❌ `CouponAnalyticsCard` - Usage stats, revenue impact
- ❌ `CouponRedemptionHistory` - Timeline of redemptions
- ❌ `CouponStatusBadge` - Visual status indicators
- ❌ `CouponCodeGenerator` - Auto-generate unique codes

#### UX Concerns
- No way for admins to create/manage coupons
- No visibility into coupon performance
- No search/filter capabilities for large coupon lists
- Missing bulk operations (activate/deactivate multiple)

---

### 4. Enhanced Admin Dashboard (High Priority - 30% Complete)

#### Current State
- Basic subscription listing (email, plan, status, billing)
- Cancel subscription button
- No pagination or filtering
- No analytics or KPIs
- No coupon management section

#### Missing Features
- ❌ Revenue analytics dashboard
- ❌ Subscription trend graphs (MRR, churn, growth)
- ❌ Coupon performance KPIs
- ❌ Top performing coupons widget
- ❌ Recent redemptions feed
- ❌ Plan distribution pie chart
- ❌ Registration count vs limit tracking
- ❌ Export functionality (CSV, Excel)
- ❌ Advanced search and filtering
- ❌ Bulk operations panel

---

### 5. Integration Points (Medium Priority - 0% Complete)

#### Missing Integrations
- ❌ Coupon + Payment flow integration
- ❌ Coupon redemption tracking in payment process
- ❌ Discount application in Square payment intent
- ❌ Webhook handling for subscription status updates
- ❌ Email notifications for coupon usage (user & admin)
- ❌ Audit log for admin actions (coupon CRUD)

---

### 6. Testing Infrastructure (Critical - 20% Complete)

#### Current Test Coverage
- ✅ E2E test skeleton exists (`tests/e2e/blessbox-business-flow.spec.ts`)
- ✅ Basic payment flow structure
- ❌ No coupon-specific tests
- ❌ No admin workflow tests
- ❌ No unit tests for coupon validation edge cases

#### Missing Test Files
- ❌ `tests/unit/coupon-service.spec.ts` - Coupon validation logic
- ❌ `tests/unit/coupon-application.spec.ts` - Discount calculation
- ❌ `tests/unit/payment-with-coupon.spec.ts` - Payment + coupon integration
- ❌ `tests/e2e/checkout-with-coupon.spec.ts` - Full coupon flow
- ❌ `tests/e2e/admin-coupon-management.spec.ts` - Admin CRUD operations
- ❌ `tests/integration/coupon-api.spec.ts` - API endpoint tests
- ❌ `tests/integration/odata-queries.spec.ts` - OData filtering tests

---

## 🎯 RECOMMENDED ARCHITECTURE

### Phase 1: Coupon Checkout UI (Week 1 - Days 1-3)

#### TDD Approach
**Step 1**: Write E2E Test First
```typescript
// tests/e2e/checkout-with-coupon.spec.ts
test('User applies valid coupon during checkout', async ({ page }) => {
  // Navigate to checkout
  await page.goto('/checkout?plan=standard');
  
  // Verify coupon input exists
  await expect(page.getByLabel('Coupon Code')).toBeVisible();
  
  // Apply coupon
  await page.getByLabel('Coupon Code').fill('SAVE25');
  await page.getByRole('button', { name: 'Apply' }).click();
  
  // Verify discount applied
  await expect(page.getByText('25% discount applied')).toBeVisible();
  await expect(page.getByText('$22.49')).toBeVisible(); // $29.99 - 25%
  
  // Complete payment
  await fillCardDetails(page);
  await page.getByRole('button', { name: 'Pay $22.49' }).click();
  
  // Verify success with coupon
  await expect(page.getByText('Payment successful')).toBeVisible();
});

test('User receives error for invalid coupon', async ({ page }) => {
  await page.goto('/checkout?plan=standard');
  
  await page.getByLabel('Coupon Code').fill('INVALID');
  await page.getByRole('button', { name: 'Apply' }).click();
  
  await expect(page.getByText('Coupon not found')).toBeVisible();
  await expect(page.getByText('$29.99')).toBeVisible(); // Original price
});

test('User removes applied coupon', async ({ page }) => {
  await page.goto('/checkout?plan=standard');
  
  await page.getByLabel('Coupon Code').fill('SAVE25');
  await page.getByRole('button', { name: 'Apply' }).click();
  
  await page.getByRole('button', { name: 'Remove coupon' }).click();
  
  await expect(page.getByText('$29.99')).toBeVisible(); // Back to original
});
```

**Step 2**: Create Component Interface
```typescript
// components/checkout/CouponInput.interface.ts
export interface CouponInputProps {
  amount: number;
  planType: string;
  onCouponApplied: (discount: number, code: string) => void;
  onCouponRemoved: () => void;
}

export interface CouponState {
  code: string;
  isValidating: boolean;
  isApplied: boolean;
  discount: number | null;
  error: string | null;
}
```

**Step 3**: Implement Component (TDD - Component Tests)
```typescript
// components/checkout/CouponInput.test.tsx
describe('CouponInput', () => {
  it('validates coupon on apply button click', async () => {
    const onApplied = jest.fn();
    render(<CouponInput amount={2999} planType="standard" onCouponApplied={onApplied} />);
    
    await userEvent.type(screen.getByLabelText('Coupon Code'), 'SAVE25');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    
    await waitFor(() => {
      expect(onApplied).toHaveBeenCalledWith(750, 'SAVE25'); // 25% of $29.99
    });
  });
  
  it('displays error for invalid coupon', async () => {
    render(<CouponInput amount={2999} planType="standard" onCouponApplied={jest.fn()} />);
    
    mockFetch.mockResolvedValueOnce({ valid: false, error: 'Coupon expired' });
    
    await userEvent.type(screen.getByLabelText('Coupon Code'), 'EXPIRED');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    
    await waitFor(() => {
      expect(screen.getByText('Coupon expired')).toBeInTheDocument();
    });
  });
});
```

**Step 4**: Implement Component
```typescript
// components/checkout/CouponInput.tsx
'use client';

import { useState } from 'react';
import type { CouponInputProps, CouponState } from './CouponInput.interface';

export default function CouponInput({ 
  amount, 
  planType, 
  onCouponApplied, 
  onCouponRemoved 
}: CouponInputProps) {
  const [state, setState] = useState<CouponState>({
    code: '',
    isValidating: false,
    isApplied: false,
    discount: null,
    error: null,
  });

  const handleApply = async () => {
    if (!state.code.trim()) return;
    
    setState(prev => ({ ...prev, isValidating: true, error: null }));
    
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: state.code.trim().toUpperCase() }),
      });
      
      const result = await res.json();
      
      if (result.valid) {
        // Calculate discount
        const discount = result.discount.type === 'percentage'
          ? Math.round(amount * (result.discount.value / 100))
          : result.discount.value * 100; // Convert to cents
        
        setState(prev => ({
          ...prev,
          isApplied: true,
          discount,
          isValidating: false,
        }));
        
        onCouponApplied(discount, state.code.trim().toUpperCase());
      } else {
        setState(prev => ({
          ...prev,
          error: result.error || 'Invalid coupon',
          isValidating: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to validate coupon',
        isValidating: false,
      }));
    }
  };

  const handleRemove = () => {
    setState({
      code: '',
      isValidating: false,
      isApplied: false,
      discount: null,
      error: null,
    });
    onCouponRemoved();
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="coupon-input" className="text-sm font-medium text-gray-700">
          Have a coupon code?
        </label>
        {state.isApplied && (
          <button
            onClick={handleRemove}
            className="text-sm text-red-600 hover:text-red-700"
            aria-label="Remove coupon"
          >
            Remove
          </button>
        )}
      </div>

      {!state.isApplied ? (
        <div className="flex gap-2">
          <input
            id="coupon-input"
            type="text"
            value={state.code}
            onChange={(e) => setState(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="Enter code"
            disabled={state.isValidating}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label="Coupon Code"
          />
          <button
            onClick={handleApply}
            disabled={!state.code.trim() || state.isValidating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {state.isValidating ? 'Validating...' : 'Apply'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-900">
                Coupon "{state.code}" applied
              </p>
              <p className="text-xs text-green-700">
                You save ${(state.discount! / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {state.error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}
    </div>
  );
}
```

**Step 5**: Integrate into Checkout Page
```typescript
// app/checkout/page.tsx (modifications)
'use client';

import { useState } from 'react';
import CouponInput from '@/components/checkout/CouponInput';

export default function CheckoutPage() {
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  
  const originalAmount = planPricing[plan];
  const finalAmount = appliedCoupon 
    ? originalAmount - appliedCoupon.discount 
    : originalAmount;

  return (
    <div className="space-y-6">
      {/* Coupon Input */}
      <CouponInput
        amount={originalAmount}
        planType={plan}
        onCouponApplied={(discount, code) => setAppliedCoupon({ code, discount })}
        onCouponRemoved={() => setAppliedCoupon(null)}
      />
      
      {/* Price Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Plan Price:</span>
          <span className="font-medium">${(originalAmount / 100).toFixed(2)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Discount ({appliedCoupon.code}):</span>
            <span className="font-medium text-green-600">
              -${(appliedCoupon.discount / 100).toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total:</span>
          <span className="text-blue-600">${(finalAmount / 100).toFixed(2)}</span>
        </div>
      </div>
      
      {/* Square Payment Form */}
      <SquarePaymentForm
        amount={finalAmount}
        couponCode={appliedCoupon?.code}
        // ... other props
      />
    </div>
  );
}
```

#### Deliverables
1. ✅ `CouponInput` component with full validation
2. ✅ Integrated into checkout page
3. ✅ Real-time coupon validation
4. ✅ Discount display and price breakdown
5. ✅ E2E test coverage for coupon application
6. ✅ Accessible (ARIA labels, keyboard navigation)

---

### Phase 2: Admin Coupon API with OData (Week 1 - Days 4-5)

#### TDD Approach
**Step 1**: Write API Integration Tests First
```typescript
// tests/integration/admin-coupon-api.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('Admin Coupon API', () => {
  let adminToken: string;
  let testCouponId: string;
  
  beforeAll(async () => {
    // Login as admin
    adminToken = await getAdminAuthToken('admin@blessbox.app');
  });

  describe('POST /api/admin/coupons', () => {
    it('creates a new coupon with valid data', async () => {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          code: 'TEST25',
          discountType: 'percentage',
          discountValue: 25,
          maxUses: 100,
          expiresAt: '2025-12-31T23:59:59Z',
          applicablePlans: ['standard', 'enterprise'],
        }),
      });
      
      expect(response.status).toBe(201);
      const coupon = await response.json();
      expect(coupon.code).toBe('TEST25');
      expect(coupon.active).toBe(true);
      testCouponId = coupon.id;
    });
    
    it('returns 403 for non-admin users', async () => {
      const userToken = await getAuthToken('user@example.com');
      
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ code: 'FAIL' }),
      });
      
      expect(response.status).toBe(403);
    });
    
    it('validates coupon code uniqueness', async () => {
      // Try to create duplicate
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          code: 'TEST25', // Duplicate from above
          discountType: 'fixed',
          discountValue: 10,
        }),
      });
      
      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.message).toContain('already exists');
    });
  });

  describe('GET /api/admin/coupons (OData)', () => {
    it('returns all coupons without filters', async () => {
      const response = await fetch('/api/admin/coupons', {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.coupons)).toBe(true);
      expect(data.totalCount).toBeGreaterThan(0);
    });
    
    it('filters by active status ($filter)', async () => {
      const response = await fetch(
        '/api/admin/coupons?$filter=active eq true',
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      const data = await response.json();
      expect(data.coupons.every(c => c.active === true)).toBe(true);
    });
    
    it('sorts by currentUses descending ($orderby)', async () => {
      const response = await fetch(
        '/api/admin/coupons?$orderby=currentUses desc',
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      const data = await response.json();
      const uses = data.coupons.map(c => c.currentUses);
      expect(uses).toEqual([...uses].sort((a, b) => b - a));
    });
    
    it('paginates results ($top and $skip)', async () => {
      const page1 = await fetch(
        '/api/admin/coupons?$top=10&$skip=0',
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      const page2 = await fetch(
        '/api/admin/coupons?$top=10&$skip=10',
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      const data1 = await page1.json();
      const data2 = await page2.json();
      
      expect(data1.coupons).toHaveLength(10);
      expect(data2.coupons).toHaveLength(10);
      expect(data1.coupons[0].id).not.toBe(data2.coupons[0].id);
    });
    
    it('includes count with $count=true', async () => {
      const response = await fetch(
        '/api/admin/coupons?$count=true',
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      const data = await response.json();
      expect(typeof data.totalCount).toBe('number');
      expect(data.totalCount).toBeGreaterThan(0);
    });
    
    it('combines multiple OData operators', async () => {
      const response = await fetch(
        '/api/admin/coupons?' +
        '$filter=active eq true and discountType eq \'percentage\'' +
        '&$orderby=discountValue desc' +
        '&$top=5' +
        '&$count=true',
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      
      const data = await response.json();
      expect(data.coupons).toHaveLength(5);
      expect(data.coupons.every(c => c.active && c.discountType === 'percentage')).toBe(true);
      expect(typeof data.totalCount).toBe('number');
    });
  });

  describe('PATCH /api/admin/coupons/:id', () => {
    it('updates coupon properties', async () => {
      const response = await fetch(`/api/admin/coupons/${testCouponId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          discountValue: 30,
          maxUses: 200,
        }),
      });
      
      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.discountValue).toBe(30);
      expect(updated.maxUses).toBe(200);
    });
    
    it('prevents code modification', async () => {
      const response = await fetch(`/api/admin/coupons/${testCouponId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ code: 'NEWCODE' }),
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/coupons/:id', () => {
    it('soft-deletes (deactivates) coupon', async () => {
      const response = await fetch(`/api/admin/coupons/${testCouponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      
      expect(response.status).toBe(200);
      
      // Verify it's deactivated, not deleted
      const getResponse = await fetch(`/api/admin/coupons/${testCouponId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });
      const coupon = await getResponse.json();
      expect(coupon.active).toBe(false);
    });
  });
});
```

**Step 2**: Define OData Interface
```typescript
// lib/interfaces/IODataParser.ts
export interface ODataQuery {
  filter?: string;
  orderBy?: string;
  top?: number;
  skip?: number;
  count?: boolean;
  select?: string[];
  expand?: string[];
}

export interface ODataResult<T> {
  data: T[];
  totalCount?: number;
  nextLink?: string;
}

export interface IODataParser {
  parse(queryString: string): ODataQuery;
  buildSqlWhere(filter: string): { sql: string; params: any[] };
  buildSqlOrderBy(orderBy: string): string;
}
```

**Step 3**: Implement OData Parser (TDD)
```typescript
// lib/odata/ODataParser.ts
import { IODataParser, ODataQuery } from '../interfaces/IODataParser';

export class ODataParser implements IODataParser {
  parse(queryString: string): ODataQuery {
    const params = new URLSearchParams(queryString);
    
    return {
      filter: params.get('$filter') || undefined,
      orderBy: params.get('$orderby') || undefined,
      top: params.get('$top') ? parseInt(params.get('$top')!, 10) : undefined,
      skip: params.get('$skip') ? parseInt(params.get('$skip')!, 10) : undefined,
      count: params.get('$count') === 'true',
      select: params.get('$select')?.split(',') || undefined,
      expand: params.get('$expand')?.split(',') || undefined,
    };
  }

  buildSqlWhere(filter: string): { sql: string; params: any[] } {
    if (!filter) return { sql: '', params: [] };
    
    // Parse OData filter to SQL WHERE clause
    // Examples:
    //   "active eq true" => "active = ?"
    //   "currentUses lt maxUses" => "current_uses < max_uses"
    //   "discountType eq 'percentage'" => "discount_type = ?"
    
    const conditions: string[] = [];
    const params: any[] = [];
    
    // Simple parser (production needs full OData spec support)
    const tokens = filter.split(/\s+(and|or)\s+/i);
    
    for (const token of tokens) {
      if (token.toLowerCase() === 'and' || token.toLowerCase() === 'or') {
        conditions.push(token.toUpperCase());
        continue;
      }
      
      const match = token.match(/(\w+)\s+(eq|ne|gt|ge|lt|le)\s+(.+)/i);
      if (match) {
        const [, field, op, value] = match;
        const sqlField = this.camelToSnake(field);
        const sqlOp = this.odataOpToSql(op);
        const parsedValue = this.parseValue(value);
        
        conditions.push(`${sqlField} ${sqlOp} ?`);
        params.push(parsedValue);
      }
    }
    
    return {
      sql: conditions.join(' '),
      params,
    };
  }

  buildSqlOrderBy(orderBy: string): string {
    if (!orderBy) return '';
    
    const parts = orderBy.split(',').map(part => {
      const [field, direction] = part.trim().split(/\s+/);
      const sqlField = this.camelToSnake(field);
      const sqlDir = direction?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      return `${sqlField} ${sqlDir}`;
    });
    
    return parts.join(', ');
  }

  private camelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  private odataOpToSql(op: string): string {
    const map: Record<string, string> = {
      eq: '=',
      ne: '!=',
      gt: '>',
      ge: '>=',
      lt: '<',
      le: '<=',
    };
    return map[op.toLowerCase()] || '=';
  }

  private parseValue(value: string): any {
    value = value.trim();
    
    // String literal
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    
    // Boolean
    if (value === 'true') return 1;
    if (value === 'false') return 0;
    
    // Number
    if (!isNaN(Number(value))) return Number(value);
    
    // Column reference (no quotes)
    return value;
  }
}
```

**Step 4**: Implement Admin Coupon API Routes
```typescript
// app/api/admin/coupons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { CouponService } from '@/lib/coupons';
import { ODataParser } from '@/lib/odata/ODataParser';

const couponService = new CouponService();
const odataParser = new ODataParser();

function isSuper(session: any): boolean {
  return (session?.user as any)?.role === 'superadmin';
}

// GET /api/admin/coupons - List with OData
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!isSuper(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const odata = odataParser.parse(url.search);
    
    // Build SQL query with OData filters
    let sql = 'SELECT * FROM coupons';
    const params: any[] = [];
    
    if (odata.filter) {
      const where = odataParser.buildSqlWhere(odata.filter);
      sql += ` WHERE ${where.sql}`;
      params.push(...where.params);
    }
    
    // Count if requested
    let totalCount: number | undefined;
    if (odata.count) {
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
      const countResult = await couponService.executeRaw(countSql, params);
      totalCount = countResult.rows[0].count;
    }
    
    // Order by
    if (odata.orderBy) {
      sql += ` ORDER BY ${odataParser.buildSqlOrderBy(odata.orderBy)}`;
    }
    
    // Pagination
    if (odata.top) {
      sql += ` LIMIT ${odata.top}`;
    }
    if (odata.skip) {
      sql += ` OFFSET ${odata.skip}`;
    }
    
    const result = await couponService.executeRaw(sql, params);
    
    return NextResponse.json({
      coupons: result.rows,
      totalCount,
      nextLink: odata.skip && result.rows.length === odata.top 
        ? `${url.pathname}?$skip=${odata.skip + odata.top}&$top=${odata.top}`
        : undefined,
    });
  } catch (error) {
    console.error('Admin coupon list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/coupons - Create
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!isSuper(session)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.code || !body.discountType || !body.discountValue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create coupon
    const coupon = await couponService.createCoupon({
      code: body.code.toUpperCase().trim(),
      discountType: body.discountType,
      discountValue: body.discountValue,
      currency: body.currency || 'USD',
      maxUses: body.maxUses,
      expiresAt: body.expiresAt,
      applicablePlans: body.applicablePlans,
      createdBy: session.user?.email || 'admin',
    });
    
    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }
    
    console.error('Coupon creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Additional routes in separate files:
// app/api/admin/coupons/[id]/route.ts - GET, PATCH, DELETE
// app/api/admin/coupons/analytics/route.ts - GET analytics
```

#### Deliverables
1. ✅ OData query parser with SQL generation
2. ✅ `GET /api/admin/coupons` with filtering, sorting, pagination
3. ✅ `POST /api/admin/coupons` with validation
4. ✅ `PATCH /api/admin/coupons/:id` with update logic
5. ✅ `DELETE /api/admin/coupons/:id` with soft-delete
6. ✅ Full API integration test coverage
7. ✅ OData compliance (filter, orderby, top, skip, count)

---

### Phase 3: Admin Coupon Management UI (Week 2 - Days 1-3)

#### TDD Approach
**Step 1**: Write E2E Test First
```typescript
// tests/e2e/admin-coupon-management.spec.ts
test('Admin creates and manages coupons', async ({ page }) => {
  // Login as admin
  await loginAsAdmin(page);
  
  // Navigate to coupon management
  await page.goto('/admin/coupons');
  await expect(page.getByRole('heading', { name: 'Coupon Management' })).toBeVisible();
  
  // Create new coupon
  await page.getByRole('button', { name: 'Create Coupon' }).click();
  await page.getByLabel('Coupon Code').fill('NEWYEAR25');
  await page.getByLabel('Discount Type').selectOption('percentage');
  await page.getByLabel('Discount Value').fill('25');
  await page.getByLabel('Max Uses').fill('100');
  await page.getByLabel('Expiry Date').fill('2025-12-31');
  await page.getByRole('button', { name: 'Create' }).click();
  
  // Verify success
  await expect(page.getByText('Coupon created successfully')).toBeVisible();
  await expect(page.getByText('NEWYEAR25')).toBeVisible();
  
  // Filter active coupons
  await page.getByLabel('Filter by status').selectOption('active');
  await expect(page.getByText('NEWYEAR25')).toBeVisible();
  
  // Search coupon
  await page.getByLabel('Search coupons').fill('NEWYEAR');
  await expect(page.getByText('NEWYEAR25')).toBeVisible();
  
  // Edit coupon
  await page.getByRole('row', { name: /NEWYEAR25/ }).getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Discount Value').fill('30');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('30%')).toBeVisible();
  
  // Deactivate coupon
  await page.getByRole('row', { name: /NEWYEAR25/ }).getByRole('button', { name: 'Deactivate' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Inactive')).toBeVisible();
});

test('Admin views coupon analytics', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin/coupons');
  
  // Click on coupon to view details
  await page.getByRole('row', { name: /SAVE25/ }).click();
  
  // Verify analytics display
  await expect(page.getByText('Total Redemptions:')).toBeVisible();
  await expect(page.getByText('Total Discount Given:')).toBeVisible();
  await expect(page.getByText('Average Discount:')).toBeVisible();
  
  // Verify redemption history
  await expect(page.getByRole('heading', { name: 'Redemption History' })).toBeVisible();
  await expect(page.getByText(/redeemed by/)).toBeVisible();
});
```

**Step 2**: Create Component Interfaces
```typescript
// components/admin/coupons/CouponListTable.interface.ts
export interface CouponListTableProps {
  coupons: Coupon[];
  onEdit: (id: string) => void;
  onDeactivate: (id: string) => void;
  onViewDetails: (id: string) => void;
}

// components/admin/coupons/CouponCreateForm.interface.ts
export interface CouponCreateFormProps {
  onSuccess: (coupon: Coupon) => void;
  onCancel: () => void;
}

// components/admin/coupons/CouponAnalyticsCard.interface.ts
export interface CouponAnalyticsCardProps {
  couponId?: string;
  refreshInterval?: number;
}
```

**Step 3**: Implement Components (TDD - Component Tests)
```typescript
// components/admin/coupons/CouponListTable.test.tsx
describe('CouponListTable', () => {
  const mockCoupons = [
    {
      id: '1',
      code: 'SAVE25',
      discountType: 'percentage',
      discountValue: 25,
      active: true,
      currentUses: 45,
      maxUses: 100,
    },
    // ... more coupons
  ];

  it('renders coupon list', () => {
    render(<CouponListTable coupons={mockCoupons} onEdit={jest.fn()} onDeactivate={jest.fn()} />);
    
    expect(screen.getByText('SAVE25')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('45/100')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', async () => {
    const onEdit = jest.fn();
    render(<CouponListTable coupons={mockCoupons} onEdit={onEdit} onDeactivate={jest.fn()} />);
    
    await userEvent.click(screen.getByRole('button', { name: 'Edit SAVE25' }));
    expect(onEdit).toHaveBeenCalledWith('1');
  });

  it('shows confirmation dialog before deactivate', async () => {
    const onDeactivate = jest.fn();
    render(<CouponListTable coupons={mockCoupons} onEdit={jest.fn()} onDeactivate={onDeactivate} />);
    
    await userEvent.click(screen.getByRole('button', { name: 'Deactivate SAVE25' }));
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onDeactivate).toHaveBeenCalledWith('1');
  });
});
```

**Step 4**: Implement Pages
```typescript
// app/admin/coupons/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CouponListTable from '@/components/admin/coupons/CouponListTable';
import CouponAnalyticsCard from '@/components/admin/coupons/CouponAnalyticsCard';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
  });

  useEffect(() => {
    loadCoupons();
  }, [filters, pagination.page]);

  const loadCoupons = async () => {
    setLoading(true);
    
    try {
      // Build OData query
      const params = new URLSearchParams();
      
      // Filter
      if (filters.status !== 'all') {
        params.set('$filter', `active eq ${filters.status === 'active'}`);
      }
      
      // Search (simple contains)
      if (filters.search) {
        const filterStr = params.get('$filter') || '';
        const searchFilter = `contains(code, '${filters.search.toUpperCase()}')`;
        params.set('$filter', filterStr ? `${filterStr} and ${searchFilter}` : searchFilter);
      }
      
      // Pagination
      params.set('$top', pagination.pageSize.toString());
      params.set('$skip', ((pagination.page - 1) * pagination.pageSize).toString());
      params.set('$count', 'true');
      
      // Order by
      params.set('$orderby', 'created_at desc');
      
      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      const data = await res.json();
      
      setCoupons(data.coupons);
      setPagination(prev => ({ ...prev, totalCount: data.totalCount }));
    } catch (error) {
      console.error('Failed to load coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <Link
            href="/admin/coupons/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create Coupon
          </Link>
        </div>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <CouponAnalyticsCard />
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Search by code..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        {/* Coupon Table */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            <CouponListTable
              coupons={coupons}
              onEdit={(id) => window.location.href = `/admin/coupons/${id}/edit`}
              onDeactivate={async (id) => {
                await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
                loadCoupons();
              }}
              onViewDetails={(id) => window.location.href = `/admin/coupons/${id}`}
            />
            
            {/* Pagination */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
                {pagination.totalCount} coupons
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.pageSize >= pagination.totalCount}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

#### Deliverables
1. ✅ `/admin/coupons` - Main coupon management page
2. ✅ `/admin/coupons/new` - Create coupon page
3. ✅ `/admin/coupons/[id]/edit` - Edit coupon page
4. ✅ `/admin/coupons/[id]` - Coupon details/analytics page
5. ✅ `CouponListTable` component with search/filter
6. ✅ `CouponCreateForm` with validation
7. ✅ `CouponAnalyticsCard` with real-time stats
8. ✅ Pagination with OData integration
9. ✅ E2E test coverage

---

### Phase 4: Enhanced Admin Dashboard (Week 2 - Days 4-5)

#### Components Needed
1. **Revenue Analytics Widget**
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - Growth percentage
   - Chart visualization (Chart.js or Recharts)

2. **Coupon Performance Widget**
   - Top 5 performing coupons
   - Total discount given this month
   - Redemption rate trends

3. **Subscription Metrics Widget**
   - Plan distribution pie chart
   - Active vs canceled subscriptions
   - Registration count vs limits

4. **Recent Activity Feed**
   - Recent coupon redemptions
   - New subscriptions
   - Cancellations

#### TDD Strategy
```typescript
// tests/e2e/admin-dashboard.spec.ts
test('Admin dashboard displays KPIs', async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('/admin');
  
  // Revenue metrics
  await expect(page.getByText('MRR')).toBeVisible();
  await expect(page.getByText(/\$[\d,]+/)).toBeVisible();
  
  // Coupon metrics
  await expect(page.getByText('Top Performing Coupons')).toBeVisible();
  
  // Subscription metrics
  await expect(page.getByText('Plan Distribution')).toBeVisible();
  
  // Recent activity
  await expect(page.getByText('Recent Activity')).toBeVisible();
});
```

---

## 🧪 COMPREHENSIVE TEST STRATEGY

### Unit Tests (TDD - Write First)

#### Coupon Service Tests
```typescript
// tests/unit/coupon-service.spec.ts
describe('CouponService', () => {
  describe('validateCoupon', () => {
    it('returns valid for active non-expired coupon', async () => {
      // Arrange
      const service = new CouponService();
      await seedCoupon({ code: 'VALID', active: true, expiresAt: '2030-12-31' });
      
      // Act
      const result = await service.validateCoupon('VALID');
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.discount).toBeDefined();
    });
    
    it('returns invalid for expired coupon', async () => {
      const service = new CouponService();
      await seedCoupon({ code: 'EXPIRED', active: true, expiresAt: '2020-01-01' });
      
      const result = await service.validateCoupon('EXPIRED');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon has expired');
    });
    
    it('returns invalid for exhausted coupon', async () => {
      const service = new CouponService();
      await seedCoupon({ code: 'FULL', active: true, maxUses: 10, currentUses: 10 });
      
      const result = await service.validateCoupon('FULL');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Coupon has reached maximum uses');
    });
  });
  
  describe('applyCoupon', () => {
    it('calculates percentage discount correctly', async () => {
      const service = new CouponService();
      await seedCoupon({ code: 'SAVE25', discountType: 'percentage', discountValue: 25 });
      
      const discounted = await service.applyCoupon('SAVE25', 10000, 'standard'); // $100
      
      expect(discounted).toBe(7500); // $75
    });
    
    it('calculates fixed discount correctly', async () => {
      const service = new CouponService();
      await seedCoupon({ code: 'SAVE10', discountType: 'fixed', discountValue: 10 });
      
      const discounted = await service.applyCoupon('SAVE10', 10000, 'standard'); // $100
      
      expect(discounted).toBe(9000); // $90
    });
    
    it('throws for plan-restricted coupon', async () => {
      const service = new CouponService();
      await seedCoupon({
        code: 'ENT50',
        discountType: 'percentage',
        discountValue: 50,
        applicablePlans: ['enterprise'],
      });
      
      await expect(
        service.applyCoupon('ENT50', 10000, 'standard')
      ).rejects.toThrow('not applicable to this plan');
    });
  });
});
```

#### OData Parser Tests
```typescript
// tests/unit/odata-parser.spec.ts
describe('ODataParser', () => {
  const parser = new ODataParser();
  
  describe('parse', () => {
    it('parses filter expression', () => {
      const query = parser.parse('$filter=active eq true');
      expect(query.filter).toBe('active eq true');
    });
    
    it('parses multiple operators', () => {
      const query = parser.parse('$filter=active eq true&$orderby=code desc&$top=10&$skip=20');
      expect(query.filter).toBe('active eq true');
      expect(query.orderBy).toBe('code desc');
      expect(query.top).toBe(10);
      expect(query.skip).toBe(20);
    });
  });
  
  describe('buildSqlWhere', () => {
    it('converts eq operator', () => {
      const result = parser.buildSqlWhere('active eq true');
      expect(result.sql).toBe('active = ?');
      expect(result.params).toEqual([1]);
    });
    
    it('handles AND logic', () => {
      const result = parser.buildSqlWhere('active eq true and currentUses lt maxUses');
      expect(result.sql).toBe('active = ? AND current_uses < max_uses');
      expect(result.params).toEqual([1]);
    });
    
    it('parses string literals', () => {
      const result = parser.buildSqlWhere("discountType eq 'percentage'");
      expect(result.sql).toBe('discount_type = ?');
      expect(result.params).toEqual(['percentage']);
    });
  });
});
```

---

### Integration Tests (API Routes)

```typescript
// tests/integration/checkout-with-coupon.spec.ts
describe('Checkout with Coupon Integration', () => {
  it('applies coupon and processes payment', async () => {
    // 1. Validate coupon
    const validation = await fetch('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code: 'SAVE25' }),
    }).then(r => r.json());
    
    expect(validation.valid).toBe(true);
    
    // 2. Process payment with coupon
    const payment = await fetch('/api/payment/process', {
      method: 'POST',
      body: JSON.stringify({
        paymentToken: 'tok_test',
        amount: 2249, // Discounted from $29.99
        couponCode: 'SAVE25',
      }),
    }).then(r => r.json());
    
    expect(payment.success).toBe(true);
    
    // 3. Verify coupon usage tracked
    const coupon = await fetch('/api/admin/coupons?$filter=code eq \'SAVE25\'', {
      headers: { 'Authorization': 'Bearer admin-token' },
    }).then(r => r.json());
    
    expect(coupon.coupons[0].currentUses).toBeGreaterThan(0);
  });
});
```

---

### E2E Tests (Complete User Journeys)

```typescript
// tests/e2e/complete-payment-flow-with-coupon.spec.ts
test('Complete user journey: Browse pricing → Apply coupon → Pay → Confirm', async ({ page }) => {
  // 1. User browses pricing page
  await page.goto('/pricing');
  await expect(page.getByText('Standard Plan')).toBeVisible();
  await expect(page.getByText('$29.99/mo')).toBeVisible();
  
  // 2. User clicks subscribe
  await page.getByRole('button', { name: 'Subscribe', exact: true }).first().click();
  await expect(page).toHaveURL(/\/checkout\?plan=standard/);
  
  // 3. User sees checkout page
  await expect(page.getByText('Checkout')).toBeVisible();
  await expect(page.getByText('$29.99')).toBeVisible();
  
  // 4. User applies coupon
  await page.getByLabel('Coupon Code').fill('SAVE25');
  await page.getByRole('button', { name: 'Apply' }).click();
  
  // 5. Verify discount applied
  await expect(page.getByText('Coupon "SAVE25" applied')).toBeVisible();
  await expect(page.getByText('You save $7.50')).toBeVisible();
  await expect(page.getByText('Total: $22.49')).toBeVisible();
  
  // 6. User fills payment details
  const cardFrame = page.frameLocator('#card-container iframe');
  await cardFrame.getByLabel('Card Number').fill('4111 1111 1111 1111');
  await cardFrame.getByLabel('Expiry').fill('12/25');
  await cardFrame.getByLabel('CVV').fill('123');
  
  // 7. User submits payment
  await page.getByRole('button', { name: 'Pay $22.49' }).click();
  
  // 8. Verify success
  await expect(page.getByText('Payment successful')).toBeVisible({ timeout: 10000 });
  
  // 9. User redirected to dashboard
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Standard')).toBeVisible();
  await expect(page.getByText('Active')).toBeVisible();
});

test('Admin creates coupon → User applies it → Admin sees analytics', async ({ page, context }) => {
  // 1. Admin creates coupon
  const adminPage = await context.newPage();
  await loginAsAdmin(adminPage);
  await adminPage.goto('/admin/coupons/new');
  
  await adminPage.getByLabel('Coupon Code').fill('E2ETEST');
  await adminPage.getByLabel('Discount Type').selectOption('percentage');
  await adminPage.getByLabel('Discount Value').fill('20');
  await adminPage.getByLabel('Max Uses').fill('50');
  await adminPage.getByRole('button', { name: 'Create' }).click();
  
  await expect(adminPage.getByText('Coupon created')).toBeVisible();
  
  // 2. User applies coupon during checkout
  await page.goto('/checkout?plan=standard');
  await page.getByLabel('Coupon Code').fill('E2ETEST');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText('20% discount')).toBeVisible();
  
  // Complete payment...
  await fillCardDetails(page);
  await page.getByRole('button', { name: /Pay/ }).click();
  await expect(page.getByText('Payment successful')).toBeVisible({ timeout: 10000 });
  
  // 3. Admin checks analytics
  await adminPage.goto('/admin/coupons');
  await adminPage.getByText('E2ETEST').click();
  
  await expect(adminPage.getByText('Total Redemptions: 1')).toBeVisible();
  await expect(adminPage.getByText('Total Discount Given: $6.00')).toBeVisible();
});
```

---

## 📊 ODATA SPECIFICATION DETAILS

### Required OData Operators

#### $filter (Query Operators)
```
Comparison:
  eq  - Equal to
  ne  - Not equal to
  gt  - Greater than
  ge  - Greater than or equal
  lt  - Less than
  le  - Less than or equal

Logical:
  and - Logical AND
  or  - Logical OR
  not - Logical NOT

Functions (optional):
  contains(field, 'value')
  startswith(field, 'value')
  endswith(field, 'value')
```

#### $orderby (Sorting)
```
Format: field [asc|desc][,field2 [asc|desc]]
Examples:
  $orderby=code
  $orderby=code desc
  $orderby=currentUses desc,code asc
```

#### $top / $skip (Pagination)
```
$top=20    - Return first 20 records
$skip=40   - Skip first 40 records
Combined: $top=20&$skip=40 - Page 3 (records 41-60)
```

#### $count (Total Count)
```
$count=true - Include totalCount in response
```

#### $select (Field Projection)
```
$select=id,code,discountValue - Only return specified fields
```

### OData Response Format
```json
{
  "coupons": [
    {
      "id": "123",
      "code": "SAVE25",
      "discountType": "percentage",
      "discountValue": 25,
      "active": true,
      "currentUses": 45,
      "maxUses": 100
    }
  ],
  "totalCount": 156,
  "nextLink": "/api/admin/coupons?$skip=20&$top=20"
}
```

---

## 🎨 UX DESIGN PRINCIPLES

### Checkout Coupon UI

#### Best Practices
1. **Progressive Disclosure**
   - Start collapsed: "Have a coupon code?"
   - Expand on click to reveal input
   - Keep UI clean for users without coupons

2. **Immediate Feedback**
   - Show spinner during validation
   - Green checkmark on success
   - Red error icon with clear message
   - Display savings prominently

3. **Error Messages (User-Friendly)**
   - ❌ "Invalid coupon" → ✅ "Coupon not found. Please check the code."
   - ❌ "Expired" → ✅ "This coupon expired on Dec 31, 2024"
   - ❌ "Max uses reached" → ✅ "This coupon has been fully redeemed"

4. **Accessibility**
   - ARIA labels on all inputs
   - Keyboard navigation support
   - Screen reader announcements for success/error
   - Focus management

#### Mobile Optimization
- Large touch targets (44px minimum)
- Coupon code input auto-uppercase
- Virtual keyboard: uppercase letters only
- One-tap remove button

---

### Admin Coupon Management UI

#### Table Design
- **Sortable columns** (click header to sort)
- **Inline actions** (Edit, Deactivate buttons in row)
- **Row expansion** (click row to view redemption history)
- **Bulk actions** (checkbox selection + bulk deactivate)
- **Empty state** (friendly message + CTA to create first coupon)

#### Form Design
- **Step-by-step wizard** for complex coupon creation
- **Real-time preview** of discount calculation
- **Validation on blur** (not just on submit)
- **Help text** for each field
- **Example values** in placeholders

#### Analytics Display
- **Card-based layout** for KPIs
- **Sparkline charts** for trends
- **Color-coded status badges** (green=active, gray=inactive, red=expired)
- **Interactive charts** (Chart.js or Recharts)

---

## 🚀 IMPLEMENTATION ROADMAP

### Week 1: Core Coupon Functionality

| Day | Focus | Deliverables | Test Coverage |
|-----|-------|--------------|---------------|
| 1   | Coupon UI Component | `CouponInput` component, component tests | 100% unit tests |
| 2   | Checkout Integration | Updated checkout page, E2E tests | E2E coverage |
| 3   | Payment + Coupon Flow | Backend integration, API tests | Integration tests |
| 4   | Admin API + OData | Coupon CRUD endpoints, OData parser | API integration tests |
| 5   | Admin API Testing | Full API test suite, edge cases | 100% endpoint coverage |

### Week 2: Admin UI & Analytics

| Day | Focus | Deliverables | Test Coverage |
|-----|-------|--------------|---------------|
| 1   | Admin Coupon List | `CouponListTable`, search/filter | Component tests |
| 2   | Admin Create/Edit Forms | `CouponCreateForm`, `CouponEditForm` | Form validation tests |
| 3   | Coupon Analytics | `CouponAnalyticsCard`, redemption history | Data fetching tests |
| 4   | Enhanced Dashboard | Revenue widgets, KPI cards | E2E dashboard tests |
| 5   | Polish & Documentation | UX refinements, API docs | Full E2E suite |

---

## 📦 DELIVERABLE SUMMARY

### Backend (ISP Compliant)
1. ✅ `IODataParser` interface
2. ✅ `ODataParser` implementation
3. ✅ `GET /api/admin/coupons` with OData
4. ✅ `POST /api/admin/coupons`
5. ✅ `PATCH /api/admin/coupons/:id`
6. ✅ `DELETE /api/admin/coupons/:id`
7. ✅ `GET /api/admin/coupons/analytics`

### Frontend Components
1. ✅ `CouponInput` (checkout)
2. ✅ `CouponListTable` (admin)
3. ✅ `CouponCreateForm` (admin)
4. ✅ `CouponEditForm` (admin)
5. ✅ `CouponAnalyticsCard` (admin)
6. ✅ `CouponRedemptionHistory` (admin)
7. ✅ Enhanced `CheckoutPage` with coupon
8. ✅ Enhanced `AdminPage` with KPIs

### Test Coverage
1. ✅ 35+ unit tests (coupon service, OData parser)
2. ✅ 15+ component tests (React Testing Library)
3. ✅ 20+ integration tests (API routes)
4. ✅ 10+ E2E tests (Playwright)
5. ✅ **Target: >90% code coverage**

---

## 🔐 SECURITY CONSIDERATIONS

### API Security
- ✅ Admin-only routes verified via `isSuper()` check
- ✅ SQL injection prevention via parameterized queries
- ✅ Rate limiting on coupon validation (prevent brute force)
- ✅ Audit logging for all admin actions

### Coupon Security
- ✅ Prevent code enumeration (same error for invalid/expired)
- ✅ Case-insensitive codes (auto-uppercase)
- ✅ Trim whitespace to prevent user errors
- ✅ One-time redemption tracking per user

---

## 📈 SUCCESS METRICS

### Technical Metrics
- ✅ Test coverage >90%
- ✅ API response time <200ms (95th percentile)
- ✅ Zero SQL injection vulnerabilities
- ✅ 100% ISP compliance

### UX Metrics
- ✅ Coupon application <3 seconds
- ✅ <5% coupon validation errors
- ✅ Admin coupon creation <30 seconds
- ✅ Mobile-responsive (100% Lighthouse score)

---

## 🎯 CONCLUSION

This architecture analysis provides a comprehensive roadmap for completing the BlessBox payment, coupon, and admin system with:

1. **Test-Driven Development**: All features start with tests
2. **Interface Segregation**: Clean, single-responsibility interfaces
3. **OData Integration**: Powerful querying and filtering
4. **E2E Coverage**: Complete user journey validation
5. **UX Excellence**: Intuitive, accessible, responsive design

**Estimated Effort**: 2 weeks (80 hours)  
**Team Size**: 1-2 developers  
**Risk Level**: Low (architecture proven, tests define requirements)

**Next Step**: Review and approve this architecture, then begin Phase 1 implementation with TDD approach.

---

*Document prepared by: Software Architect*  
*Review Status: Ready for Implementation*  
*Last Updated: October 30, 2025*

