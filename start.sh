#!/bin/bash

# BlessBox Development Server Startup Script
# This script starts the Next.js development server on port 7777
# Usage: ./start.sh [--rebuild]

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 BlessBox Development Server"
echo "=============================="
echo ""

# Check for rebuild flag
REBUILD=false
if [ "$1" = "--rebuild" ] || [ "$1" = "-r" ]; then
    REBUILD=true
    echo -e "${YELLOW}🔄 Full rebuild mode enabled${NC}"
    echo ""
fi

# Phase 1: Kill processes on relevant ports (no sudo needed)
echo "🧹 Phase 1: Cleaning processes..."
for port in 7777 7778 3000 3001; do
    if lsof -ti :$port > /dev/null 2>&1; then
        echo "  Killing process on port $port..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
    fi
done
sleep 2
echo -e "${GREEN}✅ Ports cleared${NC}"
echo ""

# Phase 2: Clean build artifacts (if rebuild)
if [ "$REBUILD" = true ]; then
    echo "🗑️  Phase 2: Removing build artifacts..."
    rm -rf .next
    rm -rf node_modules
    rm -rf .turbo
    rm -rf dist
    rm -rf yarn.lock
    echo -e "${GREEN}✅ Build artifacts removed${NC}"
    echo ""
    
    echo "📦 Phase 3: Clearing npm cache..."
    npm cache clean --force
    echo -e "${GREEN}✅ Cache cleared${NC}"
    echo ""
else
    echo "🗑️  Phase 2: Removing .next cache..."
    rm -rf .next
    echo -e "${GREEN}✅ Cache cleared${NC}"
    echo ""
fi

# Phase 4: Install dependencies
if [ ! -d "node_modules" ] || [ "$REBUILD" = true ]; then
    echo "📥 Phase 4: Installing dependencies..."
    npm install --legacy-peer-deps
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
    echo ""
else
    echo "📦 Phase 4: Dependencies check..."
    echo -e "${GREEN}✅ node_modules exists${NC}"
    echo ""
fi

# Phase 5: Environment setup
echo "🔐 Phase 5: Environment setup..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Creating .env.local...${NC}"
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
    echo -e "${GREEN}✅ .env.local created${NC}"
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi
echo ""

# Phase 6: Final port check
echo "🔍 Phase 6: Final port verification..."
if lsof -i :7777 > /dev/null 2>&1; then
    echo -e "${RED}❌ Port 7777 still in use - clearing again...${NC}"
    lsof -ti :7777 | xargs kill -9 2>/dev/null || true
    sleep 2
fi
echo -e "${GREEN}✅ Port 7777 is free${NC}"
echo ""

# Phase 7: Start server
echo "🌟 Phase 7: Starting Next.js development server..."
echo "======================================================"
echo ""
echo -e "📍 Server URL: ${GREEN}http://localhost:7777${NC}"
echo "📍 Network:    http://$(ipconfig getifaddr en0 2>/dev/null || echo 'N/A'):7777"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "======================================================"
echo ""

# Use the local binary to avoid PATH issues
./node_modules/.bin/next dev --port 7777
