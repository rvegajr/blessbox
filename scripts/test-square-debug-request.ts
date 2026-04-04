#!/usr/bin/env npx tsx
/**
 * Debug Square SDK Request
 * Intercepts the actual HTTP request to see what the SDK sends
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// ONLY load .env.production
config({ path: resolve(process.cwd(), '.env.production') });

// Patch global fetch to intercept requests
const originalFetch = global.fetch;
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  console.log('\n🔍 INTERCEPTED REQUEST:');
  console.log('URL:', input);
  console.log('Method:', init?.method || 'GET');
  console.log('Headers:', JSON.stringify(init?.headers, null, 2));
  console.log('Body:', init?.body);
  
  // Check Authorization header
  const headers = init?.headers as Record<string, string>;
  if (headers?.Authorization || headers?.authorization) {
    const auth = headers.Authorization || headers.authorization;
    console.log('\nAuthorization header analysis:');
    console.log('  Full header:', auth);
    console.log('  Length:', auth.length);
    console.log('  Starts with "Bearer ": ', auth.startsWith('Bearer '));
    const token = auth.replace('Bearer ', '');
    console.log('  Token length:', token.length);
    console.log('  Token first 20:', token.substring(0, 20));
    console.log('  Token last 10:', token.substring(token.length - 10));
  }
  console.log('');

  return originalFetch(input, init);
};

async function test() {
  console.log('Debug Square SDK Request\n');

  const token = process.env.SQUARE_ACCESS_TOKEN!;
  
  const { SquareClient, SquareEnvironment } = await import('square');

  const client = new SquareClient({
    accessToken: token,
    environment: SquareEnvironment.Production,
  });

  console.log('Making API call...');

  try {
    const response = await client.locations.list();
    console.log('\n✅ SUCCESS!');
    console.log('Locations:', response.result?.locations?.map(l => l.name));
  } catch (error: any) {
    console.log('\n❌ FAILED');
    console.log('Status:', error.statusCode);
    console.log('Error:', error.message.substring(0, 200));
  }
}

test();


