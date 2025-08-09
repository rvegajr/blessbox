#!/usr/bin/env node

/**
 * BlessBox Environment Setup Script
 * Helps set up environment variables for development and production
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function log(message: string, color: string = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupDevelopmentEnv() {
  log('\n🔧 Setting Up Development Environment', colors.cyan + colors.bold);
  log('=' .repeat(50), colors.cyan);
  
  const envContent = `# BlessBox Development Environment Configuration
# This file is for local development only - DO NOT COMMIT TO GIT
# Generated on: ${new Date().toISOString()}

# ============================================
# DATABASE CONFIGURATION (Turso)
# ============================================
# Using existing Turso database from start.sh
TURSO_DATABASE_URL=libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTQ4ODEzNjQsImlhdCI6MTc1NDI3NjU2NCwiaWQiOiI4MjFmMjdkOS0zNDIzLTQ1YTAtYWFiMy01MzcyNTQ3MjcyNDAiLCJyaWQiOiJiM2MwZjdhYS05YzFjLTQ5NjUtYjgwNi1jZmI0OGEwMTFmZTAifQ.UBi6bacAdcSpA26FIhJgdWhh6Qos4jY5JuSMb3aWJ65gvjFiqAYcCqudtU_ddAko2c0wkd_meGF2x3rrLp_UCw

# ============================================
# EMAIL CONFIGURATION
# ============================================
# For testing without email, use the simple verification endpoint
# Otherwise, configure Gmail or SendGrid below

# Option 1: Gmail (recommended for development)
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=BlessBox Development

# Option 2: SendGrid (uncomment and configure if preferred)
# EMAIL_PROVIDER=sendgrid
# SENDGRID_API_KEY=SG.your-sendgrid-api-key
# SENDGRID_FROM_EMAIL=noreply@yourdomain.com
# SENDGRID_FROM_NAME=BlessBox

# ============================================
# SECURITY CONFIGURATION
# ============================================
# Development JWT secret (auto-generated, change in production)
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}

# ============================================
# PAYMENT CONFIGURATION (Square - Optional)
# ============================================
# Uncomment and configure if using payment features
# SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxxxxxxxxxx
# SQUARE_ACCESS_TOKEN=EAAAxxxxxxxxxxxxxxxxxxxxxxxx
# SQUARE_ENVIRONMENT=sandbox

# ============================================
# APPLICATION CONFIGURATION
# ============================================
PUBLIC_APP_URL=http://localhost:7777
NODE_ENV=development

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_DEBUG_LOGGING=true
ENABLE_EMAIL_LOGGING=true`;

  // Write the file
  const envPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent);
  
  log('✅ Created .env.local file', colors.green);
  log('\n📝 Next steps:', colors.yellow);
  log('1. Edit .env.local and update email configuration:', colors.white);
  log('   - For Gmail: Add your email and app password', colors.white);
  log('   - For SendGrid: Add your API key and verified sender', colors.white);
  log('2. Run: npm run validate:env', colors.white);
  log('3. Start development: npm run dev', colors.white);
}

async function setupProductionEnv() {
  log('\n🚀 Setting Up Production Environment Variables', colors.cyan + colors.bold);
  log('=' .repeat(50), colors.cyan);
  
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch {
    log('❌ Vercel CLI not installed', colors.red);
    log('Install it with: npm i -g vercel', colors.yellow);
    process.exit(1);
  }
  
  log('\n📋 Required Production Variables:', colors.yellow);
  
  const prodVars = [
    { name: 'TURSO_DATABASE_URL', description: 'Production database URL', required: true },
    { name: 'TURSO_AUTH_TOKEN', description: 'Production database token', required: true },
    { name: 'EMAIL_PROVIDER', description: 'Email provider (gmail/sendgrid)', required: true },
    { name: 'JWT_SECRET', description: 'Production JWT secret (32+ chars)', required: true },
    { name: 'PUBLIC_APP_URL', description: 'Production URL (https://yourdomain.com)', required: true },
    { name: 'GMAIL_USER', description: 'Gmail address (if using Gmail)', required: false },
    { name: 'GMAIL_PASS', description: 'Gmail app password (if using Gmail)', required: false },
    { name: 'SENDGRID_API_KEY', description: 'SendGrid API key (if using SendGrid)', required: false },
    { name: 'SENDGRID_FROM_EMAIL', description: 'SendGrid verified sender (if using SendGrid)', required: false },
    { name: 'SQUARE_APPLICATION_ID', description: 'Square app ID (optional)', required: false },
    { name: 'SQUARE_ACCESS_TOKEN', description: 'Square access token (optional)', required: false },
    { name: 'SQUARE_ENVIRONMENT', description: 'Square environment (production)', required: false },
  ];
  
  const setupCommands: string[] = [];
  
  for (const varDef of prodVars) {
    const value = await question(`${varDef.name} (${varDef.description})${varDef.required ? ' [REQUIRED]' : ' [optional]'}: `);
    
    if (value) {
      // Generate command for both production and preview environments
      setupCommands.push(`vercel env add ${varDef.name} production`);
      setupCommands.push(`echo "${value}" | vercel env add ${varDef.name} production`);
      setupCommands.push(`echo "${value}" | vercel env add ${varDef.name} preview`);
    } else if (varDef.required) {
      log(`⚠️  ${varDef.name} is required for production`, colors.yellow);
    }
  }
  
  // Write setup script
  const scriptPath = path.join(process.cwd(), 'scripts', 'setup-vercel-env.sh');
  const scriptContent = `#!/bin/bash
# Vercel Environment Setup Script
# Generated on: ${new Date().toISOString()}

echo "🚀 Setting up Vercel environment variables..."
echo "============================================"

${setupCommands.join('\n')}

echo ""
echo "✅ Environment variables configured!"
echo "🔍 Verify with: vercel env ls"
echo "🚀 Deploy with: vercel --prod"
`;

  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755');
  
  log(`\n✅ Created Vercel setup script: ${scriptPath}`, colors.green);
  log('Run it with: ./scripts/setup-vercel-env.sh', colors.yellow);
}

async function createEnvExample() {
  log('\n📄 Creating .env.example Template', colors.cyan + colors.bold);
  
  const exampleContent = `# BlessBox Environment Configuration Template
# Copy this file to .env.local and fill in your values
# DO NOT commit .env.local to version control

# ============================================
# DATABASE CONFIGURATION (Required)
# ============================================
# Get these from: turso db show <database-name>
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here

# ============================================
# EMAIL CONFIGURATION (Required - Choose One)
# ============================================
EMAIL_PROVIDER=gmail # or 'sendgrid'

# Option 1: Gmail Configuration
# 1. Enable 2FA on your Google account
# 2. Generate app password: https://myaccount.google.com/apppasswords
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password

# Option 2: SendGrid Configuration
# 1. Create account: https://sendgrid.com
# 2. Verify sender identity
# 3. Generate API key with "Mail Send" permission
# SENDGRID_API_KEY=SG.your-api-key-here
# SENDGRID_FROM_EMAIL=noreply@yourdomain.com
# SENDGRID_FROM_NAME=BlessBox

# Common email settings
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=BlessBox

# ============================================
# SECURITY CONFIGURATION (Required)
# ============================================
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# ============================================
# PAYMENT CONFIGURATION (Optional)
# ============================================
# Square payment processing
# Get from: https://developer.squareup.com/apps
SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxxxxxxxxxx
SQUARE_ACCESS_TOKEN=EAAAxxxxxxxxxxxxxxxxxxxxxxxx
SQUARE_ENVIRONMENT=sandbox # or 'production'

# ============================================
# APPLICATION CONFIGURATION
# ============================================
PUBLIC_APP_URL=http://localhost:7777 # https://yourdomain.com in production
NODE_ENV=development # or 'production'

# ============================================
# FEATURE FLAGS (Optional)
# ============================================
ENABLE_DEBUG_LOGGING=false
ENABLE_EMAIL_LOGGING=false`;

  const examplePath = path.join(process.cwd(), '.env.example');
  fs.writeFileSync(examplePath, exampleContent);
  
  log('✅ Created .env.example template', colors.green);
}

async function generateSecureSecret() {
  const secret = crypto.randomBytes(32).toString('hex');
  log('\n🔐 Generated Secure JWT Secret:', colors.green);
  log(secret, colors.yellow);
  log('\nCopy this to your JWT_SECRET environment variable', colors.white);
  return secret;
}

async function main() {
  log('\n🌟 BlessBox Environment Setup Wizard', colors.magenta + colors.bold);
  log('=' .repeat(50), colors.magenta);
  
  const mode = await question(`
Select an option:
1. Set up development environment (.env.local)
2. Set up production environment (Vercel)
3. Create .env.example template
4. Generate secure JWT secret
5. Run environment validation
6. Exit

Enter your choice (1-6): `);

  switch (mode.trim()) {
    case '1':
      await setupDevelopmentEnv();
      break;
    case '2':
      await setupProductionEnv();
      break;
    case '3':
      await createEnvExample();
      break;
    case '4':
      await generateSecureSecret();
      break;
    case '5':
      log('\nRunning environment validation...', colors.cyan);
      execSync('npm run validate:env', { stdio: 'inherit' });
      break;
    case '6':
      log('Goodbye! 👋', colors.cyan);
      break;
    default:
      log('Invalid option', colors.red);
  }
  
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`\n❌ Error: ${error}`, colors.red);
  process.exit(1);
});

// Run the wizard
main().catch(error => {
  log(`\n❌ Setup failed: ${error.message}`, colors.red);
  process.exit(1);
});