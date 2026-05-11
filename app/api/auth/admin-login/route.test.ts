import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';

describe('/api/auth/admin-login', () => {
  const origEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it('returns 404 when SUPERADMIN_PASSWORD_HASH not set', async () => {
    delete process.env.SUPERADMIN_PASSWORD_HASH;
    
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@blessbox.app', password: 'test' }),
    });
    
    const res = await POST(req as any);
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid input', async () => {
    process.env.SUPERADMIN_PASSWORD_HASH = await bcrypt.hash('test123', 12);
    process.env.SUPERADMIN_EMAIL = 'admin@blessbox.app';
    
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email', password: '' }),
    });
    
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('returns 401 for non-super-admin email', async () => {
    process.env.SUPERADMIN_PASSWORD_HASH = await bcrypt.hash('test123', 12);
    process.env.SUPERADMIN_EMAIL = 'admin@blessbox.app';
    
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'test123' }),
    });
    
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('returns 401 for wrong password', async () => {
    process.env.SUPERADMIN_PASSWORD_HASH = await bcrypt.hash('correct', 12);
    process.env.SUPERADMIN_EMAIL = 'admin@blessbox.app';
    
    const { POST } = await import('./route');
    const req = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@blessbox.app', password: 'wrong' }),
    });
    
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('returns 429 after rate limit exceeded', async () => {
    process.env.SUPERADMIN_PASSWORD_HASH = await bcrypt.hash('test', 12);
    process.env.SUPERADMIN_EMAIL = 'admin@blessbox.app';
    
    const { POST } = await import('./route');
    
    const makeRequest = () => new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      headers: { 'x-forwarded-for': '1.2.3.4' },
      body: JSON.stringify({ email: 'admin@blessbox.app', password: 'wrong' }),
    });
    
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest() as any);
    }
    
    const res = await POST(makeRequest() as any);
    expect(res.status).toBe(429);
  });
});
