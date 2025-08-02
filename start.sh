#!/bin/bash

echo "🧹 BlessBox Fresh Start - Clearing All Caches"
echo "=============================================="

# Kill any running processes
echo "🔄 Stopping any running Astro processes..."
pkill -f "astro dev" 2>/dev/null || true

echo "🗑️  Running comprehensive cache cleanup..."

# Set Edge as the default browser for this session
export BROWSER="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"

echo ""
echo "✨ Starting fresh development server..."
echo "📡 Server will be available at: http://localhost:7777"
echo "🌐 Opening Microsoft Edge automatically..."
echo ""
echo "Press Ctrl+C to stop the server"
echo "----------------------------------------"

# Use the npm script that combines clean + dev
npm run dev:fresh