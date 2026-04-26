import { NextResponse } from 'next/server';
import type { ZodSchema, ZodError } from 'zod';

/**
 * Shared zod-based input validation helpers.
 *
 * Goals (per qa-report/07-security.md):
 *   - Centralized schema validation across API routes.
 *   - Hard-cap request body size (default 1MB) BEFORE JSON.parse, to avoid
 *     DoS via huge payloads (per qa-report/02-orgs-registrations.md).
 *   - Never leak parser internals, stack traces, or DB engine messages.
 *   - Return a uniform 400 shape: { error: 'Validation failed', details: ... }
 *
 * Usage:
 *   const parsed = await parseBody(req, MySchema);
 *   if ('error' in parsed) return parsed.error;
 *   const { data } = parsed;
 */

export const DEFAULT_MAX_BODY_BYTES = 1024 * 1024; // 1MB

export interface ParseBodyOptions {
  /** Override maximum body size in bytes. Defaults to 1MB. */
  maxBytes?: number;
}

export type ParseBodyResult<T> =
  | { data: T }
  | { error: NextResponse };

function tooLargeResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Payload too large', maxBytes: DEFAULT_MAX_BODY_BYTES },
    { status: 413 }
  );
}

function malformedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Invalid JSON body' },
    { status: 400 }
  );
}

function validationFailedResponse(zErr: ZodError): NextResponse {
  // Use flatten() — gives a clean, structured shape (no stack traces).
  return NextResponse.json(
    { error: 'Validation failed', details: zErr.flatten() },
    { status: 400 }
  );
}

/**
 * Read the request body as text with a hard size cap. Returns null if too big.
 * We read the raw text first so a 50MB body cannot blow up JSON.parse memory.
 */
async function readBoundedText(
  req: Request,
  maxBytes: number
): Promise<{ ok: true; text: string } | { ok: false; tooLarge: true }> {
  // Cheap precheck via Content-Length header. Tolerate request-like mocks
  // in tests that don't expose `.headers`.
  try {
    const lenHeader = req.headers?.get?.('content-length');
    if (lenHeader) {
      const n = Number(lenHeader);
      if (Number.isFinite(n) && n > maxBytes) {
        return { ok: false, tooLarge: true };
      }
    }
  } catch {
    // ignore — fall through to streaming/text fallback
  }

  // Prefer streaming via .body when available; otherwise fall back to
  // .text() / .json() (works with NextRequest mocks that have no
  // ReadableStream body, e.g. unit tests that vi.mock req.json()).
  const body = (req as any).body;
  if (!body || typeof body.getReader !== 'function') {
    try {
      if (typeof (req as any).text === 'function') {
        const text = await (req as any).text();
        if (typeof text === 'string') {
          if (text.length > maxBytes) return { ok: false, tooLarge: true };
          if (text.length > 0) return { ok: true, text };
        }
      }
    } catch {
      // fall through
    }
    try {
      if (typeof (req as any).json === 'function') {
        const obj = await (req as any).json();
        const text = JSON.stringify(obj ?? {});
        if (text.length > maxBytes) return { ok: false, tooLarge: true };
        return { ok: true, text };
      }
    } catch {
      // fall through
    }
    return { ok: true, text: '' };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > maxBytes) {
      try { await reader.cancel(); } catch { /* ignore */ }
      return { ok: false, tooLarge: true };
    }
    chunks.push(value);
  }

  // Concat
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(merged) };
}

/**
 * Parse + validate a JSON request body against a zod schema.
 *
 * On failure returns `{ error: NextResponse }` with status 400 (or 413 for
 * oversize) and a structured body. Never leaks stack traces or engine details.
 */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>,
  opts: ParseBodyOptions = {}
): Promise<ParseBodyResult<T>> {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BODY_BYTES;

  const read = await readBoundedText(req, maxBytes);
  if (!read.ok) {
    return { error: tooLargeResponse() };
  }

  let json: unknown;
  try {
    json = read.text.length === 0 ? {} : JSON.parse(read.text);
  } catch {
    return { error: malformedResponse() };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return { error: validationFailedResponse(result.error) };
  }
  return { data: result.data };
}

/**
 * Validate already-parsed data (e.g. query string params) against a schema.
 */
export function parseValue<T>(
  value: unknown,
  schema: ZodSchema<T>
): ParseBodyResult<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    return { error: validationFailedResponse(result.error) };
  }
  return { data: result.data };
}
