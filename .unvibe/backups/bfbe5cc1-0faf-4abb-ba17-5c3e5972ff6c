# 🚀 BlessBox Production Deployment Guide

## 📋 Pre-Deployment Checklist

### **✅ Application Readiness**
- [x] **Application Built**: Next.js application ready
- [x] **Database Configured**: SQLite database with schema
- [x] **Authentication Setup**: NextAuth.js configuration
- [x] **QR Code Generation**: QR code functionality working
- [x] **Form Builder**: Dynamic form creation system
- [x] **Analytics Dashboard**: Real-time reporting system
- [x] **Mobile Responsive**: Cross-device compatibility
- [x] **E2E Tests**: Comprehensive test coverage

### **✅ Test Coverage**
- [x] **Unit Tests**: Component and service testing
- [x] **E2E Tests**: Complete user journey testing
- [x] **Performance Tests**: Load and response time validation
- [x] **Mobile Tests**: Responsive design testing
- [x] **Security Tests**: Authentication and authorization
- [x] **Donation Flow Tests**: Complete donation workflow

## 🏗️ Production Build Preparation

### **Step 1: Environment Configuration**

Create production environment file:
```bash
# Create production environment file
cp env.example .env.production
```

Configure production environment variables:
```env
# Production Environment Variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database (Production)
DATABASE_URL="file:./blessbox-production.db"

# Authentication (Production)
NEXTAUTH_SECRET="your-production-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"

# Email Configuration (Production)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-production-email@gmail.com"
SMTP_PASS="your-production-app-password"

# Square Payment (Production)
SQUARE_APPLICATION_ID="your-production-square-app-id"
SQUARE_ACCESS_TOKEN="your-production-square-access-token"
SQUARE_ENVIRONMENT="production"

# Security
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-encryption-key"

# Analytics
GOOGLE_ANALYTICS_ID="your-ga-id"
```

### **Step 2: Production Build**

```bash
# Install production dependencies
npm ci --production

# Run production build
npm run build

# Verify build output
ls -la .next/
```

### **Step 3: Database Setup**

```bash
# Create production database
npm run db:setup

# Seed production data
npm run db:seed

# Verify database
sqlite3 blessbox-production.db ".tables"
```

## 🌐 Deployment Options

### **Option 1: Vercel (Recommended)**

#### **Vercel Deployment Steps**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod

# Configure environment variables in Vercel dashboard
# Set all production environment variables
```

#### **Vercel Configuration**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### **Option 2: Railway**

#### **Railway Deployment Steps**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
railway init

# Deploy to Railway
railway up
```

#### **Railway Configuration**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

### **Option 3: DigitalOcean App Platform**

#### **DigitalOcean Deployment Steps**
```bash
# Create app.yaml configuration
cat > app.yaml << EOF
name: blessbox
services:
- name: web
  source_dir: /
  github:
    repo: your-username/blessbox
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 7777
  routes:
  - path: /
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: file:./blessbox-production.db
EOF
```

### **Option 4: AWS Amplify**

#### **AWS Amplify Deployment Steps**
```bash
# Install AWS CLI
aws configure

# Create amplify app
amplify init

# Add hosting
amplify add hosting

# Deploy
amplify publish
```

## 🔧 Production Configuration

### **Step 1: Next.js Production Configuration**

Update `src/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client'],
  images: {
    domains: ['your-domain.com', 'localhost:7777']
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

### **Step 2: Database Production Setup**

```bash
# Create production database
sqlite3 blessbox-production.db << EOF
-- Create production database schema
-- (Run your database migration scripts here)
EOF

# Set proper permissions
chmod 600 blessbox-production.db
```

### **Step 3: Security Configuration**

```bash
# Set secure file permissions
chmod 600 .env.production
chmod 600 blessbox-production.db

# Configure firewall (if using VPS)
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## 🚀 Deployment Execution

### **Quick Deployment (Vercel)**

```bash
# 1. Prepare for deployment
npm run build
npm run test:all

# 2. Deploy to Vercel
vercel --prod

# 3. Configure environment variables
# Go to Vercel dashboard and set all production environment variables

# 4. Verify deployment
curl https://your-domain.vercel.app
```

### **Manual Deployment (VPS)**

```bash
# 1. Prepare production build
npm run build

# 2. Create production directory
mkdir -p /var/www/blessbox
cp -r .next /var/www/blessbox/
cp -r public /var/www/blessbox/
cp package.json /var/www/blessbox/
cp .env.production /var/www/blessbox/.env

# 3. Install production dependencies
cd /var/www/blessbox
npm ci --production

# 4. Start application
npm start
```

## 📊 Production Monitoring

### **Health Checks**

```bash
# Application health check
curl https://your-domain.com/api/health

# Database health check
curl https://your-domain.com/api/db/status

# Authentication health check
curl https://your-domain.com/api/auth/status
```

### **Performance Monitoring**

```bash
# Check application performance
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# Monitor database performance
sqlite3 blessbox-production.db "SELECT COUNT(*) FROM users;"
```

### **Log Monitoring**

```bash
# Application logs
tail -f /var/log/blessbox/app.log

# Error logs
tail -f /var/log/blessbox/error.log

# Access logs
tail -f /var/log/blessbox/access.log
```

## 🔒 Security Checklist

### **Production Security**
- [ ] **HTTPS Enabled**: SSL/TLS certificates configured
- [ ] **Environment Variables**: Secure production secrets
- [ ] **Database Security**: Encrypted database connections
- [ ] **Authentication**: Secure session management
- [ ] **API Security**: Rate limiting and validation
- [ ] **File Permissions**: Secure file system access
- [ ] **Firewall**: Network security configuration
- [ ] **Backup**: Regular database backups

### **Security Headers**
```javascript
// Add to next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        }
      ]
    }
  ]
}
```

## 📈 Performance Optimization

### **Production Optimizations**
- [ ] **Image Optimization**: Next.js Image component
- [ ] **Code Splitting**: Dynamic imports
- [ ] **Caching**: Redis or memory caching
- [ ] **CDN**: Content delivery network
- [ ] **Compression**: Gzip compression
- [ ] **Database Indexing**: Optimized queries

### **Performance Benchmarks**
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Database Query Time**: < 100ms
- **Mobile Load Time**: < 3 seconds

## 🧪 Production Testing

### **Post-Deployment Testing**

```bash
# Run production tests
npm run test:all

# Test donation flow
npx playwright test donation-flow-complete.spec.ts --project=chromium

# Test mobile responsiveness
npx playwright test mobile-responsiveness.spec.ts --project=mobile-chrome

# Test performance
npx playwright test performance.spec.ts --project=chromium
```

### **Load Testing**

```bash
# Install load testing tools
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

## 📋 Deployment Checklist

### **Pre-Deployment**
- [ ] **Code Review**: All code reviewed and approved
- [ ] **Tests Passing**: All tests passing
- [ ] **Environment Variables**: Production secrets configured
- [ ] **Database**: Production database ready
- [ ] **SSL Certificates**: HTTPS certificates installed
- [ ] **Domain**: Domain name configured
- [ ] **Monitoring**: Monitoring tools configured

### **Post-Deployment**
- [ ] **Health Checks**: All health checks passing
- [ ] **Performance**: Performance benchmarks met
- [ ] **Security**: Security scan completed
- [ ] **Backup**: Database backup created
- [ ] **Monitoring**: Monitoring alerts configured
- [ ] **Documentation**: Deployment documented

## 🎯 Production URLs

### **Application URLs**
- **Production URL**: `https://your-domain.com`
- **Admin Dashboard**: `https://your-domain.com/dashboard`
- **API Endpoints**: `https://your-domain.com/api`
- **Health Check**: `https://your-domain.com/api/health`

### **Monitoring URLs**
- **Analytics**: `https://your-domain.com/dashboard/analytics`
- **System Status**: `https://your-domain.com/dashboard/status`
- **User Management**: `https://your-domain.com/dashboard/users`

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Build Failures**
```bash
# Check Node.js version
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### **2. Database Issues**
```bash
# Check database connection
sqlite3 blessbox-production.db ".tables"

# Reset database
rm blessbox-production.db
npm run db:setup
npm run db:seed
```

#### **3. Authentication Issues**
```bash
# Check environment variables
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# Verify JWT configuration
npm run test:auth
```

#### **4. Performance Issues**
```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk space
df -h
```

## 📞 Support

### **Production Support**
- **Documentation**: Check all documentation files
- **Logs**: Review application and error logs
- **Monitoring**: Check monitoring dashboards
- **Backup**: Restore from latest backup if needed

### **Emergency Procedures**
1. **Application Down**: Restart application service
2. **Database Issues**: Restore from backup
3. **Security Breach**: Review logs and update secrets
4. **Performance Issues**: Scale resources or optimize code

---

**🎉 Congratulations! Your BlessBox application is now ready for production deployment.**

*This guide provides comprehensive steps for deploying your BlessBox application to production with proper security, monitoring, and performance optimization.*

