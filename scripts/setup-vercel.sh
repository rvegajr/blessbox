#!/bin/bash

# BlessBox Vercel Environment Setup Script
# This script helps you set up environment variables in Vercel

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}       BlessBox Vercel Environment Setup${NC}"
echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo -e "${YELLOW}Install it with: npm i -g vercel${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"
echo ""

# Function to prompt for value
prompt_value() {
    local var_name=$1
    local description=$2
    local required=$3
    local default=$4
    
    if [ "$required" = "true" ]; then
        echo -e "${YELLOW}${var_name} (${description}) ${RED}[REQUIRED]${NC}"
    else
        echo -e "${YELLOW}${var_name} (${description}) ${CYAN}[optional]${NC}"
    fi
    
    if [ ! -z "$default" ]; then
        echo -e "${CYAN}Default: ${default}${NC}"
    fi
    
    read -p "Enter value (or press Enter to skip): " value
    echo "$value"
}

# Function to set environment variable in Vercel
set_vercel_env() {
    local var_name=$1
    local value=$2
    local env=$3
    
    if [ ! -z "$value" ]; then
        echo -e "${BLUE}Setting ${var_name} for ${env}...${NC}"
        echo "$value" | vercel env add "$var_name" "$env" --yes 2>/dev/null || true
    fi
}

echo -e "${MAGENTA}${BOLD}Select Environment Setup Mode:${NC}"
echo "1) Development/Preview Environment"
echo "2) Production Environment"
echo "3) Both Environments"
echo ""
read -p "Enter choice (1-3): " ENV_CHOICE

case $ENV_CHOICE in
    1)
        ENVIRONMENTS="development preview"
        echo -e "${CYAN}Setting up Development/Preview environment...${NC}"
        ;;
    2)
        ENVIRONMENTS="production"
        echo -e "${CYAN}Setting up Production environment...${NC}"
        ;;
    3)
        ENVIRONMENTS="development preview production"
        echo -e "${CYAN}Setting up all environments...${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${MAGENTA}${BOLD}Database Configuration (Turso)${NC}"
echo -e "${CYAN}Get these values from: turso db show <database-name>${NC}"
echo ""

TURSO_URL=$(prompt_value "TURSO_DATABASE_URL" "Database URL (libsql://...)" "true")
TURSO_TOKEN=$(prompt_value "TURSO_AUTH_TOKEN" "Database auth token" "true")

echo ""
echo -e "${MAGENTA}${BOLD}Email Configuration${NC}"
echo ""
EMAIL_REPLY_TO=$(prompt_value "EMAIL_REPLY_TO" "Reply-To address for outgoing mail (optional)" "false")

echo "Select email provider:"
echo "1) Gmail (with App Password)"
echo "2) SendGrid"
echo "3) SMTP (custom)"
echo "4) Skip email configuration"
read -p "Enter choice (1-4): " EMAIL_CHOICE

case $EMAIL_CHOICE in
    1)
        EMAIL_PROVIDER="gmail"
        echo ""
        echo -e "${CYAN}Gmail Setup Instructions:${NC}"
        echo "1. Enable 2FA on your Google account"
        echo "2. Generate app password at: https://myaccount.google.com/apppasswords"
        echo ""
        GMAIL_USER=$(prompt_value "GMAIL_USER" "Gmail address" "true")
        GMAIL_PASS=$(prompt_value "GMAIL_PASS" "16-character app password" "true")
        EMAIL_FROM=$GMAIL_USER
        EMAIL_FROM_NAME="BlessBox"
        ;;
    2)
        EMAIL_PROVIDER="sendgrid"
        echo ""
        echo -e "${CYAN}SendGrid Setup Instructions:${NC}"
        echo "1. Create account at: https://sendgrid.com"
        echo "2. Verify sender identity"
        echo "3. Generate API key with 'Mail Send' permission"
        echo ""
        SENDGRID_API_KEY=$(prompt_value "SENDGRID_API_KEY" "API key (starts with SG.)" "true")
        SENDGRID_FROM_EMAIL=$(prompt_value "SENDGRID_FROM_EMAIL" "Verified sender email" "true")
        SENDGRID_FROM_NAME=$(prompt_value "SENDGRID_FROM_NAME" "Sender name" "false" "BlessBox")
        EMAIL_FROM=$SENDGRID_FROM_EMAIL
        EMAIL_FROM_NAME=${SENDGRID_FROM_NAME:-"BlessBox"}
        ;;
    3)
        EMAIL_PROVIDER="smtp"
        echo ""
        echo -e "${CYAN}SMTP Setup Instructions:${NC}"
        echo "Provide credentials for your SMTP provider (or MailHog for local)."
        echo ""
        SMTP_HOST=$(prompt_value "SMTP_HOST" "SMTP host (e.g. smtp.sendgrid.net, smtp.gmail.com, 127.0.0.1)" "true")
        SMTP_PORT=$(prompt_value "SMTP_PORT" "SMTP port (587 TLS, 465 SSL, 1025 MailHog)" "false" "587")
        SMTP_SECURE=$(prompt_value "SMTP_SECURE" "true/false (usually false for 587, true for 465)" "false" "false")
        SMTP_USER=$(prompt_value "SMTP_USER" "SMTP username" "true")
        SMTP_PASS=$(prompt_value "SMTP_PASS" "SMTP password" "true")
        SMTP_FROM=$(prompt_value "SMTP_FROM" "From email (optional; defaults to SMTP_USER)" "false")
        SMTP_FROM_NAME=$(prompt_value "SMTP_FROM_NAME" "Sender name" "false" "BlessBox")
        EMAIL_FROM=${SMTP_FROM:-$SMTP_USER}
        EMAIL_FROM_NAME=${SMTP_FROM_NAME:-"BlessBox"}
        ;;
    4)
        echo -e "${YELLOW}Skipping email configuration${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${MAGENTA}${BOLD}Security Configuration${NC}"
echo ""

# Generate JWT secret if not provided
echo -e "${CYAN}Generating secure JWT secret...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}Generated: ${JWT_SECRET:0:10}...${JWT_SECRET: -10}${NC}"

echo ""
echo -e "${MAGENTA}${BOLD}Diagnostics (Optional)${NC}"
DIAGNOSTICS_SECRET=$(prompt_value "DIAGNOSTICS_SECRET" "Protect /api/system/email-health in production" "false")

echo ""
echo -e "${MAGENTA}${BOLD}Application Configuration${NC}"
echo ""

if [[ "$ENVIRONMENTS" == *"production"* ]]; then
    PUBLIC_APP_URL=$(prompt_value "PUBLIC_APP_URL" "Production URL (https://yourdomain.com)" "true")
else
    PUBLIC_APP_URL="http://localhost:7777"
fi

echo ""
echo -e "${MAGENTA}${BOLD}Payment Configuration (Optional)${NC}"
echo ""

read -p "Configure Square payment processing? (y/n): " CONFIGURE_SQUARE
if [ "$CONFIGURE_SQUARE" = "y" ]; then
    echo -e "${CYAN}Get these from: https://developer.squareup.com/apps${NC}"
    SQUARE_APPLICATION_ID=$(prompt_value "SQUARE_APPLICATION_ID" "Square Application ID" "false")
    SQUARE_ACCESS_TOKEN=$(prompt_value "SQUARE_ACCESS_TOKEN" "Square Access Token" "false")
    
    if [[ "$ENVIRONMENTS" == *"production"* ]]; then
        SQUARE_ENVIRONMENT="production"
    else
        SQUARE_ENVIRONMENT="sandbox"
    fi
fi

echo ""
echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}       Setting Environment Variables in Vercel${NC}"
echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""

# Set variables for each environment
for ENV in $ENVIRONMENTS; do
    echo -e "${MAGENTA}Setting variables for ${ENV}...${NC}"
    
    # Database
    set_vercel_env "TURSO_DATABASE_URL" "$TURSO_URL" "$ENV"
    set_vercel_env "TURSO_AUTH_TOKEN" "$TURSO_TOKEN" "$ENV"
    
    # Email
    set_vercel_env "EMAIL_PROVIDER" "$EMAIL_PROVIDER" "$ENV"
    
    if [ "$EMAIL_PROVIDER" = "gmail" ]; then
        set_vercel_env "GMAIL_USER" "$GMAIL_USER" "$ENV"
        set_vercel_env "GMAIL_PASS" "$GMAIL_PASS" "$ENV"
    elif [ "$EMAIL_PROVIDER" = "sendgrid" ]; then
        set_vercel_env "SENDGRID_API_KEY" "$SENDGRID_API_KEY" "$ENV"
        set_vercel_env "SENDGRID_FROM_EMAIL" "$SENDGRID_FROM_EMAIL" "$ENV"
        set_vercel_env "SENDGRID_FROM_NAME" "$SENDGRID_FROM_NAME" "$ENV"
    elif [ "$EMAIL_PROVIDER" = "smtp" ]; then
        set_vercel_env "SMTP_HOST" "$SMTP_HOST" "$ENV"
        set_vercel_env "SMTP_PORT" "$SMTP_PORT" "$ENV"
        set_vercel_env "SMTP_SECURE" "$SMTP_SECURE" "$ENV"
        set_vercel_env "SMTP_USER" "$SMTP_USER" "$ENV"
        set_vercel_env "SMTP_PASS" "$SMTP_PASS" "$ENV"
        set_vercel_env "SMTP_FROM" "$SMTP_FROM" "$ENV"
        set_vercel_env "SMTP_FROM_NAME" "$SMTP_FROM_NAME" "$ENV"
    fi
    
    set_vercel_env "EMAIL_FROM" "$EMAIL_FROM" "$ENV"
    set_vercel_env "EMAIL_FROM_NAME" "$EMAIL_FROM_NAME" "$ENV"
    set_vercel_env "EMAIL_REPLY_TO" "$EMAIL_REPLY_TO" "$ENV"
    
    # Security
    set_vercel_env "JWT_SECRET" "$JWT_SECRET" "$ENV"
    set_vercel_env "DIAGNOSTICS_SECRET" "$DIAGNOSTICS_SECRET" "$ENV"
    
    # Application
    set_vercel_env "PUBLIC_APP_URL" "$PUBLIC_APP_URL" "$ENV"
    
    # Payment
    if [ "$CONFIGURE_SQUARE" = "y" ]; then
        set_vercel_env "SQUARE_APPLICATION_ID" "$SQUARE_APPLICATION_ID" "$ENV"
        set_vercel_env "SQUARE_ACCESS_TOKEN" "$SQUARE_ACCESS_TOKEN" "$ENV"
        set_vercel_env "SQUARE_ENVIRONMENT" "$SQUARE_ENVIRONMENT" "$ENV"
    fi
    
    echo -e "${GREEN}✅ Completed ${ENV} environment${NC}"
    echo ""
done

echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}       ✅ Environment Setup Complete!${NC}"
echo -e "${GREEN}${BOLD}════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify environment variables:"
echo -e "   ${CYAN}vercel env ls${NC}"
echo ""
echo "2. Pull environment variables for local development:"
echo -e "   ${CYAN}vercel env pull .env.local${NC}"
echo ""
echo "3. Deploy to Vercel:"
echo -e "   ${CYAN}vercel --prod${NC}"
echo ""
echo "4. Check deployment health:"
echo -e "   ${CYAN}curl https://your-deployment-url/api/system/health-check${NC}"
echo ""

echo -e "${GREEN}🎉 Your BlessBox environment is configured!${NC}"