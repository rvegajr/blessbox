# Fix: Tutorial System + Modal a11y

Date: 2026-04-25 · Author: rvegajr@noctusoft.com

Resolves QA findings from `qa-report/06-tutorials-components.md` §11 (tutorials), and the
modal a11y items in §"Cross-cutting flags".

## What changed

### Tutorial system
- **Source of truth chosen**: vanilla `public/tutorials/tutorial-engine.js` (the one
  loaded at runtime by `components/TutorialSystemLoader.tsx`). All 19 tutorials kept
  — no working code deleted.
- **Dead React implementation removed**:
  - `components/ui/TutorialManager.tsx` (never mounted)
  - `components/Tutorial.interface.ts` (only consumer was the file above)
  - `grep -rn TutorialManager` confirms no remaining references in app/lib/components/tests.
- **Docs reconciled**: every `13 tutorials` reference in `README.md` and `docs/*.md`
  updated to `19 tutorials` (10 files touched).
- **Keyboard handlers added** to the engine (`bindKeyboardHandlers` / `unbindKeyboardHandlers`):
  - `Esc` closes (respects `dismissible: false`)
  - `ArrowRight` / `Enter` advances (or completes on last step)
  - `ArrowLeft` goes back
  - Bound on `runWithDriver`, unbound in driver `onDestroyed` — keys are NOT captured
    when no tutorial is active.
  - Typing inside `<input>`, `<textarea>`, or `contenteditable` is never intercepted.
- **localStorage canonicalized**: schema is now documented in a header comment at the
  top of `tutorial-engine.js`. Canonical key is `blessbox_tutorials` holding
  `{ [id]: { completed, version, completedAt } }`. A new `migrateLegacyStorage()`
  runs once at construction time, reads any legacy `tutorial-<id>` keys (the schema
  used by the deleted React TutorialManager), folds them into the canonical map,
  and removes them. Idempotent.
- **New doc**: `docs/TUTORIALS.md` covers the system, the storage shape, the
  keyboard contract, and a step-by-step "add a new tutorial" recipe.

### Modal accessibility
- New hook `lib/hooks/useFocusTrap.ts`:
  - Moves initial focus inside on activation.
  - Tab / Shift+Tab cycle within the container.
  - Restores prior focus on close.
  - Optional `onEscape` callback.
- `components/subscription/CancelModal.tsx` — added `role="dialog"`,
  `aria-modal="true"`, `aria-labelledby` pointing at the title, `tabIndex={-1}` on
  the dialog root, focus-trap ref, and Escape-to-close (suppressed while
  `canceling`).
- `components/subscription/UpgradeModal.tsx` — same treatment.

## Verification

- `npm run build` — succeeded (full Next.js production build, all routes compiled).
- `npm run test -- --run` — 30/31 test files pass. The single failing file is
  `lib/services/RaceConditions.test.ts` (a flaky parallel-enrollment concurrency
  test), pre-existing and unrelated to anything in this change set. No tutorial
  or modal tests regressed.
- `grep -rn "TutorialManager"` returns zero hits across `app/`, `lib/`,
  `components/`, and `tests/`.
- `grep -rn "13 tutorials"` returns zero hits across `README.md` and `docs/`.

## Files touched

- Deleted: `components/ui/TutorialManager.tsx`, `components/Tutorial.interface.ts`
- Modified: `public/tutorials/tutorial-engine.js`,
  `components/subscription/CancelModal.tsx`,
  `components/subscription/UpgradeModal.tsx`,
  `README.md`, plus `docs/{PRODUCTION_TESTING_GUIDE, TUTORIAL_SYSTEM_INVENTORY,
  TUTORIAL_SYSTEM_README, SESSION_COMPLETE_SUMMARY, TUTORIAL_SYSTEM_DEPLOYED_SUCCESS,
  TUTORIAL_SYSTEM_CURRENT_ANALYSIS, TUTORIAL_SYSTEM_COMPLETION_REPORT,
  TUTORIAL_FIX_STATUS, TUTORIAL_ANALYSIS_SUMMARY}.md`
- Added: `lib/hooks/useFocusTrap.ts`, `docs/TUTORIALS.md`

## Notes / follow-ups

- Two stale copies of `tutorial-engine.js` exist at
  `public/tutorials-compiled/tutorial-engine.js` and
  `public/tutorials/public/tutorials/tutorial-engine.js`. Neither is loaded by the
  app (the loader hard-codes `/tutorials/tutorial-engine.js`). They were left
  alone to keep this change focused; recommend a follow-up commit to delete both.
- The engine still depends on driver.js loaded from a CDN. The keyboard handlers
  call `driverObj.moveNext / movePrevious / destroy`, which match driver.js v1.3.1
  API. If a future bump removes those, the bindings need an audit.
- Legacy migration is best-effort: malformed legacy values are silently dropped
  (and the key removed) so a corrupted entry can never block the canonical write.
