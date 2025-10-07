// ESLint configuration with CLAUDE.md compliance rules
// Using .js format to enable dynamic rulesdir configuration

const path = require('path');
const fs = require('fs');

// Configure rulesdir plugin
const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = path.join(__dirname, 'eslint-rules');

// Load enforcement config to dynamically enable/disable rules
let timezoneRuleEnabled = 'error'; // Default to enabled

try {
  const configPath = path.join(__dirname, 'scripts', 'enforcement', 'enforcement-config.json');
  if (fs.existsSync(configPath)) {
    const enforcementConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const timezoneConfig = enforcementConfig.validatorConfig?.rules?.timezone;

    // Check if timezone rule is explicitly disabled
    if (timezoneConfig && timezoneConfig.enabled === false) {
      timezoneRuleEnabled = 'off';
      console.log('ℹ️  Timezone ESLint rule disabled (legacy violations exist)');
    }
  }
} catch (error) {
  // If config can't be read, default to enabled for safety
  console.warn('Warning: Could not load enforcement-config.json for ESLint, using defaults');
}

module.exports = {
  extends: ['next/core-web-vitals', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'prettier',
    'check-file',
    'n',
    'rulesdir',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  settings: {
    typescript: {
      version: 'detect',
    },
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // =============================================================================
    // TYPE ORGANIZATION ENFORCEMENT RULES
    // =============================================================================
    'prefer-arrow-callback': ['error'],
    'prefer-template': ['error'],
    semi: ['error'],
    quotes: ['error', 'single'],
    'n/no-process-env': ['off'],
    'import/prefer-default-export': 'off',
    'check-file/filename-naming-convention': [
      'error',
      {
        '**/*.{ts,tsx}': 'KEBAB_CASE',
      },
      {
        ignoreMiddleExtensions: true,
      },
    ],
    'check-file/folder-naming-convention': [
      'error',
      {
        'src/**/!^[.*': 'KEBAB_CASE',
      },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/jsx-props-no-spreading': 'off',
    'prettier/prettier': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
        packageDir: ['./'],
      },
    ],
    '@next/next/no-img-element': 'off',

    // =============================================================================
    // SECURITY & PHI PROTECTION RULES
    // =============================================================================

    // Prevent ALL console usage (security risk for PHI exposure)
    'no-console': ['error'],

    // =============================================================================
    // CLAUDE.md COMPLIANCE RULES (Custom Rules from eslint-rules/)
    // =============================================================================
    // NOTE: Full validation is performed by scripts/validation/claude-code-validator.js
    //       ESLint rules provide real-time feedback for most critical violations
    // NOTE: Rule severity is dynamically loaded from scripts/enforcement/enforcement-config.json

    // Timezone compliance - prevent new Date() and Date.now() usage
    // Dynamically enabled/disabled based on scripts/enforcement/enforcement-config.json
    'rulesdir/no-new-date': timezoneRuleEnabled,

    // Additional rules (validated by pre-commit hook):
    // - Type safety (as any restrictions)
    // - PHI sanitization in logging
    // - Cross-feature imports
    // - Hooks type exports
    // - Zod validation in tRPC
    // - Transaction requirements for bookings
    // - Pagination (take:) for findMany

    // =============================================================================
    // TYPE ORGANIZATION LINTING RULES (Custom Rules from eslint-rules/type-organization.js)
    // =============================================================================

    // Rule 1: Prevent barrel exports AND index.ts files in type directories
    'rulesdir/no-type-barrel-exports': 'error',

    // Rule 2: Enforce type file structure (headers, JSDoc, section ordering)
    'rulesdir/enforce-type-file-structure': 'warn',

    // Rule 3: Enforce direct type imports (no barrel exports)
    'rulesdir/enforce-direct-type-imports': 'error',

    // Rule 4: Enforce type file naming (types.ts, schemas.ts, guards.ts, enums.ts)
    // Downgraded to warn to allow gradual migration
    'rulesdir/enforce-type-file-naming': 'warn',

    // Rule 5: Enforce Prisma-derived type patterns
    'rulesdir/enforce-prisma-derived-patterns': 'warn',
  },
  overrides: [
    {
      files: ['e2e/**/*', 'scripts/**/*', 'test-types.ts', 'src/lib/logger.ts', 'src/lib/debug.ts'],
      rules: {
        'no-console': 'off',
        'import/no-extraneous-dependencies': 'off', // Allow test files to import from src/
        'rulesdir/no-new-date': 'off', // Allow Date usage in test/infrastructure files
      },
    },
  ],
  ignorePatterns: [
    '.eslintrc.js',
    'prisma/**/*',
    'src/features/service-provider/lib/helper.ts',
    'src/features/service-provider/lib/render-requirement-input.tsx',
    'next.config.js',
    'next.config.mjs',
    'eslint-rules/**/*',
    'scripts/**/*.js',
  ],
};
