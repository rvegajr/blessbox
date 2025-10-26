#!/bin/bash
# recovery.sh - Complete BlessBox Server Recovery

set -e  # Exit on error

echo "🚀 BlessBox Server Recovery Script"
echo "===================================="

echo ""
echo "📍 Phase 1: Environmental Cleanup"
echo "Killing all Node processes..."
killall -9 node 2>/dev/null || true
pkill -9 node 2>/dev/null || true
lsof -ti :7777 | xargs kill -9 2>/dev/null || true
lsof -ti :7778 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 2

echo "Navigating to project directory..."
cd /Users/xcode/Documents/YOLOProjects/BlessBox || exit 1
echo "Current directory: $(pwd)"

echo "Removing build artifacts..."
rm -rf .next
rm -rf node_modules
rm -rf .turbo
rm -rf dist
rm -f yarn.lock

echo "Cleaning npm cache..."
npm cache clean --force

echo ""
echo "📦 Phase 2: Dependency Installation"
echo "Installing dependencies..."
npm install

echo "Installing missing PostCSS dependencies..."
npm install -D autoprefixer

echo ""
echo "⚙️  Phase 3: Configuration Check"
echo "Verifying configurations..."
test -f next.config.js && echo "✓ next.config.js exists" || echo "✗ next.config.js missing"
test -f package.json && echo "✓ package.json exists" || echo "✗ package.json missing"
test -f tsconfig.json && echo "✓ tsconfig.json exists" || echo "✗ tsconfig.json missing"
test -f postcss.config.js && echo "✓ postcss.config.js exists" || echo "✗ postcss.config.js missing"
test -f tailwind.config.ts && echo "✓ tailwind.config.ts exists" || echo "✗ tailwind.config.ts missing"
test -f .env.local && echo "✓ .env.local exists" || echo "⚠️  .env.local missing (will need to create)"

echo ""
echo "🗄️  Phase 4: Database Check"
test -f blessbox.db && echo "✓ Database exists" || echo "⚠️  Database will be created on first run"

echo ""
echo "🎉 Recovery Complete!"
echo "===================================="
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:7777"
echo "3. Test: npm run test:e2e"
echo ""


