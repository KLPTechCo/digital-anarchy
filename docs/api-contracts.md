# API Contracts

> World Monitor API reference — Legacy REST endpoints and Sebuf RPC services.
>
> Last updated: 2026-02-23

---

## Table of Contents

- [A. Legacy REST Endpoints](#a-legacy-rest-endpoints)
- [B. Sebuf RPC Endpoints](#b-sebuf-rpc-endpoints)
- [C. Gateway Architecture](#c-gateway-architecture)
- [D. Shared Server Utilities](#d-shared-server-utilities)
- [E. Authentication & Authorization](#e-authentication--authorization)
- [F. Error Handling](#f-error-handling)
- [G. Caching Strategy](#g-caching-strategy)

---

## A. Legacy REST Endpoints

Standalone Vercel serverless functions in `api/`. These handle non-protobuf formats (XML, HTML, SVG, redirects) that don't fit the Sebuf RPC model.

| Method | Path | Runtime | Auth | Purpose | Query Params | Response |
|--------|------|---------|------|---------|-------------|----------|
| GET | `/api/rss-proxy` | Edge | CORS origin check | Proxies RSS feeds with domain allowlist (150+ domains) | `url` (required) — feed URL | `application/xml` — raw feed XML |
| GET | `/api/story` | Node.js | None (bot detection) | Social crawler story page — serves OG meta tags to bots, 302 redirects real users to SPA | `c` (country code), `t` (type), `ts` (timestamp), `s` (score), `l` (level) | `text/html` (bots) or `302` redirect (users) |
| GET | `/api/og-story` | Node.js | None | Dynamic OG image generator — 1200×630 SVG intelligence card | `c` (country code), `t` (type), `s` (score), `l` (level) | `image/svg+xml` — 1200×630 card |
| POST | `/api/register-interest` | Edge | CORS + IP rate limit (5/hr) | Desktop interest registration via Convex | Body: `{ email, source?, appVersion? }` | `application/json` — `{ status }` |
| GET | `/api/version` | Edge | None (`*` CORS) | Latest desktop release version from GitHub Releases | None | `{ version, tag, url, prerelease }` |
| GET | `/api/download` | Edge | None | Redirect to latest release asset by platform/variant | `platform` (required), `variant` (optional) | `302` redirect to `.exe`/`.dmg`/`.AppImage` |
| GET | `/api/fwdstart` | Edge | CORS origin check | Scrapes FwdStart newsletter archive → generates RSS | None | `application/xml` — RSS feed |
| GET | `/api/youtube/live` | Edge | CORS origin check | Detects active YouTube live streams by channel handle | `channel` (required) — channel handle | `{ videoId, isLive }` |
| GET | `/api/youtube/embed` | Edge | None | Privacy-enhanced YouTube embed page with JS API bridge | `videoId` (required), `autoplay?`, `mute?`, `origin?` | `text/html` — full embed page |
| GET | `/api/eia/health` | Edge | CORS origin check | EIA API health check | None | `{ configured: boolean }` |
| GET | `/api/eia/petroleum` | Edge | CORS origin check | EIA petroleum data (WTI, Brent, production, inventory) | None | `{ wti, brent, production, inventory }` |
| GET | `/api/data/city-coords` | N/A | N/A | Static export — 500+ city coordinates database | N/A | TypeScript module (import only) |

### Legacy Endpoint Cache Headers

| Endpoint | Cache-Control |
|----------|--------------|
| `/api/rss-proxy` | `public, max-age=600, s-maxage=600, stale-while-revalidate=300` |
| `/api/story` | `public, max-age=300, s-maxage=300, stale-while-revalidate=60` |
| `/api/version` | `public, s-maxage=300, stale-while-revalidate=60` |
| `/api/download` | `public, s-maxage=300, stale-while-revalidate=60` |
| `/api/fwdstart` | `public, max-age=1800, s-maxage=1800, stale-while-revalidate=300` |
| `/api/youtube/live` | `public, max-age=300, s-maxage=300, stale-while-revalidate=60` |
| `/api/youtube/embed` | `public, s-maxage=60, stale-while-revalidate=300` |
| `/api/eia/petroleum` | `public, max-age=1800, s-maxage=1800, stale-while-revalidate=300` |

### Legacy Endpoint Environment Variables

| Endpoint | Env Var | Required |
|----------|---------|----------|
| `/api/register-interest` | `CONVEX_URL` | Yes |
| `/api/eia/*` | `EIA_API_KEY` | Optional (graceful skip) |

---

## B. Sebuf RPC Endpoints

All Sebuf RPCs are **POST** requests routed through the catch-all gateway at `api/[domain]/v1/[rpc].ts`. The path pattern is:

```
POST /api/{domain}/v1/{rpc-name}
```

Request and response bodies are JSON-encoded protobuf messages defined in `proto/worldmonitor/`.

### Aviation (1 RPC)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListAirportDelays | `/api/aviation/v1/list-airport-delays` | FAA NASSTATUS API (`nasstatus.faa.gov`) | 30 min | None | Airport delay alerts for monitored airports |

### Climate (1 RPC)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListClimateAnomalies | `/api/climate/v1/list-climate-anomalies` | Open-Meteo Archive API (`archive-api.open-meteo.com`) | 30 min | None | Temperature and precipitation anomalies by zone |

### Conflict (3 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListAcledEvents | `/api/conflict/v1/list-acled-events` | ACLED API (`acleddata.com/api/acled/read`) | 15 min | `ACLED_ACCESS_TOKEN` | Battles, explosions, violence events |
| ListUcdpEvents | `/api/conflict/v1/list-ucdp-events` | UCDP GED API (`ucdpapi.pcr.uu.se`) | 6 hr (full) / 10 min (partial) | None | Uppsala armed conflict events with version discovery |
| GetHumanitarianSummary | `/api/conflict/v1/get-humanitarian-summary` | HAPI/HDX API (`hapi.humdata.org`) | 6 hr | None | Humanitarian conflict event counts by country |

### Cyber (1 RPC)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListCyberThreats | `/api/cyber/v1/list-cyber-threats` | Feodo Tracker, URLhaus, C2IntelFeeds, OTX AlienVault, AbuseIPDB | 15 min | `URLHAUS_AUTH_KEY`, `OTX_API_KEY`, `ABUSEIPDB_API_KEY` | Aggregated cyber threat intelligence from 5+ feeds |

### Displacement (2 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| GetDisplacementSummary | `/api/displacement/v1/get-displacement-summary` | UNHCR Population API (`api.unhcr.org`) | 12 hr | None | Annual refugee/IDP population statistics |
| GetPopulationExposure | `/api/displacement/v1/get-population-exposure` | Static data (built-in) | None | None | Population exposure estimates for priority countries |

### Economic (4 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| GetFredSeries | `/api/economic/v1/get-fred-series` | FRED API (`api.stlouisfed.org/fred`) | 1 hr | `FRED_API_KEY` | Federal Reserve economic time series |
| ListWorldBankIndicators | `/api/economic/v1/list-world-bank-indicators` | World Bank API (`api.worldbank.org`) | 24 hr | None | GDP, inflation, trade indicators by country |
| GetEnergyPrices | `/api/economic/v1/get-energy-prices` | EIA API (`api.eia.gov`) | 1 hr | `EIA_API_KEY` | WTI, Brent, natural gas, diesel prices |
| GetMacroSignals | `/api/economic/v1/get-macro-signals` | Yahoo Finance, Fear & Greed Index, Mempool.space | 5 min | None | Composite macro-economic signal dashboard |

### Infrastructure (5 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| GetCableHealth | `/api/infrastructure/v1/get-cable-health` | NGA Maritime Safety API (`msi.nga.mil`) | 3 min | None | Undersea cable proximity to maritime warnings |
| ListInternetOutages | `/api/infrastructure/v1/list-internet-outages` | Cloudflare Radar API (`api.cloudflare.com`) | 5 min | `CLOUDFLARE_API_TOKEN` | Global internet outage annotations |
| ListServiceStatuses | `/api/infrastructure/v1/list-service-statuses` | 30+ status page APIs (Statuspage, Instatus, custom) | 5 min | None | Cloud/dev/comm/AI/SaaS service status aggregation |
| GetTemporalBaseline | `/api/infrastructure/v1/get-temporal-baseline` | Redis (computed) | N/A (reads baseline) | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Reads temporal anomaly baselines from Redis |
| RecordBaselineSnapshot | `/api/infrastructure/v1/record-baseline-snapshot` | N/A (writes to Redis) | N/A | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Records temporal baseline data points |

### Intelligence (5 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| GetRiskScores | `/api/intelligence/v1/get-risk-scores` | ACLED API (protests + riots) | 10 min (+24 hr stale) | `ACLED_ACCESS_TOKEN` | Country instability risk scores |
| GetPizzintStatus | `/api/intelligence/v1/get-pizzint-status` | Pizzint Watch API (`pizzint.watch`) | 10 min | None | OSINT dashboard status with optional GDELT batch |
| ClassifyEvent | `/api/intelligence/v1/classify-event` | Groq LLM API (`api.groq.com`) | 24 hr | `GROQ_API_KEY` | LLM-based event severity/category classification |
| GetCountryIntelBrief | `/api/intelligence/v1/get-country-intel-brief` | Groq LLM API (`api.groq.com`) | 2 hr | `GROQ_API_KEY` | AI-generated country intelligence brief |
| SearchGdeltDocuments | `/api/intelligence/v1/search-gdelt-documents` | GDELT Doc API (`api.gdeltproject.org`) | 10 min | None | Full-text GDELT document search |

### Maritime (2 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| GetVesselSnapshot | `/api/maritime/v1/get-vessel-snapshot` | AIS relay via WebSocket (`WS_RELAY_URL`) | 10 sec (in-memory) | `WS_RELAY_URL` | Real-time AIS vessel positions |
| ListNavigationalWarnings | `/api/maritime/v1/list-navigational-warnings` | NGA Broadcast Warnings API (`msi.nga.mil`) | 1 hr | None | Active maritime navigational warnings |

### Market (7 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListMarketQuotes | `/api/market/v1/list-market-quotes` | Finnhub + Yahoo Finance | 2 min | `FINNHUB_API_KEY` | Stock/index quotes with sparklines |
| ListCryptoQuotes | `/api/market/v1/list-crypto-quotes` | CoinGecko Markets API (`api.coingecko.com`) | 3 min | None | Cryptocurrency prices with 7-day sparklines |
| ListCommodityQuotes | `/api/market/v1/list-commodity-quotes` | Yahoo Finance (`query1.finance.yahoo.com`) | 3 min | None | Commodity futures prices (oil, gold, etc.) |
| GetSectorSummary | `/api/market/v1/get-sector-summary` | Finnhub (`finnhub.io`) | 3 min | `FINNHUB_API_KEY` | Sector ETF performance summary |
| ListStablecoinMarkets | `/api/market/v1/list-stablecoin-markets` | CoinGecko Markets API | 3 min | None | Stablecoin peg health monitoring |
| ListEtfFlows | `/api/market/v1/list-etf-flows` | Yahoo Finance | 10 min | None | BTC spot ETF volume/flow estimates |
| GetCountryStockIndex | `/api/market/v1/get-country-stock-index` | Yahoo Finance | 30 min | None | National stock market index by country code |

### Military (6 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListMilitaryFlights | `/api/military/v1/list-military-flights` | OpenSky Network / Wingbits fallback | 2 min | `WS_RELAY_URL`, `WINGBITS_API_KEY` | Real-time military ADS-B flight tracking |
| GetTheaterPosture | `/api/military/v1/get-theater-posture` | OpenSky Network / Wingbits fallback | 5 min (+24 hr stale, +7 day backup) | `WS_RELAY_URL`, `WINGBITS_API_KEY` | Theater-level military posture assessment |
| GetAircraftDetails | `/api/military/v1/get-aircraft-details` | Wingbits API (`customer-api.wingbits.com`) | 5 min | `WINGBITS_API_KEY` | Aircraft details lookup by ICAO24 hex |
| GetAircraftDetailsBatch | `/api/military/v1/get-aircraft-details-batch` | Wingbits API (batch, max 20) | 5 min (per ICAO24) | `WINGBITS_API_KEY` | Batch aircraft details (up to 20 ICAO24s) |
| GetWingbitsStatus | `/api/military/v1/get-wingbits-status` | None (env check) | None | `WINGBITS_API_KEY` | Checks if Wingbits API key is configured |
| GetUSNIFleetReport | `/api/military/v1/get-usni-fleet-report` | USNI News WordPress API (`news.usni.org`) | 6 hr (+7 day stale) | None | US Navy fleet deployment tracker (scrapes USNI) |

### News (1 RPC)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| SummarizeArticle | `/api/news/v1/summarize-article` | Multi-provider LLM (Ollama / Groq / OpenRouter) | 24 hr | `OLLAMA_API_URL`, `OLLAMA_API_KEY`, `OLLAMA_MODEL`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | LLM headline summarization with provider fallback |

### Prediction (1 RPC)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListPredictionMarkets | `/api/prediction/v1/list-prediction-markets` | Gamma API / Polymarket (`gamma-api.polymarket.com`) | 5 min | None | Prediction market odds (Cloudflare JA3 may block) |

### Research (4 RPCs)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListArxivPapers | `/api/research/v1/list-arxiv-papers` | arXiv Atom API (`export.arxiv.org`) | 1 hr | None | Academic paper search by category/query |
| ListTrendingRepos | `/api/research/v1/list-trending-repos` | Gitterapp API + Herokuapp fallback | 1 hr | None | Trending GitHub repositories by language |
| ListHackernewsItems | `/api/research/v1/list-hackernews-items` | HN Firebase API (`hacker-news.firebaseio.com`) | 10 min | None | Hacker News stories (top/new/best/ask/show/job) |
| ListTechEvents | `/api/research/v1/list-tech-events` | Techmeme ICS + dev.events RSS + curated | 6 hr | None | Tech conference/event aggregation with geocoding |

### Seismology (1 RPC)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListEarthquakes | `/api/seismology/v1/list-earthquakes` | USGS GeoJSON API (`earthquake.usgs.gov`) | 5 min | None | M4.5+ earthquakes from last 24 hours |

### Unrest (1 RPC)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListUnrestEvents | `/api/unrest/v1/list-unrest-events` | ACLED API + GDELT Geo API | 15 min | `ACLED_ACCESS_TOKEN` | Merged, deduplicated, severity-classified protest/riot events |

### Wildfire (1 RPC)

| RPC | Path | External Source | Cache TTL | Env Vars | Purpose |
|-----|------|----------------|-----------|----------|---------|
| ListFireDetections | `/api/wildfire/v1/list-fire-detections` | NASA FIRMS CSV API (VIIRS SNPP) | 30 min | `NASA_FIRMS_API_KEY` | Active fire detections across 9 monitored regions |

### RPC Count Summary

| Domain | RPCs |
|--------|------|
| Aviation | 1 |
| Climate | 1 |
| Conflict | 3 |
| Cyber | 1 |
| Displacement | 2 |
| Economic | 4 |
| Infrastructure | 5 |
| Intelligence | 5 |
| Maritime | 2 |
| Market | 7 |
| Military | 6 |
| News | 1 |
| Prediction | 1 |
| Research | 4 |
| Seismology | 1 |
| Unrest | 1 |
| Wildfire | 1 |
| **Total** | **46** |

---

## C. Gateway Architecture

### Catch-All Router

The Sebuf RPC layer uses a single Vercel edge function at `api/[domain]/v1/[rpc].ts` as a catch-all gateway. Vercel's dynamic segment routing captures `{domain}` and `{rpc}` from the URL, but the actual matching is done by a static `Map`-based router.

**Request flow:**

```
Client POST /api/seismology/v1/list-earthquakes
  │
  ├─ 1. Vercel routes to api/[domain]/v1/[rpc].ts (edge function)
  │
  ├─ 2. Origin check: isDisallowedOrigin(request) → 403 if blocked
  │
  ├─ 3. CORS headers computed: getCorsHeaders(request)
  │
  ├─ 4. OPTIONS preflight → 204 with CORS headers
  │
  ├─ 5. API key validation: validateApiKey(request)
  │     └─ Desktop origins MUST provide valid key → 401 if invalid
  │     └─ Web origins: key optional but validated if present
  │
  ├─ 6. Router matching: router.match(request)
  │     └─ Map lookup: "POST /api/seismology/v1/list-earthquakes" → handler
  │     └─ No match → 404
  │
  ├─ 7. Handler execution with top-level error boundary
  │     └─ Generated server code deserializes request, calls handler, serializes response
  │     └─ ValidationError (bad request) → 400 (handled by generated code)
  │     └─ Other errors → mapErrorToResponse (error-mapper.ts)
  │
  └─ 8. CORS headers merged into response
```

### Router Implementation (`server/router.ts`)

- **Type:** Static `Map<string, handler>` keyed by `"METHOD /path"`
- **No regex or dynamic segments** — all sebuf routes are static POST paths
- **Trailing slash normalization** — `/api/foo/v1/bar/` → `/api/foo/v1/bar`
- **Route table built once** at cold start from all 17 service `createXxxServiceRoutes()` calls

### Route Registration

Each domain's routes are registered via generated `createXxxServiceRoutes(handler, serverOptions)` functions from `src/generated/server/worldmonitor/{domain}/v1/service_server.ts`. These produce `RouteDescriptor[]` arrays with `{ method: 'POST', path: '/api/{domain}/v1/{rpc}', handler: fn }`.

---

## D. Shared Server Utilities

Located in `server/_shared/`, these modules are used by all 46 RPC handlers:

### `constants.ts`

- **`CHROME_UA`** — Browser-like User-Agent string used for upstream fetches to avoid bot blocking
- **`yahooGate()`** — Global request gate for Yahoo Finance API calls; enforces minimum 600ms spacing between ANY Yahoo requests across all handlers to prevent IP-level rate limiting (429s). Uses a serial promise queue.

### `hash.ts`

- **`hashString(input: string): string`** — FNV-1a 52-bit hash returning base-36 string
- Uses BigInt arithmetic for 52-bit output (within JS safe integer range)
- Greatly reduces collision probability vs. 32-bit hashes (0.00007% at 77k keys vs. ~50% for 32-bit)
- Used for cache key generation and deduplication

### `redis.ts`

- **`getCachedJson(key): Promise<unknown | null>`** — Reads a JSON value from Upstash Redis
- **`setCachedJson(key, value, ttlSeconds): void`** — Writes a JSON value with atomic `SET ... EX` (single call avoids race between SET and EXPIRE)
- **Environment-based key prefix** — Prevents cross-deployment cache collisions:
  - Production: no prefix
  - Preview/development: `{env}:{commitSha8}:` prefix (e.g., `preview:a1b2c3d4:`)
- **3-second timeout** on all Redis operations via `AbortSignal.timeout(3_000)`
- **Best-effort caching** — All write failures silently caught; handlers function without Redis
- **Required env vars:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

---

## E. Authentication & Authorization

### API Key Flow (`api/_api-key.js`)

The API key system is **origin-aware** with different behavior for desktop vs. web clients:

| Origin Type | Key Required? | Behavior |
|-------------|--------------|----------|
| Desktop (Tauri) | **Yes** | Must provide valid `X-WorldMonitor-Key` header; 401 if missing or invalid |
| Web (browser) | No | Key is optional; if provided, it's validated; if invalid → 401 |
| No origin header | No | Key not required |

**Desktop origin patterns:**

- `https?://tauri.localhost(:port)?`
- `https?://{subdomain}.tauri.localhost(:port)?`
- `tauri://localhost`
- `asset://localhost`

**Key validation:** Keys are checked against `WORLDMONITOR_VALID_KEYS` env var (comma-separated list).

### CORS Configuration

Two parallel CORS implementations exist:

#### Legacy CORS (`api/_cors.js`)

- Used by standalone REST endpoints
- **Configurable methods** via `getCorsHeaders(req, methods)` parameter (default: `'GET, OPTIONS'`)
- **Allowed headers:** `Content-Type, Authorization, X-WorldMonitor-Key`
- Includes both production and dev patterns (always, since no `NODE_ENV` check)

#### Sebuf CORS (`server/cors.ts`)

- Used by the catch-all gateway
- **Methods hardcoded** to `'POST, OPTIONS'` (all sebuf routes are POST)
- **Environment-aware:** Dev patterns (`localhost`, `127.0.0.1`) only included when `NODE_ENV !== 'production'`
- `Max-Age: 86400` (24-hour preflight cache)

**Shared origin patterns (both files):**

| Pattern | Purpose |
|---------|---------|
| `*.worldmonitor.app` | Production web |
| `worldmonitor-*.vercel.app` | Vercel preview deployments |
| `tauri.localhost(:port)` | Desktop app |
| `*.tauri.localhost(:port)` | Desktop app subdomains |
| `tauri://localhost` | Desktop deep links |
| `asset://localhost` | Tauri asset protocol |
| `localhost(:port)` | Local development (dev only in sebuf CORS) |
| `127.0.0.1(:port)` | Local development (dev only in sebuf CORS) |

**Disallowed origin handling:** If an origin is present but not in the allowlist, `isDisallowedOrigin()` returns `true` and the gateway returns **403** with no CORS headers (prevents response from being readable by the blocked origin).

### Bot Blocking

- `/api/story` uses User-Agent–based bot detection (`BOT_UA` regex) to serve different content to crawlers vs. real users
- RSS proxy enforces a domain allowlist (150+ domains) to prevent open proxy abuse
- YouTube embed uses its own `ALLOWED_ORIGINS` list for origin sanitization

---

## F. Error Handling

### Error Mapper (`server/error-mapper.ts`)

The error mapper handles errors thrown by RPC handlers. Generated code already handles `ValidationError` → 400 before the error mapper is called.

| Error Type | HTTP Status | Response Body | Logging |
|------------|------------|---------------|---------|
| `ApiError` (4xx `statusCode`) | Passthrough (e.g., 403, 429) | `{ message }` — original message exposed | None |
| `ApiError` (5xx `statusCode`) | Passthrough (e.g., 502) | `{ message: "Internal server error" }` — generic to avoid leaking internals | `console.error` with truncated upstream body (500 chars) |
| `ApiError` (429 with `retryAfter`) | 429 | `{ message, retryAfter }` | None |
| `TypeError` (network/fetch) | 502 Bad Gateway | `{ message: "Upstream unavailable" }` | None |
| Unknown error | 500 | `{ message: "Internal server error" }` | `console.error` |

**Network error detection** is runtime-agnostic — checks for `TypeError` with message patterns matching V8, Deno, Bun, and Cloudflare Workers (`fetch`, `network`, `connect`, `econnrefused`, `enotfound`, `socket`).

### Gateway Error Boundary

The catch-all gateway wraps handler execution in a top-level try/catch. If a handler throws an error that escapes the generated server code and the error mapper, the gateway returns a 500 with `{ message: "Internal server error" }`.

### Legacy Endpoint Error Patterns

| Endpoint | Error Pattern |
|----------|--------------|
| `/api/rss-proxy` | 504 on timeout (`AbortError`), 502 on fetch failure, 403 on disallowed domain/redirect |
| `/api/register-interest` | 400 (bad email), 429 (rate limit), 503 (Convex unavailable), 500 (mutation failure) |
| `/api/version` | 502 on GitHub API failure |
| `/api/download` | 302 to releases page on any failure (graceful fallback) |
| `/api/fwdstart` | 502 on scrape failure |
| `/api/eia/*` | 200 with `{ skipped: true }` when `EIA_API_KEY` not set, 404 for unknown paths |

### Graceful Degradation Pattern

Many RPC handlers follow a "2F-01" pattern — they return empty/default responses on upstream failure rather than throwing errors:

- **Wildfire:** Returns `{ detections: [] }` if `NASA_FIRMS_API_KEY` is not set
- **Military flights:** Returns `{ flights: [] }` if relay URL is not configured
- **Market quotes:** Returns `{ quotes: [], finnhubSkipped: true, skipReason: "..." }` when API key is missing
- **Prediction markets:** Returns empty on Cloudflare JA3 block (expected behavior)
- **Cyber threats:** Skips individual feeds that fail, returns partial results

---

## G. Caching Strategy

### Architecture

The caching layer uses a **two-tier strategy** with in-memory and Upstash Redis:

```
Request → In-Memory Cache (same instance) → Redis Cache (cross-instance) → Upstream API
```

### Upstash Redis (Primary)

All 46 RPCs use Upstash Redis via `server/_shared/redis.ts`:

- **Atomic writes:** `SET key value EX ttl` in a single HTTP call (avoids SET/EXPIRE race condition)
- **Best-effort:** All Redis operations are fire-and-forget with `.catch(() => {})` — handlers never fail due to cache issues
- **3-second timeout:** All Redis calls use `AbortSignal.timeout(3_000)` to prevent slow Redis from blocking responses
- **Key prefix isolation:** Preview/dev deployments get `{env}:{sha}:` prefix to avoid polluting production cache
- **JSON serialization:** Values stored as `JSON.stringify()` strings

### Cache TTL Summary

| TTL | RPCs | Rationale |
|-----|------|-----------|
| 10 sec | VesselSnapshot | Real-time AIS data, matches client poll interval |
| 2 min | ListMarketQuotes, ListMilitaryFlights | High-frequency financial/flight data |
| 3 min | ListCryptoQuotes, ListCommodityQuotes, GetSectorSummary, ListStablecoinMarkets, GetCableHealth | Rate-limited APIs (CoinGecko, Finnhub) |
| 5 min | ListEarthquakes, ListPredictionMarkets, GetAircraftDetails, GetAircraftDetailsBatch, GetTheaterPosture, GetMacroSignals, ListInternetOutages, ListServiceStatuses | Moderate-frequency data |
| 10 min | ListEtfFlows, ListHackernewsItems, GetPizzintStatus, SearchGdeltDocuments, GetRiskScores | Periodic data |
| 15 min | ListAcledEvents, ListCyberThreats, ListUnrestEvents | Rate-limited or slow-moving conflict data |
| 30 min | ListAirportDelays, ListClimateAnomalies, ListFireDetections, GetCountryStockIndex | Infrequent upstream updates |
| 1 hr | ListArxivPapers, ListTrendingRepos, ListNavigationalWarnings, GetFredSeries, GetEnergyPrices | Daily-update upstream data |
| 2 hr | GetCountryIntelBrief | LLM-generated content |
| 6 hr | ListUcdpEvents, GetHumanitarianSummary, ListTechEvents, GetUSNIFleetReport | Weekly/monthly upstream data |
| 12 hr | GetDisplacementSummary | Annual UNHCR data |
| 24 hr | ListWorldBankIndicators, SummarizeArticle, ClassifyEvent | Annual data / LLM-generated content |

### In-Memory Cache (Fallback)

Several high-frequency handlers maintain in-memory caches as a fallback when Redis is unavailable:

| Handler | In-Memory TTL | Purpose |
|---------|--------------|---------|
| ListMarketQuotes | 2 min | Same-instance deduplication |
| ListStablecoinMarkets | 2 min | CoinGecko rate limit protection |
| ListEtfFlows | 15 min | Yahoo Finance rate limit protection |
| GetCountryStockIndex | 1 hr | Reduced Yahoo Finance calls |
| GetVesselSnapshot | 10 sec | Real-time 10-second poll cache |

### Stale Cache Pattern

Some handlers implement a stale cache layer for high-availability:

| Handler | Fresh TTL | Stale TTL | Backup TTL | Pattern |
|---------|-----------|-----------|------------|---------|
| GetTheaterPosture | 5 min | 24 hr | 7 days | Three-tier: fresh → stale → backup |
| GetUSNIFleetReport | 6 hr | 7 days | — | Two-tier: fresh → stale |
| GetRiskScores | 10 min | 24 hr | — | Two-tier: fresh → stale |

When the fresh cache expires and the upstream fetch fails, the stale cache provides a degraded but functional response rather than an error.

### Yahoo Finance Rate Limiting

Yahoo Finance enforces IP-level rate limits. The `yahooGate()` function in `server/_shared/constants.ts` serializes all Yahoo requests across handlers with a 600ms minimum gap:

```
Handler A (ListMarketQuotes) ─┐
Handler B (GetMacroSignals)  ─┼─→ yahooGate() ─→ 600ms gap ─→ fetch()
Handler C (ListEtfFlows)     ─┘
```

### Deduplication

- **Hash-based cache keys:** `server/_shared/hash.ts` provides FNV-1a 52-bit hashing for generating compact, collision-resistant cache keys from request parameters
- **Request-scoped keys:** Most handlers include request parameters (symbols, country codes, page sizes, time ranges) in the Redis key to avoid serving stale data for different queries
- **News deduplication:** The `SummarizeArticle` handler deduplicates headlines before sending to LLM providers

---

## Appendix: Complete Environment Variables

| Variable | Used By | Required | Purpose |
|----------|---------|----------|---------|
| `UPSTASH_REDIS_REST_URL` | All Sebuf RPCs | No (graceful skip) | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | All Sebuf RPCs | No (graceful skip) | Upstash Redis auth token |
| `WORLDMONITOR_VALID_KEYS` | Gateway | No | Comma-separated valid API keys for desktop auth |
| `VERCEL_ENV` | Redis key prefix | Auto-set | Deployment environment (production/preview/development) |
| `VERCEL_GIT_COMMIT_SHA` | Redis key prefix | Auto-set | Git commit SHA for preview key isolation |
| `ACLED_ACCESS_TOKEN` | Conflict, Unrest, Intelligence | No (graceful skip) | ACLED API authentication |
| `FINNHUB_API_KEY` | Market (quotes, sectors) | No (graceful skip) | Finnhub stock API key |
| `WINGBITS_API_KEY` | Military (flights, details) | No (graceful skip) | Wingbits ADS-B API key |
| `WS_RELAY_URL` | Military, Maritime | No (graceful skip) | WebSocket relay URL for OpenSky/AIS |
| `NASA_FIRMS_API_KEY` | Wildfire | No (graceful skip) | NASA FIRMS fire data API key |
| `FRED_API_KEY` | Economic | No (graceful skip) | FRED economic data API key |
| `EIA_API_KEY` | Economic, Legacy EIA | No (graceful skip) | EIA energy data API key |
| `CLOUDFLARE_API_TOKEN` | Infrastructure | No (graceful skip) | Cloudflare Radar API token |
| `GROQ_API_KEY` | Intelligence, News | No (graceful skip) | Groq LLM API key |
| `OPENROUTER_API_KEY` | News | No (graceful skip) | OpenRouter LLM API key |
| `OLLAMA_API_URL` | News | No (graceful skip) | Self-hosted Ollama endpoint |
| `OLLAMA_API_KEY` | News | No (graceful skip) | Ollama API key (if auth enabled) |
| `OLLAMA_MODEL` | News | No (default: `llama3.1:8b`) | Ollama model name |
| `URLHAUS_AUTH_KEY` | Cyber | No (graceful skip) | URLhaus threat feed auth |
| `OTX_API_KEY` | Cyber | No (graceful skip) | AlienVault OTX API key |
| `ABUSEIPDB_API_KEY` | Cyber | No (graceful skip) | AbuseIPDB blacklist API key |
| `CONVEX_URL` | Legacy register-interest | Yes (503 if missing) | Convex backend URL |
| `LOCAL_API_MODE` | Military | No | Set to `sidecar` for direct OpenSky access |
