#!/usr/bin/env node

// Interactive Gmail Setup for BlessBox
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const setupGmail = async () => {
  console.log('🚀 BlessBox Gmail Interactive Setup');
  console.log('====================================');
  
  console.log('\n📧 This will configure Gmail SMTP for your BlessBox contact forms.');
  console.log('We\'ll walk through each step together!\n');

  try {
    // Step 1: Get Gmail address
    console.log('🔧 STEP 1: Gmail Address');
    console.log('========================');
    const gmailAddress = await question('What\'s your Gmail address? (e.g., yourname@gmail.com): ');
    
    if (!gmailAddress.includes('@gmail.com')) {
      console.log('❌ Please provide a valid Gmail address ending with @gmail.com');
      process.exit(1);
    }

    console.log(`✅ Gmail address: ${gmailAddress}`);

    // Step 2: Guide through 2-Step Verification
    console.log('\n🔐 STEP 2: 2-Step Verification');
    console.log('===============================');
    console.log('1. Open: https://myaccount.google.com/security');
    console.log('2. Look for "2-Step Verification" under "Signing in to Google"');
    console.log('3. If it says "Off", click it and follow the setup');
    console.log('4. If it says "On", you\'re ready for the next step!');
    
    const has2Step = await question('\nDo you have 2-Step Verification enabled? (y/n): ');
    
    if (has2Step.toLowerCase() !== 'y') {
      console.log('\n⚠️  Please enable 2-Step Verification first, then run this setup again.');
      console.log('It\'s required for App Passwords to work.');
      process.exit(1);
    }

    // Step 3: Guide through App Password
    console.log('\n🔑 STEP 3: Generate App Password');
    console.log('=================================');
    console.log('1. Open: https://myaccount.google.com/apppasswords');
    console.log('2. You might need to sign in again');
    console.log('3. Under "Select app", choose "Mail"');
    console.log('4. Under "Select device", choose "Other (Custom name)"');
    console.log('5. Type: "BlessBox Email System"');
    console.log('6. Click "Generate"');
    console.log('7. Copy the 16-character password (looks like: "abcd efgh ijkl mnop")');
    
    const appPassword = await question('\nPaste your App Password here: ');
    
    if (!appPassword || appPassword.length < 10) {
      console.log('❌ App Password seems too short. Please make sure you copied the full password.');
      process.exit(1);
    }

    console.log('✅ App Password received!');

    // Step 4: Update configuration
    console.log('\n⚙️  STEP 4: Updating BlessBox Configuration');
    console.log('===========================================');
    
    const envContent = `# BlessBox Email Configuration - Gmail SMTP Relay
# Abstracted email system - easily swappable

# Email Provider (gmail or sendgrid)
EMAIL_PROVIDER=gmail

# Gmail Configuration
GMAIL_USER=${gmailAddress}
GMAIL_PASS=${appPassword.replace(/\s/g, '')}

# Email defaults
EMAIL_FROM=${gmailAddress}
EMAIL_FROM_NAME=BlessBox Contact

# Contact form recipient
CONTACT_EMAIL=${gmailAddress}

# SendGrid Configuration (backup - ready to switch)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=contact@yolovibecodebootcamp.com
SENDGRID_FROM_NAME=BlessBox Contact

# Instructions:
# - To switch to SendGrid: change EMAIL_PROVIDER=sendgrid
# - App Password is secure and can be revoked anytime
# - Contact forms will send emails from: ${gmailAddress}`;

    writeFileSync('.env.local', envContent);
    console.log('✅ Configuration saved to .env.local');

    // Step 5: Test the system
    console.log('\n🧪 STEP 5: Test Email System');
    console.log('=============================');
    const runTest = await question('Would you like to send a test email now? (y/n): ');
    
    if (runTest.toLowerCase() === 'y') {
      console.log('\n📤 Running email test...');
      console.log('This will send a test email to rvegajr@darkware.net');
      
      // Import and run the test
      try {
        const { exec } = await import('child_process');
        exec('node test-gmail-system.js', (error, stdout, stderr) => {
          if (error) {
            console.log('❌ Test failed:', error.message);
          } else {
            console.log(stdout);
          }
          rl.close();
        });
      } catch (error) {
        console.log('❌ Could not run test automatically');
        console.log('💡 Run manually: node test-gmail-system.js');
        rl.close();
      }
    } else {
      console.log('\n✅ Setup Complete!');
      console.log('==================');
      console.log('Your BlessBox Gmail integration is ready!');
      console.log('');
      console.log('🧪 To test: node test-gmail-system.js');
      console.log('🌐 Contact form: http://localhost:7777/forms/contact');
      console.log('⚙️  Email testing: http://localhost:7777/email-test');
      console.log('');
      console.log('🔄 To switch providers later:');
      console.log('   Gmail: EMAIL_PROVIDER=gmail');
      console.log('   SendGrid: EMAIL_PROVIDER=sendgrid');
      console.log('');
      console.log('🎉 Happy emailing with BlessBox!');
      rl.close();
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    rl.close();
  }
};

setupGmail();