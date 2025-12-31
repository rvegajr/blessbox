# Clear Production Database Instructions

## ⚠️ DANGER: This operation will delete ALL user data from production!

This guide explains how to safely clear the production database while preserving the super admin account.

---

## Prerequisites

### 1. Set Super Admin Email in Vercel

Before running this script, you **MUST** set the `SUPERADMIN_EMAIL` environment variable in Vercel:

1. Go to https://vercel.com/dashboard
2. Select the BlessBox project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `SUPERADMIN_EMAIL`
   - **Value**: Your super admin email (e.g., `carriastorm+test@gmail.com`)
   - **Environment**: Production ✓ (check this box)
5. Click **Save**
6. **Redeploy** the application (required for env var to take effect)

---

## Option A: Run Script Locally Against Production Database

**This is the RECOMMENDED approach** - safer and you can monitor the output.

### Step 1: Set Environment Variables Locally

```bash
# In your terminal, export the production database credentials
export TURSO_DATABASE_URL="<your-production-turso-url>"
export TURSO_AUTH_TOKEN="<your-production-auth-token>"
export SUPERADMIN_EMAIL="carriastorm+test@gmail.com"  # Or your actual admin email
```

### Step 2: Run the Clear Script

```bash
cd /Users/admin/Dev/YOLOProjects/BlessBox
npx tsx scripts/clear-production-database.ts
```

### Step 3: Wait for Confirmation

The script will:
1. Display what will be deleted
2. Wait 5 seconds (you can Ctrl+C to cancel)
3. Delete all data except super admin
4. Show final counts

**Expected Output:**
```
⚠️  DATABASE CLEAR OPERATION
======================================================================
Super Admin Email: carriastorm+test@gmail.com
This will DELETE all data except the super admin account.
======================================================================

📝 Step 1: Finding super admin...
   ✅ Found super admin: carriastorm+test@gmail.com (ID: abc123...)

📊 Step 2: Counting data to be deleted...
   Organizations: 35
   Users (non-admin): 12
   Registrations: 5
   QR Code Sets: 9
   Memberships (non-admin): 15

🗑️  Step 3: Deleting registrations...
   ✅ Deleted 5 registrations

🗑️  Step 4: Deleting QR code sets...
   ✅ Deleted 9 QR code sets

🗑️  Step 5: Deleting memberships (keeping super admin)...
   ✅ Deleted 15 memberships

🗑️  Step 6: Deleting organizations...
   ✅ Deleted 35 organizations

🗑️  Step 7: Deleting users (keeping super admin)...
   ✅ Deleted 12 users

🗑️  Step 8: Cleaning old verification codes...
   ✅ Deleted 23 old verification codes

✅ Step 9: Verifying super admin...
   ✅ Super admin preserved: carriastorm+test@gmail.com

📊 Step 10: Final database state...
   Organizations: 0
   Users: 1 (should be 1 - super admin only)
   Registrations: 0

======================================================================
✅ DATABASE CLEARED SUCCESSFULLY
======================================================================

Super admin preserved and ready for use.
You can now start fresh with onboarding!
```

---

## Option B: Run Script on Vercel (Not Recommended)

If you need to run the script directly on Vercel:

### Step 1: Create API Endpoint

Create `app/api/admin/clear-database/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';

const ADMIN_SECRET = process.env.DIAGNOSTICS_SECRET;

export async function POST(request: NextRequest) {
  // Require secret
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Run the clear script here...
  // (copy logic from scripts/clear-production-database.ts)
  
  return NextResponse.json({ success: true, message: 'Database cleared' });
}
```

### Step 2: Call Endpoint

```bash
curl -X POST https://www.blessbox.org/api/admin/clear-database \
  -H "Authorization: Bearer YOUR_DIAGNOSTICS_SECRET"
```

**⚠️ WARNING**: This approach is riskier as there's no 5-second confirmation delay!

---

## What Gets Deleted

### ✅ Deleted:
- All organizations
- All users (except super admin)
- All memberships (except super admin's)
- All registrations
- All QR code sets and QR codes
- Old verification codes (>24 hours)

### ✅ Preserved:
- Super admin user account
- Super admin's email and role
- Database schema (tables remain, just emptied)
- Subscriptions table structure
- Coupons (if you want to keep test coupons)

---

## After Clearing

### 1. Verify Super Admin Can Login

```bash
# Test login
curl -X POST https://www.blessbox.org/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"carriastorm+test@gmail.com"}'
```

### 2. Start Fresh Onboarding

1. Go to https://www.blessbox.org
2. Click "Get Started" or go to `/onboarding/organization-setup`
3. Create your first organization
4. Complete onboarding with the enhanced auto-QR generation

### 3. Verify Auto-QR Generation Works

After completing form builder:
1. Go to `/dashboard/qr-codes`
2. Should see auto-generated "main-entrance" QR code
3. Check Vercel logs for: `🔧 Auto-generating default QR code`

---

## Safety Features

### Built-in Protections:
1. **5-second delay** before execution (Ctrl+C to cancel)
2. **Requires SUPERADMIN_EMAIL** env var (fails if not set)
3. **Verifies super admin exists** before starting
4. **Verifies super admin preserved** after deletion
5. **Detailed logging** of every step
6. **Exit codes** for errors (safe for automation)

### Manual Safety Checks:
1. **Backup first** (Turso has automatic backups, but check)
2. **Test locally** against a copy of the database first
3. **Run during low-traffic** periods
4. **Have Vercel dashboard open** to monitor

---

## Troubleshooting

### Error: "SUPERADMIN_EMAIL environment variable not set"
**Solution**: Add `SUPERADMIN_EMAIL` to Vercel environment variables and redeploy

### Error: "Super admin not found"
**Solution**: The email in `SUPERADMIN_EMAIL` doesn't match any user. Check:
1. Is the email correct?
2. Does the super admin user exist?
3. Run: `SELECT * FROM users WHERE role = 'super_admin'` to find actual admin email

### Error: "Super admin was accidentally deleted"
**Solution**: This shouldn't happen (there's a WHERE clause), but if it does:
1. Check Turso backups
2. Restore from backup
3. Report bug in clear script

---

## Emergency Rollback

If something goes wrong:

### Option 1: Turso Point-in-Time Restore
1. Go to Turso dashboard
2. Select your database
3. Click **Backups**
4. Restore to a time before the clear operation

### Option 2: Recreate Super Admin
```sql
INSERT INTO users (id, email, role, created_at, updated_at)
VALUES (
  'super-admin-id',
  'carriastorm+test@gmail.com',
  'super_admin',
  datetime('now'),
  datetime('now')
);
```

---

## Questions?

- Check script output for detailed error messages
- Verify `SUPERADMIN_EMAIL` is set correctly in Vercel
- Ensure you're using production database credentials
- Test against a copy of the database first if unsure

---

**Remember**: This operation is **irreversible** (unless you restore from backup). Make sure you really want to clear the database!

