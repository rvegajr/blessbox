# Fix: Traklet Dev Widget PAT Leak (qa-report/06 §13)

Date: 2026-04-25 · Author: rvegajr@noctusoft.com

## Problem

`components/dev/TrakletDevWidget.tsx` read `NEXT_PUBLIC_TRAKLET_PAT`. Any
`NEXT_PUBLIC_*` variable is inlined into client bundles at build time, so a
single misconfigured production deploy would have shipped a GitHub PAT to
every browser.

## Changes

1. **Inventory** — `NEXT_PUBLIC_TRAKLET_*` lived in two places only:
   - `components/dev/TrakletDevWidget.tsx` (lines 9–10)
   - `.env.local` (lines 26–27)

2. **Server-only PAT** — renamed `NEXT_PUBLIC_TRAKLET_PAT` → `TRAKLET_PAT` in
   `.env.local` and added a new route
   `app/api/dev/traklet-proxy/route.ts`. The route:
   - Returns `404` whenever `process.env.NODE_ENV === 'production'`
   - Returns `503` if `TRAKLET_PAT` is unset
   - Forwards `GET/POST/PATCH/PUT/DELETE` to `https://api.github.com<subpath>`,
     stripping the client `Authorization` header and substituting
     `Authorization: token ${TRAKLET_PAT}`

3. **Client widget rewritten** — `TrakletDevWidget.tsx` no longer references
   any PAT. It points the Traklet GitHub adapter at
   `${window.location.origin}/api/dev/traklet-proxy` via the adapter's
   supported `baseUrl` option (verified in
   `node_modules/traklet/dist/traklet.es.js:5869`). A placeholder `token: 'proxy'`
   satisfies Traklet's zod validator; the proxy overwrites it.

4. **Hard layout gate** — `app/layout.tsx` now computes
   `const showTraklet = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_TRAKLET_ENABLED === 'true'`
   and renders `<TrakletDevWidget />` only when true. A production build
   tree-shakes the component to `null` even if the enabled flag is set.

5. **`env.template`** — added a documented `TRAKLET_PAT` block (commented out)
   under "Development Settings" with a DEVELOPMENT-ONLY warning.

## Leak verification (post `rm -rf .next && npm run build`)

```
grep -Ra "gho_Wbgrm…h4bSsxH" .next/         → 0 matches  (PAT literal)
grep -Ra "gho_Wbgrm…h4bSsxH" .next/static/  → 0 matches  (client bundle)
grep -Ra "TRAKLET_PAT"       .next/static/  → 0 matches  (client bundle)
grep -Ral "TRAKLET_PAT"      .next/         → 4 server-only sourcemap hits
```

The 4 hits are `.js.map` files under `.next/server/chunks/` — the source text
of the proxy route itself, never shipped to the browser. Zero client leakage.

## Verification

- `npm run build` — succeeds; route `/api/dev/traklet-proxy` registered.
- `npm run test -- --run` — 30 files, 362/362 tests passing in 4.35s.
