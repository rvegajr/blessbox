# 🚀 Vercel Environment Setup - Quick Guide

## Prerequisites
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login
```

## Option 1: Automated Setup (Recommended)
```bash
# Run the interactive setup script
npm run setup:vercel

# Follow the prompts to configure all variables
# The script will set up variables for development, preview, and production
```

## Option 2: Quick Copy from Local
```bash
# If you have a working .env.local, you can push it to Vercel
vercel env pull .env.production
# Edit .env.production with production values
vercel env add < .env.production
```

## Option 3: Manual Setup via CLI

### Required Variables
```bash
# Database (Production)
echo "libsql://your-prod-db.turso.io" | vercel env add TURSO_DATABASE_URL production
echo "your-production-token" | vercel env add TURSO_AUTH_TOKEN production

# Email (Choose One)
# Gmail:
echo "gmail" | vercel env add EMAIL_PROVIDER production
echo "your-email@gmail.com" | vercel env add GMAIL_USER production
echo "your-app-password" | vercel env add GMAIL_PASS production

# OR SendGrid:
echo "sendgrid" | vercel env add EMAIL_PROVIDER production
echo "SG.your-api-key" | vercel env add SENDGRID_API_KEY production
echo "noreply@yourdomain.com" | vercel env add SENDGRID_FROM_EMAIL production

# Security
echo "$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" | vercel env add JWT_SECRET production

# Application
echo "https://your-domain.vercel.app" | vercel env add PUBLIC_APP_URL production
```

### Optional Variables
```bash
# Square Payment (if using)
echo "your-square-app-id" | vercel env add SQUARE_APPLICATION_ID production
echo "your-square-token" | vercel env add SQUARE_ACCESS_TOKEN production
echo "production" | vercel env add SQUARE_ENVIRONMENT production
```

## Verification

### 1. List All Variables
```bash
npm run env:list
# or
vercel env ls
```

### 2. Pull Variables Locally (for testing)
```bash
npm run env:pull
# Creates/updates .env.local with Vercel values
```

### 3. Deploy and Test
```bash
# Deploy to production
vercel --prod

# Check health
curl https://your-deployment.vercel.app/api/system/health-check
```

## Environment-Specific Setup

### Development/Preview Environment
```bash
# Use 'preview' or 'development' instead of 'production'
echo "value" | vercel env add VAR_NAME preview
```

### Multiple Environments at Once
```bash
# Add to all environments
echo "value" | vercel env add VAR_NAME production preview development
```

## Common Commands

```bash
# List variables
vercel env ls

# Remove a variable
vercel env rm VAR_NAME production

# Pull all variables to local file
vercel env pull .env.local

# Add from file
vercel env add < .env.production
```

## Troubleshooting

### Can't find project
```bash
# Link your project first
vercel link
```

### Permission denied
```bash
# Make sure you're logged in
vercel login

# Check team access
vercel team ls
```

### Variable not showing up
```bash
# Redeploy after adding variables
vercel --prod

# Or trigger redeployment from dashboard
```

## Best Practices

1. **Never commit secrets** - Use Vercel env vars instead
2. **Use different values** for dev/preview/production
3. **Rotate secrets regularly** - Especially JWT_SECRET
4. **Test after setup** - Always verify with health check
5. **Document changes** - Keep track of when variables are updated

## Quick Health Check

After setting up, verify everything works:

```bash
# Local check
curl http://localhost:7777/api/system/health-check | jq .

# Production check
curl https://your-app.vercel.app/api/system/health-check | jq .
```

All services should show "healthy" status!