#!/bin/bash

echo "🚀 BlessBox SendGrid Email Setup"
echo "================================="

# Check if .env.local exists and backup if it does
if [ -f ".env.local" ]; then
    echo "📋 Backing up existing .env.local to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Copy template to .env.local
echo "📄 Creating .env.local from SendGrid template..."
cp sendgrid-setup.env .env.local

echo ""
echo "✅ Setup complete! Next steps:"
echo ""
echo "1. Edit .env.local and add your SendGrid credentials:"
echo "   - SENDGRID_API_KEY: Get from https://app.sendgrid.com/settings/api_keys"
echo "   - SENDGRID_FROM_EMAIL: Must be verified in SendGrid (contact@yolovibecodebootcamp.com)"
echo "   - SENDGRID_FROM_NAME: Display name for emails"
echo ""
echo "2. Test your configuration:"
echo "   - Start the dev server: ./start.sh"
echo "   - Visit: http://localhost:7777/email-test"
echo "   - Click 'Test Email Configuration'"
echo "   - If successful, try 'Send Test Email'"
echo ""
echo "3. SendGrid Setup Requirements:"
echo "   - Create a SendGrid account at https://sendgrid.com"
echo "   - Verify your sender email address"
echo "   - Create an API key with 'Mail Send' permissions"
echo "   - Add your domain to SendGrid (optional but recommended)"
echo ""
echo "📧 Your emails will be sent from: contact@yolovibecodebootcamp.com"
echo "📬 Contact form emails will be delivered to: contact@yolovibecodebootcamp.com"
echo ""
echo "Need help? Check the SendGrid documentation: https://docs.sendgrid.com"