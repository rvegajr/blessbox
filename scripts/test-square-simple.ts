/**
 * Simple Square Token Test
 * Tests using actual SquarePaymentService
 */

// Set environment variables for test
process.env.SQUARE_ACCESS_TOKEN = process.argv[2] || process.env.SQUARE_ACCESS_TOKEN;
process.env.SQUARE_LOCATION_ID = process.argv[3] || process.env.SQUARE_LOCATION_ID || 'LSWR97SDRBXWK';
process.env.SQUARE_APPLICATION_ID = 'sq0idp-ILxW5EBGufGuE1-FsJTpbg';
process.env.SQUARE_ENVIRONMENT = 'production';

import { SquarePaymentService } from '../lib/services/SquarePaymentService';

async function testToken() {
  console.log('=== SIMPLE SQUARE TOKEN TEST ===\n');

  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    console.error('❌ No token provided');
    console.log('Usage: npx tsx scripts/test-square-simple.ts YOUR_TOKEN');
    process.exit(1);
  }

  console.log(`Token: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
  console.log(`Length: ${token.length}`);
  console.log(`Has quotes: ${token.includes('"') ? 'YES ❌' : 'NO ✅'}`);
  console.log(`Has newline: ${token.includes('\\n') || token.includes('\n') ? 'YES ❌' : 'NO ✅'}`);
  console.log('');

  // Try to initialize service
  console.log('Testing SquarePaymentService initialization...');
  try {
    const service = new SquarePaymentService();
    console.log('✅ Service initialized\n');

    // Try to create a payment intent (doesn't actually charge)
    console.log('Testing payment intent creation...');
    const intent = await service.createPaymentIntent(100, 'USD');
    console.log('✅ Payment intent created:', intent.id);
    console.log('');

    console.log('🎉 TOKEN IS VALID!');
    console.log('');
    console.log('✅ Token authenticates correctly');
    console.log('✅ Payment API accessible');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update SQUARE_ACCESS_TOKEN in Vercel (Production environment)');
    console.log(`2. Use this exact token: ${token}`);
    console.log('3. Make sure no quotes or newlines');
    console.log('4. Check "Production" checkbox');
    console.log('5. Save and wait for deployment');
    
  } catch (error: any) {
    console.log('❌ FAILED\n');
    console.log('Error:', error.message);
    
    if (error.message?.includes('401') || error.statusCode === 401) {
      console.log('\n🔴 Token is INVALID or EXPIRED');
      console.log('   → Generate new token in Square Dashboard');
    } else {
      console.log('\nError details:', error);
    }
    process.exit(1);
  }
}

testToken().catch(console.error);

