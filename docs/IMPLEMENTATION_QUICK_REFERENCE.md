# 🎯 Implementation Checklist - Quick Reference

## What's Left to Build (No Duplication)

### ✅ **ALREADY EXISTS (Don't Rebuild)**
- Onboarding system (100% complete)
- Payment & subscription system
- Coupon system with OData
- Class & participant management
- Admin dashboard
- Email service infrastructure
- Database schema
- Authentication (NextAuth)

### ❌ **NEED TO BUILD (Following Existing Patterns)**

## Phase 1: Registration System (2-3 days) 🔴 CRITICAL

**Goal**: Users can register via QR codes, orgs can manage registrations

### Files to Create:
1. **lib/interfaces/IRegistrationService.ts** - Interface (ISP compliant)
2. **lib/services/RegistrationService.ts** - Implementation (follows ClassService pattern)
3. **app/api/registrations/route.ts** - POST + GET endpoints
4. **app/api/registrations/[id]/route.ts** - GET/PUT/DELETE endpoints
5. **app/register/[orgSlug]/[qrLabel]/page.tsx** - Dynamic form (REPLACE hardcoded version)
6. **app/dashboard/registrations/page.tsx** - Management UI

### Tests to Write (TDD):
- `lib/services/RegistrationService.test.ts` (100% coverage)
- `src/tests/api/registrations.test.ts`
- `src/tests/api/registrations-details.test.ts`
- `src/tests/pages/registration-form.test.tsx`
- `src/tests/pages/dashboard-registrations.test.tsx`

### Key Features:
- ✅ Fetch form config from onboarding data
- ✅ Render form dynamically
- ✅ Submit registration to database
- ✅ List/view/update/delete registrations
- ✅ Filter by QR code, status, date range

---

## Phase 2: QR Code Management (1-2 days) 🟡 HIGH

**Goal**: Orgs can view, download, and manage QR codes

### Files to Create:
1. **lib/interfaces/IQRCodeService.ts** - Interface (ISP compliant)
2. **lib/services/QRCodeService.ts** - Implementation
3. **app/api/qr-codes/route.ts** - GET list
4. **app/api/qr-codes/[id]/route.ts** - GET/PUT/DELETE
5. **app/api/qr-codes/[id]/download/route.ts** - Download image
6. **app/api/qr-codes/[id]/analytics/route.ts** - Analytics
7. **app/dashboard/qr-codes/page.tsx** - Management UI

### Tests to Write (TDD):
- `lib/services/QRCodeService.test.ts` (100% coverage)
- `src/tests/api/qr-codes.test.ts`
- `src/tests/pages/dashboard-qr-codes.test.tsx`

### Key Features:
- ✅ List all QR codes from qr_code_sets table
- ✅ Display QR code images
- ✅ Download QR codes
- ✅ Deactivate/reactivate QR codes
- ✅ Show scan analytics

---

## Phase 3: Polish & Production (1 day) 🟠 MEDIUM

### Email Templates
1. Registration confirmation email
2. Check-in reminder email
3. Admin notification email

### Dashboard Analytics
1. Registration trends graph
2. QR code scan analytics
3. Export to CSV/Excel

### E2E Tests
1. Full user journey test
2. Onboarding → QR → Registration → Dashboard

---

## Architecture Patterns (Use These)

### 1. Service Layer (ISP)
```typescript
// Pattern: lib/interfaces/IXxxService.ts
export interface IRegistrationService {
  getFormConfig(orgSlug: string, qrLabel: string): Promise<FormConfig | null>;
  submitRegistration(data: FormData): Promise<Registration>;
  listRegistrations(orgId: string, filters?: any): Promise<Registration[]>;
}

// Pattern: lib/services/XxxService.ts
export class RegistrationService implements IRegistrationService {
  private db = getDbClient();
  // ... implement methods
}
```

### 2. API Routes
```typescript
// Pattern: app/api/xxx/route.ts
import { XxxService } from '@/lib/services/XxxService';

const service = new XxxService();

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const result = await service.doSomething(data);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

### 3. Database Queries
```typescript
// Use existing patterns from lib/services/ClassService.ts
const result = await this.db.execute({
  sql: 'SELECT * FROM registrations WHERE organization_id = ?',
  args: [organizationId]
});
```

### 4. Frontend Pages
```typescript
// Pattern: Client component with loading/error states
'use client';

export default function Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/xxx')
      .then(res => res.json())
      .then(data => setData(data.result))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <div>Loading...</div>;
  return <div>{/* render data */}</div>;
}
```

---

## Test-Driven Development (TDD) Approach

### For Each Feature:
1. **Write interface first** - Define contract
2. **Write tests** - All expected behaviors
3. **Run tests** - They should fail (red)
4. **Implement service** - Make tests pass (green)
5. **Refactor** - Improve code quality
6. **Write API tests** - Test endpoints
7. **Implement API** - Make tests pass
8. **Write UI tests** - Test components
9. **Implement UI** - Make tests pass

### Test Coverage Goals:
- **Service layer**: 100% coverage
- **API layer**: All happy paths + error cases
- **UI layer**: All user interactions

---

## Avoiding Duplication Checklist

Before creating new code, check if it exists:

### ✅ Don't Create (Already Exists):
- ❌ Email service (use `lib/services/EmailService.ts`)
- ❌ OData parser (use `lib/utils/odataParser.ts`)
- ❌ Database client (use `lib/db.ts`)
- ❌ Schema definitions (use `lib/schema.ts`)
- ❌ Onboarding APIs (use `app/api/onboarding/*`)
- ❌ Coupon validation (use `lib/coupons.ts`)
- ❌ Auth middleware (use NextAuth)

### ✅ Create (Doesn't Exist Yet):
- ✅ IRegistrationService + RegistrationService
- ✅ Registration APIs
- ✅ Dynamic registration form
- ✅ Registration management UI
- ✅ IQRCodeService + QRCodeService
- ✅ QR code APIs
- ✅ QR code management UI

---

## Next Actions (In Order)

1. ✅ Start with **IRegistrationService interface**
2. ✅ Write **RegistrationService tests** (TDD)
3. ✅ Implement **RegistrationService**
4. ✅ Create **registration submission API**
5. ✅ Update **registration form** (dynamic rendering)
6. ✅ Build **registration management UI**
7. ✅ Add **registration link** to dashboard

Then move to Phase 2 (QR Code Management).

---

## Time Estimates

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Registration System | 2-3 days | 🔴 P0 |
| Phase 2: QR Code Management | 1-2 days | 🟡 P1 |
| Phase 3: Polish & Production | 1 day | 🟠 P2 |
| **TOTAL** | **4-6 days** | - |

---

## Success Criteria

### Registration System Complete:
- [ ] User can scan QR code and register
- [ ] Form fields are dynamic (from onboarding)
- [ ] Registrations appear in dashboard
- [ ] Org can filter/search registrations
- [ ] All tests pass (100% coverage)

### QR Code Management Complete:
- [ ] Org can view all QR codes
- [ ] Org can download QR images
- [ ] Org can deactivate QR codes
- [ ] Analytics show scan/registration counts
- [ ] All tests pass

### Production Ready:
- [ ] Email confirmations sent
- [ ] Dashboard shows analytics
- [ ] E2E test passes
- [ ] No linter errors

---

**Ready to Begin**: Phase 1, Task 1.1 (IRegistrationService Interface)  
**Status**: Comprehensive plan with TDD + ISP + Zero duplication  
**Date**: January 2025

