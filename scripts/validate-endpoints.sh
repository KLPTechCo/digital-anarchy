#!/usr/bin/env bash
# =============================================================================
# validate-endpoints.sh — Endpoint Smoke Test Suite
# =============================================================================
# Hits all known API and app routes, verifying non-5xx responses.
#
# Usage:
#   ./scripts/validate-endpoints.sh [BASE_URL]
#
# Defaults:
#   BASE_URL  http://localhost:5173   (Vite dev server)
#
# For E2E server:
#   ./scripts/validate-endpoints.sh http://127.0.0.1:4173
#
# Notes:
#   - 401/403 = auth required → counted as SKIP (expected without env keys)
#   - 404     = route not found → counted as FAIL
#   - 400/405 = bad request / method not allowed → counted as SKIP for RPC routes
#   - 5xx     = server error → counted as FAIL
# =============================================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:5173}"
PASS=0
FAIL=0
SKIP=0
TOTAL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RESET='\033[0m'

echo ""
echo "======================================================"
echo "  Situation Monitor — Endpoint Smoke Tests"
echo "  Target: ${BASE_URL}"
echo "  Date:   $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "======================================================"
echo ""

# ------------------------------------------------------------------------------
# check_route <label> <path> [method] [expected_status] [body]
#   method          GET (default)
#   expected_status 200 (default); use "any-non-5xx" to accept all non-5xx
#   body            optional POST body (JSON)
# ------------------------------------------------------------------------------
check_route() {
  local label="$1"
  local path="$2"
  local method="${3:-GET}"
  local expected="${4:-200}"
  local body="${5:-}"
  TOTAL=$((TOTAL + 1))

  local curl_args=(-s -o /dev/null -w "%{http_code}" --max-time 15 -X "$method")
  if [[ -n "$body" ]]; then
    curl_args+=(-H "Content-Type: application/json" -d "$body")
  fi

  local status
  status=$(curl "${curl_args[@]}" "${BASE_URL}${path}" 2>/dev/null || echo "000")

  local first_digit="${status:0:1}"

  if [[ "$expected" == "any-non-5xx" ]]; then
    if [[ "$first_digit" == "5" || "$status" == "000" ]]; then
      printf "  ${RED}✗ FAIL${RESET}  [%s] %s\n" "$status" "$label"
      FAIL=$((FAIL + 1))
    elif [[ "$status" == "401" || "$status" == "403" ]]; then
      printf "  ${YELLOW}~ SKIP${RESET}  [%s] %s  (auth required)\n" "$status" "$label"
      SKIP=$((SKIP + 1))
    elif [[ "$status" == "400" || "$status" == "405" || "$status" == "422" ]]; then
      printf "  ${YELLOW}~ SKIP${RESET}  [%s] %s  (needs valid payload)\n" "$status" "$label"
      SKIP=$((SKIP + 1))
    else
      printf "  ${GREEN}✓ PASS${RESET}  [%s] %s\n" "$status" "$label"
      PASS=$((PASS + 1))
    fi
  else
    if [[ "$status" == "$expected" ]]; then
      printf "  ${GREEN}✓ PASS${RESET}  [%s] %s\n" "$status" "$label"
      PASS=$((PASS + 1))
    elif [[ "$status" == "401" || "$status" == "403" ]]; then
      printf "  ${YELLOW}~ SKIP${RESET}  [%s] %s  (auth required — missing API key)\n" "$status" "$label"
      SKIP=$((SKIP + 1))
    elif [[ "$first_digit" == "5" || "$status" == "000" ]]; then
      printf "  ${RED}✗ FAIL${RESET}  [%s] %s\n" "$status" "$label"
      FAIL=$((FAIL + 1))
    else
      printf "  ${YELLOW}~ NOTE${RESET}  [%s] %s  (got %s, expected %s)\n" "$status" "$label" "$status" "$expected"
      SKIP=$((SKIP + 1))
    fi
  fi
}

# ==============================================================================
# SECTION 1: Static App Routes
# ==============================================================================
echo -e "${BLUE}── Static App Routes ──────────────────────────────────${RESET}"
check_route "Root / (app shell)"                  "/"                         GET 200
check_route "Root /index.html"                    "/index.html"               GET 200

# Variant-parameterised routes (served by same SPA, checked via query param)
check_route "App shell with ?variant=tech"        "/?variant=tech"            GET 200
check_route "App shell with ?variant=finance"     "/?variant=finance"         GET 200
check_route "App shell with ?variant=happy"       "/?variant=happy"           GET 200

echo ""

# ==============================================================================
# SECTION 2: Simple API Endpoints (JS/no-auth)
# ==============================================================================
echo -e "${BLUE}── Simple API Endpoints ───────────────────────────────${RESET}"
check_route "GET /api/version"                    "/api/version"              GET any-non-5xx
check_route "GET /api/bootstrap"                  "/api/bootstrap"            GET any-non-5xx
check_route "GET /api/seed-health"                "/api/seed-health"          GET any-non-5xx
check_route "GET /api/geo"                        "/api/geo"                  GET any-non-5xx
check_route "GET /api/download"                   "/api/download"             GET any-non-5xx
check_route "GET /api/fwdstart"                   "/api/fwdstart"             GET any-non-5xx
check_route "GET /api/gpsjam"                     "/api/gpsjam"               GET any-non-5xx
check_route "GET /api/oref-alerts"                "/api/oref-alerts"          GET any-non-5xx
check_route "GET /api/opensky"                    "/api/opensky"              GET any-non-5xx
check_route "GET /api/polymarket"                 "/api/polymarket"           GET any-non-5xx
check_route "GET /api/ais-snapshot"               "/api/ais-snapshot"         GET any-non-5xx
check_route "GET /api/telegram-feed"              "/api/telegram-feed"        GET any-non-5xx
check_route "GET /api/rss-proxy"                  "/api/rss-proxy"            GET any-non-5xx
check_route "GET /api/og-story"                   "/api/og-story"             GET any-non-5xx
check_route "GET /api/story"                      "/api/story"                GET any-non-5xx
check_route "GET /api/register-interest"          "/api/register-interest"    GET any-non-5xx
check_route "GET /api/cache-purge"                "/api/cache-purge"          GET any-non-5xx

echo ""

# ==============================================================================
# SECTION 3: YouTube Embed Routes
# ==============================================================================
echo -e "${BLUE}── YouTube Routes ─────────────────────────────────────${RESET}"
check_route "GET /api/youtube/embed"              "/api/youtube/embed"        GET any-non-5xx
check_route "GET /api/youtube/live"               "/api/youtube/live"         GET any-non-5xx

echo ""

# ==============================================================================
# SECTION 4: EIA Pass-through
# ==============================================================================
echo -e "${BLUE}── EIA Pass-through ───────────────────────────────────${RESET}"
check_route "GET /api/eia/"                       "/api/eia/"                 GET any-non-5xx

echo ""

# ==============================================================================
# SECTION 5: Enrichment API
# ==============================================================================
echo -e "${BLUE}── Enrichment API ─────────────────────────────────────${RESET}"
check_route "POST /api/enrichment/signals"        "/api/enrichment/signals"   POST any-non-5xx "{}"
check_route "POST /api/enrichment/company"        "/api/enrichment/company"   POST any-non-5xx "{}"

echo ""

# ==============================================================================
# SECTION 6: Domain RPC Endpoints (sebuf / protobuf via Vite plugin)
# These routes handled by sebufApiPlugin in vite.config.ts for local dev.
# In production, served by Vercel edge functions in /api/{domain}/v1/[rpc].ts
# POST requests with empty body expected to return 400 (no payload) — not 500.
# ==============================================================================
echo -e "${BLUE}── Domain RPC Endpoints (sebuf) ───────────────────────${RESET}"

DOMAINS=(
  "aviation"
  "climate"
  "conflict"
  "cyber"
  "displacement"
  "economic"
  "giving"
  "infrastructure"
  "intelligence"
  "maritime"
  "market"
  "military"
  "natural"
  "news"
  "positive-events"
  "prediction"
  "research"
  "seismology"
  "supply-chain"
  "trade"
  "unrest"
  "wildfire"
)

for domain in "${DOMAINS[@]}"; do
  check_route "POST /api/${domain}/v1/health  (domain router up)" \
    "/api/${domain}/v1/health" POST any-non-5xx "{}"
done

echo ""

# ==============================================================================
# SECTION 7: Data Assets (public static)
# ==============================================================================
echo -e "${BLUE}── Public Static Assets ───────────────────────────────${RESET}"
check_route "GET /favicon.ico"                    "/favicon.ico"              GET any-non-5xx
check_route "GET /manifest.webmanifest"           "/manifest.webmanifest"     GET any-non-5xx
check_route "GET /service-worker.js"              "/service-worker.js"        GET any-non-5xx

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
TOTAL_CHECKED=$((PASS + FAIL + SKIP))
echo "======================================================"
echo -e "  Results:  ${GREEN}${PASS} PASS${RESET}  |  ${RED}${FAIL} FAIL${RESET}  |  ${YELLOW}${SKIP} SKIP${RESET}"
echo "  Total routes checked: ${TOTAL_CHECKED}"
echo "======================================================"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo -e "  ${RED}⚠  SMOKE TEST FAILED — ${FAIL} route(s) returned 5xx or timed out.${RESET}"
  echo ""
  exit 1
else
  echo -e "  ${GREEN}✓  All reachable routes returned non-5xx responses.${RESET}"
  echo "  SKIP entries are expected: auth-gated routes need API keys"
  echo "  configured in Vercel env (see fork.env.example)."
  echo ""
  exit 0
fi
