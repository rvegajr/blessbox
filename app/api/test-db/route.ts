import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { ensureDbReady } from '@/lib/db-ready';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // This endpoint is only for local/dev troubleshooting. In production it should not be callable.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  try {
    await ensureDbReady();
    const db = getDbClient();
    
    // Test simple query
    const result = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM organizations',
      args: []
    });
    
    return NextResponse.json({ 
      success: true, 
      count: result.rows[0]?.count,
      message: 'Database connection working'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
