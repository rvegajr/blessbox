#!/bin/bash

echo "📧 BlessBox Gmail Setup"
echo "======================="

# Check if .env.local exists and backup if it does
if [ -f ".env.local" ]; then
    echo "📋 Backing up existing .env.local to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Copy Gmail template to .env.local
echo "📄 Creating .env.local from Gmail template..."
cp gmail-setup.env .env.local

echo ""
echo "✅ Setup complete! Next steps:"
echo ""
echo "🔧 STEP 1: Edit .env.local with your Gmail credentials"
echo "------------------------------------------------------"
echo "1. Open .env.local in your editor"
echo "2. Replace 'your-email@gmail.com' with your actual Gmail address"
echo "3. Generate a Gmail App Password:"
echo "   - Go to: https://myaccount.google.com/security"
echo "   - Enable 2-Step Verification if not already enabled"
echo "   - Go to: https://myaccount.google.com/apppasswords"
echo "   - Select 'Mail' and generate a password"
echo "   - Use that 16-character password as GMAIL_PASS"
echo ""
echo "⚠️  IMPORTANT: Use App Password, NOT your regular Gmail password!"
echo ""
echo "🧪 STEP 2: Test your configuration"
echo "----------------------------------"
echo "1. Start the dev server: ./start.sh"
echo "2. Visit: http://localhost:7777/email-test"
echo "3. Click 'Test Email Configuration'"
echo "4. If successful, try 'Send Test Email'"
echo ""
echo "🎯 STEP 3: Try the contact form"
echo "-------------------------------"
echo "1. Visit: http://localhost:7777/forms/contact"
echo "2. Fill out and submit the form"
echo "3. Check your Gmail inbox for the message"
echo ""
echo "💡 Benefits of Gmail:"
echo "- ✅ Easy to set up with App Passwords"
echo "- ✅ Reliable delivery"
echo "- ✅ No external service dependencies"
echo "- ✅ Free and accessible"
echo "- ✅ Easily swappable with other providers"
echo ""
echo "📧 Your emails will be sent from: your-email@gmail.com"
echo "📬 Contact form emails will be delivered to: your-email@gmail.com"
echo ""
echo "Need help? Check the Gmail App Password guide:"
echo "https://support.google.com/accounts/answer/185833"