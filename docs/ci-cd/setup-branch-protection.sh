#!/bin/bash

# BlessBox Branch Protection Setup
# This script sets up branch protection rules for main and development branches

echo "🔒 Setting up branch protection for BlessBox repository..."

# Protect main branch
echo "Setting up main branch protection..."
gh api repos/rvegajr/blessbox/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test-and-deploy"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

# Protect development branch
echo "Setting up development branch protection..."
gh api repos/rvegajr/blessbox/branches/development/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test-and-build"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":0,"dismiss_stale_reviews":false,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --field allow_force_pushes=true \
  --field allow_deletions=false

echo "✅ Branch protection setup complete!"
echo ""
echo "📋 Branch Protection Summary:"
echo "  🔒 main branch:"
echo "    - Requires pull request reviews (1 approver)"
echo "    - Requires status checks to pass"
echo "    - Dismisses stale reviews"
echo "    - No force pushes allowed"
echo "    - Admin enforcement enabled"
echo ""
echo "  🔓 development branch:"
echo "    - Requires status checks to pass"
echo "    - Allows direct pushes for development"
echo "    - Force pushes allowed for flexibility"
echo ""
echo "🚀 Your CI/CD pipeline is now ready!"
echo "   - Push to 'development' → Runs tests + preview deployment"
echo "   - PR to 'main' → Runs validation + security scan"
echo "   - Push to 'main' → Production deployment + release"