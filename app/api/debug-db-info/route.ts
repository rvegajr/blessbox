import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { requireDiagnosticsSecret } from '@/lib/security/diagnosticsAuth';

/**
 * GET /api/debug-db-info
 * Diagnostics-only. Returns NON-SECRET DB health info.
 * Never returns the database URL, auth token, or any other connection secret.
 */
export async function GET(request: NextRequest) {
  const authFailure = requireDiagnosticsSecret(request);
  if (authFailure) return authFailure;

  try {
    const db = getDbClient();
    let healthy = false;
    let tableCount = 0;
    try {
      await db.execute('SELECT 1');
      healthy = true;
      const res = await db.execute(
        "SELECT COUNT(*) as c FROM sqlite_master WHERE type = 'table'"
      );
      tableCount = Number((res.rows[0] as any)?.c ?? 0);
    } catch {
      healthy = false;
    }

    return NextResponse.json({
      success: true,
      driver: '@libsql/client',
      healthy,
      tableCount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'internal error' },
      { status: 500 }
    );
  }
}
