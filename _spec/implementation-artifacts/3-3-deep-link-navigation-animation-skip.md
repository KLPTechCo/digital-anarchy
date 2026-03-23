# Story 3.3: Deep-Link Navigation & Animation Skip

Status: ready-for-dev

## Story

As a **user arriving via a shared link**,
I want to land directly on the relevant country view without waiting for globe animation,
So that I immediately see the analysis that was shared with me.

## Acceptance Criteria (BDD)

### AC1: Animation Bypass on Deep-Link

**Given** the URL contains `?c={countryCode}` parameter
**When** the SPA loads
**Then** the ~800ms globe spin animation is bypassed and the view snaps directly to the country (UX-REQ-3)
**And** `performance.mark('sm-deep-link-resolved')` fires (UX-REQ-38)
**And** resolution completes in < 1 second (UX-REQ-26)

### AC2: Invalid Param Fallback

**Given** the URL contains an invalid country code or unknown panel type
**When** the SPA processes the deep-link
**Then** it falls back to globe home view with World Brief — never shows an error page (UX-REQ-4)

### AC3: Burst Traffic Degradation

**Given** a shared link generates burst traffic (1000+ simultaneous clicks)
**When** the API rate limit is hit
**Then** cached/degraded content is served silently — never a spinner or error to the user (UX-REQ-5)

## Tasks / Subtasks

- [ ] Task 1: Reduce deep-link delay and bypass globe auto-rotate (AC: #1)
  - [ ] 1.1 In `src/App.ts` `handleDeepLinks()`, reduce `DEEP_LINK_INITIAL_DELAY_MS` from 1500ms to ≤200ms when `?c=` is present
  - [ ] 1.2 Add `performance.mark('sm-deep-link-resolved')` after `openCountryBriefByCode` is called
  - [ ] 1.3 Disable globe auto-rotate when deep-link detected (set `controls.autoRotate = false` immediately)
  - [ ] 1.4 Skip specular texture lazy-load 800ms `setTimeout` when deep-linking (cosmetic — saves CPU)
- [ ] Task 2: Add `?t=` panel-type parameter support (AC: #1)
  - [ ] 2.1 Parse `?t={panelType}` from URL alongside `?c=`
  - [ ] 2.2 Pass panel type to country brief open flow so the correct panel is focused
  - [ ] 2.3 Add `t` param to `parseMapUrlState()` in `src/utils/urlState.ts`
- [ ] Task 3: Invalid param fallback (AC: #2)
  - [ ] 3.1 In `handleDeepLinks()`, validate the country code against known codes via `getCountryNameByCode()`
  - [ ] 3.2 If invalid — do NOT call `openCountryBriefByCode`; instead, let globe render normally at home view
  - [ ] 3.3 Clean invalid `?c=` param from URL via `history.replaceState` to avoid sticky bad state
- [ ] Task 4: Burst traffic resilience (AC: #3)
  - [ ] 4.1 Verify existing API rate-limit + Redis cache serves stale data on 429 (existing relay pattern)
  - [ ] 4.2 Add country-intel-level client-side cache so repeat `openCountryBriefByCode` calls within 60s use cached data
  - [ ] 4.3 Ensure no visible spinners/errors surface — check the country brief loading path falls back gracefully
- [ ] Task 5: Performance measurement (AC: #1)
  - [ ] 5.1 Add `performance.mark('sm-deep-link-start')` at detection point
  - [ ] 5.2 Add `performance.measure('sm-deep-link-duration', 'sm-deep-link-start', 'sm-deep-link-resolved')` after resolution
  - [ ] 5.3 Log measurement via existing analytics track function for monitoring
- [ ] Task 6: Tests (All ACs)
  - [ ] 6.1 Unit test: `parseMapUrlState` parses `?c=UA&t=conflict` correctly
  - [ ] 6.2 Unit test: invalid country code falls back (no throw)
  - [ ] 6.3 E2E test: deep-link with `?c=UA` loads country view without animation delay
  - [ ] 6.4 E2E test: invalid `?c=XX` shows globe home view

## Dev Notes

### Critical: Existing Deep-Link Flow (What You MUST Understand)

The current deep-link flow in [src/App.ts](src/App.ts#L514-L556):

1. **Phase 5 of `init()`** (line ~449): URL params are captured into `pendingDeepLink*` fields BEFORE `setupUrlStateSync()` overwrites them
2. **`handleDeepLinks()`** (line ~462): Called immediately after Phase 5 — does NOT wait for data loading
3. **Current delay**: `DEEP_LINK_INITIAL_DELAY_MS = 1500` — a 1.5s `setTimeout` before calling `openCountryBriefByCode`
4. **Country resolution**: Uses `getCountryNameByCode()` from `src/services/country-geometry.ts` (line 268)
5. **`openCountryBriefByCode()`** in [src/app/country-intel.ts](src/app/country-intel.ts#L145): Pauses map rendering, calculates CII scores, calls `countryBriefPage.show()`, highlights + fits country on globe

**The 1500ms delay is the primary performance bottleneck.** Reducing it to ≤200ms + skipping globe auto-rotate = sub-1s deep-link resolution.

### Globe Animation Details

In [src/components/GlobeMap.ts](src/components/GlobeMap.ts#L452-L460):

- `controls.autoRotate = !desktop` — enabled on mobile, disabled on desktop
- `controls.autoRotateSpeed = 0.3` — slow continuous rotation
- The "800ms animation" referenced in the AC is the specular texture `setTimeout` at line 476 — it's cosmetic (ocean shimmer), NOT the spin itself
- Globe spin is continuous via `autoRotateSpeed`, not a timed animation
- **To "skip animation"**: Set `controls.autoRotate = false` immediately when deep-link detected, and reduce the 1500ms delay

### GlobeMap Public Interface

The GlobeMap instance is accessed via `this.state.map` in App.ts. Key methods:

- `setRenderPaused(paused: boolean)` — called by `openCountryBriefByCode`
- `highlightCountry(code: string)` — highlights country on globe
- `fitCountry(code: string)` — zooms/pans to country
- `controls` — OrbitControls with `autoRotate` property

### URL Parameter Parsing

[src/utils/urlState.ts](src/utils/urlState.ts#L58-L110) already parses:

- `?country=UA` — 2-letter code (A-Z regex validated)
- `?expanded=1` — boolean flag
- `?view=`, `?zoom=`, `?lat=`, `?lon=`, `?timeRange=`, `?layers=`

Does NOT yet parse `?t=` (panel type). Add it following existing pattern with kebab-case validation.

### Fork Pattern (Tier 2 Hooks)

[src/fork/index.ts](src/fork/index.ts) — Fork code is isolated, error-safe, injected after `app.init()` resolves via dynamic `import()`. The deep-link changes go in **core App.ts**, NOT in fork code — deep-linking is an upstream capability.

### Where Changes Go

| Change | File | Rationale |
|--------|------|-----------|
| Reduce delay, add perf marks | `src/App.ts` `handleDeepLinks()` | Core deep-link flow |
| Skip auto-rotate on deep-link | `src/App.ts` `init()` Phase 5 | Before `handleDeepLinks` call |
| Add `?t=` parsing | `src/utils/urlState.ts` | URL state module owns param parsing |
| Invalid code validation | `src/App.ts` `handleDeepLinks()` | Validate before acting |
| Clean invalid params | `src/App.ts` `handleDeepLinks()` | URL cleanup |

### Anti-Patterns to Avoid

- **DO NOT** put deep-link logic in `src/fork/` — this is upstream `App.ts` functionality
- **DO NOT** add a `?c=` "loading screen" or spinner — AC3 mandates silent degradation
- **DO NOT** block on `loadAllData()` before resolving deep-link — the current architecture intentionally starts deep-link handling before data loads
- **DO NOT** create new files for this — changes are surgical edits to existing files
- **DO NOT** remove the existing `?country=UA&expanded=1` deep-link path — it must continue working alongside `?c=`

### Project Structure Notes

- **Files to modify**: `src/App.ts`, `src/utils/urlState.ts`, possibly `src/components/GlobeMap.ts`
- **Files to NOT modify**: `middleware.ts` (bot detection is Story 3.1), `api/og-story.js` (Story 3.2), `src/fork/` (fork code)
- **Test location**: Unit tests alongside source in `.test.ts` or in `tests/`, E2E in `e2e/`
- Naming follows existing conventions: kebab-case files, camelCase functions

### Existing Test Patterns

- Node.js `node --test` for unit tests (see `api/*.test.mjs` for examples)
- Playwright for E2E (see `e2e/*.spec.ts`)
- Config in `playwright.config.ts`

### Performance Budget

- Deep-link resolution: **< 1 second** end-to-end (UX-REQ-26)
- This means: URL parse (~0ms) + delay (≤200ms) + `openCountryBriefByCode` (~200-400ms for CII calc + DOM) + `fitCountry` animation = must total < 1000ms
- The 800ms saved by removing the 1500ms delay gives comfortable headroom

### Dependencies

- **Story 3.1** (OG Meta Tags & Bot Detection Middleware): Independent — 3.3 handles client-side SPA navigation, 3.1 handles server-side bot detection. Can be developed in parallel.
- **Story 3.2** (Dynamic OG Image Generation): Independent — 3.3 consumes the `?c=` param that 3.2 uses for OG images, but they don't share implementation code.
- **Rate limiting** (AC3): Existing relay pattern in `api/_relay.js` + `api/_rate-limit.js` already serves cached data on 429. Verify this works for country-intel data sources.

### References

- [Source: _spec/planning-artifacts/epics.md — Epic 3, Story 3.3](../_spec/planning-artifacts/epics.md)
- [Source: _spec/planning-artifacts/architecture.md — ARCH-3 dual runtime model]
- [Source: _spec/planning-artifacts/ux-design-specification.md — UX-REQ-3, UX-REQ-4, UX-REQ-5, UX-REQ-26, UX-REQ-38]
- [Source: src/App.ts#L514-L556 — current handleDeepLinks implementation](../../src/App.ts)
- [Source: src/components/GlobeMap.ts#L452-L510 — globe animation controls](../../src/components/GlobeMap.ts)
- [Source: src/utils/urlState.ts#L58-L110 — URL param parsing](../../src/utils/urlState.ts)
- [Source: src/app/country-intel.ts#L145 — openCountryBriefByCode](../../src/app/country-intel.ts)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
