/**
 * Situation Monitor — Fork Configuration
 *
 * Central config for all fork-specific values.
 * Full --sm-* token system deferred to Epic 2 (Story 2.1).
 */

export const SM_CONFIG = {
  name: 'Situation Monitor',
  accent: '#4dd0e1',
  version: '0.1.0-spike',
} as const;

export type SmConfig = typeof SM_CONFIG;
