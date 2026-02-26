import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SM_CONFIG } from '../config.ts';

describe('SM_CONFIG', () => {
  it('exports a config object with expected shape', () => {
    assert.ok(SM_CONFIG, 'SM_CONFIG should be defined');
    assert.equal(typeof SM_CONFIG, 'object', 'SM_CONFIG should be an object');
  });

  it('has required name field as non-empty string', () => {
    assert.equal(typeof SM_CONFIG.name, 'string');
    assert.ok(SM_CONFIG.name.length > 0, 'name should not be empty');
  });

  it('has required accent field as valid hex color', () => {
    assert.equal(typeof SM_CONFIG.accent, 'string');
    assert.match(SM_CONFIG.accent, /^#[0-9a-fA-F]{6}$/, 'accent should be a 6-digit hex color');
  });

  it('has required version field as semver-like string', () => {
    assert.equal(typeof SM_CONFIG.version, 'string');
    assert.match(SM_CONFIG.version, /^\d+\.\d+\.\d+/, 'version should start with semver format');
  });
});
