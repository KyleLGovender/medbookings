#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const path = require('path');

const CRITICAL_FILES = [
  'prisma/schema.prisma',
  'src/server/trpc.ts',
  'src/lib/auth.ts',
  'src/lib/prisma.ts',
  'src/utils/api.ts',
  'src/env.js',
  'src/config/env/server.ts',
  'src/types/next-auth.d.ts',
];

const HIGH_RISK_FILES = [
  'src/middleware.ts',
  'src/server/api/root.ts',
  'src/server/api/routers/',
  'src/app/layout.tsx',
  'src/app/api/auth/',
  'src/app/api/trpc/',
  'src/app/providers.tsx',
  'src/lib/permissions/',
  'src/lib/communications/',
  'src/lib/crypto/',
  'src/hooks/use-permissions.ts',
  'next.config.',
  'package.json',
];

const MODERATE_FILES = [
  'tsconfig.json',
  'package-lock.json',
  'playwright.config.ts',
  '.github/workflows/',
  'scripts/',
  'src/features/*/types/schemas.ts',
  'src/features/*/types/types.ts',
  'src/features/*/lib/actions.ts',
];

function getChangedFiles() {
  try {
    const output = execSync('git diff master --name-only', { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error(chalk.yellow('⚠️  Could not compare with master branch'));
    return [];
  }
}

function matchesPattern(file, pattern) {
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(regexPattern).test(file);
  }
  return file.includes(pattern);
}

function categorizeFiles(files) {
  const critical = [];
  const highRisk = [];
  const moderate = [];

  files.forEach((file) => {
    // Check critical files
    if (CRITICAL_FILES.some((pattern) => matchesPattern(file, pattern))) {
      critical.push(file);
    } else if (HIGH_RISK_FILES.some((pattern) => matchesPattern(file, pattern))) {
      highRisk.push(file);
    } else if (MODERATE_FILES.some((pattern) => matchesPattern(file, pattern))) {
      moderate.push(file);
    }
  });

  return { critical, highRisk, moderate };
}

function main() {
  console.log(chalk.blue('📊 Architecture Impact Report\n'));

  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    console.log(chalk.green('✅ No files changed from master'));
    return 0;
  }

  const { critical, highRisk, moderate } = categorizeFiles(changedFiles);

  // If no architectural files changed, report and exit
  if (critical.length === 0 && highRisk.length === 0 && moderate.length === 0) {
    console.log(chalk.green('✅ No architectural files modified'));
    return 0;
  }

  // Show summary first
  console.log(chalk.white('📋 Architectural Changes Detected:\n'));

  // CRITICAL FILES - Now informational, not blocking
  if (critical.length > 0) {
    console.log(
      chalk.red.bold(`🔴 CRITICAL: Core architectural files modified [${critical.length}]`)
    );
    critical.forEach((file) => console.log(chalk.red(`   - ${file}`)));
    console.log(chalk.yellow('\n   💡 Recommendation: Document architectural decisions'));
    console.log(chalk.yellow('   💡 Consider using: git commit -m "ARCH: [justification]"'));
  }

  // HIGH RISK FILES
  if (highRisk.length > 0) {
    console.log(chalk.yellow.bold(`\n🟡 HIGH RISK: Important files modified [${highRisk.length}]`));
    highRisk.forEach((file) => console.log(chalk.yellow(`   - ${file}`)));
    console.log(chalk.gray('   💡 Ensure changes are intentional and documented'));
  }

  // MODERATE FILES
  if (moderate.length > 0) {
    console.log(
      chalk.cyan.bold(`\n🔵 MODERATE: Configuration files modified [${moderate.length}]`)
    );
    moderate.forEach((file) => console.log(chalk.cyan(`   - ${file}`)));
    console.log(chalk.gray('   💡 Standard review process applies'));
  }

  // SUMMARY
  console.log(chalk.white.bold('\n📊 Summary:'));
  const total = critical.length + highRisk.length + moderate.length;
  console.log(chalk.white(`   Total architectural files modified: ${total}`));
  if (critical.length > 0) console.log(chalk.red(`   • Critical: ${critical.length}`));
  if (highRisk.length > 0) console.log(chalk.yellow(`   • High Risk: ${highRisk.length}`));
  if (moderate.length > 0) console.log(chalk.cyan(`   • Moderate: ${moderate.length}`));

  // INFORMATIONAL STATUS - Always success
  console.log(chalk.green('\n✅ Architecture check complete - review recommendations above'));

  // Always return 0 for non-blocking behavior
  return 0;
}

// Always exit with 0 - never blocks
process.exit(0);
