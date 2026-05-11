import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { isSuperAdminEmail } from '@/lib/auth';
import { getEnv } from '@/lib/utils/env';
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const passwordHash = process.env.SUPERADMIN_PASSWORD_HASH;
  if (!passwordHash) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    if (!isSuperAdminEmail(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const db = getDbClient();
    const normalizedEmail = email.toLowerCase();
    const now = new Date().toISOString();
    const newUserId = uuidv4();

    await db.execute({
      sql: `INSERT INTO users (id, email, created_at, updated_at) VALUES (?, ?, ?, ?) 
            ON CONFLICT(email) DO UPDATE SET updated_at = excluded.updated_at`,
      args: [newUserId, normalizedEmail, now, now],
    });

    const userRow = await db.execute({ sql: `SELECT id FROM users WHERE email = ?`, args: [normalizedEmail] });
    const userId = String((userRow.rows?.[0] as any)?.id || newUserId);

    const jwtSecret = getEnv('NEXTAUTH_SECRET') || getEnv('JWT_SECRET');
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    const token = await new SignJWT({ sub: userId, email, role: 'superadmin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(new TextEncoder().encode(jwtSecret));

    const res = NextResponse.json({ success: true, email, role: 'superadmin' });
    res.cookies.set('bb_session', token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 3600 });
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
