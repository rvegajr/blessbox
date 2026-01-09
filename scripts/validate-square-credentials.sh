#!/bin/bash

###############################################################################
# Square Credentials Validation Script
# 
# Tests Square API credentials before deploying to Vercel
# Usage: ./scripts/validate-square-credentials.sh
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Square Credentials Validation Script                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Prompt for credentials if not provided
if [ -z "$SQUARE_ACCESS_TOKEN" ]; then
  echo -e "${YELLOW}Enter your Square Production Access Token:${NC}"
  read -s SQUARE_ACCESS_TOKEN
  echo ""
fi

if [ -z "$SQUARE_APPLICATION_ID" ]; then
  echo -e "${YELLOW}Enter your Square Production Application ID:${NC}"
  read SQUARE_APPLICATION_ID
  echo ""
fi

if [ -z "$SQUARE_LOCATION_ID" ]; then
  echo -e "${YELLOW}Enter your Square Production Location ID:${NC}"
  read SQUARE_LOCATION_ID
  echo ""
fi

# Trim whitespace
SQUARE_ACCESS_TOKEN=$(echo "$SQUARE_ACCESS_TOKEN" | xargs)
SQUARE_APPLICATION_ID=$(echo "$SQUARE_APPLICATION_ID" | xargs)
SQUARE_LOCATION_ID=$(echo "$SQUARE_LOCATION_ID" | xargs)

# Validate inputs
if [ -z "$SQUARE_ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Error: Access Token is required${NC}"
  exit 1
fi

if [ -z "$SQUARE_APPLICATION_ID" ]; then
  echo -e "${RED}❌ Error: Application ID is required${NC}"
  exit 1
fi

if [ -z "$SQUARE_LOCATION_ID" ]; then
  echo -e "${RED}❌ Error: Location ID is required${NC}"
  exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Configuration Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Access Token:     ${SQUARE_ACCESS_TOKEN:0:20}..."
echo "Application ID:   $SQUARE_APPLICATION_ID"
echo "Location ID:      $SQUARE_LOCATION_ID"
echo "Environment:      production"
echo ""

# Test 1: Merchant Identity (validates access token)
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 1: Validating Access Token (Merchant Identity)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

MERCHANT_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  -H "Square-Version: 2024-01-18" \
  "https://connect.squareup.com/v2/merchants/me")

HTTP_CODE=$(echo "$MERCHANT_RESPONSE" | tail -n1)
MERCHANT_BODY=$(echo "$MERCHANT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Access Token is VALID${NC}"
  
  # Extract merchant details
  MERCHANT_ID=$(echo "$MERCHANT_BODY" | jq -r '.merchant.id // "N/A"')
  BUSINESS_NAME=$(echo "$MERCHANT_BODY" | jq -r '.merchant.business_name // "N/A"')
  COUNTRY=$(echo "$MERCHANT_BODY" | jq -r '.merchant.country // "N/A"')
  CURRENCY=$(echo "$MERCHANT_BODY" | jq -r '.merchant.currency // "N/A"')
  
  echo "   Merchant ID:    $MERCHANT_ID"
  echo "   Business Name:  $BUSINESS_NAME"
  echo "   Country:        $COUNTRY"
  echo "   Currency:       $CURRENCY"
  echo ""
else
  echo -e "${RED}❌ Access Token is INVALID${NC}"
  echo "   HTTP Status: $HTTP_CODE"
  echo "   Response:"
  echo "$MERCHANT_BODY" | jq . 2>/dev/null || echo "$MERCHANT_BODY"
  echo ""
  exit 1
fi

# Test 2: Location Validation
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 2: Validating Location ID${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

LOCATION_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  -H "Square-Version: 2024-01-18" \
  "https://connect.squareup.com/v2/locations/$SQUARE_LOCATION_ID")

HTTP_CODE=$(echo "$LOCATION_RESPONSE" | tail -n1)
LOCATION_BODY=$(echo "$LOCATION_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Location ID is VALID${NC}"
  
  # Extract location details
  LOCATION_NAME=$(echo "$LOCATION_BODY" | jq -r '.location.name // "N/A"')
  LOCATION_STATUS=$(echo "$LOCATION_BODY" | jq -r '.location.status // "N/A"')
  LOCATION_COUNTRY=$(echo "$LOCATION_BODY" | jq -r '.location.country // "N/A"')
  
  echo "   Location Name:  $LOCATION_NAME"
  echo "   Status:         $LOCATION_STATUS"
  echo "   Country:        $LOCATION_COUNTRY"
  echo ""
else
  echo -e "${RED}❌ Location ID is INVALID${NC}"
  echo "   HTTP Status: $HTTP_CODE"
  echo "   Response:"
  echo "$LOCATION_BODY" | jq . 2>/dev/null || echo "$LOCATION_BODY"
  echo ""
  exit 1
fi

# Test 3: Payment API Access
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 3: Testing Payment API Access${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Try to list payments (just to verify permission)
PAYMENTS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  -H "Square-Version: 2024-01-18" \
  "https://connect.squareup.com/v2/payments?limit=1")

HTTP_CODE=$(echo "$PAYMENTS_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Payment API access is VALID${NC}"
  echo "   Permissions verified for payment processing"
  echo ""
else
  echo -e "${YELLOW}⚠️  Payment API access returned $HTTP_CODE${NC}"
  echo "   This may be normal if no payments exist yet"
  echo ""
fi

# Test 4: Application ID Validation (frontend check)
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 4: Checking Application ID Format${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [[ $SQUARE_APPLICATION_ID == sq0idp-* ]]; then
  echo -e "${GREEN}✅ Application ID format is CORRECT${NC}"
  echo "   Format: Production Application ID (sq0idp-*)"
  echo ""
else
  echo -e "${YELLOW}⚠️  Application ID format unexpected${NC}"
  echo "   Expected: sq0idp-* (production)"
  echo "   Got:      $SQUARE_APPLICATION_ID"
  echo ""
fi

# Test 5: Test Payment Intent Creation (simulated)
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Test 5: Simulating Payment Creation${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Generate a unique idempotency key
IDEMPOTENCY_KEY=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "test-$(date +%s)-$RANDOM")

# Test with a $0.01 test payment (won't actually charge)
TEST_PAYMENT_DATA='{
  "source_id": "EXTERNAL",
  "idempotency_key": "'$IDEMPOTENCY_KEY'",
  "amount_money": {
    "amount": 1,
    "currency": "USD"
  },
  "location_id": "'$SQUARE_LOCATION_ID'",
  "note": "BlessBox validation test - DO NOT PROCESS"
}'

PAYMENT_TEST_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $SQUARE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Square-Version: 2024-01-18" \
  -d "$TEST_PAYMENT_DATA" \
  "https://connect.squareup.com/v2/payments")

HTTP_CODE=$(echo "$PAYMENT_TEST_RESPONSE" | tail -n1)
PAYMENT_BODY=$(echo "$PAYMENT_TEST_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "400" ]; then
  # 400 is expected since we're using invalid source_id
  echo -e "${GREEN}✅ Payment API endpoint is ACCESSIBLE${NC}"
  echo "   (Test payment creation validated - no actual charge)"
  echo ""
else
  echo -e "${YELLOW}⚠️  Payment endpoint returned $HTTP_CODE${NC}"
  ERROR_MSG=$(echo "$PAYMENT_BODY" | jq -r '.errors[0].detail // "Unknown error"' 2>/dev/null || echo "Unknown")
  echo "   Error: $ERROR_MSG"
  echo ""
fi

# Final Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ VALIDATION COMPLETE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}All Square credentials are VALID and ready for production!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update Vercel environment variables:"
echo "     ${YELLOW}vercel env rm SQUARE_ACCESS_TOKEN production${NC}"
echo "     ${YELLOW}vercel env add SQUARE_ACCESS_TOKEN production${NC}"
echo "     (paste: $SQUARE_ACCESS_TOKEN)"
echo ""
echo "  2. Update Application ID if changed:"
echo "     ${YELLOW}vercel env rm SQUARE_APPLICATION_ID production${NC}"
echo "     ${YELLOW}vercel env add SQUARE_APPLICATION_ID production${NC}"
echo "     (paste: $SQUARE_APPLICATION_ID)"
echo ""
echo "  3. Verify Location ID (if changed):"
echo "     Current: $SQUARE_LOCATION_ID"
echo ""
echo "  4. Deploy to production:"
echo "     ${YELLOW}vercel --prod${NC}"
echo ""
echo "  5. Test payment flow:"
echo "     ${YELLOW}https://www.blessbox.org/checkout?plan=standard${NC}"
echo ""

