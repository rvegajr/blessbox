/**
 * Debug script to check QR code → registration flow
 * Tests:
 * 1. Organization slug generation
 * 2. QR code data structure
 * 3. Form config retrieval
 * 4. Registration submission
 */

import { getDbClient } from '../lib/db';
import { RegistrationService } from '../lib/services/RegistrationService';

async function debugQRFlow() {
  const db = getDbClient();
  const registrationService = new RegistrationService();

  console.log('\n🔍 DEBUG: QR Code → Registration Flow\n');
  console.log('=' .repeat(60));

  try {
    // 1. Get all organizations
    const orgsResult = await db.execute({
      sql: `SELECT id, name, custom_domain, created_at FROM organizations ORDER BY created_at DESC LIMIT 5`,
      args: [],
    });

    console.log(`\n📊 Recent Organizations (${orgsResult.rows.length}):`);
    for (const org of orgsResult.rows) {
      const o = org as any;
      console.log(`  - ID: ${o.id}`);
      console.log(`    Name: ${o.name}`);
      console.log(`    Custom Domain: ${o.custom_domain || 'NOT SET'}`);
      console.log(`    Created: ${o.created_at}`);
      
      // Calculate what the slug would be
      const slugFromName = (o.name || '').toLowerCase().replace(/\s+/g, '-');
      console.log(`    Expected Slug: ${slugFromName}`);
      
      // 2. Check QR code sets for this org
      const qrSetsResult = await db.execute({
        sql: `SELECT id, name, qr_codes, is_active FROM qr_code_sets WHERE organization_id = ?`,
        args: [o.id],
      });

      if (qrSetsResult.rows.length === 0) {
        console.log(`    ⚠️  NO QR CODE SETS FOUND`);
        continue;
      }

      for (const set of qrSetsResult.rows) {
        const s = set as any;
        console.log(`\n    QR Code Set: ${s.name} (${s.is_active ? 'ACTIVE' : 'INACTIVE'})`);
        
        let qrCodes = [];
        try {
          qrCodes = JSON.parse(s.qr_codes || '[]');
        } catch {
          console.log(`      ❌ ERROR: Failed to parse QR codes JSON`);
          continue;
        }

        console.log(`      QR Codes: ${qrCodes.length}`);
        for (const qr of qrCodes) {
          console.log(`        - Label: ${qr.label || 'NOT SET'}`);
          console.log(`          Slug: ${qr.slug || 'NOT SET'}`);
          console.log(`          URL: ${qr.url || 'NOT SET'}`);
          
          // Extract orgSlug and qrLabel from URL
          const urlMatch = qr.url?.match(/\/register\/([^\/]+)\/([^\/\?]+)/);
          if (urlMatch) {
            const [, urlOrgSlug, urlQrLabel] = urlMatch;
            console.log(`          URL Parts: orgSlug="${urlOrgSlug}", qrLabel="${urlQrLabel}"`);
            
            // 3. Test form config retrieval
            console.log(`\n          🧪 Testing getFormConfig("${urlOrgSlug}", "${urlQrLabel}")...`);
            const formConfig = await registrationService.getFormConfig(urlOrgSlug, urlQrLabel);
            
            if (formConfig) {
              console.log(`          ✅ Form config found!`);
              console.log(`             - Config ID: ${formConfig.id}`);
              console.log(`             - Org ID: ${formConfig.organizationId}`);
              console.log(`             - Fields: ${formConfig.formFields?.length || 0}`);
              console.log(`             - QR Codes in config: ${formConfig.qrCodes?.length || 0}`);
            } else {
              console.log(`          ❌ Form config NOT FOUND`);
              console.log(`             This QR code will NOT work!`);
              
              // Debug why it failed
              console.log(`\n          🔍 Debugging why form config failed:`);
              
              // Check org lookup
              const orgLookup = await db.execute({
                sql: `SELECT id, name, custom_domain FROM organizations 
                      WHERE custom_domain = ? OR LOWER(REPLACE(name, ' ', '-')) = ?`,
                args: [urlOrgSlug, urlOrgSlug],
              });
              console.log(`             Org lookup result: ${orgLookup.rows.length} rows`);
              if (orgLookup.rows.length > 0) {
                console.log(`             Found org: ${(orgLookup.rows[0] as any).name}`);
              } else {
                console.log(`             ❌ Organization not found with slug "${urlOrgSlug}"`);
              }
            }
          } else {
            console.log(`          ⚠️  Could not parse URL`);
          }
        }
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }

  console.log('=' .repeat(60));
  console.log('\n✅ Debug complete\n');
}

debugQRFlow().catch(console.error);
