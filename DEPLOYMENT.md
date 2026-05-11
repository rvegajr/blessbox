# Production Deployment Checklist - blessbox.org

## Required Environment Variables in Vercel

Before deploying to production, add these environment variables in Vercel dashboard:

### 1. Super-Admin Authentication (REQUIRED)
```bash
SUPERADMIN_EMAIL=admin@blessbox.app
SUPERADMIN_PASSWORD_HASH=<generate using: npx tsx scripts/hash-password.ts YourSecurePassword>
```

**Generate the hash locally:**
```bash
npx tsx scripts/hash-password.ts YourProductionPassword
# Copy the hash output to Vercel
```

### 2. Traklet (DEV ONLY - DO NOT SET IN PRODUCTION)
```bash
# NEVER set these in production:
# TRAKLET_PAT=ghp_...
# NEXT_PUBLIC_TRAKLET_ENABLED=true
```

## Deployment Steps

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Configure Vercel Environment Variables:**
   - Go to: https://vercel.com/rvegajr/bless-box/settings/environment-variables
   - Add `SUPERADMIN_EMAIL` (Production environment)
   - Add `SUPERADMIN_PASSWORD_HASH` (Production environment)

3. **Deploy:**
   - Vercel will auto-deploy on push to main
   - Or manually trigger: https://vercel.com/rvegajr/bless-box

4. **Verify Deployment:**
   - Visit: https://www.blessbox.org/admin-login
   - Test login with configured credentials
   - Verify redirect to `/admin` on success

## Security Notes

- ✅ Password hash uses bcrypt cost factor 12
- ✅ Rate limiting: 5 attempts per IP per 60 seconds
- ✅ Endpoint returns 404 if `SUPERADMIN_PASSWORD_HASH` not set
- ✅ Session expires in 1 hour (not 30 days like normal login)
- ✅ All test case files in `.traklet/` committed to repo
- ✅ Traklet dev widget hard-gated by `NODE_ENV !== 'production'`

## Post-Deployment Testing

Test the super-admin login (TC-022):
1. Navigate to https://www.blessbox.org/admin-login
2. Enter configured email and password
3. Verify successful login and redirect to `/admin`
4. Test wrong password returns 401 error
5. Test rate limiting after 5 failed attempts

## Test Case Registry

All 40 test cases documented in:
- Files: `.traklet/test-cases/TC-001.md` through `TC-040.md`
- Registry: `docs/USE_CASES.md`
- Sync to GitHub Issues: `npm run tc:sync` (dev only, requires TRAKLET_PAT)

## Rollback Plan

If issues occur:
```bash
git revert HEAD
git push origin main
```

Vercel will automatically deploy the previous version.
