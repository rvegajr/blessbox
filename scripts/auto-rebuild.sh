#!/bin/bash
# Automated rebuild with logging

LOG_FILE="/Users/xcode/Documents/YOLOProjects/BlessBox/rebuild.log"

echo "🏗️  BlessBox Automated Rebuild" | tee $LOG_FILE
echo "==============================" | tee -a $LOG_FILE
echo "$(date)" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

echo "Phase 1: Killing processes..." | tee -a $LOG_FILE
sudo killall -9 node 2>/dev/null || true
for port in 7777 7778 3000; do
  lsof -ti :$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done
sleep 3
echo "✅ Processes killed" | tee -a $LOG_FILE

echo "Phase 2: Cleaning..." | tee -a $LOG_FILE
cd /Users/xcode/Documents/YOLOProjects/BlessBox
rm -rf .next node_modules .turbo dist yarn.lock
npm cache clean --force >> $LOG_FILE 2>&1
echo "✅ Cleaned" | tee -a $LOG_FILE

echo "Phase 3: Installing dependencies (this takes 3-5 minutes)..." | tee -a $LOG_FILE
npm install >> $LOG_FILE 2>&1
echo "✅ Dependencies installed" | tee -a $LOG_FILE

echo "Phase 4: Installing PostCSS..." | tee -a $LOG_FILE
npm install -D autoprefixer postcss >> $LOG_FILE 2>&1
echo "✅ PostCSS installed" | tee -a $LOG_FILE

echo "Phase 5: Creating environment..." | tee -a $LOG_FILE
if [ ! -f ".env.local" ]; then
  cat > .env.local << 'EOF'
NEXTAUTH_SECRET="development-secret-key"
NEXTAUTH_URL="http://localhost:7777"
DATABASE_URL="file:./blessbox.db"
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="test@ethereal.email"
SMTP_PASS="test-password"
EMAIL_FROM="BlessBox <no-reply@blessbox.org>"
NODE_ENV="development"
EOF
  echo "✅ .env.local created" | tee -a $LOG_FILE
else
  echo "✅ .env.local exists" | tee -a $LOG_FILE
fi

echo "" | tee -a $LOG_FILE
echo "🎉 Rebuild Complete!" | tee -a $LOG_FILE
echo "====================" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
echo "Starting server on port 7777..." | tee -a $LOG_FILE
echo "Log file: $LOG_FILE" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

exec npm run dev


