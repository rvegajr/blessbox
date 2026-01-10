# Environment Variable Sanitization Utility

**Created:** January 9, 2026  
**Purpose:** Prevent newline, quote, and whitespace issues in environment variables  
**Status:** ✅ Deployed and Active

---

## 🎯 Problem Solved

### The Issue

Environment variables in Vercel/deployment can have hidden characters:
- Newlines (`\n` or actual linebreaks)
- Quotes (`"..."` or `'...'`)
- Trailing/leading whitespace
- Carriage returns (`\r`)

**Example of broken env var:**
```bash
SQUARE_ACCESS_TOKEN="EAAAl55EVF4Hyu8QAWCU_ovRdLwFQEPHp21n8K6LvZtU4PGZ70DDfOn-SRictvY3\n"
                    ^                                                                  ^^
                  quotes                                                            newline
```

**Result:** Square API receives malformed token → 401 Unauthorized → All payments fail

---

## ✅ The Solution

### Utility Library: `lib/utils/env.ts`

**Automatic sanitization** of ALL environment variables

```typescript
import { getEnv, getRequiredEnv } from '@/lib/utils/env';

// Before (vulnerable to newlines):
const token = process.env.SQUARE_ACCESS_TOKEN?.trim() || '';

// After (automatically sanitized):
const token = getEnv('SQUARE_ACCESS_TOKEN');
// Removes: newlines, quotes, whitespace, carriage returns
```

---

## 📦 API Reference

### `sanitizeEnvValue(value)`

Cleans a raw environment variable value.

```typescript
sanitizeEnvValue('  "value\\n"  ')  // Returns: 'value'
sanitizeEnvValue('"token\n"')       // Returns: 'token'
sanitizeEnvValue('  token  ')       // Returns: 'token'
```

**Removes:**
- ✅ Leading/trailing whitespace
- ✅ Newline characters (`\n`, `\\n`)
- ✅ Carriage returns (`\r`, `\\r`)
- ✅ Surrounding quotes (`"..."`, `'...'`, `` `...` ``)

---

### `getEnv(key, defaultValue?)`

Safe environment variable retrieval with auto-sanitization.

```typescript
// Get with default
const apiKey = getEnv('API_KEY', 'default-key');

// Get optional value
const optionalSetting = getEnv('OPTIONAL_FEATURE');  // Returns '' if missing

// Automatically sanitized
const token = getEnv('SQUARE_ACCESS_TOKEN');  // Newlines removed automatically
```

**Returns:**
- Sanitized value if env var exists
- Default value if provided and env var missing
- Empty string if no default and env var missing

---

### `getRequiredEnv(key, errorMessage?)`

Get required environment variable (throws if missing).

```typescript
// Throws if missing
const apiKey = getRequiredEnv('SQUARE_ACCESS_TOKEN');

// Custom error message
const token = getRequiredEnv(
  'SQUARE_ACCESS_TOKEN',
  'Square is not configured. Set SQUARE_ACCESS_TOKEN in Vercel.'
);
```

**Returns:**
- Sanitized value if env var exists

**Throws:**
- Error if env var missing
- Error if env var is empty after sanitization
- Custom error message if provided

---

### `getEnvNumber(key, defaultValue)`

Get numeric environment variable.

```typescript
const port = getEnvNumber('PORT', 7777);
const timeout = getEnvNumber('TIMEOUT_MS', 5000);
```

**Returns:**
- Parsed number if valid
- Default value if missing or invalid

---

### `getEnvBoolean(key, defaultValue?)`

Get boolean environment variable.

```typescript
const debug = getEnvBoolean('DEBUG');               // false if not set
const enabled = getEnvBoolean('FEATURE_ENABLED', true);  // true if not set
```

**Treats as TRUE:**
- `'true'`
- `'1'`
- `'yes'`

(Case-insensitive)

---

## 🔧 Where It's Applied

### Critical Services Updated

**1. SquarePaymentService** (`lib/services/SquarePaymentService.ts`)
```typescript
// Before:
const accessToken = (process.env.SQUARE_ACCESS_TOKEN || '').trim();

// After:
import { getRequiredEnv, getEnv } from '../utils/env';
const accessToken = getRequiredEnv('SQUARE_ACCESS_TOKEN');
const environment = getEnv('SQUARE_ENVIRONMENT', 'sandbox');
```

**2. SendGridTransport** (`lib/services/SendGridTransport.ts`)
```typescript
// Before:
this.apiKey = process.env.SENDGRID_API_KEY?.trim() || '';

// After:
import { getRequiredEnv, getEnv } from '../utils/env';
this.apiKey = getRequiredEnv('SENDGRID_API_KEY');
this.fromEmail = getRequiredEnv('SENDGRID_FROM_EMAIL');
this.fromName = getEnv('SENDGRID_FROM_NAME', 'BlessBox');
```

**3. VerificationService** (`lib/services/VerificationService.ts`)
```typescript
// Updated sendVerificationEmailDirect() to use sanitized env vars
const { getEnv } = await import('../utils/env');
const apiKey = getEnv('SENDGRID_API_KEY');
const fromEmail = getEnv('SENDGRID_FROM_EMAIL');
```

**4. Payment APIs**
- `app/api/payment/process/route.ts` - All Square env vars
- `app/api/system/payment-diagnostics/route.ts` - Diagnostic checks

---

## ✅ Benefits

### 1. Prevents Authentication Failures

**Before:**
```
Token with \n → Square API 401 → Payment fails
```

**After:**
```
Token with \n → Automatically cleaned → Square API success ✅
```

---

### 2. Defensive Programming

Even if someone pastes malformed env vars in Vercel:
- ✅ Automatically cleaned
- ✅ No manual trimming needed
- ✅ Consistent behavior everywhere

---

### 3. Better Error Messages

**Before:**
```typescript
if (!process.env.API_KEY) throw new Error('Missing');
```

**After:**
```typescript
getRequiredEnv('API_KEY', 'Square not configured. Set API_KEY in Vercel.');
```

---

### 4. Type Safety

All env var access goes through typed utility functions:
- Returns `string` (never undefined)
- Number parsing built-in
- Boolean parsing built-in

---

## 🧪 Test Coverage

**File:** `lib/utils/env.test.ts`

**Tests:** 15/15 passing

**Coverage:**
- ✅ Newline removal (`\n`, `\\n`)
- ✅ Carriage return removal (`\r`, `\\r`)
- ✅ Whitespace trimming
- ✅ Quote removal (`"..."`, `'...'`, `` `...` ``)
- ✅ Combined issues (quotes + newlines + spaces)
- ✅ Null/undefined handling
- ✅ Default values
- ✅ Required env var validation
- ✅ Token preservation (hyphens, underscores)

---

## 🎯 Usage Examples

### Square Payment Service

```typescript
import { getRequiredEnv, getEnv } from '@/lib/utils/env';

// Required with custom error
const token = getRequiredEnv(
  'SQUARE_ACCESS_TOKEN',
  'Square not configured'
);

// Optional with default
const env = getEnv('SQUARE_ENVIRONMENT', 'sandbox');
```

---

### SendGrid Email Service

```typescript
import { getRequiredEnv, getEnv } from '@/lib/utils/env';

// Required fields
const apiKey = getRequiredEnv('SENDGRID_API_KEY');
const fromEmail = getRequiredEnv('SENDGRID_FROM_EMAIL');

// Optional with default
const fromName = getEnv('SENDGRID_FROM_NAME', 'BlessBox');
```

---

### Configuration Files

```typescript
import { getEnv, getEnvNumber, getEnvBoolean } from '@/lib/utils/env';

// Database
const dbUrl = getEnv('TURSO_DATABASE_URL');
const dbToken = getEnv('TURSO_AUTH_TOKEN');

// App settings
const port = getEnvNumber('PORT', 7777);
const debugMode = getEnvBoolean('DEBUG', false);

// All values automatically sanitized!
```

---

## 🔒 Security Benefits

### No Accidental Exposure

**Before:**
```typescript
// Might log token with quotes/newlines
console.log('Token:', process.env.SQUARE_ACCESS_TOKEN);
// Output: Token: "EAAAxxx\n"
```

**After:**
```typescript
// Logs clean value
console.log('Token:', getEnv('SQUARE_ACCESS_TOKEN'));
// Output: Token: EAAAxxx
```

---

### Consistent Validation

All env vars validated the same way:
- Same trimming logic
- Same quote removal
- Same newline handling
- No inconsistencies across codebase

---

## 📋 Migration Guide

### Updating Existing Code

**Find:**
```typescript
const value = process.env.MY_VAR?.trim() || '';
const value = (process.env.MY_VAR || '').trim();
```

**Replace with:**
```typescript
import { getEnv } from '@/lib/utils/env';
const value = getEnv('MY_VAR');
```

---

### For Required Variables

**Find:**
```typescript
if (!process.env.API_KEY) {
  throw new Error('API_KEY required');
}
const apiKey = process.env.API_KEY;
```

**Replace with:**
```typescript
import { getRequiredEnv } from '@/lib/utils/env';
const apiKey = getRequiredEnv('API_KEY', 'API key required');
```

---

## 🎯 Future-Proof

### Prevents Common Issues

| Issue | Before | After |
|-------|--------|-------|
| Newline in token | 401 error | ✅ Auto-removed |
| Quoted value | Parse error | ✅ Auto-removed |
| Trailing space | Mismatch error | ✅ Auto-trimmed |
| Missing var | Silent failure | ✅ Clear error |

---

### Centralized Configuration

Single source of truth for env var handling:
- Easy to add validation rules
- Easy to add logging
- Easy to add type conversions
- Easy to test

---

## 📊 Test Results

```bash
$ npm test -- env.test.ts

✓ lib/utils/env.test.ts (15 tests)
  ✓ sanitizeEnvValue
    ✓ removes newline characters
    ✓ removes carriage returns
    ✓ trims whitespace
    ✓ removes surrounding quotes
    ✓ handles multiple issues at once
    ✓ returns empty string for null/undefined
    ✓ preserves hyphens and underscores
  ✓ getEnv
    ✓ returns sanitized value
    ✓ returns default value when missing
    ✓ returns empty string when missing and no default
    ✓ sanitizes Square tokens
  ✓ getRequiredEnv
    ✓ returns sanitized value
    ✓ throws error when missing
    ✓ throws error when empty after sanitization
    ✓ includes custom error message

Test Files  1 passed (1)
Tests  15 passed (15)
```

---

## 🚀 Deployment

**Commit:** `970dcfe`  
**Files Changed:** 9  
**Tests Added:** 15  
**Status:** ✅ Deployed to production

**Now protects:**
- Square authentication (token sanitized)
- SendGrid authentication (API key sanitized)
- Email sending (from email sanitized)
- All payment processing
- All email services

---

## 💡 Best Practice Going Forward

**Use this utility for ALL environment variable access:**

```typescript
// ✅ DO THIS:
import { getEnv, getRequiredEnv } from '@/lib/utils/env';
const token = getRequiredEnv('API_TOKEN');

// ❌ DON'T DO THIS:
const token = process.env.API_TOKEN?.trim() || '';
```

**Benefits:**
- Automatic sanitization
- Consistent behavior
- Better error messages
- Type safety
- Test coverage

---

**Summary:** Created utility library that automatically removes newlines, quotes, and whitespace from environment variables. Applied to all critical services (Square, SendGrid). Prevents authentication failures from formatting issues.


