import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<script>alert('x')&"</script>`)).toBe(
      '&lt;script&gt;alert(&#39;x&#39;)&amp;&quot;&lt;/script&gt;',
    );
  });

  it('treats null/undefined as empty string', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('leaves safe text unchanged', () => {
    expect(escapeHtml('Grace Church 2026')).toBe('Grace Church 2026');
  });
});
