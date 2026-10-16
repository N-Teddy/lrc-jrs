// fallow-ignore-file unused-file
export default {
    // Additional glob patterns to exclude from scanning
    exclude: [
        'apps/server/src/database/seeds/**',
        'apps/e2e/**',
        'apps/server/test/**',
    ],

    // Per-rule overrides
    rules: {
        // 'file-too-long': { limit: 300, severity: 'warning' },
        // 'high-complexity': { limit: 10, severity: 'error' },
        // 'no-console': { enabled: false },
    },

    // Per-category minimum score thresholds (CI fails if below)
    thresholds: {
        // clarity: 80,
        // duplication: 80,
        // deadCode: 80,
        // secretLeakage: 100,
        // aiSlop: 70,
    },

    // Overall score threshold — exit code 1 if final score is below this
    failUnder: 0,

    // Category weight overrides (auto-normalized to sum to 1.0)
    weights: {
        // clarity: 0.2,
        // duplication: 0.2,
        // deadCode: 0.2,
        // secretLeakage: 0.2,
        // aiSlop: 0.2,
    },
};
