/**
 * Test script to verify auto-QR generation
 */

import { getDbClient } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

async function testAutoQRGeneration() {
  const db = getDbClient();

  console.log('\n🧪 Testing Auto-QR Generation Fix\n');
  console.log('=' .repeat(60));

  // 1. Create a test organization
  const orgId = uuidv4();
  const orgName = `Test Auto-QR ${Date.now()}`;
  const now = new Date().toISOString();

  console.log(`\n📝 Step 1: Creating test organization...`);
  await db.execute({
    sql: `INSERT INTO organizations (id, name, contact_email, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [orgId, orgName, `test-${Date.now()}@example.com`, now, now],
  });
  console.log(`   ✅ Organization created: ${orgName} (${orgId})`);

  // 2. Simulate the save-form-config API logic
  console.log(`\n📝 Step 2: Creating form config (simulating save-form-config API)...`);
  
  const formConfigId = uuidv4();
  const formFields = [
    { id: 'firstName', type: 'text', label: 'First Name', required: true },
    { id: 'email', type: 'email', label: 'Email', required: true },
  ];

  await db.execute({
    sql: `INSERT INTO qr_code_sets (id, organization_id, name, language, form_fields, qr_codes, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      formConfigId,
      orgId,
      'Registration Form',
      'en',
      JSON.stringify(formFields),
      JSON.stringify([]), // Start with no QR codes
      1,
      now,
      now,
    ],
  });
  console.log(`   ✅ Form config created (no QR codes yet)`);

  // 3. Now simulate the auto-generation logic
  console.log(`\n📝 Step 3: Auto-generating default QR code...`);
  
  const orgSlug = orgName.toLowerCase().replace(/\s+/g, '-');
  const defaultSlug = 'main-entrance';
  const qrCodeId = uuidv4();
  const baseUrl = 'http://localhost:7777';
  const registrationUrl = `${baseUrl}/register/${orgSlug}/${defaultSlug}`;

  // We'll skip actual QR code image generation for this test
  const defaultQrCode = {
    id: qrCodeId,
    label: defaultSlug,
    slug: defaultSlug,
    url: registrationUrl,
    dataUrl: 'data:image/png;base64,test',
    description: 'Main Entrance',
  };

  await db.execute({
    sql: `UPDATE qr_code_sets SET qr_codes = ?, updated_at = ? WHERE id = ?`,
    args: [JSON.stringify([defaultQrCode]), now, formConfigId],
  });
  console.log(`   ✅ Default QR code generated: ${registrationUrl}`);

  // 4. Verify the QR code exists
  console.log(`\n📝 Step 4: Verifying QR code in database...`);
  
  const result = await db.execute({
    sql: `SELECT qr_codes FROM qr_code_sets WHERE id = ?`,
    args: [formConfigId],
  });

  const qrCodes = JSON.parse((result.rows[0] as any).qr_codes || '[]');
  console.log(`   ✅ QR Codes count: ${qrCodes.length}`);
  
  if (qrCodes.length > 0) {
    console.log(`   ✅ First QR code:`);
    console.log(`      - Label: ${qrCodes[0].label}`);
    console.log(`      - Slug: ${qrCodes[0].slug}`);
    console.log(`      - URL: ${qrCodes[0].url}`);
  }

  // 5. Test if form config can be retrieved
  console.log(`\n📝 Step 5: Testing form config retrieval...`);
  
  const { RegistrationService } = await import('../lib/services/RegistrationService');
  const registrationService = new RegistrationService();
  
  const formConfig = await registrationService.getFormConfig(orgSlug, defaultSlug);
  
  if (formConfig) {
    console.log(`   ✅ Form config retrieved successfully!`);
    console.log(`      - Config ID: ${formConfig.id}`);
    console.log(`      - Organization ID: ${formConfig.organizationId}`);
    console.log(`      - Form Fields: ${formConfig.formFields?.length || 0}`);
    console.log(`      - QR Codes: ${formConfig.qrCodes?.length || 0}`);
  } else {
    console.log(`   ❌ Form config NOT found - registration would fail!`);
  }

  // 6. Cleanup
  console.log(`\n📝 Step 6: Cleaning up test data...`);
  await db.execute({
    sql: `DELETE FROM qr_code_sets WHERE id = ?`,
    args: [formConfigId],
  });
  await db.execute({
    sql: `DELETE FROM organizations WHERE id = ?`,
    args: [orgId],
  });
  console.log(`   ✅ Test data cleaned up`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Auto-QR Generation Test Complete!\n');
}

testAutoQRGeneration().catch(console.error);
