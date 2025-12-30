#!/bin/bash

# Complete Authentication & Organization Test Runner
# 
# This script runs the complete E2E test suite for authentication,
# organization setup, onboarding, and site access.

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_ENV="${TEST_ENV:-local}"
BASE_URL="${BASE_URL:-http://localhost:7777}"
HEADED="${HEADED:-false}"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}🔐 BlessBox Complete Authentication E2E Test Suite${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "📍 Environment: ${GREEN}${TEST_ENV}${NC}"
echo -e "🌐 Base URL: ${GREEN}${BASE_URL}${NC}"
echo -e "👁️  Headed Mode: ${GREEN}${HEADED}${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Check if dev server is running (for local tests)
if [ "$TEST_ENV" = "local" ]; then
  echo -e "${YELLOW}⏳ Checking if dev server is running on port 7777...${NC}"
  if ! curl -s http://localhost:7777 > /dev/null 2>&1; then
    echo -e "${RED}❌ Dev server is not running!${NC}"
    echo -e "${YELLOW}💡 Please start the dev server first: npm run dev${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Dev server is running${NC}"
  echo ""
fi

# Check for production secrets if needed
if [ "$TEST_ENV" = "production" ]; then
  if [ -z "$PROD_TEST_SEED_SECRET" ]; then
    echo -e "${YELLOW}⚠️  PROD_TEST_SEED_SECRET not set - some tests may be skipped${NC}"
  else
    echo -e "${GREEN}✅ PROD_TEST_SEED_SECRET is set${NC}"
  fi
  echo ""
fi

# Build test flags
TEST_FLAGS="--config=playwright.config.ts"
if [ "$HEADED" = "true" ]; then
  TEST_FLAGS="$TEST_FLAGS --headed"
fi

echo -e "${BLUE}🧪 Running Complete Authentication Flow Tests...${NC}"
echo ""

# Run the complete auth test suite
BASE_URL="$BASE_URL" TEST_ENV="$TEST_ENV" npx playwright test \
  tests/e2e/complete-auth-organization-flow.spec.ts \
  $TEST_FLAGS \
  --reporter=list

TEST_EXIT_CODE=$?

echo ""
echo -e "${BLUE}======================================================================${NC}"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All authentication tests passed!${NC}"
  echo -e "${BLUE}======================================================================${NC}"
  echo ""
  echo -e "${GREEN}✨ Test Summary:${NC}"
  echo -e "   ${GREEN}✅ New user onboarding with 6-digit verification${NC}"
  echo -e "   ${GREEN}✅ Login with existing email${NC}"
  echo -e "   ${GREEN}✅ Full site access verification${NC}"
  echo -e "   ${GREEN}✅ Subscription & payment integration${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some tests failed!${NC}"
  echo -e "${BLUE}======================================================================${NC}"
  echo ""
  echo -e "${YELLOW}💡 Troubleshooting Tips:${NC}"
  echo -e "   - Check if the dev server is running (npm run dev)"
  echo -e "   - Verify email delivery is working (check SendGrid config)"
  echo -e "   - Check database connectivity (Turso)"
  echo -e "   - Review test output above for specific failures"
  echo -e "   - Try running with --headed flag to see browser interactions"
  echo ""
  echo -e "${YELLOW}📋 Test artifacts:${NC}"
  echo -e "   - Screenshots: playwright-report/"
  echo -e "   - Videos: test-results/"
  echo -e "   - Traces: test-results/"
  echo ""
  exit $TEST_EXIT_CODE
fi

