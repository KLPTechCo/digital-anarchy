# World Monitor — UI Components & Services Inventory

> Generated: 2026-02-23 | Source: `/src/` (~75,615 lines TypeScript)

---

## A) Component Inventory (52 files, 22,883 lines)

| # | Component | Category | Lines | Purpose | Key Dependencies |
|---|-----------|----------|-------|---------|-----------------|
| 1 | `App` (orchestrator) | Layout | 4,629 | Main application orchestrator — composes all components, data fetching loops, panel/map coordination | All components, all services, config |
| 2 | `Panel` | Utility | 473 | Base class for all panels — collapsible container with header, count badge, loading/error states, resize handles | `runtime`, `tauri-bridge`, `i18n`, `analytics` |
| 3 | `MapContainer` | Map | 579 | Conditional map renderer — `DeckGLMap` (WebGL) on desktop, `Map` (D3/SVG) on mobile | `Map`, `DeckGLMap`, `isMobileDevice` |
| 4 | `DeckGLMap` | Map | 3,905 | WebGL-accelerated map via deck.gl + maplibre-gl with Supercluster — renders all geospatial layers | `@deck.gl/*`, `maplibre-gl`, `Supercluster`, 30+ type imports |
| 5 | `Map` (D3/SVG) | Map | 3,513 | D3/SVG fallback map for mobile — renders TopoJSON world with overlays | `d3`, `topojson-client`, config/geo, all overlay types |
| 6 | `MapPopup` | Map | 2,549 | Popup overlays for every map entity type (50+ popup types) | `gdelt-intel`, `hotspot-escalation`, `cable-health`, `i18n` |
| 7 | `NewsPanel` | Feed | 614 | Clustered/chronological news feed with virtual scroll, velocity bar, sentiment, ML enrichment, summaries | `Panel`, `VirtualList`, `threat-classifier`, `rss`, `velocity`, `summarization` |
| 8 | `LiveNewsPanel` | Feed | 708 | YouTube live news embed (Al Jazeera, Sky, BBC, etc.) with auto-play/mute | `Panel`, `live-news`, `runtime`, `i18n` |
| 9 | `InsightsPanel` | Intelligence | 633 | AI-generated world brief + missed stories + convergence zones + focal points | `Panel`, `ml-worker`, `summarization`, `parallel-analysis`, `signal-aggregator`, `focal-point-detector` |
| 10 | `CountryBriefPage` | Intelligence | 638 | Full-page country intelligence dossier with CII, signals, predictions, nearby assets, news, exports | `country-instability`, `prediction`, `related-assets`, `investments-focus` |
| 11 | `CountryIntelModal` | Modal | 283 | AI-generated intelligence brief modal on country click | `i18n`, CII types, prediction types |
| 12 | `RuntimeConfigPanel` | Panel | 603 | Desktop API key management + feature toggles + secret verification | `Panel`, `runtime-config`, `tauri-bridge`, `runtime`, `analytics` |
| 13 | `StrategicPosturePanel` | Panel | 519 | Military theater posture — NAVEUR/CENTCOM/INDOPACOM readiness, vessel overlays | `Panel`, `cached-theater-posture`, `military-vessels`, `military-surge` |
| 14 | `StrategicRiskPanel` | Panel | 496 | Strategic risk overview — unified alerts, geo-convergence, data freshness, CII learning | `Panel`, `cross-module-integration`, `geo-convergence`, `data-freshness`, `country-instability`, `cached-risk-scores` |
| 15 | `IntelligenceGapBadge` | Widget | 525 | Floating findings badge — correlates signals + alerts into unified intelligence findings | `correlation`, `cross-module-integration`, `analytics` |
| 16 | `VirtualList` | Utility | 407 | Virtual scrolling with DOM recycling for large lists | None (standalone) |
| 17 | `SearchModal` | Modal | 378 | Global search across countries, news, markets, infrastructure, tech entities | `analytics` |
| 18 | `LiveWebcamsPanel` | Panel | 345 | YouTube live webcam feeds from strategic locations worldwide | `Panel`, `runtime`, `analytics` |
| 19 | `SignalModal` | Modal | 331 | Correlation signal display with audio alerts and location click-through | `correlation`, `cross-module-integration`, `trending-keywords` |
| 20 | `RegulationPanel` | Panel | 320 | AI regulation tracker — timeline, deadlines, country profiles | `Panel`, `config/regulations` |
| 21 | `CascadePanel` | Panel | 270 | Infrastructure cascade simulator — dependency graph + failure propagation | `Panel`, `infrastructure-cascade` |
| 22 | `CountryTimeline` | Visualization | 285 | D3 timeline of events by lane (protest/conflict/natural/military) | `d3`, `i18n` |
| 23 | `StatusPanel` | Panel | 246 | Feed and API health status dashboard | config, variant-aware |
| 24 | `MacroSignalsPanel` | Panel | 245 | Macro economic signals — liquidity, flow, technical, fear/greed, hash rate | `Panel`, `EconomicServiceClient` (sebuf) |
| 25 | `TechEventsPanel` | Panel | 239 | Tech conferences, earnings, events calendar | `Panel`, `ResearchServiceClient` (sebuf) |
| 26 | `InvestmentsPanel` | Panel | 229 | Gulf FDI investment tracker with filters (country, sector, entity, status) | `Panel`, `config/gulf-fdi` |
| 27 | `ServiceStatusPanel` | Panel | 224 | Cloud/dev/comm/AI/SaaS service status with category filters + desktop readiness | `Panel`, `desktop-readiness`, `infrastructure` |
| 28 | `EconomicPanel` | Panel | 223 | FRED indicators, oil analytics, USASpending tabs | `Panel`, `economic`, `usa-spending` |
| 29 | `StoryModal` | Modal | 176 | Story image generator + share modal (canvas render + deep link + social share) | `story-data`, `story-renderer`, `story-share` |
| 30 | `PlaybackControl` | Widget | 177 | Historical snapshot playback with slider timeline | `storage` |
| 31 | `MonitorPanel` | Panel | 173 | Custom keyword monitors with color coding and match highlights | `Panel`, `config/monitors` |
| 32 | `VerificationChecklist` | Widget | 166 | Preact-based OSINT verification checklist (8-point check) | `preact`, `i18n` |
| 33 | `PizzIntIndicator` | Widget | 162 | DEFCON-style PizzINT indicator with GDELT tensions | `i18n` |
| 34 | `WorldMonitorTab` | Form | 154 | Settings tab — API key + waitlist registration | `runtime-config`, `runtime` |
| 35 | `MarketPanel` | Panel | 151 | Stock market quotes with sparklines | `Panel`, `i18n` |
| 36 | `TechHubsPanel` | Panel | 146 | Tech hub activity radar with country flags | `Panel`, `tech-activity` |
| 37 | `TechReadinessPanel` | Panel | 146 | Tech readiness rankings by country (R&D spend, patents, digital infra) | `Panel`, `economic` |
| 38 | `ETFFlowsPanel` | Panel | 145 | ETF fund flow data (BTC/ETH/equity ETFs) | `Panel`, `MarketServiceClient` (sebuf) |
| 39 | `StablecoinPanel` | Panel | 138 | Stablecoin market health — peg monitoring, market cap | `Panel`, `MarketServiceClient` (sebuf) |
| 40 | `GdeltIntelPanel` | Panel | 137 | GDELT DOC API intelligence topics with tabbed browsing | `Panel`, `gdelt-intel` |
| 41 | `DisplacementPanel` | Panel | 137 | UNHCR displacement data — origin/host country tabs | `Panel`, `displacement` |
| 42 | `CIIPanel` | Panel | 135 | Country Instability Index dashboard — tier-ranked scores | `Panel`, `country-instability` |
| 43 | `DownloadBanner` | Widget | 132 | Desktop app download CTA with platform detection | `runtime`, `analytics` |
| 44 | `UcdpEventsPanel` | Panel | 126 | UCDP conflict events with type tabs (state-based/non-state/one-sided) | `Panel` |
| 45 | `GeoHubsPanel` | Panel | 123 | Geopolitical hub activity radar | `Panel`, `geo-activity` |
| 46 | `LanguageSelector` | Navigation | 111 | Custom language dropdown with flag icons (17 languages) | `i18n`, `analytics` |
| 47 | `SatelliteFiresPanel` | Panel | 99 | Active fires by region from FIRMS/VIIRS | `Panel`, `wildfires` |
| 48 | `ClimateAnomalyPanel` | Panel | 81 | Climate anomaly display (temp/precip delta) | `Panel`, `climate` |
| 49 | `MobileWarningModal` | Modal | 78 | Mobile experience warning with dismiss/remember | `i18n` |
| 50 | `PopulationExposurePanel` | Panel | 77 | Population exposure to conflict/disaster events | `Panel`, `population-exposure` |
| 51 | `PredictionPanel` | Panel | 58 | Polymarket prediction market probabilities | `Panel`, `prediction` |
| 52 | `CommunityWidget` | Widget | 35 | Floating community discussion CTA | `i18n` |
| — | `index.ts` (barrel) | Utility | 40 | Re-exports all components | — |

### Component Category Summary

| Category | Count | Total Lines |
|----------|-------|-------------|
| Map | 4 | 10,546 |
| Panel | 27 | 7,581 |
| Intelligence | 2 | 1,271 |
| Feed | 2 | 1,322 |
| Modal | 4 | 1,168 |
| Widget | 6 | 1,096 |
| Visualization | 1 | 285 |
| Navigation | 1 | 111 |
| Form | 1 | 154 |
| Utility | 3 | 920 |
| Orchestrator | 1 | 4,629 |

---

## B) Services Inventory (79 files, 20,276 lines)

### Data Fetching Services

| # | Service | Lines | Purpose | External APIs / Proto Clients |
|---|---------|-------|---------|-------------------------------|
| 1 | `rss` | 325 | RSS feed fetching with circuit breakers, caching, AI classification | RSS proxy, DOMParser |
| 2 | `live-news` | 25 | YouTube live video ID resolution | `/api/youtube/live` |
| 3 | `earthquakes` | 21 | Re-export (now via sebuf) | — |
| 4 | `weather` | 112 | NWS weather alerts with circuit breaker | NWS API |
| 5 | `gdacs` | 114 | GDACS disaster alert system events | GDACS GeoJSON |
| 6 | `eonet` | 173 | NASA EONET natural events + GDACS merge | NASA EONET API |
| 7 | `gdelt-intel` | 196 | GDELT DOC API intelligence topics | `IntelligenceServiceClient` |
| 8 | `wingbits` | 382 | Aircraft details enrichment for military classification | `MilitaryServiceClient` |
| 9 | `usni-fleet` | 222 | USNI fleet tracker report | `MilitaryServiceClient` |
| 10 | `usa-spending` | 181 | Federal government contracts/awards | USASpending.gov API |
| 11 | `pizzint` | 135 | DEFCON-style status + GDELT tensions | `IntelligenceServiceClient` |
| 12 | `story-data` | 161 | Collects data for shareable story images | CII, clusters |

### Domain-Module Services (sebuf RPC clients)

| # | Service | Lines | Purpose | Proto Client |
|---|---------|-------|---------|--------------|
| 13 | `aviation/` | 105 | Airport delay alerts (FAA/Eurocontrol) | `AviationServiceClient` |
| 14 | `climate/` | 93 | Climate anomaly data | `ClimateServiceClient` |
| 15 | `conflict/` | 370 | ACLED conflicts + UCDP events + HAPI summaries | `ConflictServiceClient` |
| 16 | `cyber/` | 103 | Cyber threats (Feodo/URLhaus/OTX/AbuseIPDB) | `CyberServiceClient` |
| 17 | `displacement/` | 172 | UNHCR displacement data | `DisplacementServiceClient` |
| 18 | `economic/` | 494 | FRED series + oil analytics + World Bank | `EconomicServiceClient` |
| 19 | `infrastructure/` | 173 | Internet outages + service status | `InfrastructureServiceClient` |
| 20 | `intelligence/` | 44 | Re-exports: PizzINT, risk scores, theater posture | (re-export hub) |
| 21 | `maritime/` | 390 | AIS vessel tracking, disruptions, density zones | `MaritimeServiceClient` |
| 22 | `market/` | 135 | Stock + crypto quotes | `MarketServiceClient` |
| 23 | `military/` | 19 | Re-exports: flights, vessels, surge, posture | (re-export hub) |
| 24 | `news/` | 15 | Re-exports: RSS, summarization | (re-export hub) |
| 25 | `prediction/` | 473 | Polymarket predictions + country markets | `PredictionServiceClient` |
| 26 | `research/` | 59 | ArXiv papers, GitHub trending, HN | `ResearchServiceClient` |
| 27 | `unrest/` | 145 | Protest/riot events | `UnrestServiceClient` |
| 28 | `wildfires/` | 116 | FIRMS/VIIRS fire detections | `WildfireServiceClient` |
| 29 | `population-exposure` | 100 | Population exposure calculations | `DisplacementServiceClient` |

### ML/AI Services

| # | Service | Lines | Purpose | Dependencies |
|---|---------|-------|---------|--------------|
| 30 | `ml-capabilities` | 124 | Device ML capability detection (WebGL/WebGPU/SIMD/Threads) | `@/utils` |
| 31 | `ml-worker` | 382 | ML Web Worker manager for ONNX inference (NER, sentiment, embeddings) | `ml.worker`, `ml-capabilities` |
| 32 | `summarization` | 283 | LLM summarization: Ollama → Groq → OpenRouter → Browser T5 fallback | `NewsServiceClient`, `ml-worker` |
| 33 | `parallel-analysis` | 583 | Multi-perspective headline analysis (ML NER + API summary) | `ml-worker`, clusters |
| 34 | `threat-classifier` | 423 | Keyword + ML + LLM threat classification | `getCSSColor` |
| 35 | `entity-extraction` | 161 | NER entity extraction from news clusters | `ml-worker` |

### Analysis / Intelligence Services

| # | Service | Lines | Purpose | Dependencies |
|---|---------|-------|---------|--------------|
| 36 | `analysis-core` | 690 | Core correlation analysis engine | signals, baselines |
| 37 | `analysis-worker` | 281 | Analysis web worker management | `analysis-core` |
| 38 | `signal-aggregator` | 494 | Collects all map signals, correlates by country/region | all signal types |
| 39 | `focal-point-detector` | 491 | Intelligence synthesis — identifies "main characters" across streams | `entity-extraction`, `entity-index`, `signal-aggregator` |
| 40 | `cross-module-integration` | 545 | Unified alert system — merges CII, surge, freshness, convergence | Multiple analysis services |
| 41 | `correlation` | 87 | Signal correlation (prediction↔news, news↔markets, etc.) | analysis types |
| 42 | `velocity` | 142 | News velocity metrics (sources/hour, sentiment) | `ml-worker` |
| 43 | `clustering` | 148 | News clustering (TF-IDF + NER hybrid) | `ml-worker` |
| 44 | `trending-keywords` | 681 | Keyword spike detection + trending terms + explanations | `ml-worker`, `summarization` |
| 45 | `country-instability` | 703 | Country Instability Index — multi-factor scoring (Tier 1 countries) | Multiple signal ingest fns |
| 46 | `hotspot-escalation` | 348 | Dynamic escalation scoring for intel hotspots | `config/geo`, types |
| 47 | `geo-convergence` | 254 | Geographic event convergence detection | hotspot/conflict config |
| 48 | `temporal-baseline` | 113 | Temporal anomaly detection vs. historical baselines | `InfrastructureServiceClient` |
| 49 | `military-surge` | 990 | Military surge analysis — foreign presence detection + theater posture | `config/bases-expanded`, `focal-point-detector`, `country-instability` |
| 50 | `military-flights` | 561 | OpenSky/Wingbits military flight tracking + clustering | `wingbits`, `config/military`, `runtime-config` |
| 51 | `military-vessels` | 642 | AIS military vessel tracking + clustering + trails | `maritime`, `config/military`, `usni-fleet` |
| 52 | `cached-risk-scores` | 226 | Client-side CII + strategic risk cache layer | `IntelligenceServiceClient` |
| 53 | `cached-theater-posture` | 227 | Client-side theater posture cache with localStorage fallback | `MilitaryServiceClient` |
| 54 | `infrastructure-cascade` | 675 | Infrastructure dependency graph + cascade failure simulation | `config/geo`, `config/pipelines`, `config/ports` |
| 55 | `cable-activity` | 297 | Undersea cable activity monitoring | cable config |
| 56 | `cable-health` | 74 | Cable health status service | types |

### Index / Mapping Services

| # | Service | Lines | Purpose |
|---|---------|-------|---------|
| 57 | `entity-index` | 150 | Entity lookup index (by ID, alias, keyword, sector, type) |
| 58 | `geo-hub-index` | 167 | Geopolitical hub location index |
| 59 | `tech-hub-index` | 268 | Tech hub location index (ecosystems, companies, startup hubs) |
| 60 | `tech-activity` | 155 | Tech hub activity aggregation from news clusters |
| 61 | `geo-activity` | 156 | Geopolitical hub activity aggregation from news |
| 62 | `related-assets` | 167 | Proximity-based infrastructure asset linking |
| 63 | `investments-focus` | 17 | Map focus for investment locations |
| 64 | `country-geometry` | 220 | Country boundary geometry + point-in-polygon |

### Storage Services

| # | Service | Lines | Purpose |
|---|---------|-------|---------|
| 65 | `storage` | 229 | IndexedDB baseline/snapshot store (`worldmonitor_db`) |
| 66 | `persistent-cache` | 142 | IndexedDB + localStorage persistent cache (`worldmonitor_persistent_cache`) |

### Configuration / Platform Services

| # | Service | Lines | Purpose |
|---|---------|-------|---------|
| 67 | `runtime-config` | 505 | Runtime feature flags + API key management + secret store |
| 68 | `runtime` | 280 | Desktop/web runtime detection + API base URL resolution |
| 69 | `tauri-bridge` | 46 | Tauri IPC bridge for desktop app |
| 70 | `desktop-readiness` | 141 | Desktop feature parity readiness checks |
| 71 | `data-freshness` | 390 | Data source freshness monitoring + stale detection |
| 72 | `i18n` | 150 | Internationalization — 17 languages (lazy-loaded) |
| 73 | `analytics` | 382 | Event tracking with offline queue |
| 74 | `activity-tracker` | 227 | User activity/engagement tracking |
| 75 | `meta-tags` | 168 | Dynamic OG/Twitter meta tags for story sharing |
| 76 | `story-renderer` | 491 | Canvas rendering for shareable story images |
| 77 | `story-share` | 108 | Deep link generation + social share URLs |

### Barrel / Re-export

| # | Service | Lines | Purpose |
|---|---------|-------|---------|
| 78 | `index.ts` | 39 | Barrel re-exports for top-level services |

---

## C) State Management

### Pattern
**No framework** — World Monitor uses a **service-singleton + event-driven** pattern:
- **`App` class** acts as the central orchestrator; holds all state (panels, map layers, monitors, allNews, predictions, etc.) as private fields
- **Services** are singleton modules (module-level `let` variables, circuit breaker caches, `Map` caches)
- **Panels** receive data via direct method calls from `App` (e.g., `panel.update(data)`)
- **Signals** flow up via callbacks registered on components (e.g., `onLocationClick`, `onRelatedAssetClick`)
- **Persistence** via `localStorage` (settings + UI state) and `IndexedDB` (baselines + snapshots + persistent cache)
- **Pub/sub** via `subscribeRuntimeConfig()` and `dataFreshness` subscribers

### Storage Mechanisms & Keys

#### localStorage (primary UI state)

| Key | Purpose | Used By |
|-----|---------|---------|
| `worldmonitor-panels` | Panel enabled/disabled settings | `App`, config |
| `worldmonitor-monitors` | Custom keyword monitors | `App` |
| `worldmonitor-layers` | Map layer toggles | `App` |
| `worldmonitor-disabled-feeds` | Disabled RSS feed sources | `App` |
| `worldmonitor-variant` | Current site variant (full/tech/finance) | `App` |
| `panel-order` | Drag-and-drop panel order | `App` |
| `worldmonitor-panel-spans` | Panel column span sizes | `Panel` |
| `map-height` | Resizable map height | `App` |
| `map-pinned` | Whether map is pinned | `App` |
| `worldmonitor-beta-mode` | Beta feature flag | `config/beta`, `main` |
| `worldmonitor-theme` | Dark/light theme | `theme-manager` |
| `worldmonitor-intel-findings` | Findings badge visibility | `IntelligenceGapBadge` |
| `wm-alert-popup-enabled` | Alert popup toggle | `IntelligenceGapBadge` |
| `mobile-warning-dismissed` | Mobile warning dismissed | `MobileWarningModal` |
| `wm-download-banner-dismissed` | Download banner dismissed | `DownloadBanner` |
| `wm-community-dismissed` | Community widget dismissed | `CommunityWidget` |
| `worldmonitor_recent_searches` | Recent search history | `SearchModal` |
| `wm:vesselPosture` | Cached vessel posture data | `StrategicPosturePanel` |
| `wm-secrets-updated` | Secret store update timestamp | `runtime-config` |
| `wm-feature-toggles` | Feature flag overrides | `runtime-config` |
| `wm-waitlist-registered` | Waitlist registration flag | `WorldMonitorTab` |
| `wm-debug-log` | Debug logging toggle | `runtime`, `settings-main` |
| `wm-settings-open` | Settings window open guard | `App`, `settings-main` |
| `worldmonitor-panel-order-v1.9` | Migration flag | `App` |
| `worldmonitor-tech-insights-top-v1` | Migration flag | `App` |
| `worldmonitor-layout-reset-v2.5` | Migration flag | `App` |
| `wm-update-dismissed-{version}` | Update dismissed flag | `App` |
| `worldmonitor-persistent-cache:*` | Persistent cache entries (prefixed) | `persistent-cache` |
| `wm-analytics-id` | Anonymous analytics ID | `analytics` |
| `wm-analytics-offline-queue` | Offline analytics queue | `analytics` |
| `wm-trending-config` | Trending keywords config | `trending-keywords` |
| `summary:*` (via persistent-cache) | Cached LLM summaries | `NewsPanel`, `InsightsPanel` |

#### sessionStorage

| Key | Purpose |
|-----|---------|
| `banner-dismissed` | Critical banner dismissed this session |
| `storyMeta` | Temporary story metadata for OG tags |
| `chunk-reload-*` | Chunk reload guard (PWA) |

#### IndexedDB

| Database | Store | Purpose |
|----------|-------|---------|
| `worldmonitor_db` (v1) | `baselines`, `snapshots`, `signal_history` | Temporal baselines, dashboard snapshots, signal history |
| `worldmonitor_persistent_cache` (v1) | `entries` | Long-lived cached data (summaries, briefs, posture) |

---

## D) Types Catalog

Single file: [src/types/index.ts](src/types/index.ts) — **1,275 lines**, **~95 exported types**

| Domain | Key Types |
|--------|-----------|
| **News/Feed** | `Feed`, `PropagandaRisk`, `NewsItem`, `ClusteredEvent`, `VelocityMetrics`, `VelocityLevel`, `SentimentType`, `DeviationLevel`, `FeedCategory` |
| **Market** | `MarketData`, `CryptoData`, `Sector`, `Commodity`, `MarketSymbol` |
| **Geospatial** | `Hotspot`, `ConflictZone`, `StrategicWaterway`, `MilitaryBase`, `NuclearFacility`, `GammaIrradiator`, `Pipeline`, `UnderseaCable`, `CableLandingPoint`, `AIDataCenter`, `EconomicCenter`, `Spaceport`, `Port`, `CriticalMineralProject` |
| **Military** | `MilitaryFlight`, `MilitaryFlightCluster`, `MilitaryVessel`, `MilitaryVesselCluster`, `MilitaryAircraftType`, `MilitaryOperator`, `MilitaryVesselType`, `MilitaryActivitySummary`, `USNIFleetReport`, `USNIVesselEntry`, `USNIStrikeGroup` |
| **Conflict** | `UcdpGeoEvent`, `UcdpEventType`, `SocialUnrestEvent`, `ProtestSeverity`, `ProtestSource`, `ProtestCluster` |
| **Cyber** | `CyberThreat`, `CyberThreatType`, `CyberThreatSource`, `CyberThreatSeverity`, `CyberThreatIndicatorType`, `APTGroup` |
| **Maritime/Cable** | `AisDisruptionEvent`, `AisDensityZone`, `CableAdvisory`, `RepairShip`, `CableHealthRecord`, `CableHealthStatus`, `ShippingChokepoint` |
| **Infrastructure** | `InfrastructureNode`, `DependencyEdge`, `CascadeResult`, `CascadeAffectedNode`, `CascadeCountryImpact`, `CascadeImpactLevel`, `InternetOutage` |
| **Intelligence** | `PizzIntStatus`, `PizzIntDefconLevel`, `PizzIntLocation`, `GdeltTensionPair`, `EscalationTrend`, `DynamicEscalationScore`, `FocalPoint`, `FocalPointSummary`, `FocalPointUrgency`, `EntityMention` |
| **Climate/Disaster** | `NaturalEvent`, `NaturalEventCategory`, `Earthquake`, `PopulationExposure`, `CountryPopulation` |
| **Regulation** | `AIRegulation`, `RegulatoryAction`, `CountryRegulationProfile`, `RegulationType`, `ComplianceStatus`, `RegulationStance` |
| **Tech** | `TechCompany`, `AIResearchLab`, `StartupEcosystem` |
| **Investments** | `GulfInvestment`, `GulfInvestorCountry`, `GulfInvestmentSector`, `GulfInvestmentStatus`, `GulfInvestingEntity` |
| **Map Clusters** | `MapProtestCluster`, `MapTechHQCluster`, `MapTechEventCluster`, `MapDatacenterCluster` |
| **App Config** | `Monitor`, `PanelConfig`, `MapLayers`, `AppState`, `RelatedAsset`, `AssetType`, `RelatedAssetContext` |
| **Threat/Classification** | Re-exported: `ThreatClassification`, `ThreatLevel`, `EventCategory` |

---

## E) Summary Counts

| Metric | Count |
|--------|-------|
| **Component files** | 52 (+ `index.ts` barrel) |
| **Service files** | 79 (+ `index.ts` barrel) |
| **Type files** | 1 (`src/types/index.ts` — 1,275 lines, ~95 exports) |
| **Component lines** | 22,883 |
| **Service lines** | 20,276 |
| **Total `src/` TypeScript lines** | **~75,615** |
| **Largest component** | `DeckGLMap.ts` (3,905 lines) |
| **Largest service** | `military-surge.ts` (990 lines) |
| **Sebuf RPC service modules** | 16 domain modules |
| **localStorage keys** | ~30+ distinct keys |
| **IndexedDB databases** | 2 (`worldmonitor_db`, `worldmonitor_persistent_cache`) |
| **Supported languages** | 17 |
| **Map rendering** | Dual: deck.gl/WebGL (desktop) + D3/SVG (mobile) |
