import { NextRequest, NextResponse } from 'next/server';

/**
 * Shared API error helpers.
 *
 * Goals:
 * - Never leak parser internals or DB engine details (e.g. "SQLITE_CONSTRAINT_FOREIGNKEY ...")
 *   to API clients.
 * - Always return a clean JSON shape with a 400 / 500 status as appropriate.
 *
 * Use:
 *   const parsed = await safeParseJson(request);
 *   if (!parsed.ok) return parsed.response;
 *   const body = parsed.body;
 *
 *   try { ... } catch (e) { return internalErrorResponse(e, 'Verify code'); }
 */

export type ParseResult<T = any> =
  | { ok: true; body: T }
  | { ok: false; response: NextResponse };

const SENSITIVE_PATTERNS = [
  /sqlite/i,
  /libsql/i,
  /turso/i,
  /SQLITE_/,
  /FOREIGN KEY/i,
  /UNIQUE constraint/i,
  /no such table/i,
  /no such column/i,
  /Unexpected token/i,
  /JSON/i,
  /at JSON\.parse/i,
];

export function isSensitive(message: string): boolean {
  return SENSITIVE_PATTERNS.some((re) => re.test(message));
}

export function badRequestResponse(error = 'Bad request', extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status: 400 });
}

export function internalErrorResponse(err: unknown, logPrefix?: string) {
  // Log full detail server-side, never leak it to the client.
  if (logPrefix) {
    console.error(`${logPrefix} error:`, err);
  } else {
    console.error('API error:', err);
  }
  return NextResponse.json(
    { success: false, error: 'Internal error' },
    { status: 500 }
  );
}

/**
 * Safely parse JSON from a Next.js request. Returns either the parsed body
 * or a ready-to-return 400 response (never 500, never leaks parser message).
 */
export async function safeParseJson<T = any>(
  request: NextRequest | Request
): Promise<ParseResult<T>> {
  try {
    const body = (await request.json()) as T;
    return { ok: true, body };
  } catch {
    return { ok: false, response: badRequestResponse('Bad request') };
  }
}

/**
 * Map a thrown error into a safe response. If the message looks like a known
 * user-facing validation error, surface it as 400; otherwise return a generic
 * 500 with no engine details.
 */
export function safeErrorResponse(err: unknown, logPrefix?: string): NextResponse {
  const message = err instanceof Error ? err.message : '';
  if (message && !isSensitive(message)) {
    // Heuristic: short, human-readable validation strings are safe to echo.
    if (message.length <= 200 && /^[\w\s.,'"\-:()/!?]+$/.test(message)) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  }
  return internalErrorResponse(err, logPrefix);
}
