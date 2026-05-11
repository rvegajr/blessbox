'use client';

export default function TestTrakletPage() {
  const envValue = process.env.NEXT_PUBLIC_TRAKLET_ENABLED;
  
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>Traklet Environment Test</h1>
      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>NEXT_PUBLIC_TRAKLET_ENABLED:</strong></p>
        <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          Value: {JSON.stringify(envValue)}
          Type: {typeof envValue}
          Length: {envValue?.length ?? 'undefined'}
          Char codes: {envValue?.split('').map((c: string) => c.charCodeAt(0)).join(', ') ?? 'N/A'}
        </pre>
        <p style={{ marginTop: '20px' }}>
          <strong>Expected:</strong> <code>"true"</code> (string with value "true")
        </p>
        <p>
          <strong>Actual:</strong> <code>{String(envValue)}</code> (type: {typeof envValue})
        </p>
        <p style={{ marginTop: '20px' }}>
          <strong>Comparison Results:</strong>
        </p>
        <ul style={{ marginLeft: '20px' }}>
          <li>envValue === 'true': {String(envValue === 'true')}</li>
          <li>envValue == 'true': {String(envValue == 'true')}</li>
          <li>String(envValue) === 'true': {String(String(envValue) === 'true')}</li>
        </ul>
        <p style={{ marginTop: '20px' }}>
          <strong>Status:</strong> {envValue === 'true' ? '✅ CORRECT' : `❌ WRONG`}
        </p>
      </div>
    </div>
  );
}
