# World Monitor — Architecture Document

**Version**: 2.5.5 | **Last Updated**: 2026-02-23

## 1. Executive Summary

World Monitor is a multi-part monolith delivering a real-time global intelligence dashboard. The architecture is designed around a **proto-first RPC API layer** (sebuf) that serves both a **web SPA** (Vercel) and a **desktop application** (Tauri) from a single codebase. The frontend is a framework-free TypeScript SPA with WebGL-accelerated 3D globe rendering (deck.gl), client-side ML inference (ONNX), and progressive offline support (PWA).

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Web Browser   │  │ Web Browser  │  │ Tauri Desktop App     │  │
│  │ (full)        │  │ (tech/       │  │ ┌─────────────────┐   │  │
│  │               │  │  finance)    │  │ │ WebView (SPA)   │   │  │
│  │               │  │              │  │ │ + Rust Backend   │   │  │
│  │               │  │              │  │ │ + Node Sidecar   │   │  │
│  └──────┬───────┘  └──────┬───────┘  │ └────────┬────────┘   │  │
│         │                  │          └──────────┼────────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────┐    ┌────────────────────────┐
│       VERCEL EDGE NETWORK       │    │   LOCAL SIDECAR        │
│  ┌──────────────────────────┐   │    │   (port 46123)         │
│  │ middleware.ts             │   │    │  ┌──────────────────┐  │
│  │ Bot blocking + allowlist  │   │    │  │ Node.js HTTP     │  │
│  └──────────┬───────────────┘   │    │  │ Session-token auth│  │
│             ▼                   │    │  │ Loads api/*.js    │  │
│  ┌──────────────────────────┐   │    │  │ + sebuf handlers  │  │
│  │ api/[domain]/v1/[rpc].ts │   │    │  │ Cloud fallback    │  │
│  │ Sebuf RPC Gateway        │   │    │  └──────────────────┘  │
│  │ (Edge Function)          │   │    └────────────────────────┘
│  └──────────┬───────────────┘   │
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ server/router.ts          │   │
│  │ Static route map          │   │
│  │ 17 domain handlers        │   │
│  └──────────┬───────────────┘   │
│             ▼                   │
│  ┌──────────────────────────┐   │
│  │ api/*.js                  │   │
│  │ Legacy REST endpoints     │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│      EXTERNAL DATA SOURCES       │
│  USGS · NASA · ACLED · GDELT    │
│  Finnhub · FRED · EIA · Yahoo   │
│  OpenSky · AISStream · NGA      │
│  CoinGecko · Polymarket         │
│  Groq/OpenRouter AI · abuse.ch  │
│  UNHCR · WorldPop · Cloudflare  │
│  30+ RSS feeds                   │
└─────────────────────────────────┘

┌────────────────────┐  ┌─────────────────┐
│  UPSTASH REDIS     │  │  CONVEX          │
│  AI call dedup     │  │  Email           │
│  Risk score cache  │  │  registration    │
│  Temporal baselines│  │                  │
└────────────────────┘  └─────────────────┘

┌────────────────────┐
│  AIS RELAY         │
│  (Railway)         │
│  WebSocket fanout  │
│  Vessel state      │
│  Chokepoint monitor│
└────────────────────┘
```

## 3. Frontend Architecture

### 3.1 Component System

No frontend framework. Pure TypeScript class-based components with direct DOM manipulation. `App.ts` (4,629 lines) is the central orchestrator — it owns the component lifecycle, event routing, and panel management.

**Component categories (52 files, 22,883 lines):**

| Category | Count | Key Components |
|----------|-------|---------------|
| Map | 3 | `DeckGLMap` (3,905 LOC), `Map` (3,513), `MapPopup` (2,549) |
| Panel | 15 | `NewsPanel`, `MarketPanel`, `CryptoPanel`, `CIIPanel`, `LiveNewsPanel`, `InvestmentsPanel`, `StablecoinPanel`, etc. |
| Layout | 5 | `MapContainer`, `ResponsiveMapLayout`, `MobileBottomSheet` |
| Modal | 4 | `SearchModal`, `CountryBriefPage`, `StoryShareModal` |
| Widget | 10 | `VirtualList`, `FloatingActionButton`, `BetaBanner`, `Sparkline` |
| Feed | 5 | `RSSTicker`, `BreakingNewsBanner`, `LiveWebcamsPanel` |
| Visualization | 5 | `GlobeView`, `ConflictHeatmap`, `TemporalChart` |
| Utility | 5 | `SentryInit`, `ThemeToggle`, `LanguagePicker` |

### 3.2 Service Layer

79 service modules (20,276 lines) organized by domain. Each service encapsulates data fetching, transformation, and caching for its domain. Services communicate via:

- **Direct import** — services call other services
- **Event system** — `App.ts` dispatches events, services/components listen
- **Shared state** — singleton pattern, mutable module-level state

**Key service categories:**

| Category | Services | Purpose |
|----------|----------|---------|
| Data Fetching | `rss.ts`, `market-data.ts`, `earthquake.ts` | Fetch and transform external data |
| Intelligence | `country-instability-index.ts`, `signal-aggregator.ts`, `geo-convergence.ts` | Multi-source analysis |
| ML/AI | `ml-worker.ts`, `analysis-core.ts`, `clustering.ts` | Worker dispatch, inference |
| Tracking | `conflict-tracking.ts`, `displacement.ts`, `wildfire-tracking.ts` | Domain-specific monitors |
| Storage | `storage.ts`, `persistent-cache.ts`, `snapshot-history.ts` | IndexedDB + localStorage |
| Map | `map-data-sources.ts`, `deck-layer-factory.ts` | Map layer management |

### 3.3 Variant System

Three product variants from one codebase, selected at build-time via `VITE_VARIANT`:

| Variant | Focus | Unique Panels | Map Layers |
|---------|-------|---------------|------------|
| `full` | Geopolitical OSINT | Military, Conflicts, Displacement | Bases, conflict zones, nuclear sites |
| `tech` | Tech ecosystem | AI Research, Startup Hubs, Tech Events | Cloud regions, AI datacenters, accelerators |
| `finance` | Markets & economics | Investments, Stablecoins, ETF Flows | Exchanges, financial centers, commodity hubs |

Vite's tree-shaking eliminates unused variant data in production builds. Runtime variant detection: `localStorage → VITE_VARIANT → 'full'`.

### 3.4 Web Worker Architecture

| Worker | File | Purpose | Why Off-Thread |
|--------|------|---------|---------------|
| ML Worker | `src/workers/ml.worker.ts` | ONNX model inference (embeddings, sentiment, summarization, NER) | CPU-bound ONNX — would block UI at 60fps |
| Analysis Worker | `src/workers/analysis.worker.ts` | O(n²) news clustering, cross-source correlation | Quadratic complexity on 100s of items |

ML models loaded on-demand from HuggingFace CDN. 200MB memory budget. WASM backend.

### 3.5 State Management

No state management framework. Instead:

| Mechanism | Usage |
|-----------|-------|
| **localStorage** | ~30+ keys for user preferences, panel config, theme, feature flags, cached scores |
| **IndexedDB** | 2 databases — historical snapshots (timestamped state), persistent cache (TTL-based) |
| **Module singletons** | Services are singleton modules with mutable state (arrays, Maps, Sets) |
| **Event dispatch** | `App.ts` acts as event bus; components fire CustomEvents; services expose callbacks |

### 3.6 Dual Rendering

| Platform | Renderer | Features |
|----------|----------|----------|
| Desktop/High-end | deck.gl + MapLibre GL | WebGL 3D globe, animated arcs, heatmaps, extruded hexagons |
| Mobile/Low-end | D3.js + SVG | Simplified 2D map, touch-optimized, bottom sheet panels |

## 4. API Architecture

### 4.1 Sebuf RPC Layer

**Proto-first RPC** — `.proto` definitions are the source of truth. Code generation produces typed TypeScript clients (for SPA) and server route descriptors (for handlers).

```
proto/worldmonitor/{domain}/v1/*.proto
       │
       ▼  (buf generate)
src/generated/client/{domain}/  ← Typed fetch-based RPC clients
src/generated/server/{domain}/  ← Route descriptors + type definitions
docs/api/{Domain}Service.openapi.yaml ← OpenAPI specs
       │
       ▼  (runtime)
server/worldmonitor/{domain}/   ← Handler implementations
       │
       ▼  (routing)
server/router.ts                ← Static Map<path, handler>
       │
       ▼  (gateway)
api/[domain]/v1/[rpc].ts       ← Vercel Edge catch-all
```

**17 service domains, 46 RPCs, all POST-based JSON over HTTP.**

### 4.2 Legacy REST API

11 Vercel serverless functions for non-domain operations:

| Endpoint | Purpose |
|----------|---------|
| `/api/rss-proxy` | CORS-free RSS feed proxying |
| `/api/story`, `/api/og-story` | Story sharing + OG image generation |
| `/api/download` | GitHub release redirect |
| `/api/register-interest` | Email registration (Convex) |
| `/api/version` | Version check |
| `/api/youtube/live`, `/api/youtube/embed` | YouTube stream detection |
| `/api/eia/[[...path]]` | EIA energy data proxy |

### 4.3 Shared Infrastructure

| Component | Purpose |
|-----------|---------|
| **Upstash Redis** | Cross-user AI call deduplication, risk score cache, temporal baseline storage |
| **CORS middleware** | Origin allowlist (api/_cors.js) |
| **API key auth** | Desktop app authentication (api/_api-key.js) |
| **Error mapper** | Standardized error codes (server/error-mapper.ts) |

## 5. Desktop Architecture (Tauri)

```
┌──────────────────────────────────────┐
│          Tauri Desktop App            │
│  ┌──────────────┐ ┌──────────────┐   │
│  │ WebView      │ │ Rust Backend │   │
│  │ (SPA)        │ │ main.rs      │   │
│  │              │ │ - Keychain   │   │
│  │              │ │ - Sidecar    │   │
│  │              │ │   lifecycle  │   │
│  │              │ │ - Cache      │   │
│  │              │ │ - Settings   │   │
│  │              │ │   window     │   │
│  └──────┬───────┘ └──────┬───────┘   │
│         │                │            │
│         ▼                ▼            │
│  ┌──────────────────────────────┐    │
│  │ Node.js Sidecar (port 46123) │    │
│  │ local-api-server.mjs         │    │
│  │ - Loads all api/*.js handlers │    │
│  │ - Sebuf handler routing       │    │
│  │ - Session-token auth          │    │
│  │ - Cloud fallback on failure   │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

**Secret management**: OS Keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) via `keyring` crate. Consolidated vault with 21 secret keys.

**Build variants**: Three `tauri.*.conf.json` files for full/tech/finance — different window titles, bundle identifiers, and feature flags.

## 6. Proto / Code Generation

### Pipeline

```bash
make generate
# 1. buf lint proto/    — lint .proto files
# 2. buf generate proto/ — run 4 plugins:
#    - protoc-gen-ts-client  → src/generated/client/
#    - protoc-gen-ts-server  → src/generated/server/
#    - protoc-gen-openapiv3  → docs/api/*.yaml
#    - protoc-gen-openapiv3  → docs/api/*.json
```

### Conventions

- All RPCs are **POST** with JSON request/response bodies
- Route pattern: `/api/{domain}/v1/{rpc-name}` (kebab-case)
- Breaking change detection: `buf breaking` with FILE + PACKAGE + WIRE_JSON rules
- Enum zero values: `*_UNSPECIFIED` suffix
- Service naming: `*Service` suffix

## 7. Testing Strategy

| Level | Framework | Location | Coverage |
|-------|-----------|----------|----------|
| E2E | Playwright (Chromium + SwiftShader) | `e2e/` | 5 spec files — map rendering, investments panel, keyword spike flow, mobile popup, runtime fetch |
| Unit (data) | Node.js `node --test` | `tests/` | GeoJSON validation, deploy config, Gulf FDI data, server handler routing |
| Unit (API) | Node.js `node --test` | `api/*.test.mjs` | CORS middleware, OG story generation |
| Unit (sidecar) | Node.js `node --test` | `src-tauri/sidecar/*.test.mjs` | Local API server handler loading |
| Proto | buf breaking | `proto/` | Breaking change prevention |

## 8. Deployment Architecture

| Target | Platform | Build | Trigger |
|--------|----------|-------|---------|
| Web (full) | Vercel | `vite build` | Git push |
| Web (tech) | Vercel | `VITE_VARIANT=tech vite build` | Git push |
| Web (finance) | Vercel | `VITE_VARIANT=finance vite build` | Git push |
| Desktop (4 platforms × 3 variants) | GitHub Releases | Tauri build | Tag `v*` |
| AIS Relay | Railway | Direct deploy | Manual |
| Convex | Convex Cloud | `npx convex deploy` | Manual |

### Vercel Configuration

- Framework: Vite
- Build: `vite build`
- Edge Middleware: `middleware.ts` (bot blocking)
- Serverless functions: `api/*.js` (Node.js) + `api/[domain]/v1/[rpc].ts` (Edge)
- Headers: Cache-control, CORS, security headers

## 9. Security

| Area | Implementation |
|------|---------------|
| **API Keys** | Optional per-source; validated via `api/_api-key.js`; desktop stores in OS keychain |
| **CORS** | Origin allowlist in `api/_cors.js` (worldmonitor.app, localhost, tauri) |
| **Bot Blocking** | Edge middleware blocks scrapers; allows social preview bots for OG routes |
| **Desktop Auth** | Sidecar uses session-token (random per launch); Rust backend manages lifecycle |
| **Supply Chain** | Minimal npm deps (20 runtime); Dependabot; AGPL license |
| **Rate Limiting** | Upstash Redis deduplication for AI calls; external API rate limit awareness |
