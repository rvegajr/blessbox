# QA Fixes Verification Checklist
**Date:** 2026-05-21
**Fixes Completed:** All 5 phases (A-E)
**Status:** ✅ READY FOR RETEST

---

## ✅ Build & Test Status

### Unit Tests
- ✅ All 38 new tests passing
- ✅ All existing tests still passing (100%)
- ✅ Test coverage: 35 unit + 3 static checks

### Build Status
- ✅ `npm run build` succeeds
- ✅ TypeScript compilation clean
- ✅ No linter errors introduced

---

## 🐛 Bug Fixes Verification

### Phase A: Issue #21 - Staff Check-in Dashboard SQL Error

**Problem:** `SQLINPUTERROR: SQLite input error: no such column: qcs.label`

**Root Cause:** Line 73 of `app/api/check-in/search/route.ts` referenced non-existent `qcs.label` column. The schema has `qcs.name`, not `qcs.label`.

**Fix Applied:**
- ✅ Changed SQL: `qcs.label` → `qcs.name`
- ✅ Changed API response field: `qrCodeLabel` → `qrCodeSetName`
- ✅ Updated frontend interface in `app/dashboard/check-in/page.tsx`

**Tests Added:** 3 static code validation tests

**Verification Steps for QA:**
1. Go to `/dashboard/check-in`
2. Click "Attendee List" tab
3. ✅ Should see list of registrations (no SQL error in console)
4. Try the search box
5. ✅ Search should filter results (no 500 error)
6. Try status filters (Pending/Checked In/All)
7. ✅ All filters should work without errors

**Expected Result:** No SQL errors in browser console or network tab

---

### Phase B: Issue #18 - QR Code Soft-Delete Reversion

**Problem:** Deleted QR codes show as active again after page refresh

**Root Cause:** `QRCodeService.listQRCodes` (line 73) hardcoded `isActive: true`, ignoring the `isActive` flag stored in the JSON blob.

**Fix Applied:**
- ✅ Created ISP interface: `IQRCodeJsonMapper`
- ✅ Implemented shared mapper with correct `isActive` logic
- ✅ Both `listQRCodes` and `getQRCodesBySet` now use mapper
- ✅ Deleted QR codes preserve `isActive: false` state

**Tests Added:** 7 unit tests for JSON mapping logic

**Verification Steps for QA:**
1. Go to `/dashboard/qr-codes`
2. Delete a QR code (should show as inactive)
3. Refresh the page (Cmd+R or F5)
4. ✅ Deleted QR code should STILL show as inactive
5. Try deleting multiple QR codes
6. ✅ All deleted QRs should remain inactive after refresh

**Expected Result:** Soft-deleted QR codes stay inactive after page refresh

---

### Phase C: Issue #17a - Form Builder Preview Button

**Problem:** Preview button does nothing when clicked

**Root Cause:** Dashboard form builder had `setShowPreview(true)` but no `<FormPreviewModal>` component rendered.

**Fix Applied:**
- ✅ Extracted `FormPreviewModal` to `components/forms/FormPreviewModal.tsx`
- ✅ Added modal to dashboard form builder
- ✅ Removed duplicate code from onboarding page
- ✅ Single source of truth for preview modal

**Tests Added:** 8 component tests for modal behavior

**Verification Steps for QA:**
1. Go to `/dashboard/form-builder`
2. Click "Preview" button
3. ✅ Modal should open showing form preview
4. Click X button or backdrop
5. ✅ Modal should close
6. Add/edit fields, then preview again
7. ✅ Preview should reflect current changes

**Expected Result:** Preview modal opens and shows current form configuration

---

### Phase D: Issue #17b - Dropdown Enter Key

**Problem:** Pressing Enter in dropdown options textarea doesn't create new line

**Root Cause:** `onChange` handler (line 227) immediately filtered empty lines: `lines.filter(o => o.trim() !== '')`, removing the trailing newline before React could render it.

**Fix Applied:**
- ✅ Created ISP interface: `IFormOptionsSerializer`
- ✅ Implemented pure parser: `parseInProgress` (preserves blanks while typing)
- ✅ Implemented `parseFinal` (trims blanks on blur/save)
- ✅ Updated `FormBuilderWizard` to use serializer

**Tests Added:** 16 unit tests for serialization logic

**Verification Steps for QA:**
1. Go to `/dashboard/form-builder`
2. Add a "Dropdown" field
3. In the options box, type "Small" and press Enter
4. ✅ Cursor should move to new line
5. Type "Medium" and press Enter
6. ✅ Cursor should move to new line again
7. Type "Large"
8. Click outside the textarea (blur)
9. ✅ Three options should be saved: Small, Medium, Large

**Expected Result:** Enter key creates new lines in dropdown options

---

### Phase E: Issue #34 - Export CSV Diagnostics

**Problem:** Export CSV button shows generic "Failed to export" alert with no details

**Root Cause:** Frontend used `alert()` for all errors. Empty exports returned text instead of CSV headers.

**Fix Applied:**
- ✅ Extracted CSV builder to `lib/services/RegistrationsCsvBuilder.ts`
- ✅ Always emits BOM + headers (even with 0 registrations)
- ✅ Frontend shows detailed error message in UI banner
- ✅ Errors logged to console with status codes and messages

**Tests Added:** 4 unit tests for CSV builder

**Verification Steps for QA:**
1. Go to `/dashboard/registrations`
2. Click "Export CSV" button
3. ✅ CSV file should download (even if empty, has headers)
4. Verify CSV opens in Excel/Google Sheets
5. ✅ Should have proper column headers
6. If export fails, check page for error banner
7. ✅ Error should show specific failure reason (not generic alert)
8. Check browser console
9. ✅ Detailed error logged with status code

**Expected Result:** CSV always downloads with headers; errors show specific messages

---

## 🔍 Cross-Cutting Concerns Checked

### ISP Compliance
- ✅ `IQRCodeJsonMapper` - pure mapper, no DB dependencies
- ✅ `IFormOptionsSerializer` - pure parser, stateless

### TDD Adherence
- ✅ All 5 phases followed Red → Green → Refactor
- ✅ Tests written before implementation
- ✅ All tests passing

### Code Quality
- ✅ No schema migrations (all fixes code-only)
- ✅ No breaking changes to existing APIs
- ✅ Backward compatible (old data still works)
- ✅ DRY: Shared components extracted
- ✅ KISS: Simple, focused solutions

### Documentation
- ✅ All new interfaces documented
- ✅ Complex logic has comments explaining "why"
- ✅ No redundant "what the code does" comments

---

## 📋 Next Steps for QA

### Immediate Actions
1. **Retest all 4 issues** (#17, #18, #21, #34)
2. **Remove `retest` label** if fixes verified
3. **Report any remaining issues** as new bugs

### Specific Test Scenarios

**Issue #21 (Check-in):**
- [ ] Browse attendee list - no errors
- [ ] Search by name - returns results
- [ ] Search by email - returns results
- [ ] Filter by Pending - shows only unchecked
- [ ] Filter by Checked In - shows only checked

**Issue #18 (QR Codes):**
- [ ] Delete QR code - shows inactive
- [ ] Refresh page - still shows inactive
- [ ] Delete multiple QRs - all stay inactive
- [ ] Try to use deleted QR registration URL - 404

**Issue #17a (Preview):**
- [ ] Click Preview - modal opens
- [ ] Close modal - closes cleanly
- [ ] Preview reflects current form state
- [ ] Works on both onboarding and dashboard

**Issue #17b (Dropdown):**
- [ ] Enter key adds new line
- [ ] Cursor stays on new line
- [ ] Can add 10+ options
- [ ] Empty lines removed on save

**Issue #34 (Export):**
- [ ] Export downloads file
- [ ] CSV has proper headers
- [ ] Opens in Excel correctly
- [ ] Error shows specific message if fails

---

## 🚨 Known Limitations (Explicitly NOT Fixed)

These items were identified but intentionally excluded from this fix:

1. ❌ QR generation duplicate-name issue (separate fix on 5/14)
2. ❌ No refactoring of `QRCodeService` beyond mapper extraction
3. ❌ No UI redesign of form builder
4. ❌ No new features added

---

## ✅ Definition of Done - Checklist

- [x] All 38 new tests green (35 unit + 3 static)
- [x] Existing test suite 100% passing
- [x] `npm run build` succeeds
- [ ] Issue #21 retest: check-in works (QA to verify)
- [ ] Issue #18 retest: deleted QR stays inactive (QA to verify)
- [ ] Issue #17 retest: Preview modal + Enter key work (QA to verify)
- [ ] Issue #34 retest: CSV exports with headers (QA to verify)
- [ ] Fix-deployment comments added to issues (pending)
- [ ] `retest` label remains until QA verifies (current state)

---

## 🎯 Confidence Level

**Technical Confidence:** 🟢 HIGH
- All tests passing
- Build clean
- TDD + ISP principles followed
- Root causes addressed, not symptoms

**Integration Confidence:** 🟡 MEDIUM-HIGH
- Fixes are localized
- No breaking changes
- Backward compatible
- BUT: Need E2E verification on production

**Recommended Next Step:** Deploy to production and have QA run through verification steps above.
