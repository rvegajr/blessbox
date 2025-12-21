#!/bin/bash

# Tutorial System Reliability Tester
# Runs tutorial E2E tests multiple times and reports results

ITERATIONS=${1:-10}
BASE_URL=${2:-https://www.blessbox.org}
RESULTS_FILE="./test-results/tutorial-reliability-$(date +%Y%m%d-%H%M%S).txt"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║        🎯 TUTORIAL SYSTEM RELIABILITY TEST 🎯                  ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "  Testing: Tutorial E2E Suite"
echo "  Iterations: $ITERATIONS"
echo "  URL: $BASE_URL"
echo "  Results: $RESULTS_FILE"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p ./test-results

echo "Tutorial Reliability Test" > "$RESULTS_FILE"
echo "Started: $(date)" >> "$RESULTS_FILE"
echo "URL: $BASE_URL" >> "$RESULTS_FILE"
echo "Iterations: $ITERATIONS" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

PASSED=0
FAILED=0

for i in $(seq 1 $ITERATIONS); do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Iteration $i/$ITERATIONS - $(date +%H:%M:%S)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  echo "Iteration $i/$ITERATIONS - $(date +%H:%M:%S)" >> "$RESULTS_FILE"
  
  # Run tests and capture output
  TEST_OUTPUT=$(BASE_URL=$BASE_URL npx playwright test \
    tests/e2e/tutorial-reliability-test.spec.ts \
    --reporter=list \
    --timeout=60000 \
    --retries=0 2>&1)
  
  # Check if all tests passed
  if echo "$TEST_OUTPUT" | grep -q "8 passed"; then
    echo "  ✅ PASSED (8/8 tests)"
    echo "  PASSED" >> "$RESULTS_FILE"
    ((PASSED++))
  else
    echo "  ❌ FAILED"
    echo "  FAILED" >> "$RESULTS_FILE"
    
    # Log which tests failed
    echo "$TEST_OUTPUT" | grep "✘" >> "$RESULTS_FILE"
    ((FAILED++))
  fi
  
  echo "" >> "$RESULTS_FILE"
  
  # Brief pause
  if [ $i -lt $ITERATIONS ]; then
    sleep 2
  fi
done

# Calculate statistics
SUCCESS_RATE=$((PASSED * 100 / ITERATIONS))

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║        📊 RELIABILITY TEST RESULTS                             ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
printf "  Total Iterations:  %d\n" $ITERATIONS
printf "  Passed:            %d ✅\n" $PASSED
printf "  Failed:            %d\n" $FAILED
printf "  Success Rate:      %d%%\n" $SUCCESS_RATE
echo "║                                                                ║"

# Determine status
if [ $SUCCESS_RATE -eq 100 ]; then
  STATUS="🎉 PERFECT - 100% Reliable!"
elif [ $SUCCESS_RATE -ge 90 ]; then
  STATUS="✅ EXCELLENT - Highly Reliable"
elif [ $SUCCESS_RATE -ge 80 ]; then
  STATUS="✅ GOOD - Acceptable Reliability"
elif [ $SUCCESS_RATE -ge 70 ]; then
  STATUS="⚠️  FAIR - Some Issues"
else
  STATUS="❌ POOR - Needs Fixes"
fi

echo "  Status: $STATUS"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "  Detailed results: $RESULTS_FILE"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Summary to results file
echo "" >> "$RESULTS_FILE"
echo "=== SUMMARY ===" >> "$RESULTS_FILE"
echo "Passed: $PASSED/$ITERATIONS" >> "$RESULTS_FILE"
echo "Failed: $FAILED/$ITERATIONS" >> "$RESULTS_FILE"
echo "Success Rate: $SUCCESS_RATE%" >> "$RESULTS_FILE"
echo "Status: $STATUS" >> "$RESULTS_FILE"

# Exit with success if 90%+ pass rate
if [ $SUCCESS_RATE -ge 90 ]; then
  exit 0
else
  exit 1
fi
