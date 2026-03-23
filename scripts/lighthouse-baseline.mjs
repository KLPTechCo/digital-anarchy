#!/usr/bin/env node

/**
 * Lighthouse Baseline Audit Script for World Monitor Preview deployments.
 *
 * Runs Lighthouse 3 times against a target URL, records median category scores,
 * and writes per-run JSON/HTML artifacts plus a concise summary JSON to:
 *   _spec/implementation-artifacts/lighthouse-baselines/
 *
 * Usage (CLI):
 *   node scripts/lighthouse-baseline.mjs https://your-preview.vercel.app
 *   node scripts/lighthouse-baseline.mjs  # reads PREVIEW_URL env var
 *
 * Usage (npm):
 *   npm run audit:lighthouse:preview          # reads PREVIEW_URL env var
 *   npm run audit:lighthouse:url -- https://your-preview.vercel.app
 *
 * Output artifacts per run:
 *   YYYY-MM-DD-preview-run-N.report.json
 *   YYYY-MM-DD-preview-run-N.report.html
 *
 * Summary (committed to source control):
 *   YYYY-MM-DD-preview-baseline.summary.json
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, '_spec', 'implementation-artifacts', 'lighthouse-baselines');
const RUN_COUNT = 3;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

// ── Resolve target URL ────────────────────────────────────────────────────────
const targetUrl = process.argv[2] || process.env.PREVIEW_URL || '';

if (!targetUrl) {
  console.error([
    '',
    '  ERROR: No target URL provided.',
    '',
    '  Supply the URL as the first argument or set the PREVIEW_URL environment variable:',
    '',
    '    node scripts/lighthouse-baseline.mjs https://your-preview.vercel.app',
    '    PREVIEW_URL=https://your-preview.vercel.app npm run audit:lighthouse:preview',
    '',
    '  The URL must be a live deployment — this script captures a Preview environment',
    '  baseline and is NOT intended for localhost audits.',
    '',
  ].join('\n'));
  process.exit(1);
}

// Validate URL is parseable
let parsedUrl;
try {
  parsedUrl = new URL(targetUrl);
} catch {
  console.error(`\n  ERROR: "${targetUrl}" is not a valid URL.\n`);
  process.exit(1);
}

// Warn (not error) on localhost so the script can be tested locally if needed
if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
  console.warn(
    '\n  WARNING: Auditing localhost. Baseline is intended for a live Preview deployment.\n' +
    '           Scores may not reflect real-world performance.\n'
  );
}

// ── Prepare output directory ──────────────────────────────────────────────────
if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

// ── Date slug for deterministic artifact naming ───────────────────────────────
const datestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const baseSlug = `${datestamp}-preview`;

// ── Lighthouse runner ─────────────────────────────────────────────────────────
function runLighthouse(runIndex) {
  const runName = `${baseSlug}-run-${runIndex}`;
  const outputBasePath = join(OUT_DIR, runName);

  // Lighthouse writes <path>.report.json and <path>.report.html
  const jsonReportPath = `${outputBasePath}.report.json`;
  const htmlReportPath = `${outputBasePath}.report.html`;

  console.log(`\n  [Run ${runIndex}/${RUN_COUNT}] Auditing ${targetUrl} …`);

  const result = spawnSync(
    'npx',
    [
      '--yes',
      'lighthouse',
      targetUrl,
      '--preset=desktop',
      `--only-categories=${CATEGORIES.join(',')}`,
      '--output=json',
      '--output=html',
      `--output-path=${outputBasePath}`,
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    ],
    {
      stdio: ['ignore', 'inherit', 'inherit'],
      encoding: 'utf-8',
      timeout: 180_000, // 3-minute cap per run
    }
  );

  if (result.status !== 0) {
    const msg = result.error ? `\n  Cause: ${result.error.message}` : '';
    console.error(`\n  ERROR: Lighthouse run ${runIndex} exited with code ${result.status}.${msg}`);
    console.error('  Ensure Chrome/Chromium is installed and the target URL is reachable.\n');
    process.exit(1);
  }

  if (!existsSync(jsonReportPath)) {
    console.error(`\n  ERROR: Expected JSON report not found at:\n    ${jsonReportPath}\n`);
    process.exit(1);
  }

  let report;
  try {
    report = JSON.parse(readFileSync(jsonReportPath, 'utf-8'));
  } catch (err) {
    console.error(`\n  ERROR: Could not parse JSON report: ${err.message}\n`);
    process.exit(1);
  }

  const scores = extractScores(report);
  const allPresent = CATEGORIES.every(cat => scores[cat] !== null);
  if (!allPresent) {
    const missing = CATEGORIES.filter(cat => scores[cat] === null).join(', ');
    console.error(`\n  ERROR: Run ${runIndex} is missing scores for: ${missing}\n`);
    process.exit(1);
  }

  return {
    runIndex,
    jsonReportPath,
    htmlReportPath: existsSync(htmlReportPath) ? htmlReportPath : null,
    scores,
    lighthouseVersion: report.lighthouseVersion ?? 'unknown',
    userAgent: report.environment?.hostUserAgent ?? '',
    fetchTime: report.fetchTime ?? new Date().toISOString(),
  };
}

// ── Score extractor ───────────────────────────────────────────────────────────
function extractScores(report) {
  const scores = {};
  for (const cat of CATEGORIES) {
    const catData = report.categories?.[cat];
    // score is 0–1 float; null if not present
    scores[cat] = typeof catData?.score === 'number' ? catData.score : null;
  }
  return scores;
}

// ── Median helper ─────────────────────────────────────────────────────────────
function median(values) {
  const sorted = values.filter(v => v !== null).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ── Execute runs ──────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  Lighthouse Baseline Audit');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  URL     : ${targetUrl}`);
console.log(`  Runs    : ${RUN_COUNT} (median will be recorded)`);
console.log(`  Output  : ${relative(REPO_ROOT, OUT_DIR)}/`);
console.log('═══════════════════════════════════════════════════════════════');

const runs = [];
for (let i = 1; i <= RUN_COUNT; i++) {
  runs.push(runLighthouse(i));
}

// ── Compute median scores ─────────────────────────────────────────────────────
const medianScores = {};
for (const cat of CATEGORIES) {
  const raw = median(runs.map(r => r.scores[cat]));
  medianScores[cat] = {
    raw: raw !== null ? parseFloat(raw.toFixed(4)) : null,
    score: raw !== null ? Math.round(raw * 100) : null,
  };
}

// ── Per-run score records ─────────────────────────────────────────────────────
const perRunScores = runs.map(r => ({
  run: r.runIndex,
  fetchTime: r.fetchTime,
  scores: Object.fromEntries(
    CATEGORIES.map(cat => [
      cat,
      {
        raw: r.scores[cat] !== null ? parseFloat(r.scores[cat].toFixed(4)) : null,
        score: r.scores[cat] !== null ? Math.round(r.scores[cat] * 100) : null,
      },
    ])
  ),
}));

// ── Build summary object ──────────────────────────────────────────────────────
const summary = {
  _description: 'Lighthouse baseline audit — median of multiple runs. Rerun with: npm run audit:lighthouse:preview',
  previewUrl: targetUrl,
  auditedAt: new Date().toISOString(),
  runCount: RUN_COUNT,
  lighthouseVersion: runs[0].lighthouseVersion,
  userAgent: runs[0].userAgent,
  categories: CATEGORIES,
  medianScores,
  perRunScores,
  artifacts: runs.map(r => ({
    run: r.runIndex,
    json: relative(REPO_ROOT, r.jsonReportPath),
    html: r.htmlReportPath ? relative(REPO_ROOT, r.htmlReportPath) : null,
  })),
};

// ── Write summary JSON ────────────────────────────────────────────────────────
const summaryPath = join(OUT_DIR, `${baseSlug}-baseline.summary.json`);
writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');

// ── Print results table ───────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  Baseline Results  (median of ${RUN_COUNT} runs)`);
console.log('═══════════════════════════════════════════════════════════════');

for (const cat of CATEGORIES) {
  const s = medianScores[cat];
  const pct = s.score ?? '?';
  const label = cat.padEnd(20);
  const bar = typeof s.score === 'number'
    ? ('█'.repeat(Math.floor(s.score / 10)) + '░'.repeat(10 - Math.floor(s.score / 10)))
    : '??????????';
  const icon = typeof s.score === 'number'
    ? (s.score >= 90 ? '✓' : s.score >= 50 ? '~' : '✗')
    : '?';
  console.log(`  ${icon} ${label} ${String(pct).padStart(3)} / 100  ${bar}`);
}

console.log('');
console.log(`  Summary : ${relative(REPO_ROOT, summaryPath)}`);
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('  Next steps:');
console.log('    1. Review the scores above and the HTML reports for detail.');
console.log('    2. Commit the summary JSON to track this baseline in source control:');
console.log(`       git add ${relative(REPO_ROOT, summaryPath)}`);
console.log('    3. Re-run this script after significant changes to detect regressions.');
console.log('');
