import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
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
