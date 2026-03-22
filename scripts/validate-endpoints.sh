#!/usr/bin/env bash
# =============================================================================
# validate-endpoints.sh
#
# Operator-facing smoke test entrypoint for Situation Monitor.
# Validates all 57 API endpoints (46 sebuf RPC + 11 legacy REST) and reports
# pass/fail/warn per endpoint plus an aggregate summary.
#
# This script is a thin shell wrapper that delegates to the Node.js validation
# engine (scripts/validate-endpoints.mjs) for reliable JSON/body checking and
# maintainable table-driven endpoint definitions.
#
# Usage:
#   scripts/validate-endpoints.sh [OPTIONS] [BASE_URL]
#
# Options:
#   --base-url URL           Target deployment base URL
#                            (default: http://127.0.0.1:3000)
#   --degraded-domain NAME   Assert graceful degradation for a domain (NFR32)
#   --timeout-ms N           Per-request timeout in milliseconds (default: 15000)
#   -h / --help              Show help from the Node engine
#
# Examples:
#   scripts/validate-endpoints.sh --base-url https://your-preview.vercel.app
#   scripts/validate-endpoints.sh --base-url https://your-preview.vercel.app \
#     --degraded-domain market
#   scripts/validate-endpoints.sh --base-url http://127.0.0.1:3000 --timeout-ms 20000
#
# Exit codes:
#   0   All endpoints passed (warns are non-fatal)
#   1   One or more endpoints failed
#   2   Script crash
#
# See scripts/validate-endpoints.mjs for the full endpoint inventory and engine.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE="${SCRIPT_DIR}/validate-endpoints.mjs"

# Verify Node.js is available
if ! command -v node &>/dev/null; then
  echo "Error: 'node' is not in PATH. Node.js 22+ is required." >&2
  exit 2
fi

# Verify the engine script exists
if [[ ! -f "$ENGINE" ]]; then
  echo "Error: Engine script not found at $ENGINE" >&2
  exit 2
fi

# Delegate all arguments to the Node.js engine
exec node "$ENGINE" "$@"
