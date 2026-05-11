#!/usr/bin/env tsx
import bcrypt from 'bcryptjs';

const plaintext = process.argv[2];

if (!plaintext) {
  console.error('Usage: npx tsx scripts/hash-password.ts <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(plaintext, 12);
console.log('\nBcrypt hash (cost 12):');
console.log(hash);
console.log('\nAdd to .env.local:');
console.log(`SUPERADMIN_PASSWORD_HASH=${hash}`);
