# Development Guide

This guide covers everything you need to develop, build, test, and package the World Monitor project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Development Commands](#development-commands)
- [Makefile Targets](#makefile-targets)
- [Testing](#testing)
- [Proto / Sebuf Workflow](#proto--sebuf-workflow)
- [Desktop Development](#desktop-development)
- [Build Variants](#build-variants)
- [Coding Conventions](#coding-conventions)
- [Common Tasks](#common-tasks)

---

## Prerequisites

### Required

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 22+ (LTS) | Runtime for dev server, build, tests, and sidecar |
| **npm** | Ships with Node | Package management |
| **Go** | 1.21+ | Required to install buf CLI and sebuf protoc plugins |

### Required for Desktop Builds

| Tool | Version | Purpose |
|------|---------|---------|
| **Rust** | Stable (latest) | Tauri v2 native shell |
| **Tauri CLI** | 2.10+ | Installed via npm (`@tauri-apps/cli`) |

**Linux-only system dependencies** (for Tauri):

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### Optional

| Tool | Purpose |
|------|---------|
| **Vercel CLI** | Full local development with edge function emulation (`npm i -g vercel`) |
| **buf CLI** | Proto linting and code generation (installed automatically via `make install`) |
| **Playwright browsers** | E2E testing (installed automatically via `make install`) |
| **Ollama / LM Studio** | Local LLM for AI summarization features |

### Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| **macOS (ARM64 / x64)** | Full | Primary development platform |
| **Linux x86_64** | Full | Requires WebKitGTK for desktop builds |
| **Windows x64** | Full | Desktop builds via NSIS/MSI |
| **Raspberry Pi / ARM** | Partial | `vercel dev` edge emulation may not work; use static frontend mode |

---

## Quick Start

### Option 1: Full Stack (Recommended)

Requires the [Vercel CLI](https://vercel.com/docs/cli) for edge function emulation:

```bash
npm i -g vercel          # One-time: install Vercel CLI
make install             # Install buf, sebuf plugins, npm deps, Playwright browsers
cp .env.example .env.local  # Optional: add API keys for full functionality
vercel dev               # Frontend + all 60+ API edge functions on http://localhost:3000
```

### Option 2: Frontend Only

Runs Vite dev server without the API layer. News feeds and server-proxied panels won't load, but the map, static data layers, and browser-side ML models still work:

```bash
npm install
npm run dev              # Full variant on http://localhost:5173
npm run dev:tech         # Tech variant
npm run dev:finance      # Finance variant
npm run dev:happy        # Happy variant (positive news dashboard)
```

### Option 3: Desktop App

```bash
make install
npm run desktop:dev      # Launches Tauri dev window with hot-reload
```

---

## Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

**The app works without any API keys.** Panels for unconfigured services simply won't appear. Add keys incrementally for the features you need.

### AI Summarization

| Variable | Required | Free Tier | Where to Get |
|----------|----------|-----------|--------------|
| `GROQ_API_KEY` | No | 14,400 req/day | [console.groq.com](https://console.groq.com/) |
| `OPENROUTER_API_KEY` | No | 50 req/day | [openrouter.ai](https://openrouter.ai/) |

The AI pipeline uses a 4-tier fallback chain: Ollama (local) → Groq (cloud) → OpenRouter (cloud) → browser-side T5 (Transformers.js). Each tier has a 5-second timeout before falling through.

### Cross-User Cache (Upstash Redis)

| Variable | Required | Free Tier | Where to Get |
|----------|----------|-----------|--------------|
| `UPSTASH_REDIS_REST_URL` | No | 10K commands/day | [upstash.com](https://upstash.com/) |
| `UPSTASH_REDIS_REST_TOKEN` | No | — | Same dashboard |

Used to deduplicate AI calls and cache risk scores across visitors.

### Market Data

| Variable | Required | Free Tier | Where to Get |
|----------|----------|-----------|--------------|
| `FINNHUB_API_KEY` | No | Yes | [finnhub.io](https://finnhub.io/) |

### Energy & Economic Data

| Variable | Required | Free Tier | Where to Get |
|----------|----------|-----------|--------------|
| `EIA_API_KEY` | No | Yes | [eia.gov/opendata](https://www.eia.gov/opendata/) |
| `FRED_API_KEY` | No | Yes | [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) |

### Aircraft Tracking

| Variable | Required | Free Tier | Where to Get |
|----------|----------|-----------|--------------|
| `WINGBITS_API_KEY` | No | Free | [wingbits.com](https://wingbits.com/) |

### Geopolitical & OSINT Data

| Variable | Required | Free Tier | Where to Get |
|----------|----------|-----------|--------------|
| `ACLED_ACCESS_TOKEN` | No | Free for researchers | [acleddata.com](https://acleddata.com/) |
| `CLOUDFLARE_API_TOKEN` | No | Free Cloudflare account | Cloudflare Radar |
| `NASA_FIRMS_API_KEY` | No | Free | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/) |

### Railway Relay (AIS + OpenSky)

These power live vessel tracking and aircraft data via a WebSocket relay deployed separately (e.g., on Railway):

| Variable | Required | Free Tier | Where to Get |
|----------|----------|-----------|--------------|
| `AISSTREAM_API_KEY` | No | Free | [aisstream.io](https://aisstream.io/) |
| `OPENSKY_CLIENT_ID` | No | Free | [opensky-network.org](https://opensky-network.org/) |
| `OPENSKY_CLIENT_SECRET` | No | — | Same registration |
| `WS_RELAY_URL` | No | — | Your Railway deployment URL (HTTPS) |
| `VITE_WS_RELAY_URL` | No | — | Your Railway deployment URL (WSS) |

### Site Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_VARIANT` | `full` | App variant: `full`, `tech`, `finance`, or `happy` |
| `VITE_MAP_INTERACTION_MODE` | `3d` | `flat` (2D) or `3d` (pitch/rotation enabled) |
| `VITE_SENTRY_DSN` | _(empty)_ | Client-side Sentry DSN; leave empty to disable |
| `VITE_POSTHOG_KEY` | _(empty)_ | PostHog analytics key; leave empty to disable |
| `VITE_POSTHOG_HOST` | _(empty)_ | PostHog host URL |

### Desktop Cloud Fallback

| Variable | Description |
|----------|-------------|
| `WORLDMONITOR_VALID_KEYS` | Comma-separated valid API keys for desktop cloud fallback. Generate with: `openssl rand -hex 24 \| sed 's/^/wm_/'` |

### Registration Database

| Variable | Description |
|----------|-------------|
| `CONVEX_URL` | Convex deployment URL for email registration storage ([dashboard.convex.dev](https://dashboard.convex.dev/)) |

### Public Data Sources (No Keys Required)

The following data sources work without any API keys:
- **UCDP** (Uppsala Conflict Data Program)
- **UNHCR** (UN Refugee Agency, CC BY 4.0)
- **Open-Meteo** (Copernicus ERA5 climate data)
- **WorldPop** (population density; optional key for higher rate limits)

---

## Development Commands

### Dev Servers

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server — full variant (http://localhost:5173) |
| `npm run dev:tech` | Start Vite dev server — tech variant |
| `npm run dev:finance` | Start Vite dev server — finance variant |
| `npm run dev:happy` | Start Vite dev server — happy variant (positive news) |
| `npm run preview` | Preview production build locally |
| `npm run desktop:dev` | Launch Tauri desktop dev window with hot-reload |

> **Tip:** For full API functionality use `vercel dev` instead of `npm run dev`. The Vercel CLI emulates the edge runtime so all `api/` endpoints work.

### Builds

| Command | Description |
|---------|-------------|
| `npm run build` | Production build (full variant) — runs `tsc` then `vite build` |
| `npm run build:full` | Explicit full variant build |
| `npm run build:tech` | Tech variant build |
| `npm run build:finance` | Finance variant build |
| `npm run build:happy` | Happy variant build |
| `npm run build:desktop` | Desktop build (sidecar sebuf bundle + tsc + vite build) |
| `npm run build:sidecar-sebuf` | Bundle the sebuf RPC gateway for the Tauri sidecar |

### Testing

| Command | Description |
|---------|-------------|
| `npm run test:data` | Run data integrity tests (`node --test tests/*.test.mjs`) |
| `npm run test:sidecar` | Run sidecar + CORS + YouTube embed tests |
| `npm run test:e2e` | Run all E2E suites (runtime → full → tech → finance) |
| `npm run test:e2e:full` | E2E tests — full variant only |
| `npm run test:e2e:tech` | E2E tests — tech variant only |
| `npm run test:e2e:finance` | E2E tests — finance variant only |
| `npm run test:e2e:runtime` | E2E tests — runtime fetch only |
| `npm run test:e2e:visual` | Run visual regression tests (full + tech) |
| `npm run test:e2e:visual:full` | Visual regression — full variant only |
| `npm run test:e2e:visual:tech` | Visual regression — tech variant only |
| `npm run test:e2e:visual:update` | Update visual regression golden screenshots |
| `npm run test:e2e:visual:update:full` | Update golden screenshots — full variant |
| `npm run test:e2e:visual:update:tech` | Update golden screenshots — tech variant |

### Desktop Packaging

| Command | Description |
|---------|-------------|
| `npm run desktop:build:full` | Build desktop app — full variant |
| `npm run desktop:build:tech` | Build desktop app — tech variant |
| `npm run desktop:build:finance` | Build desktop app — finance variant |
| `npm run desktop:package` | Generic packaging runner (see `--help` for options) |
| `npm run desktop:package:macos:full` | Package macOS `.app` + `.dmg` — full variant |
| `npm run desktop:package:macos:tech` | Package macOS `.app` + `.dmg` — tech variant |
| `npm run desktop:package:windows:full` | Package Windows `.exe` + `.msi` — full variant |
| `npm run desktop:package:windows:tech` | Package Windows `.exe` + `.msi` — tech variant |
| `npm run desktop:package:macos:full:sign` | Signed macOS package — full variant |
| `npm run desktop:package:macos:tech:sign` | Signed macOS package — tech variant |
| `npm run desktop:package:windows:full:sign` | Signed Windows package — full variant |
| `npm run desktop:package:windows:tech:sign` | Signed Windows package — tech variant |

### Quality & Utilities

| Command | Description |
|---------|-------------|
| `npm run typecheck` | Run `tsc --noEmit` type checking |
| `npm run lint:md` | Lint all Markdown files with markdownlint-cli2 |
| `npm run version:sync` | Sync version from `package.json` to `tauri.conf.json` and `Cargo.toml` |
| `npm run version:check` | Verify versions are in sync (CI check) |

---

## Makefile Targets

Run `make help` to see all targets. The Makefile manages proto tooling and code generation:

| Target | Description |
|--------|-------------|
| `make install` | Install everything: buf CLI, sebuf plugins, npm deps, Playwright browsers, proto deps |
| `make install-buf` | Install buf CLI (requires Go) |
| `make install-plugins` | Install sebuf protoc-gen plugins (`protoc-gen-ts-client`, `protoc-gen-ts-server`, `protoc-gen-openapiv3`) |
| `make install-npm` | Install npm dependencies |
| `make install-playwright` | Install Playwright Chromium browser for E2E tests |
| `make deps` | Install/update buf proto dependencies |
| `make lint` | Lint protobuf files with buf |
| `make generate` | Clean and regenerate TypeScript + OpenAPI code from proto definitions |
| `make breaking` | Check for breaking proto changes against the `main` branch |
| `make format` | Auto-format protobuf files |
| `make check` | Run lint + generate in one step |
| `make clean` | Remove all generated files (`src/generated/client/`, `src/generated/server/`, `docs/api/`) |

### Tool Versions

The Makefile pins these tool versions:

- **buf CLI**: v1.64.0
- **sebuf plugins**: v0.7.0

---

## Testing

### Data Integrity Tests

```bash
npm run test:data
```

Runs `node --test` on `tests/*.test.mjs`. These validate static JSON datasets (country GeoJSON, deploy configs, Gulf FDI data, etc.).

### Sidecar & API Tests

```bash
npm run test:sidecar
```

Tests the Tauri sidecar local API server, CORS configuration, YouTube embed proxy, cyber threats endpoint, and USNI fleet endpoint.

### E2E Tests (Playwright)

```bash
npm run test:e2e          # All variants sequentially
npm run test:e2e:full     # Single variant
```

**Configuration** (from `playwright.config.ts`):

- **Test directory:** `e2e/`
- **Workers:** 1 (sequential — map rendering requires single-thread)
- **Timeout:** 90 seconds per test, 30 seconds for assertions
- **Browser:** Chromium with SwiftShader (software-rendered WebGL for CI)
- **Viewport:** 1280×720, dark color scheme, `en-US` locale, UTC timezone
- **Base URL:** `http://127.0.0.1:4173`
- **Artifacts on failure:** trace, screenshot, video (all `retain-on-failure`)
- **Web server:** Vite dev server started automatically with `VITE_E2E=1` flag
- **Retries:** 0

### Visual Regression Tests

```bash
npm run test:e2e:visual           # Run visual comparison (full + tech)
npm run test:e2e:visual:update    # Update golden screenshots
```

Visual tests match golden screenshots per map layer and zoom level. Snapshot template: `{testDir}/{testFileName}-snapshots/{arg}{ext}`.

### Proto Breaking Change Detection

```bash
make breaking
```

Compares current proto definitions against the `main` branch to detect backwards-incompatible changes. Run this before pushing proto changes.

---

## Proto / Sebuf Workflow

Sebuf is the project's custom Proto-first HTTP RPC framework. All JSON API communication uses Sebuf — never create standalone `api/*.js` files for JSON endpoints.

### How It Works

1. **Proto definitions** in `proto/worldmonitor/{domain}/v1/` define services and messages
2. **Code generation** (`make generate`) produces:
   - TypeScript clients in `src/generated/client/` (e.g., `MarketServiceClient`)
   - Server route factories in `src/generated/server/` (e.g., `createMarketServiceRoutes`)
   - OpenAPI v3 specs in `docs/api/` (YAML + JSON)
3. **Handlers** in `server/worldmonitor/{domain}/v1/handler.ts` implement the service interface
4. **Gateway** in `api/[domain]/v1/[rpc].ts` registers all handlers and routes requests
5. **Clients** in `src/services/{domain}/index.ts` wrap the generated client for app use

### Adding a New RPC

See [ADDING_ENDPOINTS.md](ADDING_ENDPOINTS.md) for the full step-by-step guide with examples. The short version:

1. Add the RPC + messages to the `.proto` service definition
2. `make check` (lint + generate)
3. Implement the handler in `server/worldmonitor/{domain}/v1/`
4. Wire it into the domain's `handler.ts`
5. `npx tsc --noEmit` — the compiler enforces the contract

### Adding a New Service (New Domain)

1. Create `proto/worldmonitor/{domain}/v1/` with message and service protos
2. `make check`
3. Implement handlers in `server/worldmonitor/{domain}/v1/`
4. Register in `api/[domain]/v1/[rpc].ts` (gateway)
5. Register in `vite.config.ts` (local dev server)
6. Create frontend service wrapper in `src/services/{domain}/`

### Proto Conventions

- **File naming:** `snake_case` — one file per message (`earthquake.proto`), one per RPC pair (`list_earthquakes.proto`), one `service.proto`
- **Time fields:** `int64` with Unix epoch ms, annotated with `INT64_ENCODING_NUMBER`
- **Validation:** Use `buf.validate` annotations (constraints flow to OpenAPI automatically)
- **HTTP annotations:** Every RPC needs `option (sebuf.http.config) = { path: "...", method: POST }`
- **Route paths:** Service base path `/api/{domain}/v1`, RPC path `/{verb}-{noun}` in kebab-case
- **Comments:** Required on all proto elements — buf lint enforces this
- **Shared types:** Reuse `core/v1/` types (`GeoCoordinates`, `BoundingBox`, `TimeRange`, `PaginationRequest/Response`)

### Proto Codegen Requirements

Requires Go 1.21+ for the buf CLI and sebuf plugins:

```bash
make install          # Install everything
make install-buf      # Just buf CLI
make install-plugins  # Just sebuf protoc-gen plugins
```

---

## Desktop Development

World Monitor ships as a native desktop app via **Tauri v2** (Rust) with a **Node.js sidecar** for the API layer.

### Setup

```bash
# Prerequisites: Rust stable toolchain
rustup update stable

# Install project dependencies
make install

# Start desktop dev mode (hot-reload frontend + sidecar)
npm run desktop:dev
```

The `desktop:dev` command:
1. Syncs version from `package.json` to `tauri.conf.json` and `Cargo.toml`
2. Sets `VITE_DESKTOP_RUNTIME=1`
3. Builds the sidecar sebuf bundle
4. Launches Tauri with Vite dev server on `http://localhost:5173`

### Sidecar

The desktop app embeds a bundled Node.js runtime (`scripts/download-node.sh`) that runs the sebuf RPC gateway locally. The sidecar bundle is built with:

```bash
npm run build:sidecar-sebuf
```

This uses esbuild to compile `api/[domain]/v1/[rpc].ts` into a single ESM bundle that the sidecar's `buildRouteTable()` can discover and load.

### Node.js Runtime Bundling

For release builds, a platform-specific Node.js binary is downloaded and embedded:

```bash
bash scripts/download-node.sh --target aarch64-apple-darwin
```

Supported targets:
- `x86_64-pc-windows-msvc`
- `x86_64-apple-darwin`
- `aarch64-apple-darwin`
- `x86_64-unknown-linux-gnu`

The bundled Node.js version is **22.14.0** (configurable via `NODE_VERSION` env var).

### Packaging

```bash
# Generic runner with all options
npm run desktop:package -- --os <macos|windows|linux> --variant <full|tech> [--sign] [--skip-node-runtime]

# Platform-specific shortcuts
npm run desktop:package:macos:full        # .app + .dmg
npm run desktop:package:windows:full      # .exe + .msi (NSIS)
npm run desktop:package:macos:full:sign   # Signed .app + .dmg
```

The packaging script (`scripts/desktop-package.mjs`):
1. Syncs versions across `package.json`, `tauri.conf.json`, `Cargo.toml`
2. Downloads the platform-specific Node.js runtime
3. Runs `tauri build` with the appropriate variant config and bundle types

**Bundle types by OS:**
- macOS: `.app` + `.dmg`
- Windows: `.exe` (NSIS) + `.msi`
- Linux: `.AppImage`

### Code Signing

**macOS** requires:
- `TAURI_BUNDLE_MACOS_SIGNING_IDENTITY` (or `APPLE_SIGNING_IDENTITY`)
- `TAURI_BUNDLE_MACOS_PROVIDER_SHORT_NAME`
- Apple Developer Certificate imported into keychain

**Windows** requires one of:
- `TAURI_BUNDLE_WINDOWS_CERTIFICATE_THUMBPRINT`
- `TAURI_BUNDLE_WINDOWS_CERTIFICATE` + `TAURI_BUNDLE_WINDOWS_CERTIFICATE_PASSWORD`

### Variant-Specific Desktop Configs

| Variant | Config File | Product Name | Identifier |
|---------|-------------|--------------|------------|
| `full` | `src-tauri/tauri.conf.json` | World Monitor | `app.worldmonitor.desktop` |
| `tech` | `src-tauri/tauri.tech.conf.json` | Tech Monitor | _(see config)_ |
| `finance` | `src-tauri/tauri.finance.conf.json` | Finance Monitor | _(see config)_ |

### CI Build Matrix

The GitHub Actions workflow (`.github/workflows/build-desktop.yml`) builds for four platforms:

| Platform | Runner | Target |
|----------|--------|--------|
| macOS ARM64 | `macos-14` | `aarch64-apple-darwin` |
| macOS x64 | `macos-latest` | `x86_64-apple-darwin` |
| Windows x64 | `windows-latest` | `x86_64-pc-windows-msvc` |
| Linux x64 | `ubuntu-22.04` | `x86_64-unknown-linux-gnu` |

Triggered by: `v*` tags (automatic) or manual workflow dispatch with variant selection.

---

## Build Variants

The codebase produces three app variants from the same source, each targeting a different audience:

| Variant | Dev Command | Build Command | Domain | Focus |
|---------|-------------|---------------|--------|-------|
| `full` | `npm run dev` | `npm run build:full` | worldmonitor.app | Geopolitics, military, conflicts, infrastructure |
| `tech` | `npm run dev:tech` | `npm run build:tech` | tech.worldmonitor.app | Startups, AI/ML, cloud, cybersecurity |
| `finance` | `npm run dev:finance` | `npm run build:finance` | finance.worldmonitor.app | Markets, trading, central banks, commodities |

### How Variants Work

1. **Build-time selection** — Set via `VITE_VARIANT` environment variable (defaults to `full`)
2. **Runtime selection** — In the desktop app, `localStorage['worldmonitor-variant']` overrides the build-time value. The web app uses a variant selector in the header to navigate between deployed domains
3. **Variant configs** live in `src/config/variants/`:
   - `base.ts` — shared configuration
   - `full.ts` — full variant overrides
   - `tech.ts` — tech variant overrides
   - `finance.ts` — finance variant overrides
4. **Resolution logic** in `src/config/variant.ts`:
   - Check `localStorage` for stored variant
   - Fall back to `import.meta.env.VITE_VARIANT`
   - Default to `full`

### What Variants Control

Variants share all source code but differ in:
- Default visible panels
- Map layers and data sources highlighted
- RSS feed selection and categorization
- PWA metadata (title, description, icons, keywords)
- SEO/Open Graph metadata

### E2E Testing Per Variant

Each variant has its own E2E suite:

```bash
npm run test:e2e:full
npm run test:e2e:tech
npm run test:e2e:finance
```

---

## Coding Conventions

### Language & Framework

- **Vanilla TypeScript** — no UI framework (React, Vue, etc.)
- **Vite** as build tool
- **MapLibre GL + deck.gl** for map rendering
- **d3** for charts and data visualization

### TypeScript Standards

- Use TypeScript for all new code
- Avoid `any` types — use proper typing or `unknown` with type guards
- Export interfaces/types for public APIs
- Use meaningful variable and function names
- `const` by default, `let` when reassignment is needed

### Code Style

- Follow existing patterns in the repository
- Prefer functional patterns (`map`, `filter`, `reduce`) over imperative loops
- Keep functions focused — single responsibility
- Add JSDoc comments for exported functions and complex logic

### File Organization

| Content | Location |
|---------|----------|
| UI components (panels, map, modals) | `src/components/` |
| Data fetching, client wrappers | `src/services/` |
| Static data, variant configs, geo data | `src/config/` |
| Auto-generated sebuf stubs (**do not edit**) | `src/generated/` |
| TypeScript type definitions | `src/types/` |
| i18n strings (16 languages) | `src/locales/` |
| Web Workers | `src/workers/` |
| Sebuf handler implementations | `server/worldmonitor/{domain}/v1/` |
| Vercel Edge Functions (gateway + legacy) | `api/` |
| Proto service/message definitions | `proto/worldmonitor/{domain}/v1/` |
| Static JSON datasets | `data/` |
| Documentation + generated OpenAPI specs | `docs/` |
| Tauri v2 Rust app + Node.js sidecar | `src-tauri/` |
| Playwright E2E tests | `e2e/` |
| Build and packaging scripts | `scripts/` |

### Naming Conventions

- **Proto files:** `snake_case.proto` (one file per message or RPC pair)
- **Handler files:** `kebab-case.ts` (e.g., `list-earthquakes.ts`, `get-earthquake-details.ts`)
- **Component files:** `PascalCase.ts` (e.g., `MarketPanel.ts`, `LiveNewsPanel.ts`)
- **Service files:** `kebab-case` or `index.ts` in domain directories
- **Config files:** `kebab-case.ts` (e.g., `finance-geo.ts`, `startup-ecosystems.ts`)

### Import Conventions

- Use `@/` path alias for `src/` imports (configured in `tsconfig.json`)
- Generated client imports: `@/generated/client/worldmonitor/{domain}/v1/service_client`
- Generated server imports: `../../../../src/generated/server/worldmonitor/{domain}/v1/service_server`

### PR Title Convention

```
feat: add earthquake magnitude filtering to map layer
fix: resolve RSS feed timeout for Al Jazeera
docs: update API dependencies section
perf: optimize marker clustering at low zoom levels
refactor: extract threat classifier into separate module
```

---

## Common Tasks

### Adding a New Panel

1. Create `src/components/YourPanel.ts` extending the `Panel` base class
2. Implement the data fetching logic (typically via a service in `src/services/`)
3. Register the panel in `src/config/panels.ts`
4. Add variant visibility in the appropriate files under `src/config/variants/`
5. If the panel needs server data, follow the sebuf workflow to create the backend endpoint first

### Adding a New Data Source

1. **Define the data source** — identify the API or dataset
2. **Add the proto service** (for backend-proxied data) — define messages and RPCs in `proto/worldmonitor/{domain}/v1/`
3. **Generate stubs** — `make generate`
4. **Implement the handler** in `server/worldmonitor/{domain}/v1/`
5. **Register** in the gateway (`api/[domain]/v1/[rpc].ts`) and `vite.config.ts` (dev server)
6. **Create the service module** in `src/services/{domain}/` wrapping the generated client
7. **Add the layer config** and map renderer following existing patterns
8. **Add to layer toggles** in the UI
9. **Document** in `docs/DOCUMENTATION.md`

**Data source requirements:**
- Freely accessible (no paid-only APIs for core functionality)
- Permissive license or public government data
- Updates at least daily for real-time relevance
- Includes geographic coordinates or is geo-locatable

For non-JSON payloads (XML feeds, binary data, HTML embeds), add a standalone Edge Function in `api/` instead of Sebuf. For anything returning JSON, always prefer Sebuf.

### Adding a New RSS Feed

1. Verify the feed is reliable and actively maintained
2. Assign a **source tier** (1–4) based on editorial reliability
3. Flag any **state affiliation** or **propaganda risk**
4. Categorize the feed (geopolitics, defense, energy, tech, etc.)
5. Add the feed configuration to `src/config/feeds.ts`
6. Test that the feed parses correctly through the RSS proxy

### Adding a New Map Layer

1. Define the data source (see "Adding a New Data Source" above)
2. Create the layer renderer following existing deck.gl or MapLibre patterns in `src/components/`
3. Add layer configuration in `src/config/` (e.g., `src/config/geo.ts` or a new domain-specific config file)
4. Wire the layer into variant configs under `src/config/variants/`
5. Add a toggle control to the layer menu

### Adding a New Proto Service (End-to-End)

Follow the detailed guide in [ADDING_ENDPOINTS.md](ADDING_ENDPOINTS.md), which covers:

1. Creating the proto directory and message files
2. Defining the service with HTTP annotations
3. Running `make check` (lint + generate)
4. Implementing handlers
5. Registering in the gateway and Vite dev server
6. Creating the frontend service wrapper
7. Verifying with `npx tsc --noEmit`

---

## Scripts Reference

The `scripts/` directory contains build and operational utilities:

| Script | Description |
|--------|-------------|
| `ais-relay.cjs` | AIS WebSocket relay server — proxies aisstream.io vessel data to browsers. Deploy on Railway with `AISSTREAM_API_KEY` set. Also handles OpenSky aircraft data. |
| `build-sidecar-sebuf.mjs` | Compiles the sebuf RPC gateway into a single ESM bundle for the Tauri sidecar using esbuild (Node 18 target, tree-shaken). |
| `desktop-package.mjs` | Unified desktop packaging runner. Handles version sync, Node.js runtime download, and `tauri build` invocation for all OS/variant/signing combinations. |
| `download-node.sh` | Downloads platform-specific Node.js binary (v22.14.0) for embedding in the Tauri sidecar. Supports auto-detection and explicit `--target` triple. |
| `sync-desktop-version.mjs` | Syncs `version` field from `package.json` to `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`. Supports `--check` mode for CI verification. |
| `package.json` | Declares the `ais-relay` package (Node ≥18, ws dependency) for standalone Railway deployment. |

---

## Further Reading

- [ADDING_ENDPOINTS.md](ADDING_ENDPOINTS.md) — Step-by-step guide for new sebuf RPCs and services
- [DOCUMENTATION.md](DOCUMENTATION.md) — API dependencies and full feature documentation
- [RELEASE_PACKAGING.md](RELEASE_PACKAGING.md) — Desktop release details, signing hooks, and clean-machine validation
- [architecture.md](architecture.md) — System architecture overview
- [api-contracts.md](api-contracts.md) — API contract specifications
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Contribution guidelines, PR process, and AI-assisted development policy
