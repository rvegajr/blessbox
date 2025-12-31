import { getDbClient } from '../lib/db';

async function checkProductionData() {
  const db = getDbClient();

  // Get all organizations created recently
  const orgsResult = await db.execute({ 
    sql: 'SELECT id, name, contact_email, created_at FROM organizations ORDER BY created_at DESC LIMIT 10', 
    args: [] 
  });

  console.log('\n=== Recent Organizations ===');
  for (const org of orgsResult.rows) {
    const o = org as any;
    console.log(`${o.name} (ID: ${o.id})`);
    console.log(`  Email: ${o.contact_email}`);
    console.log(`  Created: ${o.created_at}`);
    
    // Check QR codes
    const qrSetResult = await db.execute({
      sql: 'SELECT id, qr_codes FROM qr_code_sets WHERE organization_id = ?',
      args: [o.id]
    });
    
    if (qrSetResult.rows.length > 0) {
      const qrRow = qrSetResult.rows[0] as any;
      const qrCodes = JSON.parse(qrRow.qr_codes || '[]');
      console.log(`  QR Codes: ${qrCodes.length}`);
    } else {
      console.log('  QR Codes: NONE (no qr_code_sets)');
    }
    
    // Check registrations
    const regResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM registrations WHERE organization_id = ?',
      args: [o.id]
    });
    const regRow = regResult.rows[0] as any;
    console.log(`  Registrations: ${regRow.count}`);
    console.log('');
  }
  
  // Check total counts
  const totalOrgs = await db.execute({ sql: 'SELECT COUNT(*) as count FROM organizations', args: [] });
  const totalUsers = await db.execute({ sql: 'SELECT COUNT(*) as count FROM users', args: [] });
  const totalRegs = await db.execute({ sql: 'SELECT COUNT(*) as count FROM registrations', args: [] });
  
  console.log('\n=== Database Totals ===');
  console.log(`Total Organizations: ${(totalOrgs.rows[0] as any).count}`);
  console.log(`Total Users: ${(totalUsers.rows[0] as any).count}`);
  console.log(`Total Registrations: ${(totalRegs.rows[0] as any).count}`);
}

checkProductionData().catch(console.error);

