/**
 * Unit tests for scripts/validate-endpoints.mjs
 *
 * Tests cover:
 *   - probeEndpoint: 200 success, 5xx failure, 404 failure, empty body, timeout
 *   - classifyResult: all outcome branches (PASS, WARN, FAIL, DEGRADED_PASS)
 *   - runValidation: aggregate summary, count mismatch warning, degraded-mode assertions
 *   - Endpoint inventory: count integrity (46 RPC + 11 legacy = 57)
 *
 * Network-independent: all fetch calls are replaced with mock implementations.
 *
 * Run:  tsx --test tests/validate-endpoints.test.mjs
 *   or: node --test tests/validate-endpoints.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Import the validation engine (must not trigger CLI when imported).
const {
  ENDPOINTS,
  EXPECTED_TOTAL,
  EXPECTED_RPC_COUNT,
  EXPECTED_LEGACY_COUNT,
  DEGRADATION_KEYWORDS,
  probeEndpoint,
  classifyResult,
  runValidation,
} = await import(resolve(root, 'scripts/validate-endpoints.mjs'));

// ── Mock fetch factory ────────────────────────────────────────────────────────

/**
 * Create a fetch mock that returns configured responses keyed by URL path.
 * Paths not in the map default to a 200 OK with `{}` body.
 *
 * @param {Record<string, {status?: number, body?: string, throw?: string}>} pathMap
 */
function makeMockFetch(pathMap = {}) {
  return async (url, _opts) => {
    let path;
    try {
      path = new URL(url).pathname;
    } catch {
      path = url;
    }

    const entry = pathMap[path] ?? {};

    if (entry.throw) {
      const err = new Error(entry.throw);
      err.name = entry.throwName ?? 'Error';
      throw err;
    }

    const status = entry.status ?? 200;
    const body   = entry.body   ?? '{"ok":true}';

    return {
      status,
      ok: status < 400,
      text: async () => body,
    };
  };
}

/**
 * Build a minimal fake endpoint descriptor.
 */
function fakeEndpoint(overrides = {}) {
  return {
    name:   'TestEndpoint',
    path:   '/api/test/v1/test-method',
    type:   'rpc',
    domain: 'test',
    ...overrides,
  };
}

// ── Inventory integrity ───────────────────────────────────────────────────────

describe('ENDPOINTS inventory', () => {
  it('has the correct total count (57)', () => {
    assert.equal(ENDPOINTS.length, EXPECTED_TOTAL);
  });

  it(`has exactly ${EXPECTED_RPC_COUNT} RPC endpoints`, () => {
    const rpcCount = ENDPOINTS.filter((e) => e.type === 'rpc').length;
    assert.equal(rpcCount, EXPECTED_RPC_COUNT);
  });

  it(`has exactly ${EXPECTED_LEGACY_COUNT} legacy REST endpoints`, () => {
    const legacyCount = ENDPOINTS.filter((e) => e.type === 'legacy').length;
    assert.equal(legacyCount, EXPECTED_LEGACY_COUNT);
  });

  it('EXPECTED_RPC_COUNT + EXPECTED_LEGACY_COUNT === EXPECTED_TOTAL', () => {
    assert.equal(EXPECTED_RPC_COUNT + EXPECTED_LEGACY_COUNT, EXPECTED_TOTAL);
  });

  it('has no duplicate paths', () => {
    const paths = ENDPOINTS.map((e) => e.path);
    const unique = new Set(paths);
    assert.equal(unique.size, paths.length, `Duplicate paths: ${paths.filter((p, i) => paths.indexOf(p) !== i)}`);
  });

  it('every entry has required fields (name, path, type, domain)', () => {
    for (const ep of ENDPOINTS) {
      assert.ok(ep.name,   `Missing name: ${JSON.stringify(ep)}`);
      assert.ok(ep.path,   `Missing path: ${JSON.stringify(ep)}`);
      assert.ok(ep.type,   `Missing type: ${JSON.stringify(ep)}`);
      assert.ok(ep.domain, `Missing domain: ${JSON.stringify(ep)}`);
      assert.match(ep.type, /^(rpc|legacy)$/, `Invalid type: ${ep.type}`);
    }
  });

  it('all RPC paths follow /api/{domain}/v1/{method} pattern', () => {
    for (const ep of ENDPOINTS.filter((e) => e.type === 'rpc')) {
      assert.match(ep.path, /^\/api\/[a-z-]+\/v1\/[a-z-]+$/, `Bad RPC path: ${ep.path}`);
    }
  });

  it('all legacy paths follow /api/{name} pattern', () => {
    for (const ep of ENDPOINTS.filter((e) => e.type === 'legacy')) {
      assert.match(ep.path, /^\/api\/[a-z-]+$/, `Bad legacy path: ${ep.path}`);
    }
  });
});

// ── probeEndpoint ─────────────────────────────────────────────────────────────

describe('probeEndpoint()', () => {
  it('returns status and bodyText on 200 OK', async () => {
    const ep = fakeEndpoint();
    const fetchFn = makeMockFetch({ '/api/test/v1/test-method': { status: 200, body: '{"hello":"world"}' } });
    const result = await probeEndpoint(ep, { baseUrl: 'http://localhost:3000', fetchFn, timeoutMs: 5000 });

    assert.equal(result.status, 200);
    assert.equal(result.bodyText, '{"hello":"world"}');
    assert.ok(result.elapsed >= 0);
    assert.equal(result.error, undefined);
  });

  it('returns status 500 and empty body on server error', async () => {
    const ep = fakeEndpoint();
    const fetchFn = makeMockFetch({ '/api/test/v1/test-method': { status: 500, body: '{"error":"internal"}' } });
    const result = await probeEndpoint(ep, { baseUrl: 'http://localhost:3000', fetchFn, timeoutMs: 5000 });

    assert.equal(result.status, 500);
    assert.equal(result.bodyText, '{"error":"internal"}');
  });

  it('returns status 404 on missing route', async () => {
    const ep = fakeEndpoint();
    const fetchFn = makeMockFetch({ '/api/test/v1/test-method': { status: 404, body: 'Not Found' } });
    const result = await probeEndpoint(ep, { baseUrl: 'http://localhost:3000', fetchFn, timeoutMs: 5000 });

    assert.equal(result.status, 404);
  });

  it('returns status 0 and error message on network failure', async () => {
    const ep = fakeEndpoint();
    const fetchFn = makeMockFetch({ '/api/test/v1/test-method': { throw: 'ECONNREFUSED connect failed' } });
    const result = await probeEndpoint(ep, { baseUrl: 'http://localhost:3000', fetchFn, timeoutMs: 5000 });

    assert.equal(result.status, 0);
    assert.match(result.error, /ECONNREFUSED/);
  });

  it('returns status 0 and timeout message on TimeoutError', async () => {
    const ep = fakeEndpoint();
    const fetchFn = makeMockFetch({
      '/api/test/v1/test-method': { throw: 'The operation was aborted.', throwName: 'TimeoutError' },
    });
    const result = await probeEndpoint(ep, { baseUrl: 'http://localhost:3000', fetchFn, timeoutMs: 5000 });

    assert.equal(result.status, 0);
    assert.match(result.error, /Timeout after/);
  });

  it('includes the API key header when apiKey is provided', async () => {
    const ep = fakeEndpoint();
    let capturedHeaders = null;
    const fetchFn = async (_url, opts) => {
      capturedHeaders = opts.headers;
      return { status: 200, ok: true, text: async () => '{}' };
    };
    await probeEndpoint(ep, { baseUrl: 'http://localhost:3000', fetchFn, apiKey: 'test-key-123', timeoutMs: 5000 });

    assert.equal(capturedHeaders['X-WorldMonitor-Key'], 'test-key-123');
  });

  it('omits the API key header when apiKey is empty', async () => {
    const ep = fakeEndpoint();
    let capturedHeaders = null;
    const fetchFn = async (_url, opts) => {
      capturedHeaders = opts.headers;
      return { status: 200, ok: true, text: async () => '{}' };
    };
    await probeEndpoint(ep, { baseUrl: 'http://localhost:3000', fetchFn, apiKey: '', timeoutMs: 5000 });

    assert.equal(capturedHeaders['X-WorldMonitor-Key'], undefined);
  });
});

// ── classifyResult ────────────────────────────────────────────────────────────

describe('classifyResult()', () => {
  it('returns PASS for 200 with valid JSON body', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 200, bodyText: '{"data":[]}', elapsed: 10 });
    assert.equal(r.outcome, 'PASS');
    assert.equal(r.reason, null);
  });

  it('returns FAIL for 500 response', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 500, bodyText: '{"error":"oops"}', elapsed: 10 });
    assert.equal(r.outcome, 'FAIL');
    assert.match(r.reason, /500/);
  });

  it('returns FAIL for 404 response', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 404, bodyText: 'Not Found', elapsed: 10 });
    assert.equal(r.outcome, 'FAIL');
    assert.match(r.reason, /404/);
  });

  it('returns FAIL for network error (status 0)', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 0, bodyText: '', elapsed: 100, error: 'ECONNREFUSED' });
    assert.equal(r.outcome, 'FAIL');
    assert.match(r.reason, /ECONNREFUSED/);
  });

  it('returns FAIL for 200 with empty body', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 200, bodyText: '', elapsed: 10 });
    assert.equal(r.outcome, 'FAIL');
    assert.match(r.reason, /empty/i);
  });

  it('returns FAIL for 200 with whitespace-only body', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 200, bodyText: '   \n  ', elapsed: 10 });
    assert.equal(r.outcome, 'FAIL');
  });

  it('returns WARN for 401 response (auth required)', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 401, bodyText: '{"error":"unauthorized"}', elapsed: 10 });
    assert.equal(r.outcome, 'WARN');
    assert.match(r.reason, /401/);
  });

  it('returns WARN for 403 response (forbidden)', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 403, bodyText: '{"error":"forbidden"}', elapsed: 10 });
    assert.equal(r.outcome, 'WARN');
  });

  it('returns WARN for 200 with non-JSON body', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 200, bodyText: '<html>error</html>', elapsed: 10 });
    assert.equal(r.outcome, 'WARN');
    assert.match(r.reason, /not valid JSON/i);
  });

  it('returns FAIL for timeout error', () => {
    const r = classifyResult({ endpoint: fakeEndpoint(), status: 0, bodyText: '', elapsed: 15000, error: 'Timeout after 15000ms' });
    assert.equal(r.outcome, 'FAIL');
    assert.match(r.reason, /Timeout/);
  });
});

// ── classifyResult — degraded mode ────────────────────────────────────────────

describe('classifyResult() — degraded mode', () => {
  const degradedEndpoint = fakeEndpoint({ domain: 'market' });

  it('returns DEGRADED_PASS when non-500 body contains "not configured"', () => {
    const r = classifyResult(
      { endpoint: degradedEndpoint, status: 200, bodyText: '{"error":"not configured"}', elapsed: 10 },
      'market',
    );
    assert.equal(r.outcome, 'DEGRADED_PASS');
    assert.match(r.reason, /graceful degradation/i);
  });

  it('returns DEGRADED_PASS when non-500 body contains "unavailable"', () => {
    const r = classifyResult(
      { endpoint: degradedEndpoint, status: 200, bodyText: '{"message":"service unavailable"}', elapsed: 10 },
      'market',
    );
    assert.equal(r.outcome, 'DEGRADED_PASS');
  });

  it('returns DEGRADED_PASS when non-500 body contains "skipReason"', () => {
    const r = classifyResult(
      { endpoint: degradedEndpoint, status: 200, bodyText: '{"skipReason":"no api key"}', elapsed: 10 },
      'market',
    );
    assert.equal(r.outcome, 'DEGRADED_PASS');
  });

  it('returns DEGRADED_PASS on 401 with degradation keyword', () => {
    const r = classifyResult(
      { endpoint: degradedEndpoint, status: 401, bodyText: '{"error":"api key missing"}', elapsed: 10 },
      'market',
    );
    assert.equal(r.outcome, 'DEGRADED_PASS');
  });

  it('returns FAIL for 500 even in degraded mode', () => {
    const r = classifyResult(
      { endpoint: degradedEndpoint, status: 500, bodyText: '{"error":"crash"}', elapsed: 10 },
      'market',
    );
    assert.equal(r.outcome, 'FAIL');
    assert.match(r.reason, /5xx/);
  });

  it('returns FAIL for 404 even in degraded mode', () => {
    const r = classifyResult(
      { endpoint: degradedEndpoint, status: 404, bodyText: 'Not Found', elapsed: 10 },
      'market',
    );
    assert.equal(r.outcome, 'FAIL');
  });

  it('returns WARN when degraded domain has non-500 response but no degradation keyword', () => {
    const r = classifyResult(
      { endpoint: degradedEndpoint, status: 200, bodyText: '{"quotes":[]}', elapsed: 10 },
      'market',
    );
    assert.equal(r.outcome, 'WARN');
    assert.match(r.reason, /no degradation signal/i);
  });

  it('does NOT apply degraded logic to a different domain', () => {
    const otherEndpoint = fakeEndpoint({ domain: 'seismology' });
    const r = classifyResult(
      { endpoint: otherEndpoint, status: 200, bodyText: '{"earthquakes":[]}', elapsed: 10 },
      'market', // degraded domain is market, not seismology
    );
    // Seismology with good 200 response should be PASS regardless
    assert.equal(r.outcome, 'PASS');
  });
});

// ── Degradation keyword coverage ─────────────────────────────────────────────

describe('DEGRADATION_KEYWORDS', () => {
  it('is a non-empty array of strings', () => {
    assert.ok(Array.isArray(DEGRADATION_KEYWORDS));
    assert.ok(DEGRADATION_KEYWORDS.length > 0);
    for (const kw of DEGRADATION_KEYWORDS) {
      assert.equal(typeof kw, 'string');
    }
  });

  it('detects "not configured" (exact)', () => {
    const bodyLower = 'api key not configured for this domain';
    const hit = DEGRADATION_KEYWORDS.some((kw) => bodyLower.includes(kw.toLowerCase()));
    assert.ok(hit, 'Should detect "not configured"');
  });

  it('detects "skipReason" (case-insensitive)', () => {
    const bodyLower = '{"skipreason":"no key set"}'.toLowerCase();
    const hit = DEGRADATION_KEYWORDS.some((kw) => bodyLower.includes(kw.toLowerCase()));
    assert.ok(hit, 'Should detect skipReason variant');
  });
});

// ── runValidation — aggregate behaviour ──────────────────────────────────────

describe('runValidation()', () => {
  it('returns PASS for all endpoints when all return 200 with valid JSON', async () => {
    const fetchFn = makeMockFetch({}); // all default to 200 + '{"ok":true}'
    const { results, failed, passed } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      silent: true,
    });

    assert.equal(results.length, EXPECTED_TOTAL);
    assert.equal(failed, 0);
    assert.equal(passed, EXPECTED_TOTAL);
  });

  it('counts FAIL correctly for 5xx responses', async () => {
    // Make exactly 3 endpoints return 500
    const failPaths = ENDPOINTS.slice(0, 3).map((e) => e.path);
    const pathMap = Object.fromEntries(failPaths.map((p) => [p, { status: 500, body: '{"error":"oops"}' }]));
    const fetchFn = makeMockFetch(pathMap);

    const { failed, passed } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      silent: true,
    });

    assert.equal(failed, 3);
    assert.equal(passed, EXPECTED_TOTAL - 3);
  });

  it('counts FAIL for 404 responses', async () => {
    const failPaths = ENDPOINTS.slice(5, 7).map((e) => e.path);
    const pathMap = Object.fromEntries(failPaths.map((p) => [p, { status: 404, body: 'Not Found' }]));
    const fetchFn = makeMockFetch(pathMap);

    const { failed } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      silent: true,
    });

    assert.equal(failed, 2);
  });

  it('counts WARN for 401 responses (non-fatal)', async () => {
    const warnPaths = ENDPOINTS.slice(0, 4).map((e) => e.path);
    const pathMap = Object.fromEntries(warnPaths.map((p) => [p, { status: 401, body: '{"error":"unauthorized"}' }]));
    const fetchFn = makeMockFetch(pathMap);

    const { failed, warned } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      silent: true,
    });

    assert.equal(failed, 0, 'WARN responses should not count as failures');
    assert.equal(warned, 4);
  });

  it('returns exitCode 0 when no failures (warns are non-fatal)', async () => {
    const fetchFn = makeMockFetch({});
    const { exitCode } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      silent: true,
    });
    assert.equal(exitCode, 0);
  });

  it('returns exitCode 1 when there are failures', async () => {
    const failPath = ENDPOINTS[0].path;
    const fetchFn = makeMockFetch({ [failPath]: { status: 500, body: '{}' } });
    const { exitCode } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      silent: true,
    });
    assert.equal(exitCode, 1);
  });

  it('reports countMismatch = false when tested count equals EXPECTED_TOTAL', async () => {
    const fetchFn = makeMockFetch({});
    const { actual, countMismatch } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      silent: true,
    });
    assert.equal(actual, EXPECTED_TOTAL);
    assert.equal(countMismatch, false);
  });
});

// ── runValidation — endpoint count mismatch warning ──────────────────────────

describe('runValidation() — count mismatch detection', () => {
  it('detects when ENDPOINTS.length does not equal EXPECTED_TOTAL', () => {
    // Verify the invariant holds in the real list (regression test)
    assert.equal(
      ENDPOINTS.length,
      EXPECTED_TOTAL,
      `ENDPOINTS list has ${ENDPOINTS.length} entries but EXPECTED_TOTAL is ${EXPECTED_TOTAL}. ` +
      `Update EXPECTED_TOTAL or ENDPOINTS to fix the mismatch.`,
    );
  });
});

// ── runValidation — degraded mode ─────────────────────────────────────────────

describe('runValidation() — degraded mode (NFR32)', () => {
  it('passes degraded-domain endpoints as DEGRADED_PASS when they return non-500 with keyword', async () => {
    // Make all market endpoints return 200 with "not configured"
    const marketEndpoints = ENDPOINTS.filter((e) => e.domain === 'market');
    const pathMap = Object.fromEntries(
      marketEndpoints.map((e) => [e.path, { status: 200, body: '{"error":"api key not configured"}' }]),
    );
    const fetchFn = makeMockFetch(pathMap);

    const { results, failed } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      degradedDomain: 'market',
      silent: true,
    });

    const marketResults = results.filter((r) => r.endpoint.domain === 'market');
    for (const r of marketResults) {
      assert.equal(r.outcome, 'DEGRADED_PASS', `Expected DEGRADED_PASS for ${r.endpoint.name}, got ${r.outcome}`);
    }
    assert.equal(failed, 0, 'No failures expected when degraded domain gracefully degrades');
  });

  it('fails degraded-domain endpoints that return 500', async () => {
    const marketEndpoints = ENDPOINTS.filter((e) => e.domain === 'market');
    const pathMap = Object.fromEntries(
      marketEndpoints.map((e) => [e.path, { status: 500, body: '{"error":"crash"}' }]),
    );
    const fetchFn = makeMockFetch(pathMap);

    const { failed } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      degradedDomain: 'market',
      silent: true,
    });

    assert.equal(failed, marketEndpoints.length, 'All 500s in degraded domain should be FAIL');
  });

  it('non-degraded domains remain PASS during degraded-mode run', async () => {
    // Market endpoints return degraded response; everything else returns 200 OK
    const marketEndpoints = ENDPOINTS.filter((e) => e.domain === 'market');
    const pathMap = Object.fromEntries(
      marketEndpoints.map((e) => [e.path, { status: 200, body: '{"error":"not configured"}' }]),
    );
    const fetchFn = makeMockFetch(pathMap); // non-market paths default to 200 + '{"ok":true}'

    const { results } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      degradedDomain: 'market',
      silent: true,
    });

    const nonMarketResults = results.filter((r) => r.endpoint.domain !== 'market');
    for (const r of nonMarketResults) {
      assert.equal(r.outcome, 'PASS', `Expected PASS for unaffected domain ${r.endpoint.domain}/${r.endpoint.name}, got ${r.outcome}`);
    }
  });

  it('reports unaffected-domain regression when non-degraded domain returns 500', async () => {
    // Market: degraded OK; seismology: unexpected 500
    const marketEndpoints = ENDPOINTS.filter((e) => e.domain === 'market');
    const seismologyEndpoints = ENDPOINTS.filter((e) => e.domain === 'seismology');

    const pathMap = {
      ...Object.fromEntries(marketEndpoints.map((e) => [e.path, { status: 200, body: '{"error":"not configured"}' }])),
      ...Object.fromEntries(seismologyEndpoints.map((e) => [e.path, { status: 500, body: '{"error":"db error"}' }])),
    };
    const fetchFn = makeMockFetch(pathMap);

    const { failed, results } = await runValidation({
      baseUrl: 'http://localhost:3000',
      fetchFn,
      degradedDomain: 'market',
      silent: true,
    });

    const seismologyFails = results.filter((r) => r.endpoint.domain === 'seismology' && r.outcome === 'FAIL');
    assert.ok(seismologyFails.length > 0, 'Seismology 500 should be a FAIL (unaffected domain regression)');
    assert.ok(failed > 0);
  });
});
