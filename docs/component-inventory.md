# Component Inventory

> Framework-free TypeScript SPA. All components are class-based with direct DOM manipulation.
> No React, Vue, or Angular — raw `document.createElement` and `innerHTML` throughout.

## A. Component Catalog

### All Components (52 files, 22,883 LOC)

| Component | File | Category | Lines | Purpose |
|---|---|---|---|---|
| DeckGLMap | DeckGLMap.ts | Map | 3905 | WebGL map (deck.gl + MapLibre GL) — desktop renderer |
| MapComponent | Map.ts | Map | 3513 | D3/SVG map — mobile fallback renderer |
| MapPopup | MapPopup.ts | Map | 2549 | Popup overlays for all 40+ entity types on the map |
| LiveNewsPanel | LiveNewsPanel.ts | Feed | 708 | Embedded YouTube live news player |
| CountryBriefPage | CountryBriefPage.ts | Panel | 638 | Full-page AI-generated country intelligence brief |
| InsightsPanel | InsightsPanel.ts | Panel | 633 | AI world brief, missed-story detection, focal points |
| NewsPanel | NewsPanel.ts | Feed | 614 | Clustered news feed with virtual scrolling and translations |
| RuntimeConfigPanel | RuntimeConfigPanel.ts | Panel | 603 | Desktop API key management and feature toggles |
| MapContainer | MapContainer.ts | Layout | 579 | Facade selecting DeckGLMap (desktop) or MapComponent (mobile) |
| IntelligenceGapBadge | IntelligenceGapBadge.ts | Widget | 525 | Floating badge showing correlation signals and alerts |
| StrategicPosturePanel | StrategicPosturePanel.ts | Panel | 519 | Theater military posture assessment per region |
| StrategicRiskPanel | StrategicRiskPanel.ts | Panel | 496 | Strategic risk overview, geo-convergence alerts, data freshness |
| Panel | Panel.ts | Utility | 473 | Base class for all panels (header, resize, collapse, drag) |
| VirtualList | VirtualList.ts | Utility | 407 | DOM-recycling virtual scroller for long lists |
| SearchModal | SearchModal.ts | Modal | 378 | ⌘K search across countries, news, hotspots, assets |
| LiveWebcamsPanel | LiveWebcamsPanel.ts | Feed | 345 | YouTube live webcam feeds from global hotspots |
| SignalModal | SignalModal.ts | Modal | 331 | Alert modal for correlation signals with sound |
| RegulationPanel | RegulationPanel.ts | Panel | 320 | AI regulation tracker — timeline, deadlines, country profiles |
| CountryTimeline | CountryTimeline.ts | Visualization | 285 | D3 swim-lane timeline of events per country |
| CountryIntelModal | CountryIntelModal.ts | Modal | 283 | Modal for AI-generated country intel + stock data |
| CascadePanel | CascadePanel.ts | Panel | 270 | Infrastructure cascade/dependency simulation |
| StatusPanel | StatusPanel.ts | Panel | 246 | Feed and API health dashboard |
| MacroSignalsPanel | MacroSignalsPanel.ts | Panel | 245 | Macro liquidity, flow structure, regime signals (sebuf) |
| TechEventsPanel | TechEventsPanel.ts | Panel | 239 | Upcoming conferences, earnings, tech events (sebuf) |
| InvestmentsPanel | InvestmentsPanel.ts | Panel | 229 | GCC/Gulf FDI investment tracker (finance variant) |
| ServiceStatusPanel | ServiceStatusPanel.ts | Panel | 224 | External service uptime monitoring |
| EconomicPanel | EconomicPanel.ts | Panel | 223 | FRED indicators, oil analytics, US government spending |
| PlaybackControl | PlaybackControl.ts | Widget | 177 | Snapshot timeline playback of historical dashboards |
| StoryModal | StoryModal.ts | Modal | 176 | Shareable story card renderer with deep-link support |
| MonitorPanel | MonitorPanel.ts | Panel | 173 | User-defined keyword monitors with color coding |
| VerificationChecklist | VerificationChecklist.ts | Widget | 166 | Preact-based verification checklist (only Preact usage) |
| PizzIntIndicator | PizzIntIndicator.ts | Widget | 162 | DEFCON-style threat level indicator |
| WorldMonitorTab | WorldMonitorTab.ts | Navigation | 154 | Settings tab for API key registration |
| MarketPanel | MarketPanel.ts | Panel | 151 | Stock market data with sparklines |
| TechReadinessPanel | TechReadinessPanel.ts | Panel | 146 | World Bank tech readiness country rankings |
| TechHubsPanel | TechHubsPanel.ts | Panel | 146 | Startup ecosystem activity feed |
| ETFFlowsPanel | ETFFlowsPanel.ts | Panel | 145 | ETF flow data (sebuf MarketService) |
| StablecoinPanel | StablecoinPanel.ts | Panel | 138 | Stablecoin market cap and peg data (sebuf MarketService) |
| GdeltIntelPanel | GdeltIntelPanel.ts | Panel | 137 | GDELT topic-based intelligence articles |
| DisplacementPanel | DisplacementPanel.ts | Panel | 137 | UNHCR refugee/displacement data by origin and host |
| CIIPanel | CIIPanel.ts | Panel | 135 | Country Instability Index scores and sharing |
| DownloadBanner | DownloadBanner.ts | Widget | 132 | Desktop app download prompt for web users |
| UcdpEventsPanel | UcdpEventsPanel.ts | Panel | 126 | UCDP conflict event browser |
| GeoHubsPanel | GeoHubsPanel.ts | Panel | 123 | Geopolitical hub activity feed |
| LanguageSelector | LanguageSelector.ts | Navigation | 111 | Custom dropdown language switcher |
| SatelliteFiresPanel | SatelliteFiresPanel.ts | Panel | 99 | NASA FIRMS satellite fire data by region |
| ClimateAnomalyPanel | ClimateAnomalyPanel.ts | Panel | 81 | Temperature and precipitation anomaly zones |
| MobileWarningModal | MobileWarningModal.ts | Modal | 78 | Dismissable "desktop recommended" notice |
| PopulationExposurePanel | PopulationExposurePanel.ts | Panel | 77 | Population within radius of conflict/disaster events |
| PredictionPanel | PredictionPanel.ts | Panel | 58 | Polymarket prediction market odds |
| index.ts | index.ts | Utility | 40 | Barrel re-export file |
| CommunityWidget | CommunityWidget.ts | Widget | 35 | GitHub Discussions join prompt |

### Category Summary

| Category | Count | Total LOC |
|---|---|---|
| Map | 3 | 9,967 |
| Panel | 26 | 6,887 |
| Feed | 3 | 1,667 |
| Modal | 4 | 1,268 |
| Widget | 5 | 1,021 |
| Utility | 3 | 920 |
| Visualization | 1 | 285 |
| Layout | 1 | 579 |
| Navigation | 2 | 265 |

---

## B. Component Architecture

### Orchestration Pattern

`App.ts` (4,629 LOC) is the sole orchestrator. It owns all component lifecycles:

```
App.ts
├── constructor()        → Parse settings, URL state, variant config
├── init()               → Async boot: DB init, i18n, ML worker, renderLayout()
├── renderLayout()       → Inject full HTML shell (header, map-section, panels-grid, modals)
├── createPanels()       → Instantiate all ~40 panel/widget objects, append to grid
├── loadAllData()        → Parallel fetch of all data sources
├── setupRefreshIntervals() → scheduleRefresh() for each data source with jitter
└── destroy()            → Tear down timers, event listeners, streams
```

### Component Lifecycle

1. **Construction** — `new Panel(options)` creates the DOM element (`document.createElement`), builds header with title/count/resize handle
2. **Mounting** — `App.createPanels()` appends `panel.getElement()` to `#panelsGrid` in saved or default order
3. **Data Flow** — App fetches data, then calls typed update methods: `panel.update(data)`, `panel.setCount(n)`, `map.setEarthquakes(data)`
4. **Refresh** — `scheduleRefresh(name, fn, interval)` runs async fetchers with visibility-aware jitter, deduplication via `inFlight` set, and hidden-tab throttling (4× interval)
5. **Teardown** — `App.destroy()` clears all intervals, timeouts, event listeners, disconnects streams

### Event Flow

| Pattern | Mechanism |
|---|---|
| Panel → App | Callback props: `panel.setLocationClickHandler((lat, lon) => map.setCenter(...))` |
| App → Panel | Direct method calls: `panel.update(data)`, `panel.setCount(n)` |
| App → Map | Direct method calls: `map.setEarthquakes(data)`, `map.setCenter(lat, lon, zoom)` |
| Map → App | Callback props: `map.onTimeRangeChanged(cb)`, `map.onCountryClick(cb)` |
| Panel Base | `Panel` base class handles resize (drag handle), collapse toggle, span persistence |
| Cross-panel | Via App: data fetched once, distributed to relevant panels + map simultaneously |

### Panel Grid Layout

- Panels live in a CSS Grid (`#panelsGrid`) with drag-to-reorder
- Each panel can span 1–4 rows via resize handle (persisted to `localStorage`)
- Panel order is saved and restored, with migration logic for variant changes
- `live-news` is forced to position 0 (spans 2 columns in CSS)

---

## C. Map Components

### Three-Tier Architecture

| Component | Renderer | Use Case | Lines |
|---|---|---|---|
| `MapContainer` | Facade | Detects device, delegates to appropriate renderer | 579 |
| `DeckGLMap` | deck.gl + MapLibre GL (WebGL2) | Desktop — high-performance WebGL rendering | 3,905 |
| `MapComponent` | D3.js + TopoJSON (SVG) | Mobile fallback — no WebGL requirement | 3,513 |

### MapContainer Delegation

```typescript
// In MapContainer.init():
this.useDeckGL = !this.isMobile && this.hasWebGLSupport(); // WebGL2 required
if (this.useDeckGL) {
  this.deckGLMap = new DeckGLMap(container, state);
} else {
  this.svgMap = new MapComponent(container, state);  // SVG fallback
}
```

Both renderers expose an identical public API so `App.ts` calls the same methods regardless of device. MapContainer proxies all calls.

### DeckGLMap — Layer Inventory

Uses MapLibre GL as base tile map with a `MapboxOverlay` from deck.gl. 40+ layer creator methods:

| Layer Method | deck.gl Type | Data Source |
|---|---|---|
| `createConflictZonesLayer` | GeoJsonLayer | Static CONFLICT_ZONES config |
| `createBasesLayer` | IconLayer | Static MILITARY_BASES config |
| `createNuclearLayer` | IconLayer | Static NUCLEAR_FACILITIES config |
| `createCablesLayer` | PathLayer | Static UNDERSEA_CABLES config |
| `createPipelinesLayer` | PathLayer | Static PIPELINES config |
| `createIrradiatorsLayer` | ScatterplotLayer | Static GAMMA_IRRADIATORS config |
| `createSpaceportsLayer` | ScatterplotLayer | Static SPACEPORTS config |
| `createPortsLayer` | ScatterplotLayer | Static PORTS config |
| `createWaterwaysLayer` | ScatterplotLayer | Static STRATEGIC_WATERWAYS config |
| `createEconomicCentersLayer` | ScatterplotLayer | Static ECONOMIC_CENTERS config |
| `createAPTGroupsLayer` | ScatterplotLayer | Static APT_GROUPS config |
| `createMineralsLayer` | ScatterplotLayer | Static CRITICAL_MINERALS config |
| `createDatacentersLayer` | IconLayer | Static AI_DATA_CENTERS config |
| `createStartupHubsLayer` | ScatterplotLayer | Static STARTUP_HUBS config |
| `createAcceleratorsLayer` | ScatterplotLayer | Static ACCELERATORS config |
| `createCloudRegionsLayer` | ScatterplotLayer | Static CLOUD_REGIONS config |
| `createStockExchangesLayer` | ScatterplotLayer | Static STOCK_EXCHANGES config |
| `createFinancialCentersLayer` | ScatterplotLayer | Static FINANCIAL_CENTERS config |
| `createCentralBanksLayer` | ScatterplotLayer | Static CENTRAL_BANKS config |
| `createCommodityHubsLayer` | ScatterplotLayer | Static COMMODITY_HUBS config |
| `createEarthquakesLayer` | ScatterplotLayer | USGS API (live) |
| `createNaturalEventsLayer` | ScatterplotLayer | NASA EONET (live) |
| `createFiresLayer` | ScatterplotLayer | NASA FIRMS (live) |
| `createWeatherLayer` | ScatterplotLayer | Weather alerts (live) |
| `createOutagesLayer` | ScatterplotLayer | Internet outage API (live) |
| `createCyberThreatsLayer` | ScatterplotLayer | Cyber threat feeds (live) |
| `createAisDensityLayer` | ScatterplotLayer | AIS maritime stream (live) |
| `createAisDisruptionsLayer` | ScatterplotLayer | AIS anomaly detection (live) |
| `createCableAdvisoriesLayer` | ScatterplotLayer | Submarine cable advisories (live) |
| `createRepairShipsLayer` | ScatterplotLayer | Cable repair vessel tracking (live) |
| `createFlightDelaysLayer` | ScatterplotLayer | Aviation delay feeds (live) |
| `createMilitaryFlightsLayer` | ScatterplotLayer | Military aircraft tracking (live) |
| `createMilitaryFlightClustersLayer` | ScatterplotLayer | Clustered military flights (live) |
| `createMilitaryVesselsLayer` | ScatterplotLayer | Naval vessel tracking (live) |
| `createMilitaryVesselClustersLayer` | ScatterplotLayer | Clustered naval vessels (live) |
| `createHotspotsLayers` | Multiple | Intel hotspot overlays with escalation |
| `createProtestClusterLayers` | Multiple | Supercluster-based protest grouping |
| `createTechHQClusterLayers` | Multiple | Supercluster-based tech HQ grouping |
| `createTechEventClusterLayers` | Multiple | Supercluster-based tech event grouping |
| `createDatacenterClusterLayers` | Multiple | Supercluster-based datacenter grouping |

Clustering uses [`supercluster`](https://github.com/mapbox/supercluster) for client-side spatial aggregation.

### MapComponent (SVG Fallback)

Same data as DeckGLMap but rendered via D3 projections onto SVG. Uses TopoJSON for country boundaries. Supports the same layer toggles, time-range filtering, and popup interactions. Performance-constrained on large datasets — hence restricted to mobile where data volumes are smaller.

### MapPopup

Renders contextual HTML popups for 40+ entity types. Each popup type has a dedicated render method producing styled HTML strings. Popup types include: `conflict`, `hotspot`, `earthquake`, `weather`, `base`, `waterway`, `apt`, `cyberThreat`, `nuclear`, `economic`, `irradiator`, `pipeline`, `cable`, `cable-advisory`, `repair-ship`, `outage`, `datacenter`, `datacenterCluster`, `ais`, `protest`, `protestCluster`, `flight`, `militaryFlight`, `militaryVessel`, `militaryFlightCluster`, `militaryVesselCluster`, `natEvent`, `port`, `spaceport`, `mineral`, `startupHub`, `cloudRegion`, `techHQ`, `accelerator`, `techEvent`, `techHQCluster`, `techEventCluster`, `techActivity`, `geoActivity`, `stockExchange`, `financialCenter`, `centralBank`, `commodityHub`.

---

## D. Panel Components — Data Sources

### Intelligence & Risk Panels (full variant only)

| Panel | Data Sources | Services |
|---|---|---|
| InsightsPanel | News clusters, ML analysis, GDELT, military flights | `ml-worker`, `summarization`, `parallel-analysis`, `signal-aggregator`, `focal-point-detector` |
| StrategicRiskPanel | All data modules cross-correlated | `cross-module-integration`, `geo-convergence`, `data-freshness`, `country-instability`, `cached-risk-scores` |
| StrategicPosturePanel | Military aircraft + naval vessels | `cached-theater-posture`, `military-surge`, `military-vessels` |
| CIIPanel | Multi-source instability scoring | `country-instability` (protests, military, news, outages, conflicts, UCDP, HAPI, displacement, climate) |
| CascadePanel | Infrastructure dependency graph | `infrastructure-cascade` (cables, pipelines, ports, chokepoints) |
| GdeltIntelPanel | GDELT article intelligence | `gdelt-intel` |
| UcdpEventsPanel | Uppsala conflict dataset | `conflict` (UCDP classifications) |
| DisplacementPanel | UNHCR population data | `displacement` |
| ClimateAnomalyPanel | Temperature + precipitation | `climate` |
| PopulationExposurePanel | Population near events | `population-exposure` |
| SatelliteFiresPanel | NASA FIRMS fire detections | `wildfires` |

### News Feed Panels

| Panel ID | Feed Category | Description |
|---|---|---|
| politics | Politics | Global political news |
| tech | Tech | Technology sector |
| finance | Finance | Financial markets |
| ai | AI | Artificial intelligence |
| middleeast | Middle East | Regional MENA news |
| intel | Intel | Intelligence community |
| gov | Gov | Government/policy |
| security | Security | Cybersecurity |
| startups | Startups | Startup ecosystem (tech variant) |
| vcblogs | VC Blogs | Venture capital (tech variant) |
| unicorns | Unicorns | Unicorn companies (tech variant) |
| funding | Funding | Funding rounds (tech variant) |
| accelerators | Accelerators | Accelerator programs (tech variant) |
| producthunt | Product Hunt | New products (tech variant) |
| layoffs | Layoffs | Tech layoffs |
| energy | Energy | Energy sector |
| africa, latam, asia | Regional | Regional news feeds |

All news panels use `NewsPanel` (extends `Panel`) with clustered display via `clusterNewsHybrid()`, virtual scrolling via `WindowedList`, and optional AI translation.

### Market & Economic Panels

| Panel | Data Source | Service / API |
|---|---|---|
| MarketPanel | Finnhub stock data | `fetchMultipleStocks` |
| EconomicPanel | FRED, EIA, USASpending | `fetchFredData`, `fetchOilAnalytics`, gov spending |
| PredictionPanel | Polymarket | `fetchPredictions` |
| MacroSignalsPanel | sebuf gRPC | `EconomicServiceClient.getMacroSignals()` |
| ETFFlowsPanel | sebuf gRPC | `MarketServiceClient.listEtfFlows()` |
| StablecoinPanel | sebuf gRPC | `MarketServiceClient.listStablecoinMarkets()` |
| TechEventsPanel | sebuf gRPC | `ResearchServiceClient.listTechEvents()` |
| TechReadinessPanel | Static rankings | `getTechReadinessRankings()` |
| InvestmentsPanel | Static GCC FDI data | `GULF_INVESTMENTS` config (finance variant) |

### Utility & Status Panels

| Panel | Purpose |
|---|---|
| StatusPanel | Feed status (ok/warning/error), API latency, item counts |
| ServiceStatusPanel | External infrastructure service health, desktop readiness checks |
| RuntimeConfigPanel | API key entry, feature toggles, secret validation (desktop only) |
| MonitorPanel | User-created keyword monitors with color-coded alerts |
| RegulationPanel | AI regulation tracker with deadline timeline |

---

## E. Styling Architecture

### File Structure

| File | Lines | Purpose |
|---|---|---|
| [main.css](../src/styles/main.css) | 14,437 | All application styles: layout, header, map, modals, panels, animations |
| [panels.css](../src/styles/panels.css) | 655 | Panel-specific styles extracted for CSSOM performance (PERF-012) |
| [rtl-overrides.css](../src/styles/rtl-overrides.css) | 120 | Right-to-left layout fixes for Arabic (`[dir="rtl"]` selectors) |
| [settings-window.css](../src/styles/settings-window.css) | 906 | Standalone settings window (Tauri desktop) |
| [lang-switcher.css](../src/styles/lang-switcher.css) | 98 | Language selector dropdown styles |

### Theme System

- **Two themes**: Dark (default) and Light, toggled via `[data-theme="light"]` on `:root`
- **CSS custom properties** on `:root` define all colors, then overridden in `[data-theme="light"]` block
- Organized into semantic groups: backgrounds, borders, text, overlays, panels, map, severity levels, DEFCON, status
- Light theme uses WCAG AA-compliant darker color variants (annotated with Tailwind equivalents and contrast ratios)
- Theme transitions: 200ms ease on `background-color`, `color`, `border-color`
- Toggle persisted to `localStorage`, applied via `setTheme()` / `getCurrentTheme()` utils

### Key Design Variables

```css
--bg, --bg-secondary, --surface, --surface-hover      /* Background hierarchy */
--text, --text-secondary, --text-dim, --text-muted     /* Text hierarchy */
--semantic-critical, --semantic-high, --semantic-elevated, --semantic-normal  /* Severity */
--defcon-1 through --defcon-5                           /* Threat levels */
--font-mono                                             /* Primary monospace font stack */
```

### RTL Support

- Arabic locale triggers `dir="rtl"` on `<html>`
- CJK locales (Chinese) use dedicated font stacks (`PingFang SC`, `Microsoft YaHei`, etc.)
- `rtl-overrides.css` flips margins, padding, and positioning for header elements, panels, and controls

### Responsive Breakpoints

- `@media (max-width: 768px)` — Mobile layout: stacked panels, simplified header
- `@media (max-width: 600px)` — Small mobile: further condensed UI

---

## F. Mobile vs Desktop Rendering

### Detection

```typescript
// utils/index.ts
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
    || window.innerWidth <= 768;
}
```

### Rendering Differences

| Aspect | Desktop | Mobile |
|---|---|---|
| **Map renderer** | `DeckGLMap` (deck.gl + MapLibre GL, WebGL2) | `MapComponent` (D3.js + SVG) |
| **Map selection** | `MapContainer` checks `isMobileDevice()` + WebGL2 support | Falls back to SVG if mobile or no WebGL2 |
| **Default view** | Global view, zoom 1.0 | MENA view, zoom 2.5 |
| **Default layers** | `DEFAULT_MAP_LAYERS` (all layers) | `MOBILE_DEFAULT_MAP_LAYERS` (subset) |
| **Insights panel** | Full AI brief with ML worker | Auto-hides on mobile |
| **Intelligence badge** | Floating `IntelligenceGapBadge` | Not rendered |
| **Critical banner** | Military posture banner above map | Removed on mobile |
| **Virtual scrolling** | Full `VirtualList` DOM recycling | Same, smaller datasets |
| **Mobile warning** | Not shown | `MobileWarningModal` displayed |
| **Download banner** | Not shown (already desktop) | Not shown (not useful) |
| **Web only** | `DownloadBanner` shown to encourage desktop app | N/A |
| **Panel grid** | Multi-column CSS Grid with drag reorder | Single-column stacked |

### WebGL Fallback Chain

```
MapContainer.init()
  ├─ Desktop + WebGL2 → DeckGLMap
  ├─ Desktop + WebGL2 fails → catch → MapComponent (SVG fallback)
  └─ Mobile → MapComponent (SVG)
```

The SVG map supports the same layer toggles and popup types but with D3 projections instead of WebGL tile rendering. DeckGLMap uses `Supercluster` for spatial aggregation of dense point layers.
