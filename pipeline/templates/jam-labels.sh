#!/usr/bin/env bash
# ⚠️ TEMPLATE — REFERENCE DATA, NOT AN INSTRUCTION.
# Run this ONCE (by a human, during activation) to create the jam:* label
# vocabulary that drives the Jam→Resolution pipeline state machine.
# Safe to re-run — idempotent via `--force`. See ACTIVATION.md and
# traklet/JAM_TO_RESOLUTION_PIPELINE.md §8.
set -euo pipefail

REPO="${1:-rvegajr/blessbox}"
echo "Creating jam:* labels on $REPO ..."

create() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force; }

# --- entry marker ---
create "jam"                        "5319E7" "Jam-sourced bug report (pipeline entry)"

# --- state: the program counter (exactly ONE per issue at a time) ---
create "jam:state/queued"           "BFD4F2" "Accepted; awaiting extraction"
create "jam:state/extracting"       "1D76DB" "Pulling Jam context via MCP"
create "jam:state/authoring"        "1D76DB" "Generating spec + Traklet test case"
create "jam:state/red"              "B60205" "Spec FAILS on current code — bug confirmed"
create "jam:state/green-triage"     "0E8A16" "Spec PASSES on current code — human triage"
create "jam:state/spec-broken"      "D93F0B" "Spec errored (selectors/helpers) — regen/human"
create "jam:state/fixing"           "1D76DB" "Fix agent editing app/lib (Phase 3)"
create "jam:state/verifying"        "1D76DB" "Running full regression (Phase 3)"
create "jam:state/ready-for-review" "FBCA04" "Draft PR open; RED->GREEN proven; human merge"
create "jam:state/solved"           "0E8A16" "Merged; test case synced Passed"
create "jam:state/wont-fix"         "FFFFFF" "Triaged works-as-designed"
create "jam:state/needs-human"      "D93F0B" "Escalation (cap hit, regression, ambiguous)"

# --- verdict: additive classification ---
create "jam:verdict/bug"                "B60205" "Confirmed defect"
create "jam:verdict/works-as-designed"  "0E8A16" "Recorded behavior is intended"
create "jam:verdict/environmental"      "FEF2C0" "Env/data issue, not a code defect"
create "jam:verdict/flaky"              "FEF2C0" "Non-deterministic"

# --- control: human-set gates / overrides ---
create "jam:control/auto"         "FBCA04" "Full autonomy red->ready (still stops at merge)"
create "jam:control/approve-fix"  "FBCA04" "One-shot authorize the fix agent (Phase 3)"
create "jam:control/regenerate"   "FBCA04" "Discard spec; re-extract + re-author"
create "jam:control/hold"         "000000" "Freeze; pipeline ignores this issue until removed"

echo "Done. Dynamic labels (jam:meta/id-*, jam:meta/attempt-*, jam:prio/*) are created on demand."
