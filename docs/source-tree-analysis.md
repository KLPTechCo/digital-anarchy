# World Monitor — Source Tree Analysis

> **Generated**: 2026-02-23  
> **Project Root**: `/Users/edhertzog/Documents/digital-anarchy`  
> **Hand-written Source Files**: 409 | **Lines of Code**: ~107,500  
> **Generated Code**: 34 files / ~8,250 lines (protobuf TS stubs, excluded from counts below)

---

## 1. Annotated Directory Tree

```
world-monitor/
│
├── index.html                          ← Vite SPA entry point
├── settings.html                       ← Standalone settings page entry
├── middleware.ts                        ← Vercel Edge Middleware (55 lines)
├── vite.config.ts                      ← Vite build config (1,057 lines)  ← key config
├── playwright.config.ts                ← E2E test config (40 lines)
├── tsconfig.json                       ← Root TypeScript config
├── tsconfig.api.json                   ← API-specific TS config
├── vercel.json                         ← Vercel deployment routing
├── Makefile                            ← Build/task runner shortcuts
├── package.json                        ← Dependencies & scripts
│
├── src/                                ── Frontend Application ──────────────────
│   ├── App.ts                          ← Main application class (4,628 lines)  ← LARGEST FILE
│   ├── main.ts                         ← SPA bootstrap entry (207 lines)
│   ├── settings-main.ts                ← Settings page entry (268 lines)
│   ├── pwa.d.ts                        ← PWA type declarations
│   ├── vite-env.d.ts                   ← Vite env type declarations
│   │
│   ├── components/                     ── UI Components ── 52 files, 22,883 lines
│   │   ├── index.ts                    ← Barrel export
│   │   ├── Map.ts                      ← Core map component (DeckGL integration)
│   │   ├── MapContainer.ts             ← Map wrapper & layout
│   │   ├── MapPopup.ts                 ← Map click/hover popups
│   │   ├── DeckGLMap.ts                ← DeckGL layer rendering
│   │   ├── Panel.ts                    ← Base panel component
│   │   ├── MonitorPanel.ts             ← Main monitoring dashboard
│   │   ├── WorldMonitorTab.ts          ← Tab navigation
│   │   ├── SearchModal.ts              ← Global search overlay
│   │   ├── StoryModal.ts              ← Story/report viewer modal
│   │   ├── SignalModal.ts              ← Signal detail modal
│   │   ├── PlaybackControl.ts          ← Temporal playback UI
│   │   ├── VirtualList.ts              ← Virtualized scrolling list
│   │   ├── LanguageSelector.ts         ← i18n language picker
│   │   ├── DownloadBanner.ts           ← Desktop download CTA
│   │   ├── MobileWarningModal.ts       ← Mobile viewport warning
│   │   ├── RuntimeConfigPanel.ts       ← Runtime config editor
│   │   ├── ServiceStatusPanel.ts       ← Backend health status
│   │   ├── VerificationChecklist.ts    ← Data verification UI
│   │   │
│   │   │   ── Domain Panels ──
│   │   ├── NewsPanel.ts                ← Breaking news feed
│   │   ├── LiveNewsPanel.ts            ← Live news ticker
│   │   ├── InsightsPanel.ts            ← AI-generated insights
│   │   ├── GdeltIntelPanel.ts          ← GDELT intelligence feed
│   │   ├── InvestmentsPanel.ts         ← FDI & investment tracking
│   │   ├── MarketPanel.ts              ← Financial markets
│   │   ├── ETFFlowsPanel.ts            ← ETF flow tracking
│   │   ├── StablecoinPanel.ts          ← Stablecoin monitoring
│   │   ├── MacroSignalsPanel.ts        ← Macro-economic signals
│   │   ├── EconomicPanel.ts            ← Economic indicators
│   │   ├── PredictionPanel.ts          ← Prediction markets
│   │   ├── DisplacementPanel.ts        ← Refugee/IDP tracking
│   │   ├── ClimateAnomalyPanel.ts      ← Climate anomaly display
│   │   ├── SatelliteFiresPanel.ts      ← FIRMS satellite fire data
│   │   ├── PopulationExposurePanel.ts  ← Population risk zones
│   │   ├── StrategicRiskPanel.ts       ← Strategic risk assessment
│   │   ├── StrategicPosturePanel.ts    ← Military posture
│   │   ├── CascadePanel.ts             ← Infrastructure cascade analysis
│   │   ├── CIIPanel.ts                 ← Critical infrastructure intel
│   │   ├── UcdpEventsPanel.ts          ← UCDP conflict events
│   │   ├── LiveWebcamsPanel.ts         ← Live webcam feeds
│   │   ├── GeoHubsPanel.ts             ← Geographic hub index
│   │   ├── TechHubsPanel.ts            ← Technology hub index
│   │   ├── TechEventsPanel.ts          ← Tech event tracking
│   │   ├── TechReadinessPanel.ts       ← Tech readiness scores
│   │   ├── RegulationPanel.ts          ← AI/tech regulation tracker
│   │   ├── PizzIntIndicator.ts         ← Pizza-based OSINT indicator
│   │   ├── CountryBriefPage.ts         ← Country brief view
│   │   ├── CountryIntelModal.ts        ← Country intelligence detail
│   │   ├── CountryTimeline.ts          ← Country event timeline
│   │   ├── IntelligenceGapBadge.ts     ← Intel coverage gap badge
│   │   ├── CommunityWidget.ts          ← Community engagement widget
│   │   └── StatusPanel.ts              ← System status display
│   │
│   ├── services/                       ── Business Logic & Data Services ── 78 files, 20,276 lines
│   │   ├── index.ts                    ← Barrel export / service registry
│   │   │
│   │   │   ── Domain Service Modules (each has index.ts) ──
│   │   ├── aviation/                   ← Flight & airspace tracking
│   │   ├── climate/                    ← Climate data & anomalies
│   │   ├── conflict/                   ← Armed conflict events
│   │   ├── cyber/                      ← Cyber threat intel
│   │   ├── displacement/               ← Refugee & IDP flows
│   │   ├── economic/                   ← Economic indicators
│   │   ├── infrastructure/             ← Infrastructure monitoring
│   │   ├── intelligence/               ← OSINT aggregation
│   │   ├── maritime/                   ← Ship tracking / AIS
│   │   ├── market/                     ← Financial market data
│   │   ├── military/                   ← Military activity
│   │   ├── news/                       ← News feed aggregation
│   │   ├── prediction/                 ← Prediction market data
│   │   ├── research/                   ← Research paper tracking
│   │   ├── unrest/                     ← Civil unrest events
│   │   └── wildfires/                  ← Wildfire tracking
│   │   │
│   │   │   ── Core Services ──
│   │   ├── runtime.ts                  ← Runtime environment detection
│   │   ├── runtime-config.ts           ← Dynamic runtime configuration
│   │   ├── analytics.ts                ← Usage analytics
│   │   ├── activity-tracker.ts         ← User activity tracking
│   │   ├── storage.ts                  ← LocalStorage abstraction
│   │   ├── persistent-cache.ts         ← IndexedDB persistent cache
│   │   ├── i18n.ts                     ← Internationalization service
│   │   ├── meta-tags.ts                ← SEO meta tag management
│   │   ├── tauri-bridge.ts             ← Tauri desktop IPC bridge
│   │   ├── desktop-readiness.ts        ← Desktop feature detection
│   │   │
│   │   │   ── Analysis & ML ──
│   │   ├── analysis-core.ts            ← Core analysis engine
│   │   ├── analysis-worker.ts          ← Web Worker analysis bridge
│   │   ├── parallel-analysis.ts        ← Parallel analysis orchestration
│   │   ├── ml-capabilities.ts          ← ML feature detection
│   │   ├── ml-worker.ts               ← ML Web Worker bridge
│   │   ├── clustering.ts               ← Event clustering algorithms
│   │   ├── correlation.ts              ← Cross-signal correlations
│   │   ├── entity-extraction.ts        ← NER entity extraction
│   │   ├── entity-index.ts             ← Entity search index
│   │   ├── summarization.ts            ← Text summarization
│   │   ├── threat-classifier.ts        ← Threat level classification
│   │   ├── signal-aggregator.ts        ← Multi-source signal fusion
│   │   ├── focal-point-detector.ts     ← Geographic focal point detection
│   │   ├── temporal-baseline.ts        ← Temporal baseline analysis
│   │   ├── velocity.ts                 ← Event velocity tracking
│   │   ├── trending-keywords.ts        ← Keyword trend detection
│   │   ├── hotspot-escalation.ts       ← Hotspot escalation detection
│   │   ├── cross-module-integration.ts ← Cross-domain analysis
│   │   │
│   │   │   ── Geographic & Mapping ──
│   │   ├── country-geometry.ts         ← Country polygon data
│   │   ├── country-instability.ts      ← Country instability index
│   │   ├── geo-activity.ts             ← Geographic activity heatmaps
│   │   ├── geo-convergence.ts          ← Geographic convergence analysis
│   │   ├── geo-hub-index.ts            ← Geographic hub scoring
│   │   ├── population-exposure.ts      ← Population exposure calculator
│   │   │
│   │   │   ── Data Source Integrations ──
│   │   ├── earthquakes.ts              ← USGS earthquake feed
│   │   ├── eonet.ts                    ← NASA EONET natural events
│   │   ├── gdacs.ts                    ← GDACS disaster alerts
│   │   ├── gdelt-intel.ts              ← GDELT event data
│   │   ├── live-news.ts                ← Live news API client
│   │   ├── rss.ts                      ← RSS feed parser
│   │   ├── weather.ts                  ← Weather data service
│   │   ├── wingbits.ts                 ← ADS-B aircraft data
│   │   ├── military-flights.ts         ← Military flight tracking
│   │   ├── military-surge.ts           ← Military surge detection
│   │   ├── military-vessels.ts         ← Naval vessel tracking
│   │   ├── cable-activity.ts           ← Undersea cable monitoring
│   │   ├── cable-health.ts             ← Cable health assessment
│   │   ├── usni-fleet.ts               ← USNI fleet tracker
│   │   ├── usa-spending.ts             ← USASpending.gov data
│   │   ├── investments-focus.ts        ← Investment focus analysis
│   │   ├── pizzint.ts                  ← Pizza delivery OSINT
│   │   ├── tech-activity.ts            ← Tech sector activity
│   │   ├── tech-hub-index.ts           ← Tech hub scoring
│   │   ├── data-freshness.ts           ← Data staleness detection
│   │   │
│   │   │   ── Content & Sharing ──
│   │   ├── story-data.ts               ← Story data management
│   │   ├── story-renderer.ts           ← Story HTML rendering
│   │   ├── story-share.ts              ← Story sharing/export
│   │   ├── related-assets.ts           ← Related content mapping
│   │   └── cached-risk-scores.ts       ← Cached risk score lookups
│   │
│   ├── config/                         ── Static Configuration ── 28 files, 14,134 lines
│   │   ├── index.ts                    ← Config barrel export
│   │   ├── geo.ts                      ← Geographic coord/boundary data
│   │   ├── countries.ts                ← Country metadata & codes
│   │   ├── entities.ts                 ← Named entity registry
│   │   ├── feeds.ts                    ← RSS/data feed URLs
│   │   ├── markets.ts                  ← Financial market definitions
│   │   ├── finance-geo.ts              ← Financial geography mapping
│   │   ├── military.ts                 ← Military base/asset data
│   │   ├── airports.ts                 ← Airport coordinates
│   │   ├── ports.ts                    ← Port coordinates
│   │   ├── pipelines.ts                ← Pipeline route data
│   │   ├── bases-expanded.ts           ← Expanded military base catalog
│   │   ├── ai-datacenters.ts           ← AI datacenter locations
│   │   ├── ai-regulations.ts           ← AI regulation database
│   │   ├── ai-research-labs.ts         ← AI research lab locations
│   │   ├── startup-ecosystems.ts       ← Startup ecosystem data
│   │   ├── tech-companies.ts           ← Tech company registry
│   │   ├── tech-geo.ts                 ← Tech geography mapping
│   │   ├── gulf-fdi.ts                 ← Gulf FDI dataset
│   │   ├── irradiators.ts              ← Gamma irradiator locations
│   │   ├── panels.ts                   ← Panel layout configuration
│   │   ├── ml-config.ts                ← ML model configuration
│   │   ├── beta.ts                     ← Beta feature flags
│   │   ├── variant.ts                  ← Build variant selector
│   │   └── variants/                   ── Build Variant Definitions ──
│   │       ├── base.ts                 ← Base variant (minimal)
│   │       ├── full.ts                 ← Full variant (all features)
│   │       ├── finance.ts              ← Finance-only variant
│   │       └── tech.ts                 ← Tech-only variant
│   │
│   ├── utils/                          ── Utility Functions ── 11 files, 1,490 lines
│   │   ├── index.ts                    ← Barrel export
│   │   ├── proxy.ts                    ← API proxy helper
│   │   ├── circuit-breaker.ts          ← Circuit breaker pattern
│   │   ├── dom-utils.ts                ← DOM manipulation helpers
│   │   ├── export.ts                   ← Data export (CSV/JSON)
│   │   ├── reverse-geocode.ts          ← Reverse geocoding utility
│   │   ├── sanitize.ts                 ← HTML/input sanitization
│   │   ├── theme-colors.ts             ← Theme color constants
│   │   ├── theme-manager.ts            ← Dark/light theme manager
│   │   ├── urlState.ts                 ← URL state serialization
│   │   └── analysis-constants.ts       ← Analysis threshold constants
│   │
│   ├── types/                          ── TypeScript Type Definitions ── 1 file, 1,275 lines
│   │   └── index.ts                    ← All shared type definitions
│   │
│   ├── workers/                        ── Web Workers ── 2 files, 523 lines
│   │   ├── analysis.worker.ts          ← Background analysis worker
│   │   └── ml.worker.ts               ← Background ML inference worker
│   │
│   ├── bootstrap/                      ── App Bootstrap ── 1 file, 43 lines
│   │   └── chunk-reload.ts             ← Chunk loading failure recovery
│   │
│   ├── styles/                         ── CSS Stylesheets ── 5 files, 15,671 lines
│   │   ├── main.css                    ← Primary application styles  ← largest
│   │   ├── panels.css                  ← Panel layout styles
│   │   ├── settings-window.css         ← Settings page styles
│   │   ├── lang-switcher.css           ← Language selector styles
│   │   └── rtl-overrides.css           ← Right-to-left language fixes
│   │
│   ├── locales/                        ── i18n Translations ── 17 JSON files (~1,800 lines each)
│   │   ├── en.json                     ← English (primary, 1,820 lines)
│   │   ├── ar.json                     ← Arabic (+ .d.ts)
│   │   ├── de.json                     ← German
│   │   ├── el.json                     ← Greek
│   │   ├── es.json                     ← Spanish (+ .d.ts)
│   │   ├── fr.json                     ← French
│   │   ├── it.json                     ← Italian (+ .d.ts)
│   │   ├── ja.json                     ← Japanese
│   │   ├── nl.json                     ← Dutch (+ .d.ts)
│   │   ├── pl.json                     ← Polish (+ .d.ts)
│   │   ├── pt.json                     ← Portuguese (+ .d.ts)
│   │   ├── ru.json                     ← Russian (+ .d.ts)
│   │   ├── sv.json                     ← Swedish (+ .d.ts)
│   │   ├── th.json                     ← Thai (+ .d.ts)
│   │   ├── tr.json                     ← Turkish (+ .d.ts)
│   │   ├── vi.json                     ← Vietnamese (+ .d.ts)
│   │   └── zh.json                     ← Chinese (+ .d.ts)
│   │
│   ├── e2e/                            ── In-Browser Test Harnesses ── 3 files, 1,592 lines
│   │   ├── map-harness.ts              ← Map component test harness
│   │   ├── mobile-map-harness.ts       ← Mobile map test harness
│   │   └── mobile-map-integration-harness.ts ← Mobile integration harness
│   │
│   └── generated/                      ── Generated Protobuf Stubs ── 34 files, 8,253 lines
│       ├── client/worldmonitor/        ← Client-side RPC stubs (17 domains)
│       └── server/worldmonitor/        ← Server-side RPC stubs (17 domains)
│
├── server/                             ── Backend Server (Hono/Connect-ES) ───────
│   ├── router.ts                       ← Main API router (routes all domains)
│   ├── cors.ts                         ← CORS configuration
│   ├── error-mapper.ts                 ← Error code mapping
│   │
│   ├── _shared/                        ── Shared Server Utilities ── 3 files, 93 lines
│   │   ├── constants.ts                ← Server-wide constants
│   │   ├── hash.ts                     ← Hashing utilities
│   │   └── redis.ts                    ← Redis client wrapper
│   │
│   └── worldmonitor/                   ── Domain RPC Handlers ── 72 files, 9,180 lines
│       ├── aviation/v1/                ← 3 handlers: flight tracking
│       ├── climate/v1/                 ← 2 handlers: climate data
│       ├── conflict/v1/                ← 4 handlers: conflict events
│       ├── cyber/v1/                   ← 3 handlers: cyber threats
│       ├── displacement/v1/            ← 3 handlers: displacement data
│       ├── economic/v1/                ← 6 handlers: economic indicators
│       ├── infrastructure/v1/          ← 7 handlers: infra monitoring
│       ├── intelligence/v1/            ← 7 handlers: OSINT intel
│       ├── maritime/v1/                ← 3 handlers: maritime tracking
│       ├── market/v1/                  ← 9 handlers: market data  ← most handlers
│       ├── military/v1/                ← 8 handlers: military intel
│       ├── news/v1/                    ← 3 handlers: news feeds
│       ├── prediction/v1/              ← 2 handlers: prediction markets
│       ├── research/v1/                ← 5 handlers: research papers
│       ├── seismology/v1/              ← 2 handlers: seismic events
│       ├── unrest/v1/                  ← 3 handlers: civil unrest
│       └── wildfire/v1/                ← 2 handlers: wildfire data
│
├── proto/                              ── Protobuf Schema Definitions ── 93 files, 3,977 lines
│   ├── buf.gen.yaml                    ← Buf code generation config
│   ├── buf.yaml                        ← Buf module config
│   ├── sebuf/http/                     ← HTTP annotation helpers
│   │   └── annotations.proto
│   └── worldmonitor/                   ── Domain Proto Definitions ──
│       ├── core/v1/                    ← 8 protos: shared types, enums, common messages
│       ├── aviation/v1/                ← 3 protos
│       ├── climate/v1/                 ← 3 protos
│       ├── conflict/v1/                ← 7 protos
│       ├── cyber/v1/                   ← 3 protos
│       ├── displacement/v1/            ← 4 protos
│       ├── economic/v1/                ← 6 protos
│       ├── infrastructure/v1/          ← 7 protos
│       ├── intelligence/v1/            ← 7 protos
│       ├── maritime/v1/                ← 4 protos
│       ├── market/v1/                  ← 9 protos  ← most definitions
│       ├── military/v1/                ← 10 protos  ← most definitions
│       ├── news/v1/                    ← 3 protos
│       ├── prediction/v1/              ← 3 protos
│       ├── research/v1/                ← 6 protos
│       ├── seismology/v1/              ← 3 protos
│       ├── unrest/v1/                  ← 3 protos
│       └── wildfire/v1/                ← 3 protos
│
├── api/                                ── Vercel Serverless Functions ── 17 files, 1,988 lines
│   ├── _api-key.js                     ← API key validation middleware
│   ├── _cors.js                        ← CORS helper for serverless
│   ├── _cors.test.mjs                  ← CORS tests
│   ├── download.js                     ← Desktop download redirect
│   ├── fwdstart.js                     ← Forward-start endpoint
│   ├── og-story.js                     ← Open Graph story renderer
│   ├── og-story.test.mjs              ← OG story tests
│   ├── register-interest.js            ← Interest registration handler
│   ├── rss-proxy.js                    ← RSS feed proxy
│   ├── story.js                        ← Story API endpoint
│   ├── version.js                      ← Version info endpoint
│   ├── [domain]/v1/
│   │   └── [rpc].ts                    ← Dynamic domain RPC router  ← key file
│   ├── data/
│   │   └── city-coords.ts              ← City coordinate lookup
│   ├── eia/
│   │   └── [[...path]].js              ← EIA data proxy (catch-all)
│   └── youtube/
│       ├── embed.js                    ← YouTube embed proxy
│       ├── embed.test.mjs             ← Embed tests
│       └── live.js                     ← YouTube live stream proxy
│
├── src-tauri/                          ── Tauri Desktop Shell ── 976 lines Rust
│   ├── Cargo.toml                      ← Rust dependencies
│   ├── Cargo.lock                      ← Dependency lock
│   ├── build.rs                        ← Build script
│   ├── tauri.conf.json                 ← Main Tauri config
│   ├── tauri.finance.conf.json         ← Finance variant config
│   ├── tauri.tech.conf.json            ← Tech variant config
│   ├── capabilities/
│   │   └── default.json                ← Tauri permission capabilities
│   ├── icons/                          ← App icons (Android, iOS, desktop)
│   │   ├── android/mipmap-*/           ← Android density variants
│   │   └── ios/                        ← iOS icon set
│   ├── sidecar/                        ── Node.js Sidecar Process ──
│   │   ├── local-api-server.mjs        ← Local API server for desktop
│   │   ├── local-api-server.test.mjs   ← Sidecar tests
│   │   ├── package.json                ← Sidecar dependencies
│   │   └── node/                       ← Bundled Node.js runtime
│   └── src/
│       └── main.rs                     ← Rust entry point (976 lines)  ← desktop shell
│
├── convex/                             ── Convex Backend (BaaS) ── 2 files, 44 lines
│   ├── schema.ts                       ← Convex database schema
│   ├── registerInterest.ts             ← Interest registration mutation
│   └── tsconfig.json                   ← Convex TS config
│
├── e2e/                                ── Playwright E2E Tests ── 5 files
│   ├── investments-panel.spec.ts       ← Investment panel E2E
│   ├── keyword-spike-flow.spec.ts      ← Keyword spike flow E2E
│   ├── map-harness.spec.ts             ← Map component E2E
│   ├── mobile-map-popup.spec.ts        ← Mobile popup E2E
│   ├── runtime-fetch.spec.ts           ← Runtime fetch E2E
│   └── map-harness.spec.ts-snapshots/  ← Visual regression baselines
│
├── tests/                              ── Unit & Integration Tests ──
│   ├── countries-geojson.test.mjs      ← GeoJSON data validation
│   ├── deploy-config.test.mjs          ← Deployment config tests
│   ├── gulf-fdi-data.test.mjs          ← Gulf FDI data tests
│   ├── server-handlers.test.mjs        ← Server handler tests
│   ├── map-harness.html                ← Browser test harness
│   ├── mobile-map-harness.html         ← Mobile browser harness
│   ├── mobile-map-integration-harness.html ← Mobile integration harness
│   └── runtime-harness.html            ← Runtime test harness
│
├── scripts/                            ── Build & Dev Scripts ── 5 files, 1,958 lines
│   ├── ais-relay.cjs                   ← AIS data relay server
│   ├── build-sidecar-sebuf.mjs         ← Sidecar protobuf builder
│   ├── desktop-package.mjs             ← Desktop packaging script
│   ├── download-node.sh                ← Node.js binary downloader
│   ├── sync-desktop-version.mjs        ← Desktop version synchronizer
│   └── package.json                    ← Script-specific dependencies
│
├── public/                             ── Static Assets ──
│   ├── favicon.ico                     ← Site favicon
│   ├── offline.html                    ← PWA offline fallback
│   ├── robots.txt                      ← Search engine directives
│   ├── llms.txt                        ← LLM context (short)
│   ├── llms-full.txt                   ← LLM context (full)
│   ├── data/
│   │   └── countries.geojson           ← Country boundary polygons
│   └── favico/                         ← Favicon variants & OG image
│       ├── og-image.png
│       ├── worldmonitor-icon-1024.png
│       └── ... (density variants)
│
├── data/                               ── Raw Data Files ──
│   ├── gamma-irradiators-raw.json      ← Raw irradiator data
│   └── gamma-irradiators.json          ← Processed irradiator data
│
├── deploy/                             ── Deployment Config ──
│   └── nginx/
│       └── brotli-api-proxy.conf       ← Nginx Brotli proxy config
│
├── docs/                               ── Project Documentation ──
│   ├── architecture.md                 ← System architecture overview
│   ├── project-overview.md             ← Project overview
│   ├── ADDING_ENDPOINTS.md             ← Guide: adding new endpoints
│   ├── API_KEY_DEPLOYMENT.md           ← API key deployment guide
│   ├── DESKTOP_CONFIGURATION.md        ← Desktop config guide
│   ├── RELEASE_PACKAGING.md            ← Release packaging guide
│   ├── DOCUMENTATION.md                ← Documentation standards
│   ├── COMMUNITY-PROMOTION-GUIDE.md    ← Community promotion guide
│   ├── TAURI_VALIDATION_REPORT.md      ← Tauri validation results
│   ├── local-backend-audit.md          ← Local backend audit
│   ├── project-scan-report.json        ← Automated scan results
│   └── api/                            ── OpenAPI Specifications ──
│       ├── AviationService.openapi.{json,yaml}
│       ├── ClimateService.openapi.{json,yaml}
│       ├── ConflictService.openapi.{json,yaml}
│       ├── CyberService.openapi.{json,yaml}
│       ├── DisplacementService.openapi.{json,yaml}
│       ├── EconomicService.openapi.{json,yaml}
│       ├── InfrastructureService.openapi.{json,yaml}
│       ├── IntelligenceService.openapi.{json,yaml}
│       ├── MaritimeService.openapi.{json,yaml}
│       ├── MarketService.openapi.{json,yaml}
│       ├── MilitaryService.openapi.{json,yaml}
│       ├── NewsService.openapi.{json,yaml}
│       ├── PredictionService.openapi.{json,yaml}
│       ├── ResearchService.openapi.{json,yaml}
│       ├── SeismologyService.openapi.{json,yaml}
│       ├── UnrestService.openapi.{json,yaml}
│       └── WildfireService.openapi.{json,yaml}
│
└── .github/                            ── GitHub Configuration ──
    ├── copilot-instructions.md         ← Copilot project instructions
    ├── pull_request_template.md        ← PR template
    ├── ISSUE_TEMPLATE/                 ← Issue templates (bug, feature, data source)
    ├── workflows/                      ← CI/CD (lint.yml, build-desktop.yml)
    ├── agents/                         ← BMAD agent definitions (20 agents)
    └── prompts/                        ← BMAD prompt definitions (70+ prompts)
```

---

## 2. Code Distribution Summary

### By Directory (Hand-Written Code Only)

| Directory | Files | Lines | % of Total | Language | Role |
|-----------|------:|------:|-----------:|----------|------|
| `src/components/` | 52 | 22,883 | 21.3% | TypeScript | UI components |
| `src/services/` | 78 | 20,276 | 18.9% | TypeScript | Business logic & data |
| `src/styles/` | 5 | 15,671 | 14.6% | CSS | Stylesheets |
| `src/config/` | 28 | 14,134 | 13.1% | TypeScript | Static configuration data |
| `server/worldmonitor/` | 72 | 9,180 | 8.5% | TypeScript | Backend RPC handlers |
| `src/App.ts` (root) | 1 | 4,628 | 4.3% | TypeScript | Main application class |
| `proto/` | 93 | 3,977 | 3.7% | Protobuf | API schema definitions |
| `tests/` + `e2e/` | 9 | 2,694 | 2.5% | TS/MJS | Test suites |
| `api/` | 17 | 1,988 | 1.8% | JS/TS | Vercel serverless functions |
| `scripts/` | 5 | 1,958 | 1.8% | MJS/CJS/SH | Build & dev scripts |
| `src/e2e/` | 3 | 1,592 | 1.5% | TypeScript | In-browser test harnesses |
| `src/utils/` | 11 | 1,490 | 1.4% | TypeScript | Utility functions |
| `src/types/` | 1 | 1,275 | 1.2% | TypeScript | Shared type definitions |
| `vite.config.ts` (root) | 1 | 1,057 | 1.0% | TypeScript | Build configuration |
| `src-tauri/src/` | 1 | 976 | 0.9% | Rust | Desktop shell |
| `src/workers/` | 2 | 523 | 0.5% | TypeScript | Web Workers |
| `server/` (root + shared) | 6 | 253 | 0.2% | TypeScript | Server infra |
| `src/main.ts` + others | 3 | 518 | 0.5% | TypeScript | Entry points |
| `middleware.ts` (root) | 1 | 55 | <0.1% | TypeScript | Edge middleware |
| `convex/` | 2 | 44 | <0.1% | TypeScript | Convex BaaS |
| `src/bootstrap/` | 1 | 43 | <0.1% | TypeScript | App bootstrap |
| **TOTAL** | **409** | **~107,500** | **100%** | | |

### Supplementary Assets (Not in Line Count)

| Asset | Count | Notes |
|-------|------:|-------|
| Locale JSON files | 17 | ~1,800 lines each, ~30,600 total |
| Generated TS stubs | 34 | ~8,253 lines (protobuf client/server) |
| OpenAPI specs | 34 | 17 services × JSON + YAML |
| Static data files | 3 | GeoJSON, irradiator JSON |
| HTML entry/harness | 6 | index.html, settings.html, test harnesses |

---

## 3. Architecture by Layer

### Frontend Layer (`src/`)

| Sub-layer | Key Directories | Description |
|-----------|----------------|-------------|
| **Entry Points** | `main.ts`, `settings-main.ts`, `App.ts` | SPA bootstrap and main application class. `App.ts` at 4,628 lines is the application orchestrator — manages panels, map, services, and state. |
| **Components** | `src/components/` | 52 Vanilla TypeScript UI components (no framework). Each component is a single `.ts` file creating DOM elements directly. Panels are the primary UI pattern. |
| **Services** | `src/services/` | 78 service files organized by domain. 16 domain subdirectories mirror the protobuf schema. Core services handle analysis, ML, caching, and cross-cutting concerns. |
| **Configuration** | `src/config/` | 28 static data files — geographic coordinates, entity registries, market definitions. Build variants (`variants/`) control which features are bundled. |
| **Styling** | `src/styles/` | 5 CSS files totaling 15,671 lines. `main.css` is the primary stylesheet. RTL support included. |
| **Workers** | `src/workers/` | 2 Web Workers for background analysis and ML inference, keeping the main thread responsive. |
| **i18n** | `src/locales/` | 17 languages with ~1,800 keys each. Type declaration files (`.d.ts`) for type-safe translations. |

### Backend Layer (`server/` + `api/`)

| Sub-layer | Key Directories | Description |
|-----------|----------------|-------------|
| **RPC Handlers** | `server/worldmonitor/` | 72 TypeScript handlers organized by domain/version. Uses Connect-ES (protobuf-based RPC). Each domain has its own `v1/` directory. |
| **Server Infra** | `server/router.ts`, `cors.ts`, `error-mapper.ts` | Hono-based router mounts all domain handlers. Shared utilities in `_shared/` (Redis, hashing). |
| **Serverless API** | `api/` | 17 Vercel serverless functions. `[domain]/v1/[rpc].ts` is the dynamic router that forwards to Connect-ES handlers. Legacy endpoints for RSS proxy, OG images, YouTube embeds. |
| **Edge** | `middleware.ts` | Vercel Edge Middleware for request preprocessing. |

### Schema Layer (`proto/`)

| Sub-layer | Key Directories | Description |
|-----------|----------------|-------------|
| **Protobuf Definitions** | `proto/worldmonitor/` | 93 `.proto` files across 18 domains (17 feature domains + `core`). Uses Buf for code generation. Core domain defines shared types, enums, and common messages. |
| **Generated Code** | `src/generated/` | 34 TypeScript files auto-generated from protos. Client stubs for frontend, server stubs for backend. |

### Desktop Layer (`src-tauri/`)

| Sub-layer | Key Directories | Description |
|-----------|----------------|-------------|
| **Rust Shell** | `src-tauri/src/main.rs` | 976-line Tauri v2 desktop wrapper. Handles native window, system tray, IPC commands. |
| **Sidecar** | `src-tauri/sidecar/` | Node.js sidecar process runs a local API server for offline/desktop mode. |
| **Variants** | `tauri.*.conf.json` | Separate Tauri configs for full, finance, and tech desktop builds. |

---

## 4. Domain Coverage (17 Monitoring Domains)

Each domain spans the full stack: **proto → generated → server handler → frontend service → UI panel**.

| Domain | Proto Files | Server Handlers | Frontend Service | Key Panel(s) |
|--------|:----------:|:---------------:|:----------------:|-------------|
| Aviation | 3 | 3 | `aviation/` | Military flights, ADS-B |
| Climate | 3 | 2 | `climate/` | `ClimateAnomalyPanel` |
| Conflict | 7 | 4 | `conflict/` | `UcdpEventsPanel` |
| Cyber | 3 | 3 | `cyber/` | — |
| Displacement | 4 | 3 | `displacement/` | `DisplacementPanel` |
| Economic | 6 | 6 | `economic/` | `EconomicPanel`, `MacroSignalsPanel` |
| Infrastructure | 7 | 7 | `infrastructure/` | `CascadePanel`, `CIIPanel` |
| Intelligence | 7 | 7 | `intelligence/` | `GdeltIntelPanel`, `InsightsPanel` |
| Maritime | 4 | 3 | `maritime/` | AIS tracking |
| Market | 9 | 9 | `market/` | `MarketPanel`, `ETFFlowsPanel`, `StablecoinPanel` |
| Military | 10 | 8 | `military/` | `StrategicPosturePanel` |
| News | 3 | 3 | `news/` | `NewsPanel`, `LiveNewsPanel` |
| Prediction | 3 | 2 | `prediction/` | `PredictionPanel` |
| Research | 6 | 5 | `research/` | — |
| Seismology | 3 | 2 | *(via earthquakes.ts)* | — |
| Unrest | 3 | 3 | `unrest/` | — |
| Wildfire | 3 | 2 | `wildfires/` | `SatelliteFiresPanel` |

---

## 5. Critical Files & Hot Spots

| File | Lines | Why It Matters |
|------|------:|---------------|
| `src/App.ts` | 4,628 | **Central orchestrator** — manages all panels, map integration, service lifecycle, and state. Largest single file; refactoring candidate. |
| `src/types/index.ts` | 1,275 | **Sole type definitions file** — all shared interfaces and types in one file. |
| `vite.config.ts` | 1,057 | **Complex build config** — handles variant builds, PWA, sidecar, proxy rules. |
| `server/router.ts` | ~100 | **API gateway** — mounts all 17 domain handlers onto the Hono router. |
| `api/[domain]/v1/[rpc].ts` | ~50 | **Dynamic serverless router** — maps any domain/RPC to backend handlers. |
| `src-tauri/src/main.rs` | 976 | **Desktop shell** — Tauri commands, window management, system integration. |
| `src/config/geo.ts` | — | **Geographic data** — boundary coords, region definitions; drives map rendering. |
| `src/services/analysis-core.ts` | — | **Analysis engine** — core risk scoring, event correlation, threat classification. |

---

## 6. Build Variants

The project supports multiple build variants via `src/config/variants/`:

| Variant | Config | Description |
|---------|--------|-------------|
| **Full** | `variants/full.ts` | All 17 domains, all panels, all features |
| **Finance** | `variants/finance.ts` | Market, economic, investment panels only |
| **Tech** | `variants/tech.ts` | Tech hubs, AI, research panels only |
| **Base** | `variants/base.ts` | Minimal core (map + news) |

Desktop builds use matching Tauri configs: `tauri.conf.json`, `tauri.finance.conf.json`, `tauri.tech.conf.json`.

---

## 7. Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla TypeScript (no framework), DeckGL, Mapbox GL |
| Styling | Plain CSS (15,671 lines) |
| Build | Vite, TypeScript |
| API Schema | Protocol Buffers (Buf), Connect-ES |
| Backend | Hono (server), Vercel Serverless (deployment) |
| Desktop | Tauri v2 (Rust shell), Node.js sidecar |
| Database | Convex (BaaS), Redis (caching) |
| Testing | Playwright (E2E), Vitest/Node test runner (unit) |
| i18n | 17 languages, custom i18n service |
| PWA | Service worker, offline fallback |
| CI/CD | GitHub Actions (lint, desktop build) |
