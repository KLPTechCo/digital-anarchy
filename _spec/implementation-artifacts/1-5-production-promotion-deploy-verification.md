# Story 1.5: Production Promotion & Deploy Verification

Status: ready-for-dev

## Story

As an **operator**,
I want to promote validated Preview changes to Production and verify the deploy,
So that I know Production is correctly configured and serving traffic.

## Acceptance Criteria

1. **Given** changes have passed all CI checks and are validated in Preview
   **When** the PR is merged to `main`
   **Then** Vercel automatically deploys to Production within 5 minutes (NFR31)

2. **Given** a Production deployment completes
   **When** I verify the build configuration
   **Then** rewrites, cache headers (`immutable` on static assets — NFR4), and route patterns all resolve correctly (FR25)
   **And** the endpoint smoke test passes against the Production URL

3. **Given** a CI pipeline failure
   **When** the PR attempts to merge
   **Then** the merge is blocked (FR27)

## Scope Boundary

This story covers:

- Configuring GitHub branch protection on `main` to require CI status checks before merge
- Creating a post-deploy verification script (`scripts/verify-deploy.sh`) that validates Vercel build config (rewrites, cache headers, route patterns)
- Creating a deploy verification GitHub Actions workflow (`.github/workflows/deploy-verify.yml`) that runs the verification script against Production after merge to `main`
- Documenting the Production promotion runbook (merge-to-main → auto-deploy → verify)
- Verifying the existing `vercel.json` cache header configuration (static assets = immutable)

This story does NOT cover:

- Creating the CI pipeline itself (Story 1.2 — already contexted)
- Creating the endpoint smoke test script (Story 1.3 — that story owns `scripts/validate-endpoints.sh`)
- Lighthouse audits (Story 1.4)
- Vercel environment variable configuration (Story 1.1 — already contexted)
- Vercel dashboard setup (manual operator task, not automatable via code)
- Rollback automation (out of scope — Vercel instant rollback is a dashboard action)

## Tasks / Subtasks

- [ ] **Task 1: Configure GitHub branch protection rules for `main`** (AC: #3)
  - [ ] 1.1 Document the required branch protection settings in a new `docs/BRANCH_PROTECTION.md` file (since GitHub branch protection is configured via UI/API, not code)
  - [ ] 1.2 Required settings: Require status checks to pass before merging — check name matches the CI workflow job name from Story 1.2 (`quality-gate`)
  - [ ] 1.3 Required settings: Require branches to be up to date before merging
  - [ ] 1.4 Required settings: Do NOT require approvals (solo operator project)
  - [ ] 1.5 If Story 1.2 is not yet implemented, document placeholder: "Enable `quality-gate` status check once `.github/workflows/ci.yml` is deployed"

- [ ] **Task 2: Create deploy verification script** (AC: #2)
  - [ ] 2.1 Create `scripts/verify-deploy.sh` that accepts a target URL as argument (e.g., `https://worldmonitor.app`)
  - [ ] 2.2 **Cache header verification:** `curl -sI <URL>/assets/` path and verify `Cache-Control: public, max-age=31536000, immutable` header is present (NFR4)
  - [ ] 2.3 **HTML page verification:** `curl -sI <URL>/` and verify `Cache-Control: no-cache, no-store, must-revalidate` (index.html must never be cached)
  - [ ] 2.4 **Security headers verification:** Verify presence of `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`
  - [ ] 2.5 **API route verification:** `curl -s <URL>/api/version` returns 200 with JSON body
  - [ ] 2.6 **Edge middleware verification — bot blocking:** `curl -sI -A "AhrefsBot/7.0" <URL>/api/geo` returns 403 (abuse bot blocked). **Critical:** Bot filtering only applies to `/api/*` and `/favico/*` paths — the middleware early-returns on `/`, so bot tests MUST target an API path.
  - [ ] 2.7 **Edge middleware verification — social bot allowlist:** `curl -sI -A "Twitterbot" <URL>/api/og-story` returns 200 (social preview bots allowed on OG routes). This validates the middleware's actual allowlist logic.
  - [ ] 2.8 **Static asset route:** Verify `/assets/` path returns actual asset content (not 404)
  - [ ] 2.9 Output pass/fail summary with clear labels per check
  - [ ] 2.10 Exit 0 if all checks pass, exit 1 if any check fails

- [ ] **Task 3: Create deploy verification GitHub Actions workflow** (AC: #1, #2)
  - [ ] 3.1 Create `.github/workflows/deploy-verify.yml` triggered on push to `main` (runs after Vercel auto-deploys)
  - [ ] 3.2 Add a delay step (90 seconds) to allow Vercel deployment to complete before running checks. **Known limitation:** Vercel Hobby tier deploys typically take 30-120s; a heavier build could exceed 90s. The `workflow_dispatch` trigger provides a manual re-run escape hatch if timing is off.
  - [ ] 3.3 Run `scripts/verify-deploy.sh https://worldmonitor.app`
  - [ ] 3.4 Add `workflow_dispatch` trigger so operator can manually re-run verification at any time
  - [ ] 3.5 If Story 1.3 endpoint smoke test script exists, also run `scripts/validate-endpoints.sh https://worldmonitor.app` (conditional: only if file exists)

- [ ] **Task 4: Document Production promotion runbook** (AC: #1, #2, #3)
  - [ ] 4.1 Create `docs/PRODUCTION_PROMOTION.md` with the promotion workflow
  - [ ] 4.2 Document the flow: PR → CI checks pass → Preview auto-deploys → Operator validates in Preview → Merge to `main` → Vercel auto-deploys to Production → `deploy-verify.yml` runs → Operator confirms
  - [ ] 4.3 Document what to do if deploy verification fails (check Vercel dashboard, rollback via Vercel UI, investigate)
  - [ ] 4.4 Document NFR31 expectation: Production deployment completes within 5 minutes of merge. **Note:** AC #1 (5-minute deploy) is a Vercel platform guarantee, not enforceable in code. It is verified indirectly: the `deploy-verify.yml` workflow runs after merge and confirms the deployment is live. If verification fails, NFR31 may be violated.

- [ ] **Task 5: Verify existing `vercel.json` cache headers** (AC: #2)
  - [ ] 5.1 Audit `vercel.json` headers section — confirm `/assets/(.*)` has `Cache-Control: public, max-age=31536000, immutable` (already present ✅)
  - [ ] 5.2 Confirm `/` and `/index.html` have `Cache-Control: no-cache, no-store, must-revalidate` (already present ✅)
  - [ ] 5.3 Confirm security headers are present on `/(.*)`  (already present ✅)
  - [ ] 5.4 No code changes needed if all headers are already correct — just document the verification in the story completion notes

## Dev Notes

### Architecture Constraints

| Constraint | Rule | Source |
|---|---|---|
| Deploy trigger | Vercel auto-deploys Production on merge to `main` | [architecture.md § Deployment Architecture] |
| Build command | `vite build` (Vercel configured) | ARCH-8, [vercel.json](vercel.json) |
| NFR31 | Production deployment completes within 5 minutes of merge to main | NFR31 |
| NFR4 | Static assets served with `immutable` cache headers (≥1 year) | NFR4 |
| NFR17 | Zero post-deployment regressions — every change passes through QA (Preview) before Production | NFR17 |
| FR25 | Operator can verify build config: rewrites, cache headers, route patterns | FR25 |
| FR27 | CI pipeline failure blocks production deployment (merge blocked) | FR27 |
| FR24 | Changes promoted to Production only after Preview validation | FR24 |
| ARCH-1 | Vercel Hobby Tier: 100GB/month bandwidth limit | ARCH-1 |
| ARCH-3 | Dual runtime: Edge Functions (middleware, RPC) + Serverless Functions (API, OG) | ARCH-3 |
| Edge middleware | Bot blocking in `middleware.ts` — blocks abuse bots, allows social preview bots | [middleware.ts](middleware.ts) |
| Security headers | Full set in `vercel.json`: HSTS, CSP, X-Frame-Options, etc. | [vercel.json](vercel.json) |
| Merge protection | Must use GitHub branch protection + required status checks | FR27 |
| Framework | Vercel platform — no custom deploy infra | [architecture.md § Deployment Architecture] |

### Existing Vercel Configuration Analysis

**`vercel.json` current state** (verified from codebase):

- ✅ `/assets/(.*)` → `Cache-Control: public, max-age=31536000, immutable` — NFR4 satisfied
- ✅ `/` and `/index.html` → `Cache-Control: no-cache, no-store, must-revalidate` — correct (HTML never cached)
- ✅ `/favico/(.*)` → `Cache-Control: public, max-age=604800` — correct (7 days)
- ✅ `/sw.js` → `Cache-Control: public, max-age=0, must-revalidate` — correct (service worker always fresh)
- ✅ Full security headers on `/(.*)`
- ✅ CORS headers on `/api/(.*)`
- ✅ `ignoreCommand` configured for incremental builds (skips deploy if only docs/tests changed)
- ❌ No rewrites configured — this is correct because the SPA uses Vite's hash-based routing and the `[domain]/v1/[rpc].ts` catch-all is handled by Vercel's file-system routing convention

### Current CI/Workflow Landscape

| Workflow | Trigger | Purpose | Relationship to Story 1.5 |
|---|---|---|---|
| `lint.yml` | PR (*.md paths) | Markdown lint | Not a merge gate |
| `typecheck.yml` | PR | TypeScript type check | Fast feedback, not full gate |
| `ci.yml` (Story 1.2) | PR to main/develop | Full quality gate | **Primary merge gate — status check for branch protection** |
| `deploy-verify.yml` (**NEW**) | push to main + workflow_dispatch | Post-deploy verification | **This story creates it** |

### Edge Middleware Bot Blocking Reference

From `middleware.ts` (verified from codebase):

- `BOT_UA` regex: blocks abuse bots (AhrefsBot, SemrushBot, MJ12bot, GPTBot, etc.)
- `SOCIAL_PREVIEW_UA` regex: allows social preview bots (Twitter, Facebook, LinkedIn, Slack, Telegram, etc.)
- Social preview paths: `/api/story`, `/api/og-story`
- Public API paths: `/api/version` (no auth required)

**CRITICAL middleware path scoping:** Bot filtering ONLY applies to `/api/*` and `/favico/*` paths — the middleware early-returns (pass-through) for all other paths including `/`. Tests that hit `/` with a bot UA will always get 200 regardless of bot type. The deploy verification script must:

- Test abuse bot blocking on an API path (e.g., `/api/geo` with `AhrefsBot` UA → 403)
- Test social bot allowlist on an OG route (e.g., `/api/og-story` with `Twitterbot` UA → 200)
- NOT test bot behavior on `/` — it proves nothing about the middleware

### Cross-Story Dependencies

| Dependency | Story | Status | Impact |
|---|---|---|---|
| CI pipeline (`ci.yml`) | 1.2 | ready-for-dev | Branch protection requires `quality-gate` job to exist. If 1.2 not yet deployed, document the placeholder setting |
| Endpoint smoke test | 1.3 | backlog | `deploy-verify.yml` optionally runs the smoke test if the script exists. Graceful absence handling required |
| Redis key prefix | 1.1 | ready-for-dev | No direct dependency — environment isolation is orthogonal to deploy verification |
| Lighthouse baseline | 1.4 | backlog | No dependency — Lighthouse audit is a separate manual/CI concern |

### Implementation Spec: `scripts/verify-deploy.sh`

```bash
#!/usr/bin/env bash
# Post-deploy verification script for Vercel production deployments
# Usage: scripts/verify-deploy.sh <BASE_URL>
# Example: scripts/verify-deploy.sh https://worldmonitor.app
#
# Validates: cache headers, security headers, API routes, bot blocking

set -euo pipefail

BASE_URL="${1:?Usage: verify-deploy.sh <BASE_URL>}"
# Strip trailing slash
BASE_URL="${BASE_URL%/}"

PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ "$result" = "pass" ]; then
    echo "✅ $label"
    PASS=$((PASS + 1))
  else
    echo "❌ $label"
    FAIL=$((FAIL + 1))
  fi
}

# 1. HTML page — must NOT be cached
INDEX_HEADERS=$(curl -sI "$BASE_URL/")
if echo "$INDEX_HEADERS" | grep -qi "cache-control:.*no-cache"; then
  check "HTML cache headers (no-cache)" "pass"
else
  check "HTML cache headers (no-cache)" "fail"
fi

# 2. Static assets — must be immutable
# Find a real asset URL from the HTML (grep -oE for macOS/GNU portability)
ASSET_PATH=$(curl -s "$BASE_URL/" | grep -oE '/assets/[^"'"'"' ]+\.(js|css)' | head -1)
if [ -n "$ASSET_PATH" ]; then
  ASSET_HEADERS=$(curl -sI "$BASE_URL$ASSET_PATH")
  if echo "$ASSET_HEADERS" | grep -qi "cache-control:.*immutable"; then
    check "Static asset immutable cache (NFR4)" "pass"
  else
    check "Static asset immutable cache (NFR4)" "fail"
  fi
else
  check "Static asset immutable cache (NFR4) — no asset found to test" "fail"
fi

# 3. Security headers
for HEADER in "x-content-type-options" "strict-transport-security" "x-frame-options" "referrer-policy" "permissions-policy" "content-security-policy"; do
  if echo "$INDEX_HEADERS" | grep -qi "$HEADER"; then
    check "Security header: $HEADER" "pass"
  else
    check "Security header: $HEADER" "fail"
  fi
done

# 4. API route — /api/version must return 200
# Note: /api/version is in PUBLIC_API_PATHS so it bypasses bot filtering.
# curl's default UA (curl/x.xx) matches BOT_UA, but public paths are exempt.
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/version")
if [ "$API_STATUS" = "200" ]; then
  check "API route /api/version returns 200" "pass"
else
  check "API route /api/version returns 200 (got $API_STATUS)" "fail"
fi

# 5. Bot blocking — abuse bot blocked on API path
# CRITICAL: Bot filtering only applies to /api/* and /favico/* paths.
# The middleware early-returns on / — testing / would always get 200.
BOT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -A "AhrefsBot/7.0" "$BASE_URL/api/geo")
if [ "$BOT_STATUS" = "403" ]; then
  check "Abuse bot blocked on API path (AhrefsBot /api/geo → 403)" "pass"
else
  check "Abuse bot blocked on API path (AhrefsBot /api/geo → $BOT_STATUS, expected 403)" "fail"
fi

# 6. Social preview bot allowed on OG route
# Validates the middleware's actual allowlist: social bots can access OG routes.
SOCIAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -A "Twitterbot/1.0" "$BASE_URL/api/og-story")
if [ "$SOCIAL_STATUS" = "200" ]; then
  check "Social bot allowed on OG route (Twitterbot /api/og-story → 200)" "pass"
else
  check "Social bot allowed on OG route (Twitterbot /api/og-story → $SOCIAL_STATUS, expected 200)" "fail"
fi

# 7. Normal user access — standard browser UA allowed
NORMAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" "$BASE_URL/")
if [ "$NORMAL_STATUS" = "200" ]; then
  check "Normal user access allowed (200)" "pass"
else
  check "Normal user access allowed (got $NORMAL_STATUS)" "fail"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deploy Verification: $PASS passed, $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
```

### Implementation Spec: `.github/workflows/deploy-verify.yml`

```yaml
name: Deploy Verification

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  verify-production:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4

      - name: Wait for Vercel deployment
        run: sleep 90

      - name: Run deploy verification
        run: |
          chmod +x scripts/verify-deploy.sh
          scripts/verify-deploy.sh https://worldmonitor.app

      - name: Run endpoint smoke test (if available)
        if: hashFiles('scripts/validate-endpoints.sh') != ''
        run: |
          chmod +x scripts/validate-endpoints.sh
          scripts/validate-endpoints.sh https://worldmonitor.app
```

### Implementation Spec: Branch Protection Documentation

Create `docs/BRANCH_PROTECTION.md` documenting:

1. Navigate to GitHub repo → Settings → Branches → Branch protection rules → Add rule
2. Branch name pattern: `main`
3. ✅ Require status checks to pass before merging
4. Status check: `quality-gate` (from `ci.yml` Story 1.2)
5. ✅ Require branches to be up to date before merging
6. ❌ Do NOT require pull request reviews (solo operator)
7. ❌ Do NOT require signed commits (unnecessary for solo operator)

If `ci.yml` is not yet deployed, document: "The `quality-gate` status check will appear after the first PR run of `.github/workflows/ci.yml` (Story 1.2). Enable it once available."

### Project Structure Notes

- `scripts/verify-deploy.sh` — new file, follows existing `scripts/` convention (bash scripts for operational tooling)
- `.github/workflows/deploy-verify.yml` — new workflow, follows existing `.github/workflows/` pattern
- `docs/BRANCH_PROTECTION.md` — new doc, follows existing `docs/` convention for operational guides
- `docs/PRODUCTION_PROMOTION.md` — new doc, follows existing `docs/` convention
- No upstream files modified — this is pure fork infrastructure (Tier 1)

### Fork Development Contract Compliance

| Requirement | Status |
|---|---|
| Tier Declared | Tier 1 — pure infra/tooling, no upstream modification |
| Graceful Degradation | N/A — scripts report failures clearly, do not crash |
| Token-Only Styling | N/A — no UI changes |
| Fork DOM Convention | N/A — no UI changes |
| Companion Tests | Deploy verification IS the test — the script itself validates production |
| No Upstream Mods | ✅ Zero upstream file modifications |

### References

- [Source: _spec/planning-artifacts/epics.md — Epic 1, Story 1.5]
- [Source: _spec/planning-artifacts/architecture.md § Deployment Architecture]
- [Source: _spec/planning-artifacts/prd.md — FR24, FR25, FR27, NFR4, NFR17, NFR31]
- [Source: vercel.json — cache headers, security headers]
- [Source: middleware.ts — bot blocking logic]
- [Source: _spec/implementation-artifacts/1-2-ci-pipeline-lint-test-build-proto-breaking-change-detection.md — CI workflow reference]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
