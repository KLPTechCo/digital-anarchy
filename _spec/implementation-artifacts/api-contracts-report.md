# World Monitor — Exhaustive API Contracts Report

> Generated from a full source scan of `/server/`, `/api/`, and `/middleware.ts`.

---

## Table of Contents

- [A. Legacy REST Endpoints](#a-legacy-rest-endpoints)
- [B. Sebuf RPC Endpoints (by Domain)](#b-sebuf-rpc-endpoints-by-domain)
- [C. Shared Server Infrastructure](#c-shared-server-infrastructure)
- [D. Authentication & Security Patterns](#d-authentication--security-patterns)
- [E. Summary Counts](#e-summary-counts)
- [F. Environment Variables Index](#f-environment-variables-index)

---

## A. Legacy REST Endpoints

All legacy endpoints live in `api/` as JavaScript serverless functions deployed to Vercel.

| # | Endpoint | Method | Runtime | External Source | Cache | Auth | File |
|---|----------|--------|---------|-----------------|-------|------|------|
| 1 | `/api/rss-proxy?url=<feedUrl>` | GET | Edge | Upstream RSS (160+ allowed domains) | `max-age=600, s-maxage=600, swr=300` | Origin CORS | `api/rss-proxy.js` |
| 2 | `/api/story?c=&t=&ts=&s=&l=` | GET | Node.js | — (renders OG HTML or 302→SPA) | `max-age=300, s-maxage=300, swr=60` | None (public) | `api/story.js` |
| 3 | `/api/og-story?c=&t=&s=&l=` | GET | Node.js | — (dynamic SVG 1200×630) | `max-age=3600, s-maxage=3600, swr=600` | None (public) | `api/og-story.js` |
| 4 | `/api/download?platform=&variant=` | GET | Edge | GitHub Releases API (`koala73/worldmonitor`) | None (302 redirect) | None (public) | `api/download.js` |
| 5 | `/api/register-interest` | POST | Edge | Convex mutation (`registerInterest:register`) | None | Origin CORS + IP rate-limit (5/hr) | `api/register-interest.js` |
| 6 | `/api/version` | GET | Edge | GitHub Releases API (`koala73/worldmonitor`) | `s-maxage=300, swr=60` | None (CORS: `*`) | `api/version.js` |
| 7 | `/api/fwdstart` | GET | Edge | `fwdstart.me/archive` (HTML scrape→RSS) | `max-age=1800, s-maxage=1800, swr=300` | None (public) | `api/fwdstart.js` |
| 8 | `/api/youtube/live?channel=<handle>` | GET | Edge | YouTube `/live` page (HTML scrape) | `max-age=300` | None (public) | `api/youtube/live.js` |
| 9 | `/api/youtube/embed?videoId=&autoplay=&mute=&origin=` | GET | Edge | YouTube IFrame API (nocookie) | `s-maxage=60, swr=300` | Origin sanitization | `api/youtube/embed.js` |
| 10 | `/api/eia/health` | GET | Edge | — (config check) | — | Origin CORS | `api/eia/[[...path]].js` |
| 11 | `/api/eia/petroleum` | GET | Edge | EIA API v2 (WTI, Brent, production, inventory) | `max-age=1800, s-maxage=1800, swr=300` | Origin CORS | `api/eia/[[...path]].js` |

**Total Legacy REST Endpoints: 11**

---

## B. Sebuf RPC Endpoints (by Domain)

All Sebuf RPCs are routed through a single catch-all:

- **Router**: `api/[domain]/v1/[rpc].ts` → `POST /api/{domain}/v1/{rpc}`
- **Runtime**: Vercel Edge
- **Protocol**: HTTP POST with JSON body/response (proto-generated Sebuf types)
- **Router engine**: `server/router.ts` — static `Map<"POST /path", handler>` lookup

### 1. Aviation (1 RPC)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listAirportDelays` | `POST /api/aviation/v1/listAirportDelays` | FAA NASSTATUS XML API | — | Redis 30min | `server/worldmonitor/aviation/v1/list-airport-delays.ts` |

### 2. Climate (1 RPC)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listClimateAnomalies` | `POST /api/climate/v1/listClimateAnomalies` | Open-Meteo Archive API | — | Redis 30min | `server/worldmonitor/climate/v1/list-climate-anomalies.ts` |

- 15 monitored climate zones with 30-day baseline comparison

### 3. Conflict (3 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listAcledEvents` | `POST /api/conflict/v1/listAcledEvents` | ACLED API | `ACLED_ACCESS_TOKEN` | Redis 15min | `server/worldmonitor/conflict/v1/list-acled-events.ts` |
| `listUcdpEvents` | `POST /api/conflict/v1/listUcdpEvents` | UCDP GED API (version discovery: 25.1→24.1…) | — | Redis 6hr full / 10min partial + in-memory fallback | `server/worldmonitor/conflict/v1/list-ucdp-events.ts` |
| `getHumanitarianSummary` | `POST /api/conflict/v1/getHumanitarianSummary` | HAPI/HDX API | — | Redis 6hr | `server/worldmonitor/conflict/v1/get-humanitarian-summary.ts` |

### 4. Cyber (1 RPC)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listCyberThreats` | `POST /api/cyber/v1/listCyberThreats` | 5 sources in parallel: Feodo Tracker, URLhaus, C2 Intel Feed, AlienVault OTX, AbuseIPDB | — | Redis 15min | `server/worldmonitor/cyber/v1/list-cyber-threats.ts` |

- Deduplication + geo-hydration across all 5 sources

### 5. Displacement (2 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `getDisplacementSummary` | `POST /api/displacement/v1/getDisplacementSummary` | UNHCR Population API (paginated) | — | Redis 12hr | `server/worldmonitor/displacement/v1/get-displacement-summary.ts` |
| `getPopulationExposure` | `POST /api/displacement/v1/getPopulationExposure` | Local data (20 priority countries) | — | None (computed) | `server/worldmonitor/displacement/v1/get-population-exposure.ts` |

### 6. Economic (4 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `getEnergyPrices` | `POST /api/economic/v1/getEnergyPrices` | EIA Open Data API v2 | `EIA_API_KEY` | Redis 1hr | `server/worldmonitor/economic/v1/get-energy-prices.ts` |
| `getFredSeries` | `POST /api/economic/v1/getFredSeries` | FRED API (St. Louis Fed) | `FRED_API_KEY` | Redis 1hr | `server/worldmonitor/economic/v1/get-fred-series.ts` |
| `getMacroSignals` | `POST /api/economic/v1/getMacroSignals` | Yahoo Finance (JPY, BTC, QQQ, XLP) + Alternative.me Fear&Greed + Mempool.space hashrate | — | Redis 5min + In-memory 5min | `server/worldmonitor/economic/v1/get-macro-signals.ts` |
| `listWorldBankIndicators` | `POST /api/economic/v1/listWorldBankIndicators` | World Bank API (50+ countries) | — | Redis 24hr | `server/worldmonitor/economic/v1/list-world-bank-indicators.ts` |

### 7. Infrastructure (5 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listInternetOutages` | `POST /api/infrastructure/v1/listInternetOutages` | Cloudflare Radar API | `CLOUDFLARE_API_TOKEN` | Redis 5min | `server/worldmonitor/infrastructure/v1/list-internet-outages.ts` |
| `listServiceStatuses` | `POST /api/infrastructure/v1/listServiceStatuses` | 30+ status pages (AWS, Azure, GCP, GitHub, Slack, OpenAI, etc.) | — | Redis varies | `server/worldmonitor/infrastructure/v1/list-service-statuses.ts` |
| `getCableHealth` | `POST /api/infrastructure/v1/getCableHealth` | NGA MSI Warnings (cable-keyword filtered) | — | Redis 3min + In-memory fallback | `server/worldmonitor/infrastructure/v1/get-cable-health.ts` |
| `getTemporalBaseline` | `POST /api/infrastructure/v1/getTemporalBaseline` | Redis (reads stored baseline stats) | — | None (reads Redis baselines) | `server/worldmonitor/infrastructure/v1/get-temporal-baseline.ts` |
| `recordBaselineSnapshot` | `POST /api/infrastructure/v1/recordBaselineSnapshot` | — (writes to Redis, Welford's online algorithm) | — | Writes baseline (90d TTL) | `server/worldmonitor/infrastructure/v1/record-baseline-snapshot.ts` |

- Baseline types: `military_flights`, `vessels`, `protests`, `news`, `ais_gaps`, `satellite_fires`
- Anomaly detection via z-score thresholds: low≥1.5, medium≥2.0, high≥3.0
- Cable health tracks 20+ named submarine cables with landing coordinates and NGA warning correlation

### 8. Intelligence (5 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `getRiskScores` | `POST /api/intelligence/v1/getRiskScores` | ACLED protests data + baseline risk model | `ACLED_ACCESS_TOKEN` | Redis (unread TTL) | `server/worldmonitor/intelligence/v1/get-risk-scores.ts` |
| `getPizzintStatus` | `POST /api/intelligence/v1/getPizzintStatus` | PizzINT Watch API + GDELT batch | — | Redis 10min | `server/worldmonitor/intelligence/v1/get-pizzint-status.ts` |
| `classifyEvent` | `POST /api/intelligence/v1/classifyEvent` | Groq AI LLM (`llama-3.1-8b-instant`) | `GROQ_API_KEY` | Redis 24hr | `server/worldmonitor/intelligence/v1/classify-event.ts` |
| `getCountryIntelBrief` | `POST /api/intelligence/v1/getCountryIntelBrief` | Groq AI LLM (`llama-3.1-8b-instant`) | `GROQ_API_KEY` | Redis 2hr | `server/worldmonitor/intelligence/v1/get-country-intel-brief.ts` |
| `searchGdeltDocuments` | `POST /api/intelligence/v1/searchGdeltDocuments` | GDELT Doc API v2 | — | Redis 10min | `server/worldmonitor/intelligence/v1/search-gdelt-documents.ts` |

- Tier-1 monitored countries (20): US, RU, CN, UA, IR, IL, TW, KP, SA, TR, PL, DE, FR, GB, IN, PK, SY, YE, MM, VE

### 9. Maritime (2 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `getVesselSnapshot` | `POST /api/maritime/v1/getVesselSnapshot` | WS Relay server (AIS data) | `WS_RELAY_URL` | In-memory 10s + in-flight dedup | `server/worldmonitor/maritime/v1/get-vessel-snapshot.ts` |
| `listNavigationalWarnings` | `POST /api/maritime/v1/listNavigationalWarnings` | NGA MSI API | — | Redis 1hr | `server/worldmonitor/maritime/v1/list-navigational-warnings.ts` |

### 10. Market (7 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listMarketQuotes` | `POST /api/market/v1/listMarketQuotes` | Finnhub quotes + Yahoo Finance (indices/futures) | `FINNHUB_API_KEY` | In-memory 2min + Redis 2min | `server/worldmonitor/market/v1/list-market-quotes.ts` |
| `listCryptoQuotes` | `POST /api/market/v1/listCryptoQuotes` | CoinGecko markets API | — | Redis 3min | `server/worldmonitor/market/v1/list-crypto-quotes.ts` |
| `listCommodityQuotes` | `POST /api/market/v1/listCommodityQuotes` | Yahoo Finance futures | — | Redis 3min | `server/worldmonitor/market/v1/list-commodity-quotes.ts` |
| `getSectorSummary` | `POST /api/market/v1/getSectorSummary` | Finnhub sector ETFs | `FINNHUB_API_KEY` | Redis 3min | `server/worldmonitor/market/v1/get-sector-summary.ts` |
| `getCountryStockIndex` | `POST /api/market/v1/getCountryStockIndex` | Yahoo Finance national indices (40+ countries) | — | In-memory 1hr + Redis 30min | `server/worldmonitor/market/v1/get-country-stock-index.ts` |
| `listStablecoinMarkets` | `POST /api/market/v1/listStablecoinMarkets` | CoinGecko markets API (USDT, USDC, DAI, FDUSD, USDe) | — | In-memory 2min + Redis 3min | `server/worldmonitor/market/v1/list-stablecoin-markets.ts` |
| `listEtfFlows` | `POST /api/market/v1/listEtfFlows` | Yahoo Finance (10 BTC spot ETFs: IBIT, FBTC, ARKB, BITB, GBTC, HODL, BRRR, EZBC, BTCO, BTCW) | — | In-memory 15min + Redis 10min | `server/worldmonitor/market/v1/list-etf-flows.ts` |

- Yahoo Finance requests globally rate-gated at 600ms minimum gap (`yahooGate()`)
- Stablecoin peg status classification: ON PEG (≤0.5%), SLIGHT DEPEG (≤1%), DEPEGGED (>1%)
- ETF flow direction estimated from price change + volume analysis

### 11. Military (6 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listMilitaryFlights` | `POST /api/military/v1/listMilitaryFlights` | OpenSky Network API (via WS Relay) | `WS_RELAY_URL`, `LOCAL_API_MODE` | Redis 2min | `server/worldmonitor/military/v1/list-military-flights.ts` |
| `getTheaterPosture` | `POST /api/military/v1/getTheaterPosture` | OpenSky + Wingbits (parallel race) | `WS_RELAY_URL`, `WINGBITS_API_KEY`, `LOCAL_API_MODE` | Redis 5min + stale 24hr + backup 7d | `server/worldmonitor/military/v1/get-theater-posture.ts` |
| `getAircraftDetails` | `POST /api/military/v1/getAircraftDetails` | Wingbits customer API | `WINGBITS_API_KEY` | Redis 5min | `server/worldmonitor/military/v1/get-aircraft-details.ts` |
| `getAircraftDetailsBatch` | `POST /api/military/v1/getAircraftDetailsBatch` | Wingbits customer API (max 20 per batch) | `WINGBITS_API_KEY` | Redis 5min (per ICAO24) | `server/worldmonitor/military/v1/get-aircraft-details-batch.ts` |
| `getWingbitsStatus` | `POST /api/military/v1/getWingbitsStatus` | — (config check) | `WINGBITS_API_KEY` | None | `server/worldmonitor/military/v1/get-wingbits-status.ts` |
| `getUSNIFleetReport` | `POST /api/military/v1/getUSNIFleetReport` | USNI News Fleet Tracker (HTML scrape) | — | Redis 6hr + stale 7d | `server/worldmonitor/military/v1/get-usni-fleet-report.ts` |

- Military callsign detection via prefix patterns + hex ID set
- Aircraft type classification: tanker, AWACS, transport, reconnaissance, drone, bomber
- Theater posture assessment: normal → elevated → critical, with strike-capable indicator
- 3-tier cache fallback for theater posture: fresh → stale (24hr) → backup (7d)
- USNI fleet report parsing: extensive region coordinate mapping (25+ naval regions), hull type classification, deployment status detection

### 12. News (1 RPC)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `summarizeArticle` | `POST /api/news/v1/summarizeArticle` | Multi-provider LLM (Ollama / Groq / OpenRouter) | `GROQ_API_KEY`, `OLLAMA_API_URL`, `OLLAMA_API_KEY`, `OLLAMA_MODEL`, `OPENROUTER_API_KEY` | Redis 24hr | `server/worldmonitor/news/v1/summarize-article.ts` |

- 3 LLM provider backends: Ollama (self-hosted), Groq (`llama-3.1-8b-instant`), OpenRouter (`openrouter/free`)
- Modes: `brief`, `analysis`, `translate`, default synthesis
- Variants: `full` (geopolitical), `tech` (tech/startup focused)
- Input sanitization: max 10 headlines × 500 chars, max 2000 char geoContext
- Deduplication of similar headlines before prompting
- `<think>` token stripping for reasoning models (DeepSeek-R1, QwQ)

### 13. Prediction (1 RPC)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listPredictionMarkets` | `POST /api/prediction/v1/listPredictionMarkets` | Polymarket Gamma API | — | Redis 5min | `server/worldmonitor/prediction/v1/list-prediction-markets.ts` |

- Graceful degradation on Cloudflare JA3 fingerprint blocks

### 14. Research (4 RPCs)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listArxivPapers` | `POST /api/research/v1/listArxivPapers` | arXiv Atom XML API | — | Redis 1hr | `server/worldmonitor/research/v1/list-arxiv-papers.ts` |
| `listTrendingRepos` | `POST /api/research/v1/listTrendingRepos` | gitterapp JSON API + herokuapp fallback | — | Redis 1hr | `server/worldmonitor/research/v1/list-trending-repos.ts` |
| `listHackernewsItems` | `POST /api/research/v1/listHackernewsItems` | HN Firebase JSON API (2-step: IDs → items) | — | Redis 10min | `server/worldmonitor/research/v1/list-hackernews-items.ts` |
| `listTechEvents` | `POST /api/research/v1/listTechEvents` | Techmeme ICS + dev.events RSS + curated list | — | Redis 6hr | `server/worldmonitor/research/v1/list-tech-events.ts` |

- HN bounded concurrency: max 10 parallel item fetches
- Tech events geocoded via 500-city coordinate lookup
- Curated events for major conferences (STEP Dubai, GITEX, TOKEN2049, Collision, Web Summit)

### 15. Seismology (1 RPC)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listEarthquakes` | `POST /api/seismology/v1/listEarthquakes` | USGS GeoJSON 4.5+ day feed | — | Redis 5min | `server/worldmonitor/seismology/v1/list-earthquakes.ts` |

### 16. Unrest (1 RPC)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listUnrestEvents` | `POST /api/unrest/v1/listUnrestEvents` | ACLED API + GDELT Geo API (merged, deduplicated) | `ACLED_ACCESS_TOKEN` | Redis 15min | `server/worldmonitor/unrest/v1/list-unrest-events.ts` |

- Merges ACLED protests + GDELT geo-events with location-based deduplication (0.1° grid)
- Severity classification: fatalities > 0 or riot → HIGH, protest → MEDIUM, else LOW
- GDELT noise filter: minimum 5 reports per location
- ACLED preferred over GDELT in merge conflicts (higher confidence)

### 17. Wildfire (1 RPC)

| RPC | Route | External Source | Env Vars | Cache | File |
|-----|-------|-----------------|----------|-------|------|
| `listFireDetections` | `POST /api/wildfire/v1/listFireDetections` | NASA FIRMS CSV API | `NASA_FIRMS_API_KEY` or `FIRMS_API_KEY` | Redis 30min | `server/worldmonitor/wildfire/v1/list-fire-detections.ts` |

- 9 monitored regions: Ukraine, Russia, Iran, Israel/Gaza, Syria, Taiwan, North Korea, Saudi Arabia, Turkey

---

## C. Shared Server Infrastructure

### Router (`server/router.ts`)
- `createRouter(routes)` → builds `Map<"POST /path", handler>`
- Static path lookup only (no dynamic segments for Sebuf routes)
- Normalizes trailing slashes

### CORS (`server/cors.ts` + `api/_cors.js`)
- Allowed origins: `*.worldmonitor.app`, Vercel preview deploys (`*.vercel.app`), `localhost`, `127.0.0.1`, `tauri.localhost`, `tauri://localhost`, `asset://localhost`
- Allowed headers: `Content-Type`, `Authorization`, `X-WorldMonitor-Key`
- Methods: `POST, OPTIONS` (Sebuf), varies per legacy endpoint
- Preflight max-age: 86400s
- `Vary: Origin` header

### Error Mapper (`server/error-mapper.ts`)
- `ApiError` → mapped status code (4xx expose original message, 5xx get generic message)
- `TypeError` → 502
- Catch-all → 500
- Rate-limit errors include `Retry-After` header

### Redis Cache (`server/_shared/redis.ts`)
- Upstash Redis REST API (edge-compatible)
- `getCachedJson(key)` / `setCachedJson(key, value, ttl)`
- 3-second timeout per operation
- Keys prefixed with `{VERCEL_ENV}:{GIT_SHA}:` for environment isolation
- Atomic `SET key value EX ttl` for writes
- Additional `mgetJson(keys)` helper in `infrastructure/v1/_shared.ts` for batch reads

### Hash Utility (`server/_shared/hash.ts`)
- FNV-1a 52-bit hash using BigInt
- Returns base-36 string
- Used for cache key generation (summaries, baselines)

### Constants (`server/_shared/constants.ts`)
- `CHROME_UA` — Chrome user-agent string for upstream requests
- `yahooGate()` — global Yahoo Finance request rate limiter (600ms min gap)

---

## D. Authentication & Security Patterns

### CORS Origin Validation
- **All endpoints**: Origin checked against allowlist pattern
- **Legacy**: `api/_cors.js` → `getCorsHeaders(req)` / `isDisallowedOrigin(req)`
- **Sebuf**: `server/cors.ts` → same logic, TS port

### API Key Authentication
- **Header**: `X-WorldMonitor-Key`
- **Validation**: `api/_api-key.js` → checks against `WORLDMONITOR_VALID_KEYS` (comma-separated env var)
- **Desktop (Tauri) origins**: API key **required**
- **Web origins**: API key **optional** but validated if present
- **Applied**: In the Sebuf router catch-all (`api/[domain]/v1/[rpc].ts`) after CORS preflight

### Input Sanitization
- RSS proxy: domain allowlist (160+ domains), redirect domain validation
- News summarization: headline count (max 10), headline length (max 500), geoContext (max 2000)
- Aircraft batch: max 20 ICAO24s per request
- Baseline snapshots: max 20 updates per batch
- Stablecoin coin IDs: regex-validated (`/^[a-z0-9-]+$/`)

### Rate Limiting
- Registration endpoint: 5 requests/hr per IP (in-memory Map)
- Yahoo Finance: global 600ms gate between requests
- HN API: bounded concurrency (10 parallel)
- Graceful degradation on upstream 429s (return stale cache or empty)

### Error Handling Patterns
- **Graceful degradation**: Every Sebuf handler returns empty/default result on failure (never throws to client)
- **Multi-tier cache fallback**: Theater posture uses fresh → stale (24hr) → backup (7d) → empty
- **Provider fallback**: Market quotes Finnhub → Yahoo; trending repos gitterapp → herokuapp; military flights OpenSky → Wingbits
- **Config check RPCs**: `getWingbitsStatus`, `getEnergyPrices`, `eia/health` report whether optional services are configured

---

## E. Summary Counts

| Category | Count |
|----------|-------|
| **Legacy REST Endpoints** | 11 |
| **Sebuf Service Domains** | 17 |
| **Total Sebuf RPCs** | 46 |
| **Total API Endpoints** | 57 |
| **Unique External Data Sources** | 35+ |
| **Environment Variables** | 19 |
| **Handler Files** | 50+ |

### RPCs per Domain

| Domain | RPC Count |
|--------|-----------|
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

## F. Environment Variables Index

| Variable | Required By | Purpose |
|----------|-------------|---------|
| `WORLDMONITOR_VALID_KEYS` | Sebuf router | Comma-separated valid desktop API keys |
| `UPSTASH_REDIS_REST_URL` | All cached RPCs | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | All cached RPCs | Upstash Redis auth token |
| `VERCEL_ENV` | Redis key prefix | Environment name (preview/production) |
| `VERCEL_GIT_COMMIT_SHA` | Redis key prefix | Git SHA for cache isolation |
| `CONVEX_URL` | register-interest | Convex backend URL |
| `ACLED_ACCESS_TOKEN` | conflict, intelligence, unrest | ACLED API bearer token |
| `NASA_FIRMS_API_KEY` / `FIRMS_API_KEY` | wildfire | NASA FIRMS map key |
| `CLOUDFLARE_API_TOKEN` | infrastructure | Cloudflare Radar API token |
| `EIA_API_KEY` | economic, eia proxy | US Energy Information Administration key |
| `FRED_API_KEY` | economic | Federal Reserve Economic Data API key |
| `GROQ_API_KEY` | intelligence, news | Groq AI API key (LLM) |
| `FINNHUB_API_KEY` | market | Finnhub stock data API key |
| `WS_RELAY_URL` | military, maritime | WebSocket relay server URL (OpenSky/AIS proxy) |
| `WINGBITS_API_KEY` | military | Wingbits ADS-B customer API key |
| `LOCAL_API_MODE` | military | Sidecar mode flag (direct OpenSky when `includes('sidecar')`) |
| `OLLAMA_API_URL` | news | Self-hosted Ollama LLM endpoint |
| `OLLAMA_API_KEY` | news | Optional Ollama auth key |
| `OLLAMA_MODEL` | news | Ollama model name (default: `llama3.1:8b`) |
| `OPENROUTER_API_KEY` | news | OpenRouter LLM API key |

---

*Report covers every file in `api/`, `server/`, and `middleware.ts`. Scan completed exhaustively across all 17 Sebuf domains and 11 legacy endpoints.*
