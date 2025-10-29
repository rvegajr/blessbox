# 🚀 PORT CONFIGURATION: DEFAULT PORT 7777

*The Happiest Software Developer's Port Management Guide!* ✨

## 🎯 Why Port 7777?

BlessBox uses **port 7777** as the default development port to avoid conflicts with other development projects. This ensures smooth development without port clashes!

## 🔧 Configuration Files Updated

### ✅ Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev --port 7777",
    "start": "next start --port 7777"
  }
}
```

### ✅ Environment Variables
```bash
# .env.local
PUBLIC_APP_URL=http://localhost:7777
NEXTAUTH_URL=http://localhost:7777
```

### ✅ Next.js Configuration
```javascript
// next.config.js
const nextConfig = {
  env: {
    PORT: '7777'
  }
}
```

## 🚀 Development Commands

### Start Development Server
```bash
npm run dev
# Server starts at http://localhost:7777
```

### Start Production Server
```bash
npm run start
# Server starts at http://localhost:7777
```

### Health Check
```bash
npm run health:check
# Checks http://localhost:7777/api/system/health-check
```

## 🌐 URL Structure

### Local Development
- **Main App**: `http://localhost:7777`
- **Pricing Page**: `http://localhost:7777/pricing`
- **Checkout**: `http://localhost:7777/checkout`
- **Dashboard**: `http://localhost:7777/dashboard`
- **Admin Panel**: `http://localhost:7777/admin`

### API Endpoints
- **Health Check**: `http://localhost:7777/api/system/health-check`
- **Square Config**: `http://localhost:7777/api/square/config`
- **Payment Process**: `http://localhost:7777/api/payment/process`

## 🔧 Port Customization

If you need to use a different port, update these files:

### 1. Package.json
```json
{
  "scripts": {
    "dev": "next dev --port YOUR_PORT",
    "start": "next start --port YOUR_PORT"
  }
}
```

### 2. Environment Variables
```bash
# .env.local
PUBLIC_APP_URL=http://localhost:YOUR_PORT
NEXTAUTH_URL=http://localhost:YOUR_PORT
```

### 3. Next.js Config
```javascript
// next.config.js
const nextConfig = {
  env: {
    PORT: 'YOUR_PORT'
  }
}
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 7777
lsof -i :7777

# Kill process using port 7777
kill -9 $(lsof -t -i:7777)
```

### Port Not Available
```bash
# Find available ports
netstat -an | grep LISTEN | grep tcp4

# Use a different port
npm run dev -- --port 7778
```

## 📋 Port Requirements

### Development
- **Port 7777**: Main application (Next.js)
- **Port 3000**: Available for other projects
- **Port 8080**: Available for other projects

### Production
- **Port 80/443**: Vercel handles this automatically
- **No port conflicts**: Vercel uses their infrastructure

## 🎉 Benefits of Port 7777

1. **No Conflicts**: Avoids common ports (3000, 8080, 8000)
2. **Easy to Remember**: 7777 is memorable
3. **Development Friendly**: Works with most development tools
4. **Future Proof**: Unlikely to conflict with new tools

## 🔗 Related Documentation

- [Phase 2 Square Setup](PHASE2_SQUARE_SETUP.md)
- [Environment Setup](ENVIRONMENT_SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)

---

*Port 7777: The Happiest Port for Development!* 🚀✨

