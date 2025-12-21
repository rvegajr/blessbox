#!/usr/bin/env bash

# BlessBox technology smoke tests (email + payments)
#
# - Loads a .env-style file directly (no deployment required)
# - Validates SendGrid and Square credentials via provider APIs (non-charging)
# - Optionally validates a running deployment via BlessBox health endpoints
#
# Examples:
#   ./scripts/test-tech.sh --env-file .env.sandbox --email-to you@example.com
#   ./scripts/test-tech.sh --env-file .env.production --base-url https://www.blessbox.org --email-to you@example.com

set -euo pipefail

ENV_FILE=""
BASE_URL=""
EMAIL_TO=""
SEND_TEST_EMAIL="0"
QUIET="0"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/test-tech.sh --env-file <path> [--base-url <url>] [--email-to <email>] [--send-test-email] [--quiet]

Options:
  --env-file <path>     Required. Path to the env file to test (.env.local / .env.production / etc).
  --base-url <url>      Optional. If provided, also hits BlessBox endpoints on that deployment.
  --email-to <email>    Optional. Recipient used for send-test-email (SendGrid direct + /api/test-production-email).
  --send-test-email     Optional. Actually sends a real test email (default: off).
  --quiet               Optional. Less output (still exits non-zero on failure).

Notes:
  - This script never charges a card. Square checks call /v2/merchants/me and /v2/locations/{id}.
  - If you test a production deployment, include DIAGNOSTICS_SECRET (or CRON_SECRET) in the env file,
    so the script can access protected diagnostics endpoints.
EOF
}

log() {
  if [[ "${QUIET}" == "1" ]]; then return 0; fi
  echo "$@"
}

fail() {
  echo "❌ $*" >&2
  exit 1
}

mask() {
  local s="${1:-}"
  if [[ -z "$s" ]]; then echo ""; return 0; fi
  local n="${#s}"
  if (( n <= 10 )); then echo "***"; return 0; fi
  echo "${s:0:6}...${s: -4}"
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

load_env() {
  [[ -f "$ENV_FILE" ]] || fail "Env file not found: $ENV_FILE"
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
}

curl_json() {
  # curl_json <url> [header...]
  local url="$1"; shift || true
  local out
  out="$(curl -sS -L "$@" -w $'\n%{http_code}' "$url" || true)"
  local code="${out##*$'\n'}"
  local body="${out%$'\n'*}"
  echo "$code"
  echo "$body"
}

sendgrid_get() {
  local path="$1"
  local url="https://api.sendgrid.com/v3${path}"
  local code body
  read -r code
  read -r body < <(curl_json "$url" -H "Authorization: Bearer ${SENDGRID_API_KEY}" -H "Content-Type: application/json")
  printf "%s\n%s" "$code" "$body"
}

square_base_url() {
  local env="${SQUARE_ENVIRONMENT:-sandbox}"
  env="$(echo "$env" | tr '[:upper:]' '[:lower:]' | xargs)"
  if [[ "$env" == "production" ]]; then
    echo "https://connect.squareup.com"
  else
    echo "https://connect.squareupsandbox.com"
  fi
}

square_get() {
  local path="$1"
  local base; base="$(square_base_url)"
  local url="${base}${path}"
  local code body
  read -r code
  read -r body < <(curl_json "$url" -H "Authorization: Bearer ${SQUARE_ACCESS_TOKEN}" -H "Square-Version: 2024-01-18" -H "Content-Type: application/json")
  printf "%s\n%s" "$code" "$body"
}

require_env_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    fail "Missing required env var in $ENV_FILE: $name"
  fi
}

main() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --env-file) ENV_FILE="${2:-}"; shift 2;;
      --base-url) BASE_URL="${2:-}"; shift 2;;
      --email-to) EMAIL_TO="${2:-}"; shift 2;;
      --send-test-email) SEND_TEST_EMAIL="1"; shift 1;;
      --quiet) QUIET="1"; shift 1;;
      -h|--help) usage; exit 0;;
      *) fail "Unknown arg: $1 (use --help)";;
    esac
  done

  [[ -n "$ENV_FILE" ]] || { usage; exit 2; }
  load_env

  # Allow base URL to come from env file
  if [[ -z "$BASE_URL" ]]; then
    BASE_URL="${BASE_URL:-}"
  fi
  if [[ -z "$BASE_URL" ]]; then
    BASE_URL="${NEXTAUTH_URL:-}"
  fi
  if [[ -z "$BASE_URL" ]]; then
    BASE_URL="${PUBLIC_APP_URL:-}"
  fi

  log "════════════════════════════════════════════════════════════════"
  log "BlessBox Tech Smoke Test"
  log "Env file: $ENV_FILE"
  if [[ -n "$BASE_URL" ]]; then log "Base URL: $BASE_URL"; fi
  log "════════════════════════════════════════════════════════════════"
  log ""

  local failures=0

  # ---------------------------------------------------------------------------
  # EMAIL: SendGrid (preferred)
  # ---------------------------------------------------------------------------
  if [[ -n "${SENDGRID_API_KEY:-}" ]]; then
    log "## Email: SendGrid"
    log "- API key: $(mask "${SENDGRID_API_KEY}")"
    log "- From email: ${SENDGRID_FROM_EMAIL:-"(not set)"}"
    log ""

    local code body

    # profile
    read -r code
    read -r body < <(sendgrid_get "/user/profile")
    if [[ "$code" == "200" ]]; then
      log "✅ SendGrid API key valid (user/profile 200)"
    else
      log "❌ SendGrid API key/profile check failed (status $code)"
      ((failures+=1))
    fi

    # senders (single sender identities)
    read -r code
    read -r body < <(sendgrid_get "/senders")
    if [[ "$code" == "200" ]]; then
      log "✅ SendGrid sender identities endpoint accessible (senders 200)"
    else
      log "⚠️  SendGrid sender identities not accessible (senders $code) — key may lack permissions"
    fi

    # authenticated domains
    read -r code
    read -r body < <(sendgrid_get "/whitelabel/domains")
    if [[ "$code" == "200" ]]; then
      log "✅ SendGrid domain authentication endpoint accessible (whitelabel/domains 200)"
    else
      log "⚠️  SendGrid domain auth not accessible (whitelabel/domains $code) — key may lack permissions"
    fi

    # optional: send real email via SendGrid API
    if [[ "$SEND_TEST_EMAIL" == "1" ]]; then
      [[ -n "$EMAIL_TO" ]] || EMAIL_TO="${TEST_EMAIL_TO:-${EMAIL_TEST_TO:-}}"
      if [[ -z "$EMAIL_TO" ]]; then
        fail "To send a test email, provide --email-to or set TEST_EMAIL_TO/EMAIL_TEST_TO in env file."
      fi
      if [[ -z "${SENDGRID_FROM_EMAIL:-}" ]]; then
        fail "To send a test email via SendGrid API, set SENDGRID_FROM_EMAIL in env file."
      fi

      log ""
      log "➡️  Sending a real test email via SendGrid..."

      local reply_to="${EMAIL_REPLY_TO:-}"
      local payload
      payload="$(cat <<EOF
{
  "personalizations": [{"to":[{"email":"$EMAIL_TO"}], "subject":"BlessBox SendGrid Smoke Test"}],
  "from": {"email":"${SENDGRID_FROM_EMAIL}","name":"${SENDGRID_FROM_NAME:-BlessBox}"},
  "content": [{"type":"text/plain","value":"BlessBox smoke test: SendGrid is configured and reachable."}]
  $( [[ -n "$reply_to" ]] && printf ', "reply_to": {"email":"%s"}' "$reply_to" || true )
}
EOF
)"

      local out code2 body2
      out="$(curl -sS -L -w $'\n%{http_code}' \
        -H "Authorization: Bearer ${SENDGRID_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "https://api.sendgrid.com/v3/mail/send" || true)"
      code2="${out##*$'\n'}"
      body2="${out%$'\n'*}"
      if [[ "$code2" == "202" ]]; then
        log "✅ SendGrid accepted email (mail/send 202)"
      else
        log "❌ SendGrid mail/send failed (status $code2)"
        if [[ "${QUIET}" != "1" ]]; then
          log "$body2"
        fi
        ((failures+=1))
      fi
    fi

    log ""
  else
    log "## Email: SendGrid"
    log "⚠️  SENDGRID_API_KEY not set in env file. Skipping SendGrid API checks."
    log ""
  fi

  # ---------------------------------------------------------------------------
  # PAYMENTS: Square (non-charging)
  # ---------------------------------------------------------------------------
  log "## Payments: Square"
  if [[ -n "${SQUARE_ACCESS_TOKEN:-}" ]]; then
    log "- Environment: ${SQUARE_ENVIRONMENT:-sandbox}"
    log "- Access token: $(mask "${SQUARE_ACCESS_TOKEN}")"
    log "- Location ID: ${SQUARE_LOCATION_ID:-"(not set)"}"
    log ""

    local code body
    read -r code
    read -r body < <(square_get "/v2/merchants/me")
    if [[ "$code" == "200" ]]; then
      log "✅ Square token valid (merchants/me 200)"
    else
      log "❌ Square token invalid or unauthorized (merchants/me $code)"
      if [[ "${QUIET}" != "1" ]]; then log "$body"; fi
      ((failures+=1))
    fi

    if [[ -n "${SQUARE_LOCATION_ID:-}" ]]; then
      read -r code
      read -r body < <(square_get "/v2/locations/${SQUARE_LOCATION_ID}")
      if [[ "$code" == "200" ]]; then
        log "✅ Square location ID valid (locations/{id} 200)"
      else
        log "❌ Square location ID invalid or inaccessible (locations/{id} $code)"
        if [[ "${QUIET}" != "1" ]]; then log "$body"; fi
        ((failures+=1))
      fi
    else
      log "⚠️  SQUARE_LOCATION_ID not set (optional, but recommended)."
    fi

    log ""
  else
    log "⚠️  SQUARE_ACCESS_TOKEN not set in env file. Skipping Square API checks."
    log ""
  fi

  # ---------------------------------------------------------------------------
  # Optional: validate deployed BlessBox endpoints
  # ---------------------------------------------------------------------------
  if [[ -n "$BASE_URL" ]]; then
    log "## Deployment checks"
    local token="${DIAGNOSTICS_SECRET:-${CRON_SECRET:-}}"
    local authHeader=()
    if [[ -n "$token" ]]; then
      authHeader=(-H "Authorization: Bearer ${token}")
      log "- Using diagnostics auth token (Bearer ***redacted***)"
    else
      log "- No DIAGNOSTICS_SECRET/CRON_SECRET in env file (protected endpoints may 401 in production)"
    fi

    local code body
    read -r code
    read -r body < <(curl_json "${BASE_URL%/}/api/system/health-check")
    if [[ "$code" == "200" ]]; then
      log "✅ /api/system/health-check OK"
    else
      log "❌ /api/system/health-check failed ($code)"
      ((failures+=1))
    fi

    read -r code
    read -r body < <(curl_json "${BASE_URL%/}/api/system/email-health" "${authHeader[@]}")
    if [[ "$code" == "200" ]]; then
      log "✅ /api/system/email-health reachable"
    else
      log "❌ /api/system/email-health failed ($code)"
      ((failures+=1))
    fi

    read -r code
    read -r body < <(curl_json "${BASE_URL%/}/api/system/square-health" "${authHeader[@]}")
    if [[ "$code" == "200" ]]; then
      log "✅ /api/system/square-health reachable"
    else
      log "❌ /api/system/square-health failed ($code)"
      ((failures+=1))
    fi

    # Optional: send via app endpoint (uses configured provider on server)
    if [[ "$SEND_TEST_EMAIL" == "1" ]]; then
      [[ -n "$EMAIL_TO" ]] || EMAIL_TO="${TEST_EMAIL_TO:-${EMAIL_TEST_TO:-}}"
      if [[ -z "$EMAIL_TO" ]]; then
        fail "To send a test email via the app endpoint, provide --email-to or set TEST_EMAIL_TO/EMAIL_TEST_TO in env file."
      fi
      if [[ -z "$token" && "${NODE_ENV:-}" == "production" ]]; then
        log "⚠️  Skipping /api/test-production-email (needs DIAGNOSTICS_SECRET or CRON_SECRET in production)."
      else
        log "➡️  Sending a real test email via BlessBox endpoint..."
        local post
        post="$(cat <<EOF
{"email":"$EMAIL_TO","fromEmail":"${SENDGRID_FROM_EMAIL:-}","replyTo":"${EMAIL_REPLY_TO:-}"}
EOF
)"
        read -r code
        read -r body < <(curl_json "${BASE_URL%/}/api/test-production-email" "${authHeader[@]}" -H "Content-Type: application/json" -d "$post")
        if [[ "$code" == "200" ]]; then
          log "✅ App email send endpoint OK (/api/test-production-email)"
        else
          log "❌ App email send endpoint failed ($code)"
          if [[ "${QUIET}" != "1" ]]; then log "$body"; fi
          ((failures+=1))
        fi
      fi
    fi

    log ""
  fi

  if [[ "$failures" -gt 0 ]]; then
    fail "Smoke tests failed: $failures failure(s)"
  fi
  log "✅ All requested checks passed."
}

main "$@"

