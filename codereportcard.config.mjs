/** @type {import('codereportcard').VibeCheckConfig} */
export default {
  // Additional glob patterns to exclude from scanning
  exclude: [
    '**/apps/e2e/**',
    '**/apps/server/test/**',
    '**/apps/server/src/database/seeds/**',
    '**/*.config.*',
    '**/*.spec.*',
    '**/*.test.*',
  ],

  // Per-category minimum score thresholds
  thresholds: {
    secretLeakage: 100,
  },

  // Overall score threshold
  failUnder: 0,

  // Category weight overrides
  weights: {
    clarity: 0.2,
    duplication: 0.2,
    deadCode: 0.2,
    secretLeakage: 0.2,
    aiSlop: 0.2,
  },
};
