# Vercel Cron Setup Instructions

## Quick Setup (5 minutes)

### Step 1: Generate CRON_SECRET

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (e.g., `a1b2c3d4e5f6...`)

---

### Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** (paste the secret from Step 1)
   - **Environment:** Production, Preview, Development (select all)
5. Click **Save**

---

### Step 3: Deploy

```bash
git add vercel.json app/api/cron/
git commit -m "Add cancellation finalization cron job"
git push
```

Vercel will automatically:
- ✅ Detect the cron configuration in `vercel.json`
- ✅ Schedule the job to run daily at 2 AM UTC
- ✅ Call `/api/cron/finalize-cancellations` with Authorization header

---

### Step 4: Verify It's Working

**Option 1: Check Vercel Dashboard**
1. Go to Project → **Functions** → **Cron Jobs**
2. You should see `/api/cron/finalize-cancellations` listed
3. Wait for first execution (or trigger manually)

**Option 2: Check Logs**
1. Go to Project → **Deployments** → Latest deployment
2. Click **Functions** tab
3. Find `api/cron/finalize-cancellations`
4. Check execution logs after 2 AM UTC

**Option 3: Test Manually**
```bash
# Set CRON_SECRET in your local .env
echo "CRON_SECRET=your-secret-here" >> .env.local

# Start dev server
npm run dev

# In another terminal, test the endpoint
curl -H "Authorization: Bearer your-secret-here" \
  http://localhost:7777/api/cron/finalize-cancellations
```

---

## Testing Locally

### Method 1: Manual Test Script

```bash
# Set CRON_SECRET
export CRON_SECRET=your-secret-here

# Run test script
tsx scripts/test-cron.ts
```

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Run locally (includes cron support)
vercel dev
```

### Method 3: Direct curl

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:7777/api/cron/finalize-cancellations
```

---

## What the Cron Job Does

**Schedule:** Daily at 2 AM UTC (`"0 2 * * *"`)

**Process:**
1. Finds all subscriptions where:
   - `status = 'canceling'`
   - `current_period_end < NOW()`
2. For each subscription:
   - Sets `status = 'canceled'`
   - Updates `updated_at` timestamp
3. Returns summary:
   ```json
   {
     "success": true,
     "finalized": 5,
     "total": 5,
     "message": "Finalized 5 of 5 subscriptions"
   }
   ```

---

## Troubleshooting

### Cron Not Running

**Check:**
- ✅ `vercel.json` has correct cron configuration
- ✅ Endpoint is GET (not POST)
- ✅ CRON_SECRET is set in Vercel
- ✅ Deployment succeeded

**Solution:** Wait 24 hours or trigger manually via API

---

### "Unauthorized" Error

**Check:**
- ✅ CRON_SECRET matches in Vercel and code
- ✅ Authorization header format: `Bearer <secret>`

**Solution:** Regenerate CRON_SECRET and update both places

---

### Wrong Timezone

**Problem:** Cron runs at 2 AM UTC, but you want different time

**Solution:** Adjust schedule in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/finalize-cancellations",
    "schedule": "0 2 * * *"  // 2 AM UTC = adjust for your timezone
  }]
}
```

**Timezone conversions:**
- UTC: `"0 2 * * *"` (2 AM UTC)
- EST: `"0 22 * * *"` (10 PM EST = 2 AM UTC next day)
- PST: `"0 18 * * *"` (6 PM PST = 2 AM UTC next day)

---

## Monitoring

### View Cron Execution Logs

1. Vercel Dashboard → Project → **Functions**
2. Click on `api/cron/finalize-cancellations`
3. View execution history and logs

### Add Custom Logging

The cron endpoint already logs:
- Start of job
- Number of subscriptions found
- Each finalized subscription
- Completion summary
- Errors

Check Vercel function logs to see these messages.

---

## Security Notes

✅ **CRON_SECRET is required** - Prevents unauthorized access  
✅ **Only GET requests** - Vercel Cron only calls GET endpoints  
✅ **Idempotent operations** - Safe to retry if needed  
✅ **Error handling** - Logs errors, doesn't crash  

---

## Next Steps

After setup:
1. ✅ Monitor first execution (check logs)
2. ✅ Verify subscriptions are finalized correctly
3. ✅ Adjust schedule if needed
4. ✅ Add more cron jobs as needed

---

## Adding More Cron Jobs

To add another cron job:

1. Create endpoint: `app/api/cron/your-job/route.ts`
2. Add to `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/finalize-cancellations",
         "schedule": "0 2 * * *"
       },
       {
         "path": "/api/cron/your-job",
         "schedule": "0 3 * * *"
       }
     ]
   }
   ```
3. Deploy

---

## Example: Testing with Real Data

```bash
# 1. Create a test subscription that's canceling
# (Use your admin tools or database)

# 2. Set current_period_end to yesterday
# UPDATE subscription_plans 
# SET current_period_end = datetime('now', '-1 day')
# WHERE id = 'test-sub-id';

# 3. Run cron manually
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:7777/api/cron/finalize-cancellations

# 4. Verify subscription status changed to 'canceled'
```

---

That's it! Your cron job is now set up and will run automatically. 🎉
