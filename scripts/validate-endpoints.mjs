#!/usr/bin/env node

/**
 * Endpoint smoke test engine for Situation Monitor.
 *
 * Validates all 57 API endpoints (46 sebuf RPC + 11 legacy REST) and reports
 * pass/fail/warn per endpoint plus an aggregate summary.
 *
 * Can be run directly as a CLI tool or imported as a module for unit testing.
 *
 * Usage (CLI):
 *   node scripts/validate-endpoints.mjs [--base-url URL] [--degraded-domain DOMAIN] [--timeout-ms N]
 *   node scripts/validate-endpoints.mjs https://your-preview.vercel.app
 *
 * Usage (import):
 *   import { runValidation, ENDPOINTS, EXPECTED_TOTAL } from './validate-endpoints.mjs';
 */

import { fileURLToPath } from 'node:url';

// ── Expected totals (source-of-truth) ────────────────────────────────────────
export const EXPECTED_TOTAL = 57;
export const EXPECTED_RPC_COUNT = 46;
export const EXPECTED_LEGACY_COUNT = 11;

// ── Degradation detection keywords ───────────────────────────────────────────
// These indicate a graceful degradation response rather than a hard failure.
export const DEGRADATION_KEYWORDS = [
  'not configured',
  'unavailable',
  'skipReason',
  'skip_reason',
  'degraded',
  'fallback',
  'no key',
  'api key',
  'missing key',
  'disabled',
  'not available',
  'service unavailable',
];

// ── Endpoint inventory (46 sebuf RPC + 11 legacy REST = 57 total) ────────────
//
// Each entry:
//   name     — human-readable label
//   path     — URL path (relative to base URL)
//   type     — 'rpc' | 'legacy'
//   domain   — grouping key for degraded-mode assertions
//
// To maintain this list: add/remove entries here when routes change.
// The EXPECTED_TOTAL guard will warn if the list length drifts from 57.
export const ENDPOINTS = [
  // ── sebuf RPC (46) ──────────────────────────────────────────────────────

  // Aviation (1)
  { name: 'ListAirportDelays',        path: '/api/aviation/v1/list-airport-delays',             type: 'rpc', domain: 'aviation' },

  // Climate (1)
  { name: 'ListClimateAnomalies',     path: '/api/climate/v1/list-climate-anomalies',           type: 'rpc', domain: 'climate' },

  // Conflict (4)
  { name: 'ListAcledEvents',          path: '/api/conflict/v1/list-acled-events',               type: 'rpc', domain: 'conflict' },
  { name: 'ListUcdpEvents',           path: '/api/conflict/v1/list-ucdp-events',                type: 'rpc', domain: 'conflict' },
  { name: 'ListIranEvents',           path: '/api/conflict/v1/list-iran-events',                type: 'rpc', domain: 'conflict' },
  { name: 'GetHumanitarianSummary',   path: '/api/conflict/v1/get-humanitarian-summary',        type: 'rpc', domain: 'conflict' },

  // Cyber (1)
  { name: 'ListCyberThreats',         path: '/api/cyber/v1/list-cyber-threats',                 type: 'rpc', domain: 'cyber' },

  // Displacement (1)
  { name: 'GetDisplacementSummary',   path: '/api/displacement/v1/get-displacement-summary',   type: 'rpc', domain: 'displacement' },

  // Economic (4)
  { name: 'GetFredSeries',            path: '/api/economic/v1/get-fred-series',                 type: 'rpc', domain: 'economic' },
  { name: 'ListWorldBankIndicators',  path: '/api/economic/v1/list-world-bank-indicators',      type: 'rpc', domain: 'economic' },
  { name: 'GetEnergyPrices',          path: '/api/economic/v1/get-energy-prices',               type: 'rpc', domain: 'economic' },
  { name: 'GetMacroSignals',          path: '/api/economic/v1/get-macro-signals',               type: 'rpc', domain: 'economic' },

  // Giving (1)
  { name: 'GetGivingSummary',         path: '/api/giving/v1/get-giving-summary',                type: 'rpc', domain: 'giving' },

  // Infrastructure (2)
  { name: 'ListInternetOutages',      path: '/api/infrastructure/v1/list-internet-outages',    type: 'rpc', domain: 'infrastructure' },
  { name: 'ListServiceStatuses',      path: '/api/infrastructure/v1/list-service-statuses',    type: 'rpc', domain: 'infrastructure' },

  // Intelligence (2)
  { name: 'GetRiskScores',            path: '/api/intelligence/v1/get-risk-scores',             type: 'rpc', domain: 'intelligence' },
  { name: 'GetCountryIntelBrief',     path: '/api/intelligence/v1/get-country-intel-brief',     type: 'rpc', domain: 'intelligence' },

  // Maritime (2)
  { name: 'GetVesselSnapshot',        path: '/api/maritime/v1/get-vessel-snapshot',             type: 'rpc', domain: 'maritime' },
  { name: 'ListNavigationalWarnings', path: '/api/maritime/v1/list-navigational-warnings',      type: 'rpc', domain: 'maritime' },

  // Market (7)
  { name: 'ListMarketQuotes',         path: '/api/market/v1/list-market-quotes',                type: 'rpc', domain: 'market' },
  { name: 'ListCryptoQuotes',         path: '/api/market/v1/list-crypto-quotes',                type: 'rpc', domain: 'market' },
  { name: 'ListCommodityQuotes',      path: '/api/market/v1/list-commodity-quotes',             type: 'rpc', domain: 'market' },
  { name: 'GetSectorSummary',         path: '/api/market/v1/get-sector-summary',                type: 'rpc', domain: 'market' },
  { name: 'ListEtfFlows',             path: '/api/market/v1/list-etf-flows',                    type: 'rpc', domain: 'market' },
  { name: 'ListGulfQuotes',           path: '/api/market/v1/list-gulf-quotes',                  type: 'rpc', domain: 'market' },
  { name: 'ListStablecoinMarkets',    path: '/api/market/v1/list-stablecoin-markets',           type: 'rpc', domain: 'market' },

  // Military (3)
  { name: 'ListMilitaryFlights',      path: '/api/military/v1/list-military-flights',           type: 'rpc', domain: 'military' },
  { name: 'ListMilitaryBases',        path: '/api/military/v1/list-military-bases',             type: 'rpc', domain: 'military' },
  { name: 'GetTheaterPosture',        path: '/api/military/v1/get-theater-posture',             type: 'rpc', domain: 'military' },

  // Natural (1)
  { name: 'ListNaturalEvents',        path: '/api/natural/v1/list-natural-events',              type: 'rpc', domain: 'natural' },

  // News (2)
  { name: 'ListFeedDigest',           path: '/api/news/v1/list-feed-digest',                    type: 'rpc', domain: 'news' },
  { name: 'SummarizeArticle',         path: '/api/news/v1/summarize-article',                   type: 'rpc', domain: 'news' },

  // Positive Events (1)
  { name: 'ListPositiveGeoEvents',    path: '/api/positive-events/v1/list-positive-geo-events', type: 'rpc', domain: 'positive-events' },

  // Prediction (1)
  { name: 'ListPredictionMarkets',    path: '/api/prediction/v1/list-prediction-markets',       type: 'rpc', domain: 'prediction' },

  // Research (4)
  { name: 'ListArxivPapers',          path: '/api/research/v1/list-arxiv-papers',               type: 'rpc', domain: 'research' },
  { name: 'ListTrendingRepos',        path: '/api/research/v1/list-trending-repos',             type: 'rpc', domain: 'research' },
  { name: 'ListHackernewsItems',      path: '/api/research/v1/list-hackernews-items',           type: 'rpc', domain: 'research' },
  { name: 'ListTechEvents',           path: '/api/research/v1/list-tech-events',                type: 'rpc', domain: 'research' },

  // Seismology (1)
  { name: 'ListEarthquakes',          path: '/api/seismology/v1/list-earthquakes',              type: 'rpc', domain: 'seismology' },

  // Supply Chain (2)
  { name: 'GetShippingRates',         path: '/api/supply-chain/v1/get-shipping-rates',          type: 'rpc', domain: 'supply-chain' },
  { name: 'GetChokepointStatus',      path: '/api/supply-chain/v1/get-chokepoint-status',       type: 'rpc', domain: 'supply-chain' },

  // Trade (3)
  { name: 'GetTradeRestrictions',     path: '/api/trade/v1/get-trade-restrictions',             type: 'rpc', domain: 'trade' },
  { name: 'GetTariffTrends',          path: '/api/trade/v1/get-tariff-trends',                  type: 'rpc', domain: 'trade' },
  { name: 'GetTradeFlows',            path: '/api/trade/v1/get-trade-flows',                    type: 'rpc', domain: 'trade' },

  // Unrest (1)
  { name: 'ListUnrestEvents',         path: '/api/unrest/v1/list-unrest-events',                type: 'rpc', domain: 'unrest' },

  // Wildfire (1)
  { name: 'ListFireDetections',       path: '/api/wildfire/v1/list-fire-detections',            type: 'rpc', domain: 'wildfire' },

  // ── Legacy REST (11) ────────────────────────────────────────────────────────
  { name: 'version',                  path: '/api/version',                                      type: 'legacy', domain: 'version' },
  { name: 'bootstrap',                path: '/api/bootstrap',                                    type: 'legacy', domain: 'bootstrap' },
  { name: 'seed-health',              path: '/api/seed-health',                                  type: 'legacy', domain: 'seed-health' },
  { name: 'geo',                      path: '/api/geo',                                           type: 'legacy', domain: 'geo' },
  { name: 'gpsjam',                   path: '/api/gpsjam',                                        type: 'legacy', domain: 'gpsjam' },
  { name: 'oref-alerts',              path: '/api/oref-alerts',                                   type: 'legacy', domain: 'oref-alerts' },
  { name: 'ais-snapshot',             path: '/api/ais-snapshot',                                  type: 'legacy', domain: 'ais-snapshot' },
  { name: 'rss-proxy',                path: '/api/rss-proxy',                                     type: 'legacy', domain: 'rss-proxy' },
  { name: 'og-story',                 path: '/api/og-story',                                      type: 'legacy', domain: 'og-story' },
  { name: 'eia',                      path: '/api/eia',                                            type: 'legacy', domain: 'eia' },
  { name: 'opensky',                  path: '/api/opensky',                                       type: 'legacy', domain: 'opensky' },
];

// ── Colour helpers ────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
};

const icon = { PASS: `${C.green}✓${C.reset}`, FAIL: `${C.red}✗${C.reset}`, WARN: `${C.yellow}~${C.reset}`, DEGRADED_PASS: `${C.cyan}↓${C.reset}` };

// ── Core probe ────────────────────────────────────────────────────────────────

/**
 * Send a single HTTP request and return raw response data.
 *
 * @param {object} endpoint  - Entry from ENDPOINTS array
 * @param {object} options   - { baseUrl, timeoutMs, fetchFn, apiKey, origin }
 * @returns {Promise<{endpoint, status, bodyText, elapsed, error?}>}
 */
export async function probeEndpoint(endpoint, options) {
  const {
    baseUrl = 'http://127.0.0.1:3000',
    timeoutMs = 15_000,
    fetchFn = globalThis.fetch,
    apiKey = '',
    origin = 'https://worldmonitor.app',
  } = options;

  const url = `${baseUrl}${endpoint.path}`;
  const t0 = Date.now();

  try {
    const resp = await fetchFn(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Origin: origin,
        Referer: `${origin}/`,
        'User-Agent': 'validate-endpoints/1.0',
        ...(apiKey ? { 'X-WorldMonitor-Key': apiKey } : {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    const elapsed = Date.now() - t0;
    let bodyText = '';
    try {
      bodyText = await resp.text();
    } catch {
      // body read failed — treat as empty
    }

    return { endpoint, status: resp.status, bodyText, elapsed };
  } catch (err) {
    const elapsed = Date.now() - t0;
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    return {
      endpoint,
      status: 0,
      bodyText: '',
      elapsed,
      error: isTimeout ? `Timeout after ${timeoutMs}ms` : err.message,
    };
  }
}

// ── Classification ────────────────────────────────────────────────────────────

/**
 * Classify a probe result as PASS / WARN / FAIL / DEGRADED_PASS.
 *
 * Outcome semantics:
 *   PASS          — 2xx response with non-empty body
 *   WARN          — 4xx (not 404): route exists but needs auth or params
 *   FAIL          — transport error, 5xx, 404, or 2xx with empty body
 *   DEGRADED_PASS — degraded domain: non-500 with at least one degradation keyword
 *
 * @param {object} probeResult - From probeEndpoint()
 * @param {string} degradedDomain - Domain name under degradation test (or '')
 * @returns {{ outcome: string, reason: string|null }}
 */
export function classifyResult(probeResult, degradedDomain = '') {
  const { endpoint, status, bodyText, error } = probeResult;
  const isDegradedTarget = Boolean(degradedDomain) && endpoint.domain === degradedDomain;

  // Transport / timeout failure
  if (error || status === 0) {
    return { outcome: 'FAIL', reason: error || 'Connection failed / timeout' };
  }

  // Route not found — hard failure in all modes
  if (status === 404) {
    return { outcome: 'FAIL', reason: 'HTTP 404 — route missing' };
  }

  // Server error
  if (status >= 500) {
    if (isDegradedTarget) {
      return {
        outcome: 'FAIL',
        reason: `HTTP ${status} — 5xx during degraded-mode test (expected graceful non-500 response)`,
      };
    }
    return { outcome: 'FAIL', reason: `HTTP ${status} — server error` };
  }

  // Degraded target — non-500 at this point, check body for degradation signal
  if (isDegradedTarget) {
    const bodyLower = (bodyText || '').toLowerCase();
    const hasDegradationSignal = DEGRADATION_KEYWORDS.some((kw) =>
      bodyLower.includes(kw.toLowerCase()),
    );

    if (hasDegradationSignal) {
      return {
        outcome: 'DEGRADED_PASS',
        reason: `HTTP ${status} with degradation signal — graceful degradation confirmed`,
      };
    }

    // Non-500 but no degradation keyword — possibly key is still active
    return {
      outcome: 'WARN',
      reason: `HTTP ${status} but no degradation signal found (API key may still be active)`,
    };
  }

  // Client errors (auth, bad request) — route exists, API key or params needed
  if (status >= 400) {
    return { outcome: 'WARN', reason: `HTTP ${status} — route exists, auth or params needed` };
  }

  // 2xx — validate body
  if (!bodyText || bodyText.trim() === '') {
    return { outcome: 'FAIL', reason: `HTTP ${status} with empty response body` };
  }

  // Try JSON parse — non-JSON on a 2xx is suspicious but not necessarily broken
  try {
    JSON.parse(bodyText);
  } catch {
    return { outcome: 'WARN', reason: `HTTP ${status} — body is not valid JSON (may be HTML error page)` };
  }

  return { outcome: 'PASS', reason: null };
}

// ── Full validation run ───────────────────────────────────────────────────────

/**
 * Run the full smoke test against all ENDPOINTS.
 *
 * @param {object} options
 *   baseUrl        {string}    Target deployment base URL (default: http://127.0.0.1:3000)
 *   degradedDomain {string}    Domain to assert graceful degradation for (default: '')
 *   timeoutMs      {number}    Per-request timeout in milliseconds (default: 15000)
 *   fetchFn        {function}  Fetch implementation — override for testing (default: globalThis.fetch)
 *   apiKey         {string}    Optional API key header value (default: process.env.WORLDMONITOR_KEY)
 *   origin         {string}    Origin header value
 *   silent         {boolean}   Suppress all console output (default: false)
 *
 * @returns {Promise<{results, passed, warned, failed, actual, countMismatch, exitCode}>}
 */
export async function runValidation(options = {}) {
  const {
    baseUrl = 'http://127.0.0.1:3000',
    degradedDomain = '',
    timeoutMs = 15_000,
    fetchFn = globalThis.fetch,
    apiKey = process.env.WORLDMONITOR_KEY || '',
    origin = 'https://worldmonitor.app',
    silent = false,
  } = options;

  const log = silent ? () => {} : (msg) => process.stdout.write(msg + '\n');

  // ── Header ──────────────────────────────────────────────────────────────────
  log('');
  log(`${C.bold}=== Endpoint Smoke Test ===${C.reset}`);
  log(`Base URL        : ${baseUrl}`);
  log(`Expected total  : ${EXPECTED_TOTAL} (${EXPECTED_RPC_COUNT} RPC + ${EXPECTED_LEGACY_COUNT} legacy REST)`);
  if (degradedDomain) {
    log(`${C.yellow}Degraded domain : ${degradedDomain} — verifying graceful degradation (NFR32)${C.reset}`);
  }
  log('');

  // ── Inventory guard ──────────────────────────────────────────────────────────
  const actualInventory = ENDPOINTS.length;
  if (actualInventory !== EXPECTED_TOTAL) {
    log(
      `${C.yellow}⚠ WARNING: endpoint inventory has ${actualInventory} entries ` +
      `but EXPECTED_TOTAL is ${EXPECTED_TOTAL}. ` +
      `Update EXPECTED_TOTAL or the ENDPOINTS list to resolve drift.${C.reset}`,
    );
    log('');
  }

  // ── Per-endpoint probing ──────────────────────────────────────────────────────
  const results = [];
  let currentType = null;

  for (const endpoint of ENDPOINTS) {
    // Section header when type changes
    if (endpoint.type !== currentType) {
      currentType = endpoint.type;
      const label = currentType === 'rpc'
        ? `sebuf RPC (${EXPECTED_RPC_COUNT} expected)`
        : `Legacy REST (${EXPECTED_LEGACY_COUNT} expected)`;
      log(`${C.bold}─── ${label} ───${C.reset}`);
    }

    const probe = await probeEndpoint(endpoint, { baseUrl, timeoutMs, fetchFn, apiKey, origin });
    const { outcome, reason } = classifyResult(probe, degradedDomain);
    const result = { ...probe, outcome, reason };
    results.push(result);

    const statusStr = probe.status > 0 ? `HTTP ${probe.status}` : 'ERR';
    const latencyStr = `${probe.elapsed}ms`;
    const reasonStr = reason ? ` — ${reason}` : '';
    log(`  ${icon[outcome] ?? icon.FAIL}  ${endpoint.name.padEnd(30)} ${statusStr.padEnd(8)} ${latencyStr.padStart(7)}${reasonStr}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  const passed        = results.filter((r) => r.outcome === 'PASS').length;
  const degradedPass  = results.filter((r) => r.outcome === 'DEGRADED_PASS').length;
  const warned        = results.filter((r) => r.outcome === 'WARN').length;
  const failed        = results.filter((r) => r.outcome === 'FAIL').length;
  const actual        = results.length;
  const countMismatch = actual !== EXPECTED_TOTAL;

  log('');
  log(`${C.bold}════════════════════════════════════════${C.reset}`);
  log(`${C.bold}  Smoke Test Summary${C.reset}`);
  log(`${C.bold}════════════════════════════════════════${C.reset}`);
  log(`  Tested     : ${actual} endpoints`);
  log(`  Expected   : ${EXPECTED_TOTAL} endpoints${countMismatch ? `  ${C.yellow}⚠ COUNT MISMATCH${C.reset}` : ''}`);
  log(`  ${C.green}Passed${C.reset}     : ${passed}`);
  if (degradedPass > 0) {
    log(`  ${C.cyan}Degraded✓${C.reset}  : ${degradedPass}  (graceful degradation confirmed)`);
  }
  log(`  ${C.yellow}Warned${C.reset}     : ${warned}  (route exists, auth or params needed)`);
  log(`  ${C.red}Failed${C.reset}     : ${failed}`);

  if (countMismatch) {
    log('');
    log(
      `  ${C.yellow}${C.bold}⚠ Endpoint count mismatch: tested ${actual}, expected ${EXPECTED_TOTAL}.${C.reset}`,
    );
    log(`    Update EXPECTED_TOTAL in scripts/validate-endpoints.mjs if route count has changed.`);
  }

  if (failed > 0) {
    log('');
    log(`  ${C.red}${C.bold}✗ Failed endpoints:${C.reset}`);
    for (const r of results.filter((r) => r.outcome === 'FAIL')) {
      log(`    ${C.red}✗${C.reset} ${r.endpoint.name} (${r.endpoint.path}) — ${r.reason}`);
    }
  }

  // Degraded-mode unaffected domain regression check
  if (degradedDomain) {
    const unaffectedFails = results.filter(
      (r) => r.outcome === 'FAIL' && r.endpoint.domain !== degradedDomain,
    );
    if (unaffectedFails.length > 0) {
      log('');
      log(`  ${C.red}${C.bold}✗ Unaffected domain regressions during degraded-mode test:${C.reset}`);
      for (const r of unaffectedFails) {
        log(`    ${C.red}✗${C.reset} ${r.endpoint.name} — ${r.reason}`);
      }
    } else {
      log('');
      log(`  ${C.green}✓${C.reset} Unaffected domains: no regressions detected.`);
    }
  }

  log('');

  // Exit code: 1 if any hard failures; 0 otherwise (warns are non-fatal)
  const exitCode = failed > 0 ? 1 : 0;
  return { results, passed, degradedPass, warned, failed, actual, countMismatch, exitCode };
}

// ── CLI help ──────────────────────────────────────────────────────────────────
function printHelp() {
  process.stdout.write(`
${C.bold}validate-endpoints.mjs${C.reset} — Endpoint smoke test for Situation Monitor

${C.bold}Usage:${C.reset}
  node scripts/validate-endpoints.mjs [OPTIONS] [BASE_URL]
  scripts/validate-endpoints.sh [OPTIONS] [BASE_URL]

${C.bold}Options:${C.reset}
  --base-url URL           Target deployment base URL
                           (default: http://127.0.0.1:3000)
  --degraded-domain NAME   Assert graceful degradation for a specific domain.
                           Endpoints in that domain must return non-500 with
                           an informative body. All others must still pass.
  --timeout-ms N           Per-request timeout in milliseconds (default: 15000)
  -h, --help               Show this help message

${C.bold}Examples:${C.reset}
  # Validate a Vercel preview deployment
  scripts/validate-endpoints.sh --base-url https://your-preview.vercel.app

  # Validate with graceful degradation mode (NFR32)
  scripts/validate-endpoints.sh --base-url https://your-preview.vercel.app \\
    --degraded-domain market

  # Local dev with custom timeout
  scripts/validate-endpoints.sh --base-url http://127.0.0.1:3000 --timeout-ms 20000

${C.bold}Exit codes:${C.reset}
  0   All endpoints passed (warns are non-fatal — route exists but needs auth/params)
  1   One or more endpoints failed (5xx, 404, empty body, or connection error)
  2   Script crash (unexpected error)

${C.bold}Endpoint count:${C.reset}
  Expected ${EXPECTED_TOTAL} total (${EXPECTED_RPC_COUNT} sebuf RPC + ${EXPECTED_LEGACY_COUNT} legacy REST).
  A mismatch emits a visible warning but does not change exit code.

`);
}

// ── CLI argument parsing ──────────────────────────────────────────────────────
function parseCliArgs(argv) {
  const args = argv.slice(2);
  let baseUrl = 'http://127.0.0.1:3000';
  let degradedDomain = '';
  let timeoutMs = 15_000;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--base-url') {
      baseUrl = args[++i];
    } else if (arg === '--degraded-domain') {
      degradedDomain = args[++i];
    } else if (arg === '--timeout-ms') {
      timeoutMs = parseInt(args[++i], 10);
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      // Positional URL argument
      baseUrl = arg;
    } else {
      process.stderr.write(`Unknown option: ${arg}\n`);
      process.stderr.write(`Run with --help for usage.\n`);
      process.exit(1);
    }
  }

  return { baseUrl, degradedDomain, timeoutMs };
}

// ── CLI entrypoint ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const isMain = process.argv[1] === __filename;

if (isMain) {
  const { baseUrl, degradedDomain, timeoutMs } = parseCliArgs(process.argv);

  runValidation({ baseUrl, degradedDomain, timeoutMs }).then(({ exitCode }) => {
    process.exit(exitCode);
  }).catch((err) => {
    process.stderr.write(`Smoke test script crashed: ${err.message}\n`);
    process.stderr.write(err.stack + '\n');
    process.exit(2);
  });
}
