# Story 1.2: CI Pipeline — Lint, Test, Build, Proto Breaking Change Detection

Status: ready-for-dev

## Story

As an **operator**,
I want an automated quality gate that runs on every PR,
So that broken code never reaches production.

## Acceptance Criteria

1. **Given** a CI runner environment
   **When** the pipeline starts
   **Then** `buf` CLI is available (installed via CI step or pre-cached)

2. **Given** a PR is opened against `main`
   **When** the CI pipeline triggers
   **Then** it executes in order: `make generate` (verify byte-identical) → `make lint` → project's configured test runner (unit tests) → `buf breaking` (proto contract) → `make build` → Playwright E2E tests
   **And** any step failure fails the entire pipeline and blocks merge

3. **Given** `make generate` produces output that differs from committed `src/generated/` files
   **When** the CI step compares output
   **Then** the pipeline fails with a clear diff message

4. **Given** the CI pipeline has run on a commit
   **When** the same commit is re-run
   **Then** the result is identical (deterministic — NFR16)

5. **Given** a PR changes files in `src/fork/`
   **When** the CI pipeline runs
   **Then** it verifies `src/fork/__tests__/` contains at least one test file (non-empty test directory gate)

6. **Given** the fork test suite exists
   **When** the CI pipeline runs
   **Then** a `test:fork` npm script is available (e.g., `npx tsx --test src/fork/__tests__/*.test.mjs`) and is executed as part of the unit test step

## Scope Boundary

This story covers:

- Creating a unified `.github/workflows/ci.yml` GitHub Actions workflow
- Wiring existing Makefile targets (`make generate`, `make lint`, `make breaking`) into CI
- Wiring existing npm test scripts (`test:data`, `test:sidecar`, `test:fork`) into CI
- Adding codegen drift detection (`make generate` → `git diff --exit-code`)
- Adding a `test:fork` script to `package.json`
- Adding fork test directory gate for PRs touching `src/fork/`
- Configuring Playwright E2E with SwiftShader for headless CI
- Configuring `buf` CLI installation in CI (Go-based, version pinned to v1.64.0)
- Ensuring the pipeline blocks PR merge on any failure

This story does NOT cover:

- Lighthouse CI integration (Story 1.4)
- Endpoint smoke tests (Story 1.3)
- Production deploy verification (Story 1.5)
- Modifying existing upstream workflows (`lint.yml`, `typecheck.yml`, `test-linux-app.yml`)
- Flaky test quarantine infrastructure (NFR16 monitoring — observability epic scope)
- Visual regression tests (excluded from CI per ARCH-46 — WebGL not testable in CI with SwiftShader)

## Tasks / Subtasks

- [ ] **Task 1: Add `test:fork` npm script to `package.json`** (AC: #6)
  - [ ] 1.1 Add `"test:fork": "tsx --test src/fork/__tests__/*.test.mjs"` to the scripts section of `package.json`
  - [ ] 1.2 Verify locally: `npm run test:fork` passes (existing tests: `config.test.mjs`, `index.test.mjs`)

- [ ] **Task 2: Create `.github/workflows/ci.yml` — pipeline skeleton** (AC: #1, #2)
  - [ ] 2.1 Create `.github/workflows/ci.yml` with trigger on `pull_request` against `main` and `develop` branches
  - [ ] 2.2 Configure `ubuntu-latest` runner with Node 22, Go (for buf), and npm cache
  - [ ] 2.3 Add concurrency group to cancel stale builds on same PR
  - [ ] 2.4 Add `if: github.event.pull_request.head.repo.full_name == github.repository` guard (matches existing workflow pattern from `lint.yml`)

- [ ] **Task 3: CI Step — `buf` CLI installation** (AC: #1)
  - [ ] 3.1 Install Go via `actions/setup-go@v5`
  - [ ] 3.2 Install `buf` CLI v1.64.0 via `go install github.com/bufbuild/buf/cmd/buf@v1.64.0` (matches Makefile `BUF_VERSION`)
  - [ ] 3.3 Install sebuf protoc plugins v0.7.0 (matches Makefile `SEBUF_VERSION`) — needed for `make generate`
  - [ ] 3.4 Verify `buf --version` in CI output

- [ ] **Task 4: CI Step — Codegen drift detection** (AC: #3)
  - [ ] 4.1 Run `make generate` to regenerate all proto-derived files
  - [ ] 4.2 Run `git diff --exit-code src/generated/ docs/api/` to detect drift
  - [ ] 4.3 If diff is non-empty, fail the step with a clear message: "Codegen drift detected — run `make generate` locally and commit the result"

- [ ] **Task 5: CI Step — Proto lint** (AC: #2)
  - [ ] 5.1 Run `make lint` (which does `cd proto && buf lint`)

- [ ] **Task 6: CI Step — Unit tests** (AC: #2, #6)
  - [ ] 6.1 Run `npm run typecheck:all` (combines `tsc --noEmit` and `tsc --noEmit -p tsconfig.api.json`)
  - [ ] 6.2 Run `npm run test:data` (tsx --test tests/*.test.mjs tests/*.test.mts)
  - [ ] 6.3 Run `npm run test:sidecar` (node --test for API/sidecar tests)
  - [ ] 6.4 Run `npm run test:fork` (tsx --test src/fork/__tests__/*.test.mjs)

- [ ] **Task 7: CI Step — Proto breaking change detection** (AC: #2)
  - [ ] 7.1 Run `make breaking` (which does `cd proto && buf breaking --against '.git#branch=main,subdir=proto'`)
  - [ ] 7.2 Ensure full git history is available: use `actions/checkout@v4` with `fetch-depth: 0` (needed for `--against .git#branch=main`)

- [ ] **Task 8: CI Step — Build verification** (AC: #2)
  - [ ] 8.1 Run `npm run build:full` (cross-env VITE_VARIANT=full "tsc && vite build")
  - [ ] 8.2 Verify `dist/` directory is produced and non-empty

- [ ] **Task 9: CI Step — Playwright E2E tests** (AC: #2)
  - [ ] 9.1 Install Playwright Chromium browser: `npx playwright install chromium --with-deps`
  - [ ] 9.2 Run `npm run test:e2e:full` (cross-env VITE_VARIANT=full playwright test)
  - [ ] 9.3 SwiftShader is already configured in `playwright.config.ts` via `--use-angle=swiftshader --use-gl=swiftshader` launch args — no additional config needed
  - [ ] 9.4 Note: Visual regression tests (`test:e2e:visual`) are EXCLUDED — WebGL rendering is not testable in CI with SwiftShader (ARCH-46)

- [ ] **Task 10: CI Step — Fork test directory gate** (AC: #5)
  - [ ] 10.1 Add a conditional step that runs only when `src/fork/` files are changed (use `paths` filter or `git diff` check)
  - [ ] 10.2 Verify `src/fork/__tests__/` contains at least one `.test.mjs` file
  - [ ] 10.3 If empty, fail with message: "PRs that change src/fork/ must have companion tests in src/fork/__tests__/"

- [ ] **Task 11: Pipeline integration test** (AC: #2, #4)
  - [ ] 11.1 Push branch and open a PR to verify the workflow triggers
  - [ ] 11.2 Verify all steps execute in the specified order
  - [ ] 11.3 Verify determinism: re-run the same commit and confirm identical result (AC #4)

## Dev Notes

### Architecture Constraints

| Constraint | Rule | Source |
|---|---|---|
| CI pipeline order | `make generate` → `make lint` → unit tests → `buf breaking` → `make build` → Playwright E2E | [architecture.md#L243](architecture.md#L243), [epics.md#L588](epics.md#L588) |
| Codegen determinism | `make generate` on clean checkout = byte-identical output to committed `src/generated/` | NFR33, ARCH-38 |
| Pipeline determinism | Same commit → same pass/fail result on re-run | NFR16 |
| Fork test gating | PRs touching `src/fork/` must have tests in `src/fork/__tests__/` | FR30, ARCH-21 |
| Test runtime bifurcation | E2E in Chromium (Playwright), unit tests in Node.js — no shared test utility layer | ARCH-47 |
| Proto breaking detection | `buf breaking` is the ONLY automated API contract validation | ARCH-49 |
| Build process | Strict: codegen → lint → build → verify | ARCH-8 |
| WebGL in CI | SwiftShader for headless WebGL — visual tests excluded, functional tests OK | ARCH-46 |
| No `@ts-ignore` without explanation | Anti-pattern: hides real type errors | Architecture anti-patterns |
| `buf` version pinned | v1.64.0 — matching Makefile `BUF_VERSION` | [Makefile](Makefile#L14) |
| `sebuf` version pinned | v0.7.0 — matching Makefile `SEBUF_VERSION` | [Makefile](Makefile#L15) |
| Node version | 22 — matching existing workflows (`lint.yml`, `typecheck.yml`) | [lint.yml](.github/workflows/lint.yml), [typecheck.yml](.github/workflows/typecheck.yml) |
| Same-repo PRs only | `if: github.event.pull_request.head.repo.full_name == github.repository` guard | Existing workflow pattern |

### Existing CI Landscape

The project already has several isolated workflows. This story creates a **unified quality gate** that does NOT replace the existing ones but consolidates the full pipeline:

| Existing Workflow | What it does | Relationship to Story 1.2 |
|---|---|---|
| `lint.yml` | Markdown lint only (paths: `**/*.md`) | Separate concern — keep as-is |
| `typecheck.yml` | `tsc --noEmit` + `tsc --noEmit -p tsconfig.api.json` | Subsumed into ci.yml's unit test step — typecheck runs before unit tests |
| `test-linux-app.yml` | Tauri desktop build + smoke test (workflow_dispatch only) | Separate concern — desktop-only, manual trigger |
| `build-desktop.yml` | Desktop build | Separate concern — keep as-is |
| `seed-*.yml` | Data seeding workflows | Separate concern — keep as-is |

**Decision:** The new `ci.yml` will duplicate the typecheck step from `typecheck.yml` intentionally. Both can coexist — `typecheck.yml` provides fast feedback on code-only PRs (skips proto/e2e), while `ci.yml` runs the full gate. Do NOT modify or remove `typecheck.yml`.

### Current Test Commands Reference

| Script | Command | What it Tests |
|---|---|---|
| `typecheck` | `tsc --noEmit` | TypeScript type checking (src) |
| `typecheck:api` | `tsc --noEmit -p tsconfig.api.json` | TypeScript type checking (api) |
| `test:data` | `tsx --test tests/*.test.mjs tests/*.test.mts` | Data processing tests |
| `test:sidecar` | `node --test src-tauri/sidecar/local-api-server.test.mjs api/_cors.test.mjs api/youtube/embed.test.mjs api/cyber-threats.test.mjs api/usni-fleet.test.mjs scripts/ais-relay-rss.test.cjs api/loaders-xml-wms-regression.test.mjs` | API/sidecar unit tests |
| `test:fork` | **NEW — must be created**: `tsx --test src/fork/__tests__/*.test.mjs` | Fork-specific unit tests |
| `test:e2e:full` | `cross-env VITE_VARIANT=full playwright test` | Full variant E2E (Playwright) |

### Implementation Spec: `ci.yml` Structure

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality-gate:
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history needed for buf breaking --against .git#branch=main

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - uses: actions/setup-go@v5
        with:
          go-version: 'stable'

      - name: Install npm dependencies
        run: npm ci

      - name: Install buf CLI
        run: go install github.com/bufbuild/buf/cmd/buf@v1.64.0

      - name: Install sebuf protoc plugins
        env:
          GOPROXY: direct
          GOPRIVATE: github.com/SebastienMelki
        run: |
          go install github.com/SebastienMelki/sebuf/cmd/protoc-gen-ts-client@v0.7.0
          go install github.com/SebastienMelki/sebuf/cmd/protoc-gen-ts-server@v0.7.0
          go install github.com/SebastienMelki/sebuf/cmd/protoc-gen-openapiv3@v0.7.0

      - name: Install proto dependencies
        run: cd proto && buf dep update

      # Step 1: Codegen drift detection (NFR33)
      - name: Verify codegen is up to date
        run: |
          make generate
          if ! git diff --exit-code src/generated/ docs/api/; then
            echo "::error::Codegen drift detected — run 'make generate' locally and commit the result"
            exit 1
          fi

      # Step 2: Proto lint
      - name: Lint protobuf files
        run: make lint

      # Step 3: TypeScript typecheck
      - name: Typecheck
        run: |
          npm run typecheck
          npm run typecheck:api

      # Step 4: Unit tests
      - name: Run unit tests
        run: |
          npm run test:data
          npm run test:sidecar
          npm run test:fork

      # Step 5: Proto breaking change detection
      - name: Check proto breaking changes
        run: make breaking

      # Step 6: Build
      - name: Build
        run: npm run build:full

      # Step 7: Playwright E2E
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps

      - name: Run E2E tests
        run: npm run test:e2e:full

  # Fork test gate — only runs when src/fork/ changes
  fork-test-gate:
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check fork test coverage
        run: |
          # Get changed files in this PR
          CHANGED=$(git diff --name-only origin/${{ github.base_ref }}...HEAD -- 'src/fork/' || true)
          if [ -n "$CHANGED" ]; then
            echo "Fork files changed:"
            echo "$CHANGED"
            # Verify test directory has at least one test file
            TEST_COUNT=$(find src/fork/__tests__ -name '*.test.mjs' -o -name '*.test.mts' 2>/dev/null | wc -l)
            if [ "$TEST_COUNT" -eq 0 ]; then
              echo "::error::PRs that change src/fork/ must have companion tests in src/fork/__tests__/"
              exit 1
            fi
            echo "✅ Found $TEST_COUNT fork test file(s)"
          else
            echo "No src/fork/ changes detected — skipping fork test gate"
          fi
```

### Critical Implementation Notes

1. **`fetch-depth: 0` is REQUIRED** — `buf breaking --against '.git#branch=main,subdir=proto'` needs git history to compare against main branch. Without full clone, this step will fail.

2. **`GOPRIVATE` for sebuf plugins** — The sebuf Go modules are on a private-ish GitHub repo. The `GOPROXY: direct` and `GOPRIVATE: github.com/SebastienMelki` env vars are needed (matches Makefile's `GO_PROXY` and `GO_PRIVATE` variables).

3. **`make generate` requires `make clean` first** — The Makefile's `generate` target depends on `clean`, which removes `src/generated/client`, `src/generated/server`, and `docs/api/`. The workflow should NOT clean first and then diff — it should run `make generate` (which includes clean) and then diff against committed files. However, `git diff` after `make generate` will show ALL generated files as deleted+recreated. **Better approach:** Save generated file hashes before, regenerate, compare. OR: Use `git diff --exit-code` which handles this correctly if the content is identical.

4. **Playwright `webServer` config** — The Playwright config starts a dev server (`VITE_E2E=1 npm run dev -- --host 127.0.0.1 --port 4173`). In CI, the E2E step needs the built app. **However**, the Playwright config already handles this — `webServer` command starts the dev server. Since we're already building in the prior step, consider whether to use `preview` instead of `dev`. The current config uses `dev` which is fine for CI — it starts Vite dev server which serves from source.

5. **Visual regression tests EXCLUDED** — `test:e2e:visual` tests are separate from `test:e2e:full` and must NOT be included. WebGL rendering with SwiftShader produces non-deterministic visual output (ARCH-46).

6. **Go module caching** — `actions/setup-go@v5` includes built-in caching for Go modules. No additional cache configuration needed for buf/sebuf binaries.

7. **`test:sidecar` may require env vars** — Some API tests may need mock API keys. Check if tests handle missing env vars gracefully. If not, the unit test step may need dummy env vars.

### Project Structure Notes

- New file: `.github/workflows/ci.yml` — unified CI pipeline
- Modified file: `package.json` — add `test:fork` script
- No upstream file modifications required — Tier 1
- Aligns with architecture's `.github/workflows/` directory for CI/CD (architecture.md line 681)
- The architecture's Growth-Phase table references `.github/workflows/ci.yml` for future `lighthouse-ci` integration (will be modified in Story 1.4)

### Previous Story Intelligence (Story 1.1)

**Relevant learnings:**

- Test pattern established: `npx tsx --test` for `.test.mjs` files importing `.ts` sources
- Assertion style: `import { describe, it } from 'node:test'; import assert from 'node:assert/strict';`
- `tsc --noEmit` must pass — strict mode is enforced, `noUnusedLocals: true`, `noUnusedParameters: true`
- Code review caught first-pass implementation gaps — double-check all AC before submitting
- The `check-redis-prefix.sh` script from Story 1.1 could be wired into CI in a future story (not in scope here unless it already exists)

**Retro Action from Epic 0:** "Currently fork tests require manual `npx tsx --test` invocation. This story must add the `test:fork` script to `package.json` and wire it into CI." — This is explicitly called out in the epics file and is a primary deliverable.

### Git Context (Recent Commits)

```
ac22a184 Merge branch 'develop'
4bf7e216 Update Status
6330fca2 Merge pull request #17 (5-4-fork-hook-branding-validation)
478ce418 [arcwright-ai] Fork Hook Branding Validation
82bba239 Merge branch 'develop'
83e016fe Update status
328ba68d Merge pull request #15 from main
81419a56 Merge pull request #13 (5-3-env-var-audit-configuration)
```

Current branch: `arcwright-ai/1-1-vercel-environment-configuration-redis-key-prefix-isolation`
Epic 5 stories (upstream sync) are being completed in parallel. Story 1.1 is `ready-for-dev` (not yet implemented). This story (1.2) can be developed independently of 1.1 — there are no code dependencies between them. However, the `check-redis-prefix.sh` guard from 1.1 is NOT yet available to wire into CI.

### Fork Development Contract (Definition of Done)

1. ☐ **Tier Declared** — Tier 1 (no upstream file modifications)
2. N/A **Graceful Degradation** — CI pipeline — no runtime degradation concern
3. N/A **Token-Only Styling** — No CSS changes
4. N/A **Fork DOM Convention** — No DOM changes
5. ☐ **Companion Tests** — The pipeline IS the test infrastructure; verified by running the pipeline on a PR
6. ☐ **No Upstream Mods** — Only new files (`.github/workflows/ci.yml`) and `package.json` script addition

### Anti-Patterns

| Anti-Pattern | Why |
|---|---|
| Running `make dev` instead of `npm run build:full` for the build step | `make dev` starts a long-running dev server — CI needs a one-shot build |
| Including visual regression tests (`test:e2e:visual`) | WebGL + SwiftShader = non-deterministic visual output — will cause flaky failures (ARCH-46) |
| Using `fetch-depth: 1` (shallow clone) | `buf breaking --against .git#branch=main` needs full git history |
| Removing or modifying `typecheck.yml` | Existing workflow provides fast feedback — keep both |
| Adding `--no-verify` to any git commands | Bypasses safety checks — never acceptable |
| Using `npm install` instead of `npm ci` in CI | `npm ci` is deterministic from lockfile; `npm install` can modify lockfile |
| Running all E2E variants (full, tech, finance) | Only `test:e2e:full` in CI — other variants add time without proportional value. Expand later if needed |
| Hardcoding `buf` binary path | Use `go install` which puts it in `$GOPATH/bin` — already on PATH with `setup-go` |

### References

- [Architecture: CI Pipeline Definition](_spec/planning-artifacts/architecture.md#L243) — lint → unit tests → buf breaking → build → Playwright E2E
- [Architecture: Build Process](_spec/planning-artifacts/architecture.md#L306) — GitHub Actions → Vercel auto-deploy
- [Architecture: File Structure](_spec/planning-artifacts/architecture.md#L681) — `.github/workflows/` directory
- [Architecture: FR to Location Mapping](_spec/planning-artifacts/architecture.md#L915) — CI/CD & Quality → `.github/workflows/`, `e2e/`, `tests/`
- [Architecture: Growth-Phase Structure](_spec/planning-artifacts/architecture.md#L947) — `lighthouse-ci` future addition to `ci.yml`
- [Epics: Story 1.2 AC](_spec/planning-artifacts/epics.md#L575) — Full acceptance criteria
- [Epics: Epic 0 Retro Action](_spec/planning-artifacts/epics.md#L614) — `test:fork` script requirement
- [PRD: FR26](_spec/planning-artifacts/prd.md) — Automated quality gate on every PR
- [PRD: FR27](_spec/planning-artifacts/prd.md) — Block production deployment on CI failure
- [PRD: FR30](_spec/planning-artifacts/prd.md) — Fork code requires companion tests
- [PRD: NFR16](_spec/planning-artifacts/prd.md) — Pipeline determinism
- [PRD: NFR33](_spec/planning-artifacts/prd.md) — Codegen byte-identicality
- Source: [Makefile](Makefile) — `make generate`, `make lint`, `make breaking` targets
- Source: [package.json](package.json) — Test and build scripts
- Source: [playwright.config.ts](playwright.config.ts) — SwiftShader config, E2E setup
- Source: [.github/workflows/lint.yml](.github/workflows/lint.yml) — Existing workflow pattern reference
- Source: [.github/workflows/typecheck.yml](.github/workflows/typecheck.yml) — Existing typecheck workflow

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
