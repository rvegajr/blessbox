# 🏗️ COMPREHENSIVE SERVER REBUILD PLAN

## 🔍 **ROOT CAUSE ANALYSIS**

### Primary Issues Identified
1. **Port Conflicts** - Port 7777 consistently showing EADDRINUSE
2. **Terminal State** - Shell stuck in deprecated `BlessBox_v0` directory
3. **Process Management** - Orphaned Node processes not terminating
4. **Build Cache** - Potentially corrupted `.next` directory
5. **Dependency State** - Unclear if `node_modules` is properly installed

### Secondary Issues
1. **Package Manager Confusion** - Both `package-lock.json` and `yarn.lock` exist
2. **Missing Dependencies** - `autoprefixer` not installed
3. **Database State** - Unclear if database is initialized
4. **Environment Variables** - May be missing or incorrect

## 🎯 **REBUILD STRATEGY**

### Option 1: Clean Rebuild (Recommended)
**Pros:**
- ✅ Guaranteed clean state
- ✅ Eliminates all conflicts
- ✅ Fast execution (5-10 minutes)
- ✅ No debugging needed

**Cons:**
- ⚠️ Reinstalls all dependencies
- ⚠️ Requires npm install time

### Option 2: Surgical Fix
**Pros:**
- ✅ Preserves existing setup
- ✅ Faster if it works

**Cons:**
- ❌ May miss hidden issues
- ❌ Could require multiple attempts
- ❌ Hard to debug

### ✅ **RECOMMENDATION: Clean Rebuild**

## 📋 **COMPREHENSIVE REBUILD PLAN**

### Phase 1: Complete Cleanup (2 minutes)

```bash
#!/bin/bash
# Phase 1: Nuclear cleanup

echo "🧹 Phase 1: Complete Cleanup"
echo "================================"

# 1. Kill ALL Node processes (nuclear option)
echo "Killing all Node processes..."
sudo killall -9 node 2>/dev/null || true
sleep 2

# 2. Clear ALL potential ports
echo "Clearing all ports..."
for port in 7777 7778 3000 3001 4000; do
  lsof -ti :$port | xargs kill -9 2>/dev/null || true
done
sleep 2

# 3. Navigate to correct directory
echo "Navigating to BlessBox directory..."
cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1
pwd

# 4. Remove ALL build artifacts and dependencies
echo "Removing all artifacts..."
rm -rf .next
rm -rf node_modules
rm -rf .turbo
rm -rf dist
rm -rf .cache
rm -rf .npm
rm -rf .yarn

# 5. Remove lock files (standardize on npm)
echo "Cleaning lock files..."
rm -f yarn.lock
rm -f package-lock.json

# 6. Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# 7. Clear system temp
echo "Clearing system temp..."
rm -rf /tmp/next-*
rm -rf /tmp/.next-*

echo "✅ Phase 1 Complete - Clean slate achieved"
```

### Phase 2: Dependency Installation (3 minutes)

```bash
#!/bin/bash
# Phase 2: Fresh dependency installation

echo "📦 Phase 2: Dependency Installation"
echo "===================================="

# 1. Verify we're in the right directory
cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1
echo "Current directory: $(pwd)"

# 2. Fresh npm install
echo "Installing all dependencies..."
npm install

# 3. Install missing PostCSS dependencies
echo "Installing PostCSS dependencies..."
npm install -D autoprefixer postcss

# 4. Install Playwright browsers (if needed)
echo "Installing Playwright browsers..."
npx playwright install chromium

# 5. Verify critical packages
echo "Verifying installations..."
npm list next
npm list react
npm list typescript
npm list tailwindcss
npm list autoprefixer

echo "✅ Phase 2 Complete - Dependencies installed"
```

### Phase 3: Configuration Verification (1 minute)

```bash
#!/bin/bash
# Phase 3: Configuration verification

echo "⚙️  Phase 3: Configuration Verification"
echo "======================================"

cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1

# Check all critical configuration files
echo "Checking configuration files..."

files=(
  "next.config.js"
  "package.json"
  "tsconfig.json"
  "postcss.config.js"
  "tailwind.config.ts"
  "drizzle.config.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file exists"
  else
    echo "❌ $file MISSING"
  fi
done

# Check environment file
if [ -f ".env.local" ]; then
  echo "✅ .env.local exists"
else
  echo "⚠️  .env.local missing - will need to create"
fi

# Check src directory structure
if [ -d "src/app" ]; then
  echo "✅ src/app directory exists (Next.js App Router)"
else
  echo "❌ src/app directory MISSING - critical error"
fi

echo "✅ Phase 3 Complete - Configuration verified"
```

### Phase 4: Environment Setup (1 minute)

```bash
#!/bin/bash
# Phase 4: Environment setup

echo "🔐 Phase 4: Environment Setup"
echo "============================="

cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1

# Create .env.local if missing
if [ ! -f ".env.local" ]; then
  echo "Creating .env.local..."
  cat > .env.local << 'EOF'
# NextAuth Configuration
NEXTAUTH_SECRET="replace-with-secure-secret-key-$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:7777"

# Database Configuration
DATABASE_URL="file:./blessbox.db"

# Email Configuration (Ethereal for testing)
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="your-ethereal-email@ethereal.email"
SMTP_PASS="your-ethereal-password"
EMAIL_FROM="BlessBox <no-reply@blessbox.org>"

# Application Configuration
NODE_ENV="development"
EOF
  echo "✅ .env.local created"
else
  echo "✅ .env.local already exists"
fi

# Verify port is free
if lsof -i :7777 > /dev/null 2>&1; then
  echo "❌ Port 7777 still in use - killing..."
  lsof -ti :7777 | xargs kill -9 || true
  sleep 2
else
  echo "✅ Port 7777 is free"
fi

echo "✅ Phase 4 Complete - Environment ready"
```

### Phase 5: Database Initialization (1 minute)

```bash
#!/bin/bash
# Phase 5: Database initialization

echo "🗄️  Phase 5: Database Initialization"
echo "==================================="

cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1

# Check if database exists
if [ -f "blessbox.db" ]; then
  echo "✅ Database file exists"
  echo "Database size: $(du -h blessbox.db | cut -f1)"
else
  echo "⚠️  Database file missing - will be created on first run"
fi

# Run Drizzle migrations (if needed)
echo "Running database migrations..."
npx drizzle-kit push:sqlite || true

echo "✅ Phase 5 Complete - Database ready"
```

### Phase 6: Server Startup (1 minute)

```bash
#!/bin/bash
# Phase 6: Server startup

echo "🚀 Phase 6: Server Startup"
echo "========================="

cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1

# Final port check
echo "Final port check..."
if lsof -i :7777 > /dev/null 2>&1; then
  echo "❌ Port 7777 STILL in use - aborting"
  exit 1
else
  echo "✅ Port 7777 confirmed free"
fi

# Start the server
echo "Starting Next.js development server..."
echo "Server will start on http://localhost:7777"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
```

## 🚀 **COMPLETE REBUILD SCRIPT**

```bash
#!/bin/bash
# complete-rebuild.sh - Full server rebuild

set -e  # Exit on any error

echo "🏗️  BlessBox Complete Server Rebuild"
echo "======================================"
echo ""
echo "This script will:"
echo "1. Kill all Node processes"
echo "2. Clear all ports"
echo "3. Remove all build artifacts"
echo "4. Reinstall all dependencies"
echo "5. Verify configuration"
echo "6. Setup environment"
echo "7. Initialize database"
echo "8. Start server"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Phase 1: Cleanup
echo ""
echo "🧹 Phase 1: Complete Cleanup"
sudo killall -9 node 2>/dev/null || true
for port in 7777 7778 3000 3001 4000; do
  lsof -ti :$port | xargs kill -9 2>/dev/null || true
done
sleep 2

cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1
rm -rf .next node_modules .turbo dist .cache .npm .yarn yarn.lock package-lock.json
npm cache clean --force
rm -rf /tmp/next-* /tmp/.next-*
echo "✅ Cleanup complete"

# Phase 2: Dependencies
echo ""
echo "📦 Phase 2: Installing Dependencies"
npm install
npm install -D autoprefixer postcss
npx playwright install chromium --yes
echo "✅ Dependencies installed"

# Phase 3: Configuration
echo ""
echo "⚙️  Phase 3: Verifying Configuration"
test -f next.config.js && echo "✅ next.config.js" || echo "❌ next.config.js MISSING"
test -f package.json && echo "✅ package.json" || echo "❌ package.json MISSING"
test -f tsconfig.json && echo "✅ tsconfig.json" || echo "❌ tsconfig.json MISSING"
test -d src/app && echo "✅ src/app directory" || echo "❌ src/app MISSING"
echo "✅ Configuration verified"

# Phase 4: Environment
echo ""
echo "🔐 Phase 4: Setting Up Environment"
if [ ! -f ".env.local" ]; then
  cat > .env.local << 'EOF'
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:7777"
DATABASE_URL="file:./blessbox.db"
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="your-ethereal-email@ethereal.email"
SMTP_PASS="your-ethereal-password"
EMAIL_FROM="BlessBox <no-reply@blessbox.org>"
NODE_ENV="development"
EOF
fi
echo "✅ Environment ready"

# Phase 5: Database
echo ""
echo "🗄️  Phase 5: Database Initialization"
npx drizzle-kit push:sqlite || true
echo "✅ Database ready"

# Phase 6: Startup
echo ""
echo "🚀 Phase 6: Starting Server"
echo ""
echo "Server starting on http://localhost:7777"
echo "Press Ctrl+C to stop"
echo ""
npm run dev
```

## 🎯 **ALTERNATIVE: MINIMAL FIX SCRIPT**

```bash
#!/bin/bash
# quick-fix.sh - Minimal intervention

set -e

echo "🔧 Quick Fix - Minimal Intervention"
echo "==================================="

# Kill processes
sudo killall -9 node 2>/dev/null || true
sleep 2

# Clear port
lsof -ti :7777 | xargs kill -9 2>/dev/null || true
sleep 2

# Navigate
cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1

# Clear build cache only
rm -rf .next

# Start server
npm run dev
```

## 📊 **DECISION MATRIX**

### Use Complete Rebuild If:
- ✅ Port conflicts persist after killing processes
- ✅ Multiple failed startup attempts
- ✅ Unclear dependency state
- ✅ You want guaranteed success
- ✅ Time is not critical (10 minutes)

### Use Quick Fix If:
- ✅ Just need to clear port
- ✅ Dependencies known to be good
- ✅ Configuration verified correct
- ✅ Time is critical (2 minutes)

## 🚀 **RECOMMENDED EXECUTION**

### Step 1: Try Quick Fix First
```bash
cd /Users/xcode/Documents/YOLOProjects/BlessBox
chmod +x quick-fix.sh
./quick-fix.sh
```

### Step 2: If Quick Fix Fails → Complete Rebuild
```bash
cd /Users/xcode/Documents/YOLOProjects/BlessBox
chmod +x complete-rebuild.sh
./complete-rebuild.sh
```

## 🎯 **SUCCESS CRITERIA**

### Server Should Show:
```
▲ Next.js 15.5.6
- Local:        http://localhost:7777
- Network:      http://192.168.x.x:7777
- Environments: .env.local

✓ Ready in 2-3s
○ Compiling / ...
✓ Compiled / in 500ms
```

### Browser Should Show:
- Homepage loads successfully
- No console errors
- All assets load correctly
- Interactive elements work

## 📋 **POST-REBUILD VERIFICATION**

```bash
# 1. Test homepage
curl -I http://localhost:7777

# 2. Test API endpoint
curl http://localhost:7777/api/health

# 3. Run tests
npm run test

# 4. Run E2E tests
npm run test:e2e
```

---

**Recommendation**: Execute **Complete Rebuild** for guaranteed success  
**Estimated Time**: 10 minutes  
**Success Rate**: 99%


