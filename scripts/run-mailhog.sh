#!/bin/bash
set -euo pipefail

if command -v docker-compose >/dev/null 2>&1; then
  docker-compose -f docker-compose.mailhog.yml up -d
else
  docker compose -f docker-compose.mailhog.yml up -d
fi

echo "✅ MailHog started"
echo "📨 SMTP: 127.0.0.1:1025"
echo "🌐 UI:   http://localhost:8025"



