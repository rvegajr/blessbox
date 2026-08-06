import { describe, it, expect } from 'vitest';
import { createVerificationEmailTemplate } from './email-templates';

describe('createVerificationEmailTemplate — HTML injection defense', () => {
  it('escapes a malicious organization name in the HTML body', () => {
    const { html } = createVerificationEmailTemplate({
      code: '123456',
      organizationName: `<img src=x onerror=alert(1)>`,
      email: 'a@b.com',
    });
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('123456'); // code still present
  });

  it('escapes a malicious email in the HTML body', () => {
    const { html } = createVerificationEmailTemplate({
      code: '123456',
      organizationName: 'Org',
      email: `<b>x</b>@e.com`,
    });
    expect(html).not.toContain('<b>x</b>@e.com');
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt;@e.com');
  });

  it('leaves the plain-text branch unescaped (no HTML context)', () => {
    const { text } = createVerificationEmailTemplate({
      code: '123456',
      organizationName: 'A & B Ministries',
    });
    expect(text).toContain('A & B Ministries');
  });
});
