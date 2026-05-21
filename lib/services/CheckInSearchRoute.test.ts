/**
 * Phase A: Fix #21 — Check-in SQL references non-existent column
 * TDD Test Suite (Red → Green)
 * 
 * Static code validation for the check-in search API route
 */

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

describe('GET /api/check-in/search — SQL column fix', () => {
  it('does not reference the non-existent qcs.label column', async () => {
    const routePath = path.join(process.cwd(), 'app/api/check-in/search/route.ts');
    const text = await fs.readFile(routePath, 'utf8');
    
    // Should NOT reference qcs.label (column doesn't exist in schema)
    expect(text).not.toMatch(/qcs\.label/);
  });

  it('references qcs.name instead (the correct column from schema)', async () => {
    const routePath = path.join(process.cwd(), 'app/api/check-in/search/route.ts');
    const text = await fs.readFile(routePath, 'utf8');
    
    // Should reference qcs.name (matches qr_code_sets.name in schema)
    expect(text).toMatch(/qcs\.name/);
  });

  it('aliases the column as qr_code_set_name for clarity', async () => {
    const routePath = path.join(process.cwd(), 'app/api/check-in/search/route.ts');
    const text = await fs.readFile(routePath, 'utf8');
    
    // Should alias qcs.name as qr_code_set_name (consistent naming convention)
    expect(text).toMatch(/qcs\.name\s+as\s+qr_code_set_name/i);
  });
});
