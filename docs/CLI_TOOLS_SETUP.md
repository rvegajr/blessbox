# BlessBox CLI Tools Setup Guide

## Overview

BlessBox requires **Vercel CLI** and **Turso CLI** to be globally installed for full admin access to deployment and database management features.

## 🚀 Quick Setup

Run the automatic installation script:

```bash
./scripts/install-global-cli-tools.sh
```

This script will:
- Check if Vercel CLI and Turso CLI are installed
- Install any missing CLI tools globally
- Provide setup instructions for each tool

## 📋 Manual Installation

### Vercel CLI

```bash
# Install globally via npm
npm install -g vercel

# Verify installation
vercel --version

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables
vercel env pull .env.local
```

### Turso CLI

#### macOS (Homebrew)
```bash
brew install tursodatabase/tap/turso
```

#### macOS/Linux (curl)
```bash
curl -sSfL https://get.tur.so/install.sh | bash

# Add to PATH (if needed)
export PATH="$HOME/.turso:$PATH"
```

#### After Installation
```bash
# Login to Turso
turso auth login

# List databases
turso db list

# Create a database
turso db create blessbox-prod

# Get database URL
turso db show blessbox-prod --url

# Create auth token
turso db tokens create blessbox-prod
```

## 🔍 Verification

Check if all tools are properly installed:

```bash
# Quick check script
./scripts/check-cli-tools.sh

# Or use npm command
npm run cli:check
```

## 📝 Available Commands

### Package.json Scripts

```bash
# Install/update global CLI tools
npm run setup:cli

# Check CLI tools status
npm run cli:check

# Setup Vercel environment
npm run setup:vercel

# Pull Vercel environment variables
npm run env:pull

# List Vercel environment variables
npm run env:list
```

## 🎯 Admin Access Features

### Vercel CLI Admin Commands

```bash
# Deployment
vercel              # Deploy to preview
vercel --prod       # Deploy to production

# Environment Variables
vercel env ls       # List all env vars
vercel env add      # Add new env var
vercel env rm       # Remove env var
vercel env pull     # Pull to .env.local

# Project Management
vercel projects     # List projects
vercel logs         # View logs
vercel domains      # Manage domains
vercel certs        # Manage SSL certificates

# Team Management
vercel teams        # Manage teams
vercel switch       # Switch between teams
```

### Turso CLI Admin Commands

```bash
# Database Management
turso db list       # List all databases
turso db create     # Create new database
turso db destroy    # Delete database
turso db show       # Show database details

# Database Access
turso db shell      # Open SQL shell
turso db tokens create  # Create auth token
turso db tokens revoke # Revoke token

# Replication
turso db replicate  # Create replica
turso db locations  # List locations

# Organizations
turso org list      # List organizations
turso org switch    # Switch organization
```

## 🔄 Auto-Check on Start

The `start.sh` script now automatically checks for these CLIs when you start the development server:

```bash
./start.sh
```

If any CLI is missing, you'll see:
- ⚠️ Warning message
- Installation instructions
- Link to the setup script

## 🛠️ Troubleshooting

### Vercel CLI Issues

```bash
# If login fails
vercel logout
vercel login

# If project linking fails
vercel link --yes

# Reset Vercel configuration
rm -rf .vercel
vercel link
```

### Turso CLI Issues

```bash
# If authentication fails
turso auth logout
turso auth login

# If CLI not in PATH (Linux/macOS)
echo 'export PATH="$HOME/.turso:$PATH"' >> ~/.bashrc
source ~/.bashrc

# For zsh users
echo 'export PATH="$HOME/.turso:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Permission Issues

If you get permission errors during global installation:

```bash
# macOS/Linux - use sudo
sudo npm install -g vercel

# Or fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## 📚 Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Turso CLI Documentation](https://docs.turso.tech/cli)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Turso Database Management](https://docs.turso.tech/databases)

## 💡 Pro Tips

1. **Keep CLIs Updated**: Regularly update to get new features
   ```bash
   npm update -g vercel
   brew upgrade turso  # macOS with Homebrew
   ```

2. **Use Aliases**: Add to your shell config
   ```bash
   alias vd="vercel dev"
   alias vp="vercel --prod"
   alias tdb="turso db"
   ```

3. **Environment Sync**: Keep local and production in sync
   ```bash
   vercel env pull .env.local
   ```

4. **Database Backups**: Regular backups with Turso
   ```bash
   turso db shell <db-name> ".backup backup.db"
   ```

---

**Need Help?** Run `./scripts/check-cli-tools.sh` to diagnose any issues.
