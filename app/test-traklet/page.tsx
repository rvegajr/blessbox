'use client';

export default function TestTrakletPage() {
  const envValue = process.env.NEXT_PUBLIC_TRAKLET_ENABLED;
  
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>Traklet Environment Test</h1>
      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>NEXT_PUBLIC_TRAKLET_ENABLED:</strong></p>
        <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(envValue, null, 2)}
        </pre>
        <p style={{ marginTop: '20px' }}>
          <strong>Expected:</strong> <code>"true"</code>
        </p>
        <p>
          <strong>Actual:</strong> <code>{String(envValue)}</code>
        </p>
        <p style={{ marginTop: '20px' }}>
          <strong>Status:</strong> {envValue === 'true' ? '✅ CORRECT' : `❌ WRONG (got: ${String(envValue)})`}
        </p>
      </div>
    </div>
  );
}
