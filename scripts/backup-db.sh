#!/usr/bin/env bash
# Local SQLite backup of blessbox.db -> backups/blessbox-<UTC-timestamp>.db
set -euo pipefail

cd "$(dirname "$0")/.."

DB="${1:-blessbox.db}"
if [[ ! -f "$DB" ]]; then
  echo "ERROR: database file not found: $DB" >&2
  exit 1
fi

ts=$(date -u +%Y%m%dT%H%M%SZ)
out="backups/blessbox-${ts}.db"
mkdir -p backups
sqlite3 "$DB" ".backup '${out}'"
echo "Backed up to ${out}"
