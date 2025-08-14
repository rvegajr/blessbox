# 🚀 BlessBox Deployment Readiness Checklist

## 📋 Pre-Deployment Verification

This checklist ensures your BlessBox deployment is properly configured and ready for production. Follow each section carefully and check off items as you complete them.

## 🔍 Quick Validation

Run these commands to quickly validate your environment:

```bash
# Run automated validation
npm run validate:env

# Check system health via API
curl http://localhost:3000/api/system/health-check

# Visit diagnostic dashboard
open http://localhost:3000/system/diagnostics
```

---

## ✅ Required Configuration

### 1. Database Setup (Turso) 
- [ ] **Create Turso account**: https://turso.tech
- [ ] **Install Turso CLI**:
  ```bash
  curl -sSfL https://get.tur.so/install.sh | bash
  ```
- [ ] **Create databases**:
  ```bash
  # Production database
  turso db create blessbox-prod --location ord
  
  # Development database
  turso db create blessbox-dev --location ord
  ```
- [ ] **Generate auth tokens**:
  ```bash
  turso db tokens create blessbox-prod --expiration never
  turso db tokens create blessbox-dev --expiration never
  ```
- [ ] **Add to environment**:
  ```env
  TURSO_DATABASE_URL=libsql://blessbox-prod.turso.io
  TURSO_AUTH_TOKEN=your-token-here
  ```
- [ ] **Run migrations**:
  ```bash
  npm run db:migrate
  ```

### 2. Email Service Configuration

#### Option A: Gmail (Good for Development)
- [ ] **Enable 2-Factor Authentication** on your Google Account
- [ ] **Generate App Password**:
  1. Go to: https://myaccount.google.com/apppasswords
  2. Select "Mail" and your device
  3. Copy the 16-character password
- [ ] **Configure environment**:
  ```env
  EMAIL_PROVIDER=gmail
  GMAIL_USER=your-email@gmail.com
  GMAIL_PASS=your-16-char-app-password
  EMAIL_FROM=your-email@gmail.com
  EMAIL_FROM_NAME=BlessBox
  ```
- [ ] **Test email**:
  ```bash
  npm run test:email
  ```

#### Option B: SendGrid (Recommended for Production)
- [ ] **Create SendGrid account**: https://sendgrid.com
- [ ] **Verify sender identity**:
  1. Go to Settings → Sender Authentication
  2. Verify a single sender or domain
- [ ] **Generate API key**:
  1. Go to Settings → API Keys
  2. Create key with "Mail Send" permission
- [ ] **Configure environment**:
  ```env
  EMAIL_PROVIDER=sendgrid
  SENDGRID_API_KEY=SG.your-api-key-here
  SENDGRID_FROM_EMAIL=verified@yourdomain.com
  SENDGRID_FROM_NAME=BlessBox
  ```
- [ ] **Test SendGrid**:
  ```bash
  node scripts/tests/test-sendgrid.js
  ```

### 3. Security Configuration
- [ ] **Generate JWT secret** (minimum 32 characters):
  ```bash
  # Generate secure random secret
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] **Add to environment**:
  ```env
  JWT_SECRET=your-generated-secret-here
  ```
- [ ] **Never commit secrets to Git**
- [ ] **Use different secrets for each environment**

---

## 🎯 Optional Configuration

### 4. Payment Processing (Square)
- [ ] **Create Square account**: https://squareup.com
- [ ] **Get sandbox credentials** (for testing):
  1. Go to: https://developer.squareup.com/apps
  2. Create a new application
  3. Copy Sandbox credentials
- [ ] **Configure environment**:
  ```env
  SQUARE_APPLICATION_ID=sandbox-app-id
  SQUARE_ACCESS_TOKEN=sandbox-access-token
  SQUARE_ENVIRONMENT=sandbox
  ```
- [ ] **For production**, switch to live credentials:
  ```env
  SQUARE_ENVIRONMENT=production
  ```

### 5. Application URL
- [ ] **Set public URL**:
  ```env
  PUBLIC_APP_URL=https://yourdomain.com
  ```
- [ ] **Configure for each environment**:
  - Development: `http://localhost:3000`
  - Staging: `https://staging.yourdomain.com`
  - Production: `https://yourdomain.com`

---

## 🚢 Deployment Platform Setup

### Vercel Deployment
- [ ] **Install Vercel CLI**:
  ```bash
  npm i -g vercel
  ```
- [ ] **Link project**:
  ```bash
  vercel link
  ```
- [ ] **Set environment variables for production**:
  ```bash
  vercel env add TURSO_DATABASE_URL production
  vercel env add TURSO_AUTH_TOKEN production
  vercel env add EMAIL_PROVIDER production
  vercel env add JWT_SECRET production
  # Add all other required variables...
  ```
- [ ] **Set environment variables for development**:
  ```bash
  vercel env add TURSO_DATABASE_URL development
  # Add all other variables with development values...
  ```
- [ ] **Deploy to production**:
  ```bash
  vercel --prod
  ```

### Alternative: Docker Deployment
- [ ] **Build Docker image**:
  ```bash
  docker build -t blessbox:latest .
  ```
- [ ] **Run with environment file**:
  ```bash
  docker run --env-file .env.production -p 3000:3000 blessbox:latest
  ```

---

## 🧪 Testing & Verification

### Local Testing
- [ ] **Run all tests**:
  ```bash
  npm test
  ```
- [ ] **Test email service**:
  ```bash
  npm run test:email
  ```
- [ ] **Test database connection**:
  ```bash
  npm run test:db
  ```
- [ ] **Check linting**:
  ```bash
  npm run lint
  ```

### System Health Checks
- [ ] **API Health Check**: 
  - Visit: `/api/system/health-check`
  - All services should show "healthy"
- [ ] **Diagnostic Dashboard**:
  - Visit: `/system/diagnostics`
  - Verify all required services are green
- [ ] **Email Test Page**:
  - Visit: `/email-test`
  - Send a test email successfully

### User Flow Testing
- [ ] **Organization Registration**:
  1. Register new organization
  2. Receive verification email
  3. Complete verification
  4. Set up organization profile
- [ ] **QR Code Generation**:
  1. Create registration form
  2. Generate QR code
  3. Test QR code scanning
- [ ] **Guest Registration**:
  1. Scan QR code
  2. Fill registration form
  3. Submit successfully
- [ ] **Dashboard Access**:
  1. Login to dashboard
  2. View registrations
  3. Export data

---

## 🛡️ Security Checklist

- [ ] **Environment files** are in `.gitignore`
- [ ] **Unique secrets** for each environment
- [ ] **HTTPS enabled** in production
- [ ] **Rate limiting** configured
- [ ] **Input validation** active
- [ ] **SQL injection** protection enabled
- [ ] **XSS protection** headers set
- [ ] **CORS** properly configured

---

## 📊 Monitoring & Maintenance

### Setup Monitoring
- [ ] **Error tracking** (e.g., Sentry):
  ```env
  SENTRY_DSN=your-sentry-dsn
  ```
- [ ] **Uptime monitoring** (e.g., UptimeRobot)
- [ ] **Database backups** configured
- [ ] **Log aggregation** setup

### Post-Deployment
- [ ] **Verify production health check**:
  ```bash
  curl https://yourdomain.com/api/system/health-check
  ```
- [ ] **Test critical user flows**
- [ ] **Monitor error logs**
- [ ] **Check email delivery rates**
- [ ] **Verify database performance**

---

## 🆘 Troubleshooting Guide

### Common Issues & Solutions

#### Email Not Sending
```bash
# Check configuration
npm run validate:env

# Test email service
node scripts/tests/test-email-system.js

# For Gmail: Verify app password
# For SendGrid: Check verified senders
```

#### Database Connection Failed
```bash
# Verify credentials
turso db show blessbox-prod

# Test connection
turso db shell blessbox-prod "SELECT 1;"

# Regenerate token if needed
turso db tokens create blessbox-prod
```

#### Environment Variables Not Loading
```bash
# Check file exists
ls -la .env*

# Verify format (no spaces around =)
cat .env.local

# Test loading
node -e "require('dotenv').config(); console.log(process.env)"
```

---

## 📝 Final Checks

Before going live:
- [ ] All required services show "healthy"
- [ ] Email verification works
- [ ] Database migrations completed
- [ ] Security secrets are unique and strong
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team has access credentials

---

## 🎉 Launch!

Once all checks are complete:

1. **Deploy to production**:
   ```bash
   git push origin main
   ```

2. **Verify deployment**:
   ```bash
   curl https://yourdomain.com/api/system/health-check
   ```

3. **Monitor initial traffic**:
   - Check error logs
   - Monitor performance
   - Watch email delivery

4. **Celebrate!** 🎊 Your BlessBox is live!

---

## 📞 Support

If you encounter issues:
1. Check `/system/diagnostics` dashboard
2. Review error logs
3. Run `npm run validate:env`
4. Consult this checklist
5. Check documentation in `/docs`

Remember: The diagnostic dashboard at `/system/diagnostics` provides real-time status of all services!