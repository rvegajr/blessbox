/**
 * Interactive Clear Production Database Script
 * 
 * Prompts for required values if not in environment
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as readline from 'readline';

config({ path: resolve(process.cwd(), '.env.local') });

import { getDbClient } from '../lib/db';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function getEnvVar(name: string, promptText: string, isSecret = false): Promise<string> {
  const existing = process.env[name];
  if (existing) {
    console.log(`✅ ${name} found in environment`);
    return existing;
  }
  
  const value = await question(`${promptText}: `);
  if (isSecret) {
    console.log(`✅ ${name} set (hidden)`);
  } else {
    console.log(`✅ ${name} set`);
  }
  return value.trim();
}

async function clearProductionDatabase() {
  console.log('\n⚠️  DATABASE CLEAR OPERATION');
  console.log('='.repeat(70));
  
  // Get required values
  const superAdminEmail = await getEnvVar('SUPERADMIN_EMAIL', 'Enter super admin email to preserve');
  const tursoUrl = await getEnvVar('TURSO_DATABASE_URL', 'Enter Turso database URL (libsql://...)');
  const tursoToken = await getEnvVar('TURSO_AUTH_TOKEN', 'Enter Turso auth token', true);
  
  // Set in process.env for getDbClient
  process.env.SUPERADMIN_EMAIL = superAdminEmail;
  process.env.TURSO_DATABASE_URL = tursoUrl;
  process.env.TURSO_AUTH_TOKEN = tursoToken;
  
  console.log('\n' + '='.repeat(70));
  console.log(`Super Admin Email: ${superAdminEmail}`);
  console.log(`Database: ${tursoUrl.substring(0, 40)}...`);
  console.log('This will DELETE all data except the super admin account.');
  console.log('='.repeat(70));
  
  const confirm = await question('\nType "CLEAR" to confirm: ');
  if (confirm !== 'CLEAR') {
    console.log('❌ Cancelled. Database not cleared.');
    rl.close();
    return;
  }
  
  rl.close();
  
  const db = getDbClient();

  try {
    // Step 1: Get super admin user ID (or create if doesn't exist)
    console.log('\n📝 Step 1: Finding/creating super admin...');
    let superAdminResult = await db.execute({
      sql: `SELECT id, email FROM users WHERE email = ?`,
      args: [superAdminEmail],
    });

    let superAdmin: any;
    
    if (superAdminResult.rows.length === 0) {
      console.log(`   ⚠️  Super admin not found, creating new user: ${superAdminEmail}`);
      const newAdminId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      await db.execute({
        sql: `INSERT INTO users (id, email, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))`,
        args: [newAdminId, superAdminEmail],
      });
      superAdmin = { id: newAdminId, email: superAdminEmail };
    } else {
      superAdmin = superAdminResult.rows[0] as any;
    }
    
    console.log(`   ✅ Super admin ready: ${superAdmin.email} (ID: ${superAdmin.id})`);

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
      sql: `SELECT id, email FROM users WHERE id = ?`,
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

    console.log('\n' + '='.repeat(70));
    console.log('✅ DATABASE CLEARED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('\nSuper admin preserved and ready for use.');
    console.log('You can now start fresh with onboarding!\n');

  } catch (error) {
    console.error('\n❌ ERROR during database clear:', error);
    process.exit(1);
  }
}

clearProductionDatabase().catch(console.error);

