#!/usr/bin/env tsx

import { config } from 'dotenv';
import { ensureDbReady } from '../../lib/db-ready';
import { getDbClient } from '../../lib/db';
import { EmailService } from '../../lib/services/EmailService';
import { v4 as uuidv4 } from 'uuid';

config({ path: '.env.local' });

async function main() {
  const to = process.env.TEST_EMAIL_TO || process.env.EMAIL_TEST_TO || process.env.SENDGRID_TEST_TO || '';
  if (!to) {
    throw new Error('Set TEST_EMAIL_TO (or EMAIL_TEST_TO) to a real recipient email');
  }

  await ensureDbReady();
  const db = getDbClient();

  // Ensure a test organization exists
  const orgId = process.env.TEST_ORG_ID || 'org-email-test';
  const orgName = process.env.TEST_ORG_NAME || 'BlessBox Email Test Org';
  const orgEmail = process.env.TEST_ORG_CONTACT_EMAIL || 'email-test@example.com';

  await db.execute({
    sql: `INSERT OR IGNORE INTO organizations (id, name, contact_email, email_verified, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [orgId, orgName, orgEmail, 1, new Date().toISOString(), new Date().toISOString()],
  });

  // Send a real email using the configured provider (SendGrid or SMTP)
  const emailService = new EmailService();

  // Make sure templates exist
  await emailService.ensureDefaultTemplates(orgId);

  const result = await emailService.sendEmail(orgId, to, 'admin_notification', {
    organization_name: orgName,
    event_type: 'email_system_test',
    registration_id: uuidv4(),
    recipient_name: 'Tester',
  });

  if (!result.success) {
    throw new Error(result.error || 'Email send failed');
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Sent email to ${to}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('❌ Email test failed:', e);
  process.exit(1);
});

