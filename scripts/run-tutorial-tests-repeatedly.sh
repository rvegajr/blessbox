#!/bin/bash

# Tutorial E2E Test Reliability Checker
# Runs tutorial tests multiple times to ensure consistency

ITERATIONS=${1:-5}  # Default 5 iterations, or use first argument
BASE_URL=${BASE_URL:-http://localhost:7777}
RESULTS_DIR="./test-results/tutorial-reliability"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🎯 TUTORIAL E2E RELIABILITY TEST RUNNER 🎯                 ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "  Iterations: $ITERATIONS"
echo "  Base URL: $BASE_URL"
echo "  Results: $RESULTS_DIR"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Initialize counters
TOTAL_RUNS=0
PASSED_RUNS=0
FAILED_RUNS=0

# Track individual test results
declare -A TEST_RESULTS

echo "🚀 Starting $ITERATIONS test iterations..."
echo ""

for i in $(seq 1 $ITERATIONS); do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Iteration $i of $ITERATIONS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  # Run the tests
  if npx playwright test tests/e2e/tutorial-system-comprehensive.spec.ts \
                          tests/e2e/tutorial-individual-tests.spec.ts \
                          tests/e2e/tutorial-context-triggers.spec.ts \
                          --reporter=json \
                          --output="$RESULTS_DIR/run-$i.json" \
                          --timeout=60000 \
                          --retries=0 2>&1 | tee "$RESULTS_DIR/run-$i.log"; then
    echo "  ✅ Iteration $i: PASSED"
    ((PASSED_RUNS++))
  else
    echo "  ❌ Iteration $i: FAILED"
    ((FAILED_RUNS++))
  fi
  
  ((TOTAL_RUNS++))
  
  echo ""
  
  # Brief pause between iterations
  if [ $i -lt $ITERATIONS ]; then
    sleep 2
  fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     📊 RELIABILITY TEST RESULTS                                ║"
echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "  Total Iterations:  $TOTAL_RUNS"
echo "  Passed:            $PASSED_RUNS ✅"
echo "  Failed:            $FAILED_RUNS $([ $FAILED_RUNS -gt 0 ] && echo '⚠️' || echo '')"
echo "║                                                                ║"

# Calculate success rate
if [ $TOTAL_RUNS -gt 0 ]; then
  SUCCESS_RATE=$((PASSED_RUNS * 100 / TOTAL_RUNS))
  echo "  Success Rate:      $SUCCESS_RATE%"
  echo "║                                                                ║"
  
  if [ $SUCCESS_RATE -eq 100 ]; then
    echo "  Status: 🎉 PERFECT - 100% Reliable!"
  elif [ $SUCCESS_RATE -ge 90 ]; then
    echo "  Status: ✅ EXCELLENT - Highly Reliable"
  elif [ $SUCCESS_RATE -ge 80 ]; then
    echo "  Status: ✅ GOOD - Some Flakiness"
  elif [ $SUCCESS_RATE -ge 70 ]; then
    echo "  Status: ⚠️  FAIR - Needs Investigation"
  else
    echo "  Status: ❌ POOR - Requires Fixes"
  fi
fi

echo "║                                                                ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║                                                                ║"
echo "  Results saved to: $RESULTS_DIR"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Show recommendation based on results
if [ $FAILED_RUNS -gt 0 ]; then
  echo "⚠️  Some iterations failed. Check logs in $RESULTS_DIR for details."
  echo ""
  echo "Common fixes for flaky tutorial tests:"
  echo "  1. Increase wait times for element loading"
  echo "  2. Add explicit waits for tutorial system to load"
  echo "  3. Use waitForSelector instead of waitForTimeout"
  echo "  4. Add retry logic for Driver.js loading"
  echo ""
fi

exit $FAILED_RUNS
