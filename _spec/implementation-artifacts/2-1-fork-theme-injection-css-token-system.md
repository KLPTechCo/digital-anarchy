# Story 2.1: Fork Theme Injection & CSS Token System

Status: ready-for-dev

## Story

As a **user**,
I want the application to display Situation Monitor's visual identity from the very first frame,
So that I recognize the product as Situation Monitor, not World Monitor.

## Acceptance Criteria

1. **Given** the application loads in a browser
   **When** the first paint occurs
   **Then** `<style id="fork-theme">` is present in `<head>` with `:root` overrides for all `--sm-*` tokens
   **And** the style block is the **last** `<style>` child of `<head>` (CSS cascade position — UX-REQ-33)
   **And** `performance.mark('sm-theme-injected')` fires
   **And** theme injection completes in < 200ms (UX-REQ-39)

2. **Given** the theme is injected
   **When** I inspect the fork CSS
   **Then** zero `!important` declarations exist (exception: `prefers-reduced-motion` blanket rule — UX-REQ-34)
   **And** zero hardcoded hex values exist in `src/fork/` (UX-REQ-30)
   **And** `document.documentElement.style.setProperty()` is never used (ARCH-22)

3. **Given** the user has light mode active (`[data-theme="light"]`)
   **When** the fork theme applies
   **Then** `--accent` resolves to `var(--sm-accent-light, #00838f)` yielding 4.6:1 contrast ratio (UX-REQ-35)

4. **Given** the theme injection runs
   **When** CLS is measured
   **Then** Cumulative Layout Shift = 0 (ARCH-23)
   **And** tokens are inlined as template literal in `theme-inject.ts`, not an external CSS file load (UX-REQ-37)

5. **Given** the application has secondary entry points (`settings.html`, `live-channels.html`)
   **When** those pages load
   **Then** they also receive the fork theme injection via their own Tier 2 hooks
   **And** the hook follows the same `import('./fork/index').then(m => m.init())` pattern established in Story 0.1

## Tier Declaration

**Tier: 2** (single-line hooks in entry points) + **Tier 1** (CSS custom property overrides, zero upstream file modifications beyond entry point hooks)

Secondary entry points (`settings-main.ts`, `live-channels-main.ts`) each get one Tier 2 hook line. All fork logic remains in `src/fork/`.

## Tasks / Subtasks

- [ ] **Task 1: Create `src/fork/theme.css` — token definitions** (AC: #1, #2)
  - [ ] 1.1 Create `src/fork/theme.css` with all `--sm-*` custom property definitions (single source of truth)
  - [ ] 1.2 Define `:root` block with full token set (see Token Mapping Table below)
  - [ ] 1.3 Define `:root` override block that reassigns upstream token names to `var(--sm-*)` values
  - [ ] 1.4 Define `[data-theme="light"]` defensive override for accent color (AC: #3)
  - [ ] 1.5 Verify zero `!important` declarations in the file
  - [ ] 1.6 Verify zero hardcoded hex values outside of token definitions

- [ ] **Task 2: Create `src/fork/theme-inject.ts` — runtime injection** (AC: #1, #4)
  - [ ] 2.1 Create `src/fork/theme-inject.ts` with theme injection function
  - [ ] 2.2 Inline `theme.css` content as a template literal (NOT an external file load — UX-REQ-37)
  - [ ] 2.3 Create `<style id="fork-theme">` element and append to `document.head`
  - [ ] 2.4 Add `performance.mark('sm-theme-injected')` call after injection
  - [ ] 2.5 Add cascade position verification (must be last `<style>` child of `<head>`)
  - [ ] 2.6 Add idempotency guard (check for existing `fork-theme` element)
  - [ ] 2.7 Wrap entire function in try/catch with `console.warn('[fork] ...')` fallback (ARCH-25)

- [ ] **Task 3: Refactor `src/fork/index.ts` to use `theme-inject.ts`** (AC: #1)
  - [ ] 3.1 Replace inline CSS injection in `index.ts` with import from `theme-inject.ts`
  - [ ] 3.2 Call `injectForkTheme()` from `init()`
  - [ ] 3.3 Keep `init()` as the single entry point — `theme-inject.ts` is an internal module

- [ ] **Task 4: Expand `src/fork/config.ts` with full token values** (AC: #1)
  - [ ] 4.1 Add all `--sm-*` token hex values to `SM_CONFIG` (or export from `theme.css` — pick one source of truth)
  - [ ] 4.2 Update version to `0.2.0` (theme system release)

- [ ] **Task 5: Extend fork hooks to secondary entry points** (AC: #5)
  - [ ] 5.1 Add Tier 2 hook to `src/settings-main.ts`: `import('./fork/index').then(m => m.init()).catch(e => console.warn('[fork] init failed:', e));`
  - [ ] 5.2 Add Tier 2 hook to `src/live-channels-main.ts`: same pattern
  - [ ] 5.3 Verify `settings.html` page loads with fork theme applied
  - [ ] 5.4 Verify `live-channels.html` page loads with fork theme applied

- [ ] **Task 6: Migrate hardcoded-color components to tokens** (AC: #2)
  - [ ] 6.1 Migrate MacroSignalsPanel sparkline/gauge colors → `--sm-chart-primary`, `--sm-chart-secondary`
  - [ ] 6.2 Migrate CountryTimeline lane colors → `--sm-timeline-*` tokens
  - [ ] 6.3 Migrate ProgressChartsPanel D3 stroke → `var(--sm-chart-stroke)`
  - [ ] 6.4 Migrate SignalModal fallback `#ff9944` → `var(--sm-warning, #ff9944)`
  - [ ] 6.5 Migrate main.css update-toast, beta-badge hex → `var(--accent)` references
  - [ ] 6.6 Investigate Map.ts legend inline style hex values (may need JS intervention or attribute selectors)
  - [ ] 6.7 Investigate CountryBriefPage SVG fills, print styles (may need `currentColor` pattern)

- [ ] **Task 7: Write unit tests** (AC: #1, #2, #3, #4)
  - [ ] 7.1 Create `src/fork/__tests__/theme-inject.test.mjs` — test injection, idempotency, cascade position, performance mark
  - [ ] 7.2 Update `src/fork/__tests__/index.test.mjs` — update to verify refactored init() calls theme-inject
  - [ ] 7.3 Test light mode defensive override produces correct token value
  - [ ] 7.4 Test that no `!important` exists in the injected CSS
  - [ ] 7.5 Test graceful degradation when `document` is missing (SSR/Node safety)

- [ ] **Task 8: Manual verification** (AC: #1, #2, #3, #4, #5)
  - [ ] 8.1 Start dev server (`make dev`) and verify main app loads with teal-shifted theme
  - [ ] 8.2 Verify `<style id="fork-theme">` is last `<style>` in `<head>` via DevTools
  - [ ] 8.3 Verify `performance.mark('sm-theme-injected')` fires (DevTools → Performance tab)
  - [ ] 8.4 Toggle light mode and verify accent is `#00838f` (not the dark-mode `#4dd0e1`)
  - [ ] 8.5 Verify CLS = 0 via Lighthouse or DevTools Performance
  - [ ] 8.6 Open `settings.html` and verify fork theme applies
  - [ ] 8.7 Open `live-channels.html` and verify fork theme applies
  - [ ] 8.8 Spot-check 5+ panels for token inheritance (background, border, accent colors)

## Dev Notes

### Architecture Constraints

| Constraint | Rule | Source |
|---|---|---|
| ARCH-22 | Branding uses `<style id="fork-theme">` injection — `document.documentElement.style.setProperty()` is FORBIDDEN | Architecture |
| ARCH-23 | Branding MUST NOT cause CLS > 0 | Architecture |
| ARCH-25 | Every fork function wraps in try/catch with `console.warn('[fork] ...')` fallback | Architecture |
| ARCH-26 | Fork files: kebab-case filenames, named exports, strict TypeScript | Architecture |
| ARCH-15 | Fork client code lives exclusively in `src/fork/` | Architecture |
| ARCH-21 | All `src/fork/` code requires unit tests in `src/fork/__tests__/` using `node --test` | Architecture |
| ARCH-20 | Fork MUST NOT import from `src/generated/**` — use `src/services/` or `src/types/` | Architecture |
| UX-REQ-30 | Zero hardcoded hex values in `src/fork/` (outside token definitions) | UX Spec |
| UX-REQ-33 | `<style id="fork-theme">` must be the last stylesheet in `<head>` for CSS specificity | UX Spec |
| UX-REQ-34 | Zero `!important` (exception: `prefers-reduced-motion` blanket rule) | UX Spec |
| UX-REQ-35 | Light mode accent 4.6:1 contrast — `#00838f` on `#f8f9fa` | UX Spec |
| UX-REQ-37 | Tokens inlined as template literal, not external CSS file load | UX Spec |
| UX-REQ-39 | Theme injection < 200ms | UX Spec |

### Token Mapping Table (from UX Design Spec)

The two-layer mechanism: `--sm-*` tokens define fork values; `theme-inject.ts` reassigns upstream's original token names so all existing `var()` references automatically pick up the fork colours.

| `--sm-*` Fork Token | Overrides Upstream | Upstream Default | Fork Value | Notes |
|---|---|---|---|---|
| `--sm-bg` | `--bg` | `#0a0a0a` | `#080c10` | Cooler/bluer base |
| `--sm-bg-secondary` | `--bg-secondary` | `#111` | `#0e1216` | Cooler secondary |
| `--sm-surface` | `--surface` | `#141414` | `#121820` | Blue undertone panels |
| `--sm-border` | `--border` | `#2a2a2a` | `#1a2a35` | Teal-tinted — primary visual differentiator |
| `--sm-panel-border` | `--panel-border` | `#2a2a2a` | `#1a2a35` | Consistent border system |
| `--sm-accent` | `--accent` | `#fff` | `#4dd0e1` | Teal brand accent — use sparingly (restraint rule) |
| `--sm-accent-dim` | *(new)* | — | `#1a3a42` | Subtle accent for hover/active backgrounds |
| `--sm-accent-text` | *(new)* | — | `#80deea` | Lighter teal for text accents |
| `--sm-accent-light` | *(new — light mode)* | — | `#00838f` | Darker teal for light backgrounds (WCAG AA compliant) |
| `--sm-map-bg` | `--map-bg` | `#020a08` | `#020810` | Cooler map background |
| `--sm-map-grid` | `--map-grid` | `#0a2a20` | `#0a2030` | Blue-tinted grid |
| `--sm-map-stroke` | `--map-stroke` | `#0f5040` | `#0f4050` | Teal map strokes |

### Additional Tokens for Component Migration (Task 6)

| Token | Purpose | Suggested Value |
|---|---|---|
| `--sm-chart-primary` | Primary chart/sparkline color | `#4dd0e1` (accent) |
| `--sm-chart-secondary` | Secondary chart color | `#80deea` (accent-text) |
| `--sm-chart-stroke` | D3/chart stroke color | `#4dd0e1` |
| `--sm-timeline-lane-1` through `--sm-timeline-lane-4` | CountryTimeline lane differentiation | Derive from accent palette |
| `--sm-warning` | Warning/fallback color | `#ff9944` (preserves upstream semantic) |

### CSS Cascade Architecture (Critical Understanding)

The CSS cascade in this project uses layers:

```
1. @layer base — main.css (lowest priority)
2. Unlayered — happy-theme.css (higher than @layer)
3. Unlayered — <style id="fork-theme"> (MUST be last in document order to win)
```

**Key insight from Story 0.1:** `happy-theme.css` is imported unlayered and competes for cascade priority with `fork-theme`. Because `fork-theme` is appended to `<head>` at runtime AFTER Vite's build-time CSS injection, it naturally comes last in document order and wins the cascade. This must be verified (Task 8.2).

**Import order in `main.ts`:**
1. `'./styles/base-layer.css'` (layered via `@layer base`)
2. `'./styles/happy-theme.css'` (unlayered)
3. `'maplibre-gl/dist/maplibre-gl.css'`
4. Then Vite bundles these into the build → injected into `<head>` as `<style>` or `<link>` tags
5. Fork's `<style id="fork-theme">` appended AFTER → wins cascade by document order

### Existing Fork Code (What's Already There)

**`src/fork/index.ts`** — Currently has inline CSS injection directly in the `injectForkTheme()` function. This story refactors the CSS tokens out into `theme.css` and the injection logic into `theme-inject.ts`. The `init()` entry point and graceful degradation pattern are preserved.

**`src/fork/config.ts`** — Currently exports `SM_CONFIG` with `name`, `accent`, `version`. Expand with full token set or keep tokens in `theme.css` only (prefer `theme.css` as CSS single source of truth).

**`src/fork/__tests__/`** — Existing tests for `config.ts` and `index.ts`. Update `index.test.mjs` for the refactored injection. Add `theme-inject.test.mjs`.

### Current Fork Theme Injection (Spike — To Be Replaced)

The current `index.ts` inlines a minimal CSS string:
```css
:root {
  --sm-accent: #4dd0e1;
  --sm-bg: var(--bg);
  --sm-surface: var(--surface);
  --accent: var(--sm-accent);
  --bg: var(--sm-bg);
  --surface: var(--sm-surface);
}
```

**Problems with current approach:**
- Self-referential: `--sm-bg: var(--bg)` then `--bg: var(--sm-bg)` — circular reference, doesn't actually override background
- Missing tokens: No border, map, chart, or panel-specific tokens
- No light mode defensive override
- No performance mark
- Mixed concerns: injection logic and CSS content in one file

This story replaces the spike implementation with the production-quality token system.

### Secondary Entry Points (Task 5)

**`src/settings-main.ts`** — Currently loads `main.css` + `settings-window.css` then initializes `SettingsManager`. Add fork hook AFTER the main initialization. Note: `settings.html` title currently says "World Monitor Settings" — Story 2.2 handles title changes, not this story.

**`src/live-channels-main.ts`** — Currently loads `main.css`, inits i18n, then `initLiveChannelsWindow()`. Add fork hook after `main()` call. Note: `live-channels.html` title says "Channel management - World Monitor" — Story 2.2 handles title changes.

**Hook pattern for secondary entry points:**
```typescript
// At the end of the entry point file, after primary initialization
import('./fork/index').then(m => m.init()).catch(e => console.warn('[fork] init failed:', e));
```

### Hardcoded-Color Migration (Task 6 — from Epic 0 Retro)

Components confirmed for migration:

| Component | Current | Target | Complexity |
|---|---|---|---|
| MacroSignalsPanel | Hardcoded sparkline/gauge colors | `--sm-chart-primary`, `--sm-chart-secondary` | Low |
| CountryTimeline | Hardcoded lane colors | `--sm-timeline-*` tokens | Low |
| ProgressChartsPanel | Hardcoded D3 stroke color | `var(--sm-chart-stroke)` | Low |
| SignalModal | Fallback `#ff9944` | `var(--sm-warning, #ff9944)` | Trivial |
| main.css | update-toast, beta-badge hex | `var(--accent)` references | Trivial |

Components requiring investigation:

| Component | Issue | Approach |
|---|---|---|
| Map.ts legend | Inline style hex values | May need JS intervention or attribute selectors — try CSS first |
| CountryBriefPage | SVG `fill` attributes, print styles | Try `currentColor` pattern or CSS variable injection in SVG |

**Important:** Do NOT migrate intentional domain-specific colors (PizzIntIndicator DEFCON, InvestmentsPanel status, VerificationChecklist, PIPELINE_COLORS, DeckGLMap overlays). These are semantic, not brand. [Source: Epic 0 Retro appendix]

### Fork Development Contract (Definition of Done)

1. **Tier Declared** — Tier 2 (entry point hooks) + Tier 1 (CSS tokens)
2. **Graceful Degradation** — Every fork function wraps in try/catch with `console.warn('[fork] ...')` fallback
3. **Token-Only Styling** — Uses `--sm-*` or upstream semantic tokens; zero hardcoded hex values in `src/fork/`
4. **Fork DOM Convention** — Uses `data-sm-*` attributes for CSS targeting; no new DOM IDs (except `fork-theme` which is established)
5. **Companion Tests** — Unit tests in `src/fork/__tests__/` using `node --test`
6. **No Upstream Mods** — Zero upstream file modifications except the two Tier 2 hook lines in `settings-main.ts` and `live-channels-main.ts`

### File Manifest

#### Files to Create

| File | Purpose | LOC Est. |
|---|---|---|
| `src/fork/theme.css` | All `--sm-*` custom property definitions (single source of truth) | ~50 |
| `src/fork/theme-inject.ts` | Runtime injection (`<style id="fork-theme">`, < 200ms, performance mark) | ~40 |
| `src/fork/__tests__/theme-inject.test.mjs` | Unit tests for theme injection | ~60 |

#### Files to Modify

| File | Change | Tier |
|---|---|---|
| `src/fork/index.ts` | Refactor: replace inline CSS with import from `theme-inject.ts` | N/A (fork file) |
| `src/fork/config.ts` | Expand config or bump version | N/A (fork file) |
| `src/fork/__tests__/index.test.mjs` | Update for refactored init() | N/A (fork file) |
| `src/settings-main.ts` | Add 1 line: dynamic fork import | **Tier 2** |
| `src/live-channels-main.ts` | Add 1 line: dynamic fork import | **Tier 2** |

#### Component Files to Modify (Token Migration — Task 6)

| File | Change | Tier |
|---|---|---|
| Source file for MacroSignalsPanel | Replace hardcoded colors with `var(--sm-chart-*)` tokens | **Tier 3** (upstream component) |
| Source file for CountryTimeline | Replace hardcoded colors with `var(--sm-timeline-*)` tokens | **Tier 3** (upstream component) |
| Source file for ProgressChartsPanel | Replace hardcoded D3 stroke with `var(--sm-chart-stroke)` | **Tier 3** (upstream component) |
| Source file for SignalModal | Replace fallback hex with `var(--sm-warning, #ff9944)` | **Tier 3** (upstream component) |
| `src/styles/main.css` | Replace update-toast, beta-badge hex with `var(--accent)` | **Tier 3** (upstream file) |

**Note on Tier 3 changes:** Task 6 involves modifying upstream component files — each change is Tier 3 merge debt. Document all modifications in `src/fork/UPSTREAM_CHANGES.md`. Keep changes minimal (single-line hex → `var()` replacements). If a migration is complex (Map.ts legend, CountryBriefPage SVG), defer to a follow-up story rather than over-engineering.

### Git Intelligence (Recent Patterns)

Recent commits follow the `[arcwright-ai]` prefix for automated dev commits and `[sync]` for merge-related work:
```
ac22a184 Merge branch 'develop' ...
4bf7e216 Update Status
6330fca2 Merge pull request #17 (5-4-fork-hook-branding-validation)
478ce418 [arcwright-ai] Fork Hook Branding Validation
```

**Commit convention for this story:** `[fork] theme injection and CSS token system`

### Accent Restraint Rule (from UX Spec)

`--sm-accent: #4dd0e1` — teal is identity, not information.

| Usage | Allowed |
|---|---|
| Site header / branding mark | Yes |
| Active/selected state indicators | Yes |
| Hotspot emphasis on globe | Yes |
| Share button / primary CTA | Yes (sparingly) |
| Panel headers | **No** — 26 panels × teal headers = noise |
| Body text links | **No** — monochrome text hierarchy is upstream style |
| Data values in panels | **No** — semantic/threat colours must not compete |
| Loading skeletons | **No** — skeletons should be neutral |

### Accessibility Verification

| Requirement | Token | Against | Ratio | WCAG |
|---|---|---|---|---|
| Teal accent (dark) | `#4dd0e1` | `#080c10` | ~11.5:1 | AAA |
| Teal text (dark) | `#80deea` | `#121820` | ~9.2:1 | AAA |
| Teal accent on surface (dark) | `#4dd0e1` | `#121820` | ~8.8:1 | AAA |
| Teal accent (light — defensive) | `#00838f` | `#f8f9fa` | ~4.6:1 | AA |

### Anti-Patterns to Avoid

| Anti-Pattern | Why | Correct Approach |
|---|---|---|
| `document.documentElement.style.setProperty()` | ARCH-22 violation; doesn't survive component re-renders | `<style id="fork-theme">` injection |
| External `.css` file load for theme | Adds network request, delays injection, potential FOUC | Template literal inline in TypeScript |
| `!important` in fork CSS | Cascade position handles specificity; `!important` is fragile | Ensure `fork-theme` is last `<style>` in `<head>` |
| Hardcoded hex in `src/fork/` components | Breaks token system, prevents theme updates | Always use `var(--sm-*)` references |
| Importing from `src/generated/` | ARCH-20 — isolate fork from proto changes | Import from `src/services/` or `src/types/` |
| Circular CSS variable references | `--sm-bg: var(--bg)` then `--bg: var(--sm-bg)` is invalid | Define `--sm-bg` with a concrete hex value, then `--bg: var(--sm-bg)` |
| Modifying `main.ts` beyond the existing hook line | Existing Tier 2 hook from Story 0.1 already present | No changes to `main.ts` needed — hook is already there |

### Project Structure Notes

```
src/fork/
├── index.ts              # Entry point — init() calls theme-inject (refactored)
├── config.ts             # Fork config values (expand or keep minimal)
├── theme.css             # NEW: all --sm-* token definitions (single source of truth)
├── theme-inject.ts       # NEW: runtime <style id="fork-theme"> injection
├── UPSTREAM_CHANGES.md   # NEW: Tier 3 modification tracker (for Task 6 migrations)
└── __tests__/
    ├── config.test.mjs       # Existing — may need minor updates
    ├── index.test.mjs        # Existing — update for refactored init()
    └── theme-inject.test.mjs # NEW: theme injection tests
```

### References

- [Source: _spec/planning-artifacts/epics.md — Epic 2, Story 2.1]
- [Source: _spec/planning-artifacts/architecture.md — Fork Customization Pattern, CSS Override Mechanism, Hook Tier System]
- [Source: _spec/planning-artifacts/ux-design-specification.md — Design System Foundation, Token Mapping Table, Accent Restraint Rule, Light Mode Fork Policy]
- [Source: _spec/implementation-artifacts/epic-0-retro-2026-02-26.md — Hardcoded-Color Component Categorization, Action Items #3 and #4]
- [Source: _spec/implementation-artifacts/0-1-fork-pattern-validation-spike.md — CSS Injection Spec, Hook Placement, Architecture Constraints]
- [Source: _spec/implementation-artifacts/5-4-fork-hook-branding-validation.md — New panel CSS token compliance validation]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log
