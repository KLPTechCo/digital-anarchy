# World Monitor — Source Tree & Dev/Ops Report

> Generated 2026-02-23 | v2.5.5

---

## A) Annotated Source Tree

```
world-monitor/                          # Root — Vite + Tauri + Vercel hybrid
├── index.html                          # SPA entry (Vite root HTML)
├── settings.html                       # Desktop settings window (Tauri secondary webview)
├── middleware.ts                        # Vercel Edge Middleware — bot blocking on /api/*
├── package.json                        # NPM workspace root (v2.5.5, AGPL-3.0)
├── Makefile                            # Proto code-gen pipeline (buf + sebuf)
├── playwright.config.ts                # E2E test config (Chromium, SwiftShader)
├── vite.config.ts                      # Vite build (1058 lines — variants, PWA, Brotli)
├── vercel.json                         # Vercel routing, caching, PostHog ingest proxy
├── tsconfig.json                       # Frontend TS config
├── tsconfig.api.json                   # API/server gateway TS config
│
├── api/                                # Vercel serverless functions (17 files)
│   ├── _api-key.js                     #   API key validation helper
│   ├── _cors.js                        #   CORS header helper
│   ├── _cors.test.mjs                  #   CORS unit tests
│   ├── download.js                     #   Desktop download redirect
│   ├── fwdstart.js                     #   Forward-start proxy
│   ├── og-story.js                     #   OG image generator for story shares
│   ├── og-story.test.mjs              #   OG story unit tests
│   ├── register-interest.js            #   Interest registration (Convex)
│   ├── rss-proxy.js                    #   RSS feed proxy/aggregator (297 lines)
│   ├── story.js                        #   Story page renderer
│   ├── version.js                      #   Version endpoint
│   ├── [domain]/v1/[rpc].ts           #   ★ Sebuf RPC gateway (all 17 services)
│   ├── data/
│   │   └── city-coords.ts             #   Static city coordinate data (405 lines)
│   ├── eia/
│   │   └── [[...path]].js             #   EIA API passthrough proxy
│   └── youtube/
│       ├── embed.js                    #   YouTube embed proxy
│       ├── embed.test.mjs             #   Embed unit tests
│       └── live.js                     #   YouTube live stream proxy
│
├── server/                             # Backend business logic (78 files, 9,433 lines)
│   ├── router.ts                       #   Map-based route matcher for sebuf routes
│   ├── cors.ts                         #   CORS header generation
│   ├── error-mapper.ts                 #   Error → HTTP response mapper
│   ├── _shared/
│   │   ├── constants.ts                #   Shared constants
│   │   ├── hash.ts                     #   Hash utilities
│   │   └── redis.ts                    #   Upstash Redis client
│   └── worldmonitor/                   # 17 domain service handlers
│       ├── aviation/v1/                #   Airport delays (FAA)
│       ├── climate/v1/                 #   Climate anomalies
│       ├── conflict/v1/                #   ACLED events, UCDP, humanitarian
│       ├── cyber/v1/                   #   Cyber threats (URLHaus, OTX, AbuseIPDB)
│       ├── displacement/v1/            #   Population displacement (UNHCR)
│       ├── economic/v1/                #   FRED, EIA, World Bank, macro signals
│       ├── infrastructure/v1/          #   Internet outages, cable health, baselines
│       ├── intelligence/v1/            #   GDELT, risk scores, country briefs, PizzInt
│       ├── maritime/v1/                #   Vessel snapshots, navigational warnings
│       ├── market/v1/                  #   Stocks, commodities, crypto, ETFs, stablecoins
│       ├── military/v1/                #   USNI fleet, flights, Wingbits, theater posture
│       ├── news/v1/                    #   News summaries (LLM-powered)
│       ├── prediction/v1/              #   Polymarket prediction markets
│       ├── research/v1/                #   arXiv, HN, trending repos, tech events
│       ├── seismology/v1/              #   USGS earthquakes
│       ├── unrest/v1/                  #   ACLED unrest events
│       └── wildfire/v1/                #   NASA FIRMS fire detections
│
├── proto/                              # Protobuf definitions (93 files, 3,977 lines)
│   ├── buf.gen.yaml                    #   Buf code-gen config (protoc-gen-ts-client/server/openapi)
│   ├── buf.yaml                        #   Buf module config
│   ├── sebuf/http/
│   │   └── annotations.proto           #   Sebuf HTTP annotation definitions
│   └── worldmonitor/
│       ├── core/v1/                    #   Shared types: country, geo, time, severity, errors
│       ├── aviation/v1/                #   3 protos: service, airport_delay, list
│       ├── climate/v1/                 #   3 protos
│       ├── conflict/v1/                #   6 protos: ACLED, UCDP, humanitarian
│       ├── cyber/v1/                   #   3 protos
│       ├── displacement/v1/            #   4 protos
│       ├── economic/v1/                #   6 protos: FRED, EIA, World Bank, macro
│       ├── infrastructure/v1/          #   7 protos: outages, cables, baselines
│       ├── intelligence/v1/            #   7 protos: GDELT, risk, PizzInt, classify
│       ├── maritime/v1/                #   4 protos
│       ├── market/v1/                  #   9 protos: stocks, commodities, crypto, ETF
│       ├── military/v1/                #   10 protos: USNI, flights, Wingbits
│       ├── news/v1/                    #   3 protos
│       ├── prediction/v1/              #   3 protos
│       ├── research/v1/                #   6 protos: arXiv, HN, repos, events
│       ├── seismology/v1/              #   3 protos
│       ├── unrest/v1/                  #   3 protos
│       └── wildfire/v1/                #   3 protos
│
├── src/                                # Frontend application (67,338 lines TS, excl. generated)
│   ├── main.ts                         #   App entry point
│   ├── App.ts                          #   Root application class
│   ├── settings-main.ts                #   Settings window entry
│   ├── pwa.d.ts                        #   PWA type declarations
│   ├── vite-env.d.ts                   #   Vite env types
│   ├── bootstrap/
│   │   └── chunk-reload.ts             #   Vite chunk reload handler (43 lines)
│   ├── components/                     #   UI components (52 files, 22,883 lines)
│   │   ├── Map.ts                      #     MapLibre GL map controller
│   │   ├── DeckGLMap.ts                #     deck.gl overlay for heatmaps/arcs
│   │   ├── MapContainer.ts             #     Map layout orchestrator
│   │   ├── MapPopup.ts                 #     Popup renderer for map features
│   │   ├── Panel.ts                    #     Base panel component
│   │   ├── MonitorPanel.ts             #     Main dashboard panel
│   │   ├── SearchModal.ts              #     Global search overlay
│   │   ├── StoryModal.ts               #     Shareable story viewer
│   │   ├── WorldMonitorTab.ts          #     Tab navigation
│   │   ├── LiveNewsPanel.ts            #     Live news feed
│   │   ├── NewsPanel.ts                #     News aggregation
│   │   ├── MarketPanel.ts              #     Market data panel
│   │   ├── EconomicPanel.ts            #     Economic indicators
│   │   ├── MacroSignalsPanel.ts        #     Macro signal dashboard
│   │   ├── ETFFlowsPanel.ts            #     ETF fund flows
│   │   ├── StablecoinPanel.ts          #     Stablecoin tracking
│   │   ├── InvestmentsPanel.ts         #     Investment analysis
│   │   ├── StrategicRiskPanel.ts       #     Strategic risk assessment  
│   │   ├── StrategicPosturePanel.ts    #     Military posture view
│   │   ├── PredictionPanel.ts          #     Prediction markets
│   │   ├── GdeltIntelPanel.ts          #     GDELT intelligence
│   │   ├── InsightsPanel.ts            #     AI-powered insights
│   │   ├── ClimateAnomalyPanel.ts      #     Climate anomalies
│   │   ├── DisplacementPanel.ts        #     Population displacement
│   │   ├── PopulationExposurePanel.ts  #     Population exposure
│   │   ├── SatelliteFiresPanel.ts      #     NASA wildfire data
│   │   ├── CascadePanel.ts             #     Infrastructure cascade
│   │   ├── CIIPanel.ts                 #     Cyber incident index
│   │   ├── ServiceStatusPanel.ts       #     Service status
│   │   ├── UcdpEventsPanel.ts          #     UCDP conflict events
│   │   ├── TechEventsPanel.ts          #     Tech events calendar
│   │   ├── TechHubsPanel.ts            #     Tech hub mapping
│   │   ├── TechReadinessPanel.ts       #     Tech readiness scores
│   │   ├── GeoHubsPanel.ts             #     Geographic hub index
│   │   ├── RegulationPanel.ts          #     AI regulation tracker
│   │   ├── StatusPanel.ts              #     System status
│   │   ├── RuntimeConfigPanel.ts       #     Runtime config UI
│   │   ├── CountryBriefPage.ts         #     Country intelligence brief
│   │   ├── CountryIntelModal.ts        #     Country detail modal
│   │   ├── CountryTimeline.ts          #     Country event timeline
│   │   ├── SignalModal.ts              #     Signal detail viewer
│   │   ├── PizzIntIndicator.ts         #     Pizza Intelligence indicator
│   │   ├── PlaybackControl.ts          #     Temporal playback
│   │   ├── VirtualList.ts              #     Virtual scroll list
│   │   ├── CommunityWidget.ts          #     Community engagement
│   │   ├── DownloadBanner.ts           #     Desktop download CTA
│   │   ├── LiveWebcamsPanel.ts         #     Live webcam feeds
│   │   ├── MobileWarningModal.ts       #     Mobile viewport warning
│   │   ├── LanguageSelector.ts         #     i18n language picker
│   │   ├── VerificationChecklist.ts    #     Source verification UI
│   │   ├── IntelligenceGapBadge.ts     #     Intelligence gap indicator
│   │   └── index.ts                    #     Component barrel export
│   ├── config/                         #   Configuration (28 files, 14,134 lines)
│   │   ├── index.ts                    #     Config barrel
│   │   ├── variant.ts                  #     Build variant detector (full/tech/finance)
│   │   ├── variants/
│   │   │   ├── base.ts                 #       Base layer set
│   │   │   ├── full.ts                 #       Full variant layers
│   │   │   ├── tech.ts                 #       Tech variant layers
│   │   │   └── finance.ts              #       Finance variant layers
│   │   ├── countries.ts                #     Country metadata
│   │   ├── entities.ts                 #     Entity definitions
│   │   ├── geo.ts                      #     Geopolitical config
│   │   ├── finance-geo.ts              #     Finance geography data
│   │   ├── tech-geo.ts                 #     Tech geography data
│   │   ├── bases-expanded.ts           #     Military base coordinates
│   │   ├── airports.ts                 #     Airport data
│   │   ├── ports.ts                    #     Port data
│   │   ├── pipelines.ts                #     Pipeline routes
│   │   ├── markets.ts                  #     Market definitions
│   │   ├── military.ts                 #     Military asset config
│   │   ├── feeds.ts                    #     RSS/news feed URLs
│   │   ├── panels.ts                   #     Panel layout config
│   │   ├── beta.ts                     #     Feature flags
│   │   ├── ml-config.ts                #     ML model config
│   │   ├── ai-datacenters.ts           #     AI datacenter locations
│   │   ├── ai-regulations.ts           #     AI regulation database
│   │   ├── ai-research-labs.ts         #     AI research lab locations
│   │   ├── startup-ecosystems.ts       #     Startup ecosystem data
│   │   ├── tech-companies.ts           #     Tech company locations
│   │   ├── gulf-fdi.ts                 #     Gulf FDI data
│   │   └── irradiators.ts              #     Gamma irradiator locations
│   ├── services/                       #   Data services (78 files, 20,276 lines)
│   │   ├── index.ts                    #     Service barrel
│   │   ├── runtime.ts                  #     Runtime detection (web/desktop/Tauri)
│   │   ├── runtime-config.ts           #     Dynamic runtime configuration
│   │   ├── tauri-bridge.ts             #     Tauri IPC bridge
│   │   ├── storage.ts                  #     IndexedDB + localStorage wrapper
│   │   ├── persistent-cache.ts         #     Cross-runtime persistent cache
│   │   ├── i18n.ts                     #     i18next initialization
│   │   ├── analytics.ts                #     PostHog analytics
│   │   ├── rss.ts                      #     RSS feed client
│   │   ├── live-news.ts                #     Live news aggregator
│   │   ├── earthquakes.ts              #     Earthquake data client
│   │   ├── gdacs.ts                    #     GDACS disaster alerts
│   │   ├── eonet.ts                    #     NASA EONET events
│   │   ├── weather.ts                  #     Weather data
│   │   ├── military-flights.ts         #     Military flight tracker
│   │   ├── military-vessels.ts         #     Military vessel tracker (642 lines)
│   │   ├── military-surge.ts           #     Military surge detector
│   │   ├── usni-fleet.ts               #     USNI fleet tracker
│   │   ├── wingbits.ts                 #     Wingbits ADS-B
│   │   ├── cable-activity.ts           #     Undersea cable activity
│   │   ├── cable-health.ts             #     Cable health monitor
│   │   ├── usa-spending.ts             #     USASpending.gov
│   │   ├── investments-focus.ts        #     Investment focus tracking
│   │   ├── pizzint.ts                  #     Pizza Intelligence
│   │   ├── gdelt-intel.ts              #     GDELT intelligence queries
│   │   ├── population-exposure.ts      #     Population exposure calculator
│   │   ├── temporal-baseline.ts        #     Temporal baseline analysis
│   │   ├── desktop-readiness.ts        #     Desktop feature readiness
│   │   ├── data-freshness.ts           #     Data freshness tracker
│   │   ├── meta-tags.ts                #     SEO meta tag manager
│   │   ├── story-data.ts               #     Story data fetcher
│   │   ├── story-renderer.ts           #     Story HTML renderer
│   │   ├── story-share.ts              #     Story sharing
│   │   ├── summarization.ts            #     LLM summarization
│   │   ├── entity-extraction.ts        #     NER entity extraction
│   │   ├── entity-index.ts             #     Entity search index
│   │   ├── trending-keywords.ts        #     Trending keyword detector
│   │   ├── threat-classifier.ts        #     Threat classification
│   │   ├── signal-aggregator.ts        #     Cross-domain signal aggregation
│   │   ├── focal-point-detector.ts     #     Geographic focal point detection
│   │   ├── hotspot-escalation.ts       #     Escalation detector
│   │   ├── infrastructure-cascade.ts   #     Infrastructure cascade analyzer
│   │   ├── country-instability.ts      #     Country instability index
│   │   ├── country-geometry.ts         #     Country boundary geometry
│   │   ├── cross-module-integration.ts #     Cross-module data integration
│   │   ├── geo-activity.ts             #     Geographic activity tracker
│   │   ├── geo-convergence.ts          #     Geographic convergence analysis
│   │   ├── geo-hub-index.ts            #     Geographic hub scoring
│   │   ├── tech-hub-index.ts           #     Tech hub scoring
│   │   ├── tech-activity.ts            #     Tech activity tracking
│   │   ├── velocity.ts                 #     Event velocity calculator
│   │   ├── correlation.ts              #     Cross-domain correlation
│   │   ├── clustering.ts               #     Event clustering
│   │   ├── related-assets.ts           #     Related asset discovery
│   │   ├── cached-risk-scores.ts       #     Cached risk score provider (226 lines)
│   │   ├── cached-theater-posture.ts   #     Cached theater posture
│   │   ├── activity-tracker.ts         #     User activity tracking
│   │   ├── ml-capabilities.ts          #     ML capability detection
│   │   ├── ml-worker.ts                #     ML worker bridge
│   │   ├── analysis-core.ts            #     Analysis engine core
│   │   ├── analysis-worker.ts          #     Analysis worker bridge
│   │   ├── parallel-analysis.ts        #     Parallel analysis coordinator
│   │   ├── aviation/index.ts           #     Sebuf client — aviation
│   │   ├── climate/index.ts            #     Sebuf client — climate
│   │   ├── conflict/index.ts           #     Sebuf client — conflict
│   │   ├── cyber/index.ts              #     Sebuf client — cyber
│   │   ├── displacement/index.ts       #     Sebuf client — displacement
│   │   ├── economic/index.ts           #     Sebuf client — economic
│   │   ├── infrastructure/index.ts     #     Sebuf client — infrastructure
│   │   ├── intelligence/index.ts       #     Sebuf client — intelligence
│   │   ├── maritime/index.ts           #     Sebuf client — maritime
│   │   ├── market/index.ts             #     Sebuf client — market
│   │   ├── military/index.ts           #     Sebuf client — military
│   │   ├── news/index.ts               #     Sebuf client — news
│   │   ├── prediction/index.ts         #     Sebuf client — prediction
│   │   ├── research/index.ts           #     Sebuf client — research
│   │   ├── unrest/index.ts             #     Sebuf client — unrest
│   │   └── wildfires/index.ts          #     Sebuf client — wildfires
│   ├── types/
│   │   └── index.ts                    #   Type definitions (1,275 lines)
│   ├── utils/                          #   Utilities (11 files, 1,490 lines)
│   │   ├── index.ts                    #     Utility barrel
│   │   ├── analysis-constants.ts       #     Analysis thresholds/constants
│   │   ├── circuit-breaker.ts          #     Circuit breaker for API calls
│   │   ├── dom-utils.ts                #     DOM helper functions
│   │   ├── export.ts                   #     Data export (CSV, JSON)
│   │   ├── proxy.ts                    #     Proxy URL resolver
│   │   ├── reverse-geocode.ts          #     Reverse geocoding
│   │   ├── sanitize.ts                 #     HTML sanitization
│   │   ├── theme-colors.ts             #     Theme color palette
│   │   ├── theme-manager.ts            #     Dark/light theme manager
│   │   └── urlState.ts                 #     URL state serialization
│   ├── workers/                        #   Web Workers (2 files, 523 lines)
│   │   ├── analysis.worker.ts          #     Analysis computation worker
│   │   └── ml.worker.ts                #     ML inference worker (ONNX)
│   ├── styles/                         #   CSS (5 files, 15,671 lines)
│   │   ├── main.css                    #     Core styles
│   │   ├── panels.css                  #     Panel layout styles
│   │   ├── settings-window.css         #     Settings window styles
│   │   ├── lang-switcher.css           #     Language selector styles
│   │   └── rtl-overrides.css           #     RTL language overrides
│   ├── e2e/                            #   E2E test harness sources (3 files, 1,592 lines)
│   │   ├── map-harness.ts              #     E2E map test harness
│   │   ├── mobile-map-harness.ts       #     Mobile map test harness
│   │   └── mobile-map-integration-harness.ts
│   ├── generated/                      #   ★ Auto-generated sebuf code (DO NOT EDIT)
│   │   ├── client/                     #     TypeScript RPC clients
│   │   └── server/                     #     TypeScript RPC server stubs
│   └── locales/                        #   ★ i18n translation files (DO NOT EDIT manually)
│
├── src-tauri/                          # Tauri 2.x desktop shell (Rust)
│   ├── src/
│   │   └── main.rs                     #   Desktop app (977 lines) — sidecar, keychain, cache, IPC
│   ├── build.rs                        #   Tauri build script
│   ├── Cargo.toml                      #   Rust dependencies
│   ├── tauri.conf.json                 #   Base Tauri config (full variant)
│   ├── tauri.tech.conf.json            #   Tech variant overlay
│   ├── tauri.finance.conf.json         #   Finance variant overlay
│   ├── capabilities/
│   │   └── default.json                #   Tauri capability permissions
│   ├── sidecar/
│   │   ├── local-api-server.mjs        #   ★ Node.js sidecar (1,092 lines) — local API proxy
│   │   ├── local-api-server.test.mjs   #     Sidecar unit tests
│   │   ├── package.json                #     Sidecar package metadata
│   │   └── node/                       #     Bundled Node.js runtime (downloaded at build)
│   └── icons/                          #   App icons (macOS, Windows, iOS, Android)
│
├── e2e/                                # Playwright E2E tests (5 specs, 2,193 lines)
│   ├── runtime-fetch.spec.ts           #   API runtime fetch validation (908 lines)
│   ├── map-harness.spec.ts             #   Map rendering + visual regression (671 lines)
│   ├── mobile-map-popup.spec.ts        #   Mobile map popup behavior (270 lines)
│   ├── investments-panel.spec.ts       #   Investments panel tests (142 lines)
│   ├── keyword-spike-flow.spec.ts      #   Keyword spike detection flow
│   └── map-harness.spec.ts-snapshots/  #   Golden screenshot references
│
├── tests/                              # Unit/integration tests (4 test files, 501 lines)
│   ├── server-handlers.test.mjs        #   Server handler unit tests (230 lines)
│   ├── gulf-fdi-data.test.mjs          #   Gulf FDI data validation (147 lines)
│   ├── countries-geojson.test.mjs      #   Country geometry tests (61 lines)
│   ├── deploy-config.test.mjs          #   Deploy config validation (63 lines)
│   ├── map-harness.html                #   Map test harness page
│   ├── mobile-map-harness.html         #   Mobile map harness page
│   ├── mobile-map-integration-harness.html
│   └── runtime-harness.html            #   Runtime test harness page
│
├── scripts/                            # Build & DevOps scripts (1,958 lines)
│   ├── ais-relay.cjs                   #   AIS WebSocket relay server (1,464 lines)
│   ├── build-sidecar-sebuf.mjs         #   Compile sebuf gateway → ESM bundle for sidecar
│   ├── desktop-package.mjs             #   Desktop packaging orchestrator (macOS/Windows/Linux)
│   ├── sync-desktop-version.mjs        #   Sync version across package.json/tauri.conf/Cargo.toml
│   ├── download-node.sh                #   Download + verify Node.js for bundled runtime
│   └── package.json                    #   Scripts workspace package
│
├── convex/                             # Convex BaaS (interest registration)
│   ├── schema.ts                       #   Convex schema definition
│   ├── registerInterest.ts             #   Interest registration mutation
│   └── tsconfig.json                   #   Convex TS config
│
├── data/                               # Static data files
│   ├── gamma-irradiators.json          #   Processed gamma irradiator locations
│   └── gamma-irradiators-raw.json      #   Raw source data
│
├── public/                             # Static public assets
│   ├── llms.txt                        #   LLM context file (short)
│   ├── llms-full.txt                   #   LLM context file (full)
│   ├── offline.html                    #   PWA offline fallback page
│   ├── robots.txt                      #   Search engine directives
│   ├── data/                           #   Static GeoJSON/TopoJSON data
│   └── favico/                         #   Favicon + social preview images
│
├── deploy/nginx/
│   └── brotli-api-proxy.conf           # Nginx Brotli proxy config
│
├── docs/                               # Project documentation
│   ├── ADDING_ENDPOINTS.md             #   How to add new API endpoints
│   ├── API_KEY_DEPLOYMENT.md           #   API key deployment guide
│   ├── DESKTOP_CONFIGURATION.md        #   Desktop configuration guide
│   ├── RELEASE_PACKAGING.md            #   Release packaging process
│   ├── TAURI_VALIDATION_REPORT.md      #   Tauri build validation
│   ├── COMMUNITY-PROMOTION-GUIDE.md    #   Community promotion
│   ├── DOCUMENTATION.md                #   Documentation standards
│   ├── local-backend-audit.md          #   Local backend audit
│   └── api/                            #   Generated OpenAPI specs (34 files)
│       ├── SeismologyService.openapi.{json,yaml}
│       ├── WildfireService.openapi.{json,yaml}
│       ├── ...   (17 services × 2 formats)
│       └── MilitaryService.openapi.{json,yaml}
│
├── .github/
│   ├── workflows/
│   │   ├── build-desktop.yml           #   Desktop build CI (4 platforms)
│   │   └── lint.yml                    #   Markdown lint CI
│   ├── ISSUE_TEMPLATE/                 #   Bug, feature, data source templates
│   ├── agents/                         #   BMAD AI agent definitions
│   ├── prompts/                        #   BMAD prompt definitions
│   ├── copilot-instructions.md         #   Copilot workspace instructions
│   └── pull_request_template.md        #   PR template
│
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                             # AGPL-3.0
├── README.md
└── SECURITY.md
```

---

## B) Line Count Summary

| Section | Files | Lines | Notes |
|---------|-------|-------|-------|
| **src/** (excl. generated/locales) | ~178 | **67,338** | Frontend app |
| ↳ src/components/ | 52 | 22,883 | UI components |
| ↳ src/services/ | 78 | 20,276 | Data services + sebuf clients |
| ↳ src/config/ | 28 | 14,134 | Static config + variant data |
| ↳ src/styles/ | 5 | 15,671 | CSS |
| ↳ src/types/ | 1 | 1,275 | Type definitions |
| ↳ src/utils/ | 11 | 1,490 | Utility functions |
| ↳ src/workers/ | 2 | 523 | Web Workers |
| ↳ src/e2e/ | 3 | 1,592 | E2E harness sources |
| ↳ src/bootstrap/ | 1 | 43 | Chunk reload |
| **server/** | 78 | **9,433** | Backend handlers |
| **proto/** | 93 | **3,977** | Protobuf definitions |
| **api/** | 17 | **1,865** | Vercel serverless functions |
| **scripts/** | 5 | **1,958** | Build & DevOps |
| **e2e/** | 5 | **2,193** | Playwright specs |
| **tests/** | 4 | **501** | Unit/integration tests |
| **src-tauri/src/main.rs** | 1 | **977** | Desktop shell (Rust) |
| **src-tauri/sidecar/** | 2 | ~1,092 | Local API server (Node.js) |
| **vite.config.ts** | 1 | 1,058 | Build config |
| | | | |
| **TOTAL (hand-written)** | ~390 | **~90,400** | Excluding generated, locales, data |

---

## C) Build & Dev Commands

### npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server (full variant) |
| `dev:tech` | `VITE_VARIANT=tech vite` | Dev server — tech variant |
| `dev:finance` | `VITE_VARIANT=finance vite` | Dev server — finance variant |
| `build` | `tsc && vite build` | Type-check + production build |
| `build:full` | `VITE_VARIANT=full tsc && vite build` | Full variant build |
| `build:tech` | `VITE_VARIANT=tech tsc && vite build` | Tech variant build |
| `build:finance` | `VITE_VARIANT=finance tsc && vite build` | Finance variant build |
| `build:desktop` | `build:sidecar-sebuf && tsc && vite build` | Build for Tauri (includes sebuf bundle) |
| `build:sidecar-sebuf` | `node scripts/build-sidecar-sebuf.mjs` | Compile sebuf gateway → single ESM bundle |
| `typecheck` | `tsc --noEmit` | Type-check without emit |
| `preview` | `vite preview` | Preview production build |
| `lint:md` | `markdownlint-cli2 '**/*.md'` | Lint all Markdown files |
| `version:sync` | `node scripts/sync-desktop-version.mjs` | Sync version across package.json → tauri.conf → Cargo.toml |
| `version:check` | `...sync-desktop-version.mjs --check` | Check version consistency (CI gate) |
| **Test Commands** | | |
| `test:data` | `node --test tests/*.test.mjs` | Run unit/data tests (Node.js test runner) |
| `test:sidecar` | `node --test ...` | Run sidecar + API handler tests |
| `test:e2e` | `runtime + full + tech + finance` | Run all E2E suites |
| `test:e2e:full` | `VITE_VARIANT=full playwright test` | E2E — full variant |
| `test:e2e:tech` | `VITE_VARIANT=tech playwright test` | E2E — tech variant |
| `test:e2e:finance` | `VITE_VARIANT=finance playwright test` | E2E — finance variant |
| `test:e2e:runtime` | `playwright test e2e/runtime-fetch.spec.ts` | E2E — runtime fetch validation only |
| `test:e2e:visual` | full + tech visual tests | Visual regression snapshots |
| `test:e2e:visual:update` | `... --update-snapshots` | Update golden screenshots |
| **Desktop Commands** | | |
| `desktop:dev` | `version:sync && VITE_DESKTOP_RUNTIME=1 tauri dev` | Tauri dev mode |
| `desktop:build:full` | `version:sync && ... tauri build` | Build desktop — full |
| `desktop:build:tech` | `... tauri build --config tauri.tech.conf.json` | Build desktop — tech |
| `desktop:build:finance` | `... tauri build --config tauri.finance.conf.json` | Build desktop — finance |
| `desktop:package` | `node scripts/desktop-package.mjs` | Full packaging pipeline |
| `desktop:package:macos:full` | `desktop-package.mjs --os macos --variant full` | Package macOS full |
| `desktop:package:macos:full:sign` | `... --sign` | Package + codesign macOS |
| `desktop:package:windows:full` | `... --os windows --variant full` | Package Windows full |
| `tauri` | `tauri` | Direct Tauri CLI access |

### Makefile Targets (Protobuf Code Generation)

| Target | Description |
|--------|-------------|
| `make help` | Show all targets |
| `make install` | Install everything (buf, sebuf plugins, npm, playwright, proto deps) |
| `make install-buf` | Install buf CLI (Go) |
| `make install-plugins` | Install sebuf protoc plugins v0.7.0 (protoc-gen-ts-client/server/openapi) |
| `make install-npm` | `npm install` |
| `make install-playwright` | Install Playwright Chromium |
| `make deps` | Update buf proto dependencies |
| `make lint` | Lint protobuf files |
| `make generate` | Clean + generate code from proto definitions → `src/generated/`, `docs/api/` |
| `make breaking` | Check for breaking proto changes vs main branch |
| `make format` | Format protobuf files |
| `make check` | Run lint + generate |
| `make clean` | Remove generated client, server, and API docs |

---

## D) Test Setup

### Playwright Configuration
- **Test directory**: `e2e/`
- **Browser**: Chromium with SwiftShader (software rendering for CI)
- **Viewport**: 1280×720, dark mode, `en-US`, UTC timezone
- **Timeout**: 90s test / 30s expect
- **Workers**: 1 (serial execution)
- **Retries**: 0
- **Web server**: Vite dev server at `127.0.0.1:4173` (starts automatically)
  - Command: `VITE_E2E=1 npm run dev -- --host 127.0.0.1 --port 4173`
  - Health check URL: `/tests/map-harness.html`
  - Server timeout: 120s
- **Snapshots**: `{testDir}/{testFileName}-snapshots/{arg}{ext}`
- **Artifacts**: trace, screenshot, video on failure

### Test Suites

| Suite | File | Lines | What It Tests |
|-------|------|-------|---------------|
| Runtime Fetch | `e2e/runtime-fetch.spec.ts` | 908 | API endpoint availability, response validation |
| Map Harness | `e2e/map-harness.spec.ts` | 671 | Map rendering, layers, visual regression snapshots |
| Mobile Popup | `e2e/mobile-map-popup.spec.ts` | 270 | Mobile map popup behavior and interaction |
| Investments | `e2e/investments-panel.spec.ts` | 142 | Investments panel data loading and display |
| Keyword Spike | `e2e/keyword-spike-flow.spec.ts` | ~200 | Keyword spike detection user flow |

### Unit/Data Tests (`test:data`)
- **Runner**: Node.js built-in `--test`
- **Files**: `tests/*.test.mjs`
  - `server-handlers.test.mjs` — Server handler validation (230 lines)
  - `gulf-fdi-data.test.mjs` — Gulf FDI data integrity (147 lines)
  - `countries-geojson.test.mjs` — Country GeoJSON validation (61 lines)
  - `deploy-config.test.mjs` — Deploy configuration checks (63 lines)

### Sidecar Tests (`test:sidecar`)
- **Runner**: Node.js `--test`
- **Files**: `src-tauri/sidecar/local-api-server.test.mjs`, `api/_cors.test.mjs`, `api/youtube/embed.test.mjs`, `api/cyber-threats.test.mjs`, `api/usni-fleet.test.mjs`

---

## E) CI/CD Pipeline

### `build-desktop.yml` — Desktop Build
- **Triggers**: Tags `v*` (push) or manual `workflow_dispatch` (variant: full/tech, draft: true/false)
- **Concurrency**: `desktop-build-${{ github.ref }}`, cancel in-progress
- **Build matrix** (4 platforms):

| Platform | Runner | Target | Label | Timeout |
|----------|--------|--------|-------|---------|
| macOS ARM64 | `macos-14` | `aarch64-apple-darwin` | macOS-ARM64 | 180m |
| macOS x64 | `macos-latest` | `x86_64-apple-darwin` | macOS-x64 | 180m |
| Windows x64 | `windows-latest` | `x86_64-pc-windows-msvc` | Windows-x64 | 120m |
| Linux x64 | `ubuntu-22.04` | `x86_64-unknown-linux-gnu` | Linux-x64 | 120m |

- **Steps**: Checkout → Node 22 → Rust stable → Rust cache → Linux deps → `npm ci` → version check → bundle Node.js runtime → verify Node payload → Apple signing (optional) → set variant → Tauri build (signed or unsigned) → verify macOS bundle → cleanup signing → report duration
- **Post-build job**: `update-release-notes` — generates changelog from git log, updates GitHub Release
- **Apple code signing**: conditional based on secrets; falls back to unsigned if unavailable
- **Node.js bundling**: `scripts/download-node.sh` bundles Node v22.14.0 for each platform target

### `lint.yml` — Markdown Lint
- **Triggers**: PRs that modify `*.md` or `.markdownlint-cli2.jsonc`
- **Runner**: `ubuntu-latest`
- **Steps**: Checkout → Node 22 → `npm ci` → `npm run lint:md`

---

## F) Desktop Build

### Tauri Architecture
- **Framework**: Tauri 2.x (Rust shell + WebView)
- **Rust binary** (`src-tauri/src/main.rs`, 977 lines):
  - Launches a **Node.js sidecar** (`local-api-server.mjs`) on port 46123
  - Manages **keychain secrets** via consolidated vault (21 supported keys)
  - Provides **persistent cache** (in-memory with JSON flush on exit)
  - IPC commands: secrets CRUD, cache R/W, Polymarket native fetch, URL open, logs, settings window
  - macOS-specific: hide-on-close + dock reopen, settings window focus management
  - Linux: DMA-BUF renderer workaround
  - Windows: `CREATE_NO_WINDOW` for headless Node.js, extended path sanitization

### Build Variants
| Variant | Config | URL | App Name |
|---------|--------|-----|----------|
| Full | `tauri.conf.json` | worldmonitor.app | World Monitor |
| Tech | `tauri.tech.conf.json` | tech.worldmonitor.app | Tech Monitor |
| Finance | `tauri.finance.conf.json` | finance.worldmonitor.app | Finance Monitor |

### Packaging Pipeline (`scripts/desktop-package.mjs`)
1. **Sync versions** across `package.json` → `tauri.conf.json` → `Cargo.toml`
2. **Download Node.js runtime** for target platform (unless `--skip-node-runtime`)
3. **Build with Tauri CLI** — bundles per OS:
   - macOS: `.app` + `.dmg`
   - Windows: NSIS + MSI
   - Linux: AppImage
4. **Optional signing**: macOS (Developer ID) or Windows (certificate thumbprint/PFX)

### Node.js Runtime Bundling (`scripts/download-node.sh`)
- Downloads Node.js v22.14.0 from nodejs.org for the target triple
- SHA-256 verification against official SHASUMS256.txt
- Extracts binary to `src-tauri/sidecar/node/`
- Supports: `aarch64-apple-darwin`, `x86_64-apple-darwin`, `x86_64-pc-windows-msvc`, `x86_64-unknown-linux-gnu`

### Sebuf Sidecar Bundle (`scripts/build-sidecar-sebuf.mjs`)
- Uses esbuild to compile `api/[domain]/v1/[rpc].ts` → `api/[domain]/v1/[rpc].js`
- Single self-contained ESM bundle for the sidecar's `buildRouteTable()`
- Tree-shaken, targeting Node 18+

---

## G) Integration Points

### Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (src/)                       │
│  Vite SPA → MapLibre GL + deck.gl + vanilla TS          │
│  Services: src/services/{domain}/index.ts               │
│            (sebuf-generated RPC clients)                 │
│  Workers: analysis.worker.ts, ml.worker.ts              │
│  Storage: IndexedDB + persistent cache                  │
└───────┬─────────────┬────────────────────┬──────────────┘
        │ fetch()     │ Tauri IPC          │ WebSocket
        │             │ (invoke)           │
        ▼             ▼                    ▼
┌───────────┐  ┌─────────────┐    ┌─────────────────┐
│  Vercel   │  │  Tauri Rust │    │ AIS Relay       │
│  Edge     │  │  main.rs    │    │ (ais-relay.cjs) │
│  (web)    │  │  (desktop)  │    │ WebSocket       │
└───────┬───┘  └──────┬──────┘    └─────────────────┘
        │             │
        │             ├─── Keychain secrets
        │             ├─── Persistent cache (JSON)
        │             ├─── Polymarket native fetch
        │             │
        ▼             ▼
┌─────────────────────────────────────────┐
│  RPC GATEWAY (api/[domain]/v1/[rpc])    │
│  Vercel: Edge function (TS)             │
│  Desktop: local-api-server.mjs :46123   │
│   └── buildRouteTable() loads handler   │
│       modules from api/** and server/** │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  ROUTER (server/router.ts)              │
│  Map<"METHOD /path", handler> lookup    │
│  17 services × N RPCs each             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  DOMAIN HANDLERS (server/worldmonitor/) │
│  Pure business logic per RPC method     │
│  Uses: Upstash Redis, external APIs     │
│  (USGS, EIA, FRED, ACLED, GDELT, etc.) │
└─────────────────────────────────────────┘
```

### Communication Flows

#### 1. Web (Vercel) Path
```
Browser → middleware.ts (bot filter) → api/[domain]/v1/[rpc].ts (Edge Function)
  → validates origin (CORS) → validates API key → router.match() → handler → response
```

#### 2. Desktop (Tauri) Path
```
WebView → src/services/tauri-bridge.ts → Tauri IPC (invoke)
  → main.rs commands (secrets, cache, polymarket, settings, logs)

WebView → fetch("http://127.0.0.1:46123/api/...") → local-api-server.mjs
  → Same router + handlers as Vercel, but running locally in Node.js sidecar
  → IPv4-forced fetch() to avoid government API IPv6 timeouts
  → Brotli/gzip compression
  → Auth via LOCAL_API_TOKEN (generated per-session by Rust, passed via IPC)
```

#### 3. Proto → Code Pipeline
```
*.proto (proto/) → buf generate → protoc-gen-ts-client → src/generated/client/
                                → protoc-gen-ts-server → src/generated/server/
                                → protoc-gen-openapiv3 → docs/api/
```
- Client code provides typed RPC stubs used by `src/services/{domain}/index.ts`
- Server code provides route descriptors + typed handler interfaces used by `server/worldmonitor/{domain}/v1/handler.ts`

#### 4. Sidecar Sebuf Bundle
```
api/[domain]/v1/[rpc].ts → esbuild (build-sidecar-sebuf.mjs) → [rpc].js (single ESM bundle)
  → loaded by local-api-server.mjs's buildRouteTable() at startup
```

#### 5. Secret Management (Desktop)
```
Tauri main.rs startup:
  → SecretsCache::load_from_keychain() (consolidated vault, single prompt)
  → Inject as env vars into Node.js sidecar process
  → Expose via IPC: get_secret, set_secret, delete_secret, get_all_secrets
Frontend settings window:
  → settings-main.ts → Tauri invoke → main.rs → keychain vault
```

#### 6. Persistent Cache (Desktop)
```
Tauri main.rs:
  → PersistentCache::load(persistent-cache.json) at startup (in-memory)
  → IPC: read_cache_entry (memory), write_cache_entry (memory + sync flush)
  → Flush to disk on app exit
Frontend:
  → src/services/persistent-cache.ts detects Tauri runtime
  → Falls back to IndexedDB in web mode
```

---

*End of report.*
