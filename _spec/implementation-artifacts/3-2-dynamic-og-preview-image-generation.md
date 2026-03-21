# Story 3.2: Dynamic OG Preview Image Generation

Status: ready-for-dev

## Story

As a **user sharing a country analysis link**,
I want the preview card to show a dynamic image with the country name, instability score, and threat level,
So that the shared link is visually compelling and informative.

## Acceptance Criteria

1. **Given** a bot requests the OG image URL for a specific country
   **When** the serverless function generates the image
   **Then** it renders: country name, instability score, threat level indicator, and **Situation Monitor** branding (FR37)
   **And** generation completes within 10-second Vercel Hobby timeout and 128MB memory limit (NFR7)

2. **Given** the OG image has been generated recently
   **When** another request arrives for the same country
   **Then** the cached version is served from Redis (multi-tier cache — FR9)

3. **Given** an invalid country code is requested
   **When** the OG function processes it
   **Then** it returns a generic Situation Monitor branded fallback image (never a broken image or error)

## Tasks / Subtasks

- [ ] Task 1: Fork-brand the OG image SVG — replace "WORLDMONITOR" with "SITUATION MONITOR" (AC: #1)
  - [ ] 1.1 Update the brand text element from `WORLDMONITOR` to `SITUATION MONITOR`
  - [ ] 1.2 Update the logo circle `W` to `SM` (or appropriate abbreviation)
  - [ ] 1.3 Replace footer text `worldmonitor.app` with `situationmonitor.app` reference and update tagline
  - [ ] 1.4 Update letter-spacing if needed to accommodate longer name
- [ ] Task 2: Fix the existing score variable bug (AC: #1)
  - [ ] 2.1 Fix the `scoreNum` self-reference bug on the `Math.max(0, Math.min(100, scoreNum))` line — it references `scoreNum` before it's assigned; should reference `parsedScore`
- [ ] Task 3: Expand COUNTRY_NAMES dictionary (AC: #3)
  - [ ] 3.1 Expand from 20 to comprehensive coverage (~195 countries) using ISO 3166-1 alpha-2 codes
  - [ ] 3.2 Ensure the fallback (`countryCode || 'Global'`) still works for any truly unknown code
- [ ] Task 4: Add Redis caching layer (AC: #2)
  - [ ] 4.1 Import `getCachedJson` and `setCachedJson` from `server/_shared/redis.ts` (note: og-story.js is a Vercel serverless function, verify import compatibility — may need direct Upstash REST fetch pattern instead)
  - [ ] 4.2 Build cache key as `og:img:{countryCode}:{level}:{score}` (include all variant params)
  - [ ] 4.3 On cache hit: return cached SVG with `Content-Type: image/svg+xml` and cache headers
  - [ ] 4.4 On cache miss: generate SVG, store in Redis with 1-hour TTL, then return
  - [ ] 4.5 On Redis failure: generate SVG fresh (graceful degradation — NFR26)
- [ ] Task 5: Implement fallback image for invalid/missing country codes (AC: #3)
  - [ ] 5.1 When country code is missing or not in dictionary, render a generic "Situation Monitor — Global Intelligence Dashboard" branded card
  - [ ] 5.2 Never return an error response — always return a valid SVG image
- [ ] Task 6: Update tests (AC: #1, #2, #3)
  - [ ] 6.1 Update existing tests in `api/og-story.test.mjs` to expect "SITUATION MONITOR" branding
  - [ ] 6.2 Add test for the score variable bug fix (verify score=50 renders correctly)
  - [ ] 6.3 Add test for fallback image with invalid country code
  - [ ] 6.4 Add test for empty/missing query params
  - [ ] 6.5 Add test verifying Redis cache integration (mock Redis calls)
- [ ] Task 7: Update `api/story.js` OG references (AC: #1)
  - [ ] 7.1 Update `og:site_name` from "World Monitor" to "Situation Monitor" in `api/story.js`
  - [ ] 7.2 Update the page `<title>` suffix from "World Monitor" to "Situation Monitor"

## Dev Notes

### Critical Bug Fix Required

There is an existing bug in `api/og-story.js` at line where `scoreNum` is computed:

```javascript
const parsedScore = score ? Number.parseInt(score, 10) : Number.NaN;
const scoreNum = Number.isFinite(parsedScore)
  ? Math.max(0, Math.min(100, scoreNum))  // BUG: references scoreNum (itself) instead of parsedScore
  : null;
```

This causes `scoreNum` to always be `null` when a score is provided since `scoreNum` is `undefined` at point of reference. Fix to:

```javascript
const scoreNum = Number.isFinite(parsedScore)
  ? Math.max(0, Math.min(100, parsedScore))
  : null;
```

### Branding — Fork Identity (FR35, FR37)

The existing `api/og-story.js` uses "WORLDMONITOR" branding throughout. Per FR37, all generated OG preview images must display **Situation Monitor** branding. The fork's canonical branding is defined in `src/config/variant-meta.ts`:

- `siteName`: "Situation Monitor"
- `title`: "Situation Monitor - Real-Time Global Intelligence Dashboard"
- `description`: "Situation Monitor: Real-time global intelligence dashboard..."
- `url`: "https://worldmonitor.app/" (domain unchanged, brand name changed)

Similarly, `api/story.js` references "World Monitor" in `og:site_name` and page title — update both to "Situation Monitor".

### Existing OG Image Architecture

The current implementation at `api/og-story.js` uses **native SVG generation** (string template), NOT `@vercel/og` or `satori`. This is intentional — it's lightweight, fast, and stays within Vercel Hobby tier limits. **Do NOT introduce @vercel/og or satori.** The SVG approach works and is already in production.

**Current image specs:**
- Format: SVG (`image/svg+xml`)
- Dimensions: 1200×630 (standard OG card size)
- Cache-Control: `public, max-age=3600, s-maxage=3600, stale-while-revalidate=600`
- Query params: `c` (country code), `t` (analysis type), `s` (score 0-100), `l` (level: critical/high/elevated/normal/low)

**Design elements already implemented:**
- Dark gradient background (`#0c0c18` → `#0a0a12`)
- Color-coded threat levels (critical=#ef4444, high=#f97316, elevated=#eab308, normal=#22c55e, low=#3b82f6)
- Left accent sidebar with level gradient
- Subtle grid overlay
- Country name in large bold text
- CII score with semicircle arc gauge (when score provided)
- Feature cards (when no score provided)
- Data indicator row
- Bottom bar with logo and CTA
- XSS/injection protection via `escapeXml()`

### Redis Caching Pattern

Use the Upstash Redis REST pattern from `server/_shared/redis.ts`. Since `og-story.js` is a **Vercel Serverless Function** (not Edge), it can use the same HTTP-based Redis wrapper.

**Important:** The Redis client uses environment-based key prefixes (`prefixKey()`). Production gets no prefix; preview gets `preview:{sha}:`. The OG image cache key should go through this prefix system.

**Cache strategy:**
- Cache key: `og:img:{c}:{l}:{s}` (e.g., `og:img:US:critical:88`)
- TTL: 3600s (1 hour) — matches existing `Cache-Control` max-age
- On Redis miss: generate SVG, cache it, return
- On Redis error: generate SVG, return without caching (NFR26 graceful degradation)

**Redis command budget consideration (10,000/day):** Each OG image request is 1 GET (cache check) + 1 SET (on miss). Social bot requests are relatively infrequent, so OG caching won't materially impact the daily budget. Most cards will be cache hits after initial generation.

### Bot Detection & Request Flow

The middleware (`middleware.ts`) already handles bot routing:
1. Social bots (twitterbot, facebookexternalhit, linkedinbot, etc.) are **whitelisted** for `/api/og-story`
2. Generic crawlers/scrapers are **blocked** with 403
3. The `SOCIAL_PREVIEW_PATHS` set includes `/api/og-story`

No middleware changes are needed for this story.

### Country Names — Expand Coverage

The current `COUNTRY_NAMES` dictionary in `api/og-story.js` only has 20 entries. The same limited dictionary exists in `api/story.js`. Expand to comprehensive ISO 3166-1 alpha-2 coverage so any valid country code produces a proper name. Consider extracting a shared constant file (e.g., `api/data/country-names.js`) to avoid duplication between `og-story.js` and `story.js`.

### Security

- **Input sanitization:** The existing `escapeXml()` function handles XSS prevention for SVG content. Preserve this pattern for all user-supplied values.
- **Level normalization:** The `normalizeLevel()` function already validates levels against an allowlist. Preserve this.
- **Country code handling:** Already uppercased and used only for dictionary lookup. Safe pattern.
- **No API keys needed:** This endpoint is public (serves images to social bots). No API key validation.

### Performance Constraints (NFR7)

- **Vercel Hobby timeout:** 10 seconds — SVG string generation is nearly instant (<10ms). Redis lookup adds ~50-100ms. Well within budget.
- **Memory:** 128MB — SVG strings are small (~5-10KB). No risk.
- **Bundle size:** No new dependencies needed. Pure string template generation.

### UX Requirements

From UX Design Specification:
- OG card must be "compelling at thumbnail size" — threat badge, country, branding readable
- OG card palette tokens: `--sm-og-bg`, `--sm-og-accent` (CSS design tokens for consistency)
- The social share preview is described as the "primary organic growth channel"
- LinkedIn aggressively caches OG cards for ~7 days (known constraint, no mitigation needed)

### Project Structure Notes

- `api/og-story.js` — Serverless function (NOT Edge). Stays as `.js` (not TypeScript). Follows legacy REST pattern.
- `api/story.js` — Companion handler. Same pattern. Both are non-sebuf endpoints.
- `api/og-story.test.mjs` — Existing test file using Node.js native test runner (`node:test`).
- `server/_shared/redis.ts` — Redis wrapper. Import path from serverless function context.
- `middleware.ts` — Edge middleware. **Do not modify** — already correctly configured.

### References

- [Source: _spec/planning-artifacts/epics.md — Epic 3, Story 3.2]
- [Source: _spec/planning-artifacts/architecture.md — NFR7, OG Image Pipeline, Graceful Degradation, Dual Runtime, Data Architecture]
- [Source: _spec/planning-artifacts/prd.md — FR13, FR14, FR15, FR37, NFR7, Journey 4]
- [Source: _spec/planning-artifacts/ux-design-specification.md — Journey 4 Sequence, OG Card Design, Critical Success Moments]
- [Source: api/og-story.js — Existing SVG OG image generator]
- [Source: api/og-story.test.mjs — Existing test suite]
- [Source: api/story.js — Story page handler with OG meta tags]
- [Source: middleware.ts — Bot detection and routing]
- [Source: server/_shared/redis.ts — Redis caching wrapper with prefixKey]
- [Source: src/config/variant-meta.ts — Fork branding metadata]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
