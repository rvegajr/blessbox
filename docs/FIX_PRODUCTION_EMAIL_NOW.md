# Production Email Fix (Sanitized)

This document is **sanitized** to avoid committing secrets. Do **NOT** paste real API keys into git.

## Symptom

- Email sending returns **Unauthorized / invalid grant** from SendGrid.

## Fix (Vercel)

1. Go to your Vercel project → **Settings → Environment Variables**
2. Locate `SENDGRID_API_KEY`
3. Ensure it is set for **Production**
4. Update the Production value to your new key **in Vercel only**:

- `SENDGRID_API_KEY = <YOUR_SENDGRID_API_KEY>`

5. Redeploy after changing env vars (required):

```bash
vercel --prod
```

## Verify

- Call `POST /api/onboarding/send-verification` and check Vercel logs.
- You should see successful SendGrid send (202) and/or no SendGrid Unauthorized errors.

## Notes

- Never commit API keys.
- If you need to share keys, use a secret manager (Vercel env vars, 1Password, etc.).
