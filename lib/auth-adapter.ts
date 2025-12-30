import type { Adapter, AdapterUser, VerificationToken } from '@auth/core/adapters';
import { v4 as uuidv4 } from 'uuid';
import { getDbClient, nowIso } from '@/lib/db';
import { normalizeEmail } from '@/lib/utils/normalize-email';

type DbRow = Record<string, unknown>;

function mapUserRow(row: DbRow): AdapterUser {
  const email = typeof row.email === 'string' ? row.email : '';
  const emailVerifiedAt = typeof row.email_verified_at === 'string' ? row.email_verified_at : null;
  return {
    id: String(row.id),
    email,
    emailVerified: emailVerifiedAt ? new Date(emailVerifiedAt) : null,
    name: typeof row.name === 'string' ? row.name : null,
    image: typeof row.image === 'string' ? row.image : null,
  };
}

export function createLibsqlAuthAdapter(): Adapter {
  const db = getDbClient();

  return {
    async getUser(id) {
      const res = await db.execute({ sql: `SELECT * FROM users WHERE id = ? LIMIT 1`, args: [String(id)] });
      const row = (res.rows?.[0] as DbRow | undefined) ?? undefined;
      return row ? mapUserRow(row) : null;
    },

    async getUserByEmail(email) {
      const e = normalizeEmail(email);
      if (!e) return null;
      const res = await db.execute({ sql: `SELECT * FROM users WHERE email = ? LIMIT 1`, args: [e] });
      const row = (res.rows?.[0] as DbRow | undefined) ?? undefined;
      return row ? mapUserRow(row) : null;
    },

    async createUser(user) {
      const email = normalizeEmail(user.email);
      if (!email) throw new Error('Email is required');
      
      // Check if user already exists
      const existing = await this.getUserByEmail(email);
      if (existing) {
        // User exists, update and return existing user
        return await this.updateUser({
          ...user,
          id: existing.id,
        });
      }
      
      const id = user.id ? String(user.id) : uuidv4();
      const now = nowIso();
      const emailVerifiedAt = user.emailVerified ? user.emailVerified.toISOString() : null;

      await db.execute({
        sql: `
          INSERT INTO users (id, email, name, image, email_verified_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [id, email, user.name ?? null, user.image ?? null, emailVerifiedAt, now, now],
      });

      return {
        id,
        email,
        name: user.name ?? null,
        image: user.image ?? null,
        emailVerified: user.emailVerified ?? null,
      };
    },

    async updateUser(user) {
      const id = String(user.id);
      const now = nowIso();
      const email = normalizeEmail(user.email);
      const emailVerifiedAt = user.emailVerified ? user.emailVerified.toISOString() : null;

      await db.execute({
        sql: `
          UPDATE users
          SET email = ?, name = ?, image = ?, email_verified_at = ?, updated_at = ?
          WHERE id = ?
        `,
        args: [email, user.name ?? null, user.image ?? null, emailVerifiedAt, now, id],
      });

      const updated = await db.execute({ sql: `SELECT * FROM users WHERE id = ? LIMIT 1`, args: [id] });
      const row = (updated.rows?.[0] as DbRow | undefined) ?? undefined;
      return row ? mapUserRow(row) : { id, email, name: user.name ?? null, image: user.image ?? null, emailVerified: user.emailVerified ?? null };
    },

    async createVerificationToken(token) {
      const now = nowIso();
      const identifier = normalizeEmail(token.identifier);
      const expires = token.expires instanceof Date ? token.expires.toISOString() : new Date(token.expires).toISOString();
      await db.execute({
        sql: `
          INSERT INTO verification_tokens (identifier, token, expires, created_at)
          VALUES (?, ?, ?, ?)
        `,
        args: [identifier, token.token, expires, now],
      });
      return { identifier, token: token.token, expires: new Date(expires) } satisfies VerificationToken;
    },

    async useVerificationToken(params) {
      const identifier = normalizeEmail(params.identifier ?? '');
      const token = String(params.token);
      const res = await db.execute({
        sql: `SELECT identifier, token, expires FROM verification_tokens WHERE identifier = ? AND token = ? LIMIT 1`,
        args: [identifier, token],
      });
      const row = (res.rows?.[0] as DbRow | undefined) ?? undefined;
      if (!row) return null;

      await db.execute({
        sql: `DELETE FROM verification_tokens WHERE identifier = ? AND token = ?`,
        args: [identifier, token],
      });

      const expires = typeof row.expires === 'string' ? new Date(row.expires) : new Date(String(row.expires));
      return { identifier: String(row.identifier), token: String(row.token), expires } satisfies VerificationToken;
    },
  };
}


