#!/usr/bin/env bash
#
# Promote / back-sync between environment branches using the gh CLI's own auth.
#
# Why local gh instead of a GitHub Actions workflow: a PR opened by Actions'
# default GITHUB_TOKEN does NOT trigger the gate workflows (GitHub's recursion
# guard), so its checks would never run. The gh CLI authenticates as YOU (a real
# user token), so the PRs it opens trigger validate/security-scan/smoke/gitleaks
# normally — no stored PAT secret required.
#
# Forward flow:  develop → uat → main.  Back-sync brings a straight-to-main
# hotfix down to uat + develop.  Every PR is gated; a human merges it.
#
# Usage:
#   npm run promote                 # forward: open the next promotion PR(s)
#   npm run promote:backsync        # open main→uat and main→develop (if behind)
#   scripts/promote.sh develop uat  # open a specific promotion PR
#
set -uo pipefail

# ensure_pr <from> <to> <title> — open a from→to PR only when their trees
# actually differ (content, not merge-commit topology) and none is already open.
ensure_pr() {
  local from="$1" to="$2" title="$3"
  git fetch -q origin "$from" "$to" || { echo "· $title: fetch failed"; return 0; }
  if git diff --quiet "origin/$to" "origin/$from"; then
    echo "· $title: origin/$to and origin/$from are content-identical — nothing to promote."
    return 0
  fi
  local existing
  existing=$(gh pr list --base "$to" --head "$from" --state open --json number --jq '.[0].number' 2>/dev/null || true)
  if [ -n "${existing:-}" ]; then
    echo "· $title: PR #$existing already open (updates as $from advances) → https://github.com/${GH_REPO:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}/pull/$existing"
    return 0
  fi
  local ahead
  ahead=$(git rev-list --count "origin/$to..origin/$from" 2>/dev/null || echo '?')
  gh pr create --base "$to" --head "$from" --title "$title" \
    --body "$(printf 'Automated promotion via gh CLI. %s commit(s) ahead of %s.\n\nMerge once the gate checks are green to advance the environment.' "$ahead" "$to")" \
    && echo "· $title: opened." \
    || echo "· $title: could not open PR"
}

case "${1:-auto}" in
  --backsync|backsync)
    ensure_pr main uat     "Back-sync: main → uat"
    ensure_pr main develop "Back-sync: main → develop"
    ;;
  auto|forward)
    ensure_pr develop uat  "Promote: develop → uat"
    ensure_pr uat     main "Promote: uat → main"
    ;;
  -h|--help)
    grep '^#' "$0" | sed 's/^# \{0,1\}//'
    ;;
  *)
    from="${1:?usage: promote.sh <from> <to>}"; to="${2:?usage: promote.sh <from> <to>}"
    ensure_pr "$from" "$to" "Promote: $from → $to"
    ;;
esac
