// ESLint configuration with CLAUDE.md compliance rules
// Using .js format to enable dynamic rulesdir configuration

const path = require('path');
const fs = require('fs');

// Configure rulesdir plugin
const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = path.join(__dirname, 'eslint-rules');

// Load compliance config to dynamically enable/disable rules
let timezoneRuleEnabled = 'error'; // Default to enabled

try {
  const configPath = path.join(__dirname, 'scripts', 'compliance', 'compliance-config.json');
  if (fs.existsSync(configPath)) {
    const complianceConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const timezoneConfig = complianceConfig.validatorConfig?.rules?.timezone;

    // Check if timezone rule is explicitly disabled
    if (timezoneConfig && timezoneConfig.enabled === false) {
      timezoneRuleEnabled = 'off';
      console.log('ℹ️  Timezone ESLint rule disabled (legacy violations exist)');
    }
  }
} catch (error) {
  // If config can't be read, default to enabled for safety
  console.warn('Warning: Could not load compliance-config.json for ESLint, using defaults');
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
    // TYPE SAFETY RULES
    // =============================================================================

    // Prevent explicit 'any' type usage (enforces type safety per CLAUDE.md Section 3)
    // NOTE: Set to 'warn' due to 245+ existing violations - will migrate to 'error' incrementally
    '@typescript-eslint/no-explicit-any': 'warn',

    // Prevent unsafe assignments (catches implicit any propagation)
    '@typescript-eslint/no-unsafe-assignment': 'warn',

    // =============================================================================
    // CLAUDE.md COMPLIANCE RULES (Custom Rules from eslint-rules/)
    // =============================================================================
    // NOTE: Full validation is performed by scripts/commit-gate/compliance-validator.js
    //       ESLint rules provide real-time IDE feedback for most critical violations
    // NOTE: Rule severity is dynamically loaded from scripts/compliance/compliance-config.json

    // Timezone compliance - prevent new Date() and Date.now() usage
    // Dynamically enabled/disabled based on scripts/compliance/compliance-config.json
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
    {
      // Type guards use (value as any) for runtime validation - this is documented and acceptable
      files: ['**/types/guards.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
    {
      // tRPC routers have conditional includes that create complex any types - acceptable architectural trade-off
      files: ['src/server/api/routers/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
    {
      // tRPC route adapter requires any for Next.js App Router compatibility
      files: ['src/app/api/trpc/[trpc]/route.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
    {
      // Development utilities and logger - infrastructure files with legitimate any usage
      files: ['src/utils/development.ts', 'src/lib/logger.ts', 'src/lib/debug.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
    {
      // API routes - response.json() and request.json() return any by design (Web API spec)
      files: ['src/app/api/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
    {
      // Google Maps integration - external library has complex/unknown types that are impractical to fully type
      files: [
        'src/components/ui/location-autocomplete.tsx',
        'src/features/organizations/components/google-maps-location-picker.tsx',
        'src/features/organizations/lib/helper.ts',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
    {
      // Type files - JSDoc documentation debt (warnings allowed, will be addressed incrementally)
      files: ['**/types/types.ts'],
      rules: {
        'rulesdir/enforce-type-file-structure': 'warn', // Already warn, keeping it
      },
    },
    {
      // Form components with React Hook Form - complex type inference from dynamic forms
      files: [
        'src/features/providers/components/onboarding/**/*.tsx',
        'src/features/providers/components/profile/edit-*.tsx',
        'src/features/organizations/components/registration-form/**/*.tsx',
      ],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'warn', // Downgrade to warn
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
