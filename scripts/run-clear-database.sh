#!/bin/bash

# Helper script to clear production database
# Usage: ./scripts/run-clear-database.sh

set -e

echo "⚠️  DATABASE CLEAR OPERATION"
echo "======================================================================"
echo "This will DELETE ALL data from production except the super admin."
echo "======================================================================"
echo ""

# Check if required env vars are set
if [ -z "$TURSO_DATABASE_URL" ] || [ -z "$TURSO_AUTH_TOKEN" ] || [ -z "$SUPERADMIN_EMAIL" ]; then
  echo "❌ Missing required environment variables!"
  echo ""
  echo "Please set these variables:"
  echo "  export TURSO_DATABASE_URL='<your-production-turso-url>'"
  echo "  export TURSO_AUTH_TOKEN='<your-production-auth-token>'"
  echo "  export SUPERADMIN_EMAIL='<admin-email-to-preserve>'"
  echo ""
  echo "Or add them to .env.local (but don't commit!)"
  echo ""
  exit 1
fi

echo "✅ Environment variables found:"
echo "   TURSO_DATABASE_URL: ${TURSO_DATABASE_URL:0:30}..."
echo "   TURSO_AUTH_TOKEN: ${TURSO_AUTH_TOKEN:0:10}..."
echo "   SUPERADMIN_EMAIL: $SUPERADMIN_EMAIL"
echo ""
echo "Press Ctrl+C to cancel, or wait 3 seconds to proceed..."
sleep 3

echo ""
echo "🚀 Running database clear script..."
echo ""

npx tsx scripts/clear-production-database.ts

