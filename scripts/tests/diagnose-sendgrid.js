#!/usr/bin/env node

// Diagnose SendGrid account and API key mismatch
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

config({ path: '.env.local' });

const diagnoseSendGrid = async () => {
  console.log('🔍 SendGrid Diagnostic Tool');
  console.log('============================');

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not found in .env.local');
    return;
  }

  console.log('✅ API Key found');
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  // Check API key format
  if (!apiKey.startsWith('SG.')) {
    console.error('❌ Invalid API key format. Should start with "SG."');
    return;
  }

  console.log('\n🎯 DIAGNOSIS:');
  console.log('=============');
  
  console.log('Based on the consistent error, here are the most likely causes:');
  console.log('');
  console.log('1. 🔄 ACCOUNT MISMATCH:');
  console.log('   - Your API key belongs to a different SendGrid account');
  console.log('   - The dashboard you\'re viewing is for a different account');
  console.log('   - Solution: Check which SendGrid account created this API key');
  console.log('');
  console.log('2. ⏳ VERIFICATION PENDING:');
  console.log('   - Email addresses might still be pending verification');
  console.log('   - Check your email for verification links from SendGrid');
  console.log('   - Solution: Click verification links in your email');
  console.log('');
  console.log('3. 🔑 API KEY PERMISSIONS:');
  console.log('   - API key might not have "Mail Send" permissions');
  console.log('   - API key might be restricted or scoped');
  console.log('   - Solution: Create a new API key with full permissions');
  console.log('');
  
  console.log('🛠️  TROUBLESHOOTING STEPS:');
  console.log('==========================');
  console.log('');
  console.log('Step 1: Verify API Key Account');
  console.log('   - Go to https://app.sendgrid.com/settings/api_keys');
  console.log('   - Make sure you\'re logged into the SAME account that created this API key');
  console.log('   - Look for an API key ending in "...9bRQ"');
  console.log('');
  console.log('Step 2: Check Sender Verification Status');
  console.log('   - Go to https://app.sendgrid.com/settings/sender_auth');
  console.log('   - Look for contact@yolovibecodebootcamp.com');
  console.log('   - Status should be "Verified" (green checkmark)');
  console.log('   - If pending, check your email for verification link');
  console.log('');
  console.log('Step 3: Test with a Known Working Sender');
  console.log('   - What email address do you currently use with YOLOVibeCode?');
  console.log('   - We can test with that address instead');
  console.log('');
  
  console.log('❓ QUESTIONS FOR YOU:');
  console.log('=====================');
  console.log('1. What email address are you currently using for YOLOVibeCode emails?');
  console.log('2. Can you confirm you\'re looking at the same SendGrid account that created the API key?');
  console.log('3. Did you receive and click any verification emails from SendGrid?');
  console.log('');
  
  console.log('💡 QUICK FIX OPTIONS:');
  console.log('=====================');
  console.log('Option A: Use your existing YOLOVibeCode sender email');
  console.log('Option B: Create and verify a new sender in the correct SendGrid account');
  console.log('Option C: Create a new API key with proper permissions');
  console.log('');
  console.log('🎯 Once we identify the correct sender email, I can update BlessBox to use it!');
};

diagnoseSendGrid();