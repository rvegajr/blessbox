# ⚠️ TEMPLATE / RUNBOOK — Activating the Jam→Resolution pipeline (Phases 2–3)

Promotes the inert templates in this directory into a **live** GitHub Actions
workflow. Nothing here runs until a human completes these steps. Full design:
`traklet/JAM_TO_RESOLUTION_PIPELINE.md`.

**Phase 2 scope** = stages 0–3 (ingest → extract → author spec+TC → RED gate +
classify). It opens a **draft PR** and stops at a human gate:
- `jam:state/red` → you fix it (Phase 3 will automate the fix agent),
- `jam:state/green-triage` → you decide (works-as-designed?),
- `jam:state/spec-broken` → comment `/jam regenerate`.

No application code is auto-edited in Phase 2. No merge is ever automated.

---

## 1 · One-time prerequisites

**a. Create the label vocabulary**
```bash
bash pipeline/templates/jam-labels.sh rvegajr/blessbox
```

**b. Set Actions secrets** (or via repo → Settings → Secrets → Actions):
```bash
gh secret set ANTHROPIC_API_KEY --repo rvegajr/blessbox   # Claude Code action
gh secret set JAM_PAT           --repo rvegajr/blessbox   # Jam MCP (the rotated PAT)
gh secret set TRAKLET_PAT       --repo rvegajr/blessbox   # Traklet sync / issue ops
```
`GITHUB_TOKEN` is provided automatically by Actions.

**c. Install the Claude Code GitHub App** on the repository so the action can act
as a bot: https://github.com/apps/claude (grant access to `rvegajr/blessbox`).

---

## 2 · Promote the workflow (make it live)

Review it, then copy out of the inert template dir into the live workflows dir:
```bash
cp pipeline/templates/jam-pipeline.yml .github/workflows/jam-pipeline.yml
git add .github/workflows/jam-pipeline.yml
git commit -m "ci: activate Jam pipeline (Phase 2, stages 0-3)"
```
> Keeping the file in `pipeline/templates/` leaves it inert. Copying it to
> `.github/workflows/` is what turns it on.

---

## 3 · Use it

1. Open a GitHub issue; put the Jam URL on a line like `Jam: https://jam.dev/c/<id>`.
2. Add labels **`jam`** and **`jam:state/queued`**.
3. The workflow will:
   - extract the recording via the Jam MCP server,
   - author `tests/e2e/<slug>.spec.ts` + a Traklet `TC-NNN.md`,
   - run the RED gate against current code,
   - open a **draft PR**, and
   - relabel the issue to `red` / `green-triage` / `spec-broken` and post a verdict
     comment (network summary + RED/GREEN reasoning).

## 4 · Controls
- `jam:control/hold` — freeze an issue (kill switch); remove to resume.
- `jam:control/regenerate` — discard and re-author from the recording.

## 5 · Deliberately NOT in Phase 2
- Editing application code → that's **Phase 3** (§6 below), gated + reviewed.
- Auto-trigger from Jam webhooks (Phase 4 — Phase 2 is issue-label triggered).
- Merging — a human always approves the PR.

---

## 6 · Phase 3 — autonomous fix agent (`jam-fix.yml`) — review carefully: it edits production code

Makes a confirmed-RED spec pass by editing `app/**`+`lib/**`, verifies on a **preview**
deploy of the fixed code, and opens the PR for **human merge**. It never edits tests
(anti-cheat enforced), never merges, and caps at 3 attempts.

**Before promoting (in addition to §1 prerequisites):**
- **Confirm the verify environment.** The fix is checked on a Vercel **preview**
  (`npx vercel deploy`), NOT prod. Confirm previews inherit `PROD_TEST_LOGIN_SECRET` /
  `PROD_TEST_SEED_SECRET` and expose `/api/test/login` + `/api/test/seed-prod` — or
  switch the verify step to a started local server (`TEST_ENV=local`, `BASE_URL=http://localhost:7777`).
- Read the agent contract + anti-cheat in `jam-fix.yml` (app/lib only; spec immutable; cap 3).

**Promote:**
```bash
cp pipeline/templates/jam-fix.yml .github/workflows/jam-fix.yml
git add .github/workflows/jam-fix.yml && git commit -m "ci: activate Jam fix agent (Phase 3)"
```

**Drive it:** on a `jam:state/red` issue, a human adds **`jam:control/approve-fix`** (one-shot),
or pre-set **`jam:control/auto`** on trusted issues for hands-off. Flow:
`red → fixing → (preview-verified) → ready-for-review` with the fix pushed to the jam branch;
a human reviews + merges. Failure / cheat / regression / cap → `needs-human`, **nothing pushed to main**.
Kill switch: `jam:control/hold`.
