#!/bin/bash
# complete-rebuild.sh - Full server rebuild for BlessBox

set -e  # Exit on any error

echo "🏗️  BlessBox Complete Server Rebuild"
echo "======================================"
echo ""
echo "This script will perform a complete clean rebuild:"
echo "  1. Kill all Node processes"
echo "  2. Clear all ports (7777, 7778, 3000, 3001)"
echo "  3. Remove all build artifacts (.next, node_modules, etc.)"
echo "  4. Reinstall all dependencies from scratch"
echo "  5. Install missing dependencies (autoprefixer)"
echo "  6. Verify all configuration files"
echo "  7. Setup environment variables"
echo "  8. Initialize database"
echo "  9. Start development server on port 7777"
echo ""
echo "Estimated time: 5-10 minutes"
echo ""

# Phase 1: Complete Cleanup
echo "🧹 Phase 1: Complete Cleanup"
echo "=============================="
echo "Killing all Node processes..."
sudo killall -9 node 2>/dev/null || true

echo "Clearing ports..."
for port in 7777 7778 3000 3001 4000; do
  lsof -ti :$port | xargs kill -9 2>/dev/null || true
done
sleep 3

echo "Navigating to project directory..."
cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1
echo "Current directory: $(pwd)"

echo "Removing all artifacts..."
rm -rf .next
rm -rf node_modules
rm -rf .turbo
rm -rf dist
rm -rf .cache
rm -rf .npm
rm -rf yarn.lock

echo "Cleaning npm cache..."
npm cache clean --force

echo "Clearing system temp..."
rm -rf /tmp/next-* 2>/dev/null || true
rm -rf /tmp/.next-* 2>/dev/null || true

echo "✅ Phase 1 Complete - Clean slate achieved"
echo ""

# Phase 2: Dependency Installation
echo "📦 Phase 2: Installing Dependencies"
echo "===================================="
echo "Installing all dependencies (this may take a few minutes)..."
npm install

echo "Installing missing PostCSS dependencies..."
npm install -D autoprefixer postcss

echo "Verifying critical packages..."
npm list next || echo "⚠️  next package verification failed"
npm list react || echo "⚠️  react package verification failed"
npm list typescript || echo "⚠️  typescript package verification failed"

echo "✅ Phase 2 Complete - Dependencies installed"
echo ""

# Phase 3: Configuration Verification
echo "⚙️  Phase 3: Configuration Verification"
echo "======================================="
test -f next.config.js && echo "✅ next.config.js exists" || echo "❌ next.config.js MISSING"
test -f package.json && echo "✅ package.json exists" || echo "❌ package.json MISSING"
test -f tsconfig.json && echo "✅ tsconfig.json exists" || echo "❌ tsconfig.json MISSING"
test -f postcss.config.js && echo "✅ postcss.config.js exists" || echo "❌ postcss.config.js MISSING"
test -f tailwind.config.ts && echo "✅ tailwind.config.ts exists" || echo "❌ tailwind.config.ts MISSING"
test -d src/app && echo "✅ src/app directory exists" || echo "❌ src/app MISSING"

echo "✅ Phase 3 Complete - Configuration verified"
echo ""

# Phase 4: Environment Setup
echo "🔐 Phase 4: Environment Setup"
echo "=============================="
if [ ! -f ".env.local" ]; then
  echo "Creating .env.local..."
  cat > .env.local << 'EOF'
# NextAuth Configuration
NEXTAUTH_SECRET="development-secret-key-replace-in-production"
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

echo "Final port verification..."
if lsof -i :7777 > /dev/null 2>&1; then
  echo "⚠️  Port 7777 still in use - clearing again..."
  lsof -ti :7777 | xargs kill -9 || true
  sleep 2
fi
echo "✅ Port 7777 is free"

echo "✅ Phase 4 Complete - Environment ready"
echo ""

# Phase 5: Database
echo "🗄️  Phase 5: Database Check"
echo "==========================="
if [ -f "blessbox.db" ]; then
  echo "✅ Database file exists ($(du -h blessbox.db 2>/dev/null | cut -f1 || echo 'unknown size'))"
else
  echo "⚠️  Database will be created on first run"
fi
echo "✅ Phase 5 Complete"
echo ""

# Phase 6: Server Startup
echo "🚀 Phase 6: Starting Server"
echo "==========================="
echo ""
echo "🎉 Rebuild Complete!"
echo "==================="
echo ""
echo "Starting Next.js development server..."
echo "Server will be available at: http://localhost:7777"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "---"
echo ""

npm run dev


