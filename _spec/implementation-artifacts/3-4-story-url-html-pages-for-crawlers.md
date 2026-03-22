# Story 3.4: Story URL HTML Pages for Crawlers

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **search engine crawler**,
I want `/api/story` URLs to return indexable HTML,
So that Situation Monitor content appears in search results.

## Acceptance Criteria

1. **Given** a crawler (Googlebot, Bingbot, or social preview bot) requests a `/api/story` URL
   **When** the server processes the request
   **Then** it returns an HTML page with structured content, meta tags, and Situation Monitor branding (FR17)
   **And** the HTML includes proper `<title>`, `<meta description>`, and canonical URL
   **And** the `og:site_name` reads "Situation Monitor" (not "World Monitor")

2. **Given** a real user requests the same `/api/story` URL
   **When** the server detects a non-bot user-agent
   **Then** it redirects (302) to the SPA with appropriate deep-link parameters (`?c={countryCode}&t={type}`)

3. **Given** a search engine crawler (Googlebot, Bingbot, Yandex, DuckDuckBot, Applebot) requests `/api/story`
   **When** the middleware evaluates the request
   **Then** the crawler is allowed through to the story handler (not blocked by the generic bot filter)

4. **Given** the HTML served to crawlers
   **When** a search engine indexes the page
   **Then** the page includes substantive content: country name, instability score, threat level, intelligence brief description, and a "View live analysis" CTA linking to the SPA

## Scope Boundary

This story covers:
- Updating `middleware.ts` to whitelist search engine crawlers on `/api/story` and `/api/og-story` paths
- Updating `api/story.js` to serve richer, crawler-friendly HTML with Situation Monitor branding
- Updating `api/story.js` branding from "World Monitor" to "Situation Monitor"
- Adding structured data (JSON-LD) to the story HTML for enhanced search results
- Expanding the country name map to cover all ~195 countries (via shared data file or inline)
- Adding unit tests for the enhanced story handler (`api/story.test.mjs`)
- Registering the new test file in `package.json` `test:sidecar` script

This story does NOT cover:
- `api/og-story.js` branding changes (OG image still shows upstream "WORLDMONITOR" — fork OG image branding is a separate concern once visual identity is fully defined in Epic 2)
- Sitemap.xml generation (Epic 11, Story 11.1)
- SSR landing page (Epic 11, Story 11.2)
- Deep-link navigation/animation skip (Story 3.3)
- OG meta tag middleware (Story 3.1 — middleware bot detection for social bots already exists)

## Tasks / Subtasks

- [ ] **Task 1: Update middleware.ts — whitelist search engine crawlers on story paths** (AC: #3)
  - [ ] 1.1 Add a `SEARCH_ENGINE_UA` regex in `middleware.ts` matching: `googlebot`, `bingbot`, `yandexbot`, `duckduckbot`, `applebot`, `baiduspider`
  - [ ] 1.2 Add a check that allows `SEARCH_ENGINE_UA` through on `SOCIAL_PREVIEW_PATHS` (same paths as social bots: `/api/story`, `/api/og-story`)
  - [ ] 1.3 Place the check BEFORE the generic `BOT_UA` block so search engines are not rejected

- [ ] **Task 2: Update api/story.js — expand bot detection to include search engine crawlers** (AC: #1, #2)
  - [ ] 2.1 Update the `BOT_UA` regex in `api/story.js` to also match `bingbot`, `yandexbot`, `duckduckbot`, `applebot`, `baiduspider` in addition to existing social bots
  - [ ] 2.2 Confirm non-bot user-agents still receive 302 redirect to SPA (AC #2, no regression)

- [ ] **Task 3: Update api/story.js — rebrand from "World Monitor" to "Situation Monitor"** (AC: #1)
  - [ ] 3.1 Change `og:site_name` from "World Monitor" to "Situation Monitor"
  - [ ] 3.2 Change `twitter:site` from `@WorldMonitorApp` to `@worldmonitorapp` (or remove if no fork Twitter account exists yet — use `@worldmonitorapp` as placeholder)
  - [ ] 3.3 Update the page `<title>` template from `${countryName} Intelligence Brief | World Monitor` to `${countryName} Intelligence Brief | Situation Monitor`
  - [ ] 3.4 Update the description text to reference "Situation Monitor" instead of generic phrasing

- [ ] **Task 4: Enhance HTML body content for crawler indexability** (AC: #4)
  - [ ] 4.1 Expand the `<body>` section with semantic HTML: `<article>`, `<header>`, `<section>` elements
  - [ ] 4.2 Include instability score and threat level in visible body text (not just meta tags) — use query params `s` (score) and `l` (level) already passed to the handler
  - [ ] 4.3 Add a structured "key intelligence areas" section listing the analysis types (threat classification, military posture, prediction markets, signal convergence)
  - [ ] 4.4 Add a footer with "Situation Monitor" attribution and link to root

- [ ] **Task 5: Add JSON-LD structured data** (AC: #4)
  - [ ] 5.1 Add a `<script type="application/ld+json">` block with `@type: "Article"` or `"WebPage"` schema
  - [ ] 5.2 Include: `name`, `description`, `url` (canonical), `publisher` (Situation Monitor), `dateModified` (current date)
  - [ ] 5.3 Use the `esc()` function for any values injected into the JSON-LD (prevent XSS in JSON context)

- [ ] **Task 6: Expand country name mapping** (AC: #1, #4)
  - [ ] 6.1 Replace the hardcoded 20-country `COUNTRY_NAMES` object with a comprehensive ~195-country mapping
  - [ ] 6.2 Use ISO 3166-1 alpha-2 codes as keys
  - [ ] 6.3 Keep the mapping inline in `api/story.js` (no external file import — Vercel serverless functions need self-contained modules unless using shared `api/_*.js` helpers)
  - [ ] 6.4 Ensure the fallback still works: unknown codes display the raw code, empty codes show "Global"

- [ ] **Task 7: Add unit tests** (AC: #1, #2, #3)
  - [ ] 7.1 Create `api/story.test.mjs` following the `api/og-story.test.mjs` test pattern
  - [ ] 7.2 Test: Googlebot UA receives 200 with HTML containing `<title>`, `og:title`, `og:site_name="Situation Monitor"`, canonical URL
  - [ ] 7.3 Test: Regular browser UA receives 302 redirect to SPA with correct `?c=` and `&t=` params
  - [ ] 7.4 Test: XSS prevention — country code with `<script>` injection is escaped in output
  - [ ] 7.5 Test: Unknown country code falls back gracefully (shows raw code, not error)
  - [ ] 7.6 Test: JSON-LD block is valid JSON and contains required fields
  - [ ] 7.7 Register `api/story.test.mjs` in `package.json` `test:sidecar` script

## Dev Notes

### Architecture Constraints

| Constraint | Rule | Source |
|---|---|---|
| Fork Tier | **Tier 3** — modifies upstream file `api/story.js` and `middleware.ts` | [architecture.md#L944](architecture.md) |
| Tier 3 justification | `api/story.js` is an upstream file; cannot be moved to `api/fork/` because the middleware `SOCIAL_PREVIEW_PATHS` already routes to `/api/story` | Architecture decision |
| Runtime | Serverless function (NOT Edge) — 10s timeout, 128MB memory budget | [architecture.md#L161](architecture.md) |
| Cache headers | `public, max-age=300, s-maxage=300, stale-while-revalidate=60` (existing — preserve) | Current `api/story.js` |
| XSS prevention | All interpolated values MUST go through `esc()` (HTML entity encoding) | Existing pattern in `api/story.js` |
| Bot detection | Middleware (`middleware.ts`) is the first line of defense; `api/story.js` has its own `BOT_UA` for the bot vs human redirect decision | Two-layer detection |
| Testing | Node `--test` runner for unit tests, Playwright for E2E | [architecture.md testing section](architecture.md) |
| No external dependencies | `api/story.js` is a standalone `.js` file — no `import` from `node_modules` or project modules beyond what Vercel bundles | Serverless constraint |
| Merge debt | Changes to `api/story.js` and `middleware.ts` create merge debt — document in commit message | Fork policy |

### Current State Analysis

**`api/story.js` (83 LOC):**
- `COUNTRY_NAMES`: Hardcoded 20-country map (UA, RU, CN, US, IR, IL, TW, KP, SA, TR, PL, DE, FR, GB, IN, PK, SY, YE, MM, VE)
- `BOT_UA`: Regex matching social bots + googlebot (twitterbot|facebookexternalhit|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|redditbot|googlebot)
- Bot path: Serves HTML with OG meta tags, minimal `<body>` (just `<h1>`, `<p>`, link)
- Human path: 302 redirect to SPA with `?c=` and `&t=` params
- Branding: **All references say "World Monitor"** — `og:site_name`, `twitter:site`, `<title>` template
- `esc()` function: HTML entity encoding (& → `&amp;`, " → `&quot;`, < → `&lt;`, > → `&gt;`)
- Cache: `public, max-age=300, s-maxage=300, stale-while-revalidate=60`

**`middleware.ts` (131 LOC):**
- `BOT_UA`: Broad regex catching bots, crawlers, spiders, AI bots (claudebot, gptbot, ccbot)
- `SOCIAL_PREVIEW_UA`: Narrow regex for social platform bots only
- `SOCIAL_PREVIEW_PATHS`: Set containing `/api/story` and `/api/og-story`
- **Gap**: Googlebot matches `BOT_UA` (broad) but NOT `SOCIAL_PREVIEW_UA` (narrow), and it's NOT exempted for `SOCIAL_PREVIEW_PATHS` — meaning **Googlebot is currently blocked from `/api/story` by the middleware** even though `api/story.js` would handle it correctly
- Resolution path: Add search engine bot whitelist to middleware, allow on story paths

**`api/og-story.js` (240 LOC):**
- SVG image generator for OG cards (1200×630)
- Branding says "WORLDMONITOR" — out of scope for this story (visual identity changes tracked separately in Epic 2)
- Has `escapeXml()` for SVG output safety
- Tests in `api/og-story.test.mjs` — good reference pattern

### Critical Implementation Detail: Middleware Bot Flow

Current middleware flow for Googlebot requesting `/api/story`:
```
1. Googlebot → middleware.ts
2. SOCIAL_PREVIEW_UA.test("Googlebot/2.1") → false (not a social bot)
3. BOT_UA.test("Googlebot/2.1") → true (matches "bot")
4. → 403 Forbidden ❌
```

After this story:
```
1. Googlebot → middleware.ts
2. SOCIAL_PREVIEW_UA.test("Googlebot/2.1") → false (not a social bot)
3. SEARCH_ENGINE_UA.test("Googlebot/2.1") → true AND path in SOCIAL_PREVIEW_PATHS → allow ✓
4. → api/story.js serves HTML ✅
```

### Implementation Spec: middleware.ts Changes

```typescript
// ADD this regex after SOCIAL_PREVIEW_UA
const SEARCH_ENGINE_UA =
  /googlebot|bingbot|yandexbot|duckduckbot|applebot|baiduspider/i;

// ADD this check in the middleware function,
// AFTER the SOCIAL_PREVIEW_UA check and BEFORE the BOT_UA block:
if (SEARCH_ENGINE_UA.test(ua) && SOCIAL_PREVIEW_PATHS.has(path)) {
  return; // Allow search engines to crawl story pages for indexing
}
```

Place this between the existing `SOCIAL_PREVIEW_UA` check (line ~106) and the `BOT_UA` block (line ~114).

### Implementation Spec: api/story.js BOT_UA expansion

```javascript
// BEFORE
const BOT_UA = /twitterbot|facebookexternalhit|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|redditbot|googlebot/i;

// AFTER — add search engine bots
const BOT_UA = /twitterbot|facebookexternalhit|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|redditbot|googlebot|bingbot|yandexbot|duckduckbot|applebot|baiduspider/i;
```

### Implementation Spec: Enhanced HTML Body

The enhanced HTML served to crawlers should follow this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${countryName} Intelligence Brief | Situation Monitor</title>
  <meta name="description" content="..."/>
  <!-- OG tags (existing, rebrand) -->
  <meta property="og:site_name" content="Situation Monitor"/>
  <!-- Twitter tags (existing, rebrand) -->
  <meta name="twitter:site" content="@worldmonitorapp"/>
  <link rel="canonical" href="${storyUrl}"/>
  <!-- JSON-LD structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "description": "${description}",
    "url": "${storyUrl}",
    "dateModified": "${isoDate}",
    "publisher": {
      "@type": "Organization",
      "name": "Situation Monitor"
    }
  }
  </script>
</head>
<body>
  <article>
    <header>
      <h1>${countryName} Intelligence Brief</h1>
      <p>Situation Monitor — Real-Time Global Intelligence</p>
    </header>
    <section>
      <h2>Country Instability Index</h2>
      <p>Instability Score: ${score}/100 — Threat Level: ${level}</p>
      <p>${description}</p>
    </section>
    <section>
      <h2>Intelligence Coverage</h2>
      <ul>
        <li>Threat Classification & Military Posture</li>
        <li>Prediction Markets & Signal Convergence</li>
        <li>Economic Indicators & Supply Chain Risk</li>
        <li>Conflict & Displacement Monitoring</li>
      </ul>
    </section>
    <footer>
      <p><a href="${spaUrl}">View live analysis on Situation Monitor →</a></p>
      <p>Free, open-source geopolitical intelligence dashboard</p>
    </footer>
  </article>
</body>
</html>
```

**Key:** All dynamic values MUST pass through `esc()`. The score/level may be empty strings — display conditionally (only show score section if `s` param provided).

### Implementation Spec: JSON-LD Safety

JSON-LD values need special escaping. The existing `esc()` function handles HTML entities but for JSON-LD inside a `<script>` tag, the main risk is `</script>` injection. The simplest safe approach:

```javascript
function escJson(str) {
  return str.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
```

This prevents `</script>` from breaking out of the JSON-LD block.

### Test Pattern Reference

Follow `api/og-story.test.mjs` pattern:

```javascript
import { strict as assert } from 'node:assert';
import test from 'node:test';
import handler from './story.js';

function renderStory(query = '', userAgent = 'Googlebot/2.1') {
  const req = {
    url: `https://situationmonitor.app/api/story${query ? `?${query}` : ''}`,
    headers: { host: 'situationmonitor.app', 'user-agent': userAgent },
  };

  let statusCode = 0;
  let body = '';
  const headers = {};
  let redirectLocation = null;

  const res = {
    setHeader(name, value) { headers[String(name).toLowerCase()] = String(value); },
    writeHead(code, h) { statusCode = code; if (h?.Location) redirectLocation = h.Location; },
    status(code) { statusCode = code; return this; },
    send(payload) { body = String(payload); },
    end() {},
  };

  handler(req, res);
  return { statusCode, body, headers, redirectLocation };
}
```

### Country Name Expansion

The current 20-country map should be expanded to cover all ISO 3166-1 alpha-2 codes (~249 entries including territories). A comprehensive list should include at minimum:
- All 193 UN member states
- Commonly referenced territories (TW, HK, PS, XK)

Keep as a single `const COUNTRY_NAMES = { ... }` object. Do NOT import from external files — serverless function must be self-contained.

### Project Structure Notes

| File | Change Type | Tier |
|---|---|---|
| `middleware.ts` | Modify — add search engine bot whitelist | **Tier 3** (upstream file) |
| `api/story.js` | Modify — expand bots, rebrand, enhance HTML | **Tier 3** (upstream file) |
| `api/story.test.mjs` | Create — new unit test file | Fork addition |
| `package.json` | Modify — add `api/story.test.mjs` to `test:sidecar` | **Tier 3** (upstream file, minimal change) |

### Merge Debt Tracking

This story creates merge debt in 3 upstream files:
1. **`middleware.ts`** — Added `SEARCH_ENGINE_UA` regex and whitelist check (easily re-applied after upstream merge)
2. **`api/story.js`** — Rebranding + HTML enhancement (higher merge risk if upstream changes story handler)
3. **`package.json`** — Added test file to `test:sidecar` (trivial merge)

**Post-upstream-sync checklist item**: Verify search engine bot whitelist in middleware.ts is intact, verify api/story.js branding is still "Situation Monitor".

### References

- [Source: _spec/planning-artifacts/epics.md — Epic 3, Story 3.4](_spec/planning-artifacts/epics.md)
- [Source: _spec/planning-artifacts/prd.md — FR17](_spec/planning-artifacts/prd.md)
- [Source: _spec/planning-artifacts/architecture.md — Growth-Phase Structure Expansion table](_spec/planning-artifacts/architecture.md)
- [Source: _spec/planning-artifacts/architecture.md — Fork Hook Tier System](_spec/planning-artifacts/architecture.md)
- [Source: _spec/planning-artifacts/architecture.md — OG Image Pipeline](_spec/planning-artifacts/architecture.md)
- [Source: _spec/planning-artifacts/ux-design-specification.md — Social sharing journey](_spec/planning-artifacts/ux-design-specification.md)
- [Source: api/story.js — Current implementation]
- [Source: api/og-story.js — OG image SVG generator]
- [Source: api/og-story.test.mjs — Test pattern reference]
- [Source: middleware.ts — Bot detection middleware]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
