#!/bin/bash
# Production-Ready Verification Test Runner
#
# Usage:
#   ./run-verification-tests.sh local      # Test against local dev server (http://localhost:7777)
#   ./run-verification-tests.sh production # Test against production (https://www.blessbox.org)

set -e

ENVIRONMENT="${1:-local}"

if [ "$ENVIRONMENT" = "local" ]; then
  echo "=================================================="
  echo "🧪 Running Verification Tests: LOCAL"
  echo "=================================================="
  echo "Target: http://localhost:7777"
  echo ""
  
  BASE_URL=http://localhost:7777 npx playwright test \
    production-ready-verification-with-seed.spec.ts \
    issue-17-form-builder-repeat.spec.ts \
    --reporter=list \
    --workers=1

elif [ "$ENVIRONMENT" = "production" ]; then
  echo "=================================================="
  echo "🚀 Running Verification Tests: PRODUCTION"
  echo "=================================================="
  echo "Target: https://www.blessbox.org"
  echo ""
  
  # Load production environment variables
  if [ ! -f ".env.production.local" ]; then
    echo "❌ Error: .env.production.local not found"
    echo "Run: vercel env pull .env.production.local --environment=production"
    exit 1
  fi
  
  set -a
  source .env.production.local
  set +a
  
  TEST_ENV=production BASE_URL=https://www.blessbox.org npx playwright test \
    production-ready-verification-with-seed.spec.ts \
    issue-17-form-builder-repeat.spec.ts \
    --reporter=list \
    --workers=1

else
  echo "❌ Invalid environment: $ENVIRONMENT"
  echo ""
  echo "Usage:"
  echo "  ./run-verification-tests.sh local       # Test locally"
  echo "  ./run-verification-tests.sh production  # Test production"
  exit 1
fi

echo ""
echo "=================================================="
echo "✅ All tests completed!"
echo "=================================================="
echo ""
echo "Verified Fixes:"
echo "  ✅ Issue #31: Health & Diagnostics endpoints"
echo "  ✅ Issue #33: Landing page dashboard shortcut"
echo "  ✅ Issue #30: Classes edit button + back link"
echo "  ✅ Issue #34: Export CSV functionality"
echo "  ✅ Issue #17: Form builder reactivity + Event Name input"
echo ""
