# Integration Architecture

> World Monitor v2.5.8 — Multi-Runtime Monolith Integration Guide

This document describes how the 8 major parts of the World Monitor system communicate. It covers every integration path from browser to external API, including desktop offline operation, WebSocket streaming, worker threads, and proto-generated communication layers.

---

## Table of Contents

- [A. Integration Overview](#a-integration-overview)
- [B. Web Path](#b-web-path)
- [C. Desktop Path](#c-desktop-path)
- [D. WebSocket Path](#d-websocket-path)
- [E. Worker Communication](#e-worker-communication)
- [F. Proto Code Generation Flow](#f-proto-code-generation-flow)
- [G. Secret Management](#g-secret-management)
- [H. Data Flow Patterns](#h-data-flow-patterns)
- [I. Offline / Fallback Strategy](#i-offline--fallback-strategy)
- [J. Cross-Part Dependencies](#j-cross-part-dependencies)
- [K. Security Hardening](#k-security-hardening)
- [L. New in v2.5.8](#l-new-in-v258)

---

## A. Integration Overview

The system is composed of **8 communicating parts**:

| # | Part | Runtime | Location |
|---|------|---------|----------|
| 1 | **Frontend SPA** | Browser (main thread) | `src/` |
| 2 | **Vercel Edge Middleware** | Vercel Edge Runtime | `middleware.ts` |
| 3 | **API Gateway (Edge Functions)** | Vercel Edge Runtime | `api/[domain]/v1/[rpc].ts` |
| 4 | **Server Handlers** | Vercel Edge / Node.js sidecar | `server/worldmonitor/*/v1/handler.ts` |
| 5 | **Tauri Rust Shell** | Native (macOS/Windows/Linux) | `src-tauri/src/main.rs` |
| 6 | **Sidecar Local API Server** | Node.js child process | `src-tauri/sidecar/local-api-server.mjs` |
| 7 | **AIS Relay Server** | Node.js (Railway) | `scripts/ais-relay.cjs` |
| 8 | **Web Workers** | Browser (dedicated worker threads) | `src/workers/ml.worker.ts`, `src/workers/analysis.worker.ts` |

Additionally, **Convex** (`convex/registerInterest.ts`) provides a serverless database for email registration, and **proto/sebuf** generates the typed RPC layer shared between parts 1, 3, 4, and 6.

### System Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BROWSER CONTEXT                              │
│                                                                     │
│  ┌──────────────┐   postMessage   ┌───────────────────────────┐    │
│  │  ML Worker    │◄──────────────►│                           │    │
│  │  (ONNX)      │                 │    Frontend SPA (1)       │    │
│  └──────────────┘                 │    src/App.ts (499 LOC    │    │
│  ┌──────────────┐   postMessage   │      shell) + src/app/    │    │
│  │  Analysis     │◄──────────────►│      (8 modules, 4,995   │    │
│  │  Worker       │                │      LOC)                 │    │
│  └──────────────┘                 │    src/services/*         │    │
│                                   │    src/components/* (62)  │    │
│                                   └────────┬──────────────────┘    │
│                                            │                        │
│               ┌────────────────────────────┼────────────────────┐  │
│               │ fetch() — patched in       │ desktop, native     │  │
│               │ in web                     │                     │  │
└───────────────┼────────────────────────────┼─────────────────────┼──┘
                │                            │                     │
    ┌───────────▼──────────┐     ┌───────────▼──────────┐         │
    │ WEB PATH             │     │ DESKTOP PATH          │         │
    │                      │     │                       │         │
    │ Vercel Edge          │     │ Tauri Rust Shell (5)  │         │
    │ Middleware (2)        │     │ ┌─ Keychain secrets   │         │
    │ ┌─ Bot blocking      │     │ ┌─ Sidecar mgmt      │         │
    │ ┌─ UA filtering      │     │ ┌─ Persistent cache   │         │
    │         │             │     │         │              │         │
    │         ▼             │     │         ▼              │         │
    │ API Gateway (3)       │     │ Sidecar (6)           │         │
    │ api/[domain]/v1/[rpc] │     │ local-api-server.mjs  │         │
    │ ┌─ CORS validation   │     │ ┌─ Route matching     │         │
    │ ┌─ API key check     │     │ ┌─ IPv4-forced fetch  │         │
    │ ┌─ Router dispatch   │     │ ┌─ Brotli compression │         │
    │         │             │     │ ┌─ Cloud fallback     │         │
    │         ▼             │     │         │              │         │
    │ Server Handlers (4)   │     │   Same Handlers (4)   │         │
    │ server/worldmonitor/* │     │   (loaded as modules)  │         │
    └──────────┬───────────┘     └──────────┬─────────────┘         │
               │                            │                       │
               ▼                            ▼                       │
    ┌────────────────────────────────────────────────────────┐      │
    │          EXTERNAL APIs                                  │      │
    │  USGS · FIRMS · FRED · EIA · ACLED · GDELT · WTO · BIS │      │
    │  Finnhub · Cloudflare · PolyMarket · UNHCR · YouTube   │      │
    │  AbuseIPDB · OTX · URLhaus · UCDP · Groq · CAF/GHI    │      │
    └────────────────────────────────────────────────────────┘      │
                                                                     │
    ┌──────────────────────┐          ┌──────────────────────┐      │
    │  AIS Relay (7)       │◄─── WS ──┤  AISStream.io        │      │
    │  Railway             │          └──────────────────────┘      │
    │  HTTP snapshot API   │◄── fetch ─────────────────────────────┘
    │  WS fanout (max 10)  │
    │  Spatial chokepoint   │
    │  index + backpressure │
    └──────────────────────┘

    ┌──────────────────────┐
    │  Convex              │◄── mutation ── Frontend Register
    │  registerInterest.ts │              Interest form
    └──────────────────────┘
```

---

## B. Web Path

**Browser → Vercel Edge → Middleware → API Gateway → Router → Handlers → External APIs**

### B.1 Request Lifecycle

```
Browser fetch("/api/seismology/v1/list-earthquakes", { method: "POST", body: JSON })
   │
   ▼
┌─ Vercel Edge Middleware (middleware.ts) ──────────────────────────┐
│  1. Extract User-Agent header                                     │
│  2. Allow social preview bots on /api/story, /api/og-story       │
│  3. Block bot/crawler UA patterns (403 Forbidden)                 │
│  4. Block empty/short UA strings (403 Forbidden)                  │
│  5. Pass through to API route handler                             │
│  Matcher: /api/:path*, /favico/:path*                             │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─ API Gateway — api/[domain]/v1/[rpc].ts (Edge Function) ────────┐
│  1. Origin check — isDisallowedOrigin() → 403 if blocked         │
│  2. CORS headers — getCorsHeaders() (reflect allowed origins)    │
│  3. OPTIONS preflight → 204 with CORS headers                    │
│  4. API key validation — validateApiKey() checks                 │
│     - Desktop origins: X-WorldMonitor-Key header required         │
│     - Browser same-origin: key optional (not required)            │
│     - Key present: validated against WORLDMONITOR_VALID_KEYS env │
│  5. Router.match(request) — static Map<"POST /path", handler>   │
│  6. Execute matched handler with top-level error boundary        │
│  7. Merge CORS headers into response                             │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─ Router (server/router.ts) ─────────────────────────────────────┐
│  • createRouter(allRoutes) builds Map<string, handler>           │
│  • Key format: "POST /api/{domain}/v1/{rpc}"                    │
│  • All sebuf routes are static POST — no dynamic segments        │
│  • Normalizes trailing slashes                                    │
│  • O(1) lookup via Map.get()                                     │
└──────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─ Handler (server/worldmonitor/{domain}/v1/handler.ts) ──────────┐
│  • Receives typed request (deserialized from JSON by generated   │
│    server stub)                                                   │
│  • Calls external APIs (USGS, FRED, EIA, WTO, BIS, etc.)        │
│  • Maps upstream errors via error-mapper.ts:                     │
│    - ApiError (with statusCode) → proxied status code            │
│    - Network TypeError → 502 Bad Gateway                         │
│    - Unknown → 500 Internal Server Error                         │
│  • Returns typed response (serialized to JSON by generated stub) │
└──────────────────────────────────────────────────────────────────┘
```

### B.2 Registered Service Domains

The gateway registers routes for **20 service domains** (57 RPCs):

| Domain | Example RPC | External Source |
|--------|------------|-----------------|
| seismology | list-earthquakes | USGS |
| wildfire | — | NASA FIRMS |
| climate | — | NOAA / climate APIs |
| prediction | — | Polymarket |
| displacement | — | UNHCR |
| aviation | — | OpenSky / ADS-B |
| research | — | arXiv / etc. |
| unrest | — | ACLED / GDELT |
| conflict | — | ACLED / UCDP |
| maritime | — | AIS Relay / AISStream |
| cyber | — | AbuseIPDB / OTX / URLhaus |
| economic | — | FRED / BLS |
| infrastructure | — | Cloudflare Radar |
| market | — | Finnhub |
| news | — | RSS / GDELT |
| intelligence | — | Multi-source aggregation |
| military | — | OpenSky / AIS / Wingbits |
| **trade** | get-trade-restrictions | **WTO** |
| **giving** | get-giving-summary | **CAF / GHI** |
| **positive-events** | list-positive-geo-events | **Multi-source positive news** |

### B.3 CORS Policy

Defined in `server/cors.ts`:

- **Production**: `*.worldmonitor.app`, Vercel preview URLs, Tauri localhost origins
- **Development**: adds `localhost:*`, `127.0.0.1:*`
- Methods: `POST, OPTIONS` (all sebuf routes are POST)
- Headers: `Content-Type, Authorization, X-WorldMonitor-Key`
- Max-Age: 86400 (24 hours)

---

## C. Desktop Path

**WebView → Sidecar → Local Handlers → External APIs, with cloud fallback**

### C.1 Architecture

The desktop build uses **Tauri 2.x** with a 3-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│  WebView (Frontend SPA — identical code to web)             │
│                                                              │
│  Runtime detection: isDesktopRuntime()                       │
│  ┌─ __TAURI_INTERNALS__ / __TAURI__ globals                 │
│  ┌─ tauri:// or asset:// protocol                           │
│  ┌─ "Tauri" in User-Agent                                   │
│  ┌─ VITE_DESKTOP_RUNTIME=1 override                         │
│                                                              │
│  fetch() is monkey-patched by installRuntimeFetchPatch()    │
└──────────────────┬──────────────────────────────────────────┘
                   │
     fetch("http://127.0.0.1:46123/api/{domain}/v1/{rpc}")
     + Authorization: Bearer {local-api-token}
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Sidecar — local-api-server.mjs (Node.js child process)    │
│  Port: 46123                                                 │
│                                                              │
│  1. Bearer token validation (from Rust parent)              │
│  2. Route matching (file-system based, priority-sorted)     │
│  3. Dynamic module loading (same api/*.js handlers)          │
│  4. IPv4-forced globalThis.fetch (monkey-patched)           │
│  5. Brotli/gzip response compression                        │
│  6. Cloud fallback: proxyToCloud() on handler failure       │
│                                                              │
│  Env vars injected from Rust keychain:                       │
│    GROQ_API_KEY, FRED_API_KEY, EIA_API_KEY,                 │
│    FINNHUB_API_KEY, NASA_FIRMS_API_KEY, etc. (21 keys)      │
└──────────────────┬──────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────────┐
│  Tauri Rust Shell — src-tauri/src/main.rs                   │
│                                                              │
│  Manages:                                                    │
│  ┌─ SecretsCache: OS keychain → in-memory HashMap           │
│  │  Consolidated vault: keyring("world-monitor","secrets-   │
│  │  vault") → JSON map. Migrates from individual entries.   │
│  ┌─ LocalApiState: sidecar child process + bearer token     │
│  ┌─ PersistentCache: in-memory mirror of JSON file          │
│  │  (app-data-dir/persistent-cache.json)                    │
│                                                              │
│  IPC Commands (window.__TAURI__.core.invoke):               │
│  • get_local_api_token → bearer token for sidecar auth     │
│  • get_secret / set_secret / delete_secret / get_all_secrets│
│  • list_supported_secret_keys → key whitelist               │
│  • read_cache_entry / write_cache_entry                      │
│  • get_desktop_runtime_info → { os, arch }                  │
└─────────────────────────────────────────────────────────────┘
```

### C.2 Fetch Patch — Desktop API Routing

`src/services/runtime.ts` → `installRuntimeFetchPatch()` intercepts **all** `fetch()` calls:

1. **Non-API requests** → pass through to native `fetch()`
2. **API requests** (`/api/*`) → rewrite to `http://127.0.0.1:46123/api/...`
3. **Add bearer token** from `get_local_api_token` Tauri command
4. **On local failure** → cloud fallback to `https://worldmonitor.app/api/...`
5. **Cloud fallback blocked** for:
   - `/api/local-*` endpoints (security boundary — may carry local secrets)
   - When `WORLDMONITOR_API_KEY` is missing or invalid in the keychain
6. **Startup retry**: up to 4 attempts with 125ms×attempt backoff while sidecar starts

### C.3 Sidecar IPv4 Patch

`local-api-server.mjs` patches `globalThis.fetch` to force IPv4 (`family: 4`) for all HTTPS/HTTP requests. This fixes ETIMEDOUT errors with government APIs (EIA, NASA FIRMS, FRED) that publish AAAA DNS records but have non-functional IPv6 endpoints.

---

## D. WebSocket Path

**Browser → AIS Relay → AISStream.io, with vessel state management**

### D.1 AIS Relay Architecture

```
┌──────────────────┐     HTTP GET         ┌──────────────────────────┐
│  Browser /        │ ──────────────────► │  AIS Relay (Railway)     │
│  Desktop App      │  /api/vessel-       │  scripts/ais-relay.cjs   │
│                   │  snapshot           │  Port: $PORT (3004 local)│
│                   │                     │                           │
│                   │     WebSocket       │  ┌──────────────────────┐ │
│  (limited clients)│ ◄──────────────── │  │ Server-side state:   │ │
│                   │  (max 10 clients)   │  │ • vessels Map        │ │
│                   │                     │  │ • vesselHistory Map  │ │
└──────────────────┘                     │  │ • densityGrid Map    │ │
                                          │  │ • candidateReports   │ │
                                          │  │   (military detect)  │ │
                                          │  └──────────────────────┘ │
                                          │            ▲               │
                                          │            │ onmessage    │
                                          │  ┌─────────┴────────────┐ │
                                          │  │ Upstream WebSocket   │ │
                                          │  │ → AISStream.io       │ │
                                          │  │   wss://stream.      │ │
                                          │  │   aisstream.io/v0    │ │
                                          │  └──────────────────────┘ │
                                          └──────────────────────────┘
```

### D.2 Relay Responsibilities

The relay server is **not a simple proxy** — it maintains significant server-side state:

| Feature | Description |
|---------|-------------|
| **Vessel tracking** | In-memory `vessels` Map keyed by MMSI, 30-min window |
| **Density grid** | 2°×2° grid cells tracking vessel counts and intensity |
| **Chokepoint monitoring** | 8 predefined maritime chokepoints (Hormuz, Suez, Malacca, Bab el-Mandeb, Panama, Taiwan Strait, South China Sea, Black Sea) |
| **Chokepoint spatial index** | Vessels bucketed into grid cells at ingest time for O(1) chokepoint lookup |
| **Military detection** | NAVAL_PREFIX_RE + ship type (35/50–59) → `candidateReports` |
| **Dark ship detection** | AIS gap analysis (gaps > 1 hour) → disruption alerts |
| **Snapshot API** | Pre-computed JSON snapshot at configurable intervals (default 5s) |
| **UCDP caching** | 6-hour TTL cache for UCDP GED conflict events (avoids upstream rate limits) |
| **Gzip compression** | Response compression for HTTP snapshot API (~80% reduction) |
| **Per-client backpressure** | Skips WebSocket sends when client buffer is backed up |

### D.3 Communication Pattern

The relay uses a **hybrid HTTP+WebSocket** model:

- **HTTP snapshots** (primary): Browsers poll `/api/vessel-snapshot` for pre-aggregated data. This is the default path used by the app.
- **WebSocket fanout** (secondary): At most 10 WebSocket clients receive raw AIS messages. Used for real-time vessel tracking overlays.
- **Server-side state**: The relay maintains all aggregation state (chokepoints, density, military candidates) so clients receive computed intelligence rather than raw AIS data.

---

## E. Worker Communication

**Main Thread ↔ ML Worker, Main Thread ↔ Analysis Worker**

### E.1 ML Worker

```
┌─────────────────────────────┐   postMessage    ┌────────────────────────┐
│  Main Thread                │ ────────────────► │  ml.worker.ts          │
│  src/services/ml-worker.ts  │                   │                        │
│                              │   postMessage    │  @xenova/transformers  │
│  MLWorkerManager class       │ ◄──────────────── │  ONNX Runtime          │
│  • pendingRequests Map       │                   │                        │
│  • requestIdCounter          │                   │  Capabilities:         │
│  • modelProgressCallbacks    │                   │  • embed               │
│                              │                   │  • summarize           │
│  Typed API:                  │                   │  • classify-sentiment  │
│  • init() → ready promise    │                   │  • extract-entities    │
│  • embed(texts)              │                   │  • cluster-semantic    │
│  • summarize(texts)          │                   │  • load-model          │
│  • classifySentiment(texts)  │                   │  • unload-model        │
│  • extractEntities(texts)    │                   │  • status              │
│  • clusterSemantic(...)      │                   │  • reset               │
└─────────────────────────────┘                   └────────────────────────┘
```

**Protocol**: Request-response over `postMessage` with correlation IDs.

| Direction | Message Format |
|-----------|---------------|
| Main → Worker | `{ type: "embed", id: "req-42", texts: [...] }` |
| Worker → Main | `{ type: "embed-result", id: "req-42", embeddings: [[...]] }` |
| Worker → Main | `{ type: "error", id: "req-42", error: "..." }` |
| Worker → Main | `{ type: "model-progress", modelId: "...", progress: 0.75 }` |

- Each request has a `timeout` (configurable per-request type)
- Worker initialization has a 10-second ready timeout
- Models are loaded on-demand and can be unloaded to free memory
- Browser cache (`env.useBrowserCache = true`) persists ONNX models across sessions

### E.2 Analysis Worker

```
┌─────────────────────────────┐   postMessage    ┌─────────────────────────┐
│  Main Thread                │ ────────────────► │  analysis.worker.ts     │
│  (App.ts / services)        │                   │                         │
│                              │   postMessage    │  Imports from:          │
│                              │ ◄──────────────── │  analysis-core.ts       │
└─────────────────────────────┘                   │  (single source of      │
                                                   │   truth)                │
                                                   │                         │
                                                   │  Operations:            │
                                                   │  • cluster – Jaccard    │
                                                   │    O(n²) news clustering│
                                                   │  • correlation – cross  │
                                                   │    signal detection     │
                                                   │  • reset – clear state  │
                                                   └─────────────────────────┘
```

**Protocol**: Same request-response pattern with correlation IDs.

| Direction | Message Format |
|-----------|---------------|
| Main → Worker | `{ type: "cluster", id: "c-1", items: [...], sourceTiers: {...} }` |
| Worker → Main | `{ type: "cluster-result", id: "c-1", clusters: [...] }` |
| Main → Worker | `{ type: "correlation", id: "r-1", clusters, predictions, markets, sourceTypes }` |
| Worker → Main | `{ type: "correlation-result", id: "r-1", signals: [...] }` |

- Worker maintains `previousSnapshot` state between messages for temporal comparison
- `recentSignalKeys` set prevents duplicate signal emission (30-min dedup window)
- Dates are serialized as strings over `postMessage` and deserialized on receipt

---

## F. Proto Code Generation Flow

**Proto definitions → buf → sebuf plugins → generated TypeScript → runtime**

### F.1 Pipeline

```
┌──────────────────────┐        ┌─────────────────┐        ┌────────────────────────────┐
│  Proto Definitions   │        │  buf CLI         │        │  sebuf Plugins             │
│  proto/worldmonitor/ │ ────► │  buf generate    │ ────► │                            │
│  {domain}/v1/*.proto │        │  (buf.gen.yaml)  │        │  protoc-gen-ts-client      │
│                      │        │                  │        │  protoc-gen-ts-server      │
│  ~92 .proto files    │        │  deps:           │        │  protoc-gen-openapiv3      │
│  17 service domains  │        │  protovalidate   │        │                            │
└──────────────────────┘        └─────────────────┘        └────────────┬───────────────┘
                                                                         │
                                     ┌───────────────────────────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
┌──────────────────────┐ ┌────────────────────┐ ┌──────────────────────┐
│  Generated Client    │ │  Generated Server  │ │  OpenAPI v3 Specs    │
│  src/generated/      │ │  src/generated/    │ │  docs/api/           │
│  client/worldmonitor/│ │  server/worldmonitor│ │  *.yaml + *.json    │
│  {domain}/v1/        │ │  {domain}/v1/      │ │                      │
│  service_client.ts   │ │  service_server.ts │ │                      │
└──────────────────────┘ └────────────────────┘ └──────────────────────┘
```

### F.2 Make Targets

```bash
make generate    # Clean + regenerate all code from proto definitions
make lint        # Lint protobuf files for STANDARD + COMMENTS rules
make breaking    # Check breaking changes vs. main branch (WIRE_JSON + FILE + PACKAGE)
make clean       # Remove all generated directories
make deps        # Update buf proto dependencies
```

### F.3 Generated Client Shape

Each generated client (`service_client.ts`) provides:

- **TypeScript interfaces** for request/response messages (matching proto schemas)
- **`ValidationError`** class with field violations
- **`ApiError`** class with statusCode and body
- **`{Domain}ServiceClient`** class with:
  - Constructor: `new SeismologyServiceClient(baseURL, options?)`
  - RPC methods: `async listEarthquakes(req, options?) → Promise<Response>`
  - All RPCs are **POST** to `/api/{domain}/v1/{rpc-name}`
  - Supports custom `fetch`, `defaultHeaders`, per-call `headers` and `signal`

### F.4 Generated Server Shape

Each generated server (`service_server.ts`) provides:

- Same TypeScript interfaces as client
- **`{Domain}ServiceHandler`** interface defining the method contract
- **`create{Domain}ServiceRoutes(handler, options?) → RouteDescriptor[]`**
  - Returns `{ method, path, handler }` tuples consumed by `createRouter()`
  - Handles JSON deserialization, optional validation, and JSON serialization
  - Delegates errors to `ServerOptions.onError` (→ `mapErrorToResponse`)
- **`ServerContext`**: `{ request, pathParams, headers }` passed to each handler

### F.5 Version Management

- **buf CLI**: v1.64.0
- **sebuf plugins**: v0.7.0 (protoc-gen-ts-client, protoc-gen-ts-server, protoc-gen-openapiv3)
- **Proto lint rules**: STANDARD, COMMENTS, enum_zero_value_suffix: _UNSPECIFIED, service_suffix: Service
- **Breaking change detection**: FILE, PACKAGE, WIRE_JSON policies against `main` branch

---

## G. Secret Management

### G.1 Desktop: Rust Keychain → Sidecar → Handlers

```
┌─────────────────────────────────────────────────────────────────────┐
│  OS Keychain (macOS Keychain / Windows Credential Manager)          │
│                                                                     │
│  Service: "world-monitor"                                           │
│  Key: "secrets-vault"                                               │
│  Value: JSON { "FRED_API_KEY": "...", "EIA_API_KEY": "...", ... }  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ read once at startup
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Rust SecretsCache (in-memory HashMap)                              │
│                                                                     │
│  • Loaded once → no repeated keychain prompts                       │
│  • Consolidated vault format (migrates from individual keys)        │
│  • SUPPORTED_SECRET_KEYS whitelist (21 keys)                        │
│  • IPC commands: get_secret, set_secret, delete_secret,             │
│    get_all_secrets, list_supported_secret_keys                      │
└────────────────────────────┬────────────────────────────────────────┘
                             │ injected as env vars
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Sidecar (local-api-server.mjs)                                     │
│                                                                     │
│  ALLOWED_ENV_KEYS whitelist (must match Rust whitelist):            │
│  GROQ_API_KEY, OPENROUTER_API_KEY, FRED_API_KEY, EIA_API_KEY,      │
│  CLOUDFLARE_API_TOKEN, ACLED_ACCESS_TOKEN, URLHAUS_AUTH_KEY,        │
│  OTX_API_KEY, ABUSEIPDB_API_KEY, WINGBITS_API_KEY, WS_RELAY_URL,   │
│  VITE_OPENSKY_RELAY_URL, OPENSKY_CLIENT_ID, OPENSKY_CLIENT_SECRET, │
│  AISSTREAM_API_KEY, VITE_WS_RELAY_URL, FINNHUB_API_KEY,            │
│  NASA_FIRMS_API_KEY, OLLAMA_API_URL, OLLAMA_MODEL,                  │
│  WORLDMONITOR_API_KEY                                                │
│                                                                     │
│  Secrets read via process.env.{KEY} in handler modules              │
└─────────────────────────────────────────────────────────────────────┘
```

### G.2 Web: Vercel Environment Variables → Edge Functions

```
┌──────────────────────────────────────────────────┐
│  Vercel Project Settings → Environment Variables  │
│                                                    │
│  Set per-environment (Production / Preview / Dev) │
│  Encrypted at rest, injected at deploy time       │
└──────────────────────┬─────────────────────────────┘
                       │ available as process.env
                       ▼
┌──────────────────────────────────────────────────┐
│  Edge Functions (api/[domain]/v1/[rpc].ts)       │
│  + Handler modules (server/worldmonitor/*)        │
│                                                    │
│  Each handler reads API keys via process.env:     │
│  • process.env.FRED_API_KEY                       │
│  • process.env.FINNHUB_API_KEY                    │
│  • etc.                                            │
└──────────────────────────────────────────────────┘
```

### G.3 Desktop → Cloud API Key

When the desktop app falls back to cloud endpoints, it authenticates with the `WORLDMONITOR_API_KEY`:

1. Frontend checks if `WORLDMONITOR_API_KEY` is present and valid in runtime config
2. If yes → adds `X-WorldMonitor-Key` header to cloud fallback requests
3. Cloud gateway (`_api-key.js`) validates against `WORLDMONITOR_VALID_KEYS` env var
4. If key invalid or missing → cloud fallback is blocked (request fails locally)

---

## H. Data Flow Patterns

### H.1 Standard RPC Flow (Proto-generated)

```
External API (e.g., USGS)
    │
    │ fetch() in handler
    ▼
Handler (server/worldmonitor/seismology/v1/handler.ts)
    │
    │ returns ListEarthquakesResponse
    ▼
Generated Server Stub (service_server.ts)
    │
    │ JSON.stringify(result)
    ▼
Response travels back through Gateway → Middleware → Browser
    │
    │ resp.json()
    ▼
Generated Client (service_client.ts)
    │
    │ typed ListEarthquakesResponse
    ▼
Service Layer (src/services/earthquakes.ts)
    │
    │ transforms → domain model
    ▼
App Module (src/app/data-loader.ts — orchestrator)
    │
    │ state update + render trigger
    ▼
Component (src/components/*.ts)
    │
    │ DOM manipulation via escapeHtml()
    ▼
Browser DOM
```

### H.2 Trade Policy Intelligence Flow (New in v2.5.8)

```
WTO APIs
    │
    │ fetch() with circuit breakers (30-min cache TTL, persistCache)
    ▼
Handler (server/worldmonitor/trade/v1/handler.ts)
    │
    │ 4 RPCs: getTradeRestrictions, getTariffTrends,
    │         getTradeFlows, getTradeBarriers
    ▼
src/services/trade/index.ts
    │
    │ Circuit breaker wrapped (WTO Restrictions, WTO Tariffs,
    │ WTO Flows, WTO Barriers — each with persistCache)
    │ + feature gate: isFeatureAvailable('wtoTrade')
    ▼
TradePolicyPanel (src/components/TradePolicyPanel.ts)
    ▼
Browser DOM
```

### H.3 Happy Monitor / Positive Events Flow (New in v2.5.8)

```
Multiple positive-news sources (CAF, GHI, species databases, renewables)
    │
    ▼
server/worldmonitor/giving/v1/handler.ts (getGivingSummary)
server/worldmonitor/positive-events/v1/handler.ts (listPositiveGeoEvents)
    │
    ▼
src/services/giving/ + src/services/positive-events/
    │
    ▼
HappyMonitor panels: GivingPanel, GoodThingsDigestPanel,
  HeroSpotlightPanel, PositiveNewsFeedPanel, ProgressChartsPanel,
  RenewableEnergyPanel, SpeciesComebackPanel, CountersPanel
    ▼
Browser DOM (happy.worldmonitor.app)
```

### H.4 Legacy/Direct Fetch Flow (Non-proto routes)

Some older endpoints (`api/rss-proxy.js`, `api/youtube/live.js`, etc.) use direct fetch without the proto layer:

```
Service (src/services/rss.ts)
    │
    │ fetch("/api/rss-proxy?url=...")
    ▼
Vercel Function (api/rss-proxy.js)
    │
    │ proxied fetch to external RSS feed
    ▼
Response → Service → App → Component → DOM
```

### H.5 Desktop fetch() Interception

```
Service calls fetch("/api/seismology/v1/list-earthquakes")
    │
    ▼
installRuntimeFetchPatch() intercepts
    │
    ├─ isDesktopRuntime()? ─── No ──► native fetch (Vercel)
    │
    Yes
    │
    ├─ Rewrite to http://127.0.0.1:46123/api/...
    ├─ Add Authorization: Bearer {token}
    │
    ├─ Try local sidecar (up to 4 retries)
    │   │
    │   ├─ Success? ──► return local response
    │   │
    │   └─ Failure? ──► check allowCloudFallback
    │       │
    │       ├─ /api/local-* → throw (no fallback allowed)
    │       ├─ No valid WORLDMONITOR_API_KEY → throw
    │       └─ Fallback → fetch(https://worldmonitor.app/api/...)
    │                      + X-WorldMonitor-Key header
    │
    ▼
Response returned to calling service
```

### H.6 Command Palette Flow (New in v2.5.8)

```
User presses Ctrl/Cmd+K
    │
    ▼
CommandPalettePanel (src/components/CommandPalettePanel.ts)
    │
    │ reads COMMANDS from src/config/commands.ts
    │ Fuzzy search over command.keywords
    │
    │ Command categories:
    │ • navigate — region switching (global, mena, eu, asia, etc.)
    │ • layers — toggle layer presets (military, finance, infra, intel)
    │ • panels — toggle specific panels
    │ • view — view mode switches
    │ • actions — app actions
    │ • country — jump to curated country
    ▼
App dispatches action via custom event
```

### H.7 Tauri IPC Bridge

Frontend services communicate with Rust via the Tauri bridge (`src/services/tauri-bridge.ts`):

```typescript
// Bridge resolution order:
window.__TAURI__?.core?.invoke    // Tauri 2.x
window.__TAURI_INTERNALS__?.invoke // Tauri 2.x alternate

// Usage patterns:
invokeTauri<T>(command, payload)      // throws on failure
tryInvokeTauri<T>(command, payload)   // returns null on failure
```

Used by:

- `runtime.ts` — get bearer token for sidecar auth
- `runtime-config.ts` — read/write secrets from Rust keychain
- `persistent-cache.ts` — read/write persistent cache entries
- `prediction/index.ts` — direct Polymarket fetching (special desktop command)
- `analytics.ts` — desktop analytics events

---

## I. Offline / Fallback Strategy

### I.1 PWA Service Worker (Workbox)

Configured in `vite.config.ts` via `vite-plugin-pwa`:

| Resource Type | Strategy | Cache Name | Details |
|--------------|----------|------------|---------|
| HTML navigation | **NetworkFirst** | `html-navigation` | 3s network timeout, falls back to cache |
| `/api/*` (GET + POST) | **NetworkOnly** | — | Never cached — always fresh data |
| `/ingest/*` (analytics) | **NetworkOnly** | — | PostHog events never cached |
| `/rss/*` | **NetworkOnly** | — | RSS proxy never cached |
| MapTiler tiles | **CacheFirst** | `map-tiles` | 500 entries, 30-day max age |
| CartoDB tiles | **CacheFirst** | `carto-tiles` | 500 entries, 30-day max age |
| Google Fonts CSS | **StaleWhileRevalidate** | `google-fonts-css` | 10 entries, 1-year max age |
| Google Fonts WOFF | **CacheFirst** | `google-fonts-woff` | 30 entries, 1-year max age |
| Locale files | **CacheFirst** | `locale-files` | 20 entries, 30-day max age |
| Images | **StaleWhileRevalidate** | `images` | 100 entries, 7-day max age |

**Precache**: All `*.{js,css,ico,png,svg,woff2}` except ML models (`ml*.js`, `onnx*.wasm`) and locale bundles (`locale-*.js`).

**Behavior**: `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true`

### I.2 Offline Page

`public/offline.html` is served for navigation requests when both network and cache miss.

### I.3 Circuit Breaker

`src/utils/circuit-breaker.ts` provides per-service error isolation:

- **States**: Closed → Open → Half-Open → Closed
- **Configurable**: failure threshold, cooldown period, per-breaker naming, cache TTL
- **Persistent cache (v2.5.8)**: `persistCache: true` option hydrates cached responses from IndexedDB across page reloads (24-hour stale ceiling)
- **Desktop offline mode**: Auto-detects `navigator.onLine === false` + Tauri runtime → serves stale cache without tripping breaker
- **Global registry**: `getCircuitBreakerStatus()` reports all breaker states
- **Used by**: Each external data service wraps fetch calls with circuit breakers

### I.4 Desktop Graceful Degradation

The desktop runtime provides multi-layer fallback:

1. **Local sidecar** → primary (fastest, no network for computation-only endpoints)
2. **Cloud fallback** → secondary (when sidecar fails, if API key is valid)
3. **Persistent cache** → tertiary (Rust-managed `persistent-cache.json` via IPC)
4. **PWA cache** → final (same Workbox strategy as web, for static assets)

### I.5 Desktop Feature Readiness

`src/services/desktop-readiness.ts` classifies features by locality:

| Locality Class | Description | Example |
|---------------|-------------|---------|
| `fully-local` | No network needed | Keyword monitoring, live news channel fallback |
| `api-key` | Needs API key for external service | Market data (Finnhub), conflict data (ACLED) |
| `cloud-fallback` | Falls back to cloud if local unavailable | Strategic risk scores |

### I.6 Vercel Edge Caching Headers

From `vercel.json`:

| Path | Cache Control |
|------|--------------|
| `/` and `/index.html` | `no-cache, no-store, must-revalidate` |
| `/assets/*` | `public, max-age=31536000, immutable` (1 year) |
| `/favico/*` | `public, max-age=604800` (1 week) |
| `/offline.html` | `public, max-age=86400` (1 day) |
| `/sw.js` | `public, max-age=0, must-revalidate` |
| `/manifest.webmanifest` | `public, max-age=86400` (1 day) |

---

## J. Cross-Part Dependencies

### J.1 Dependency Matrix

| Part | Depends On | Communication |
|------|-----------|---------------|
| **1. Frontend SPA** | 3 (API Gateway), 5 (Tauri Shell), 6 (Sidecar), 7 (AIS Relay), 8 (Workers), Convex | fetch, postMessage, invoke IPC |
| **2. Edge Middleware** | — (stateless) | Intercepts requests to Part 3 |
| **3. API Gateway** | 4 (Handlers), `server/router.ts`, `server/cors.ts`, `api/_api-key.js` | In-process function calls |
| **4. Server Handlers** | External APIs, proto-generated types | fetch to external services |
| **5. Tauri Rust Shell** | 6 (Sidecar), OS Keychain | Child process spawn, IPC to Part 1 |
| **6. Sidecar** | 4 (Handlers — same modules), External APIs, Cloud (fallback) | HTTP to external APIs, proxy to cloud |
| **7. AIS Relay** | AISStream.io | WebSocket upstream, HTTP/WS downstream |
| **8. Web Workers** | `@xenova/transformers` (ML), `analysis-core.ts` | postMessage to/from Part 1 |

### J.2 Shared Code

```
┌───────────────────────────────────────────────────────────┐
│  SHARED LAYERS                                             │
│                                                            │
│  ┌── Proto Definitions (proto/worldmonitor/)              │
│  │   Consumed by: Parts 1, 3, 4, 6                        │
│  │                                                         │
│  ├── Generated Client (src/generated/client/)             │
│  │   Consumed by: Part 1 (Frontend SPA)                   │
│  │                                                         │
│  ├── Generated Server (src/generated/server/)             │
│  │   Consumed by: Parts 3, 4, 6 (Gateway + Handlers)     │
│  │                                                         │
│  ├── server/router.ts                                      │
│  │   Consumed by: Parts 3, 6                               │
│  │                                                         │
│  ├── server/cors.ts                                        │
│  │   Consumed by: Part 3 (web only)                        │
│  │                                                         │
│  ├── server/error-mapper.ts                                │
│  │   Consumed by: Parts 3, 4                               │
│  │                                                         │
│  ├── server/worldmonitor/*/handler.ts                      │
│  │   Consumed by: Parts 3 (via edge), 6 (via sidecar)     │
│  │                                                         │
│  ├── api/_api-key.js                                       │
│  │   Consumed by: Part 3                                   │
│  │                                                         │
│  ├── api/_cors.js (legacy, mirrored by server/cors.ts)    │
│  │   Consumed by: Legacy Vercel functions                  │
│  │                                                         │
│  ├── src/services/analysis-core.ts                         │
│  │   Consumed by: Parts 1, 8 (analysis worker)            │
│  │                                                         │
│  └── src/config/ml-config.ts                               │
│      Consumed by: Parts 1, 8 (ML worker)                   │
└───────────────────────────────────────────────────────────┘
```

### J.3 Runtime Boundaries

| Boundary | What Crosses It | Serialization |
|----------|----------------|---------------|
| Browser ↔ Vercel Edge | HTTP Request/Response | JSON over HTTPS |
| Browser ↔ Sidecar | HTTP Request/Response | JSON over HTTP (localhost) |
| Browser ↔ Rust Shell | Tauri IPC (`invoke`) | JSON serialization via serde |
| Browser ↔ Workers | `postMessage` | Structured clone (no transfer needed for JSON-safe data) |
| Browser ↔ AIS Relay | HTTP GET / WebSocket | JSON (gzipped HTTP, raw WS frames) |
| Browser ↔ Convex | Convex client SDK | Convex value serialization |
| Sidecar ↔ External APIs | HTTP | JSON, XML (RSS), various |
| Sidecar ↔ Cloud (fallback) | HTTP proxy | Transparent pass-through |
| Rust Shell ↔ OS Keychain | `keyring` crate | String (JSON vault or individual values) |
| AIS Relay ↔ AISStream.io | WebSocket | AIS position report JSON |

### J.4 Port & Protocol Summary

| Part | Port | Protocol | Deployment |
|------|------|----------|------------|
| Frontend SPA | — | HTTPS (Vercel CDN) / tauri:// | Vercel / Tauri WebView |
| Edge Middleware | — | Vercel internal (same edge) | Vercel Edge Network |
| API Gateway | — | HTTPS (Vercel Edge Functions) | Vercel |
| Server Handlers | — | In-process (edge) / sidecar | Vercel / Sidecar |
| Tauri Rust Shell | — | IPC (Tauri bridge) | Native binary |
| Sidecar API Server | 46123 | HTTP | Local (child process) |
| AIS Relay | 3004 (local) / $PORT (Railway) | HTTP + WebSocket | Railway |
| Web Workers | — | postMessage (structured clone) | Browser threads |

---

## K. Security Hardening

### K.1 Output Sanitization

`src/utils/sanitize.ts` provides shared sanitization utilities used throughout the app:

| Function | Purpose |
|----------|---------|
| `escapeHtml(str)` | Escapes `& < > " '` → HTML entity equivalents |
| `sanitizeUrl(url)` | Validates URL protocol (http/https only), rejects javascript: etc. |
| `escapeAttr(str)` | Alias for `escapeHtml` — attribute context escaping |

**Used by**: All components rendering user/external data, settings window, live-channels window, desktop updater (update notes rendering).

### K.2 Desktop IPC Security

- **Capability model**: Tauri 2.x capabilities in `src-tauri/capabilities/` restrict which windows can invoke which IPC commands
- **Window scoping**: `default.json` limits `core:default` permissions to `main`, `settings`, and `live-channels` windows
- **YouTube OAuth**: Separate `youtube-login.json` capability for OAuth flow window
- **Bearer token auth**: Sidecar requests require a runtime-generated bearer token — prevents localhost port abuse

### K.3 CORS & Origin Validation

- Server-side CORS in `server/cors.ts` with production origin allowlist
- Edge gateway performs `isDisallowedOrigin()` check before processing
- API key validation layer (`api/_api-key.js`) for desktop-to-cloud path

### K.4 External API Security

- **Cyber domain**: `server/worldmonitor/cyber/v1/_shared.ts` includes URL validation for external threat intelligence APIs
- **RSS proxy**: URL validation before proxying to prevent SSRF-like abuse
- **IPv4 enforcement**: Sidecar patches fetch to prevent DNS rebinding via IPv6

---

## L. New in v2.5.8

Summary of integration-relevant changes from v2.5.5 → v2.5.8:

| Change | Impact |
|--------|--------|
| **App.ts decomposition** | 4,629 LOC monolith → 499 LOC shell + `src/app/` (8 modules, 4,995 LOC). Data loading, panel layout, event handling, search, country intel, desktop updates, and refresh scheduling are now separate `AppModule` classes. |
| **3 new service domains** | Trade (WTO), Giving (CAF/GHI), Positive Events — adds 20th domain to the RPC layer |
| **Happy variant** | 4th build variant (`happy`) for positive news dashboard at `happy.worldmonitor.app` (web-only, no Tauri config) |
| **Command palette** | `src/config/commands.ts` defines navigable command registry; `CommandPalettePanel` provides Ctrl+K fuzzy search |
| **Trade route visualization** | `src/config/trade-routes.ts` defines major trade routes and chokepoints; rendered as map overlay |
| **Multi-window desktop** | Settings and live-channels now open as standalone Tauri windows (not panels) |
| **Circuit breaker persistence** | `persistCache: true` option stores last-known-good responses in IndexedDB (24h stale ceiling) |
| **AIS relay improvements** | Spatial chokepoint indexing at ingest time, per-client WebSocket backpressure |
| **Sanitization layer** | `src/utils/sanitize.ts` centralizes HTML/URL/attribute escaping across components |
| **Proto expansion** | ~92 → ~109 proto files, 17 → 20 service domains |

---

*Last updated: 2025-06-10*
