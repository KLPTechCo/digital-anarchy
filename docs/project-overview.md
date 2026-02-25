# World Monitor — Project Overview

**Version**: 2.5.5 | **License**: AGPL-3.0-only | **Last Updated**: 2026-02-23

## Executive Summary

World Monitor is a **real-time global intelligence dashboard** — an AI-powered news aggregation, geopolitical monitoring, and infrastructure tracking platform delivered through a unified situational awareness interface. It presents live data from 35+ external sources across geopolitical, military, economic, climate, cyber, and infrastructure domains on an interactive 3D globe with deck.gl/WebGL rendering.

**Live deployments:**

| Variant | URL | Focus |
|---------|-----|-------|
| Full | [worldmonitor.app](https://worldmonitor.app) | Geopolitical intelligence, military, OSINT |
| Tech | [tech.worldmonitor.app](https://tech.worldmonitor.app) | AI industry, startups, tech ecosystem |
| Finance | [finance.worldmonitor.app](https://finance.worldmonitor.app) | Markets, trading, economic indicators |

A **Tauri 2.x desktop application** packages the same SPA with a local Node.js API sidecar, OS keychain integration, and offline support for macOS, Windows, and Linux.

## Repository Type

**Multi-Part Monolith** — a single codebase producing 5 distinct deployment artifacts. All parts share the same `node_modules`, `tsconfig.json`, and build pipeline. There are no independent package versions or workspace configurations.

## Project Parts

| # | Part | Path | Type | Primary Tech |
|---|------|------|------|-------------|
| 1 | Frontend SPA | `src/` | Web | TypeScript, Vite 6, MapLibre GL, deck.gl, D3.js |
| 2 | Vercel Serverless API | `api/` | Backend | Node.js (JS + TS), Vercel Functions + Edge |
| 3 | Proto-First API (sebuf) | `proto/`, `server/`, `src/generated/` | Backend | Protobuf, buf, TypeScript handlers |
| 4 | Desktop App (Tauri) | `src-tauri/` | Desktop | Rust + Tauri 2.x |
| 5 | AIS Relay Server | `scripts/ais-relay.cjs` | Backend | Node.js WebSocket (Railway) |
| 6 | Convex Backend | `convex/` | Data | Convex serverless DB |
| 7 | Edge Middleware | `middleware.ts` | Backend | Vercel Edge Runtime |
| 8 | Nginx Config | `deploy/nginx/` | Infra | Nginx (Brotli compression) |

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Language** | TypeScript (primary), JavaScript, Rust, Protobuf |
| **Build** | Vite 6, esbuild, TypeScript 5.7 |
| **Mapping** | MapLibre GL JS 5.x, deck.gl 9.x (WebGL 3D globe) |
| **Charting** | D3.js 7.x |
| **ML/AI** | Transformers.js (@xenova/transformers), ONNX Runtime Web |
| **Desktop** | Tauri 2.x (Rust + WebView) |
| **PWA** | vite-plugin-pwa with Workbox |
| **i18n** | i18next (16 languages, lazy-loaded) |
| **API Codegen** | buf + sebuf (custom protoc plugins) |
| **Monitoring** | Sentry, PostHog, Vercel Analytics |
| **Storage** | Upstash Redis, Convex, IndexedDB, localStorage, OS Keychain |

## Architecture Type

**Vanilla TypeScript SPA** with proto-first RPC API layer. No frontend framework (React/Vue/Angular) — hand-rolled class-based component system with service-singleton pattern, event-driven state, and Web Worker offloading for ML inference and O(n²) analysis.

## Codebase Stats

| Section | Files | Lines |
|---------|-------|-------|
| Frontend (`src/`) | ~180 | ~67,338 |
| Server handlers (`server/`) | ~40 | ~9,433 |
| Proto definitions (`proto/`) | ~90 | ~3,977 |
| API functions (`api/`) | ~20 | ~1,865 |
| Desktop (`src-tauri/`) | ~5 | ~2,100 |
| Scripts | ~5 | ~1,700 |
| Tests + E2E | ~12 | ~2,500 |
| Generated code (`src/generated/`) | ~50 | ~5,000+ |
| **Total (hand-written)** | **~350+** | **~90,400** |

## Service Domains (17)

The API layer covers 17 intelligence domains, each with proto definitions, generated clients/servers, and handler implementations:

| Domain | Key Capabilities |
|--------|-----------------|
| Seismology | USGS earthquake data, magnitude filtering |
| Wildfire | NASA FIRMS satellite fire detection |
| Climate | Copernicus ERA5 anomalies, Open-Meteo |
| Prediction | Polymarket prediction market data |
| Displacement | UNHCR refugee/IDP data, WorldPop exposure |
| Aviation | OpenSky aircraft tracking, FAA delays |
| Research | arXiv papers, HackerNews, GitHub trending, tech events |
| Unrest | Protest and civil disorder tracking |
| Conflict | ACLED/UCDP armed conflict events, humanitarian data |
| Maritime | AIS vessel tracking, NGA navigation warnings |
| Cyber | Threat intelligence, abuse.ch feeds |
| Economic | FRED, EIA energy, World Bank indicators, sanctions |
| Infrastructure | Internet outages, submarine cables, service status |
| Market | Stocks, crypto, commodities, ETF flows, stablecoins |
| News | AI article summarization (Groq/OpenRouter) |
| Intelligence | Event classification, risk scoring, GDELT, PizzINT |
| Military | Flight tracking, fleet reports, theater posture |

## External API Integrations (35+)

20+ keyed APIs (all optional, graceful degradation): Groq, OpenRouter, Finnhub, EIA, FRED, Wingbits, ACLED, Cloudflare Radar, NASA FIRMS, AISStream, OpenSky, Upstash Redis, Sentry, PostHog, Convex.

15+ free/no-key APIs: USGS, UCDP, UNHCR, Open-Meteo, GDELT, Polymarket, Yahoo Finance, NGA, FAA, PizzINT, CoinGecko, abuse.ch, plus 30+ RSS news feeds.

## Deployment Architecture

| Target | Platform | Trigger |
|--------|----------|---------|
| Web (3 variants) | Vercel (auto-deploy) | Git push to main |
| Desktop (3 variants × 4 platforms) | GitHub Releases | Tag `v*` push |
| AIS Relay | Railway | Manual/CI |
| Convex Functions | Convex Cloud | `npx convex deploy` |

## Quick Start

```bash
npm install          # Install dependencies
make install         # buf CLI + sebuf plugins + Playwright browsers
npm run dev          # Start full variant dev server
npm run dev:tech     # Start tech variant
npm run dev:finance  # Start finance variant
```
