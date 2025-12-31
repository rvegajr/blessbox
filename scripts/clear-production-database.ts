/**
 * Clear Production Database (Keep Super Admin)
 * 
 * ⚠️ DANGER: This script clears ALL user data from production
 * 
 * What it does:
 * 1. Preserves super admin user and their data
 * 2. Deletes all other users, organizations, registrations, QR codes
 * 3. Cleans up old verification codes
 * 
 * Usage:
 *   npx tsx scripts/clear-production-database.ts
 * 
 * Requires:
 *   SUPERADMIN_EMAIL environment variable
 */

import { getDbClient } from '../lib/db';

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

async function clearProductionDatabase() {
  if (!SUPERADMIN_EMAIL) {
    console.error('❌ ERROR: SUPERADMIN_EMAIL environment variable not set!');
    console.error('   This is required to preserve the super admin account.');
    process.exit(1);
  }

  const db = getDbClient();

  console.log('\n⚠️  DATABASE CLEAR OPERATION');
  console.log('=' .repeat(70));
  console.log(`Super Admin Email: ${SUPERADMIN_EMAIL}`);
  console.log('This will DELETE all data except the super admin account.');
  console.log('=' .repeat(70));

  try {
    // Step 1: Get super admin user ID
    console.log('\n📝 Step 1: Finding super admin...');
    const superAdminResult = await db.execute({
      sql: `SELECT id, email, role FROM users WHERE email = ?`,
      args: [SUPERADMIN_EMAIL],
    });

    if (superAdminResult.rows.length === 0) {
      console.error(`❌ ERROR: Super admin not found with email ${SUPERADMIN_EMAIL}`);
      process.exit(1);
    }

    const superAdmin = superAdminResult.rows[0] as any;
    console.log(`   ✅ Found super admin: ${superAdmin.email} (ID: ${superAdmin.id})`);

    // Step 2: Get count of data to be deleted
    console.log('\n📊 Step 2: Counting data to be deleted...');
    
    const orgCount = await db.execute({ sql: `SELECT COUNT(*) as count FROM organizations`, args: [] });
    const userCount = await db.execute({ sql: `SELECT COUNT(*) as count FROM users WHERE id != ?`, args: [superAdmin.id] });
    const regCount = await db.execute({ sql: `SELECT COUNT(*) as count FROM registrations`, args: [] });
    const qrSetCount = await db.execute({ sql: `SELECT COUNT(*) as count FROM qr_code_sets`, args: [] });
    const membershipCount = await db.execute({ sql: `SELECT COUNT(*) as count FROM memberships WHERE user_id != ?`, args: [superAdmin.id] });
    
    console.log(`   Organizations: ${(orgCount.rows[0] as any).count}`);
    console.log(`   Users (non-admin): ${(userCount.rows[0] as any).count}`);
    console.log(`   Registrations: ${(regCount.rows[0] as any).count}`);
    console.log(`   QR Code Sets: ${(qrSetCount.rows[0] as any).count}`);
    console.log(`   Memberships (non-admin): ${(membershipCount.rows[0] as any).count}`);

    // Step 3: Delete registrations (must be first due to foreign keys)
    console.log('\n🗑️  Step 3: Deleting registrations...');
    const regDeleted = await db.execute({
      sql: `DELETE FROM registrations`,
      args: [],
    });
    console.log(`   ✅ Deleted ${regDeleted.rowsAffected || 0} registrations`);

    // Step 4: Delete QR code sets
    console.log('\n🗑️  Step 4: Deleting QR code sets...');
    const qrDeleted = await db.execute({
      sql: `DELETE FROM qr_code_sets`,
      args: [],
    });
    console.log(`   ✅ Deleted ${qrDeleted.rowsAffected || 0} QR code sets`);

    // Step 5: Delete memberships (except super admin)
    console.log('\n🗑️  Step 5: Deleting memberships (keeping super admin)...');
    const memberDeleted = await db.execute({
      sql: `DELETE FROM memberships WHERE user_id != ?`,
      args: [superAdmin.id],
    });
    console.log(`   ✅ Deleted ${memberDeleted.rowsAffected || 0} memberships`);

    // Step 6: Delete organizations
    console.log('\n🗑️  Step 6: Deleting organizations...');
    const orgDeleted = await db.execute({
      sql: `DELETE FROM organizations`,
      args: [],
    });
    console.log(`   ✅ Deleted ${orgDeleted.rowsAffected || 0} organizations`);

    // Step 7: Delete users (except super admin)
    console.log('\n🗑️  Step 7: Deleting users (keeping super admin)...');
    const usersDeleted = await db.execute({
      sql: `DELETE FROM users WHERE id != ?`,
      args: [superAdmin.id],
    });
    console.log(`   ✅ Deleted ${usersDeleted.rowsAffected || 0} users`);

    // Step 8: Clean up old verification codes (older than 24 hours)
    console.log('\n🗑️  Step 8: Cleaning old verification codes...');
    const verifyDeleted = await db.execute({
      sql: `DELETE FROM verification_codes WHERE created_at < datetime('now', '-1 day')`,
      args: [],
    });
    console.log(`   ✅ Deleted ${verifyDeleted.rowsAffected || 0} old verification codes`);

    // Step 9: Verify super admin still exists
    console.log('\n✅ Step 9: Verifying super admin...');
    const verifyAdmin = await db.execute({
      sql: `SELECT id, email, role FROM users WHERE id = ?`,
      args: [superAdmin.id],
    });
    
    if (verifyAdmin.rows.length === 0) {
      console.error('❌ ERROR: Super admin was accidentally deleted!');
      process.exit(1);
    }
    
    console.log(`   ✅ Super admin preserved: ${(verifyAdmin.rows[0] as any).email}`);

    // Step 10: Final counts
    console.log('\n📊 Step 10: Final database state...');
    const finalOrgs = await db.execute({ sql: `SELECT COUNT(*) as count FROM organizations`, args: [] });
    const finalUsers = await db.execute({ sql: `SELECT COUNT(*) as count FROM users`, args: [] });
    const finalRegs = await db.execute({ sql: `SELECT COUNT(*) as count FROM registrations`, args: [] });
    
    console.log(`   Organizations: ${(finalOrgs.rows[0] as any).count}`);
    console.log(`   Users: ${(finalUsers.rows[0] as any).count} (should be 1 - super admin only)`);
    console.log(`   Registrations: ${(finalRegs.rows[0] as any).count}`);

    console.log('\n' + '=' .repeat(70));
    console.log('✅ DATABASE CLEARED SUCCESSFULLY');
    console.log('=' .repeat(70));
    console.log('\nSuper admin preserved and ready for use.');
    console.log('You can now start fresh with onboarding!\n');

  } catch (error) {
    console.error('\n❌ ERROR during database clear:', error);
    process.exit(1);
  }
}

// Confirmation prompt
console.log('\n⚠️  WARNING: This will clear the PRODUCTION database!');
console.log('All organizations, users (except super admin), and registrations will be deleted.');
console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

setTimeout(() => {
  clearProductionDatabase().catch(console.error);
}, 5000);
