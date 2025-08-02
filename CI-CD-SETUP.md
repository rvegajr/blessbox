# 🚀 BlessBox CI/CD Pipeline Setup

This document outlines the complete CI/CD pipeline setup for the BlessBox project, including branch strategy, automated testing, and deployment workflows.

## 📋 Branch Strategy

### Main Branches
- **`main`** - Production branch (protected)
  - Contains stable, production-ready code
  - Automatically deploys to production on push
  - Requires pull request reviews
  - Protected against force pushes

- **`development`** - Development branch
  - Active development happens here
  - Automatically runs tests and creates preview deployments
  - Allows direct pushes for rapid development
  - Source branch for pull requests to main

### Workflow
```
development → Pull Request → main → Production Deployment
     ↓              ↓           ↓
  Preview      Validation   Production
 Deployment      & Tests     Release
```

## 🔄 CI/CD Workflows

### 1. Development CI (`development-ci.yml`)
**Triggers:** Push to `development` branch, PRs to `development`

**Actions:**
- ✅ Tests on Node.js 18.x and 20.x
- ✅ Build validation
- ✅ Lint checking
- ✅ Upload build artifacts
- 🚀 Deploy to Vercel preview (on push)

### 2. Production Deploy (`production-deploy.yml`)
**Triggers:** Push to `main` branch, manual workflow dispatch

**Actions:**
- ✅ Build validation
- 🚀 Deploy to Vercel production
- 📦 Create GitHub release with version tag
- 📝 Generate release notes

### 3. Pull Request Validation (`pull-request.yml`)
**Triggers:** Pull requests to `main` branch

**Actions:**
- ✅ Build validation
- 🔒 Security audit
- 💬 Automated PR comments
- ⚠️ Vulnerability scanning

## 🔧 Setup Instructions

### 1. Vercel Integration
Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

```bash
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id  
VERCEL_PROJECT_ID=your_vercel_project_id
```

**To get these values:**
```bash
# Get Vercel token from: https://vercel.com/account/tokens
# Get org ID and project ID:
vercel link
cat .vercel/project.json
```

### 2. Branch Protection
Run the setup script to configure branch protection:

```bash
./setup-branch-protection.sh
```

This will:
- Protect the `main` branch with required reviews
- Set up status check requirements
- Configure appropriate permissions for each branch

### 3. First Deployment
```bash
# Work on development branch
git checkout development

# Make your changes
git add .
git commit -m "feat: your feature description"
git push origin development

# Create PR to main when ready for production
gh pr create --base main --head development --title "Release: Your release title"
```

## 📊 Pipeline Status

| Branch | Build Status | Deployment | Protection |
|--------|-------------|------------|------------|
| `main` | ![Main CI](https://github.com/rvegajr/blessbox/workflows/Production%20Deploy/badge.svg) | 🟢 Production | 🔒 Protected |
| `development` | ![Dev CI](https://github.com/rvegajr/blessbox/workflows/Development%20CI/badge.svg) | 🟡 Preview | 🔓 Open |

## 🎯 Best Practices

### Development Workflow
1. **Feature Development**
   ```bash
   git checkout development
   git pull origin development
   # Make changes
   git add .
   git commit -m "feat: descriptive message"
   git push origin development
   ```

2. **Production Release**
   ```bash
   # Create PR from development to main
   gh pr create --base main --head development
   # After review and approval, merge
   # Production deployment happens automatically
   ```

### Commit Message Format
Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code formatting
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 🔍 Monitoring & Debugging

### Build Logs
- **Development:** Check Actions tab for development-ci workflow
- **Production:** Check Actions tab for production-deploy workflow
- **Vercel Logs:** Visit Vercel dashboard for deployment logs

### Common Issues
1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Review build logs in Actions tab

2. **Deployment Issues**
   - Verify Vercel secrets are correctly set
   - Check Vercel project configuration
   - Ensure build output is correct

3. **Branch Protection**
   - Required status checks must pass
   - Pull request reviews needed for main
   - Check branch protection settings in GitHub

## 🚀 Deployment URLs

- **Production:** https://bless-box.vercel.app
- **Preview:** Generated automatically for development pushes
- **Staging:** Available through Vercel preview deployments

## 📞 Support

For issues with the CI/CD pipeline:
1. Check the Actions tab for workflow runs
2. Review this documentation
3. Check Vercel dashboard for deployment status
4. Verify all secrets and configurations are correct

---

**Happy coding! 🎉** Your BlessBox project now has a professional CI/CD pipeline ready for scaling.