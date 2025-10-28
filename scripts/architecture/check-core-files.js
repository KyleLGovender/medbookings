#!/usr/bin/env node

const { execSync } = require('child_process');

// FIX #1: Graceful fallback if chalk is not installed
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // Fallback to no colors if chalk not installed
  const noColor = (s) => s;
  const noBold = {
    red: noColor,
    yellow: noColor,
    green: noColor,
    blue: noColor,
    white: noColor,
    cyan: noColor,
  };
  chalk = {
    red: noColor,
    yellow: noColor,
    green: noColor,
    blue: noColor,
    cyan: noColor,
    gray: noColor,
    white: noColor,
    bold: noBold,
  };
  console.warn('[!] chalk package not installed - running without colors');
}

// File categorization with CLAUDE.md section references and validation requirements
const CRITICAL_FILES = [
  {
    pattern: 'prisma/schema.prisma',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'ADDITIVE ONLY - Ask approval before removing/renaming',
    validations: ['npm run db:integrity', 'Verify migrations', 'Check Prisma client generation'],
  },
  {
    pattern: 'src/server/trpc.ts',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'tRPC configuration - affects ALL API endpoints',
    validations: ['npm run build', 'npx tsc --noEmit', 'Check API functionality'],
  },
  {
    pattern: 'src/lib/auth.ts',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'Authentication core - security critical',
    validations: ['Test login flows', 'Verify session handling', 'Check role permissions'],
  },
  {
    pattern: 'src/lib/prisma.ts',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'Database client - affects all DB operations',
    validations: ['npm run db:integrity', 'Test connection pooling', 'Verify transactions'],
  },
  {
    pattern: 'src/middleware.ts',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'Route protection - security critical',
    validations: ['Test protected routes', 'Verify redirects', 'Check auth flows'],
  },
  {
    pattern: 'src/utils/api.ts',
    claudeSection: 'SECTION 3: ARCHITECTURE & TECH STACK',
    rule: 'tRPC client setup - affects type exports',
    validations: ['npx tsc --noEmit', 'Check type inference', 'Verify API hooks'],
  },
];

const HIGH_RISK_FILES = [
  {
    pattern: 'src/server/api/root.ts',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'API root - all router registrations',
    validations: ['npm run build', 'Check router exports', 'Verify endpoint access'],
  },
  {
    pattern: 'src/server/api/routers/',
    claudeSection: 'SECTION 3: ARCHITECTURE & TECH STACK',
    rule: 'Database access ONLY here - tRPC procedures',
    validations: ['Check authorization', 'Verify input validation', 'Test error handling'],
  },
  {
    pattern: 'src/app/layout.tsx',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'App shell - affects all pages',
    validations: ['Test page rendering', 'Check provider hierarchy', 'Verify metadata'],
  },
  {
    pattern: 'src/app/api/auth/',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'Auth routes - security critical',
    validations: ['Test OAuth flows', 'Verify callbacks', 'Check error handling'],
  },
  {
    pattern: 'src/components/ui/*',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'UI library - affects all components',
    validations: ['Test component rendering', 'Check accessibility', 'Verify variants'],
  },
  {
    pattern: 'package.json',
    claudeSection: 'SECTION 11: FILE HIERARCHY & PROTECTION',
    rule: 'Dependencies - affects entire project',
    validations: ['npm install', 'npm run build', 'Check for breaking changes'],
  },
  {
    pattern: 'src/lib/permissions/',
    claudeSection: 'SECTION 8: SECURITY CHECKLIST',
    rule: 'Authorization logic - security critical',
    validations: ['Test role checks', 'Verify permissions', 'Check edge cases'],
  },
  {
    pattern: 'src/lib/communications/',
    claudeSection: 'SECTION 4: BUSINESS RULES',
    rule: 'Email/SMS/WhatsApp - affects notifications',
    validations: ['Test message sending', 'Verify templates', 'Check error handling'],
  },
  {
    pattern: 'next.config.',
    claudeSection: 'SECTION 3: ARCHITECTURE & TECH STACK',
    rule: 'Next.js configuration - affects build and runtime',
    validations: ['npm run build', 'Check environment variables', 'Verify redirects'],
  },
];

const MODERATE_FILES = [
  {
    pattern: 'tsconfig.json',
    claudeSection: 'SECTION 3: ARCHITECTURE & TECH STACK',
    rule: 'TypeScript configuration',
    validations: ['npx tsc --noEmit', 'Check strict mode', 'Verify path mappings'],
  },
  {
    pattern: '.github/workflows/',
    claudeSection: 'SECTION 5: BUILD & QUALITY GATES',
    rule: 'CI/CD pipelines',
    validations: ['Test workflow locally', 'Verify secrets', 'Check triggers'],
  },
  {
    pattern: 'src/features/*/types/schemas.ts',
    claudeSection: 'SECTION 3: ARCHITECTURE & TECH STACK',
    rule: 'Zod validation schemas',
    validations: ['Test schema validation', 'Check error messages', 'Verify edge cases'],
  },
  {
    pattern: 'src/features/*/lib/actions.ts',
    claudeSection: 'SECTION 3: ARCHITECTURE & TECH STACK',
    rule: 'Server actions - business logic only, NO database',
    validations: ['Verify no DB queries', 'Test business logic', 'Check error handling'],
  },
];

// FIX #2: Dynamic branch detection instead of hardcoded 'master'
function getDefaultBranch() {
  try {
    // Try to get the default branch from remote HEAD
    const branch = execSync('git symbolic-ref refs/remotes/origin/HEAD', { encoding: 'utf8' })
      .trim()
      .replace('refs/remotes/origin/', '');
    return branch;
  } catch {
    // Fallback to 'master' if detection fails
    return 'master';
  }
}

function getChangedFiles(stagedOnly = false) {
  try {
    let output;

    if (stagedOnly) {
      // Check only staged files (for pre-commit hook)
      console.log(chalk.gray('[*] Checking staged files only...'));
      output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
    } else {
      // Check all changes vs base branch (for manual run)
      const branch = getDefaultBranch();
      console.log(chalk.gray(`[*] Comparing with ${branch} branch...`));
      output = execSync(`git diff ${branch} --name-only`, { encoding: 'utf8' });
    }

    const files = output.split('\n').filter(Boolean);

    if (files.length === 0) {
      console.log(
        chalk.gray(stagedOnly ? '[+] No staged files' : '[+] No differences found from base branch')
      );
    } else {
      console.log(chalk.gray(`[+] Found ${files.length} changed file(s)`));
    }

    return files;
  } catch (error) {
    console.error(chalk.yellow('[!] Could not get changed files'));
    console.error(chalk.gray(`    Reason: ${error.message}`));
    return [];
  }
}

// FIX #4: Improved pattern matching with normalization and anchor matching
function matchesPattern(file, pattern) {
  // Normalize paths to use forward slashes
  const normalizedFile = file.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');

  if (normalizedPattern.includes('*')) {
    // Escape special regex characters, then convert * to .*
    const regexPattern = normalizedPattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    // Use anchored regex for exact matching from start
    return new RegExp(`^${regexPattern}$`).test(normalizedFile);
  }

  // For non-wildcard patterns, check exact match or path contains pattern
  return (
    normalizedFile === normalizedPattern ||
    normalizedFile.includes('/' + normalizedPattern) ||
    normalizedFile.startsWith(normalizedPattern + '/')
  );
}

function categorizeFiles(files) {
  const critical = [];
  const highRisk = [];
  const moderate = [];

  files.forEach((file) => {
    // Check critical files
    const criticalMatch = CRITICAL_FILES.find((item) => matchesPattern(file, item.pattern));
    if (criticalMatch) {
      critical.push({ file, ...criticalMatch });
      return;
    }

    const highRiskMatch = HIGH_RISK_FILES.find((item) => matchesPattern(file, item.pattern));
    if (highRiskMatch) {
      highRisk.push({ file, ...highRiskMatch });
      return;
    }

    const moderateMatch = MODERATE_FILES.find((item) => matchesPattern(file, item.pattern));
    if (moderateMatch) {
      moderate.push({ file, ...moderateMatch });
    }
  });

  return { critical, highRisk, moderate };
}

function generateValidationChecklist(categorizedFiles) {
  const checklist = new Set();
  const allFiles = [
    ...categorizedFiles.critical,
    ...categorizedFiles.highRisk,
    ...categorizedFiles.moderate,
  ];

  allFiles.forEach((item) => {
    item.validations.forEach((validation) => checklist.add(validation));
  });

  return Array.from(checklist);
}

// FIX #5: Validate file definitions at startup
function validateFileDefinitions() {
  const allDefs = [...CRITICAL_FILES, ...HIGH_RISK_FILES, ...MODERATE_FILES];

  allDefs.forEach((def, index) => {
    if (!def.pattern) {
      throw new Error(`[VALIDATION ERROR] Missing pattern at definition index ${index}`);
    }
    if (!def.claudeSection) {
      throw new Error(`[VALIDATION ERROR] Missing claudeSection for pattern: ${def.pattern}`);
    }
    if (!def.rule) {
      throw new Error(`[VALIDATION ERROR] Missing rule for pattern: ${def.pattern}`);
    }
    if (!Array.isArray(def.validations) || def.validations.length === 0) {
      throw new Error(
        `[VALIDATION ERROR] Invalid or empty validations array for pattern: ${def.pattern}`
      );
    }
  });
}

function main() {
  // Validate file definitions before processing
  try {
    validateFileDefinitions();
  } catch (error) {
    console.error(chalk.red(error.message));
    return 1;
  }

  console.log(chalk.blue('[INFO] Architecture Impact Report\n'));

  // Check if --staged flag is passed (from pre-commit hook)
  const stagedOnly = process.argv.includes('--staged');
  const changedFiles = getChangedFiles(stagedOnly);

  if (changedFiles.length === 0) {
    console.log(chalk.green('[OK] No files changed from base branch'));
    return 0;
  }

  const { critical, highRisk, moderate } = categorizeFiles(changedFiles);

  // If no architectural files changed, report and exit
  if (critical.length === 0 && highRisk.length === 0 && moderate.length === 0) {
    console.log(chalk.green('[OK] No architectural files modified'));
    return 0;
  }

  // Show summary first
  console.log(chalk.white('[REPORT] Architectural Changes Detected:\n'));

  // CRITICAL FILES - Enhanced with CLAUDE.md references
  if (critical.length > 0) {
    console.log(
      chalk.red.bold(`[CRITICAL] Core architectural files modified [${critical.length}]`)
    );
    critical.forEach((item) => {
      console.log(chalk.red(`\n   File: ${item.file}`));
      console.log(chalk.gray(`      Reference: CLAUDE.md ${item.claudeSection}`));
      console.log(chalk.yellow(`      Rule: ${item.rule}`));
      console.log(chalk.white(`      Required validations:`));
      item.validations.forEach((v) => console.log(chalk.cyan(`         - ${v}`)));
    });
  }

  // HIGH RISK FILES - Enhanced with CLAUDE.md references
  if (highRisk.length > 0) {
    console.log(chalk.yellow.bold(`\n[HIGH RISK] Important files modified [${highRisk.length}]`));
    highRisk.forEach((item) => {
      console.log(chalk.yellow(`\n   File: ${item.file}`));
      console.log(chalk.gray(`      Reference: CLAUDE.md ${item.claudeSection}`));
      console.log(chalk.yellow(`      Rule: ${item.rule}`));
      console.log(chalk.white(`      Required validations:`));
      item.validations.forEach((v) => console.log(chalk.cyan(`         - ${v}`)));
    });
  }

  // MODERATE FILES - Enhanced with CLAUDE.md references
  if (moderate.length > 0) {
    console.log(chalk.cyan.bold(`\n[MODERATE] Configuration files modified [${moderate.length}]`));
    moderate.forEach((item) => {
      console.log(chalk.cyan(`\n   File: ${item.file}`));
      console.log(chalk.gray(`      Reference: CLAUDE.md ${item.claudeSection}`));
      console.log(chalk.yellow(`      Rule: ${item.rule}`));
      console.log(chalk.white(`      Required validations:`));
      item.validations.forEach((v) => console.log(chalk.cyan(`         - ${v}`)));
    });
  }

  // VALIDATION CHECKLIST
  const checklist = generateValidationChecklist({ critical, highRisk, moderate });
  console.log(chalk.white.bold('\n[CHECKLIST] Validation Checklist:'));
  console.log(chalk.gray('   Run these validations before PR/commit:\n'));
  checklist.forEach((validation, index) => {
    console.log(chalk.green(`   ${index + 1}. ${validation}`));
  });

  // SUMMARY
  console.log(chalk.white.bold('\n[SUMMARY] Summary:'));
  const total = critical.length + highRisk.length + moderate.length;
  console.log(chalk.white(`   Total architectural files modified: ${total}`));
  if (critical.length > 0) console.log(chalk.red(`   - Critical: ${critical.length}`));
  if (highRisk.length > 0) console.log(chalk.yellow(`   - High Risk: ${highRisk.length}`));
  if (moderate.length > 0) console.log(chalk.cyan(`   - Moderate: ${moderate.length}`));
  console.log(chalk.white(`   - Validations required: ${checklist.length}`));

  // CLAUDE.md REMINDER
  console.log(chalk.blue.bold('\n[DOCS] CLAUDE.md Sections to Review:'));
  const sections = new Set();
  [...critical, ...highRisk, ...moderate].forEach((item) => sections.add(item.claudeSection));
  Array.from(sections).forEach((section) => {
    console.log(chalk.blue(`   - ${section}`));
  });

  // INFORMATIONAL STATUS - Always success
  console.log(
    chalk.green('\n[OK] Architecture check complete - follow validation checklist above')
  );

  // Always return 0 for non-blocking behavior
  return 0;
}

// Always exit with 0 - never blocks
process.exit(main());
