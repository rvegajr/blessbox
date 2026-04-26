/**
 * Tests for the shared zod-based input validation helper.
 *
 * Locks in the security guarantees from qa-report/07-security.md:
 *   - Malformed body returns 400 with structured error (no stack trace).
 *   - Schema mismatch returns 400 with `error: 'Validation failed'` + flatten().
 *   - Bodies over the size cap are rejected (413) before parsing.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseBody, parseValue, DEFAULT_MAX_BODY_BYTES } from './validate';

const SampleSchema = z.object({
  email: z.string().email(),
  count: z.number().int().min(0),
});

function makeRequest(body: string | Uint8Array, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: body as any,
  });
}

describe('parseBody', () => {
  it('returns parsed data on a valid body', async () => {
    const req = makeRequest(JSON.stringify({ email: 'a@b.com', count: 3 }));
    const result = await parseBody(req, SampleSchema);
    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data.email).toBe('a@b.com');
      expect(result.data.count).toBe(3);
    }
  });

  it('returns 400 with structured error on malformed JSON (no stack trace)', async () => {
    const req = makeRequest('{not json');
    const result = await parseBody(req, SampleSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(400);
      const json = await result.error.json();
      expect(json.error).toBeTruthy();
      // No stack trace, no engine details, no parser internals
      const serialized = JSON.stringify(json).toLowerCase();
      expect(serialized).not.toContain('at jsonparse');
      expect(serialized).not.toContain('syntaxerror');
      expect(serialized).not.toContain('unexpected token');
      expect(serialized).not.toContain('stack');
    }
  });

  it('returns 400 with `Validation failed` + flatten() shape on schema mismatch', async () => {
    const req = makeRequest(JSON.stringify({ email: 'not-an-email', count: -1 }));
    const result = await parseBody(req, SampleSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(400);
      const json = await result.error.json();
      expect(json.error).toBe('Validation failed');
      // flatten() shape: { formErrors: string[], fieldErrors: Record<string, string[]> }
      expect(json.details).toBeTruthy();
      expect(json.details.fieldErrors).toBeTruthy();
      expect(Array.isArray(json.details.fieldErrors.email)).toBe(true);
      // Make sure no stack trace leaked
      expect(JSON.stringify(json).toLowerCase()).not.toContain('stack');
    }
  });

  it('rejects oversize body via Content-Length precheck with 413', async () => {
    // The fetch Request constructor ignores explicit content-length, so we
    // build a synthetic request-like object with our own headers.
    const fakeReq = {
      headers: new Headers({
        'content-type': 'application/json',
        'content-length': String(DEFAULT_MAX_BODY_BYTES + 1),
      }),
      body: null,
    } as unknown as Request;
    const result = await parseBody(fakeReq, SampleSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(413);
    }
  });

  it('rejects oversize streamed body even without Content-Length', async () => {
    const big = 'x'.repeat(2048);
    const req = makeRequest(JSON.stringify({ junk: big }), {});
    // Use a tiny cap to trigger the streaming guard
    const result = await parseBody(req, SampleSchema, { maxBytes: 100 });
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(413);
    }
  });

  it('treats an empty body as `{}` (lets schema decide)', async () => {
    const req = makeRequest('');
    const result = await parseBody(req, SampleSchema);
    // Empty -> {} -> fails schema -> 400 Validation failed
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(400);
      const json = await result.error.json();
      expect(json.error).toBe('Validation failed');
    }
  });
});

describe('parseValue', () => {
  it('validates a parsed value', () => {
    const result = parseValue({ email: 'x@y.io', count: 0 }, SampleSchema);
    expect('data' in result).toBe(true);
  });

  it('returns 400 with `Validation failed` on bad value', async () => {
    const result = parseValue({ email: 'nope', count: 'not-a-number' }, SampleSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(400);
      const json = await result.error.json();
      expect(json.error).toBe('Validation failed');
    }
  });
});
