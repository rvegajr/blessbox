#!/usr/bin/env bash
# Restore blessbox.db from a backup file.
# Usage: scripts/restore-db.sh backups/blessbox-<UTC-timestamp>.db [target-db]
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup-file> [target-db]" >&2
  exit 1
fi

src="$1"
target="${2:-blessbox.db}"

if [[ ! -f "$src" ]]; then
  echo "ERROR: backup file not found: $src" >&2
  exit 1
fi

# Safety: snapshot current target before overwriting
if [[ -f "$target" ]]; then
  ts=$(date -u +%Y%m%dT%H%M%SZ)
  pre="backups/pre-restore-${ts}.db"
  mkdir -p backups
  sqlite3 "$target" ".backup '${pre}'"
  echo "Snapshotted current target to ${pre}"
fi

# Restore by copying the backup file in place
cp "$src" "$target"
echo "Restored ${target} from ${src}"
