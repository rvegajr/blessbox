# 🔧 BlessBox Environment Configuration Guide

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Setup](#production-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [Provider-Specific Guides](#provider-specific-guides)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## 🚀 Quick Start

### Automated Setup

```bash
# Set up local development environment
npm run setup:env

# Set up Vercel production environment
npm run setup:vercel

# Validate your configuration
npm run validate:env

# Check system health
npm run diagnostics
```

### Manual Setup

1. **Create `.env.local` file** in project root
2. **Copy the template below** and fill in your values
3. **Run validation** to ensure everything works

---

## 💻 Development Setup

### Step 1: Create Local Environment File

Create a `.env.local` file in the project root:

```bash
# Option 1: Use the setup wizard
npm run setup:env

# Option 2: Copy template manually
cat > .env.local << 'EOF'
# Your environment variables here (see template below)
EOF
```

### Step 2: Development Environment Template

```env
# ============================================
# DATABASE CONFIGURATION (Turso)
# ============================================
# Using the shared development database
TURSO_DATABASE_URL=libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTQ4ODEzNjQsImlhdCI6MTc1NDI3NjU2NCwiaWQiOiI4MjFmMjdkOS0zNDIzLTQ1YTAtYWFiMy01MzcyNTQ3MjcyNDAiLCJyaWQiOiJiM2MwZjdhYS05YzFjLTQ5NjUtYjgwNi1jZmI0OGEwMTFmZTAifQ.UBi6bacAdcSpA26FIhJgdWhh6Qos4jY5JuSMb3aWJ65gvjFiqAYcCqudtU_ddAko2c0wkd_meGF2x3rrLp_UCw

# ============================================
# EMAIL CONFIGURATION
# ============================================
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=BlessBox Dev

# ============================================
# SECURITY
# ============================================
JWT_SECRET=dev-secret-minimum-32-characters-change-in-prod

# ============================================
# APPLICATION
# ============================================
PUBLIC_APP_URL=http://localhost:7777
NODE_ENV=development

# ============================================
# OPTIONAL
# ============================================
ENABLE_DEBUG_LOGGING=true
ENABLE_EMAIL_LOGGING=true
```

### Step 3: Validate Configuration

```bash
# Run validation
npm run validate:env

# Should see all green checkmarks:
# ✅ Node.js Version
# ✅ Dependencies
# ✅ Environment File
# ✅ Database (Turso)
# ✅ Email Service
# ✅ JWT Configuration
```

---

## 🌐 Production Setup

### Option 1: Vercel (Recommended)

#### Automated Setup
```bash
# Run the Vercel setup wizard
npm run setup:vercel

# Follow the prompts to configure:
# - Database credentials (production)
# - Email service
# - JWT secret
# - Application URL
```

#### Manual Setup
```bash
# Set each variable individually
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add EMAIL_PROVIDER production
vercel env add JWT_SECRET production
# ... add all required variables

# Verify
vercel env ls
```

### Option 2: Other Platforms

For other hosting platforms, set these environment variables in their respective dashboards:

- **Netlify**: Site Settings → Environment Variables
- **Railway**: Variables tab in project settings
- **Render**: Environment tab in service settings
- **Heroku**: Settings → Config Vars

---

## 📚 Environment Variables Reference

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `TURSO_DATABASE_URL` | Turso database URL | `libsql://db.turso.io` | ✅ |
| `TURSO_AUTH_TOKEN` | Database auth token | `eyJhbGc...` | ✅ |
| `EMAIL_PROVIDER` | Email service provider | `gmail` or `sendgrid` | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `random-32-char-string` | ✅ |

### Email Configuration

#### Gmail Setup
| Variable | Description | Example |
|----------|-------------|---------|
| `GMAIL_USER` | Gmail address | `user@gmail.com` |
| `GMAIL_PASS` | App password (16 chars) | `xxxx-xxxx-xxxx-xxxx` |

#### SendGrid Setup
| Variable | Description | Example |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | `SG.REDACTED` |
| `SENDGRID_FROM_EMAIL` | Verified sender | `noreply@domain.com` |
| `SENDGRID_FROM_NAME` | Sender name | `BlessBox` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_APP_URL` | Application URL | `http://localhost:7777` |
| `SQUARE_APPLICATION_ID` | Square app ID | - |
| `SQUARE_ACCESS_TOKEN` | Square token | - |
| `SQUARE_ENVIRONMENT` | Square env | `sandbox` |
| `NODE_ENV` | Environment | `development` |
| `ENABLE_DEBUG_LOGGING` | Debug logs | `false` |

---

## 🔧 Provider-Specific Guides

### Turso Database Setup

```bash
# 1. Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# 2. Sign up / Login
turso auth login

# 3. Create database
turso db create blessbox-prod --location ord

# 4. Get connection URL
turso db show blessbox-prod

# 5. Generate token
turso db tokens create blessbox-prod --expiration never

# 6. Save credentials to .env.local
```

### Gmail Setup

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the 16-character password (ignore spaces)

3. **Configure Environment**
   ```env
   EMAIL_PROVIDER=gmail
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=xxxx-xxxx-xxxx-xxxx
   ```

### SendGrid Setup

1. **Create Account**
   - Sign up at [SendGrid](https://sendgrid.com)

2. **Verify Sender**
   - Go to Settings → Sender Authentication
   - Add and verify your sender email/domain

3. **Generate API Key**
   - Settings → API Keys
   - Create key with "Mail Send" permission
   - Copy the key (starts with `SG.`)

4. **Configure Environment**
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.REDACTED
   SENDGRID_FROM_EMAIL=verified@domain.com
   ```

---

## 🔍 Troubleshooting

### Common Issues

#### Environment File Not Loading
```bash
# Check file exists
ls -la .env.local

# Check format (no spaces around =)
cat .env.local | grep "="

# Test loading
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env)"
```

#### Database Connection Failed
```bash
# Verify credentials
turso db show your-database

# Test connection
turso db shell your-database "SELECT 1;"

# Regenerate token if needed
turso db tokens create your-database
```

#### Email Not Sending

**Gmail Issues:**
- Verify 2FA is enabled
- Check app password is correct (16 chars, no spaces)
- Try regenerating app password
- Check "Less secure app access" is not blocking

**SendGrid Issues:**
- Verify sender identity is confirmed
- Check API key permissions
- Ensure you're under sending limits
- Check SendGrid dashboard for bounces/blocks

#### Validation Failures
```bash
# Run detailed validation
npm run validate:env

# Check specific service
curl http://localhost:7777/api/system/health-check

# View diagnostic dashboard
npm run diagnostics
```

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets
```bash
# Ensure .env files are in .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore
```

### 2. Use Strong Secrets
```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate secure random password
openssl rand -base64 32
```

### 3. Rotate Secrets Regularly
- Change JWT secrets every 3-6 months
- Rotate API keys quarterly
- Update database tokens annually

### 4. Use Different Secrets Per Environment
- Never use development secrets in production
- Generate unique values for each environment
- Use separate databases for dev/staging/prod

### 5. Secure Storage
- Use password managers for credential storage
- Enable 2FA on all service accounts
- Limit access to production credentials

---

## 🚢 Deployment Checklist

Before deploying, ensure:

- [ ] All required environment variables are set
- [ ] `npm run validate:env` passes
- [ ] Email service is configured and tested
- [ ] Database migrations are run
- [ ] JWT secret is strong and unique
- [ ] Production URL is set correctly
- [ ] Payment credentials are production (not sandbox)
- [ ] Debug logging is disabled in production
- [ ] Health check endpoint returns healthy

---

## 📊 Monitoring

### Health Check Endpoint
```bash
# Development
curl http://localhost:7777/api/system/health-check

# Production
curl https://yourdomain.com/api/system/health-check
```

### Diagnostic Dashboard
- Development: http://localhost:7777/system/diagnostics
- Production: https://yourdomain.com/system/diagnostics

### Vercel Environment Management
```bash
# List all variables
vercel env ls

# Pull to local
vercel env pull .env.local

# Add new variable
vercel env add KEY_NAME production

# Remove variable
vercel env rm KEY_NAME production
```

---

## 📞 Getting Help

If you encounter issues:

1. **Check the diagnostics dashboard**: `/system/diagnostics`
2. **Run validation**: `npm run validate:env`
3. **Review this guide**: Ensure all steps are followed
4. **Check logs**: Look for specific error messages
5. **Test services individually**: Use the test scripts in `/scripts/tests/`

Remember: The diagnostic dashboard provides real-time status of all services and is your best tool for troubleshooting configuration issues!