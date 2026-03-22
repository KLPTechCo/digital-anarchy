# Story 2.2: Header, Attribution & Favicon

Status: ready-for-dev

## Story

As a **user**,
I want to see "Situation Monitor" in the page title, header area, and browser tab,
so that the product identity is clear across all touchpoints.

## Acceptance Criteria

1. **Given** the application loads, **When** I check the browser tab, **Then** `<title>` contains "Situation Monitor" (not "World Monitor") **And** the favicon is the Situation Monitor icon (replaced in `public/favico/`)
2. **Given** the main view renders, **When** I look at the header/attribution area, **Then** "Situation Monitor" branding text is visible **And** the text uses `--sm-accent` for identity emphasis per the accent restraint rule (UX-REQ-31) **And** attribution text follows the `data-sm-component="attribution"` convention (UX-REQ-32)
3. **Given** the branding elements are injected, **When** CLS is measured, **Then** CLS remains 0 — elements are injected before first paint or are present in initial HTML (ARCH-23)

## Tasks / Subtasks

- [ ] Task 1: Header branding injection via Tier 2 hook (AC: #2)
  - [ ] 1.1 Add `injectHeaderBranding()` function to `src/fork/index.ts` (or a new `src/fork/branding.ts` module)
  - [ ] 1.2 Find the existing header element in the DOM (the `.skeleton-header` area that gets replaced by the app's header bar after `app.init()`)
  - [ ] 1.3 Inject/replace "Situation Monitor" text in the header brand area using `--sm-accent` for the brand text color
  - [ ] 1.4 Add `data-sm-component="attribution"` attribute to the branding element
  - [ ] 1.5 Ensure branding injection happens within the existing Tier 2 hook timing (after `app.init()` in `main.ts`)
- [ ] Task 2: Secondary entry point branding (AC: #1)
  - [ ] 2.1 Update `settings.html` `<title>` from "World Monitor Settings" to "Situation Monitor Settings"
  - [ ] 2.2 Update `settings.html` header text from "World Monitor Settings" to "Situation Monitor Settings"
  - [ ] 2.3 Update `live-channels.html` `<title>` from "Channel management - World Monitor" to "Channel management - Situation Monitor"
  - [ ] 2.4 Add fork hook to `src/settings-main.ts`: `import('./fork/index').then(m => m.init()).catch(e => console.warn('[fork] init failed:', e));`
  - [ ] 2.5 Add fork hook to `src/live-channels-main.ts`: `import('./fork/index').then(m => m.init()).catch(e => console.warn('[fork] init failed:', e));`
- [ ] Task 3: Favicon verification/replacement (AC: #1)
  - [ ] 3.1 Verify `public/favico/` contains SM-branded icons (not World Monitor originals)
  - [ ] 3.2 If favicons are still upstream originals, replace with SM-branded versions (favicon.ico, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png, android-chrome-192x192.png, android-chrome-512x512.png, og-image.png)
  - [ ] 3.3 Ensure `public/favicon.ico` (root) also points to SM icon
- [ ] Task 4: CLS verification (AC: #3)
  - [ ] 4.1 Verify header branding injection does NOT cause layout shift (CLS = 0)
  - [ ] 4.2 If text injection causes CLS, move branding text into initial HTML or inject before first paint
- [ ] Task 5: Unit tests (AC: all)
  - [ ] 5.1 Add/update tests in `src/fork/__tests__/` for header branding injection
  - [ ] 5.2 Test that `data-sm-component="attribution"` attribute is present on branding element
  - [ ] 5.3 Test that branding text includes "Situation Monitor"
  - [ ] 5.4 Test that branding uses `--sm-accent` CSS variable

## Dev Notes

### Existing Fork Infrastructure

The fork system is already operational from Epic 0 spike:

- **`src/fork/config.ts`** — Central config: `SM_CONFIG.name = 'Situation Monitor'`, `SM_CONFIG.accent = '#4dd0e1'`, `SM_CONFIG.version = '0.1.0-spike'`
- **`src/fork/index.ts`** — Entry point with `init()` function that calls `injectForkTheme()` (CSS variable injection via `<style id="fork-theme">`)
- **`src/fork/__tests__/`** — Existing test infrastructure with `config.test.mjs` and `index.test.mjs` using `node:test`
- **Main hook** — `src/main.ts` (~line 277): `import('./fork/index').then(m => m.init()).catch(...)` runs after `app.init()`

### Architecture Constraints

- **Tier 1 + 2 only** — Favicon swap is Tier 1 (static asset replacement). Header branding is Tier 2 (DOM injection from `src/fork/`). No Tier 3 (upstream file mods) unless justified.
- **CLS budget = 0** (ARCH-23) — Fork branding must NOT cause Cumulative Layout Shift. CSS property overrides are instant (same paint). DOM additions (header text) must be present in initial HTML or injected before first paint.
- **Zero `!important`** — No `!important` declarations in fork CSS (exception: `prefers-reduced-motion` blanket rule per UX-REQ-34).
- **No `document.documentElement.style.setProperty()`** (ARCH-22) — Use `<style>` injection, not inline style manipulation.
- **`<style id="fork-theme">` must be last style in `<head>`** — CSS cascade position per UX-REQ-33. Currently verified in `src/fork/index.ts`.

### UX Design Requirements

- **UX-REQ-31 (Accent restraint rule):** Header branding is one of the ALLOWED uses of `--sm-accent` per the accent restraint table. "Site header / branding mark = ✅ Primary brand moment."
- **UX-REQ-32 (Attribution convention):** Attribution elements must use `data-sm-component="attribution"` attribute for programmatic identification.
- **UX-REQ-39 (Performance):** Theme/branding injection must complete in < 200ms.
- **Brand differentiation:** Header branding is the **primary brand differentiator for direct visitors** (the only element noticeable at "Glance tier" per UX assessment). This is the most important visual change.

### Current State of HTML Entry Points

| File | Title Status | Fork Hook | Needs Work |
|------|-------------|-----------|------------|
| `index.html` | ✅ "Situation Monitor - Real-Time Global Intelligence Dashboard" | ✅ via `main.ts` | Header attribution only |
| `settings.html` | ❌ "World Monitor Settings" | ❌ None | Title + header text + fork hook |
| `live-channels.html` | ❌ "Channel management - World Monitor" | ❌ None | Title + fork hook |

### Favicon Status

`public/favico/` contains a full set of favicon files. **Critical:** The dev must verify whether these are already SM-branded or still upstream World Monitor originals. If upstream originals, replacement icons are needed. The `og-image.png` in this directory should reflect SM branding (teal accent, "Situation Monitor" text).

### Header Bar Implementation Notes

There is **no standalone header bar component file** in the codebase. The header is rendered dynamically by the `App` class after `app.init()`. The fork's Tier 2 hook runs AFTER `app.init()`, so it can manipulate the rendered header DOM.

**Implementation approach:**
1. After `app.init()` resolves, the fork hook queries the header area (likely `.header` or similar selector — discover via DOM inspection at runtime)
2. Insert or modify the brand text element within the header
3. Apply `data-sm-component="attribution"` to the element
4. Style using `color: var(--sm-accent)` (already defined in fork theme)

**CLS-safe approach:** Since the Tier 2 hook runs after first paint, any header text insertion could cause CLS. Preferred mitigation strategies:
- **Option A:** If upstream already has brand text in the header, just replace the text content (no layout shift — same element, different text)
- **Option B:** If adding a new element, reserve space in the skeleton HTML so injection doesn't shift layout
- **Option C:** Use `requestAnimationFrame` to batch the DOM change with the next paint frame

### Epic 0 Retrospective Actions (Relevant)

- **Retro Action #4:** "Extend fork hooks to secondary entry points" — This story must add hooks to `settings-main.ts` and `live-channels-main.ts` following the same `import('./fork/index').then(m => m.init())` pattern from `main.ts`.
- The spike (Story 0.1) validated the main entry point only. Settings and live-channels pages were deliberately deferred to Epic 2.

### Dependency: Story 2.1 (Fork Theme Injection & CSS Token System)

Story 2.1 establishes the full `--sm-*` token system and `theme.css` file. Story 2.2's header branding depends on `--sm-accent` being available. **However**, the current `src/fork/index.ts` already injects `--sm-accent` via the spike implementation. If Story 2.1 has not been implemented yet when 2.2 starts:
- The existing spike-level token injection is sufficient for header branding
- Story 2.2 should use `SM_CONFIG.accent` from `config.ts` or `var(--sm-accent)` from the injected theme
- When Story 2.1 later refactors to `theme.css`, the header branding will automatically pick up the new token values

### Testing Standards

- **Framework:** `node:test` (built-in Node test runner) — same as existing fork tests
- **Test location:** `src/fork/__tests__/` (e.g., `branding.test.mjs`)
- **Pattern:** Follow existing `index.test.mjs` for DOM mock setup/teardown
- **Coverage expectations:** All new fork code requires unit tests. Test injection, attribute presence, text content, and graceful failure.

### Project Structure Notes

- All fork code lives in `src/fork/` — no modifications to upstream `src/` files except the single-line hooks in entry point files
- Static assets (favicons) live in `public/favico/`
- HTML entry points are at project root: `index.html`, `settings.html`, `live-channels.html`
- Tests use `src/fork/__tests__/*.test.mjs` pattern with `node:test`

### References

- [Source: _spec/planning-artifacts/epics.md — Epic 2, Story 2.2 acceptance criteria]
- [Source: _spec/planning-artifacts/architecture.md — Hook Tier System, lines 359-420]
- [Source: _spec/planning-artifacts/architecture.md — CLS budget constraint (ARCH-23)]
- [Source: _spec/planning-artifacts/architecture.md — No setProperty (ARCH-22)]
- [Source: _spec/planning-artifacts/ux-design-specification.md — Accent restraint rule (UX-REQ-31)]
- [Source: _spec/planning-artifacts/ux-design-specification.md — Attribution convention (UX-REQ-32)]
- [Source: _spec/planning-artifacts/ux-design-specification.md — Fork theme cascade position (UX-REQ-33)]
- [Source: _spec/planning-artifacts/ux-design-specification.md — Performance < 200ms (UX-REQ-39)]
- [Source: _spec/planning-artifacts/ux-design-specification.md — Brand differentiation sufficiency test]
- [Source: _spec/planning-artifacts/prd.md — FR35 (SM branding in titles/meta)]
- [Source: _spec/implementation-artifacts/epic-0-retro-2026-02-26.md — Retro Action #4: secondary entry point hooks]
- [Source: src/fork/index.ts — Existing fork init and theme injection]
- [Source: src/fork/config.ts — SM_CONFIG with name, accent, version]
- [Source: src/main.ts ~line 277 — Tier 2 hook pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created
- Dependency on Story 2.1 noted but mitigated by existing spike-level token injection
- Epic 0 retro actions incorporated (secondary entry point hooks)
- Header implementation requires runtime DOM discovery since no header component file exists

### File List

Files to create/modify:
- `src/fork/index.ts` — Add header branding injection function
- `src/fork/branding.ts` — (optional) Separate branding module if scope warrants
- `src/fork/__tests__/branding.test.mjs` — Unit tests for header branding
- `settings.html` — Update title and header text
- `live-channels.html` — Update title
- `src/settings-main.ts` — Add fork hook import
- `src/live-channels-main.ts` — Add fork hook import
- `public/favico/*` — Verify/replace with SM-branded icons

Files to reference (read-only):
- `src/fork/config.ts` — SM_CONFIG values
- `src/main.ts` — Tier 2 hook pattern reference
- `index.html` — Already branded (verification only)
