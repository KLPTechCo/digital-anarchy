# Story 2.3: Meta Tags, robots.txt & LLM Discoverability Files

Status: ready-for-dev

## Story

As a **search engine bot or AI tool**,
I want meta tags, `robots.txt`, and LLM discoverability files to reflect Situation Monitor identity,
So that the correct product appears in search results and AI responses.

## Acceptance Criteria

1. **Given** a crawler requests the application
   **When** it reads `<meta>` tags in the HTML `<head>`
   **Then** `og:site_name`, `description`, and `application-name` reference "Situation Monitor"

2. **Given** a crawler requests `/robots.txt`
   **When** the response is returned
   **Then** it permits crawling of public pages (FR38)
   **And** the file references "Situation Monitor" in comments

3. **Given** an AI tool requests `/llms.txt` or `/llms-full.txt`
   **When** the response is returned
   **Then** the content reflects Situation Monitor identity, capabilities, and data sources (FR36)
   **And** no references to "World Monitor" remain in these files

## Tasks / Subtasks

- [ ] Task 1 — Update `settings.html` meta tags (AC: #1)
  - [ ] 1.1 Change `<title>` from "World Monitor Settings" to "Situation Monitor Settings"
  - [ ] 1.2 Add `<meta name="description">` with SM branding
  - [ ] 1.3 Add `<meta name="application-name" content="Situation Monitor">`
  - [ ] 1.4 Add `<meta property="og:site_name" content="Situation Monitor">`
  - [ ] 1.5 Add `<meta name="robots" content="noindex, nofollow">` (operator page — should NOT be crawled)
- [ ] Task 2 — Update `live-channels.html` meta tags (AC: #1)
  - [ ] 2.1 Change `<title>` from "Channel management - World Monitor" to "Channel Management - Situation Monitor"
  - [ ] 2.2 Add `<meta name="application-name" content="Situation Monitor">`
  - [ ] 2.3 Add `<meta name="robots" content="noindex, nofollow">` (operator page — should NOT be crawled)
- [ ] Task 3 — Verify `index.html` meta tags are complete (AC: #1)
  - [ ] 3.1 Confirm all meta tags already reference "Situation Monitor" (they do — see Dev Notes)
  - [ ] 3.2 Update `<link rel="canonical">` from `https://worldmonitor.app/` to the fork's canonical URL if applicable
  - [ ] 3.3 Update CSP `frame-src` references from `worldmonitor.app` domains to fork domains if applicable
- [ ] Task 4 — Rebrand `public/robots.txt` (AC: #2)
  - [ ] 4.1 Replace header comment "WorldMonitor" → "Situation Monitor"
  - [ ] 4.2 Update `Sitemap:` URL from `worldmonitor.app` to fork domain
  - [ ] 4.3 Add AI bot allowlisting (GPTBot, CCBot, anthropic-ai, Claude-Web) per FR36
  - [ ] 4.4 Verify social media bot rules are preserved
- [ ] Task 5 — Rebrand `public/llms.txt` (AC: #3)
  - [ ] 5.1 Replace all "World Monitor" references with "Situation Monitor"
  - [ ] 5.2 Update all `worldmonitor.app` URLs to fork domain
  - [ ] 5.3 Update GitHub repo URLs from `koala73/worldmonitor` to fork repo
  - [ ] 5.4 Update Live Instances section with fork's variant URLs
  - [ ] 5.5 Verify no "World Monitor" references remain: `grep -i "world monitor" public/llms.txt`
- [ ] Task 6 — Rebrand `public/llms-full.txt` (AC: #3)
  - [ ] 6.1 Replace all "World Monitor" references with "Situation Monitor"
  - [ ] 6.2 Update all `worldmonitor.app` URLs to fork domain
  - [ ] 6.3 Update GitHub repo URLs from `koala73/worldmonitor` to fork repo
  - [ ] 6.4 Update Live Instances section with fork's variant URLs
  - [ ] 6.5 Verify no "World Monitor" references remain: `grep -i "world monitor" public/llms-full.txt`
- [ ] Task 7 — Final verification sweep (AC: #1, #2, #3)
  - [ ] 7.1 Run: `grep -rli "World Monitor" index.html settings.html live-channels.html public/robots.txt public/llms.txt public/llms-full.txt` — should return NOTHING
  - [ ] 7.2 Verify `og:site_name` is set in `index.html`
  - [ ] 7.3 Verify `robots.txt` is accessible at `/robots.txt`
  - [ ] 7.4 Verify `llms.txt` and `llms-full.txt` are accessible at their respective paths

## Dev Notes

### Current State Analysis

**`index.html` — ALREADY BRANDED (verify only):**

- Title: "Situation Monitor - Real-Time Global Intelligence Dashboard" ✅
- `og:site_name`: "Situation Monitor" ✅
- `application-name`: "Situation Monitor" ✅
- `description`: References "Situation Monitor" ✅
- JSON-LD: `"name": "Situation Monitor"` ✅
- **REMAINING ISSUES:** `<link rel="canonical">` still points to `https://worldmonitor.app/`, CSP `frame-src` still references `worldmonitor.app` domains, og:url and twitter:url still reference `worldmonitor.app`

**`settings.html` — NEEDS REBRANDING:**

- Title: "World Monitor Settings" ❌ → change to "Situation Monitor Settings"
- No `<meta name="description">` — add one
- No `<meta name="application-name">` — add one
- No `<meta property="og:site_name">` — add one
- No `<meta name="robots">` — add `noindex, nofollow` (operator page, not public)

**`live-channels.html` — NEEDS REBRANDING:**

- Title: "Channel management - World Monitor" ❌ → "Channel Management - Situation Monitor"
- No `<meta name="application-name">` — add one
- No `<meta name="robots">` — add `noindex, nofollow` (operator page)

**`public/robots.txt` — NEEDS REBRANDING:**

- Currently references "WorldMonitor" in header comment ❌
- Sitemap URL points to `worldmonitor.app` ❌
- Social media bot rules are correct and must be preserved ✅
- Missing AI bot user-agent rules (GPTBot, CCBot, anthropic-ai, Claude-Web) for FR36

**`public/llms.txt` — NEEDS FULL REBRANDING:**

- Header: "# World Monitor" ❌
- Body text: multiple "World Monitor" references ❌
- URLs: all point to `worldmonitor.app` ❌
- GitHub URLs: point to `koala73/worldmonitor` ❌
- Live Instances section references upstream domains ❌

**`public/llms-full.txt` — NEEDS FULL REBRANDING:**

- Same issues as `llms.txt` but more extensive (21KB file)
- All "World Monitor" → "Situation Monitor"
- All `worldmonitor.app` → fork domain
- All GitHub URLs → fork repo

### Architecture & Tier Classification

- **Tier: 1** (Zero-touch — static file replacement only, zero merge conflict risk)
- **ARCH-10:** All changes are Tier 1: CSS custom property overrides, `<meta>` tags, favicon swap, static asset replacement
- No upstream file modifications, no Vercel configuration changes, no package.json dependency changes
- No code logic changes — purely text/markup replacements

### Key Constraints

1. **Zero `!important` declarations** in any CSS (exception: `prefers-reduced-motion` blanket rule — UX-REQ-34)
2. **Fork DOM convention:** Use `data-sm-component` attribute for any injected components (not needed here — static files only)
3. **Dual entry point branding:** Both `index.html` and `settings.html` (and `live-channels.html`) must have consistent Situation Monitor branding
4. **No upstream mods:** Do NOT modify any file outside of fork-specific scope
5. **CLS = 0:** Meta tag changes must not cause Cumulative Layout Shift (they won't — head-only changes)

### Functional Requirements Covered

| FR | Description | How Satisfied |
|----|-------------|---------------|
| FR35 | SM branding in titles, meta tags, descriptions | Update settings.html, live-channels.html; verify index.html |
| FR36 | LLM discoverability files reflect SM identity | Rebrand llms.txt and llms-full.txt |
| FR38 | robots.txt permits crawling of public pages | Update comments, add AI bot rules |

### Dependencies

- **Story 0.1** (Fork Pattern Validation): fork structure established ✅ (done)
- **Story 2.1** (Fork Theme Injection): provides CSS token system — NOT blocking for 2.3 (meta tags are independent of CSS)
- **Story 2.2** (Header & Attribution): establishes title branding — NOT blocking for 2.3 (meta tags work independently)
- Story 2.3 establishes the static discoverable identity that **Story 3.1** (OG Meta Tags & Bot Detection) relies on

### What NOT To Touch

- Do NOT modify `index.html` `<script>` blocks or inline styles
- Do NOT remove or alter the JSON-LD schema markup structure (only update text values if needed)
- Do NOT change the CSP header contents (that's a separate concern)
- Do NOT add any JavaScript to `settings.html` or `live-channels.html` for this story
- Do NOT modify `vercel.json` routing
- Do NOT modify the playground-settings-*.html files (those are prototypes, not production)

### File Impact Summary

| File | Change Type | Risk |
|------|-------------|------|
| `settings.html` | Add meta tags, update title | Zero — additive head changes |
| `live-channels.html` | Add meta tags, update title | Zero — additive head changes |
| `index.html` | Verify only (possibly update canonical/CSP URLs) | Zero — text-only changes |
| `public/robots.txt` | Rebrand comments, add AI bot rules | Zero — static text file |
| `public/llms.txt` | Full text replacement (rebrand) | Zero — static text file |
| `public/llms-full.txt` | Full text replacement (rebrand) | Zero — static text file |

### Project Structure Notes

- HTML entry points: `index.html`, `settings.html`, `live-channels.html` (all at project root)
- Static public assets: `public/robots.txt`, `public/llms.txt`, `public/llms-full.txt`
- These files are served as-is by Vite/Vercel — no build processing
- `public/` contents are copied to build output root directory

### Testing Standards

- **No automated tests required** for this story — all changes are static file content
- **Manual verification:** View page source, curl files, grep for "World Monitor" remnants
- **CI verification script** (optional):
  ```bash
  grep -rli "World Monitor" index.html settings.html live-channels.html public/robots.txt public/llms.txt public/llms-full.txt && echo "FAIL: World Monitor references found" && exit 1 || echo "PASS: No World Monitor references"
  ```

### References

- [Source: _spec/planning-artifacts/epics.md — Epic 2, Story 2.3 acceptance criteria]
- [Source: _spec/planning-artifacts/epics.md — FR35, FR36, FR38 definitions]
- [Source: _spec/planning-artifacts/architecture.md — ARCH-10 tier classification, fork branding constraints]
- [Source: _spec/planning-artifacts/ux-design-specification.md — UX-REQ-30 through UX-REQ-39, dual entry point branding]

### Git Intelligence

Recent commits show Epic 5 (Upstream Sync) work:

- `478ce418` — Fork Hook Branding Validation (Story 5.4)
- `37621176` — Env Var Audit Configuration (Story 5.3)

Patterns established: fork-specific changes use `[arcwright-ai]` commit prefix, branch naming follows `arcwright-ai/{story-key}` pattern.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
