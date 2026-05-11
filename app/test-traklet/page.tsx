'use client';

import { sanitizePublicEnv, getPublicEnvBoolean } from '@/lib/utils/env';

/**
 * Diagnostic page for client-side NEXT_PUBLIC_* env-var sanitization.
 * Visit at /test-traklet to confirm the value the bundler inlined and how it
 * behaves after passing through the sanitizer.
 */
export default function TestTrakletPage() {
  const raw = process.env.NEXT_PUBLIC_TRAKLET_ENABLED;
  const sanitized = sanitizePublicEnv(raw, 'NEXT_PUBLIC_TRAKLET_ENABLED');
  const enabled = getPublicEnvBoolean(raw, 'NEXT_PUBLIC_TRAKLET_ENABLED');
  const charCodes = (raw ?? '')
    .split('')
    .map((c) => c.charCodeAt(0))
    .join(', ');

  const row = (label: string, value: string) => (
    <tr>
      <td style={{ padding: '6px 12px', fontWeight: 600, verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '6px 12px' }}>
        <code>{value}</code>
      </td>
    </tr>
  );

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        maxWidth: 720,
      }}
      data-testid="traklet-env-diagnostic"
    >
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>
        NEXT_PUBLIC_TRAKLET_ENABLED diagnostic
      </h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Compares the raw inlined value against the sanitized value used by the
        Traklet widget. Any mismatch here means the env var needs cleanup.
      </p>

      <table
        style={{
          width: '100%',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          borderCollapse: 'separate',
          borderSpacing: 0,
        }}
      >
        <tbody>
          {row('Raw (typeof)', typeof raw)}
          {row('Raw JSON', JSON.stringify(raw))}
          {row('Raw length', String((raw ?? '').length))}
          {row('Char codes', charCodes || '(empty)')}
          {row('Sanitized', JSON.stringify(sanitized))}
          {row('Boolean (helper)', String(enabled))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 8,
          background: enabled ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${enabled ? '#10b981' : '#ef4444'}`,
        }}
        data-testid={enabled ? 'traklet-status-enabled' : 'traklet-status-disabled'}
      >
        <strong>Status:</strong>{' '}
        {enabled
          ? 'OK — Traklet widget is enabled and will render in the top-right.'
          : 'Disabled — set NEXT_PUBLIC_TRAKLET_ENABLED=true.'}
      </div>

      {raw && raw !== sanitized && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 8,
            background: '#fffbeb',
            border: '1px solid #f59e0b',
          }}
        >
          <strong>Note:</strong> The raw value contained whitespace, quotes, or
          newlines. The sanitizer cleaned it (and emitted a structured{' '}
          <code>[env]</code> warning to the console). Fix the underlying env
          var to remove this warning.
        </div>
      )}
    </div>
  );
}
