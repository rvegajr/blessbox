#!/usr/bin/env node

/**
 * BlessBox Environment Validation Script
 * Run this before deployment to ensure all requirements are met
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

// Types
interface ValidationResult {
  valid: boolean;
  message: string;
  level: 'error' | 'warning' | 'info';
}

interface ServiceCheck {
  name: string;
  check: () => Promise<ValidationResult>;
  required: boolean;
}

// ANSI color codes for terminal output
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

// Helper functions
function log(message: string, color: string = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log();
  log('═'.repeat(60), colors.cyan);
  log(`  ${title}`, colors.cyan + colors.bold);
  log('═'.repeat(60), colors.cyan);
  console.log();
}

function logResult(name: string, result: ValidationResult, required: boolean = true) {
  const icon = result.valid ? '✅' : result.level === 'warning' ? '⚠️ ' : '❌';
  const color = result.valid ? colors.green : result.level === 'warning' ? colors.yellow : colors.red;
  const requiredTag = required ? ' [REQUIRED]' : ' [OPTIONAL]';
  
  log(`${icon} ${name}${requiredTag}`, color);
  log(`   ${result.message}`, color);
}

// Validation functions
async function checkEnvFile(): Promise<ValidationResult> {
  const envFiles = ['.env.local', '.env'];
  const found = envFiles.find(file => fs.existsSync(file));
  
  if (found) {
    return {
      valid: true,
      message: `Environment file found: ${found}`,
      level: 'info'
    };
  }
  
  return {
    valid: false,
    message: 'No environment file found. Create .env.local with your configuration.',
    level: 'error'
  };
}

async function checkDatabase(): Promise<ValidationResult> {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  
  if (!url || !token) {
    return {
      valid: false,
      message: 'Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN',
      level: 'error'
    };
  }
  
  if (!url.startsWith('libsql://')) {
    return {
      valid: false,
      message: 'TURSO_DATABASE_URL should start with libsql://',
      level: 'error'
    };
  }
  
  // Try to connect
  try {
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url, authToken: token });
    await client.execute('SELECT 1');
    
    return {
      valid: true,
      message: `Connected to database: ${url.split('.')[0]}...`,
      level: 'info'
    };
  } catch (error) {
    return {
      valid: false,
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      level: 'error'
    };
  }
}

async function checkEmailService(): Promise<ValidationResult> {
  const provider = process.env.EMAIL_PROVIDER || 'gmail';
  
  if (provider === 'gmail') {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;
    
    if (!user || !pass) {
      return {
        valid: false,
        message: 'Gmail configuration missing GMAIL_USER or GMAIL_PASS',
        level: 'error'
      };
    }
    
    if (!user.includes('@')) {
      return {
        valid: false,
        message: 'GMAIL_USER should be a valid email address',
        level: 'error'
      };
    }
    
    if (pass.length < 16) {
      return {
        valid: false,
        message: 'GMAIL_PASS appears invalid. Use an App Password (16 characters)',
        level: 'warning'
      };
    }
    
    return {
      valid: true,
      message: `Gmail configured for ${user}`,
      level: 'info'
    };
  } else if (provider === 'sendgrid') {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      return {
        valid: false,
        message: 'SendGrid configuration missing SENDGRID_API_KEY',
        level: 'error'
      };
    }
    
    if (!apiKey.startsWith('SG.')) {
      return {
        valid: false,
        message: 'SENDGRID_API_KEY should start with "SG."',
        level: 'error'
      };
    }
    
    return {
      valid: true,
      message: 'SendGrid API key configured',
      level: 'info'
    };
  }
  
  return {
    valid: false,
    message: `Unknown email provider: ${provider}`,
    level: 'error'
  };
}

async function checkJWT(): Promise<ValidationResult> {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    return {
      valid: false,
      message: 'JWT_SECRET is not set',
      level: 'error'
    };
  }
  
  if (secret.length < 32) {
    return {
      valid: false,
      message: `JWT_SECRET is too short (${secret.length} chars). Use at least 32 characters.`,
      level: 'warning'
    };
  }
  
  return {
    valid: true,
    message: 'JWT secret configured',
    level: 'info'
  };
}

async function checkSquare(): Promise<ValidationResult> {
  const appId = process.env.SQUARE_APPLICATION_ID;
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const env = process.env.SQUARE_ENVIRONMENT || 'sandbox';
  
  if (!appId || !token) {
    return {
      valid: true, // Optional service
      message: 'Square not configured (payment processing unavailable)',
      level: 'warning'
    };
  }
  
  if (!['sandbox', 'production'].includes(env)) {
    return {
      valid: false,
      message: 'SQUARE_ENVIRONMENT must be "sandbox" or "production"',
      level: 'error'
    };
  }
  
  return {
    valid: true,
    message: `Square configured for ${env} environment`,
    level: 'info'
  };
}

async function checkAppUrl(): Promise<ValidationResult> {
  const url = process.env.PUBLIC_APP_URL;
  
  if (!url) {
    return { valid: false, message: 'PUBLIC_APP_URL is not set', level: 'error' };
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      valid: false,
      message: 'PUBLIC_APP_URL should start with http:// or https://',
      level: 'error'
    };
  }
  
  return {
    valid: true,
    message: `App URL: ${url}`,
    level: 'info'
  };
}

async function checkNextAuth(): Promise<ValidationResult> {
  const url = (process.env.NEXTAUTH_URL || '').trim();
  const secret = (process.env.NEXTAUTH_SECRET || '').trim();
  const appUrl = (process.env.PUBLIC_APP_URL || '').trim();
  const env = process.env.NODE_ENV || 'development';

  if (!url) return { valid: false, message: 'NEXTAUTH_URL is not set', level: 'error' };
  if (!secret) return { valid: false, message: 'NEXTAUTH_SECRET is not set', level: 'error' };

  try {
    // Validate it parses and is absolute
    // eslint-disable-next-line no-new
    new URL(url);
  } catch {
    return { valid: false, message: 'NEXTAUTH_URL must be a valid absolute URL (http/https)', level: 'error' };
  }

  if (env !== 'production') {
    if (url.includes('blessbox.org')) {
      return { valid: false, message: `NEXTAUTH_URL points to production (${url}) in ${env}`, level: 'error' };
    }
  }

  if (appUrl) {
    try {
      const u1 = new URL(url);
      const u2 = new URL(appUrl);
      if (u1.origin !== u2.origin) {
        return {
          valid: false,
          message: `NEXTAUTH_URL origin (${u1.origin}) must match PUBLIC_APP_URL origin (${u2.origin})`,
          level: 'error',
        };
      }
    } catch {
      // ignore; checkAppUrl handles PUBLIC_APP_URL format
    }
  }

  return { valid: true, message: `NextAuth configured: ${url}`, level: 'info' };
}

async function checkNodeVersion(): Promise<ValidationResult> {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (major < 18) {
    return {
      valid: false,
      message: `Node.js ${nodeVersion} detected. Version 18+ required.`,
      level: 'error'
    };
  }
  
  return {
    valid: true,
    message: `Node.js ${nodeVersion}`,
    level: 'info'
  };
}

async function checkDependencies(): Promise<ValidationResult> {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  if (!fs.existsSync(packageJsonPath)) {
    return {
      valid: false,
      message: 'package.json not found',
      level: 'error'
    };
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    return {
      valid: false,
      message: 'node_modules not found. Run: npm install',
      level: 'error'
    };
  }
  
  // Check if package-lock.json is in sync
  const lockPath = path.join(process.cwd(), 'package-lock.json');
  if (!fs.existsSync(lockPath)) {
    return {
      valid: true,
      message: 'Dependencies installed (no lock file)',
      level: 'warning'
    };
  }
  
  return {
    valid: true,
    message: 'Dependencies installed',
    level: 'info'
  };
}

// Main validation runner
async function runValidation() {
  logSection('BlessBox Environment Validation');
  
  const checks: ServiceCheck[] = [
    { name: 'Node.js Version', check: checkNodeVersion, required: true },
    { name: 'Dependencies', check: checkDependencies, required: true },
    { name: 'Environment File', check: checkEnvFile, required: true },
    { name: 'Database (Turso)', check: checkDatabase, required: true },
    { name: 'Email Service', check: checkEmailService, required: true },
    { name: 'JWT Configuration', check: checkJWT, required: true },
    { name: 'NextAuth Configuration', check: checkNextAuth, required: true },
    { name: 'Payment (Square)', check: checkSquare, required: false },
    { name: 'App URL', check: checkAppUrl, required: true },
  ];
  
  let hasErrors = false;
  let hasWarnings = false;
  
  for (const service of checks) {
    const result = await service.check();
    logResult(service.name, result, service.required);
    
    if (!result.valid && service.required) {
      hasErrors = true;
    } else if (result.level === 'warning') {
      hasWarnings = true;
    }
  }
  
  // Summary
  logSection('Validation Summary');
  
  if (hasErrors) {
    log('❌ VALIDATION FAILED', colors.red + colors.bold);
    log('   Critical issues detected. Fix required services before deployment.', colors.red);
    
    console.log();
    log('📋 Quick Fix Guide:', colors.yellow);
    log('1. Copy scripts/setup/gmail-setup.env to .env.local', colors.white);
    log('2. Fill in your credentials', colors.white);
    log('3. Run: turso db create blessbox', colors.white);
    log('4. Run: turso db tokens create blessbox', colors.white);
    log('5. Add credentials to .env.local', colors.white);
    log('6. Run this script again to verify', colors.white);
    
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  VALIDATION PASSED WITH WARNINGS', colors.yellow + colors.bold);
    log('   Optional services not configured. Core functionality available.', colors.yellow);
  } else {
    log('✅ VALIDATION SUCCESSFUL', colors.green + colors.bold);
    log('   All systems configured correctly. Ready for deployment!', colors.green);
  }
  
  console.log();
  log('🔍 For detailed diagnostics, visit: http://localhost:7777/system/diagnostics', colors.cyan);
  console.log();
}

// Run validation
runValidation().catch(error => {
  log('💥 Validation script error:', colors.red);
  console.error(error);
  process.exit(1);
});