#!/bin/bash

# Run all production E2E tests
# This script runs all E2E tests against the production environment

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🧪 Running Production E2E Tests                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Production URL: https://www.blessbox.org"
echo ""

# Set production environment
export BASE_URL="https://www.blessbox.org"
export TEST_ENV="production"

# Run all E2E tests
echo "🚀 Running all E2E tests against production..."
echo ""

npx playwright test \
  --reporter=list \
  --timeout=60000 \
  --workers=1

echo ""
echo "✅ Production tests complete!"
echo ""

