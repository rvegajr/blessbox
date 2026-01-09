#!/usr/bin/env tsx
/**
 * Verify Production Database Schema
 * 
 * Checks if the subscription_plans table has the new cancellation columns.
 */

import { createClient } from '@libsql/client';

async function verifyProductionSchema() {
  console.log('🔍 Verifying Production Database Schema...\n');

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    process.exit(1);
  }

  console.log(`📍 Database: ${url.substring(0, 50)}...`);

  const client = createClient({ url, authToken });

  try {
    // Check subscription_plans table schema
    console.log('\n📊 Checking subscription_plans table schema...\n');
    
    const tableInfo = await client.execute(`PRAGMA table_info('subscription_plans');`);
    
    const columns = (tableInfo.rows as any[]).map((row: any) => ({
      name: row.name,
      type: row.type,
      nullable: row.notnull === 0
    }));

    console.log('Available columns:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.name} (${col.type})${col.nullable ? ' [nullable]' : ''}`);
    });

    // Check for new columns
    const hasCancellationReason = columns.some((col: any) => col.name === 'cancellation_reason');
    const hasCancelledAt = columns.some((col: any) => col.name === 'cancelled_at');

    console.log('\n🎯 New Columns Status:');
    console.log(`  cancellation_reason: ${hasCancellationReason ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  cancelled_at: ${hasCancelledAt ? '✅ EXISTS' : '❌ MISSING'}`);

    if (hasCancellationReason && hasCancelledAt) {
      console.log('\n✅ Production database schema is up to date!');
      
      // Test the UPDATE query that was failing
      console.log('\n🧪 Testing cancellation UPDATE query...');
      
      // Find a test subscription
      const subs = await client.execute({
        sql: `SELECT id, organization_id, plan_type, status 
              FROM subscription_plans 
              WHERE plan_type != 'free' 
              LIMIT 1`
      });

      if (subs.rows.length > 0) {
        const testSub = subs.rows[0] as any;
        console.log(`  Found subscription: ${testSub.id} (${testSub.plan_type})`);
        
        // Try the exact SQL that was failing (in a transaction we'll rollback)
        await client.execute('BEGIN;');
        try {
          await client.execute({
            sql: `UPDATE subscription_plans 
                  SET cancellation_reason = ?, 
                      cancelled_at = ?
                  WHERE id = ?`,
            args: ['test_reason', '2026-01-09T00:00:00Z', testSub.id]
          });
          console.log('  ✅ UPDATE query executed successfully');
          
          // Verify the update
          const check = await client.execute({
            sql: `SELECT cancellation_reason, cancelled_at FROM subscription_plans WHERE id = ?`,
            args: [testSub.id]
          });
          
          const updated = check.rows[0] as any;
          console.log(`  ✅ Verified: cancellation_reason="${updated.cancellation_reason}", cancelled_at="${updated.cancelled_at}"`);
          
        } finally {
          await client.execute('ROLLBACK;');
          console.log('  ↩️  Changes rolled back (test only)');
        }
      } else {
        console.log('  ℹ️  No subscriptions available to test UPDATE query');
      }

      process.exit(0);
    } else {
      console.log('\n❌ Production database schema needs migration!');
      console.log('\nThe migration should run automatically when the app starts.');
      console.log('Try triggering a request to any API endpoint to run migrations.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

verifyProductionSchema();

