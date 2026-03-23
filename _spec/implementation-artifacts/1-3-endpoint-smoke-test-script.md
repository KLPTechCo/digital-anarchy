# Story 1.3: Endpoint Smoke Test Script

Status: ready-for-dev

## Story

As an **operator**,
I want a script that validates all endpoints return non-error responses,
So that I can quickly verify deployment health after any change.

## Acceptance Criteria

1. **Given** the application is deployed to a target environment
   **When** I run `scripts/validate-endpoints.sh` with the target URL
   **Then** it hits all endpoints and reports pass/fail for each
   **And** the summary asserts "tested N endpoints, expected 57" - a count mismatch is a visible warning

2. **Given** a single API key is removed from the environment
   **When** I run the smoke test
   **Then** the affected domain endpoints show graceful degradation (non-500 response with informative body)
   **And** all other endpoints still pass (NFR32)

## Scope Boundary

This story covers:

- Creating `scripts/validate-endpoints.sh` as the operator-facing smoke test entrypoint
- Validating all 57 API endpoints (46 sebuf RPC + 11 legacy REST)
- Producing endpoint-by-endpoint pass/fail output plus aggregate summary
- Detecting count drift between expected endpoint total and tested routes
- Supporting graceful degradation verification when one API key is intentionally missing

This story does NOT cover:

- Adding new API endpoints (use proto workflow and endpoint docs)
- CI workflow integration of smoke tests (can be wired in a later story)
- Lighthouse audit and performance scoring (Story 1.4)
- Production promotion workflow (Story 1.5)

## Tasks / Subtasks

- [ ] **Task 1: Add smoke test script entrypoint** (AC: #1)
  - [ ] 1.1 Create `scripts/validate-endpoints.sh` with `bash` strict mode (`set -euo pipefail`)
  - [ ] 1.2 Accept `--base-url` (or positional URL) and default to a safe value for local/dev usage
  - [ ] 1.3 Print clear usage/help output and explicit non-zero exit codes on failure

- [ ] **Task 2: Implement full endpoint coverage inventory (57 total)** (AC: #1)
  - [ ] 2.1 Define a source-of-truth endpoint list that includes all 46 sebuf RPC routes and 11 legacy REST routes
  - [ ] 2.2 Add a guard that compares tested route count to `57` and emits a visible warning on mismatch
  - [ ] 2.3 Keep endpoint inventory maintainable (single data structure, no scattered hardcoded URLs)

- [ ] **Task 3: Implement response validation and reporting** (AC: #1)
  - [ ] 3.1 For each route, send request with realistic headers and timeout protection
  - [ ] 3.2 Mark failure on transport errors, HTTP 5xx, or empty/invalid response body
  - [ ] 3.3 Print per-endpoint status line (PASS/WARN/FAIL), response code, and latency
  - [ ] 3.4 Print summary: passed/failed/warned totals and expected-vs-actual endpoint count

- [ ] **Task 4: Add graceful degradation verification mode** (AC: #2)
  - [ ] 4.1 Add a mode/flag to assert degraded behavior for a target domain when one API key is intentionally removed
  - [ ] 4.2 In degraded mode, require non-500 response plus informative body content (for example: `not configured`, `unavailable`, `skipReason`, or structured fallback fields)
  - [ ] 4.3 Verify non-affected domains remain passing in the same run

- [ ] **Task 5: Add documentation and operator runbook notes** (AC: #1, #2)
  - [ ] 5.1 Document script usage in `README.md` or deployment docs with examples for preview and production URLs
  - [ ] 5.2 Document key-removal validation procedure for NFR32 (which key to remove, expected degraded domains, restore steps)
  - [ ] 5.3 Add troubleshooting section for common failures (auth header issues, timeout, route moved)

- [ ] **Task 6: Add automated tests for the smoke test logic** (AC: #1)
  - [ ] 6.1 Add unit/integration tests for route validation logic (success, 5xx, empty body, timeout)
  - [ ] 6.2 Add test covering endpoint-count mismatch warning behavior
  - [ ] 6.3 Add test covering degraded-mode assertion behavior

## Dev Notes

### Architecture Constraints

| Constraint | Rule | Source |
|---|---|---|
| FR28 | Smoke test must validate all 57 endpoints | `_spec/planning-artifacts/epics.md` |
| NFR32 | Script must support single-key removal graceful degradation verification | `_spec/planning-artifacts/epics.md` |
| Graceful degradation | Missing key/domain failure must not crash system; non-affected domains still function | `_spec/planning-artifacts/architecture.md` |
| Runtime behavior | Local dev and production can differ for legacy REST endpoints; validate against deployed target for release confidence | `_spec/planning-artifacts/architecture.md` |
| Build/test environment | Node 22 + existing scripts/tooling; avoid introducing unnecessary dependencies for smoke checks | `package.json`, `Makefile` |

### Current State Analysis

- `scripts/validate-endpoints.sh` does **not** exist yet (this story creates it).
- There is a related validation pattern in `scripts/validate-seed-migration.mjs` that already demonstrates:
  - structured test case tables
  - request timeout handling
  - per-endpoint reporting and summarized exit status
- Existing story artifacts already assume this script will exist and be reused during sync/deploy workflows (`5-5`, `5-6`).

### Implementation Guidance

Use a two-layer approach to keep portability and maintainability:

1. **Operator-facing shell entrypoint**
   - `scripts/validate-endpoints.sh` handles CLI args and invokes the validator.

2. **Validation engine (Node script)**
   - Implement heavy logic in a JS/MJS module under `scripts/` for reliable JSON/body checks and table-driven endpoint definitions.
   - Keep endpoint definitions centralized and reusable.

This still satisfies AC naming (`validate-endpoints.sh`) while avoiding brittle shell-only JSON parsing.

### Endpoint Inventory Contract

The validator must explicitly track and report:

- **Total expected:** 57
- **Composition:** 46 sebuf RPC + 11 legacy REST
- **Mismatch behavior:** warning in output and non-success outcome unless explicitly overridden for local experimentation

### Graceful Degradation Contract

When a single API key is removed:

- Affected endpoints should return informative degraded responses (not 500)
- Other domains should remain healthy
- Output should clearly separate:
  - expected degraded passes
  - unexpected failures
  - unaffected-domain regressions

### Suggested CLI Interface

Example invocations to support:

```bash
scripts/validate-endpoints.sh --base-url https://your-preview.vercel.app
scripts/validate-endpoints.sh --base-url https://your-preview.vercel.app --degraded-domain market
scripts/validate-endpoints.sh --base-url http://127.0.0.1:3000 --timeout-ms 15000
```

### Testing Requirements

- Use existing project test patterns (`node --test` or `tsx --test`) consistent with other script tests.
- Avoid network-dependent tests in CI by mocking fetch responses for validator unit tests.
- Keep one optional manual smoke test target for real deployed URL validation.

### Risks and Guardrails

- **Risk:** Endpoint list drift as upstream adds/removes routes.
  - **Guardrail:** single source-of-truth list + explicit count assertion.
- **Risk:** False failures from transient upstream outages.
  - **Guardrail:** timeout handling + clear transient vs deterministic failure output.
- **Risk:** Misclassifying graceful degradation as failure.
  - **Guardrail:** explicit degraded-mode assertions keyed by domain.

### Previous Story Intelligence (Story 1.2)

Relevant carry-over from `1-2-ci-pipeline-lint-test-build-proto-breaking-change-detection.md`:

- CI quality gate sequencing is now defined; smoke test is intentionally separate scope in Story 1.3.
- Determinism matters: script output should be stable and machine-readable enough for future CI adoption.
- Existing test/toolchain conventions should be reused instead of introducing new frameworks.

### Git Intelligence (Recent Commits)

- `ac22a184` - merge commit on `develop`
- `4bf7e216` - status update commit
- `6330fca2` / `478ce418` - recent fork validation work

Pattern: stories are being prepared as implementation-ready specs before execution, so this file should remain explicit and operational.

### References

- `_spec/planning-artifacts/epics.md` (Epic 1, Story 1.3; FR28; NFR32)
- `_spec/planning-artifacts/prd.md` (must-have capability #8; endpoint 57-count expectations)
- `_spec/planning-artifacts/architecture.md` (graceful degradation and runtime constraints)
- `_spec/implementation-artifacts/1-2-ci-pipeline-lint-test-build-proto-breaking-change-detection.md` (prior-story context)
- `_spec/implementation-artifacts/5-5-e2e-smoke-test-pass.md` and `_spec/implementation-artifacts/5-6-merge-develop-preview-deploy.md` (downstream dependencies)
- `scripts/validate-seed-migration.mjs` (existing script design pattern)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List