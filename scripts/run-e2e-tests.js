#!/usr/bin/env node

/**
 * BlessBox E2E Test Runner
 * 
 * This script runs end-to-end tests with proper warnings and safeguards
 */

import { execSync } from 'child_process';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.clear();
  console.log(`${colors.bright}${colors.blue}${'='.repeat(70)}`);
  console.log(`                    BLESSBOX E2E TEST SUITE`);
  console.log(`${'='.repeat(70)}${colors.reset}\n`);

  console.log(`${colors.yellow}⚠️  IMPORTANT WARNINGS:${colors.reset}\n`);
  console.log(`  1. ${colors.bright}This test creates REAL data in the system${colors.reset}`);
  console.log(`  2. ${colors.bright}Up to 10 test users/registrations will be created${colors.reset}`);
  console.log(`  3. ${colors.bright}Test data is prefixed with "E2E_TEST_" for identification${colors.reset}`);
  console.log(`  4. ${colors.bright}Running against production will affect live data${colors.reset}\n`);

  console.log(`${colors.cyan}📍 Test Environment Options:${colors.reset}`);
  console.log(`  1. ${colors.green}Production${colors.reset} (https://www.blessbox.org) - ${colors.bright}Recommended${colors.reset}`);
  console.log(`  2. ${colors.yellow}Development${colors.reset} (https://dev.blessbox.org) - May have auth issues`);
  console.log(`  3. ${colors.blue}Local${colors.reset} (http://localhost:4321) - Requires local server\n`);

  const envChoice = await question(`${colors.cyan}Select environment (1-3) or press Enter for Production: ${colors.reset}`);
  
  let testEnv = 'production';
  let envName = 'Production';
  let envUrl = 'https://www.blessbox.org';
  
  switch(envChoice.trim()) {
    case '2':
      testEnv = 'development';
      envName = 'Development';
      envUrl = 'https://dev.blessbox.org';
      break;
    case '3':
      testEnv = 'local';
      envName = 'Local';
      envUrl = 'http://localhost:4321';
      break;
  }

  console.log(`\n${colors.bright}Selected: ${colors.green}${envName}${colors.reset} (${envUrl})\n`);

  // Ask about cleanup
  const cleanupChoice = await question(`${colors.cyan}Auto-cleanup test data after tests? (y/N): ${colors.reset}`);
  const cleanup = cleanupChoice.toLowerCase() === 'y';

  // Ask about browser
  console.log(`\n${colors.cyan}Browser Options:${colors.reset}`);
  console.log(`  1. Chromium only (${colors.green}Fast${colors.reset})`);
  console.log(`  2. All browsers (${colors.yellow}Slow, comprehensive${colors.reset})\n`);
  
  const browserChoice = await question(`${colors.cyan}Select browser option (1-2) or press Enter for Chromium only: ${colors.reset}`);
  const fullTest = browserChoice.trim() === '2';

  // Confirm before running
  console.log(`\n${colors.bright}${colors.yellow}${'='.repeat(70)}`);
  console.log(`                    TEST CONFIGURATION`);
  console.log(`${'='.repeat(70)}${colors.reset}\n`);
  console.log(`  Environment: ${colors.bright}${envName}${colors.reset}`);
  console.log(`  URL: ${colors.bright}${envUrl}${colors.reset}`);
  console.log(`  Auto-cleanup: ${cleanup ? colors.green + 'Yes' : colors.yellow + 'No'}${colors.reset}`);
  console.log(`  Browsers: ${fullTest ? 'All' : 'Chromium only'}`);
  console.log(`  Max test users: ${colors.bright}10${colors.reset}\n`);

  const proceed = await question(`${colors.bright}${colors.yellow}Proceed with tests? (y/N): ${colors.reset}`);
  
  if (proceed.toLowerCase() !== 'y') {
    console.log(`\n${colors.yellow}Tests cancelled by user${colors.reset}`);
    rl.close();
    process.exit(0);
  }

  console.log(`\n${colors.green}Starting tests...${colors.reset}\n`);
  rl.close();

  // Build environment variables
  const env = {
    ...process.env,
    TEST_ENV: testEnv,
    BASE_URL: envUrl,
    CLEANUP: cleanup.toString(),
    FULL_TEST: fullTest.toString()
  };

  // Install Playwright browsers if needed
  try {
    console.log(`${colors.cyan}Checking Playwright browsers...${colors.reset}`);
    execSync('npx playwright install chromium', { stdio: 'inherit' });
    
    if (fullTest) {
      execSync('npx playwright install', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error(`${colors.red}Failed to install Playwright browsers${colors.reset}`);
    process.exit(1);
  }

  // Run the tests
  try {
    console.log(`\n${colors.bright}${colors.blue}${'='.repeat(70)}`);
    console.log(`                    RUNNING TESTS`);
    console.log(`${'='.repeat(70)}${colors.reset}\n`);

    execSync('npx playwright test', { 
      stdio: 'inherit',
      env
    });

    console.log(`\n${colors.green}${colors.bright}✅ Tests completed successfully!${colors.reset}`);
    
    // Show report location
    console.log(`\n${colors.cyan}📊 Test Report:${colors.reset}`);
    console.log(`   View detailed report: ${colors.yellow}npx playwright show-report${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ Tests failed${colors.reset}`);
    console.log(`\n${colors.cyan}View test report for details: ${colors.yellow}npx playwright show-report${colors.reset}`);
    process.exit(1);
  }

  // Cleanup reminder
  if (!cleanup) {
    console.log(`\n${colors.yellow}⚠️  Test data was NOT cleaned up${colors.reset}`);
    console.log(`   Test data is prefixed with: ${colors.bright}E2E_TEST_${colors.reset}`);
    console.log(`   Manual cleanup may be required through the admin dashboard\n`);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Error: ${error}${colors.reset}`);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});