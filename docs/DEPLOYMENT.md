# 🚀 **BLESSBOX DEPLOYMENT GUIDE** 🚀

## 🎯 **DEPLOYMENT STRATEGY**

BlessBox uses branch-based deployments with Vercel:

- **`main` branch** → Production environment
- **`development` branch** → Development environment  
- **Feature branches** → Preview deployments

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### ✅ **Environment Setup**
- [ ] Create separate Turso databases for prod/dev
- [ ] Set up Gmail SMTP or SendGrid for each environment
- [ ] Configure Square sandbox vs production accounts
- [ ] Generate unique JWT secrets for each environment

### ✅ **Database Setup**
```bash
# Create production database
turso db create blessbox-prod

# Create development database  
turso db create blessbox-dev

# Generate auth tokens
turso db tokens create blessbox-prod --expiration never
turso db tokens create blessbox-dev --expiration never
```

### ✅ **Vercel Configuration**

#### 1. Install Vercel CLI
```bash
npm i -g vercel
```

#### 2. Link Project
```bash
vercel link
```

#### 3. Set Environment Variables

**For Production (main branch):**
```bash
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add GMAIL_USER production
vercel env add GMAIL_APP_PASSWORD production
vercel env add SQUARE_APPLICATION_ID production
vercel env add SQUARE_ACCESS_TOKEN production
vercel env add SQUARE_ENVIRONMENT production
vercel env add JWT_SECRET production
vercel env add PUBLIC_APP_URL production
```

**For Development (development branch):**
```bash
vercel env add TURSO_DATABASE_URL development
vercel env add TURSO_AUTH_TOKEN development
vercel env add GMAIL_USER development
vercel env add GMAIL_APP_PASSWORD development
vercel env add SQUARE_APPLICATION_ID development
vercel env add SQUARE_ACCESS_TOKEN development
vercel env add SQUARE_ENVIRONMENT development
vercel env add JWT_SECRET development
vercel env add PUBLIC_APP_URL development
```

## 🔧 **VERCEL DASHBOARD CONFIGURATION**

### Git Integration Settings:
1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Enable "Automatic deployments" for:
   - ✅ `main` branch (Production)
   - ✅ `development` branch (Preview)
3. Set "Production Branch" to `main`

### Environment Variables:
Navigate to Settings → Environment Variables and add:

#### Production Variables:
| Variable | Value | Environment |
|----------|-------|-------------|
| `TURSO_DATABASE_URL` | `libsql://blessbox-prod.turso.io` | Production |
| `TURSO_AUTH_TOKEN` | `your-prod-token` | Production |
| `SQUARE_ENVIRONMENT` | `production` | Production |
| `PUBLIC_APP_URL` | `https://blessbox.vercel.app` | Production |

#### Development Variables:
| Variable | Value | Environment |
|----------|-------|-------------|
| `TURSO_DATABASE_URL` | `libsql://blessbox-dev.turso.io` | Preview |
| `TURSO_AUTH_TOKEN` | `your-dev-token` | Preview |
| `SQUARE_ENVIRONMENT` | `sandbox` | Preview |
| `PUBLIC_APP_URL` | `https://blessbox-git-development.vercel.app` | Preview |

## 🎊 **DEPLOYMENT WORKFLOW**

### Development Workflow:
```bash
# Work on development branch
git checkout development
git pull origin development

# Make changes
# ... code changes ...

# Test locally
npm run dev
npm run test

# Commit and push
git add .
git commit -m "feat: add new feature"
git push origin development
```
**Result**: Automatic deployment to `https://blessbox-git-development.vercel.app`

### Production Deployment:
```bash
# Merge development to main
git checkout main
git pull origin main
git merge development
git push origin main
```
**Result**: Automatic deployment to `https://blessbox.vercel.app`

## 🔍 **POST-DEPLOYMENT VERIFICATION**

### ✅ **Health Checks**
- [ ] Visit deployment URL
- [ ] Test user registration
- [ ] Test QR code generation
- [ ] Test email sending
- [ ] Test payment processing (sandbox)
- [ ] Verify database connections

### ✅ **Monitoring**
- [ ] Check Vercel function logs
- [ ] Monitor Turso database performance
- [ ] Verify email delivery rates
- [ ] Test Square webhook endpoints

## 🚨 **TROUBLESHOOTING**

### Common Issues:

#### Build Failures:
```bash
# Check build logs in Vercel dashboard
# Common fixes:
- Verify all environment variables are set
- Check TypeScript compilation errors
- Ensure all dependencies are in package.json
```

#### Database Connection Issues:
```bash
# Test database connection locally
npm run test:db

# Verify Turso tokens haven't expired
turso db tokens list blessbox-prod
```

#### Email Not Sending:
```bash
# Test email configuration
curl -X POST https://your-deployment.vercel.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🎯 **ENVIRONMENT URLS**

- **Production**: `https://blessbox.vercel.app`
- **Development**: `https://blessbox-git-development.vercel.app`
- **Feature Branch**: `https://blessbox-git-feature-name.vercel.app`

## 🔐 **SECURITY CHECKLIST**

- [ ] Different JWT secrets for each environment
- [ ] Separate database instances
- [ ] Square sandbox vs production tokens
- [ ] Environment-specific email configurations
- [ ] CORS settings properly configured
- [ ] Rate limiting enabled

---

🎉 **Happy Deploying! Built with ORGASMIC JOY!** 🚀✨