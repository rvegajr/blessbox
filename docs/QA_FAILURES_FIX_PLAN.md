# QA Failures — Root-Cause Analysis & Fix Plan (TDD + ISP)

**Date:** 2026-05-21
**Author:** Architect (analysis from QA tickets + code review)
**Status:** PROPOSED — awaiting approval before execution
**Scope:** 3 failed use-case issues + 1 customer bug from QA round on 2026-05-21

---

## Failed Tickets Summary

| # | Title | Status | Root Cause Bucket |
|---|-------|--------|-------------------|
| 17 | Custom registration form builder | ❌ Fail | UX defects (preview button, dropdown Enter key) |
| 18 | QR code generation and management | ❌ Fail | Soft-delete reverts on refresh |
| 21 | Staff check-in dashboard | ❌ Fail | SQL error — invalid column `qcs.label` |
| 34 | Export CSV button (customer report) | 🐛 Bug | Already implemented; needs verification — likely user is on a stale page |

QA evidence:
- Issue #21 console: `SQLINPUTERROR: SQLite input error: no such column: qcs.label (at offset 191)`
- Issue #17 notes: Preview Form button not working; dropdown cannot add new line on Enter
- Issue #18 notes: Status of deleted QR code becomes Active again when page is refreshed
- Issue #34: Customer (rvegajr@darkware.net) cannot Export CSV from event report page

---

## Root Cause #1 — Check-in SQL References Non-existent Column (Issue #21)

**File:** `app/api/check-in/search/route.ts:73`

```ts
qcs.label as qr_code_label
```

**Schema reality** (`lib/schema.ts:66-83`): `qr_code_sets` has columns `id`, `organization_id`, `name`, `language`, `form_fields`, `qr_codes`, `is_active`, `scan_count`, `event_type`, `description`, `created_at`, `updated_at`. **There is no `label` column.** Individual QR code labels live inside the `qr_codes` JSON blob.

**Impact:** Every call to `/api/check-in/search` returns 500 → both the attendee list AND manual search are completely broken on production.

**Fix:** Use `qcs.name as qr_code_set_name` (the human-friendly event name) since per-QR labels would require parsing JSON for each row anyway. The frontend already shows event-level context.

---

## Root Cause #2 — `listQRCodes` Hardcodes `isActive: true` (Issue #18)

**File:** `lib/services/QRCodeService.ts:73`

```ts
isActive: true, // QR codes inherit active status from set
```

**Reality:** `deleteQRCode` correctly sets `isActive: false` inside the JSON blob (line 179 of the same file). And `getQRCodesBySet` already reads it correctly:

```ts
isActive: qrCodeData.isActive !== undefined ? qrCodeData.isActive : (qrSet.is_active === 1)
```

But `listQRCodes` (used by the dashboard's QR codes page) ignores the JSON value and forces `true`. So:

1. User deletes QR → JSON blob updated with `isActive: false` ✅
2. UI optimistically shows it as inactive ✅
3. User refreshes page → `listQRCodes` runs → returns `isActive: true` ❌

**Fix:** Mirror the `getQRCodesBySet` logic in `listQRCodes`. Even better: extract a single `mapJsonQRCodeToDomain` helper used by both reads (DRY).

---

## Root Cause #3 — Form Builder Preview Button Wired but Not Rendered (Issue #17)

**File:** `app/dashboard/form-builder/page.tsx`

```tsx
const [showPreview, setShowPreview] = useState(false);
// ...
<FormBuilderWizard
  data={formData}
  onChange={handleFormChange}
  onPreview={() => setShowPreview(true)}  // sets state...
  isLoading={saving}
/>
// ...but no <FormPreviewModal> is rendered anywhere on the page.
```

The standalone dashboard form-builder is missing the modal. The onboarding flow (`app/onboarding/form-builder/page.tsx:44-160`) has a complete `FormPreviewModal`. It was duplicated there but never extracted to a shared component, and the dashboard page was never wired to use it.

**Impact:** Clicking "Preview" sets state silently — UI shows nothing → looks broken to the QA tester.

**Fix:** Extract `FormPreviewModal` to `components/forms/FormPreviewModal.tsx`, then mount it on both pages. ISP-aligned: it depends only on `FormBuilderData` (already an existing interface) and two callbacks.

---

## Root Cause #4 — Dropdown Options Strip Trailing Empty Line During Typing (Issue #17)

**File:** `components/onboarding/FormBuilderWizard.tsx:223-229`

```tsx
onChange={(e) => {
  const lines = e.target.value.split('\n');
  const options = lines.filter(o => o.trim() !== '');  // ← strips trailing newline
  updateField(field.id, { options });
}}
```

**The bug:** The textarea is fully controlled by `field.options.join('\n')`. When the user presses **Enter** at the end of a line, the textarea momentarily contains a trailing `\n`. `onChange` fires, `filter` removes the empty line, the join recomputes the string without `\n`, React resets the textarea, and the cursor visually "doesn't advance to a new line."

**Fix:** Keep all lines while typing — only collapse empties on blur (which the code already does). Tradeoff: while typing, an interior empty line is allowed; the user gets WYSIWYG. On blur, empties are trimmed.

**ISP-aligned helper:** introduce `IFormOptionsSerializer` with `parseRaw(text)` (preserves blanks) and `parseFinal(text)` (trims + drops blanks). Pure logic, easily unit-tested.

---

## Root Cause #5 — Customer Export CSV Report (Issue #34)

The Export CSV button at `app/dashboard/registrations/page.tsx:182-211` is correctly wired and the API route at `app/api/registrations/export/route.ts` is functional. The customer's "event report page" likely refers to this same page (we have only one registrations export). Possible causes:

1. **Browser pop-up blocker** — programmatic `<a>.click()` blocked
2. **Auth session expired silently** — endpoint returns 401, button shows generic alert
3. **No registrations to export** — endpoint returns empty CSV (looks like nothing happens)
4. **CSP / mixed-content issue on Safari** — blob URL refused

**Fix:** Add user-visible error states (instead of silent `alert('Failed to export')`), log to a structured tracker, and return a 200 with empty `body=` (UTF-8 BOM + headers row only) when there's nothing to export so the file always downloads. Then we can diagnose further from QA's recording.

---

## Design Principles for the Fix

1. **TDD** — every bug gets a failing test first; production code lands red → green → refactor.
2. **ISP** — small, focused interfaces (`IQRCodeIsActiveResolver`, `IFormOptionsSerializer`); no fat services.
3. **DRY** — extract `FormPreviewModal` and `mapJsonQRCodeToDomain` once.
4. **No schema migrations** — all fixes are code-only.
5. **Backwards compatible** — existing rows with no `isActive` flag default to `true` (matches current behavior).
6. **No new tables, no behavior creep** — fix the bug, ship, retest.

---

## Phase A — Fix #21 (Check-in SQL) — 30 min

### A.1 Tests (Red)

`tests/api/check-in/search-sql.test.ts` (new):

```ts
describe('GET /api/check-in/search', () => {
  it('does not reference the non-existent qcs.label column', async () => {
    const text = await fs.readFile('app/api/check-in/search/route.ts', 'utf8');
    expect(text).not.toMatch(/qcs\.label/);
  });

  it('selects qr_code_set_name and joins qr_code_sets correctly', async () => {
    // hit the endpoint with a seeded org → expect 200 + array
    const res = await fetch(`${baseUrl}/api/check-in/search?q=`, { headers: testAuthHeaders });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.registrations)).toBe(true);
  });
});
```

### A.2 Implementation (Green)

```ts
// app/api/check-in/search/route.ts:73
qcs.name as qr_code_set_name
```

And rename downstream field `qrCodeLabel → qrCodeSetName` (or alias both for one release).

### A.3 Frontend update

`app/dashboard/check-in/page.tsx` — change references from `qrCodeLabel` to `qrCodeSetName` (single string-replace).

**Definition of Done:**
- [ ] `/api/check-in/search` returns 200 with valid JSON
- [ ] Manual search filters results
- [ ] Empty list shows graceful empty state
- [ ] No console SQL errors
- [ ] All existing tests pass

---

## Phase B — Fix #18 (QR Soft-Delete) — 45 min

### B.1 ISP interface

`lib/interfaces/IQRCodeMapper.ts` (new, tiny):

```ts
import type { QRCode, QRCodeSet } from './IQRCodeService';

export interface IQRCodeJsonMapper {
  mapJsonToQRCode(
    jsonRow: any,
    set: { id: string; isActive: boolean; scanCount: number; createdAt: string; updatedAt: string },
    registrationCount: number
  ): QRCode;
}
```

### B.2 Tests (Red)

`lib/services/QRCodeJsonMapper.test.ts` (new):

```ts
describe('QRCodeJsonMapper', () => {
  const mapper = new QRCodeJsonMapper();

  it('returns isActive=false when JSON has isActive=false (preserves soft delete)', () => {
    const result = mapper.mapJsonToQRCode(
      { id: 'q1', label: 'Door A', url: '/x', isActive: false },
      { id: 'set1', isActive: true, scanCount: 0, createdAt: 't', updatedAt: 't' },
      0
    );
    expect(result.isActive).toBe(false);
  });

  it('defaults to set isActive when JSON omits the field (legacy rows)', () => {
    const result = mapper.mapJsonToQRCode(
      { id: 'q1', label: 'Door A', url: '/x' },
      { id: 'set1', isActive: true, scanCount: 0, createdAt: 't', updatedAt: 't' },
      0
    );
    expect(result.isActive).toBe(true);
  });

  it('respects explicit isActive=true', () => {
    const result = mapper.mapJsonToQRCode(
      { id: 'q1', label: 'Door A', url: '/x', isActive: true },
      { id: 'set1', isActive: true, scanCount: 0, createdAt: 't', updatedAt: 't' },
      0
    );
    expect(result.isActive).toBe(true);
  });
});
```

### B.3 Implementation (Green)

`lib/services/QRCodeJsonMapper.ts` (new) — pure helper, no DB.
Then `QRCodeService.listQRCodes` and `getQRCodesBySet` both delegate to it.

**Definition of Done:**
- [ ] Soft-deleted QR codes stay inactive after page refresh
- [ ] Existing rows without `isActive` field still default to `true`
- [ ] No duplicated mapping logic between `listQRCodes` and `getQRCodesBySet`

---

## Phase C — Fix #17a (Preview Modal) — 60 min

### C.1 Extract shared component

Move `FormPreviewModal` from `app/onboarding/form-builder/page.tsx` (lines 44-160) → `components/forms/FormPreviewModal.tsx`.

### C.2 Tests (Red)

`tests/components/FormPreviewModal.test.tsx` (new):

```tsx
describe('FormPreviewModal', () => {
  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <FormPreviewModal isOpen={false} onClose={vi.fn()} formData={{ fields: [], title: 't', description: '' }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the form title when isOpen=true', () => {
    render(
      <FormPreviewModal isOpen={true} onClose={vi.fn()} formData={{ fields: [], title: 'Sunday Drive', description: '' }} />
    );
    expect(screen.getByText('Sunday Drive')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <FormPreviewModal isOpen={true} onClose={onClose} formData={{ fields: [], title: 't', description: '' }} />
    );
    fireEvent.click(screen.getByTestId('form-preview-modal'));
    expect(onClose).toHaveBeenCalled();
  });
});
```

### C.3 Wire to dashboard form-builder (Green)

```tsx
// app/dashboard/form-builder/page.tsx
import { FormPreviewModal } from '@/components/forms/FormPreviewModal';

return (
  <div ...>
    {/* existing JSX */}
    <FormPreviewModal
      isOpen={showPreview}
      onClose={() => setShowPreview(false)}
      formData={formData}
    />
  </div>
);
```

Also update `app/onboarding/form-builder/page.tsx` to import from shared location and delete its inline copy.

**Definition of Done:**
- [ ] Preview button on `/dashboard/form-builder` opens a modal showing the form
- [ ] Both onboarding and dashboard use the same component (single source of truth)
- [ ] Modal closes via X button, backdrop click, and Escape key

---

## Phase D — Fix #17b (Dropdown Enter Key) — 45 min

### D.1 ISP serializer interface

`lib/interfaces/IFormOptionsSerializer.ts` (new):

```ts
export interface IFormOptionsSerializer {
  /** While typing — preserves user keystrokes including blank lines. */
  parseInProgress(text: string): string[];
  /** On blur or save — trims and drops empties. */
  parseFinal(text: string): string[];
  /** Serialize back to textarea string. */
  serialize(options: string[]): string;
}
```

### D.2 Tests (Red)

`lib/services/FormOptionsSerializer.test.ts` (new):

```ts
describe('FormOptionsSerializer', () => {
  const svc = new FormOptionsSerializer();

  it('parseInProgress preserves trailing blank line so Enter creates a new option', () => {
    expect(svc.parseInProgress('S\nM\nL\n')).toEqual(['S', 'M', 'L', '']);
  });

  it('parseInProgress preserves interior whitespace lines', () => {
    expect(svc.parseInProgress('S\n\nM')).toEqual(['S', '', 'M']);
  });

  it('parseFinal drops empty and whitespace-only lines and trims', () => {
    expect(svc.parseFinal('  S  \n\n M \n')).toEqual(['S', 'M']);
  });

  it('serialize joins with newline', () => {
    expect(svc.serialize(['S', 'M'])).toBe('S\nM');
  });
});
```

### D.3 Implementation (Green)

`components/onboarding/FormBuilderWizard.tsx`:

```tsx
const serializer = useMemo(() => new FormOptionsSerializer(), []);

// while typing
onChange={(e) => {
  updateField(field.id, { options: serializer.parseInProgress(e.target.value) });
}}
// on blur
onBlur={(e) => {
  updateField(field.id, { options: serializer.parseFinal(e.target.value) });
}}
```

The textarea `value` becomes `serializer.serialize(field.options || [])`.

**Definition of Done:**
- [ ] Pressing Enter in the dropdown options textarea creates a visible new line
- [ ] Cursor stays on the new (empty) line while typing
- [ ] Empty options are trimmed away on blur and on save (`handleSave` uses `parseFinal`)
- [ ] Existing dropdown fields with N options still render N options

---

## Phase E — Fix #34 (Export CSV diagnostics) — 60 min

### E.1 Improve frontend error visibility

Current code: `alert('Failed to export registrations')` swallows the real error. Replace with:

```tsx
if (response.ok) { /* ... */ }
else {
  const msg = await response.text().catch(() => 'Unknown error');
  setExportError(`Export failed (${response.status}): ${msg}`);
  console.error('CSV export failed:', response.status, msg);
}
```

### E.2 Always-emit-CSV behavior

Update `app/api/registrations/export/route.ts` to emit headers row even with zero rows. The customer can then verify the button "fires" and the file downloads.

### E.3 Tests (Red)

`lib/services/RegistrationsExport.test.ts` (new):

```ts
describe('CSV export', () => {
  it('emits at least the BOM + header row when there are zero registrations', () => {
    const csv = buildCsv({ registrations: [], formFields: [] });
    expect(csv).toMatch(/^\uFEFF/);
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(1);
  });
});
```

(`buildCsv` is already a pure helper inside the route — extract to `lib/services/RegistrationsCsvBuilder.ts` for testability — ISP-aligned: just `(input) => string`.)

**Definition of Done:**
- [ ] Export CSV button always downloads a file (even if empty, header row still appears)
- [ ] On error, the user sees a specific, actionable message
- [ ] Customer can re-test and report exact failure mode if it still fails

---

## Test Summary

| Phase | Unit Tests | E2E / API Tests | Total |
|-------|-----------|----------------|-------|
| A — Check-in SQL | 0 | 2 | 2 |
| B — QR soft-delete | 3 | 0 | 3 |
| C — Preview modal | 3 | 0 | 3 |
| D — Dropdown Enter | 4 | 0 | 4 |
| E — Export CSV | 1 | 0 | 1 |
| **Total** | **11** | **2** | **13 new tests** |

---

## ISP Interfaces Introduced

1. `IQRCodeJsonMapper` (Phase B) — pure mapper, single responsibility: JSON ↔ domain
2. `IFormOptionsSerializer` (Phase D) — pure parser/serializer for textarea ↔ options array

Both are read-only, stateless, and fully unit-testable without DB or DOM.

---

## Sequencing & Effort

```
Phase A (Check-in SQL)   →  30 min  ← ship first; biggest user impact
Phase B (QR delete)      →  45 min
Phase C (Preview modal)  →  60 min
Phase D (Dropdown Enter) →  45 min
Phase E (Export CSV)     →  60 min  ← optional polish; bug may be env-specific
─────────────────────────────────────────
Total                    →  4 hrs
```

Phases A, B, D are independent. Phase C depends on extracting the shared modal first.

---

## Definition of Done — Overall

- [ ] All 11 unit tests + 2 API tests green
- [ ] Existing test suite still 100% passing
- [ ] `npm run build` succeeds
- [ ] Issue #21 retest: check-in attendee list and search both work
- [ ] Issue #18 retest: deleted QR stays inactive after refresh
- [ ] Issue #17 retest: Preview modal opens; Enter key adds new dropdown option
- [ ] Issue #34 retest: customer can download CSV (even when empty)
- [ ] Each fixed issue gets a fix-deployment comment via `gh issue comment`
- [ ] `retest` label remains until QA verifies

---

## What This Plan Explicitly Does NOT Do

- ❌ Schema migrations (none needed)
- ❌ Touch the QR generation duplicate-name issue (Arcl note #2 in #17 — see #18's deployed fix from 5/14)
- ❌ Refactor `QRCodeService` beyond the mapper extraction
- ❌ Rebuild the form builder UI
- ❌ Add new features

---

**End of plan. Awaiting approval to execute Phase A.**
