/**
 * Pre-flight guard for destructive scripts.
 *
 * Refuses to proceed unless `backups/` contains at least one `*.db` file
 * modified within the last hour. Bypass with FORCE_NO_BACKUP=1 (e.g. in CI
 * when you've taken a backup out-of-band).
 *
 * Usage (top of script):
 *   import './_require-recent-backup';
 */
import { readdirSync, statSync } from 'fs';
import { resolve } from 'path';

const ONE_HOUR_MS = 60 * 60 * 1000;

export function requireRecentBackup(): void {
  if (process.env.FORCE_NO_BACKUP === '1') {
    console.warn('⚠️  FORCE_NO_BACKUP=1 — skipping recent-backup safety check.');
    return;
  }

  const backupsDir = resolve(process.cwd(), 'backups');
  let entries: string[] = [];
  try {
    entries = readdirSync(backupsDir);
  } catch {
    fail(`No "backups/" directory found at ${backupsDir}.`);
  }

  const now = Date.now();
  const fresh = entries
    .filter((f) => f.endsWith('.db'))
    .map((f) => {
      try {
        return { f, mtime: statSync(resolve(backupsDir, f)).mtimeMs };
      } catch {
        return null;
      }
    })
    .filter((x): x is { f: string; mtime: number } => x !== null)
    .filter((x) => now - x.mtime <= ONE_HOUR_MS)
    .sort((a, b) => b.mtime - a.mtime);

  if (fresh.length === 0) {
    fail(
      `No backup file in backups/ from within the last hour.\n` +
      `   Run:  ./scripts/backup-db.sh\n` +
      `   (or set FORCE_NO_BACKUP=1 to override — discouraged.)`
    );
  }

  console.log(
    `✅ Recent backup found: backups/${fresh[0].f} ` +
    `(${Math.round((now - fresh[0].mtime) / 1000)}s ago)`
  );
}

function fail(msg: string): never {
  console.error(`❌ DESTRUCTIVE SCRIPT BLOCKED: ${msg}`);
  process.exit(1);
}

// Run on import
requireRecentBackup();
