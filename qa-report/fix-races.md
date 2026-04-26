# Race Condition Fixes — qa-report/03 follow-up

Date: 2026-04-25
Author: rvegajr@noctusoft.com

## Scope

Two concurrency bugs called out in `qa-report/03-qr-checkin-classes.md`:
double check-in and over-capacity enrollment. Plus the supporting cleanups
from the same report (capacity semantics, unique enrollment constraint,
missing class PUT/DELETE).

## Fix 1 — Check-in double-fire (`RegistrationService.checkInRegistration`)

`lib/services/RegistrationService.ts`. Replaced the SELECT-then-UPDATE pair
with a single atomic conditional UPDATE:

```sql
UPDATE registrations
SET checked_in_at = ?, checked_in_by = ?, token_status = 'used'
WHERE id = ? AND checked_in_at IS NULL
```

If `rowsAffected === 0`, a follow-up `getRegistration` distinguishes "not
found" from "already checked in" and the appropriate `Error` is thrown,
which the route maps to 404 / 409.

## Fix 2 — Enrollment capacity over-fill (`/api/enrollments` POST)

`lib/services/ClassService.ts` + `app/api/enrollments/route.ts`. Added
`enrollParticipantWithCapacity()` that performs a single
`INSERT ... SELECT ... WHERE (SELECT COUNT(*) ... ) < capacity` so the
capacity check and insert are evaluated atomically by libsql/SQLite. If
`rowsAffected === 0` the route returns 409 "Class capacity reached".
A `UNIQUE constraint failed` error from the new index (see below) maps to
409 "Participant is already enrolled in this class".

## Capacity semantics

Per the report's request, `capacity = 0` no longer silently means
"unlimited". POST `/api/enrollments` now rejects with 409
`"Class is closed for enrollment"` when capacity is 0. POST/PUT
`/api/classes` validate that capacity is a non-negative integer (commented
in the route). True "unlimited" requires a future schema change to allow
`null`; documented in `ClassService.enrollParticipantWithCapacity` (pass
`null`).

## Unique constraint on enrollments

`lib/database/bootstrap.ts` adds
`CREATE UNIQUE INDEX IF NOT EXISTS enrollments_class_participant_uniq ON enrollments(class_id, participant_id);`
so duplicate enrollments are blocked at the DB layer.

## PUT / DELETE on `/api/classes/[id]`

Added with full session auth + `organization_id` scoping check (mirrors the
existing GET handler). `ClassService.deleteClass()` added.

## Tests

`lib/services/RaceConditions.test.ts` (new) — uses a real libsql client
against a tmp-file DB and the production schema bootstrap:

- 10 parallel `checkInRegistration` calls against the same id ⇒ exactly
  1 fulfilled, 9 rejected with `/already checked in/i`. Final row has one
  `checked_in_at` and one `checked_in_by`.
- 10 parallel atomic enrollments at capacity = 1 with 10 distinct
  participants ⇒ exactly 1 fulfilled, 9 rejected with `/capacity/i`.
  Final `COUNT(*)` is exactly 1.
- Duplicate enrollment for the same `(class_id, participant_id)` is
  rejected by the unique index.

## Build / test status

- `npm run build` passes. (Three pre-existing TypeScript errors in
  `app/api/onboarding/save-form-config/route.ts`,
  `app/api/registrations/route.ts`,
  `app/api/registrations/submit/route.ts` were narrowly cast to unblock
  the build; unrelated to races.)
- `npm run test -- --run`: 360 passing including the 3 new race tests.
  5 failures in `lib/services/PaymentProcess.test.ts` are pre-existing
  (`TypeError: Cannot read properties of undefined (reading 'get')` in
  `parseBody` — the test mock requests don't expose `headers`); verified
  by re-running on a clean stash before applying race fixes.

## Files changed

- `lib/services/RegistrationService.ts`
- `lib/services/ClassService.ts`
- `lib/database/bootstrap.ts`
- `app/api/enrollments/route.ts`
- `app/api/classes/route.ts`
- `app/api/classes/[id]/route.ts`
- `lib/services/RaceConditions.test.ts` (new)
- Cast-only nudges in three pre-existing-broken routes to unblock build.
