import type { APIRoute } from 'astro';
import jwt from 'jsonwebtoken';
import { withSecurity } from '../../../middleware/security';
import { createDatabaseConnection, getDatabase } from '../../../database/connection';
import { organizations } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '../../../services/EmailService';

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request, url }) => {
    try {
      const body = await request.json().catch(() => ({}));
      const email = (body?.email || '').toString().trim().toLowerCase();

      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Ensure account exists (same behavior as passwordless code)
      await createDatabaseConnection();
      const db = getDatabase();
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.contactEmail, email))
        .limit(1);

      if (!organization) {
        return new Response(
          JSON.stringify({ success: false, error: 'No account found with this email address' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Build magic token (15m TTL)
      const secret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
      const nonce = crypto.randomUUID();
      const token = jwt.sign(
        { email, typ: 'magic', nonce },
        secret,
        { expiresIn: '15m', issuer: 'blessbox', audience: 'blessbox-users' }
      );

      // Construct absolute link
      const origin = `${url.protocol}//${url.host}`;
      const link = `${origin}/auth/magic?token=${encodeURIComponent(token)}`;

      // Send email via configured provider
      const emailService = EmailService.createFromEnv();
      const subject = 'Your BlessBox sign-in link';
      const text = `Click to sign in: ${link}\nThis link expires in 15 minutes.`;
      const html = `<p>Click to sign in:</p><p><a href="${link}">${link}</a></p><p>This link expires in 15 minutes.</p>`;
      const resp = await emailService.send({ to: email, subject, text, html });

      if (!resp.success) {
        return new Response(
          JSON.stringify({ success: false, error: resp.error || 'Failed to send magic link' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Magic sign-in link sent' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  });
};


