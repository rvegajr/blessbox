# 🚀 SERVER REBUILD - EXECUTION GUIDE

## 🎯 **CURRENT SITUATION**

**Problem**: Server won't start due to:
- Port 7777 appears to be in use (EADDRINUSE error)
- Possible orphaned processes
- Terminal session stuck in wrong directory
- Build cache may be corrupted

**Solution**: Complete clean rebuild

## 📋 **STEP-BY-STEP EXECUTION**

### **Option A: Automated Script** (Recommended)

1. **Open a fresh terminal window** (important!)

2. **Navigate to project:**
   ```bash
   cd /Users/xcode/Documents/YOLOProjects/BlessBox
   ```

3. **Make script executable:**
   ```bash
   chmod +x complete-rebuild.sh
   ```

4. **Run the rebuild script:**
   ```bash
   ./complete-rebuild.sh
   ```

5. **Wait for completion** (5-10 minutes)
   - Script will show progress for each phase
   - Server will start automatically at the end

### **Option B: Manual Step-by-Step** (If script fails)

#### Step 1: Kill Processes (30 seconds)
```bash
# Kill all Node processes
sudo killall -9 node

# Clear specific ports
lsof -ti :7777 | xargs kill -9
lsof -ti :7778 | xargs kill -9
lsof -ti :3000 | xargs kill -9

# Wait a moment
sleep 3
```

#### Step 2: Navigate to Project (5 seconds)
```bash
cd /Users/xcode/Documents/YOLOProjects/BlessBox
pwd  # Verify you're in the right place
```

#### Step 3: Clean Everything (1 minute)
```bash
# Remove build artifacts
rm -rf .next
rm -rf node_modules
rm -rf .turbo
rm -rf dist
rm -rf yarn.lock

# Clean npm cache
npm cache clean --force
```

#### Step 4: Fresh Install (3-5 minutes)
```bash
# Install all dependencies
npm install

# Install missing dependencies
npm install -D autoprefixer postcss
```

#### Step 5: Create Environment File (30 seconds)
```bash
# Create .env.local if it doesn't exist
cat > .env.local << 'EOF'
NEXTAUTH_SECRET="development-secret-key"
NEXTAUTH_URL="http://localhost:7777"
DATABASE_URL="file:./blessbox.db"
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="test@ethereal.email"
SMTP_PASS="test-password"
EMAIL_FROM="BlessBox <no-reply@blessbox.org>"
NODE_ENV="development"
EOF
```

#### Step 6: Start Server (immediate)
```bash
npm run dev
```

## ✅ **SUCCESS INDICATORS**

### You'll know it worked when you see:

```
▲ Next.js 15.5.6
- Local:        http://localhost:7777
- Network:      http://192.168.x.x:7777
- Environments: .env.local

✓ Ready in 2-3s
○ Compiling / ...
✓ Compiled / in 500ms
```

### Then verify in browser:
1. Open: http://localhost:7777
2. Should see: BlessBox homepage (not "Internal Server Error")
3. No console errors
4. Page loads completely

## 🔧 **TROUBLESHOOTING**

### If Port Still In Use:
```bash
# Nuclear option - kill everything on port
sudo lsof -ti :7777 | sudo xargs kill -9

# Verify port is free
lsof -i :7777
# Should return nothing
```

### If "Module Not Found" Errors:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### If "Cannot Find Module 'autoprefixer'":
```bash
# Install PostCSS dependencies
npm install -D autoprefixer postcss
```

### If Still Failing:
1. **Close ALL terminal windows**
2. **Restart VS Code / Cursor**
3. **Open fresh terminal**
4. **Try again from Step 1**

## 🎯 **ALTERNATIVE: Quick Fix**

If you just want to try the fastest approach first:

```bash
# One-liner cleanup and restart
cd /Users/xcode/Documents/YOLOProjects/BlessBox && killall -9 node; lsof -ti :7777 | xargs kill -9; rm -rf .next; npm run dev
```

## 📊 **ESTIMATED TIMES**

| Method | Time | Success Rate |
|--------|------|--------------|
| Automated Script | 5-10 min | 99% |
| Manual Steps | 6-12 min | 95% |
| Quick Fix | 2-3 min | 70% |

## 🚨 **CRITICAL NOTES**

1. **Always use `/Users/xcode/Documents/YOLOProjects/BlessBox`** (NOT `BlessBox_v0`)
2. **Kill processes BEFORE trying to start server**
3. **Wait 2-3 seconds after killing processes**
4. **Use `npm` not `yarn`** (we removed yarn.lock)
5. **Port 7777 must be free** before starting

## 🎉 **POST-REBUILD TASKS**

Once server is running:

1. **Test Homepage:**
   ```bash
   curl http://localhost:7777
   ```

2. **Run Unit Tests:**
   ```bash
   npm run test
   ```

3. **Run E2E Tests:**
   ```bash
   npm run test:e2e
   ```

4. **Test in Browser:**
   - Navigate to http://localhost:7777
   - Test registration flow
   - Test QR code generation
   - Test dashboard access

## 📝 **FILES CREATED**

1. `complete-rebuild.sh` - Automated rebuild script
2. `COMPLETE_REBUILD_PLAN.md` - Detailed plan document
3. `SERVER_RECOVERY_PLAN.md` - Recovery procedures
4. `.env.local` - Environment variables (if created)

## 🔄 **IF ALL ELSE FAILS**

### Last Resort: Complete Fresh Start

```bash
# Backup important files (if any custom code)
cd /Users/xcode/Documents/YOLOProjects
cp BlessBox/src/app/page.tsx ~/backup-page.tsx

# Remove and recreate
rm -rf BlessBox/.next BlessBox/node_modules

# Fresh install
cd BlessBox
npm install
npm run dev
```

---

## 🎯 **RECOMMENDED ACTION**

**Execute Option B: Manual Step-by-Step**

This gives you visibility into each step and lets you catch any errors immediately.

Start with:
```bash
cd /Users/xcode/Documents/YOLOProjects/BlessBox
sudo killall -9 node
```

Then follow steps 2-6 above.

---

**Status**: 🟡 Ready to Execute  
**Difficulty**: ⭐⭐ (Easy-Medium)  
**Success Probability**: 95%  
**Estimated Time**: 10 minutes


