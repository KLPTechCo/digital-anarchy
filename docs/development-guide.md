# Development Guide

## Lighthouse Baseline Audit

World Monitor uses [Lighthouse](https://developer.chrome.com/docs/lighthouse/) to track
front-end quality over time. The baseline audit script runs three Lighthouse passes against
a deployed Preview URL and records the median scores in a trackable JSON file.

### Requirements

- Node 22+
- Google Chrome installed (headless mode is used automatically)
- Preview deployment live and reachable over HTTPS

Install project dependencies before first use:

```bash
npm install
```

### Running a Baseline Audit

#### Via environment variable (recommended for CI-like invocations)

```bash
PREVIEW_URL=https://your-branch.vercel.app npm run audit:lighthouse:preview
```

#### Via positional URL argument

```bash
npm run audit:lighthouse:url -- https://your-branch.vercel.app
```

#### Direct script invocation

```bash
node scripts/lighthouse-baseline.mjs https://your-branch.vercel.app
```

### Output Artifacts

All artifacts are written to:

```text
_spec/implementation-artifacts/lighthouse-baselines/
```

A completed run produces these files (date-stamped to the run day):

```text
_spec/implementation-artifacts/lighthouse-baselines/
  YYYY-MM-DD-preview-baseline.summary.json   ← commit this file
  YYYY-MM-DD-preview-run-1.report.json
  YYYY-MM-DD-preview-run-1.report.html
  YYYY-MM-DD-preview-run-2.report.json
  YYYY-MM-DD-preview-run-2.report.html
  YYYY-MM-DD-preview-run-3.report.json
  YYYY-MM-DD-preview-run-3.report.html
```

**Commit only the `.summary.json` file.** The full report JSON and HTML files are large
and intended for local review. Add them to `.gitignore` if your team prefers not to track
them.

### Summary JSON Format

The summary file captures everything needed for future comparisons:

```json
{
  "schemaVersion": "1.0",
  "generatedAt": "2026-03-21T14:32:00.000Z",
  "targetUrl": "https://your-branch.vercel.app",
  "runs": 3,
  "lighthouseVersion": "12.0.0",
  "chromeVersion": "122.0.6261.128",
  "userAgent": "Mozilla/5.0 ... Chrome/122.0.6261.128 ...",
  "categories": {
    "performance":   { "raw": 0.91, "score": 91 },
    "accessibility": { "raw": 0.97, "score": 97 },
    "best-practices":{ "raw": 0.96, "score": 96 },
    "seo":           { "raw": 1.0,  "score": 100 }
  },
  "perRunScores": [ ... ],
  "artifacts": {
    "summaryJson": "2026-03-21-preview-baseline.summary.json",
    "runs": [
      { "json": "2026-03-21-preview-run-1.report.json", "html": "2026-03-21-preview-run-1.report.html" }
    ]
  }
}
```

`raw` is the 0–1 Lighthouse score. `score` is the 0–100 rounded value shown in the report UI.

### Comparing a Future Run Against the Baseline

To detect regressions after a change, run the audit again and diff the summary files:

```bash
# Run a new audit
PREVIEW_URL=https://your-new-branch.vercel.app npm run audit:lighthouse:preview

# Compare summaries with jq
jq '.categories' _spec/implementation-artifacts/lighthouse-baselines/2026-03-21-preview-baseline.summary.json
jq '.categories' _spec/implementation-artifacts/lighthouse-baselines/2026-04-01-preview-baseline.summary.json
```

Because the baseline uses median scores from three passes, small one-run fluctuations
(±2–3 points) are normal and do not indicate a regression.

### Overwriting an Existing Baseline

If you need to re-run the audit on the same calendar day, pass `--overwrite`:

```bash
node scripts/lighthouse-baseline.mjs https://your-branch.vercel.app --overwrite
```

Without `--overwrite`, the script exits with an error if today's artifacts already exist,
preventing accidental overwrites.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Lighthouse CLI not found` | `npm install` not run | `npm install` |
| `Invalid URL` | URL missing scheme | Use `https://...` not `your-app.vercel.app` |
| Scores vary by ±10+ points between runs | Network or server instability | Retry; check Preview deployment health |
| Chrome crash / exit code 127 | Chrome not installed | Install Google Chrome |
| `already exist` error | Today's artifacts present | Pass `--overwrite` or rename old files |

### Notes on Score Variance

Lighthouse scores can shift run-to-run due to CPU throttling simulation, network
conditions, and Chrome startup behaviour. Running three passes and recording the median
(rather than a single run) reduces this noise. A delta of more than 5–8 points across
multiple fresh runs on the same deployment usually indicates a real change.
