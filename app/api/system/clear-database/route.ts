import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for database operations

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@blessbox.app';

/**
 * Authorization check using DIAGNOSTICS_SECRET
 * In non-production, always allowed for testing
 */
function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
  const diagnosticsSecret = process.env.DIAGNOSTICS_SECRET;
  
  return !!diagnosticsSecret && token === diagnosticsSecret;
}

/**
 * POST /api/system/clear-database
 * Clears all production data except super admin
 * Protected by DIAGNOSTICS_SECRET in production
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const db = getDbClient();

  try {
    // Get or create super admin
    let superAdminResult = await db.execute({
      sql: `SELECT id, email FROM users WHERE email = ?`,
      args: [SUPERADMIN_EMAIL],
    });

    let superAdminId: string;
    
    if (superAdminResult.rows.length === 0) {
      const newAdminId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await db.execute({
        sql: `INSERT INTO users (id, email, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`,
        args: [newAdminId, SUPERADMIN_EMAIL],
      });
      superAdminId = newAdminId;
    } else {
      superAdminId = (superAdminResult.rows[0] as any).id;
    }

    // Count before deletion
    const beforeCounts = {
      organizations: ((await db.execute({ sql: `SELECT COUNT(*) as count FROM organizations`, args: [] })).rows[0] as any).count,
      users: ((await db.execute({ sql: `SELECT COUNT(*) as count FROM users WHERE id != ?`, args: [superAdminId] })).rows[0] as any).count,
      registrations: ((await db.execute({ sql: `SELECT COUNT(*) as count FROM registrations`, args: [] })).rows[0] as any).count,
      qrCodeSets: ((await db.execute({ sql: `SELECT COUNT(*) as count FROM qr_code_sets`, args: [] })).rows[0] as any).count,
      memberships: ((await db.execute({ sql: `SELECT COUNT(*) as count FROM memberships WHERE user_id != ?`, args: [superAdminId] })).rows[0] as any).count,
    };

    // Delete in proper order (respecting foreign keys)
    await db.execute({ sql: `DELETE FROM registrations`, args: [] });
    await db.execute({ sql: `DELETE FROM qr_code_sets`, args: [] });
    await db.execute({ sql: `DELETE FROM memberships WHERE user_id != ?`, args: [superAdminId] });
    await db.execute({ sql: `DELETE FROM organizations`, args: [] });
    await db.execute({ sql: `DELETE FROM users WHERE id != ?`, args: [superAdminId] });
    await db.execute({ sql: `DELETE FROM verification_codes WHERE created_at < datetime('now', '-1 hour')`, args: [] });

    // Count after deletion
    const afterCounts = {
      organizations: ((await db.execute({ sql: `SELECT COUNT(*) as count FROM organizations`, args: [] })).rows[0] as any).count,
      users: ((await db.execute({ sql: `SELECT COUNT(*) as count FROM users`, args: [] })).rows[0] as any).count,
      registrations: ((await db.execute({ sql: `SELECT COUNT(*) as count FROM registrations`, args: [] })).rows[0] as any).count,
    };

    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      superAdmin: { id: superAdminId, email: SUPERADMIN_EMAIL },
      deleted: beforeCounts,
      remaining: afterCounts,
    });
  } catch (error) {
    console.error('Database clear error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Database clear failed';
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT');
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        hint: isTimeout 
          ? 'Operation timed out. Database may be large. Try clearing tables individually or contact support.'
          : 'Check server logs for details. Ensure database connection is stable.',
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}

