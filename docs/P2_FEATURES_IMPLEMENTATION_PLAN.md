# P2 Features Implementation Plan

**Date:** May 20, 2026
**Author:** Architect role
**Status:** PROPOSED — awaiting approval before execution
**Estimated Total Effort:** ~11 hours (3 phases, deliverable independently)

---

## Design Principles (non-negotiable)

1. **KISS** — reuse `qr_code_sets` as the "Event" entity. No new top-level table.
2. **YAGNI** — no event lifecycle states, no event-level RBAC, no role taxonomy table.
3. **DRY** — extend existing services; do not duplicate logic.
4. **ISP** — each new capability gets its own segregated interface (`IXReader`, `IXWriter`, `IXService`).
5. **Backwards compatible** — every schema change is additive (new nullable column). No breaking migrations.
6. **TDD** — tests written first; production code lands red → green → refactor.
7. **No new tables** — every change fits inside existing schema with optional columns or JSON-blob extension.

---

## Architecture Decision Records (ADRs)

### ADR-1: `qr_code_sets` IS the Event entity
- **Decision**: Treat `qr_code_sets` as `events` in user-facing language. No table rename, no new table.
- **Why**: Schema already has `organizationId`, `name`, `formFields`, `qrCodes`, `isActive`. Renaming would force a 30-file refactor with zero user value.
- **Tradeoff**: Internal DB name (`qr_code_sets`) drifts from UI label ("Event"). Acceptable — users never see DB.
- **Reversal cost**: If we ever rename, `ALTER TABLE qr_code_sets RENAME TO events` is one statement.

### ADR-2: Role lives inside `registration_data` JSON blob
- **Decision**: `role` is a standard form field stored in the existing JSON `registration_data` column.
- **Why**: Zero schema change. The form builder already supports custom fields; role is just a `select` field with conventions.
- **Tradeoff**: Cannot index `role` natively. Acceptable until 100k+ registrations per event (we are at <1k).
- **Reversal cost**: `ALTER TABLE registrations ADD COLUMN role TEXT` + a one-shot extraction script.

### ADR-3: `event_type` is an enum column, not a lookup table
- **Decision**: `qr_code_sets.event_type TEXT` with values from a TypeScript const.
- **Why**: 4 values, rarely changes. A lookup table is over-engineering at this scale.
- **Tradeoff**: Adding a 5th type requires a code deploy. Acceptable — it's a marketing/product decision anyway.
- **Reversal cost**: Promote to lookup table later if we hit 10+ types.

---

## Phase 1: Event Type Selection (MUST ship first)

### User Story
> As an organizer setting up a new event, I want to choose its type (food distribution / seminar / volunteer / custom) so the form builder pre-populates with sensible defaults.

### Why first?
- Closes the landing-page promise gap (`app/page.tsx:124` advertises event types).
- Smallest blast radius (one column, one dropdown).
- Unblocks Phase 2 (role lists per event type) and Phase 3 (event listings).

### File-level change inventory

| Action | Path | Reason |
|---|---|---|
| **NEW** | `lib/interfaces/IEventTypeService.ts` | ISP interface for event type metadata + form templates |
| **NEW** | `lib/services/EventTypeService.ts` | Pure logic, no DB. Returns templates per type. |
| **NEW** | `lib/services/EventTypeService.test.ts` | TDD tests |
| **MODIFY** | `lib/schema.ts` | Add `eventType: text('event_type')` to `qrCodeSets` |
| **MODIFY** | `lib/database/bootstrap.ts` | Add `event_type TEXT` column ALTER for runtime upgrade |
| **MODIFY** | `lib/interfaces/IQRCodeService.ts` | Extend `QRCodeSet` with `eventType?: string` |
| **MODIFY** | `lib/services/QRCodeService.ts` | Persist `eventType` on create, return on read |
| **MODIFY** | `lib/services/FormConfigService.ts` | Accept optional `eventType`; persist to column |
| **MODIFY** | `lib/interfaces/IFormConfigService.ts` | Add `eventType?` to `FormConfigCreate`/`FormConfig` |
| **MODIFY** | `app/onboarding/form-builder/page.tsx` | Add event type dropdown + "use template" button |
| **MODIFY** | `app/api/onboarding/save-form-config/route.ts` | Pass `eventType` to service |
| **NEW** | `tests/services/EventTypeService.test.ts` | Unit tests for templates |
| **NEW** | `tests/api/onboarding/event-type.test.ts` | API tests for persistence |

**Total: 5 new files, 8 modified. ~250 LOC.**

### TDD: Tests first

#### Test 1 — `EventTypeService` returns enum values
```ts
// lib/services/EventTypeService.test.ts
describe('EventTypeService', () => {
  it('returns the 4 known event types', () => {
    const svc = new EventTypeService();
    expect(svc.listEventTypes()).toEqual([
      'food_distribution',
      'seminar',
      'volunteer',
      'custom',
    ]);
  });
});
```

#### Test 2 — Each type returns a starter form template
```ts
it('returns food_distribution template with name + family_size', () => {
  const tpl = svc.getTemplate('food_distribution');
  expect(tpl.formFields.map(f => f.id)).toContain('family_size');
});

it('returns seminar template with name + email', () => {
  const tpl = svc.getTemplate('seminar');
  expect(tpl.formFields.find(f => f.id === 'email')?.required).toBe(true);
});

it('returns custom template with only name + email', () => {
  const tpl = svc.getTemplate('custom');
  expect(tpl.formFields).toHaveLength(2);
});

it('throws on unknown type', () => {
  expect(() => svc.getTemplate('marathon' as any)).toThrow(/unknown event type/i);
});
```

#### Test 3 — `eventType` persists through QR code set creation
```ts
// tests/api/onboarding/event-type.test.ts
it('persists eventType on form config creation', async () => {
  const cfg = await formConfigService.createFormConfig({
    organizationId: 'org-1',
    name: 'Sunday Distribution',
    eventType: 'food_distribution',
    formFields: [...],
  });
  const reloaded = await formConfigService.getFormConfig(cfg.id);
  expect(reloaded?.eventType).toBe('food_distribution');
});
```

### Interface (ISP-compliant)

```ts
// lib/interfaces/IEventTypeService.ts
export type EventType = 'food_distribution' | 'seminar' | 'volunteer' | 'custom';

export interface EventTypeTemplate {
  eventType: EventType;
  defaultName: string;
  formFields: FormField[]; // reuses IFormConfigService.FormField
  suggestedRoles: string[]; // empty for custom
}

export interface IEventTypeReader {
  listEventTypes(): EventType[];
  getTemplate(eventType: EventType): EventTypeTemplate;
}

// Service is read-only — templates are static. No writer needed.
export type IEventTypeService = IEventTypeReader;
```

### UI

In `app/onboarding/form-builder/page.tsx`, add at the top of the form:

```tsx
<div data-testid="event-type-selector">
  <label htmlFor="event-type">Event Type</label>
  <select
    id="event-type"
    data-testid="select-event-type"
    value={eventType}
    onChange={(e) => {
      setEventType(e.target.value as EventType);
      const tpl = eventTypeService.getTemplate(e.target.value as EventType);
      setFormFields(tpl.formFields); // pre-populate
    }}
  >
    <option value="food_distribution">Food Distribution</option>
    <option value="seminar">Seminar Registration</option>
    <option value="volunteer">Volunteer Sign-up</option>
    <option value="custom">Custom Event</option>
  </select>
</div>
```

### Definition of Done — Phase 1

- [ ] `EventTypeService` implemented, ≥4 tests green
- [ ] `qr_code_sets.event_type` column added (auto-migration in bootstrap)
- [ ] `IFormConfigService` extended with `eventType` field
- [ ] Onboarding form-builder shows dropdown
- [ ] Selecting a type pre-populates fields
- [ ] `eventType` round-trips through API → DB → UI
- [ ] All existing tests still pass
- [ ] No file >250 lines, no service >200 lines (per `.cursorrules`)

**Estimate: 2-3 hours.**

---

## Phase 2: Check-in Role Distinction

### User Story
> As staff doing check-in, I want to see whether the person is an Attendee, Organizer, or Volunteer so I can route them differently (e.g., volunteers get a different briefing).

### File-level change inventory

| Action | Path | Reason |
|---|---|---|
| **NEW** | `lib/interfaces/IRegistrationRoleService.ts` | ISP interface for role read/filter |
| **NEW** | `lib/services/RegistrationRoleService.ts` | Pure helper: extract `role` from `registration_data` |
| **NEW** | `lib/services/RegistrationRoleService.test.ts` | TDD tests |
| **MODIFY** | `lib/services/RegistrationService.ts` | Map `role` from JSON when reading |
| **MODIFY** | `lib/interfaces/IRegistrationService.ts` (or related) | Add `role?: string` to `Registration` |
| **MODIFY** | `app/dashboard/check-in/page.tsx` | Show role badge; add role filter dropdown |
| **MODIFY** | `app/dashboard/registrations/page.tsx` | Add role filter (optional polish) |
| **MODIFY** | `app/api/check-in/search/route.ts` | Support `role` query param |
| **MODIFY** | `lib/services/EventTypeService.ts` | Return `suggestedRoles` per type |
| **MODIFY** | Form builder | Add "role" as a system field (auto-generated select) |
| **NEW** | `tests/api/check-in/role-filter.test.ts` | API tests |

**Total: 4 new, 7 modified. ~300 LOC.**

### Role conventions (no schema change!)

`registration_data` is a JSON blob. We just add a key:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "volunteer"
}
```

Standard role values (per event type from Phase 1):

| Event Type | Suggested Roles |
|---|---|
| `food_distribution` | `recipient`, `volunteer`, `staff` |
| `seminar` | `attendee`, `speaker`, `organizer` |
| `volunteer` | `volunteer`, `coordinator` |
| `custom` | (organizer-defined) |

### TDD: Tests first

```ts
// lib/services/RegistrationRoleService.test.ts
describe('RegistrationRoleService', () => {
  const svc = new RegistrationRoleService();

  it('extracts role from registration_data', () => {
    expect(svc.extractRole({ role: 'volunteer', name: 'X' })).toBe('volunteer');
  });

  it('returns null when no role', () => {
    expect(svc.extractRole({ name: 'X' })).toBeNull();
  });

  it('normalizes case (Volunteer → volunteer)', () => {
    expect(svc.extractRole({ role: 'Volunteer' })).toBe('volunteer');
  });

  it('rejects role with whitespace or punctuation', () => {
    expect(svc.extractRole({ role: 'volun teer!' })).toBeNull();
  });
});

// tests/api/check-in/role-filter.test.ts
describe('GET /api/check-in/search?role=volunteer', () => {
  it('returns only volunteer registrations', async () => {
    const res = await app.request('/api/check-in/search?role=volunteer');
    const body = await res.json();
    expect(body.registrations.every(r => r.role === 'volunteer')).toBe(true);
  });
});
```

### Interface (ISP-compliant)

```ts
// lib/interfaces/IRegistrationRoleService.ts
export interface IRegistrationRoleReader {
  extractRole(registrationData: Record<string, unknown>): string | null;
  groupByRole(registrations: Registration[]): Record<string, Registration[]>;
}

// No writer needed — role is set by registrant at form fill time.
export type IRegistrationRoleService = IRegistrationRoleReader;
```

### UI on check-in page

```tsx
// In check-in card, beside existing name display:
{registration.role && (
  <span
    data-testid={`role-badge-${registration.role}`}
    className={roleBadgeClass(registration.role)}
  >
    {registration.role}
  </span>
)}

// Filter dropdown above the list:
<select data-testid="filter-role" onChange={setRoleFilter}>
  <option value="">All roles</option>
  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
</select>
```

### Definition of Done — Phase 2

- [ ] `RegistrationRoleService` implemented, ≥4 tests green
- [ ] Role appears as colored badge on check-in cards
- [ ] Role filter dropdown on check-in page works
- [ ] Form builder auto-injects "role" select field when event type is selected
- [ ] API supports `?role=` query param
- [ ] All existing tests still pass
- [ ] No new tables, no new columns

**Estimate: 3 hours.**

---

## Phase 3: Multi-Event per Org

### User Story
> As an organizer, I want to run multiple events (e.g., weekly food distribution + monthly seminar) under one organization, each with its own form and QR codes, but billed under the same subscription.

### Reality check
Schema **already supports this**. Gap is purely UI-level:

1. There's no "Events" landing page that lists all `qr_code_sets`.
2. There's no "+ New Event" button — onboarding builds exactly one set.
3. `organizations.event_name` is a single column, used as if it's the whole identity.

### File-level change inventory

| Action | Path | Reason |
|---|---|---|
| **NEW** | `app/dashboard/events/page.tsx` | List all events for active org |
| **NEW** | `app/dashboard/events/new/page.tsx` | Create new event flow (mini wizard) |
| **NEW** | `app/dashboard/events/[id]/page.tsx` | Single event detail (form, QRs, regs) |
| **NEW** | `lib/interfaces/IEventService.ts` | Thin wrapper around QR code set + form config |
| **NEW** | `lib/services/EventService.ts` | Composes `QRCodeService` + `FormConfigService` |
| **NEW** | `lib/services/EventService.test.ts` | TDD |
| **NEW** | `app/api/events/route.ts` | GET (list), POST (create) |
| **NEW** | `app/api/events/[id]/route.ts` | GET, PATCH, DELETE |
| **MODIFY** | `components/layout/DashboardHeader.tsx` | Add "Events" nav link |
| **MODIFY** | `app/dashboard/page.tsx` | Show event count + "+ Create Event" CTA |
| **MODIFY** | `app/dashboard/registrations/page.tsx` | Add event filter dropdown |
| **MODIFY** | `app/dashboard/qr-codes/page.tsx` | Group by event |
| **NEW** | `tests/services/EventService.test.ts` | Unit tests |
| **NEW** | `tests/api/events/events.test.ts` | API contract tests |

**Total: 9 new, 4 modified. ~600 LOC. Largest phase.**

### Crucial invariants

1. **One event = one `qr_code_set`**. The "Event" abstraction is purely a UI concept layered on top.
2. **Existing orgs auto-get "default event"**. On first dashboard load, surface the existing single set as `event #1`.
3. **`organizations.event_name`** stays for backwards compat; the new `qr_code_sets.name` becomes the source of truth going forward.
4. **No migration script required** — old data continues to work because `qr_code_sets` were always the per-event entity.

### TDD: Tests first

```ts
// lib/services/EventService.test.ts
describe('EventService', () => {
  it('lists all events for an organization', async () => {
    const events = await svc.listEvents('org-1');
    expect(Array.isArray(events)).toBe(true);
  });

  it('creates a new event with form config and at least one QR code', async () => {
    const event = await svc.createEvent({
      organizationId: 'org-1',
      name: 'Christmas Drive',
      eventType: 'food_distribution',
      // formFields auto-populated from EventTypeService template
    });
    expect(event.id).toBeDefined();
    expect(event.qrCodes.length).toBeGreaterThanOrEqual(1);
  });

  it('respects subscription registration limit across all events', async () => {
    // Plan limit = 100, existing usage = 95
    await expect(svc.createRegistration('event-1', { ... })).resolves.toBeDefined();
    // Now usage = 96, repeat 5 times to hit limit
    // Then 7th call should reject
  });

  it('soft-deletes event without affecting other events', async () => {
    await svc.deleteEvent('event-1');
    const events = await svc.listEvents('org-1');
    expect(events.find(e => e.id === 'event-1')?.isActive).toBe(false);
  });
});
```

### Interface (ISP-compliant)

```ts
// lib/interfaces/IEventService.ts

export interface Event {
  id: string;
  organizationId: string;
  name: string;
  eventType: EventType;
  formConfigId: string;
  qrCodes: QRCode[];
  registrationCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreate {
  organizationId: string;
  name: string;
  eventType: EventType;
  description?: string;
  formFields?: FormField[]; // optional — falls back to template
}

export interface EventUpdate {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface IEventReader {
  listEvents(organizationId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | null>;
  countEvents(organizationId: string): Promise<number>;
}

export interface IEventWriter {
  createEvent(data: EventCreate): Promise<Event>;
  updateEvent(id: string, updates: EventUpdate): Promise<Event>;
  deleteEvent(id: string): Promise<void>;
}

export type IEventService = IEventReader & IEventWriter;
```

### UI mockup (text)

```
/dashboard/events                                    [+ New Event]
┌──────────────────────────────────────────────────┐
│  🍞 Sunday Food Distribution      Active   324 reg│
│  food_distribution · 4 QR codes  · Last: 2h ago   │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│  🎤 Q3 Leadership Seminar         Active   42 reg │
│  seminar · 1 QR code  · Last: 1d ago              │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│  🤝 Holiday Volunteer Drive       Inactive  0 reg │
└──────────────────────────────────────────────────┘
```

### Definition of Done — Phase 3

- [ ] `EventService` implemented, ≥6 tests green
- [ ] `/dashboard/events` lists events for active org
- [ ] "+ New Event" creates a new `qr_code_set` + form config
- [ ] Event detail page shows form config, QR codes, registrations
- [ ] Existing single-event orgs see their existing event listed
- [ ] Subscription limits respected across all events (no per-event limit)
- [ ] Registration list can filter by event
- [ ] All existing tests still pass
- [ ] No new tables — pure UI/service composition over `qr_code_sets`

**Estimate: 5-6 hours.**

---

## Cross-Cutting Concerns

### UI Automation (per `.cursorrules`)

Every new component/page MUST include:
- `data-testid` on all interactive elements
- Semantic HTML (`<button>`, `<select>`, `<form>`)
- `aria-label` on icon-only buttons
- `data-loading` on async states

Examples already drafted above.

### Schema Migration Strategy

All schema changes are **additive** and run via existing `bootstrap.ts` ensure-pattern:

```sql
-- Phase 1 only. Phases 2 & 3 require ZERO schema change.
ALTER TABLE qr_code_sets ADD COLUMN event_type TEXT;
ALTER TABLE qr_code_sets ADD COLUMN description TEXT;
```

`bootstrap.ts` already has the pattern of "add column if not exists" — we extend it.

### Rollback Plan

- **Phase 1**: Drop the dropdown UI; column stays harmless. No data loss.
- **Phase 2**: Remove role filter UI. JSON `role` field stays harmless in old registrations.
- **Phase 3**: Remove `/dashboard/events/*` routes; orgs revert to single-event flow. No data lost.

---

## Test Inventory Summary

| Phase | Unit Tests | API Tests | Total |
|---|---|---|---|
| 1 | 4 (`EventTypeService`) | 2 (form-config event_type) | 6 |
| 2 | 4 (`RegistrationRoleService`) | 2 (check-in role filter) | 6 |
| 3 | 6 (`EventService`) | 4 (events CRUD) | 10 |
| **Total** | **14** | **8** | **22 new tests** |

---

## Dependencies & Sequencing

```
Phase 1 (Event Type) ──┬─→ Phase 2 (Roles, uses suggestedRoles per type)
                       └─→ Phase 3 (Events list, uses event_type column)
```

Phases 2 and 3 are **independent of each other** but both depend on Phase 1.

**Recommended order:**
1. Phase 1 (2-3h) — ship Friday
2. Phase 2 (3h) — ship Monday
3. Phase 3 (5-6h) — ship Wednesday

---

## What This Plan Explicitly Does NOT Do

- ❌ Create an `events` table (we reuse `qr_code_sets`)
- ❌ Add event lifecycle states beyond `isActive`
- ❌ Add per-event RBAC or membership rules
- ❌ Add a role taxonomy lookup table
- ❌ Migrate `organizations.event_name` (deprecated, but kept for compat)
- ❌ Touch billing or subscription logic
- ❌ Add cross-event analytics dashboards

If any of these emerge as real needs after shipping, we revisit. Today, they are speculation.

---

## Approval Checklist

Before execution, confirm:

- [ ] Architecture approach (reuse `qr_code_sets` as Event) — approved?
- [ ] Phasing & sequencing — approved?
- [ ] ISP interfaces (3 new) — approved?
- [ ] No new tables — approved?
- [ ] Effort estimate (~11h) — acceptable?
- [ ] Definition of Done per phase — clear?

If any checkbox is contested, we discuss before code.

---

## Appendix: Why NOT a separate `events` table?

| Concern | Cost of separate table | Cost of reusing `qr_code_sets` |
|---|---|---|
| Refactoring | 30+ files, all foreign keys (registrations, qr_codes, form_config) need updating | 0 files |
| Migration risk | High — must move data, rewrite queries, dual-write during cutover | None |
| Conceptual clarity | High — "Event" is a clear domain term | Medium — DB name drifts from UI |
| Future growth | Better if we ever need cross-table joins | Acceptable — JSON blob handles 95% |

**Verdict:** Until we have a real need (e.g., events with multiple registration forms), reusing `qr_code_sets` is the right call. Single table, three new interfaces, 22 tests.

---

**End of plan. Awaiting approval to execute Phase 1.**
