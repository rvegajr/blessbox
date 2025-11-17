#!/bin/bash

# BlessBox CLI Tools Quick Check Script
# This script quickly verifies that all required CLI tools are installed

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}       BlessBox CLI Tools Status Check${NC}"
echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get version
get_version() {
    local cmd=$1
    if command_exists "$cmd"; then
        case "$cmd" in
            vercel)
                vercel --version 2>/dev/null | head -n1 || echo "installed (version unknown)"
                ;;
            turso)
                turso --version 2>/dev/null || echo "installed (version unknown)"
                ;;
            node)
                node --version 2>/dev/null || echo "installed"
                ;;
            npm)
                npm --version 2>/dev/null || echo "installed"
                ;;
            *)
                echo "installed"
                ;;
        esac
    else
        echo "not installed"
    fi
}

ALL_GOOD=true

echo -e "${BLUE}${BOLD}Core Requirements:${NC}"
echo ""

# Check Node.js
NODE_VERSION=$(get_version "node")
if [ "$NODE_VERSION" != "not installed" ]; then
    echo -e "  ${GREEN}✅ Node.js${NC} - $NODE_VERSION"
else
    echo -e "  ${RED}❌ Node.js${NC} - Not installed (required)"
    echo -e "     ${YELLOW}Install from: https://nodejs.org/${NC}"
    ALL_GOOD=false
fi

# Check npm
NPM_VERSION=$(get_version "npm")
if [ "$NPM_VERSION" != "not installed" ]; then
    echo -e "  ${GREEN}✅ npm${NC} - $NPM_VERSION"
else
    echo -e "  ${RED}❌ npm${NC} - Not installed (required)"
    ALL_GOOD=false
fi

echo ""
echo -e "${BLUE}${BOLD}Global CLI Tools for Admin Access:${NC}"
echo ""

# Check Vercel CLI
VERCEL_VERSION=$(get_version "vercel")
if [ "$VERCEL_VERSION" != "not installed" ]; then
    echo -e "  ${GREEN}✅ Vercel CLI${NC} - $VERCEL_VERSION"
    
    # Check if logged in
    if vercel whoami &>/dev/null; then
        USER=$(vercel whoami 2>/dev/null)
        echo -e "     ${CYAN}Logged in as: $USER${NC}"
    else
        echo -e "     ${YELLOW}Not logged in. Run: vercel login${NC}"
    fi
else
    echo -e "  ${RED}❌ Vercel CLI${NC} - Not installed"
    ALL_GOOD=false
fi

# Check Turso CLI
TURSO_VERSION=$(get_version "turso")
if [ "$TURSO_VERSION" != "not installed" ]; then
    echo -e "  ${GREEN}✅ Turso CLI${NC} - $TURSO_VERSION"
    
    # Check if logged in
    if turso auth status &>/dev/null; then
        echo -e "     ${CYAN}Authentication: Active${NC}"
    else
        echo -e "     ${YELLOW}Not authenticated. Run: turso auth login${NC}"
    fi
else
    echo -e "  ${RED}❌ Turso CLI${NC} - Not installed"
    ALL_GOOD=false
fi

echo ""
echo -e "${BLUE}${BOLD}Project Dependencies:${NC}"
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo -e "  ${GREEN}✅ node_modules${NC} - $COUNT packages installed"
else
    echo -e "  ${YELLOW}⚠️  node_modules${NC} - Not found"
    echo -e "     ${YELLOW}Run: npm install${NC}"
fi

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "  ${GREEN}✅ .env.local${NC} - Environment configured"
else
    echo -e "  ${YELLOW}⚠️  .env.local${NC} - Not found"
    echo -e "     ${YELLOW}Run: npm run setup:env${NC}"
fi

echo ""
echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}${BOLD}       ✅ All required CLI tools are installed!${NC}"
    echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Quick Commands:${NC}"
    echo -e "  ${CYAN}vercel${NC}           - Deploy to Vercel"
    echo -e "  ${CYAN}vercel --prod${NC}    - Deploy to production"
    echo -e "  ${CYAN}turso db list${NC}    - List your databases"
    echo -e "  ${CYAN}turso db shell${NC}   - Open database shell"
else
    echo -e "${YELLOW}${BOLD}       ⚠️  Some tools are not detected${NC}"
    echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"
fi

echo ""
