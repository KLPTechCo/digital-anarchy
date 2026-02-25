# World Monitor — Documentation Index

**Project**: World Monitor v2.5.5 | **Type**: Multi-Part Monolith | **License**: AGPL-3.0-only
**Generated**: 2026-02-23 | **Scan Level**: Exhaustive

## Quick Reference

- **Primary Language**: TypeScript
- **Architecture**: Vanilla TS SPA + Proto-first RPC (sebuf) + Tauri Desktop
- **Parts**: 8 (Frontend SPA, Vercel API, Sebuf Proto API, Desktop Tauri, AIS Relay, Convex, Edge Middleware, Nginx)
- **Codebase**: ~409 source files, ~107,500 lines (hand-written)
- **Service Domains**: 17 intelligence domains, 46 RPCs
- **External APIs**: 35+ (20 keyed, 15+ free/no-key)
- **Build Variants**: full (worldmonitor.app), tech (tech.worldmonitor.app), finance (finance.worldmonitor.app)

## Generated Documentation

| Document | Description | Lines |
|----------|-------------|-------|
| [Project Overview](./project-overview.md) | Executive summary, parts, tech stack, deployment | 117 |
| [Architecture](./architecture.md) | System architecture, frontend, API, desktop, proto, testing, security | 296 |
| [Source Tree Analysis](./source-tree-analysis.md) | Annotated directory tree, code distribution, critical files | 610 |
| [Component Inventory](./component-inventory.md) | 52 UI components, map architecture, panels, styling | 359 |
| [API Contracts](./api-contracts.md) | 11 legacy REST + 46 sebuf RPCs, auth, caching, error handling | 514 |
| [Development Guide](./development-guide.md) | Prerequisites, setup, commands, testing, proto workflow, desktop | 710 |
| [Integration Architecture](./integration-architecture.md) | Web/desktop/WebSocket paths, workers, secrets, data flows, offline | 818 |

## Existing Documentation (Pre-Scan)

### Core Project Docs

| Document | Description | Lines |
|----------|-------------|-------|
| [README.md](../README.md) | Comprehensive project overview, features, setup, architecture | 1,495 |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guide, coding standards, PR process, sebuf framework | 301 |
| [CHANGELOG.md](../CHANGELOG.md) | Release changelog with all notable changes per version | 326 |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Contributor Covenant Code of Conduct | 119 |
| [SECURITY.md](../SECURITY.md) | Security policy, vulnerability reporting, supported versions | 100 |
| [LICENSE](../LICENSE) | GNU AGPL v3 full license text | 669 |
| [.env.example](../.env.example) | All environment variables with descriptions (12 categories, 23 vars) | 141 |

### Guides & References

| Document | Part | Description | Lines |
|----------|------|-------------|-------|
| [DOCUMENTATION.md](./DOCUMENTATION.md) | All | Exhaustive spec: all panels, map layers, data pipelines, clustering, AI services | 4,044 |
| [ADDING_ENDPOINTS.md](./ADDING_ENDPOINTS.md) | API | Step-by-step sebuf RPC endpoint creation guide | 461 |
| [API_KEY_DEPLOYMENT.md](./API_KEY_DEPLOYMENT.md) | Desktop | API key gating, registration flow, Convex integration | 140 |
| [DESKTOP_CONFIGURATION.md](./DESKTOP_CONFIGURATION.md) | Desktop | Desktop runtime configuration, 21 secret keys | 60 |
| [RELEASE_PACKAGING.md](./RELEASE_PACKAGING.md) | Desktop | Reproducible desktop packaging guide | 225 |
| [TAURI_VALIDATION_REPORT.md](./TAURI_VALIDATION_REPORT.md) | Desktop | Desktop build readiness validation | 69 |
| [local-backend-audit.md](./local-backend-audit.md) | Desktop | Sidecar parity matrix (local vs cloud fallback) | 50 |
| [COMMUNITY-PROMOTION-GUIDE.md](./COMMUNITY-PROMOTION-GUIDE.md) | General | Promotion playbook and talking points | 184 |

### OpenAPI Specifications (17 Domains)

| Service | Path | Lines |
|---------|------|-------|
| [AviationService](./api/AviationService.openapi.yaml) | `docs/api/` | 240 |
| [ClimateService](./api/ClimateService.openapi.yaml) | `docs/api/` | 185 |
| [ConflictService](./api/ConflictService.openapi.yaml) | `docs/api/` | 370 |
| [CyberService](./api/CyberService.openapi.yaml) | `docs/api/` | 256 |
| [DisplacementService](./api/DisplacementService.openapi.yaml) | `docs/api/` | 343 |
| [EconomicService](./api/EconomicService.openapi.yaml) | `docs/api/` | 529 |
| [InfrastructureService](./api/InfrastructureService.openapi.yaml) | `docs/api/` | 556 |
| [IntelligenceService](./api/IntelligenceService.openapi.yaml) | `docs/api/` | 623 |
| [MaritimeService](./api/MaritimeService.openapi.yaml) | `docs/api/` | 314 |
| [MarketService](./api/MarketService.openapi.yaml) | `docs/api/` | 655 |
| [MilitaryService](./api/MilitaryService.openapi.yaml) | `docs/api/` | 834 |
| [NewsService](./api/NewsService.openapi.yaml) | `docs/api/` | 134 |
| [PredictionService](./api/PredictionService.openapi.yaml) | `docs/api/` | 150 |
| [ResearchService](./api/ResearchService.openapi.yaml) | `docs/api/` | 457 |
| [SeismologyService](./api/SeismologyService.openapi.yaml) | `docs/api/` | 178 |
| [UnrestService](./api/UnrestService.openapi.yaml) | `docs/api/` | 307 |
| [WildfireService](./api/WildfireService.openapi.yaml) | `docs/api/` | 196 |

### LLM Context Files

| Document | Description | Lines |
|----------|-------------|-------|
| [llms.txt](../public/llms.txt) | Concise LLM-oriented project summary | 62 |
| [llms-full.txt](../public/llms-full.txt) | Extended LLM context with full data catalog | 229 |

### CI/CD & Templates

| Document | Description | Lines |
|----------|-------------|-------|
| [build-desktop.yml](../.github/workflows/build-desktop.yml) | GitHub Actions: Tauri build (4-platform matrix with signing) | 348 |
| [lint.yml](../.github/workflows/lint.yml) | GitHub Actions: Markdown linting | 19 |
| [PR Template](../.github/pull_request_template.md) | Pull request template | 36 |
| [Bug Report](../.github/ISSUE_TEMPLATE/bug_report.yml) | Bug report issue template | 88 |
| [Feature Request](../.github/ISSUE_TEMPLATE/feature_request.yml) | Feature request template | 55 |
| [New Data Source](../.github/ISSUE_TEMPLATE/new_data_source.yml) | Data source proposal template | 69 |

## Getting Started

### For New Developers
1. Read [Project Overview](./project-overview.md) for high-level understanding
2. Read [Architecture](./architecture.md) for system design
3. Read [Development Guide](./development-guide.md) for setup and commands
4. Reference [Source Tree Analysis](./source-tree-analysis.md) when navigating code

### For API Work
1. Read [API Contracts](./api-contracts.md) for all endpoints
2. Read [ADDING_ENDPOINTS.md](./ADDING_ENDPOINTS.md) to add new sebuf RPCs
3. Reference OpenAPI specs in `docs/api/` for request/response schemas

### For Desktop Work
1. Read [Integration Architecture](./integration-architecture.md) §C for desktop path
2. Read [DESKTOP_CONFIGURATION.md](./DESKTOP_CONFIGURATION.md) for secret keys
3. Read [RELEASE_PACKAGING.md](./RELEASE_PACKAGING.md) for build/sign/package

### For Brownfield PRD
Point the BMAD PRD workflow to this `docs/index.md` as the project knowledge input. The generated documentation provides comprehensive context for feature planning.

## Documentation Stats

| Metric | Value |
|--------|-------|
| Total documentation files | 43 |
| Generated by scan | 7 new files |
| Pre-existing docs | 36 files |
| Total documentation lines | ~15,700+ |
| OpenAPI spec coverage | 17/17 domains |
