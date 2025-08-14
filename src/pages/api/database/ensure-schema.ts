import type { APIRoute } from 'astro';
import { ensureLibsqlSchema } from '../../../database/bootstrap';

export const POST: APIRoute = async ({ request }) => {
  try {
    await ensureLibsqlSchema({});
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'ensure failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};


