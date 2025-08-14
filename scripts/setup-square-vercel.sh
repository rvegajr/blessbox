#!/bin/bash

# Square Payment Configuration for Vercel
echo "🔧 Setting up Square Payment credentials in Vercel..."

# Production Square credentials
echo "Setting SQUARE_APPLICATION_ID for production..."
echo "sq0idp-ILxW5EBGufGuE1-FsJTpbg" | vercel env add SQUARE_APPLICATION_ID production --yes 2>/dev/null || echo "SQUARE_APPLICATION_ID already exists"

echo "Setting SQUARE_ACCESS_TOKEN for production..."
echo "EAAAl55EVF4Hyu8QAWCU_ovRdLwFQEPHp21n8K6LvZtU4PGZ70DDfOn-SRictvY3" | vercel env add SQUARE_ACCESS_TOKEN production --yes 2>/dev/null || echo "SQUARE_ACCESS_TOKEN already exists"

echo "Setting SQUARE_ENVIRONMENT for production..."
echo "production" | vercel env add SQUARE_ENVIRONMENT production --yes 2>/dev/null || echo "SQUARE_ENVIRONMENT already exists"

# Development/Preview Square credentials (sandbox)
echo "Setting SQUARE_APPLICATION_ID for development/preview..."
echo "sandbox-sq0idb-wmodH19wX_VVwhJOkrunbw" | vercel env add SQUARE_APPLICATION_ID preview --yes 2>/dev/null || echo "SQUARE_APPLICATION_ID already exists"

echo "Setting SQUARE_ACCESS_TOKEN for development/preview..."
echo "EAAAl0pENUgztZDUnprG7tlvbpzMVoDdTPBxjQWfaLddD9YN8OlXWyRaHo0P-BQ4" | vercel env add SQUARE_ACCESS_TOKEN preview --yes 2>/dev/null || echo "SQUARE_ACCESS_TOKEN already exists"

echo "Setting SQUARE_ENVIRONMENT for development/preview..."
echo "sandbox" | vercel env add SQUARE_ENVIRONMENT preview --yes 2>/dev/null || echo "SQUARE_ENVIRONMENT already exists"

echo ""
echo "✅ Square Payment credentials configured!"
echo ""
echo "📋 Configuration Summary:"
echo "  Production: Using live Square credentials"
echo "  Preview/Dev: Using sandbox credentials"
echo ""
echo "🔍 Verify with: vercel env ls"
