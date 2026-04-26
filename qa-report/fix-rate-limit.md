# Fix: Rate Limiting

**Status:** Implemented (best-effort, in-memory)
**Date:** 2026-04-25
**Original finding:** `qa-report/07-security.md` — zero rate limiting on any API route.

## What changed

### New helper — `lib/security/rateLimit.ts`

Token-bucket limiter keyed by `${route}:${ip}` (or an explicit identifier such
as email / session). Buckets live in a process-local `Map` and expire lazily
on access — no `setInterval`, no background work. A small bounded sweep
(<= 50 entries) runs only when the map exceeds 1,000 keys, so memory stays
flat under steady load.

Public API:

- `getClientIp(req)` — first hop of `x-forwarded-for`, then `x-real-ip`,
  then `'unknown'`. Tolerates stub requests without a `Headers` object so
  existing service tests continue to pass.
- `rateLimit(req, { key, limit, windowMs, identifier?, now? })` —
  returns `{ allowed, retryAfterSec, remaining }`.
- `rateLimitResponse(retryAfterSec)` — 429 JSON response with a
  `Retry-After` header (floored, never below 1).

A `TODO(prod)` comment at the top points future work at Upstash Redis
(`@upstash/ratelimit`) so the limiter becomes globally consistent across
serverless instances.

### Routes wired up

| Route | Limit |
|---|---|
| `app/api/auth/send-code/route.ts` | 5/min per IP, 20/hr per email |
| `app/api/auth/verify-code/route.ts` | 10/min per IP |
| `app/api/onboarding/send-verification/route.ts` | 5/min per IP |
| `app/api/onboarding/verify-code/route.ts` | 10/min per IP |
| `app/api/report-bug/route.ts` | 5/hr per IP |
| `app/api/registrations/send-qr/route.ts` | 10/hr per IP |
| `app/api/registrations/route.ts` POST | 30/min per IP |
| `app/api/registrations/submit/route.ts` POST | 30/min per IP (shared key) |
| `app/api/payment/process/route.ts` | 10/min per IP, 30/hr per session email |

The two registration submit routes deliberately share the
`registrations/submit:ip` key — a client cannot double their budget by
alternating endpoints.

## Tests

`lib/security/rateLimit.test.ts` — 11 cases:

- `getClientIp` precedence (xff first hop, x-real-ip fallback, unknown).
- Token consumption up to limit, then 429 with positive `retryAfterSec`.
- `retryAfterSec` reports the full window when first blocked.
- Window expiry refills the bucket cleanly across a synthetic clock.
- Different IPs do not share buckets.
- Different route keys do not share buckets.
- Explicit `identifier` override (e.g. email) creates a distinct bucket.
- `rateLimitResponse` returns 429 + correct `Retry-After` header,
  flooring fractional input and clamping to a minimum of 1.

## Verification

- `npm run test -- --run` — 362 / 362 pass (30 files).
- `npm run build` — succeeds.

## Known limitations

- Per-instance memory only. On Vercel a determined attacker can amplify
  by the number of warm instances. The TODO points at the Redis swap-in.
- `'unknown'` IP collapses all unidentifiable clients into one bucket.
  Acceptable — they share a strict budget rather than getting bypassed.
