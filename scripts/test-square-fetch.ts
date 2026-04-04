#!/usr/bin/env npx tsx
/**
 * Raw Fetch Square API Test
 * Bypasses SDK entirely to isolate the issue
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// ONLY load .env.production
config({ path: resolve(process.cwd(), '.env.production') });

async function testWithFetch() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     RAW FETCH SQUARE API TEST                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const token = process.env.SQUARE_ACCESS_TOKEN;
  
  console.log('Token from env:');
  console.log(`  Raw: "${token}"`);
  console.log(`  Length: ${token?.length}`);
  console.log(`  First 20: ${token?.substring(0, 20)}`);
  console.log(`  Last 10: ${token?.substring((token?.length || 0) - 10)}`);
  console.log('');

  // Check for hidden chars
  if (token) {
    const hasWeirdChars = /[^\x20-\x7E]/.test(token.replace(/\n$/, ''));
    console.log(`  Has non-printable chars: ${hasWeirdChars}`);
    
    // Show char codes
    console.log('  Char codes (last 15):');
    for (let i = Math.max(0, token.length - 15); i < token.length; i++) {
      console.log(`    [${i}] '${token[i]}' = ${token.charCodeAt(i)}`);
    }
  }
  console.log('');

  console.log('🔄 Making raw fetch request...\n');

  try {
    const response = await fetch('https://connect.squareup.com/v2/locations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token?.trim()}`,
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCCESS with raw fetch!');
    } else {
      console.log('\n❌ FAILED with raw fetch');
    }
  } catch (error: any) {
    console.log('Fetch error:', error.message);
  }
}

testWithFetch();


