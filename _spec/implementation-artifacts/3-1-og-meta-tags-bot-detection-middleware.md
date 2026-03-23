# Story 3.1: OG Meta Tags & Bot Detection Middleware

Status: ready-for-dev

## Story

As a **user sharing a link on social media**,
I want the shared URL to generate a rich preview card,
So that my audience sees a meaningful preview before clicking.

## Acceptance Criteria

1. **Given** a social media bot (Twitter, Facebook, LinkedIn, Telegram, Slack, Discord, Reddit, WhatsApp) requests a country URL (`/api/story?c={CC}&t=ciianalysis`)
   **When** the edge middleware detects the bot user-agent
   **Then** the request passes through to `/api/story` which serves HTML with OpenGraph meta tags:
   - `og:title` = "{Country Name} Intelligence Brief | Situation Monitor"
   - `og:description` = "Real-time instability analysis for {Country Name}..."
   - `og:image` = dynamic preview image URL (`/api/og-story?c={CC}&...`)
   - `og:site_name` = "Situation Monitor"
   - `twitter:card` = "summary_large_image"
   - Canonical URL, image dimensions (1200x630)

2. **Given** a known scraper/abuse bot (AhrefsBot, SemrushBot, MJ12Bot, DotBot, BaiduSpider, YandexBot, ByteSpider, PetalBot, GPTBot, ClaudeBot, CCBot, etc.) requests any `/api/*` path
   **When** the edge middleware inspects the user-agent
   **Then** it returns HTTP 403 with `{"error":"Forbidden"}`

3. **Given** a real user clicks the same shared link (`/api/story?c={CC}&t=ciianalysis`)
   **When** the request reaches the `/api/story` handler
   **Then** they receive a 302 redirect to the SPA with deep-link parameters (`/?c={CC}&t=ciianalysis`)

4. **Given** an invalid or empty country code is passed
   **When** the handler processes the request
   **Then** `og:title` uses "Global" as the country name (graceful fallback — never an error page)

5. **Given** the OG image URL is followed by the bot
   **When** `/api/og-story` is requested
   **Then** it returns an SVG image (1200x630) with Situation Monitor branding within Vercel Hobby constraints (10s timeout, 128MB mem) — (NFR7)

6. **Given** a social bot requests the root path `/` on the main domain
   **When** the middleware detects the bot user-agent
   **Then** it serves variant-aware OG HTML (existing behavior must be preserved for variant subdomains)

## Tasks / Subtasks

- [ ] **Task 1: Update `api/story.js` — Rebrand to Situation Monitor** (AC: #1, #3, #4)
  - [ ] 1.1 Change `og:site_name` from "World Monitor" to "Situation Monitor"
  - [ ] 1.2 Change `og:title` template from `{Country} Intelligence Brief | World Monitor` to `{Country} Intelligence Brief | Situation Monitor`
  - [ ] 1.3 Update description text to reference "Situation Monitor" instead of generic text
  - [ ] 1.4 Update `twitter:site` from `@WorldMonitorApp` to `@SituationMonitor` (or remove if no handle exists)
  - [ ] 1.5 Verify 302 redirect for real users sends to SPA with deep-link params `/?c={CC}&t={type}`
  - [ ] 1.6 Verify the `esc()` HTML-escaping function prevents XSS in all interpolated values

- [ ] **Task 2: Update `api/og-story.js` — Rebrand SVG to Situation Monitor** (AC: #5)
  - [ ] 2.1 Change "WORLDMONITOR" branding text to "SITUATION MONITOR" in the SVG
  - [ ] 2.2 Update tagline from "Real-time global intelligence monitoring" to "Real-time global intelligence dashboard"
  - [ ] 2.3 Update URL text from "worldmonitor.app" to "situationmonitor.app" (or whatever the fork domain is)
  - [ ] 2.4 Update the "W" logo monogram in the circle to "SM" or appropriate branding
  - [ ] 2.5 Verify existing `escapeXml()` sanitization covers all user inputs (`countryCode`, `countryName`, `level`)
  - [ ] 2.6 Ensure SVG renders correctly with the `normalizeLevel()` allowlist (prevents injection)

- [ ] **Task 3: Verify `middleware.ts` bot detection logic** (AC: #2, #6)
  - [ ] 3.1 Confirm `SOCIAL_PREVIEW_UA` regex covers all required social bots (Twitter, Facebook, LinkedIn, Slack, Telegram, WhatsApp, Discord, Reddit)
  - [ ] 3.2 Confirm `BOT_UA` regex blocks known scraper/abuse bots per NFR10
  - [ ] 3.3 Confirm `SOCIAL_PREVIEW_PATHS` includes both `/api/story` and `/api/og-story`
  - [ ] 3.4 Verify the UA-length check (< 10 chars) blocks scriptbots without false positives on legitimate minimal UAs
  - [ ] 3.5 Verify the variant-aware OG response for root `/` path works correctly
  - [ ] 3.6 **No middleware restructuring needed** — existing bot/human bifurcation logic is architecturally sound

- [ ] **Task 4: Update unit tests** (AC: #1–#5)
  - [ ] 4.1 Update `api/og-story.test.mjs` — verify "SITUATION MONITOR" branding in SVG output (expand existing tests)
  - [ ] 4.2 Create or update test for `api/story.js` — verify bot path returns HTML with `og:site_name` = "Situation Monitor"
  - [ ] 4.3 Create or update test for `api/story.js` — verify real-user path returns 302 redirect to SPA
  - [ ] 4.4 Test invalid country code falls back gracefully to "Global"
  - [ ] 4.5 Test that HTML-escaped values prevent XSS in OG meta tag content

- [ ] **Task 5: Validate with OG debugging tools** (AC: #1, #5)
  - [ ] 5.1 Run local Vercel dev (`npx vercel dev`) and test `/api/story?c=UA&t=ciianalysis` with curl and bot UA
  - [ ] 5.2 Confirm SVG renders at `/api/og-story?c=UA&s=72&l=high`
  - [ ] 5.3 Optionally validate with opengraph.xyz or Twitter Card Validator on preview deployment

## Dev Notes

### Existing Code Analysis — What Already Works

The OG meta tag pipeline is **already implemented in upstream World Monitor**. The three key files are:

1. **`middleware.ts`** (Edge Middleware) — Bot/human bifurcation at the edge. Social preview bots are whitelisted on `/api/story` and `/api/og-story` paths. Scraper bots get 403. Real users pass through. **This file needs minimal or no changes** for story 3.1.

2. **`api/story.js`** (Serverless) — Bot detection via `BOT_UA` regex. Bots get HTML with OG meta tags. Real users get 302 redirect to SPA. **Needs rebranding**: currently says "World Monitor" in title, site_name, and twitter:site.

3. **`api/og-story.js`** (Serverless) — Generates 1200x630 SVG cards with country name, CII score, threat level badge, gauge arc, and branding. **Needs rebranding**: currently shows "WORLDMONITOR", "worldmonitor.app", and "W" logo.

### What This Story Actually Requires

This story is primarily a **Tier 2 branding patch** on existing functional infrastructure:

- The bot detection logic works correctly
- The OG pipeline works correctly
- The deep-link redirect works correctly
- The middleware routing works correctly

**The core work is rebranding "World Monitor" → "Situation Monitor" in the OG output** and validating the complete pipeline works with tests.

### Critical Anti-Patterns to Avoid

- **DO NOT refactor the middleware.ts bot detection logic** — it is architecturally sound and tested. The social bot allowlist + scraper blocklist pattern is correct.
- **DO NOT add new npm dependencies** for OG image generation (no Sharp, no Puppeteer, no @vercel/og). The current SVG approach works within 128MB Vercel Hobby memory and 10s timeout. Story 3.2 may later add PNG generation, but 3.1 stays with SVG.
- **DO NOT modify the CSP headers** in `index.html` or `vercel.json` — OG images are served from the same origin.
- **DO NOT change the existing `VARIANT_HOST_MAP` or `VARIANT_OG` records** in `middleware.ts` — those are for variant subdomains (tech, finance, happy), not the fork rebranding.
- **DO NOT change the Edge middleware matcher config** `['/', '/api/:path*', '/favico/:path*']` — it's correct.

### Security Notes

- `escapeXml()` in `og-story.js` prevents SVG injection — must be applied to all interpolated values (country name, country code)
- `esc()` in `story.js` prevents HTML injection in meta tags — covers `&`, `"`, `<`, `>`
- `normalizeLevel()` in `og-story.js` uses an allowlist pattern — prevents arbitrary CSS color injection via the `l=` parameter
- `countryCode` is `.toUpperCase()` and looked up in `COUNTRY_NAMES` object — unknown codes fall back to the raw code string (safe, just not pretty)
- All query params are treated as untrusted input — no SQL, no eval, no template literals with unescaped user data

### Vercel Deployment Constraints (Hobby Tier)

- Serverless function timeout: **10 seconds** (og-story.js must generate within this)
- Serverless function memory: **128MB** (SVG generation is lightweight, well within budget)
- Edge middleware: limited compute (current middleware is fast — regex matching only)
- The SVG approach avoids Puppeteer/headless Chrome which would exceed memory limits

### File Impact Summary

| File | Change Type | Scope |
|------|------------|-------|
| `api/story.js` | Modify | Rebrand strings: title, description, site_name, twitter:site |
| `api/og-story.js` | Modify | Rebrand strings: WORLDMONITOR → SITUATION MONITOR, URL, logo |
| `middleware.ts` | Verify only | Confirm bot detection works — no changes expected |
| `api/og-story.test.mjs` | Modify | Update assertions for new branding strings |
| `api/story.test.mjs` | Create (if absent) or Modify | Test bot HTML output and real-user redirect |

### Project Structure Notes

- Tests are co-located with source: `api/og-story.test.mjs` next to `api/og-story.js`
- Test runner: Node.js built-in `node:test` with `node:assert` (strict)
- No test framework dependencies (no Jest, no Vitest for these API tests)
- Test command: `node --test api/og-story.test.mjs` (or `make test` if configured)
- Middleware.ts uses Vercel Edge Runtime — no Node.js APIs, Web standard Request/Response

### Caching

- `story.js` sets `Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=60` — 5 min cache, acceptable for OG meta
- `og-story.js` sets `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=600` — 1 hour cache for SVG images
- LinkedIn aggressively caches OG cards for ~7 days — known constraint, no mitigation needed

### References

- [Source: _spec/planning-artifacts/epics.md — Story 3.1 acceptance criteria, lines 778–803]
- [Source: _spec/planning-artifacts/architecture.md — OG Image Pipeline, lines 237–247]
- [Source: _spec/planning-artifacts/architecture.md — Bot/Human Bifurcation, lines 180–183]
- [Source: _spec/planning-artifacts/architecture.md — Graceful Degradation, lines 125–133]
- [Source: _spec/planning-artifacts/architecture.md — Request Pipeline, lines 156–169]
- [Source: _spec/planning-artifacts/architecture.md — Vercel Hobby Constraints, lines 1036–1052]
- [Source: _spec/planning-artifacts/prd.md — FR13–FR17, lines 2199–2219]
- [Source: _spec/planning-artifacts/prd.md — FR35–FR38 Branding, lines 2345–2355]
- [Source: _spec/planning-artifacts/prd.md — NFR7, line 2397]
- [Source: _spec/planning-artifacts/prd.md — NFR10, line 2409]
- [Source: _spec/planning-artifacts/prd.md — Journey 4: Social Preview Bot, lines 1348–1393]
- [Source: _spec/planning-artifacts/ux-design-specification.md — Journey 4 sequence diagram, lines 1863–1895]
- [Source: _spec/planning-artifacts/ux-design-specification.md — OG Card Branding Patch spec, lines 2366–2384]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
