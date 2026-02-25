---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
inputDocuments:
  - docs/index.md
  - docs/project-overview.md
  - docs/architecture.md
  - docs/source-tree-analysis.md
  - docs/component-inventory.md
  - docs/api-contracts.md
  - docs/development-guide.md
  - docs/integration-architecture.md
  - docs/DOCUMENTATION.md
  - docs/ADDING_ENDPOINTS.md
  - docs/API_KEY_DEPLOYMENT.md
  - docs/DESKTOP_CONFIGURATION.md
  - docs/RELEASE_PACKAGING.md
  - docs/TAURI_VALIDATION_REPORT.md
  - docs/local-backend-audit.md
  - docs/COMMUNITY-PROMOTION-GUIDE.md
  - README.md
  - CONTRIBUTING.md
  - CHANGELOG.md
  - public/llms.txt
  - public/llms-full.txt
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 21
classification:
  projectType: web_app
  domain: Intelligence/OSINT monitoring
  complexity: high
  projectContext: brownfield
---

# Product Requirements Document - Situation Monitor

**Author:** Ed
**Date:** 2026-02-23

## Executive Summary

Situation Monitor is a fork of the open-source World Monitor intelligence platform (v2.5.5), deployed independently on Vercel to serve as a publicly accessible, real-time global situational awareness dashboard. The platform aggregates 35+ data sources across 17 intelligence domains — seismology, conflict, markets, energy, cyber, maritime, and more — into a WebGL-accelerated 3D globe interface with AI-powered analysis.

The target audience is globally-aware consumers who follow current events and want information they can act on: investors seeking leading indicators before mainstream financial media, travelers assessing personal safety in specific regions, and prediction market participants identifying gaps between AI-assessed probabilities and market pricing. This is not a tool for OSINT analysts — it's a daily briefing for curious, engaged people.

The initial scope is deployment and operational baseline: get the "full" variant running on Vercel Hobby tier with Upstash Redis caching, establish the documentation and requirements framework, and begin small incremental improvements. Larger features and architectural evolution will follow as the codebase is studied and user needs emerge through direct usage.

### What Makes This Special

**Consumer-grade OSINT is an unoccupied space.** Existing intelligence platforms (Recorded Future, Janes, Bellingcat tools) target enterprise analysts and governments. Situation Monitor takes the same professional-grade data aggregation and AI pipeline and makes it accessible to a general audience — the Robinhood/Zillow pattern applied to global intelligence.

**Fork freedom enables opinionated curation.** The upstream project must remain general-purpose. This fork can make editorial decisions: which domains to emphasize, how to surface actionable insights, and what UX simplifications serve a consumer audience rather than an analyst audience.

**The hard part is already built.** The sebuf RPC layer, three-tier caching architecture, 46 edge-deployed RPCs, client-side ML inference, and progressive offline support are all operational. The opportunity is in the access layer — making the platform habitual, personal, and action-oriented through incremental improvements.

**North star direction:** Push-based alerts and notifications, personalized watchlists with "what changed since last visit" briefings, and opinionated curation layers that translate raw data into "here's what to do about it" — investment signals, safety advisories, and prediction market opportunities.

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Project Type** | Web application (SPA + edge API) |
| **Domain** | Intelligence / OSINT monitoring |
| **Complexity** | High — 17 service domains, 35+ external APIs, proto-first RPC, client-side ML, dual-platform delivery |
| **Project Context** | Brownfield — forked open-source project (v2.5.5, ~107.5K LOC), deployed and verified on Vercel |
| **Deployment Target** | Vercel (Hobby tier) + Upstash Redis (free tier) |
| **Build Scope** | "Full" variant only (worldmonitor.app equivalent) |
| **Excluded (for now)** | Railway (AIS relay), Convex (interest registration), tech/finance variants, desktop builds |

## Success Criteria

### User Success

- **The site loads and functions correctly after every change.** No deployment breaks the user experience. This is the primary gate.
- **Ed uses the site daily and finds it valuable.** Gut-feel usefulness is the measure. If it becomes part of the daily routine, that's success.
- **No degraded experience vs. upstream.** Every feature that works on the original World Monitor deployment works on Situation Monitor.

### Business Success

- **Site is up and accessible.** Uptime on Vercel's infrastructure with no manual intervention required.
- **Ed keeps using it.** The ultimate product-market fit signal for a personal tool: the builder uses it themselves.
- **Costs at or near $0/month.** Vercel Hobby tier (free), Upstash free tier, free-tier API keys. If costs creep above $0, something needs investigation.

### Technical Success

- **Successful Vercel deployment** with all 46 sebuf RPCs and 11 legacy endpoints functional.
- **Upstash Redis caching operational** — three-tier cache (in-memory → Redis → upstream) working for AI summaries and threat classifications.
- **Separate Upstash Redis environments for QA vs Production.** QA (Preview) environment uses distinct Redis instance or key prefix to prevent cache pollution across environments.
- **QA environment operational before production promotion.** Two Vercel environments: Preview (QA, auto-deployed on PRs/branches) and Production (deployed on merge to main). No changes reach production without passing through QA first.
- **Upstream sync workflow established.** Dedicated `upstream-sync` branch pattern — merge upstream there, run full test suite, PR into `main`. Fork innovations preserved during merges.
- **Proto/sebuf compatibility checkpoint** after every upstream merge. Run `make generate` and verify generated output matches. If upstream changes the codegen tool, catch it before it silently breaks the build.
- **No regressions from upstream or local changes.** Full existing test suite passes (Playwright E2E with SwiftShader, Node.js unit tests, proto breaking change detection via `buf breaking`). New changes don't break existing functionality.
- **CI/CD pipeline is stable and trusted.** GitHub Actions workflow as quality gate: `on PR → lint + unit tests + buf breaking + build + Playwright E2E`. Green pipeline = safe to merge. Red pipeline = don't deploy. Vercel auto-deploys on merge to main only after CI passes.
- **New changes carry test coverage.** Even minimal — a smoke test that customizations don't break adjacent functionality. Upstream tests must continue to pass as the baseline regression net.

### Adoption Milestones

| Milestone | Target | Signal |
|-----------|--------|--------|
| **Week 1** | Ed checks the site at least once daily | Platform is functional and accessible |
| **Week 4** | Ed has identified 2-3 small changes to make | Engagement is leading to product ideas |
| **Week 8** | Ed has shipped at least one change through QA → Production | Development workflow is operational and the fork is a living product |

### Measurable Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| Site availability | 99%+ | Vercel status / manual observation |
| Post-deployment regressions | 0 | QA validation before prod promotion |
| Monthly cost | $0 | Vercel + Upstash billing dashboards |
| Upstream sync frequency | At least monthly | Git log of upstream merges |
| CI/CD pipeline reliability | Green builds on clean merges | GitHub Actions history |
| Daily personal usage | Yes/No | Gut check |

## Product Scope

Three development phases — MVP (operational deployment), Growth (incremental improvements), and Vision (architectural evolution). See [Project Scoping & Phased Development](#project-scoping--phased-development) for the detailed 16-item MVP must-have list, Growth/Future feature tables, and risk mitigation strategy.

**MVP in one sentence:** Deploy the existing "full" variant to Vercel, validate all 57 endpoints, establish CI/CD and upstream sync workflows, and apply Situation Monitor branding.

**Growth in one sentence:** SEO improvements, accessibility enhancements, custom domain, monitoring, and incremental UX refinements driven by daily use.

**Vision in one sentence:** Push alerts, personalized watchlists, opinionated curation layers, and potential audience growth beyond personal use.

## User Journeys

### Journey 1: Ed — Daily Briefing & Operational Stewardship

**Opening Scene:** It's 7:15 AM. Ed opens his laptop with coffee, tabs already queued — email, markets, and Situation Monitor. He loads Situation Monitor the way others check weather apps: what happened overnight? The 3D globe spins to show active hotspots. Clusters of red in the Middle East, a seismology alert in the Pacific Ring, a cyber incident flagged in Eastern Europe. The World Brief panel gives him an AI-synthesized summary of the top 5 developments.

**Rising Action:** Ed clicks a conflict cluster around the Red Sea — shipping lane disruptions. The Country Instability Index for Yemen is elevated. He cross-references with the prediction market panel: Polymarket has "Houthi ceasefire by Q2" at 22%, but the AI threat classification says escalation probability is high. That's an interesting gap. He checks the economic panel — Brent crude futures are ticking up. Three data points, one story: shipping disruption → energy price pressure → possible investment signal.

**Climax:** Ed notices something off — the cyber panel isn't loading data. The Cloudflare Radar endpoint might be down, or maybe his API key expired. He opens the Vercel dashboard, checks the function logs. It's a 401 — API key rotation needed. He updates the environment variable in Vercel, the Preview deployment picks it up in 90 seconds. He verifies on QA, then promotes to production. The cyber panel is back. Total downtime for that data source: 12 minutes.

**Offline resilience:** Ed's internet briefly drops while reviewing the economic panel. The service worker serves cached data — the last-fetched view remains visible. When connectivity returns, data refreshes automatically. The PWA layer means brief network interruptions don't break his morning routine.

**Resolution:** By 7:45 AM, Ed has a picture of the world that would take an hour of reading multiple news sites to assemble. He's spotted an investment signal, confirmed his travel to Southeast Asia looks safe, and fixed an operational issue — all before his second cup of coffee. He closes the laptop knowing he'll check again after lunch for US market hours developments.

**Requirements revealed:** Dashboard loads fast with overnight data. AI summaries surface top developments. Cross-panel data correlation is intuitive. Operational issues (API key rotation, endpoint failures) are diagnosable from Vercel logs. QA → Production promotion is fast and reliable. Offline/PWA resilience provides continuity during network interruptions.

---

### Journey 2: Engaged Consumer — The Prediction Market Edge-Seeker

**Opening Scene:** Rachel is a 34-year-old finance professional who trades prediction markets as a hobby. She found Situation Monitor through a Reddit thread about Polymarket tools. She bookmarks it after seeing the live prediction market panel overlaid on geopolitical data. Her current position: she's long on "Taiwan Strait incident by 2026" at 15% and wants to track whether that thesis is holding.

**Rising Action:** Rachel navigates to the East Asia region. She checks the military posture panel — PLA naval exercises in the Taiwan Strait are tracked, frequency is up 20% month-over-month. The Country Instability Index for Taiwan shows elevated but not critical. She opens the intelligence panel — recent OSINT signals show increased satellite imagery of amphibious landing craft staging. She cross-references with the conflict panel for historical pattern matching.

**Climax:** The AI threat classification re-evaluates the Taiwan situation from "Moderate" to "Elevated" based on new conflict signals. Polymarket still prices the event at 15%. Rachel sees the gap — the platform's AI assessment is ahead of the market. She adjusts her position based on what she considers an informational edge.

**Resolution:** Rachel now checks Situation Monitor 3-4 times per week, specifically for regions where she has prediction market exposure. She doesn't use every panel — she ignores seismology and wildfire entirely — but the combination of military tracking, AI threat classification, and prediction market pricing is exactly what she needed. She shares a Situation Monitor link on Twitter, generating an OG preview card that drives 50 new visitors.

**Requirements revealed:** Region-focused exploration is intuitive. Military and conflict data are prominently surfaced. Prediction market panel correlates with threat assessments. Social sharing generates proper OG preview cards. The site is valuable even if users only engage with 3-4 of 17 domains.

---

### Journey 3: Casual Visitor — First Impressions from a Shared Link

**Opening Scene:** Marcus, a 28-year-old journalist, sees a friend share a Situation Monitor link on LinkedIn with the caption "This is wild — free real-time conflict tracking." The OG card shows a country instability summary for Ukraine with a threat level badge. Intrigued, he clicks.

**Rising Action:** The shared link includes query parameters (`?c=UA&t=ciianalysis`), so the SPA auto-navigates to Ukraine with the relevant analysis panel already open. Marcus doesn't need to find Ukraine on the globe — the deep-link puts him exactly where the sharer intended. He's immediately oriented: instability index, recent events, casualty data from ACLED, and an AI-generated analysis are all in view.

**Climax:** Marcus explores beyond Ukraine. He clicks Turkey and sees the intersection of seismic risk and refugee displacement overlaid on the same map. That cross-domain insight — the unexpected intersection of earthquake data with humanitarian data — is something he's never seen in a single tool before. He realizes this aggregates data he normally collects manually across 6-7 different sources for his reporting.

**Resolution:** Marcus bookmarks the site. He doesn't return every day, but when a major event breaks, he goes to Situation Monitor first for the multi-domain picture before checking traditional news sources. He's a periodic power user — low frequency, high engagement per session. He never signs up for anything because there's nothing to sign up for. The tool is just... there, and free.

**Requirements revealed:** Deep-link orientation from shared URLs — SPA auto-navigates to the relevant country/panel based on query params. First-load experience must be visually compelling and self-explanatory. Cross-domain correlation (the "unexpected intersection" moment) is a key retention driver. No signup friction — public and free.

---

### Journey 4: Social Preview Bot — Automated Link Unfurling

**Opening Scene:** Rachel (from Journey 2) pastes a Situation Monitor story link into Twitter: `https://situationmonitor.app/api/story?c=TW&t=ciianalysis`. Twitter's crawler bot (`twitterbot`) sends a GET request to this URL.

**Rising Action:** The Vercel Edge Middleware intercepts the request. It detects `twitterbot` in the user-agent string and allows it through (social preview bots are whitelisted while scrapers are blocked). The `/api/story` handler detects the bot UA and serves HTML with OpenGraph meta tags — `og:title` ("Taiwan Intelligence Brief | Situation Monitor"), `og:description`, `og:image` pointing to `/api/og-story?c=TW`. The bot follows the image URL to fetch the dynamically generated OG card.

**Climax:** The `/api/og-story` handler generates a PNG image with the country name, instability score, threat level badge, and branding. This image is returned to Twitter's crawler, which caches it. For real (non-bot) users clicking the same link, the handler returns a 302 redirect to the SPA with query params that deep-link to the Taiwan analysis view.

**Resolution:** The tweet appears in feeds with a rich card: country name, threat summary, branded image. This drives click-through to the site. Real users land on the SPA view, not the bot HTML. The pipeline works without any manual intervention — Rachel shares a link, the preview appears automatically, new users click through to the live dashboard.

**Requirements revealed:** Bot detection in edge middleware must be accurate (allow social bots, block scrapers). OG meta tags and image generation must be functional. OG image generation must complete within Vercel Hobby tier limits (10s serverless timeout, 128MB memory). Story URLs must deep-link into the SPA for real users. The entire chain (middleware → story handler → OG image → redirect) must work on Vercel's edge and serverless infrastructure.

---

### Journey Requirements Summary

| Capability Area | Journeys | Priority | FRs |
|----------------|----------|----------|-----|
| **Dashboard load & globe rendering** | Ed, Casual Visitor | MVP | FR1–FR3 |
| **AI summaries & threat classification** | Ed, Engaged Consumer | MVP | FR5, FR9, FR12 |
| **Cross-panel data correlation** | Ed, Engaged Consumer, Casual Visitor | MVP | FR4 |
| **Prediction market integration** | Engaged Consumer | MVP | FR7 |
| **Social sharing / OG preview pipeline** | Casual Visitor, Social Bot | MVP | FR13–FR17 |
| **Deep-link orientation from shared URLs** | Casual Visitor | MVP | FR16 |
| **Graceful degradation per data source** | All users | MVP | FR10–FR11 |
| **Offline/PWA resilience** | Ed, Casual Visitor | MVP | FR18–FR20 |
| **OG image generation within Hobby tier limits** | Social Bot | MVP | FR15 |
| **Operational visibility (logs, env vars)** | Ed | MVP | FR22, FR25 |
| **QA → Production promotion** | Ed | MVP | FR21, FR24 |
| **API key management** | Ed | MVP | FR22–FR23 |
| **Upstream sync workflow** | Ed | MVP | FR31–FR34 |
| **Content Creator / citation use** | (Emerging user type) | Growth | — |
| **Personalization / watchlists** | Engaged Consumer | Future | — |
| **Push alerts / notifications** | Ed, Engaged Consumer | Future | — |

## Domain-Specific Requirements

### External API Dependency Management

The platform's value is entirely dependent on 35+ external data sources. Managing these is the primary operational complexity.

**API Key Tiers and Cost Exposure:**

| Tier | APIs | Cost Risk | Strategy |
|------|------|-----------|----------|
| **Free, no key** | USGS, GDELT, UNHCR, Polymarket, Yahoo Finance, UCDP, Wikipedia, NHC, NOAA | $0 | No management needed — always available |
| **Free tier with key** | Groq, ACLED, NASA FIRMS, EIA, Wingbits, FRED, Cloudflare Radar | $0 if within limits | Monitor usage against free tier caps. Rate limit awareness in handlers. |
| **Paid with free tier** | Finnhub, OpenRouter, NewsAPI, AISStream | $0 → $$ if exceeded | Set hard usage caps. Alert on approaching limits. Never auto-escalate. |
| **No API key configured** | Any keyed source without a key | $0 | Graceful degradation — panel shows "data source not configured" rather than erroring |

**Key Management Requirements:**
- API keys stored as Vercel environment variables, scoped per environment (Preview vs Production)
- No API keys in source code or committed to git (already enforced by upstream `.env.example` pattern)
- Key rotation must be testable in QA before production promotion
- Dashboard must degrade gracefully when any individual API key is missing, expired, or rate-limited

**Cost Control Requirements:**
- Start with free-tier keys only — do not configure paid APIs until usage patterns are understood
- Upstash Redis free tier (10K commands/day) is the key cost boundary for AI caching — monitor daily command count
- Groq free tier handles AI summarization — if exhausted, the summarization feature silently degrades (already has fallback chain: Groq → OpenRouter → browser-side T5)
- Monthly cost audit: check Vercel, Upstash, and any keyed API dashboards

### Data Provenance

- All data comes from institutional/public sources — no user-generated content moderation needed
- AI-generated threat classifications and summaries should be understood as automated analysis, not authoritative intelligence assessments
- Data freshness varies by source (real-time for some, daily/weekly for others) — this is inherent and acceptable

### License Compliance

- Upstream is AGPL-3.0-only — any modifications to the deployed fork must keep source code publicly available
- Fork is already public on GitHub — compliance is met by default as long as the repo stays public

## Web Application Specific Requirements

### Project-Type Overview

Situation Monitor is a Single Page Application (SPA) built with Vite, rendering a WebGL-accelerated 3D globe with data overlay panels. The architecture is framework-free vanilla TypeScript with progressive web app (PWA) support. All data fetching happens client-side via sebuf RPC calls to Vercel Edge Functions.

### Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest 2 | Supported |
| Firefox | Latest 2 | Supported |
| Safari | Latest 2 | Supported (macOS + iOS) |
| Edge | Latest 2 | Supported |
| Older browsers | Any | Not supported — WebGL 2 + ES2020+ required |

**Requirements:**
- WebGL 2 support required (deck.gl, MapLibre GL JS)
- ES2020+ module support required
- No polyfills for legacy browsers — modern evergreen only
- Mobile browsers (Chrome/Safari on iOS/Android) should render correctly via existing responsive design

### Responsive Design

- Upstream already has mobile-responsive components (`mobile-map-popup.spec.ts`, mobile-specific harness files)
- Desktop is the primary experience (3D globe + multi-panel layout)
- Mobile is a functional secondary experience (simplified views)
- No changes needed for V1 — inherit upstream responsive behavior

### Performance Targets

See [Non-Functional Requirements > Performance](#performance) for testable performance targets with priority markers (NFR1–NFR7).

**Key principle:** Don't regress upstream performance — measure baseline via Lighthouse audit after initial deploy. Vercel Edge Functions + Upstash Redis caching provide the low-latency foundation.

**Growth:** Add `lighthouse-ci` to the GitHub Actions pipeline as a post-build check. Won't block deploys, but tracks score trends so performance/accessibility regressions are visible.

### SEO Strategy

SEO for a JavaScript SPA with WebGL rendering is inherently limited — search crawlers can't meaningfully index a dynamic globe. However, several strategies apply:

**Already built (inherit from upstream):**
- `public/llms.txt` and `public/llms-full.txt` — LLM discoverability (AI search engines like Perplexity, ChatGPT Search, Google AI Overviews)
- `public/robots.txt` — crawler directives
- OG meta tags via `/api/story` — social sharing generates rich previews
- Semantic HTML in `index.html` — title, description, meta tags

**MVP (low effort, high impact):**
- Update `index.html` meta tags to reflect Situation Monitor branding (not upstream World Monitor)
- **Update `llms.txt` and `llms-full.txt` with Situation Monitor branding** — these are SEO for AI search engines and should reflect the fork identity
- Verify `robots.txt` allows crawling of public pages
- Social sharing pipeline is the primary organic discovery channel — optimize OG cards

**Growth (post-MVP):**
- **Generate sitemap.xml from the country list using story URLs** (`/api/story?c=US`, `/api/story?c=UA`, etc.) — these serve HTML to crawlers and are indexable
- **Enhance `/api/story` to serve crawler-friendly HTML with substantive content per country** — country name, instability index, key events, "View live dashboard" CTA. ~195 countries × multiple analysis types = hundreds of indexable pages, all from existing data pipelines
- Server-side rendered landing page with project description, feature highlights, and live data snapshot
- Blog or changelog page (static markdown → HTML) for keyword-rich indexable content
- Structured data (JSON-LD) for Organization and WebApplication schema
- Submit sitemap to Google Search Console

**Future:**
- Dynamic country/topic pages with SSR ("/countries/taiwan" → pre-rendered intelligence summary)
- These would dramatically improve search presence but require architectural work

### Accessibility

Accessibility is a long-term commitment, approached progressively given the WebGL-heavy interface.

**V1 — Baseline (inherit + verify):**
- Ensure all interactive elements in panels have keyboard focus support
- **Verify tab order in panels** — Tab should move logically through panel controls, headers, data sections. Fix any random tab-order jumps.
- **Verify focus indicators are visible** — dark-themed dashboards often strip focus rings for aesthetics. Ensure they're visible when tabbing through controls.
- Verify screen reader can navigate panel text content (AI summaries, event lists, data tables)
- Ensure sufficient color contrast in panel text and UI controls
- Alt text on generated OG images (already has descriptive meta tags)

**Growth — Incremental improvements:**
- ARIA labels on all panel controls and navigation elements
- Keyboard navigation for panel switching and data exploration
- Skip-to-content links for panel navigation
- Reduced motion support (respect `prefers-reduced-motion` for globe animations)
- Screen reader announcements for panel data updates
- **Color-only meaning in globe clusters** — the globe uses red/orange/green clustering. Add shape differentiation (circles vs triangles vs squares) or pattern fills so meaning doesn't depend solely on color.

**Future — WCAG 2.1 AA target:**
- Alternative text-based view for core data (non-globe fallback for screen readers)
- Full keyboard navigation including map interaction alternatives
- Audit against WCAG 2.1 AA checklist
- Note: Full WCAG compliance for a WebGL 3D globe is an industry-wide unsolved problem. The goal is best-effort compliance for all *non-globe* UI elements (panels, controls, text, AI summaries — where 80% of actionable information lives), with the globe as an acknowledged limitation.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Operational MVP — the existing product is already deployed and verified on Vercel. The product exists (~107.5K LOC, 57 endpoints, 17 domains) and is live. The MVP isn't "build and deploy" — it's "establish the ground rules for future evolution, validate operational workflows, and begin incremental improvements."

**Resource Requirements:** Solo operator (Ed). Deployment is complete and verified. QA, operations, and development are the ongoing activities. The lean MVP is almost entirely configuration and validation, not coding. The upstream test suite does the heavy lifting on regression detection.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Ed (Daily Briefing & Operational Stewardship) — full journey
- Rachel (Prediction Market Edge-Seeker) — full journey (data already built)
- Marcus (Casual Visitor) — full journey via deep-link sharing
- Social Preview Bot — full journey (OG pipeline already built)

**Must-Have Capabilities:**

| # | Capability | Rationale |
|---|-----------|----------|
| 1 | ~~Vercel Production + Preview deployments~~ | ✅ **DONE** — deployed and verified working |
| 2 | Upstash Redis (separate QA/Prod instances or key prefixes) | AI summaries and threat classification don't work without caching |
| 3 | Environment variables for free-tier API keys | Data panels are empty without keys |
| 4 | **Environment variable checklist** derived from `.env.example` — verify each var is set in both Preview and Production | Silent failures from missing env vars are the highest-risk pain point |
| 5 | **Vercel build configuration verification** — confirm `vercel.json` rewrites, cache headers, and `[domain]/v1/[rpc].ts` catch-all route resolve correctly in the fork's Vercel project | Build config mismatch = nothing works |
| 6 | **`make generate` verification** — run sebuf codegen and confirm `src/generated/` output matches committed files | Codegen drift causes runtime type mismatches that are extremely painful to debug |
| 7 | GitHub Actions CI/CD (lint, unit tests, buf breaking, build, Playwright E2E) | Safety net — no code changes without it |
| 8 | **Endpoint smoke test script** (`scripts/validate-endpoints.sh`) — hits all 57 endpoints, checks for non-error responses (status ≠ 500, response not empty). Checked-in artifact, rerun after every upstream sync. | Playwright E2E tests user flows, not individual endpoints — need explicit endpoint coverage |
| 9 | **Manual domain-by-domain walkthrough** on Preview deployment — open each of 17 domain panels, confirm data renders | Catches UI-level integration issues that automated checks miss |
| 10 | All 57 endpoints validated (46 sebuf + 11 legacy) | If endpoints are broken, the site is broken |
| 11 | Upstream sync workflow (`upstream-sync` branch pattern) | Without this, the fork drifts and dies |
| 12 | OG preview pipeline functional (story + og-story endpoints) | Social sharing is the primary organic discovery channel |
| 13 | Branding updates (index.html meta tags, `llms.txt`, `llms-full.txt`, OG card branding) | Without this, it's just a mirror of World Monitor |
| 14 | Graceful degradation for missing/expired/rate-limited API keys | Panels must show "not configured" not crash |
| 15 | Lighthouse baseline audit on deployed Preview environment | One-time measurement to anchor all future performance/accessibility/SEO work |
| 16 | **New changes carry test coverage** — every PR that changes fork-specific code must include at least one test exercising the changed path. Enforced gate, not aspirational. | Success criteria already require this — make it concrete |

### Post-MVP Features (Phase 2 — Growth)

| # | Capability | Notes |
|---|-----------|-------|
| 1 | `lighthouse-ci` in GitHub Actions | Track score trends; don't block deploys, surface regressions |
| 2 | **Sitemap.xml from country list** using story URLs | SEO play — compounds with other Growth SEO investments |
| 3 | Enhanced `/api/story` for crawler-indexable country pages | ~195 countries × multiple analysis types = hundreds of indexable pages |
| 4 | SSR landing page with project description and live data snapshot | Keyword-rich indexable content |
| 5 | Structured data (JSON-LD) for Organization and WebApplication schema | Search engine rich results |
| 6 | Submit sitemap to Google Search Console | Formal search engine registration |
| 7 | Small UX improvements and customizations (identified through daily use) | Iterative evolution based on real usage |
| 8 | Additional API key integrations (expand active data sources) | As usage patterns clarify which domains matter |
| 9 | Automated upstream sync detection (GitHub Actions notification) | Manual monthly sync is sufficient initially |
| 10 | **Custom domain** (DNS + Vercel custom domain + SSL + URL updates) | Vercel's default `.vercel.app` works for MVP |
| 11 | ARIA labels, keyboard navigation, skip-to-content links | Incremental accessibility improvements |
| 12 | Color-only meaning differentiation in globe clusters | Shape/pattern alternatives for colorblind accessibility |
| 13 | Reduced motion support (`prefers-reduced-motion`) | Respect user preferences for globe animations |
| 14 | Monitoring and alerting (uptime, error rates) | Manual observation sufficient at solo-user scale |
| 15 | Blog or changelog page (static markdown → HTML) | Keyword-rich indexable content for SEO |

### Future Features (Phase 3 — Vision)

| # | Capability | Dependency |
|---|-----------|------------|
| 1 | Push-based alerts and notifications | Requires backend infrastructure beyond Hobby tier |
| 2 | Personalized watchlists with "what changed since last visit" | Requires user state / authentication |
| 3 | Opinionated curation layers (investment signals, safety advisories, prediction market opportunities) | Requires editorial framework + data pipeline |
| 4 | Dynamic SSR country/topic pages ("/countries/taiwan") | Significant architectural change |
| 5 | AIS relay deployment (Railway) | Only if maritime tracking becomes valuable |
| 6 | WCAG 2.1 AA audit and compliance | Requires Growth accessibility work first |
| 7 | Desktop builds (Tauri) | Out of scope for web deployment |
| 8 | Audience growth beyond personal use | Dependent on content/curation differentiators |

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Endpoint compatibility on Vercel | Medium | High | Validate on Preview first; smoke test script covers all 57 endpoints; manual domain walkthrough |
| Environment variable mapping gaps | High | Medium | Checklist derived from `.env.example`; verify both Preview + Production; silent failures are the primary pain point |
| Sebuf codegen drift | Low | High | Run `make generate` before first deploy; rerun after every upstream sync; compare generated output |
| Vercel build config mismatch | Medium | High | Verify `vercel.json` rewrites and route patterns resolve correctly in fork's project |
| Vercel Hobby tier limits (10s timeout, 128MB memory) | Low | Medium | OG image generation is the highest-risk endpoint; validate on Preview |

**Operational Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API key sprawl (35+ sources) | High | Low | Start with free-no-key sources; add free-with-key one by one; defer paid-tier entirely |
| Upstash Redis free tier exhaustion (10K commands/day) | Medium | Medium | Monitor daily command count; AI summarization has fallback chain (Groq → OpenRouter → browser T5) |
| Solo operator bottleneck | Medium | Medium | Lean MVP is mostly configuration; upstream test suite handles regression; time is the constraint, not skill |

**Upstream Sync Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking changes in upstream | Medium | High | `upstream-sync` branch isolates risk; proto/sebuf checkpoint after every merge; monthly sync = manageable deltas |
| Codegen tool version changes | Low | High | `make generate` after every sync; compare output before merging |
| Merge conflicts with fork customizations | Medium | Medium | Keep fork changes small and well-isolated initially; branding changes are low-conflict surface area |

**Market Risk:** None. Personal tool — product-market fit = "Ed uses it." No external validation needed for MVP.

## Functional Requirements

*This section defines the capability contract for MVP. Growth and Future capabilities are documented in Project Scoping but excluded from FRs until promoted to active development. Every feature, design, and story must trace back to a requirement listed here.*

### Data Visualization & Globe Interface

- **FR1:** Users can view a 3D globe with real-time data overlay clusters representing active global events
- **FR2:** Users can click globe clusters to navigate to specific countries or regions and see detailed data
- **FR3:** Users can view data panels for each of the 17 intelligence domains (conflict, seismology, cyber, energy, markets, etc.)
- **FR4:** Users can cross-reference data across multiple domain panels simultaneously (e.g., conflict + markets + prediction markets)
- **FR5:** Users can view AI-generated summaries and threat classifications for countries and regions
- **FR6:** Users can view a Country Instability Index with threat level indicators per country
- **FR7:** Users can view prediction market data (Polymarket) alongside geopolitical and threat assessments

### Data Source Integration

- **FR8:** The system can aggregate data from 35+ external sources across 17 intelligence domains
- **FR9:** The system can cache AI summaries and threat classifications via a multi-tier cache (in-memory → Redis → upstream API)
- **FR10:** The system can degrade gracefully when any individual data source is unavailable, misconfigured, or rate-limited — affected panels display an informative status rather than crashing
- **FR11:** The system can operate with any subset of API keys configured — panels with available keys show data, panels without keys show a "not configured" state
- **FR12:** The system can fall back through the AI summarization chain (Groq → OpenRouter → browser-side T5) when higher-priority providers are unavailable

### Social Sharing & Discovery

- **FR13:** Users can share country-specific analysis URLs that generate rich social preview cards (OG title, description, image)
- **FR14:** The system can detect social media crawler bots and serve them HTML with OpenGraph meta tags
- **FR15:** The system can generate dynamic OG preview images with country name, instability score, threat level, and branding
- **FR16:** Real users clicking shared links are redirected to the SPA with deep-link parameters that auto-navigate to the relevant country and analysis panel
- **FR17:** The system can serve story URLs (`/api/story`) as HTML pages for crawlers, supporting search engine indexability

### Offline & Progressive Web App

- **FR18:** Users can view previously cached data when network connectivity is lost
- **FR19:** The system can serve static assets from cache and fetch data over network (cache-first for assets, network-first for data)
- **FR20:** Users can access an offline fallback page when the full application cannot load

### Deployment & Environment Management

- **FR21:** The operator can deploy the application to separate Preview (QA) and Production environments
- **FR22:** The operator can configure environment variables (API keys, Redis URLs) scoped independently per environment
- **FR23:** The system can maintain separate Redis cache instances (or key prefixes) for QA and Production to prevent cross-environment cache pollution
- **FR24:** The operator can promote changes from QA to Production only after validation in the Preview environment
- **FR25:** The operator can verify the build configuration (rewrites, cache headers, route patterns) resolves correctly after deployment

### CI/CD & Quality Assurance

- **FR26:** The system can run an automated quality gate on every pull request (lint, unit tests, proto breaking change detection, build, E2E tests)
- **FR27:** The system can block production deployment when the CI pipeline fails
- **FR28:** The operator can run an endpoint smoke test script that validates all 57 endpoints return non-error responses
- **FR29:** The operator can run a Lighthouse audit against the deployed Preview environment and record baseline scores
- **FR30:** Every PR that changes fork-specific code includes at least one test exercising the changed path

### Upstream Sync & Fork Management

- **FR31:** The operator can merge upstream changes via a dedicated `upstream-sync` branch without affecting the main branch
- **FR32:** The operator can run proto/sebuf codegen (`make generate`) and verify generated output matches committed files after an upstream merge
- **FR33:** The system can detect proto breaking changes via `buf breaking` as part of the CI pipeline
- **FR34:** The operator can run the full test suite against the upstream-sync branch before merging to main

### Branding & Identity

- **FR35:** The application displays Situation Monitor branding (not World Monitor) in page titles, meta tags, and descriptions
- **FR36:** The LLM discoverability files (`llms.txt`, `llms-full.txt`) reflect Situation Monitor identity and content
- **FR37:** Generated OG preview images display Situation Monitor branding
- **FR38:** The system serves a `robots.txt` that permits crawling of public pages

## Non-Functional Requirements

*NFRs define how well the system performs, not what it does. Only categories relevant to this product are included. Priority markers indicate validation order: P0 = validate on first deployment, P1 = measure baseline early, P2 = verify during scheduled audits.*

### Performance

| ID | Requirement | Priority |
|----|------------|----------|
| **NFR1** | Initial page load (Largest Contentful Paint) completes in under 4 seconds on broadband connections | P1 |
| **NFR2** | Globe becomes interactive (Time to Interactive) within 6 seconds of navigation | P1 |
| **NFR3** | Individual data panel refreshes complete within 2 seconds of user action or data request | P1 |
| **NFR4** | Static assets are served with immutable cache headers (≥1 year) to eliminate redundant downloads on repeat visits | P2 |
| **NFR5** | The service worker caches static assets on first visit, enabling sub-second repeat load times for cached resources | P2 |
| **NFR6** | Edge function responses return within 500ms for Redis cache hits. Cold starts may add up to 2 seconds on first invocation per region. | P1 |
| **NFR7** | OG image generation completes within Vercel Hobby tier constraints (10-second serverless timeout, 128MB memory) | P0 |

### Security

| ID | Requirement | Priority |
|----|------------|----------|
| **NFR8** | API keys are never committed to source control or exposed in client-side code | P0 |
| **NFR9** | API keys are stored exclusively as Vercel environment variables, scoped per deployment environment (Preview vs Production) | P0 |
| **NFR10** | The edge middleware blocks known scraper and abuse bot user-agents while allowing legitimate social preview bots | P2 |
| **NFR11** | No user authentication data or personally identifiable information is collected, stored, or transmitted | P2 |
| **NFR12** | All traffic between users and Vercel is served over HTTPS (enforced by Vercel infrastructure) | P0 |
| **NFR13** | Redis connections use TLS encryption (enforced by Upstash) | P0 |

### Reliability

| ID | Requirement | Priority |
|----|------------|----------|
| **NFR14** | Site availability of 99%+ as provided by Vercel's infrastructure (no self-managed uptime obligation) | P1 |
| **NFR15** | Failure of any single external data source does not cause application-wide errors — other panels continue functioning normally | P0 |
| **NFR16** | The CI pipeline produces identical pass/fail results on re-run of the same commit. Any test that fails intermittently is quarantined within 24 hours and fixed or removed within one week. | P1 |
| **NFR17** | Zero post-deployment regressions — every change passes through QA (Preview) before reaching Production | P0 |
| **NFR18** | The service worker provides continuity during brief network interruptions — cached views remain accessible, data refreshes when connectivity returns | P2 |

### Accessibility

| ID | Requirement | Priority |
|----|------------|----------|
| **NFR19** | All non-globe UI elements (panels, controls, text content) meet WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text) | P2 |
| **NFR20** | All interactive elements are reachable via keyboard Tab navigation in a logical order | P2 |
| **NFR21** | Focus indicators are visually distinct when navigating via keyboard (not suppressed for aesthetics) | P2 |
| **NFR22** | Screen readers can access panel text content including AI summaries, event lists, and data tables | P2 |
| **NFR23** | The offline fallback page meets basic accessibility standards (readable, navigable) | P2 |

### Integration

| ID | Requirement | Priority |
|----|------------|----------|
| **NFR24** | The system tolerates external API response times up to 10 seconds before timing out and falling back to cached data or degraded state | P1 |
| **NFR25** | The system retries transient failures (5xx, network timeout) for external APIs with appropriate backoff — no retry storms | P1 |
| **NFR26** | Redis unavailability causes graceful degradation to direct upstream API calls, not application failure | P0 |
| **NFR27** | The AI summarization fallback chain (Groq → OpenRouter → browser-side T5) activates automatically without operator intervention | P1 |
| **NFR28** | External API rate limit responses (429) are handled by backing off and serving cached data where available | P1 |

### Cost

| ID | Requirement | Priority |
|----|------------|----------|
| **NFR29** | Total monthly infrastructure cost remains at $0 across Vercel, Upstash, and all API providers. Any billable usage triggers investigation before the next billing cycle. | P0 |
| **NFR30** | Daily Upstash Redis command count stays below 8,000 (80% of free tier limit of 10,000). If exceeded, investigate caching patterns before tier upgrade. | P1 |

### Deployment & Operations

| ID | Requirement | Priority |
|----|------------|----------|
| **NFR31** | Environment variable changes propagate to Preview deployments within 2 minutes. Production deployment completes within 5 minutes of merge to main. | P1 |
| **NFR32** | The endpoint smoke test script (`scripts/validate-endpoints.sh`) can be run with any single API key removed to verify graceful degradation per domain. | P1 |
| **NFR33** | Running `make generate` on a clean checkout produces byte-identical output to the committed `src/generated/` files. Any drift fails the CI pipeline. | P0 |
