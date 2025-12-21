/**
 * Build script for tutorial system
 * Compiles TypeScript tutorial files to JavaScript for browser use
 * Uses TypeScript compiler (tsc) for simplicity
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function buildTutorials() {
  console.log('🔨 Building tutorial system...\n');

  try {
    // Use tsc to compile tutorial files
    // The tsconfig.tutorials.json is configured to output to the same directory
    const tscPath = join(rootDir, 'node_modules', '.bin', 'tsc');
    const configPath = join(rootDir, 'tsconfig.tutorials.json');
    
    console.log('📦 Compiling TypeScript files...');
    execSync(`"${tscPath}" -p "${configPath}"`, {
      stdio: 'inherit',
      cwd: rootDir,
    });

    console.log('\n✨ Tutorial system build complete!');
    console.log(`📁 Output directory: ${join(rootDir, 'public', 'tutorials')}`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildTutorials();

