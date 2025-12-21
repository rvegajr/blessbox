import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      success: true, 
      env: {
        TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || 'not set',
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL || 'not set'
      },
      message: 'Environment info'
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
