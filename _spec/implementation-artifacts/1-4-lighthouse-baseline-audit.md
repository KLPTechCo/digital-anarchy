# Story 1.4: Lighthouse Baseline Audit

Status: ready-for-dev

## Story

As an **operator**,
I want to run Lighthouse against the Preview environment and record baseline scores,
So that I have a reference point for detecting future performance regressions.

## Acceptance Criteria

1. **Given** a Preview deployment is live
   **When** I run the Lighthouse audit script against the Preview URL
   **Then** it produces scores for Performance, Accessibility, Best Practices, and SEO

2. **Given** the Lighthouse audit completes
   **When** I review the output artifacts
   **Then** baseline scores are recorded in a trackable format (JSON file committed to the repo or CI artifact)

## Scope Boundary

This story covers:
- Adding a reproducible Lighthouse baseline script for the deployed Preview URL
- Producing category scores for Performance, Accessibility, Best Practices, and SEO
- Storing baseline output in a trackable JSON format in-repo
- Documenting how to rerun the same baseline process later for comparison

This story does NOT cover:
- Converting Lighthouse into a merge-blocking CI quality gate (Story 10.4)
- Defining budget thresholds that fail builds
- Production promotion validation (Story 1.5)
- Endpoint health validation (Story 1.3)

## Tasks / Subtasks

- [ ] **Task 1: Add Lighthouse tooling and script entrypoint** (AC: #1)
  - [ ] 1.1 Add a script file at `scripts/lighthouse-baseline.mjs` (or `.sh`) that accepts a target URL
  - [ ] 1.2 Add npm script(s) in `package.json`:
    - `audit:lighthouse:preview` (reads Preview URL from env var)
    - optional `audit:lighthouse:url` (explicit URL arg)
  - [ ] 1.3 Ensure the script fails fast with a clear message if no URL is provided

- [ ] **Task 2: Generate Lighthouse report artifacts** (AC: #1, #2)
  - [ ] 2.1 Run Lighthouse with categories restricted to: `performance,accessibility,best-practices,seo`
  - [ ] 2.2 Emit JSON output (required) and HTML output (recommended for human review)
  - [ ] 2.3 Write artifacts to a deterministic folder (recommended: `_spec/implementation-artifacts/lighthouse-baselines/`)

- [ ] **Task 3: Record baseline snapshot in trackable JSON** (AC: #2)
  - [ ] 3.1 Create a baseline summary file containing:
    - preview URL audited
    - timestamp
    - Lighthouse + Chrome versions
    - category scores (0-1 raw and 0-100 rounded)
    - pointer to raw report JSON/HTML filenames
  - [ ] 3.2 Commit the summary JSON file to source control

- [ ] **Task 4: Variance control for baseline quality** (AC: #1, #2)
  - [ ] 4.1 Run at least 3 Lighthouse passes against the same URL in close succession
  - [ ] 4.2 Record median category scores as the baseline to reduce one-run noise
  - [ ] 4.3 Preserve raw per-run JSON artifacts for auditability

- [ ] **Task 5: Document rerun workflow for future regressions** (AC: #2)
  - [ ] 5.1 Add a short section in `docs/development-guide.md` or `README.md` describing how to rerun baseline checks
  - [ ] 5.2 Include exact command examples and expected artifact paths

## Dev Notes

### Story Intelligence and Dependencies

- Story 1.2 planned a unified `.github/workflows/ci.yml` but this workflow does not currently exist in the repo. For Story 1.4, do NOT block on CI integration; use a local/scripted baseline flow first.
- `scripts/validate-endpoints.sh` from Story 1.3 is not present. Keep Lighthouse baseline independent of endpoint smoke checks.
- Current project already runs Node 22 in workflows (`lint.yml`, `typecheck.yml`), which aligns with Lighthouse CLI requirements.

### Architecture and PRD Constraints

| Constraint | Rule | Source |
|---|---|---|
| FR29 | Operator can run Lighthouse on Preview and record baseline scores | `_spec/planning-artifacts/prd.md` |
| NFR1 | LCP target under 4s is a key benchmark for ongoing perf checks | `_spec/planning-artifacts/prd.md` |
| NFR17 | QA/Preview validation must precede Production confidence | `_spec/planning-artifacts/prd.md` |
| CI separation | Baseline capture now; CI trend gating later | `_spec/planning-artifacts/epics.md` (Story 1.4 vs Story 10.4) |
| Growth mapping | `lighthouse-ci` belongs in `.github/workflows/ci.yml` at Tier 3 | `_spec/planning-artifacts/architecture.md` |

### Recommended Implementation Spec

Use Lighthouse CLI (local dev dependency preferred over global install) with explicit output and categories:

```bash
# Example invocation pattern inside script
npx lighthouse "$TARGET_URL" \
  --preset=desktop \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json \
  --output=html \
  --output-path="$OUT_DIR/$RUN_NAME" \
  --quiet \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu"
```

Implementation guidance:
- Keep script runtime-only and deterministic; avoid hidden defaults.
- Store raw report JSON/HTML per run and also produce one concise summary JSON for the story deliverable.
- Record tool versions in the summary file (`lighthouseVersion`, `chromeVersion`) to make future comparisons fair.

### Output Structure Recommendation

```text
_spec/implementation-artifacts/lighthouse-baselines/
  2026-03-20-preview-baseline.summary.json
  2026-03-20-preview-run-1.report.json
  2026-03-20-preview-run-1.report.html
  2026-03-20-preview-run-2.report.json
  2026-03-20-preview-run-2.report.html
  2026-03-20-preview-run-3.report.json
  2026-03-20-preview-run-3.report.html
```

### Testing Requirements

- Verify command exits non-zero on invalid/missing URL.
- Verify script writes JSON artifact(s) and summary JSON in expected location.
- Verify category scores are present for all four required categories.
- Verify rerunning does not overwrite previous run files unless explicitly requested.

### Anti-Patterns To Avoid

- Do not add merge-blocking Lighthouse thresholds in this story.
- Do not run Lighthouse only once and treat it as canonical baseline.
- Do not store only HTML output (JSON is required for machine diffing).
- Do not audit localhost when the AC explicitly requires Preview deployment baseline.

## References

- `_spec/planning-artifacts/epics.md` (Epic 1, Story 1.4)
- `_spec/planning-artifacts/prd.md` (FR29, NFR1, NFR17)
- `_spec/planning-artifacts/architecture.md` (Growth mapping for lighthouse-ci)
- `.github/workflows/lint.yml` and `.github/workflows/typecheck.yml` (Node 22 precedent)
- `package.json` (script conventions)

## Dev Agent Record

### Agent Model Used

GPT-5.3-Codex

### Debug Log References

- Recent git context: `ac22a184`, `4bf7e216`, `6330fca2`, `478ce418`, `82bba239`
- Repository scan confirmed no existing Lighthouse baseline script

### Completion Notes List

- Comprehensive story context generated with implementation guardrails and scope boundaries.
- Story intentionally structured to be executable even before CI unification work is complete.

### File List

- `_spec/implementation-artifacts/1-4-lighthouse-baseline-audit.md`
