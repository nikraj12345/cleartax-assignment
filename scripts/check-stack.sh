#!/usr/bin/env sh
set -e
API_URL="${E2E_API_URL:-http://localhost:3001}"
ORCH_URL="${E2E_ORCHESTRATOR_URL:-http://localhost:3002}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

check() {
  name="$1"
  url="$2"
  if curl -sf "$url" >/dev/null; then
    echo "OK  $name ($url)"
  else
    echo "FAIL $name ($url)"
    return 1
  fi
}

check "API" "$API_URL/health"
check "Orchestrator" "$ORCH_URL/health"
check "Web" "$WEB_URL/"
echo "All services responding."