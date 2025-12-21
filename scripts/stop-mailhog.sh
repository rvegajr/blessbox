#!/bin/bash
set -euo pipefail

if command -v docker-compose >/devnull 2>&1; then
  docker-compose -f docker-compose.mailhog.yml down
else
  docker compose -f docker-compose.mailhog.yml down
fi

echo "🛑 MailHog stopped"



