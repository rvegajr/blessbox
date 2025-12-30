#!/bin/bash
# Verify PROD_TEST_SEED_SECRET is set and working

set -e

BASE_URL="${BASE_URL:-https://www.blessbox.org}"
SECRET="${PROD_TEST_SEED_SECRET}"

if [ -z "$SECRET" ]; then
  echo "❌ PROD_TEST_SEED_SECRET is not set"
  echo ""
  echo "Set it in your environment:"
  echo "  export PROD_TEST_SEED_SECRET=<your-secret>"
  echo ""
  echo "Or add it to .env.local:"
  echo "  PROD_TEST_SEED_SECRET=<your-secret>"
  exit 1
fi

echo "🔍 Testing PROD_TEST_SEED_SECRET against $BASE_URL..."
echo ""

# Test 1: Seed endpoint
echo "Test 1: Testing /api/test/seed-prod endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/test/seed-prod" \
  -H "Content-Type: application/json" \
  -H "x-qa-seed-token: $SECRET" \
  -d '{"seedKey": "verify-secret-test"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Seed endpoint working! (HTTP $HTTP_CODE)"
  echo "   Response: $(echo "$BODY" | jq -r '.success // "unknown"')"
else
  echo "❌ Seed endpoint failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
  exit 1
fi

echo ""

# Test 2: Verification code endpoint
echo "Test 2: Testing /api/test/verification-code endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/test/verification-code" \
  -H "Content-Type: application/json" \
  -H "x-qa-seed-token: $SECRET" \
  -d '{"email": "test-verify@example.com"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Verification code endpoint working! (HTTP $HTTP_CODE)"
  echo "   Response: $(echo "$BODY" | jq -r '.success // "unknown"')"
else
  echo "❌ Verification code endpoint failed (HTTP $HTTP_CODE)"
  echo "   Response: $BODY"
  exit 1
fi

echo ""
echo "✅ All tests passed! PROD_TEST_SEED_SECRET is configured correctly."
echo ""
echo "You can now run E2E tests:"
echo "  PROD_TEST_SEED_SECRET=$SECRET npm run test:e2e:production"

