/**
 * Guards against test/seed tooling accidentally running against the production
 * database. Self-contained (reads process.env directly) so it works from Vitest
 * setup, tsx scripts, and plain node scripts alike.
 */

/** Heuristic: does this DB URL point at a production database? */
export function looksLikeProductionDb(url: string | undefined | null): boolean {
  return /prod/i.test(url || '');
}

/**
 * Throw if the active TURSO_DATABASE_URL looks like production. Use in any
 * test/seed helper that must NEVER touch real data.
 */
export function assertNonProductionDatabase(context = 'this operation'): void {
  const url = process.env.TURSO_DATABASE_URL || '';
  if (looksLikeProductionDb(url)) {
    throw new Error(
      `[db-safety] Refusing to run ${context} against a production-looking database ` +
        `(TURSO_DATABASE_URL contains "prod"). Point at a throwaway DB (file:./test.db or :memory:).`,
    );
  }
}
