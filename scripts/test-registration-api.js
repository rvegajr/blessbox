#!/usr/bin/env node

import { createClient } from '@libsql/client';

// Test the database connection and queries directly
const client = createClient({
  url: 'file:blessbox.db'
});

async function testRegistrationAPI() {
  console.log('🧪 Testing Registration API components...');
  
  try {
    // Test 1: Check organizations
    console.log('\n1. Testing organizations query...');
    const orgResult = await client.execute({
      sql: `
        SELECT id, name, custom_domain 
        FROM organizations 
        WHERE custom_domain = ? OR LOWER(REPLACE(name, ' ', '-')) = ?
      `,
      args: ['hopefoodbank', 'hopefoodbank']
    });
    
    console.log('Organizations found:', orgResult.rows.length);
    if (orgResult.rows.length > 0) {
      console.log('Organization:', orgResult.rows[0]);
      
      const org = orgResult.rows[0];
      
      // Test 2: Check QR code sets
      console.log('\n2. Testing QR code sets query...');
      const qrSetResult = await client.execute({
        sql: `
          SELECT id, organization_id, name, language, form_fields, qr_codes, is_active
          FROM qr_code_sets 
          WHERE organization_id = ? AND is_active = 1
        `,
        args: [org.id]
      });
      
      console.log('QR code sets found:', qrSetResult.rows.length);
      if (qrSetResult.rows.length > 0) {
        console.log('QR code set:', qrSetResult.rows[0]);
        
        const qrSet = qrSetResult.rows[0];
        const qrCodes = JSON.parse(qrSet.qr_codes);
        
        // Test 3: Check QR code matching
        console.log('\n3. Testing QR code matching...');
        console.log('Available QR codes:', qrCodes.map(qr => qr.label));
        
        const matchingQR = qrCodes.find(qr => qr.label === 'main-entrance');
        console.log('Matching QR code:', matchingQR);
        
        if (matchingQR) {
          console.log('\n✅ All tests passed! The data should work.');
        } else {
          console.log('\n❌ QR code not found. Available labels:', qrCodes.map(qr => qr.label));
        }
      } else {
        console.log('❌ No QR code sets found for organization');
      }
    } else {
      console.log('❌ No organizations found');
    }
    
  } catch (error) {
    console.error('❌ Error testing:', error);
  } finally {
    await client.close();
  }
}

testRegistrationAPI();
