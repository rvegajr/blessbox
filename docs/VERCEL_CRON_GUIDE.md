# Vercel Cron Jobs Guide

## How Vercel Cron Works

Vercel Cron allows you to run scheduled functions (API routes) at specified intervals using cron syntax.

**Key Points:**
- ✅ Runs on Vercel's infrastructure (no server needed)
- ✅ Uses standard cron syntax
- ✅ Requires `vercel.json` configuration
- ✅ Endpoints must be GET requests
- ✅ Protected by `CRON_SECRET` environment variable

---

## Step 1: Create the Cron Endpoint

Create an API route that will be called by Vercel Cron:

```typescript
// app/api/cron/finalize-cancellations/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your cron job logic here
  // ...

  return NextResponse.json({ success: true });
}
```

---

## Step 2: Configure vercel.json

Add cron configuration to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/finalize-cancellations",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Cron Schedule Examples:**
- `"0 2 * * *"` - Daily at 2 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * 0"` - Weekly on Sunday at midnight
- `"*/15 * * * *"` - Every 15 minutes

---

## Step 3: Set Environment Variable

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add `CRON_SECRET` (generate a random string)
3. Deploy

**Generate secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Testing Locally

**Option 1: Manual Test**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:7777/api/cron/finalize-cancellations
```

**Option 2: Vercel CLI**
```bash
vercel dev  # Runs cron jobs locally
```

**Option 3: Test Script**
Create `scripts/test-cron.ts`:
```typescript
// Test cron endpoint locally
const response = await fetch('http://localhost:7777/api/cron/finalize-cancellations', {
  headers: {
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  }
});
console.log(await response.json());
```

---

## Step 5: Monitoring

**Vercel Dashboard:**
- Go to Project → Functions → Cron Jobs
- View execution logs and errors

**Add logging:**
```typescript
console.log('[Cron] Starting finalize-cancellations');
console.log('[Cron] Found 5 subscriptions to finalize');
console.log('[Cron] Completed successfully');
```

---

## Security Best Practices

1. **Always verify CRON_SECRET** - Prevents unauthorized access
2. **Use environment variables** - Never hardcode secrets
3. **Idempotent operations** - Cron may retry on failure
4. **Error handling** - Log errors, don't crash

---

## Common Issues

**Issue:** Cron not running
- ✅ Check `vercel.json` syntax
- ✅ Verify endpoint is GET (not POST)
- ✅ Check CRON_SECRET matches
- ✅ Wait for next scheduled time (cron doesn't run immediately)

**Issue:** "Unauthorized" error
- ✅ Verify CRON_SECRET is set in Vercel
- ✅ Check Authorization header format

**Issue:** Timezone confusion
- ✅ Vercel Cron uses UTC
- ✅ Adjust schedule for your timezone

---

## Example: Cancellation Finalization

See `app/api/cron/finalize-cancellations/route.ts` for complete implementation.
