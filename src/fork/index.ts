/**
 * Situation Monitor — Fork Entry Point
 *
 * Tier 2 hook: imported via dynamic import() in main.ts after app.init().
 * All fork logic lives in src/fork/. Fork errors never crash upstream.
 */

import { SM_CONFIG } from './config';

/**
 * Inject <style id="fork-theme"> as the last style in <head>.
 * Overrides upstream CSS variables via :root and [data-theme="light"].
 * happy-theme.css is unlayered — fork-theme must appear after it
 * in document order to win the cascade.
 */
function injectForkTheme(): void {
  try {
    if (document.getElementById('fork-theme')) {
      console.warn('[fork] fork-theme already injected, skipping');
      return;
    }

    const style = document.createElement('style');
    style.id = 'fork-theme';
    style.textContent = `
      :root {
        --sm-accent: ${SM_CONFIG.accent};
        --sm-bg: var(--bg);
        --sm-surface: var(--surface);
        --accent: var(--sm-accent);
        --bg: var(--sm-bg);
        --surface: var(--sm-surface);
      }
      [data-theme="light"] {
        --accent: var(--sm-accent);
        --bg: var(--sm-bg);
        --surface: var(--sm-surface);
      }
    `;
    document.head.appendChild(style);

    // Cascade verification: must be last style element in <head>
    const allStyles = document.head.querySelectorAll('style, link[rel="stylesheet"]');
    const isLast = allStyles[allStyles.length - 1] === style;
    if (!isLast) {
      console.warn('[fork] fork-theme is not the last style in <head> — cascade risk');
    }

    console.log(`[fork] ${SM_CONFIG.name} theme injected (accent: ${SM_CONFIG.accent})`);
  } catch (e) {
    console.warn('[fork] theme injection failed:', e);
  }
}

/**
 * Fork initialization entry point.
 * Called from main.ts Tier 2 hook after app.init() resolves.
 */
export function init(): void {
  try {
    injectForkTheme();
    console.log(`[fork] ${SM_CONFIG.name} v${SM_CONFIG.version} initialized`);
  } catch (e) {
    console.warn('[fork] init failed:', e);
  }
}
