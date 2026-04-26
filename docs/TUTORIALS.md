# Tutorial System

BlessBox ships a single, framework-agnostic tutorial engine implemented in vanilla JS at
`public/tutorials/tutorial-engine.js`. It is loaded on every page by the React shim
`components/TutorialSystemLoader.tsx`, which appends script tags for the engine, the
context-aware engine, and the tutorial definition files.

There used to be a parallel React implementation at `components/ui/TutorialManager.tsx`.
It was never mounted and has been removed; do not reintroduce a second implementation.

## Inventory

19 tutorials total, registered from two files:

- `public/tutorials/tutorial-definitions.js` — 11 tutorials (welcome / dashboard / QR / event / team / first-visit / empty-state / help / discovery)
- `public/tutorials/additional-tutorials.js` — 8 tutorials (registration / check-in / form-builder / QR-config / analytics / export / onboarding-complete / payment-coupons)

Total: **19 tutorials**.

## localStorage schema (canonical)

```
key:   blessbox_tutorials
value: {
  [tutorialId: string]: {
    completed:   boolean,
    version:     number,
    completedAt: string  // ISO 8601
  }
}
```

There is no per-tutorial key — everything lives in one JSON blob. A one-time migration
in `BlessBoxTutorials` reads any legacy `tutorial-<id>` keys (left over from the
removed React TutorialManager), folds them into the canonical map, and removes them.

The schema is documented in code at the top of `public/tutorials/tutorial-engine.js`.

## Keyboard

While a tutorial is open, the engine listens on `document` for:

- `Esc` — close the tutorial (only when `dismissible !== false`)
- `Arrow Right` / `Enter` — next step (or complete on the last step)
- `Arrow Left` — previous step

Handlers are bound on `runWithDriver` and unbound in `onDestroyed`, so keys are not
captured when no tutorial is active. Typing inside `<input>`, `<textarea>`, or a
`contenteditable` element is never intercepted.

## Adding a new tutorial

1. Pick the right file:
   - Core onboarding flows → `public/tutorials/tutorial-definitions.js`
   - Feature-specific or contextual flows → `public/tutorials/additional-tutorials.js`
2. Call `tutorials.registerTutorial('your-id', { ... })` with the standard config:
   ```js
   tutorials.registerTutorial('my-feature-tour', {
     version: 1,                     // bump to re-show after meaningful changes
     title: 'My Feature',
     description: 'What this tour does',
     autoStart: false,               // true = auto-run on first visit when targets exist
     dismissible: true,
     steps: [
       {
         element: '[data-tutorial="my-target"]',  // CSS selector — must exist in DOM
         popover: { title: 'Step 1', description: '...', side: 'bottom', align: 'start' }
       },
       // ...more steps
     ],
   });
   ```
3. Make sure every `element` selector resolves at the time the tutorial runs — the engine
   refuses to start when any target is missing (logged as a warning).
4. Trigger from UI by dispatching `new CustomEvent('startTutorial', { detail: { tutorialId: 'my-feature-tour' } })`,
   or call `window.blessboxTutorials.startTutorial('my-feature-tour')` directly.
5. To re-show during development: `window.blessboxTutorials.resetTutorial('my-feature-tour')`.
   To wipe all progress: `window.blessboxTutorials.resetAllTutorials()`.

## Removing the tutorial system

Delete the `<TutorialSystemLoader />` mount in `app/layout.tsx` (or wherever it is
rendered). The `public/tutorials/*.js` files can then be removed; nothing in the
React tree references them.
