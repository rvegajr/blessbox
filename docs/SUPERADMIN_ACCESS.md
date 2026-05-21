# Super Admin Access

## Super Admin Email

The super admin email for BlessBox is: **admin@blessbox.app**

This email address is configured in the `SUPERADMIN_EMAIL` environment variable and is required for accessing admin-only features such as:

- Creating and managing coupons (`/admin/coupons`)
- Viewing system-wide analytics (`/admin/analytics`)
- Managing all organizations (`/admin`)
- Accessing subscription management

## Admin Login

To log in as super admin:

1. Navigate to `/admin-login`
2. Enter email: `admin@blessbox.app`
3. Enter the super admin password (stored in `SUPERADMIN_PASSWORD_HASH`)
4. You will be granted full access to all admin features

## QA Testing

When QA testers need to test coupon creation or other super admin features, they must:

1. Use the super admin email: `admin@blessbox.app`
2. Use the super admin password
3. Log in via `/admin-login` (not the regular user login)

**Important**: The super admin email check is case-sensitive and uses exact string matching. Any trailing whitespace or newlines in the environment variable will cause authentication to fail.

## Recent Fixes (P0)

- **2026-05-20**: Fixed trailing newline in `SUPERADMIN_EMAIL` environment variable in Vercel production
- **2026-05-20**: Added Zod validation for coupon creation API
- **2026-05-20**: Improved error surfacing for coupon operations
