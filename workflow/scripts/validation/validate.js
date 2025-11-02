#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Unified Validation Script
 * Consolidates all validation logic into a single, maintainable script
 *
 * Usage:
 *   node validate.js --mode=pre         Pre-implementation checks
 *   node validate.js --mode=task        Post-task validation
 *   node validate.js --mode=integration Feature integration validation
 *   node validate.js --mode=issue       Issue-specific validation
 *   node validate.js --mode=all         Run all validations
 */

// Parse arguments
const args = process.argv.slice(2);
const modeArg = args.find((arg) => arg.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'task';
const featureName = args.find((arg) => !arg.startsWith('--')) || '';

// Validation results tracking
let errors = [];
let warnings = [];
let successes = [];

// Color codes for terminal output
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const NC = '\x1b[0m'; // No Color

// Helper function to run command safely
function runCommand(command, description, isCritical = true) {
  try {
    execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    successes.push(description);
    return true;
  } catch (error) {
    if (isCritical) {
      errors.push(description);
    } else {
      warnings.push(description);
    }
    return false;
  }
}

// Helper function to check for patterns in files
function checkPattern(pattern, directory, description, isError = true) {
  try {
    const result = execSync(
      `grep -r "${pattern}" ${directory} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -5`,
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();

    if (result) {
      const files = result.split('\n').map((line) => line.split(':')[0]);
      const uniqueFiles = [...new Set(files)];

      if (isError) {
        errors.push(`${description} found in: ${uniqueFiles.join(', ')}`);
      } else {
        warnings.push(`${description} found in: ${uniqueFiles.join(', ')}`);
      }
      return true;
    }
  } catch (error) {
    // No matches found is good for these checks
  }
  return false;
}

// Core validation functions
const validations = {
  // Build and compilation checks
  buildCheck() {
    console.log('📦 Checking build...');
    return runCommand('npm run build', 'Build validation');
  },

  // TypeScript validation
  typeScriptCheck() {
    console.log('🔍 Checking TypeScript...');
    return runCommand('npx tsc --noEmit', 'TypeScript validation');
  },

  // Linting check
  lintCheck() {
    console.log('✨ Checking lint...');
    return runCommand('npm run lint', 'Linting', false);
  },

  // Security checks
  securityCheck() {
    console.log('🔐 Running security checks...');

    // Check for console.logs
    checkPattern('console\\.(log|error|warn)', 'src', 'Console statements', false);

    // Check for exposed credentials
    checkPattern(
      '(api_key|apiKey|API_KEY|secret|SECRET|password|PASSWORD)\\s*=\\s*["\']',
      'src',
      'Potential exposed credentials'
    );

    // Check for any types
    checkPattern(':\\s*any\\b|as\\s+any\\b', 'src', 'Unsafe any types', false);

    // Check for TODO/FIXME
    checkPattern('TODO|FIXME|HACK', 'src', 'Unresolved TODOs', false);
  },

  // Database and Prisma checks
  databaseCheck() {
    console.log('🗄️ Checking database integrity...');

    // Check Prisma client is generated
    if (!fs.existsSync(path.join(process.cwd(), 'node_modules', '@prisma', 'client'))) {
      errors.push('Prisma client not generated');
      return false;
    }

    // Check for N+1 query patterns
    checkPattern('findMany.*include.*include', 'src/server', 'Potential N+1 query patterns', false);

    // Check for missing pagination
    try {
      const findManyFiles = execSync('grep -r "findMany" src/server --include="*.ts" 2>/dev/null', {
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim();

      if (findManyFiles) {
        const lines = findManyFiles.split('\n');
        const unpaginated = lines.filter(
          (line) => !line.includes('take:') && !line.includes('limit')
        );
        if (unpaginated.length > 0) {
          warnings.push(`${unpaginated.length} potentially unpaginated queries found`);
        }
      }
    } catch (error) {
      // No findMany calls is fine
    }

    return true;
  },

  // Architecture and dependencies check
  architectureCheck() {
    console.log('🏗️ Checking architecture...');

    // Run comprehensive architecture check script
    const architectureCheckPassed = runCommand(
      'npm run architecture:check',
      'Architecture compliance check',
      true
    );

    // Additional pattern checks
    checkPattern('@/features/[^/]+/.*@/features/[^/]+/', 'src', 'Cross-feature imports detected');

    // Check for Prisma imports in client code
    checkPattern(
      'from.*@/lib/prisma|from.*prisma/client',
      'src/app',
      'Prisma imports in client code'
    );
    checkPattern(
      'from.*@/lib/prisma|from.*prisma/client',
      'src/components',
      'Prisma imports in components'
    );
    checkPattern(
      'from.*@/lib/prisma|from.*prisma/client',
      'src/features/**/components',
      'Prisma imports in feature components'
    );

    return architectureCheckPassed;
  },

  // Integration validation (for features)
  integrationCheck() {
    console.log('🔗 Checking feature integration...');

    if (featureName) {
      console.log(`  Feature: ${featureName}`);
    }

    // Check tRPC router registration
    const rootRouterPath = path.join(process.cwd(), 'src/server/api/root.ts');
    if (fs.existsSync(rootRouterPath)) {
      const rootRouter = fs.readFileSync(rootRouterPath, 'utf8');
      if (featureName && !rootRouter.includes(featureName)) {
        warnings.push(`Feature "${featureName}" might not be registered in root router`);
      }
    }

    // Check for proper error handling
    checkPattern('try\\s*{[^}]+}\\s*catch\\s*\\(\\s*\\)\\s*{', 'src', 'Empty catch blocks', false);

    return true;
  },

  // Issue-specific validation
  issueCheck() {
    console.log('🐛 Checking issue resolution...');

    if (featureName) {
      console.log(`  Issue: ${featureName}`);
    }

    // Check for regression patterns
    checkPattern('\\.only\\(', 'e2e', 'Test .only() calls left in code');
    checkPattern('\\.skip\\(', 'e2e', 'Test .skip() calls found', false);

    // Check for proper error boundaries
    const errorBoundaryCount = execSync(
      'grep -r "ErrorBoundary" src --include="*.tsx" 2>/dev/null | wc -l',
      { encoding: 'utf8', stdio: 'pipe' }
    ).trim();

    if (parseInt(errorBoundaryCount) < 2) {
      warnings.push('Limited error boundary coverage');
    }

    return true;
  },
};

// Mode-specific validation sets
const validationSets = {
  pre: ['typeScriptCheck', 'lintCheck', 'securityCheck', 'architectureCheck'],
  task: ['buildCheck', 'typeScriptCheck', 'lintCheck', 'securityCheck', 'architectureCheck'],
  integration: [
    'buildCheck',
    'typeScriptCheck',
    'databaseCheck',
    'architectureCheck',
    'integrationCheck',
  ],
  issue: ['buildCheck', 'typeScriptCheck', 'securityCheck', 'architectureCheck', 'issueCheck'],
  all: [
    'buildCheck',
    'typeScriptCheck',
    'lintCheck',
    'securityCheck',
    'databaseCheck',
    'architectureCheck',
    'integrationCheck',
    'issueCheck',
  ],
};

// Main execution
async function main() {
  console.log('🚀 Running validation checks...');
  console.log(`Mode: ${mode}${featureName ? ` | Context: ${featureName}` : ''}`);
  console.log('='.repeat(50));

  const validationList = validationSets[mode] || validationSets.task;

  for (const validation of validationList) {
    if (validations[validation]) {
      console.log('');
      validations[validation]();
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(50));

  if (successes.length > 0) {
    console.log(`\n${GREEN}✅ Passed:${NC}`);
    successes.forEach((s) => console.log(`  • ${s}`));
  }

  if (warnings.length > 0) {
    console.log(`\n${YELLOW}⚠️  Warnings:${NC}`);
    warnings.forEach((w) => console.log(`  • ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n${RED}❌ Errors:${NC}`);
    errors.forEach((e) => console.log(`  • ${e}`));
  }

  console.log('\n' + '='.repeat(50));

  // Exit with appropriate code
  if (errors.length > 0) {
    console.log(`${RED}❌ Validation failed with ${errors.length} error(s)${NC}`);
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(`${YELLOW}⚠️  Validation passed with ${warnings.length} warning(s)${NC}`);
    process.exit(0);
  } else {
    console.log(`${GREEN}✅ All validations passed!${NC}`);
    process.exit(0);
  }
}

// Run main
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
