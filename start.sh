#!/bin/bash

echo "🧹 BlessBox Fresh Start - Clearing All Caches"
echo "=============================================="

# Kill any running processes
echo "🔄 Stopping any running Astro processes..."
pkill -f "astro dev" 2>/dev/null || true

echo "🗑️  Running comprehensive cache cleanup..."

# Set Turso Database Environment Variables - EDGE POWER! 🚀
export TURSO_DATABASE_URL="libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io"
# Set auth token for local development (get from Turso CLI: turso db tokens create blessbox-local-rvegajr)
export TURSO_AUTH_TOKEN="${TURSO_AUTH_TOKEN:-your-turso-auth-token-here}"

# Set Email Provider Configuration
export EMAIL_PROVIDER="sendgrid"
export EMAIL_FROM="BlessBox <noreply@blessbox.app>"

# Set Edge as the default browser for this session
export BROWSER="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"

echo "🚀 Database: Turso Edge-Powered SQLite"
echo "📊 URL: $TURSO_DATABASE_URL"

echo ""
echo "✨ Starting fresh development server..."
echo "📡 Server will be available at: http://localhost:7777"
echo "🌐 Opening Microsoft Edge automatically..."
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"

# Use the npm script that combines clean + dev
npm run dev:fresh