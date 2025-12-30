# Magic Link URL Investigation Test

## Purpose

This E2E test investigates why magic links are redirecting users to incorrect domains (e.g., a Lutheran church in Illinois instead of blessbox.org).

## What It Tests

The test suite performs 7 investigative steps:

1. **Environment URL Configuration** - Checks what URLs are configured in production
2. **URL Generation Logic** - Tests the URL override logic in `authOptions.ts`
3. **Magic Link Request** - Requests a magic link and monitors network traffic
4. **Email Logs** - Attempts to check email logs (if available)
5. **Callback URL Structure** - Verifies the callback endpoint structure
6. **Login Redirect Flow** - Tests redirect behavior with `next` parameter
7. **Full Login Flow** - Manual test guide for complete flow

## Running the Test

### Against Production

```bash
npm run test:e2e:magic-link
```

### Against Local Development

```bash
npm run test:e2e:magic-link:local
```

### With Browser Visible (Headed Mode)

```bash
npm run test:e2e:magic-link:headed
```

## Test Endpoints

The test uses these endpoints:

- `/api/debug-auth-url` - Shows configured environment URLs
- `/api/test/magic-link-url` - Tests URL generation logic
- `/api/auth/callback/email` - NextAuth callback endpoint

## What to Look For

### Expected Results

1. **Environment URLs** should show:
   - `NEXTAUTH_URL=https://www.blessbox.org`
   - `PUBLIC_APP_URL=https://www.blessbox.org`
   - `magicLinkBaseUrl=https://www.blessbox.org`

2. **Corrected URLs** should:
   - Use `blessbox.org` domain (not `vercel.app` or other domains)
   - Preserve path and query parameters
   - Not contain any Illinois church domains

3. **Magic Link Format**:
   ```
   https://www.blessbox.org/api/auth/callback/email?token=...&email=...
   ```

### Red Flags

- URLs pointing to `vercel.app` subdomains instead of custom domain
- URLs containing unexpected domains
- `NEXTAUTH_URL` or `PUBLIC_APP_URL` not set or incorrect
- URL generation logic not applying corrections

## Manual Verification Steps

If automated tests don't catch the issue:

1. **Request Magic Link**:
   - Go to `https://www.blessbox.org/login`
   - Enter your email
   - Click "Sign in"

2. **Check Email**:
   - Open the magic link email
   - **Inspect the link URL** (hover or right-click → Copy link)
   - Verify domain is `blessbox.org`

3. **Click Link**:
   - Click the magic link
   - Verify redirect goes to BlessBox (not external site)
   - Check browser address bar shows correct domain

## Debugging Tips

### Check Vercel Environment Variables

```bash
npx vercel env ls production | grep -E "NEXTAUTH_URL|PUBLIC_APP_URL"
```

### Check What URL Is Actually Generated

```bash
curl -X POST https://www.blessbox.org/api/test/magic-link-url \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://wrong-domain.com/api/auth/callback/email?token=test&email=test@example.com",
    "email": "test@example.com"
  }'
```

### Check Environment Configuration

```bash
curl https://www.blessbox.org/api/debug-auth-url
```

## Related Code

- `app/api/auth/[...nextauth]/authOptions.ts` - URL override logic (lines 24-35)
- `lib/services/EmailService.ts` - Email sending (lines 354-384)
- `app/api/debug-auth-url/route.ts` - Debug endpoint
- `app/api/test/magic-link-url/route.ts` - URL generation test endpoint

## Fix Applied

The fix in `authOptions.ts` overrides NextAuth's auto-generated URL to ensure it always uses:
1. `PUBLIC_APP_URL` (first priority)
2. `NEXTAUTH_URL` (fallback)
3. `https://www.blessbox.org` (hardcoded fallback)

This prevents NextAuth from using request headers that might point to wrong domains.

