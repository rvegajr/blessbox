#!/usr/bin/env bash
# Clean trailing \n from Vercel production env vars.
# Reads .env.fresh (pulled from Vercel), strips trailing \n / whitespace from values,
# removes + re-adds each affected var on Vercel production.
set -uo pipefail

source_file="$1"
errors=0
ok=0

while IFS= read -r line; do
  # skip blanks/comments
  [[ -z "$line" || "$line" == \#* ]] && continue
  # match NAME="value"
  if [[ "$line" =~ ^([A-Z_][A-Z0-9_]*)=\"(.*)\"$ ]]; then
    name="${BASH_REMATCH[1]}"
    raw="${BASH_REMATCH[2]}"
    # strip literal \n (dotenv escape) at end and any trailing whitespace
    clean="${raw%\\n}"
    clean="${clean%[[:space:]]}"
    if [[ "$clean" == "$raw" ]]; then
      continue  # already clean
    fi
    echo "[CLEAN] $name (was len=${#raw}, now len=${#clean})"
    if vercel env rm "$name" production --yes >/dev/null 2>&1; then
      if printf '%s' "$clean" | vercel env add "$name" production >/dev/null 2>&1; then
        ((ok++))
      else
        echo "  FAILED to re-add $name"; ((errors++))
      fi
    else
      echo "  FAILED to rm $name"; ((errors++))
    fi
  fi
done < "$source_file"

echo "=== ok=$ok errors=$errors ==="
exit $errors
