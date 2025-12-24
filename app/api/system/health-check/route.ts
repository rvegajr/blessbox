import { NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDbReady();
    const db = getDbClient();
    await db.execute('SELECT 1 as ok;');

    return NextResponse.json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

