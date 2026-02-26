import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Minimal DOM mock for Node environment
function setupDomMock() {
  const styles = [];
  const mockElement = {
    id: '',
    textContent: '',
  };

  const mockHead = {
    appendChild(el) {
      styles.push(el);
      return el;
    },
    querySelectorAll() {
      return styles;
    },
  };

  globalThis.document = {
    getElementById(id) {
      return styles.find((s) => s.id === id) || null;
    },
    createElement(tag) {
      const el = { ...mockElement, tagName: tag };
      return el;
    },
    head: mockHead,
  };
}

function teardownDomMock() {
  delete globalThis.document;
}

describe('fork/index init()', () => {
  beforeEach(() => {
    setupDomMock();
  });

  afterEach(() => {
    teardownDomMock();
  });

  it('exports an init function', async () => {
    const mod = await import('../index.ts');
    assert.equal(typeof mod.init, 'function');
  });

  it('init() does not throw', async () => {
    const mod = await import('../index.ts');
    assert.doesNotThrow(() => mod.init());
  });

  it('injects fork-theme style element', async () => {
    const mod = await import('../index.ts');
    mod.init();
    const themeEl = document.getElementById('fork-theme');
    assert.ok(themeEl, 'fork-theme element should exist after init()');
    assert.ok(themeEl.textContent.includes('--sm-accent'), 'should contain --sm-accent variable');
    assert.ok(themeEl.textContent.includes('--accent'), 'should contain --accent override');
  });

  it('does not inject twice on repeated calls', async () => {
    const mod = await import('../index.ts');
    mod.init();
    mod.init();
    const allStyles = document.head.querySelectorAll('style');
    const forkStyles = allStyles.filter((s) => s.id === 'fork-theme');
    assert.equal(forkStyles.length, 1, 'should only inject fork-theme once');
  });

  it('survives missing document gracefully', async () => {
    teardownDomMock();
    const mod = await import('../index.ts');
    assert.doesNotThrow(() => mod.init());
  });
});
