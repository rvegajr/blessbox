# Clear Production Database - Quick Guide

## ⚠️ DANGER: This will delete ALL user data!

---

## Quick Start

### Option 1: Set Environment Variables and Run

```bash
# Set production database credentials
export TURSO_DATABASE_URL="libsql://your-production-db.turso.io"
export TURSO_AUTH_TOKEN="your-production-auth-token"
export SUPERADMIN_EMAIL="your-admin-email@example.com"

# Run the clear script
npx tsx scripts/clear-production-database.ts
```

### Option 2: Use Helper Script

```bash
# Set environment variables first
export TURSO_DATABASE_URL="libsql://your-production-db.turso.io"
export TURSO_AUTH_TOKEN="your-production-auth-token"
export SUPERADMIN_EMAIL="your-admin-email@example.com"

# Run helper script
./scripts/run-clear-database.sh
```

---

## What Gets Deleted

- ✅ All organizations
- ✅ All users (except super admin)
- ✅ All registrations
- ✅ All QR codes and QR code sets
- ✅ All memberships (except super admin's)
- ✅ Old verification codes (>24 hours)

## What Gets Preserved

- ✅ Super admin user account (email from `SUPERADMIN_EMAIL`)
- ✅ Database schema (tables remain intact)

---

## Safety Features

1. **5-second delay** - You can Ctrl+C to cancel
2. **Verifies super admin** before and after deletion
3. **Detailed logging** of every step
4. **Shows counts** before and after

---

## After Clearing

1. Verify super admin can still login
2. Start fresh onboarding
3. Test the fixes we just implemented

---

**Ready?** Set your environment variables and run the script!

