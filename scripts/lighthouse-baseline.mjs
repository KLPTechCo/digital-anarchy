#!/usr/bin/env node

/**
 * Lighthouse Baseline Audit Script
 *
 * Runs Lighthouse 3 times against a target URL, records median category scores,
 * and saves a trackable summary JSON plus per-run report artifacts.
 *
 * Usage:
 *   node scripts/lighthouse-baseline.mjs <URL>
 *   node scripts/lighthouse-baseline.mjs --url <URL>
 *   PREVIEW_URL=https://... npm run audit:lighthouse:preview
 *   npm run audit:lighthouse:url -- https://your-preview.vercel.app
 *
 * Environment variables:
 *   PREVIEW_URL  - Target URL (used by audit:lighthouse:preview npm script)
 *
 * Output (written to _spec/implementation-artifacts/lighthouse-baselines/):
 *   YYYY-MM-DD-preview-baseline.summary.json   — trackable summary (commit this)
 *   YYYY-MM-DD-preview-run-1.report.json / .html
 *   YYYY-MM-DD-preview-run-2.report.json / .html
 *   YYYY-MM-DD-preview-run-3.report.json / .html
 *
 * Exit codes:
 *   0  Audit completed and summary written
 *   1  Usage error, Lighthouse not found, or audit failure
 *   2  Unexpected script crash
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR  = resolve(__dirname, '..');
const OUT_DIR   = resolve(ROOT_DIR, '_spec/implementation-artifacts/lighthouse-baselines');

const RUN_COUNT  = 3;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

// ── Colour helpers ─────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
};

const log = (msg = '') => process.stdout.write(msg + '\n');
const err = (msg = '') => process.stderr.write(msg + '\n');

// ── Help text ─────────────────────────────────────────────────────────────────
function printHelp() {
  log(`
${C.bold}lighthouse-baseline.mjs${C.reset} — Lighthouse Baseline Audit for World Monitor

${C.bold}Usage:${C.reset}
  node scripts/lighthouse-baseline.mjs <URL>
  node scripts/lighthouse-baseline.mjs --url <URL>
  PREVIEW_URL=https://... npm run audit:lighthouse:preview
  npm run audit:lighthouse:url -- https://your-preview.vercel.app

${C.bold}Options:${C.reset}
  --url URL        Target URL to audit
  --overwrite      Overwrite existing artifacts for today's date stamp
  -h, --help       Show this help message

${C.bold}Environment variables:${C.reset}
  PREVIEW_URL      Target deployment URL (used by audit:lighthouse:preview)

${C.bold}Output:${C.reset}
  _spec/implementation-artifacts/lighthouse-baselines/
    YYYY-MM-DD-preview-baseline.summary.json
    YYYY-MM-DD-preview-run-1.report.json / .html
    YYYY-MM-DD-preview-run-2.report.json / .html
    YYYY-MM-DD-preview-run-3.report.json / .html

${C.bold}Examples:${C.reset}
  # Audit a Vercel preview deployment (positional URL)
  node scripts/lighthouse-baseline.mjs https://your-preview.vercel.app

  # Using the npm script with PREVIEW_URL env var
  PREVIEW_URL=https://your-preview.vercel.app npm run audit:lighthouse:preview

  # Pass an explicit URL via the npm script
  npm run audit:lighthouse:url -- https://your-preview.vercel.app

  # Re-run today's baseline (overwrite existing artifacts)
  node scripts/lighthouse-baseline.mjs https://your-preview.vercel.app --overwrite

${C.bold}Exit codes:${C.reset}
  0  Audit completed and summary written successfully
  1  Usage error, Lighthouse not found, or audit failure
  2  Unexpected script crash
`);
}

// ── CLI argument parsing ───────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  let targetUrl = null;
  let overwrite  = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--url') {
      targetUrl = args[++i] ?? null;
    } else if (arg === '--overwrite') {
      overwrite = true;
    } else if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('--')) {
      // Positional URL argument
      targetUrl = arg;
    } else {
      err(`Unknown option: ${arg}`);
      err('Run with --help for usage.');
      process.exit(1);
    }
  }

  // Fall back to environment variable
  if (!targetUrl && process.env.PREVIEW_URL) {
    targetUrl = process.env.PREVIEW_URL;
  }

  return { targetUrl, overwrite };
}

// ── Date stamp (YYYY-MM-DD) ────────────────────────────────────────────────────
function todayStamp() {
  const d   = new Date();
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Locate the Lighthouse binary ───────────────────────────────────────────────
function resolveLighthouseBin() {
  const localBin = resolve(ROOT_DIR, 'node_modules/.bin/lighthouse');
  if (existsSync(localBin)) return localBin;

  // Check system PATH as fallback
  const which = spawnSync('which', ['lighthouse'], { encoding: 'utf8' });
  if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();

  return null;
}

// ── Median of a numeric array ─────────────────────────────────────────────────
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid    = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── Score colour for terminal output ──────────────────────────────────────────
function scoreColour(score) {
  if (score === null) return C.yellow;
  if (score >= 90)    return C.green;
  if (score >= 50)    return C.yellow;
  return C.red;
}

// ── Run a single Lighthouse pass ───────────────────────────────────────────────
/**
 * Invokes the Lighthouse CLI for one audit run and returns the path to the
 * generated JSON report.
 *
 * Lighthouse writes two files when multiple --output formats are requested:
 *   {outputPathPrefix}.report.json
 *   {outputPathPrefix}.report.html
 *
 * @param {string} lhBin         Absolute path to the lighthouse binary
 * @param {string} targetUrl     URL to audit
 * @param {string} outputPrefix  Output path prefix (no extension)
 * @param {number} runIndex      1-based run counter (used for logging)
 * @returns {string}             Absolute path to the written .report.json file
 */
function runLighthousePass(lhBin, targetUrl, outputPrefix, runIndex) {
  log(`\n${C.cyan}  ► Run ${runIndex}/${RUN_COUNT}${C.reset} — ${targetUrl} ...`);

  const args = [
    targetUrl,
    '--preset=desktop',
    `--only-categories=${CATEGORIES.join(',')}`,
    '--output=json',
    '--output=html',
    `--output-path=${outputPrefix}`,
    '--quiet',
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
  ];

  const result = spawnSync(lhBin, args, {
    encoding: 'utf8',
    // Inherit stderr so Chrome/Lighthouse warnings surface during long runs.
    // stdout is captured so --quiet output doesn't clutter our own logging.
    stdio: ['ignore', 'pipe', 'inherit'],
    timeout: 120_000, // 2 minutes per run
  });

  if (result.error) {
    throw new Error(`Lighthouse process error on run ${runIndex}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`Lighthouse exited with code ${result.status} on run ${runIndex}`);
  }

  const reportJsonPath = `${outputPrefix}.report.json`;
  if (!existsSync(reportJsonPath)) {
    throw new Error(
      `Expected JSON report not found at ${reportJsonPath}. ` +
      'Check that the output path is writable and Lighthouse completed successfully.',
    );
  }

  log(`  ${C.green}✓${C.reset} Run ${runIndex} complete → ${reportJsonPath}`);
  return reportJsonPath;
}

// ── Extract category scores from a Lighthouse JSON report ─────────────────────
/**
 * Returns an object mapping each category key to its raw score (0–1).
 *
 * @param {string} reportJsonPath
 * @returns {Record<string, number|null>}
 */
function extractScores(reportJsonPath) {
  const report = JSON.parse(readFileSync(reportJsonPath, 'utf8'));
  return Object.fromEntries(
    CATEGORIES.map((cat) => [cat, report.categories?.[cat]?.score ?? null]),
  );
}

// ── Extract tool-version metadata from a Lighthouse JSON report ───────────────
/**
 * @param {string} reportJsonPath
 * @returns {{ lighthouseVersion: string|null, chromeVersion: string|null, userAgent: string|null }}
 */
function extractVersions(reportJsonPath) {
  const report = JSON.parse(readFileSync(reportJsonPath, 'utf8'));
  const hostUA = report.environment?.hostUserAgent ?? '';
  const chromeMatch = hostUA.match(/Chrome\/([\d.]+)/);
  return {
    lighthouseVersion: report.lighthouseVersion ?? null,
    chromeVersion:     chromeMatch ? chromeMatch[1] : null,
    userAgent:         hostUA || null,
  };
}

// ── Round a raw score (0–1) to 3 decimal places ───────────────────────────────
function roundRaw(v) {
  return v !== null ? Math.round(v * 1000) / 1000 : null;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  log('');
  log(`${C.bold}=== Lighthouse Baseline Audit ===${C.reset}`);

  // ── 1. Resolve target URL ──────────────────────────────────────────────────
  const { targetUrl, overwrite } = parseArgs(process.argv);

  if (!targetUrl) {
    err('');
    err(`${C.red}${C.bold}ERROR: No target URL provided.${C.reset}`);
    err('');
    err('Provide the URL as a positional argument or set PREVIEW_URL:');
    err('');
    err('  node scripts/lighthouse-baseline.mjs https://your-preview.vercel.app');
    err('  PREVIEW_URL=https://your-preview.vercel.app npm run audit:lighthouse:preview');
    err('');
    err('Run with --help for full usage information.');
    err('');
    process.exit(1);
  }

  // Validate URL format before doing any work
  try {
    new URL(targetUrl);
  } catch {
    err('');
    err(`${C.red}${C.bold}ERROR: Invalid URL: "${targetUrl}"${C.reset}`);
    err('Please provide a valid absolute URL (e.g. https://your-preview.vercel.app).');
    err('');
    process.exit(1);
  }

  log(`Target URL      : ${targetUrl}`);
  log(`Runs            : ${RUN_COUNT} (median scores recorded as baseline)`);
  log(`Categories      : ${CATEGORIES.join(', ')}`);
  log(`Output dir      : ${OUT_DIR}`);

  // ── 2. Resolve Lighthouse binary ──────────────────────────────────────────
  const lhBin = resolveLighthouseBin();

  if (!lhBin) {
    err('');
    err(`${C.red}${C.bold}ERROR: Lighthouse CLI not found.${C.reset}`);
    err('');
    err('Install project dependencies (includes lighthouse as a devDependency):');
    err('  npm install');
    err('');
    err('Or install globally:');
    err('  npm install -g lighthouse');
    err('');
    process.exit(1);
  }

  log(`Lighthouse bin  : ${lhBin}`);

  // ── 3. Ensure output directory exists ─────────────────────────────────────
  mkdirSync(OUT_DIR, { recursive: true });

  const dateStamp = todayStamp();

  // ── 4. Guard against overwriting existing artifacts ───────────────────────
  const guardPath = join(OUT_DIR, `${dateStamp}-preview-run-1.report.json`);
  if (existsSync(guardPath) && !overwrite) {
    err('');
    err(`${C.yellow}${C.bold}⚠  Baseline artifacts for ${dateStamp} already exist.${C.reset}`);
    err('');
    err(`  Existing files: ${OUT_DIR}/${dateStamp}-preview-*`);
    err('');
    err('Options:');
    err('  --overwrite    Replace existing artifacts');
    err('  Move or rename existing files before re-running');
    err('');
    process.exit(1);
  }

  // ── 5. Run Lighthouse RUN_COUNT times ─────────────────────────────────────
  log('');
  log(`${C.bold}Running ${RUN_COUNT} Lighthouse passes (reduces single-run noise)...${C.reset}`);

  const runScores = [];
  const reportJsonPaths = [];

  for (let i = 1; i <= RUN_COUNT; i++) {
    const runBaseName  = `${dateStamp}-preview-run-${i}`;
    const outputPrefix = join(OUT_DIR, runBaseName);

    let reportJsonPath;
    try {
      reportJsonPath = runLighthousePass(lhBin, targetUrl, outputPrefix, i);
    } catch (runErr) {
      err(`${C.red}✗ ${runErr.message}${C.reset}`);
      process.exit(1);
    }

    const scores = extractScores(reportJsonPath);
    runScores.push(scores);
    reportJsonPaths.push(`${runBaseName}.report.json`);

    const inlineScores = CATEGORIES.map((cat) => {
      const s = scores[cat];
      return `${cat.split('-')[0]}: ${s !== null ? Math.round(s * 100) : 'N/A'}`;
    }).join('  ');
    log(`    Scores: ${inlineScores}`);
  }

  // ── 6. Compute median scores ───────────────────────────────────────────────
  log('');
  log(`${C.bold}Computing ${RUN_COUNT}-run median scores...${C.reset}`);

  const medianScores = Object.fromEntries(
    CATEGORIES.map((cat) => {
      const values = runScores.map((r) => r[cat]).filter((v) => v !== null);
      return [cat, values.length > 0 ? median(values) : null];
    }),
  );

  // ── 7. Extract version metadata from first run's report ───────────────────
  const firstRunPath = join(OUT_DIR, reportJsonPaths[0]);
  const versions     = extractVersions(firstRunPath);

  // ── 8. Build summary JSON ─────────────────────────────────────────────────
  const summaryFileName = `${dateStamp}-preview-baseline.summary.json`;
  const summaryPath     = join(OUT_DIR, summaryFileName);

  const summary = {
    schemaVersion:     '1.0',
    generatedAt:       new Date().toISOString(),
    targetUrl,
    runs:              RUN_COUNT,
    lighthouseVersion: versions.lighthouseVersion,
    chromeVersion:     versions.chromeVersion,
    userAgent:         versions.userAgent,
    categories:        Object.fromEntries(
      CATEGORIES.map((cat) => {
        const raw = medianScores[cat];
        return [cat, {
          raw:   roundRaw(raw),
          score: raw !== null ? Math.round(raw * 100) : null,
        }];
      }),
    ),
    perRunScores: runScores.map((runScore) =>
      Object.fromEntries(
        CATEGORIES.map((cat) => [cat, {
          raw:   roundRaw(runScore[cat]),
          score: runScore[cat] !== null ? Math.round(runScore[cat] * 100) : null,
        }]),
      ),
    ),
    artifacts: {
      summaryJson: summaryFileName,
      runs:        reportJsonPaths.map((jsonFile) => ({
        json: jsonFile,
        html: jsonFile.replace('.report.json', '.report.html'),
      })),
    },
  };

  writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');

  // ── 9. Print summary table ─────────────────────────────────────────────────
  log('');
  log(`${C.bold}════════════════════════════════════════${C.reset}`);
  log(`${C.bold}  Lighthouse Baseline Summary${C.reset}`);
  log(`${C.bold}════════════════════════════════════════${C.reset}`);
  log(`  URL             : ${targetUrl}`);
  log(`  Date            : ${dateStamp}`);
  log(`  Lighthouse      : ${versions.lighthouseVersion ?? 'unknown'}`);
  log(`  Chrome          : ${versions.chromeVersion ?? 'unknown'}`);
  log('');
  log(`${C.bold}  Median Scores (${RUN_COUNT}-run median):${C.reset}`);

  for (const cat of CATEGORIES) {
    const { score, raw } = summary.categories[cat];
    const colour     = scoreColour(score);
    const displayVal = score !== null ? `${String(score).padStart(3)}/100  (raw: ${raw})` : 'N/A';
    log(`    ${cat.padEnd(18)} ${colour}${displayVal}${C.reset}`);
  }

  log('');
  log(`${C.bold}  Artifacts:${C.reset}`);
  log(`    ${summaryPath}`);
  for (const run of summary.artifacts.runs) {
    log(`    ${join(OUT_DIR, run.json)}`);
    log(`    ${join(OUT_DIR, run.html)}`);
  }

  log('');
  log(`${C.green}${C.bold}✓ Baseline audit complete.${C.reset}`);
  log(`  Commit ${summaryFileName} to source control to track this baseline.`);
  log('');
}

main().catch((fatalErr) => {
  err(`${C.red}${C.bold}FATAL: ${fatalErr.message}${C.reset}`);
  err(fatalErr.stack ?? '');
  process.exit(2);
});
