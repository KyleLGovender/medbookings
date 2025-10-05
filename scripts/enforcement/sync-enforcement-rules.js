#!/usr/bin/env node
/**
 * CLAUDE.md Enforcement Rules Synchronization System
 *
 * PURPOSE: Automatically sync enforcement validators with CLAUDE.md changes
 * USAGE: Called by pre-commit hook when CLAUDE.md is modified
 *
 * This ensures the enforcement system always matches CLAUDE.md rules.
 *
 * WORKFLOW:
 * 1. Parse CLAUDE.md to extract enforceable rules
 * 2. Generate validator configuration
 * 3. Update claude-code-validator.js patterns
 * 4. Update ESLint rule patterns
 * 5. Update documentation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// SECTION 1: CLAUDE.md PARSER
// ============================================================================

class ClaudeMdParser {
  constructor(filePath) {
    this.content = fs.readFileSync(filePath, 'utf-8');
    this.rules = {};
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto.createHash('sha256').update(this.content).digest('hex');
  }

  /**
   * Extract all enforceable rules from CLAUDE.md
   */
  parse() {
    this.rules = {
      timezone: this.extractTimezoneRules(),
      typeSafety: this.extractTypeSafetyRules(),
      logging: this.extractLoggingRules(),
      architecture: this.extractArchitectureRules(),
      business: this.extractBusinessRules(),
      security: this.extractSecurityRules(),
      performance: this.extractPerformanceRules(),
    };

    return this.rules;
  }

  extractTimezoneRules() {
    const section = this.extractSection('SECTION 7: HEALTHCARE COMPLIANCE', 'Timezone Handling');

    // STRICT ENFORCEMENT: Always enabled if CLAUDE.md references timezone guidelines
    // No auto-disable - violations must be fixed to use in production
    const ruleDefinedInClaudeMd = /TIMEZONE-GUIDELINES\.md/i.test(this.content) ||
                                   /nowUTC\(\)|parseUTC\(\)/i.test(this.content);

    return {
      enabled: ruleDefinedInClaudeMd,  // Always enabled if CLAUDE.md defines it
      forbidden: [
        { pattern: 'new Date()', message: 'Use timezone utilities from @/lib/timezone' },
        { pattern: 'Date.now()', message: 'Use nowUTC() from @/lib/timezone' },
      ],
      utilities: [
        'nowUTC()',
        'nowSAST()',
        'parseUTC()',
        'startOfDaySAST()',
        'endOfDaySAST()',
        'formatSAST()',
      ],
      allowedFiles: ['timezone.ts', 'env/server.ts'],  // Removed test file exclusions
      reference: '/docs/enforcement/TIMEZONE-GUIDELINES.md',
      severity: 'ERROR',
    };
  }

  extractTypeSafetyRules() {
    const section = this.extractSection('Type Safety Rules');

    // STRICT ENFORCEMENT: Always enabled if CLAUDE.md references type safety
    const ruleDefinedInClaudeMd = /TYPE-SAFETY\.md/i.test(this.content) ||
                                   /NEVER.*as any/i.test(this.content);

    return {
      enabled: ruleDefinedInClaudeMd,  // Always enabled if defined
      forbidden: [
        { pattern: 'as any', message: 'Use proper type guards or type narrowing' },
        { pattern: '@ts-ignore', message: '@ts-ignore must be documented', requiresComment: true },
      ],
      allowedFiles: ['src/lib/auth.ts', 'src/server/trpc.ts', 'src/types/guards.ts'],
      reference: '/docs/enforcement/TYPE-SAFETY.md',
      severity: 'ERROR',
    };
  }

  extractLoggingRules() {
    const section = this.extractSection('SECTION 8.5: LOGGING SYSTEM');

    // STRICT ENFORCEMENT: Always enabled if CLAUDE.md references logging
    const ruleDefinedInClaudeMd = /LOGGING\.md/i.test(this.content) ||
                                   /NEVER use console/i.test(this.content);

    return {
      enabled: ruleDefinedInClaudeMd,  // Always enabled if defined
      forbidden: [
        { pattern: 'console.log', message: 'Use logger.info() from @/lib/logger' },
        { pattern: 'console.error', message: 'Use logger.error() from @/lib/logger' },
        { pattern: 'console.warn', message: 'Use logger.warn() from @/lib/logger' },
      ],
      phiSanitization: {
        email: 'sanitizeEmail',
        phone: 'sanitizePhone',
        name: 'sanitizeName',
        userId: 'sanitizeUserId',
        providerId: 'sanitizeProviderId',
      },
      allowedFiles: ['logger.ts', 'env/server.ts', 'audit.ts', 'debug.ts'],
      reference: '/docs/enforcement/LOGGING.md',
      severity: 'ERROR',
    };
  }

  extractArchitectureRules() {
    return {
      enabled: true,
      rules: [
        {
          name: 'HOOKS_EXPORT_TYPES',
          pattern: /export type.*in.*hooks/i,
          message: 'Hooks MUST NOT export types. Move types to api-types.ts',
          applies: '/hooks/',
          severity: 'ERROR',
        },
        {
          name: 'DB_QUERY_OUTSIDE_TRPC',
          pattern: /prisma\.(findMany|findUnique|create|update|delete)/,
          message: 'Database queries ONLY allowed in tRPC procedures',
          applies: '!/routers/',
          severity: 'ERROR',
        },
        {
          name: 'CROSS_FEATURE_IMPORT',
          pattern: /from ['"]@\/features\/(?!current)\w+/,
          message: 'Cross-feature imports are FORBIDDEN',
          applies: '/features/',
          severity: 'ERROR',
        },
        {
          name: 'MISSING_ZOD_VALIDATION',
          pattern: /\.(query|mutation)\(async/,
          message: 'tRPC procedures should have .input() Zod validation',
          applies: '/routers/',
          severity: 'WARNING',
        },
      ],
    };
  }

  extractBusinessRules() {
    return {
      enabled: true,
      rules: [
        {
          name: 'BOOKING_WITHOUT_TRANSACTION',
          pattern: /booking.*create|slot.*update/,
          requiresPattern: /\$transaction/,
          message: 'Booking operations should use transactions to prevent double-booking',
          applies: '/routers/',
          severity: 'WARNING',
        },
        {
          name: 'UNBOUNDED_QUERY',
          pattern: /\.findMany\(/,
          requiresPattern: /take:/,
          message: 'findMany() must have take: limit for pagination',
          applies: '/routers/',
          severity: 'ERROR',
        },
      ],
    };
  }

  extractSecurityRules() {
    return {
      enabled: true,
      rules: [
        {
          name: 'EXPOSED_CREDENTIALS',
          patterns: [
            'process.env.API_KEY',
            'password =',
            'secret =',
            'token =',
          ],
          severity: 'ERROR',
        },
        {
          name: 'PHI_IN_LOGS',
          requiresSanitization: true,
          severity: 'ERROR',
        },
      ],
    };
  }

  extractPerformanceRules() {
    return {
      enabled: true,
      rules: [
        {
          name: 'UNBOUNDED_QUERY',
          message: 'Queries must have pagination',
          severity: 'ERROR',
        },
      ],
    };
  }

  extractSection(sectionName, subsection = null) {
    const lines = this.content.split('\n');
    let inSection = false;
    let sectionContent = [];

    for (const line of lines) {
      if (line.includes(sectionName)) {
        inSection = true;
        continue;
      }

      if (inSection) {
        if (line.match(/^  [🔴📂🏗️📋✅🔍🏥🚨⚡🐛📁🔄🛠️🎯🚀]/)) {
          break; // Next section
        }
        sectionContent.push(line);
      }
    }

    return sectionContent.join('\n');
  }

  /**
   * Validate CLAUDE.md ↔ /docs/ alignment
   * Returns validation results with warnings/errors
   */
  validateDocsAlignment() {
    const results = {
      valid: true,
      warnings: [],
      errors: [],
      referencedDocs: [],
      orphanedDocs: [],
      missingDocs: [],
    };

    // Expected /docs/enforcement/ files
    const expectedDocs = [
      'enforcement/CONTEXT-LOADING.md',
      'enforcement/TYPE-SAFETY.md',
      'enforcement/VERIFICATION-PROTOCOLS.md',
      'enforcement/TIMEZONE-GUIDELINES.md',
      'enforcement/LOGGING.md',
      'enforcement/BUG-DETECTION.md',
      'enforcement/DEVELOPMENT-WORKFLOW.md',
      'enforcement/ENFORCEMENT.md',
      'enforcement/DEPLOYMENT.md',
      'enforcement/CLAUDE-MD-AUTO-SYNC.md',
    ];

    // Extract all /docs/ references from CLAUDE.md (including subdirectories)
    const docRefPattern = /\/docs\/((?:enforcement|guides)\/[A-Z-]+\.md)/g;
    const matches = this.content.matchAll(docRefPattern);

    for (const match of matches) {
      const docFile = match[1]; // Now includes subdirectory (e.g., 'enforcement/FILE.md')
      results.referencedDocs.push(docFile);

      // Check if referenced doc exists
      const docPath = path.join(__dirname, '..', '..', 'docs', docFile);
      if (!fs.existsSync(docPath)) {
        results.errors.push({
          type: 'MISSING_DOC',
          file: docFile,
          message: `CLAUDE.md references /docs/${docFile} but file does not exist`,
        });
        results.valid = false;
      }
    }

    // Check for orphaned docs (exist but not referenced)
    const docsDir = path.join(__dirname, '..', '..', 'docs');
    if (fs.existsSync(docsDir)) {
      // Check subdirectories: enforcement/ and guides/
      const subdirs = ['enforcement', 'guides'];
      const actualDocs = [];

      for (const subdir of subdirs) {
        const subdirPath = path.join(docsDir, subdir);
        if (fs.existsSync(subdirPath)) {
          const files = fs.readdirSync(subdirPath).filter(f => f.endsWith('.md'));
          files.forEach(f => actualDocs.push(`${subdir}/${f}`));
        }
      }

      for (const docFile of actualDocs) {
        if (!results.referencedDocs.includes(docFile)) {
          results.orphanedDocs.push(docFile);
          results.warnings.push({
            type: 'ORPHANED_DOC',
            file: docFile,
            message: `/docs/${docFile} exists but is not referenced in CLAUDE.md`,
            suggestion: `Consider adding a reference to this doc in the appropriate CLAUDE.md section`,
          });
        }
      }
    }

    // Check for expected docs that should be referenced
    for (const expectedDoc of expectedDocs) {
      if (!results.referencedDocs.includes(expectedDoc)) {
        results.missingDocs.push(expectedDoc);
        results.warnings.push({
          type: 'MISSING_REFERENCE',
          file: expectedDoc,
          message: `Expected doc /docs/${expectedDoc} is not referenced in CLAUDE.md`,
          suggestion: `Add a 📄 reference to this doc in the relevant section`,
        });
      }
    }

    // Validate reference format
    const refFormatPattern = /📄\s+\*\*([^*]+)\*\*:\s+See\s+`\/docs\/([A-Z-]+\.md)`/g;
    const formattedRefs = [...this.content.matchAll(refFormatPattern)];

    if (formattedRefs.length !== results.referencedDocs.length) {
      results.warnings.push({
        type: 'INCONSISTENT_FORMAT',
        message: `Some /docs/ references may not use the standard format: 📄 **Topic**: See \`/docs/FILE.md\``,
        suggestion: `Ensure all references follow the standard format for consistency`,
      });
    }

    return results;
  }
}

// ============================================================================
// SECTION 2: VALIDATOR CONFIGURATION GENERATOR
// ============================================================================

class ValidatorConfigGenerator {
  constructor(rules) {
    this.rules = rules;
  }

  /**
   * Generate configuration for claude-code-validator.js
   */
  generateValidatorConfig() {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      rules: {
        timezone: {
          enabled: this.rules.timezone.enabled,
          disabledReason: this.rules.timezone.disabledReason || null,
          violationCount: this.rules.timezone.violationCount || 0,
          patterns: {
            forbidden: this.rules.timezone.forbidden.map(f => f.pattern),
            allowed: this.rules.timezone.utilities,
          },
          allowedFiles: this.rules.timezone.allowedFiles,
          severity: this.rules.timezone.severity,
          reference: this.rules.timezone.reference,
        },
        typeSafety: {
          enabled: this.rules.typeSafety.enabled,
          patterns: {
            forbidden: this.rules.typeSafety.forbidden.map(f => f.pattern),
          },
          allowedFiles: this.rules.typeSafety.allowedFiles,
          severity: this.rules.typeSafety.severity,
          reference: this.rules.typeSafety.reference,
        },
        logging: {
          enabled: this.rules.logging.enabled,
          patterns: {
            forbidden: this.rules.logging.forbidden.map(f => f.pattern),
          },
          phiSanitization: this.rules.logging.phiSanitization,
          allowedFiles: this.rules.logging.allowedFiles,
          severity: this.rules.logging.severity,
          reference: this.rules.logging.reference,
        },
        architecture: this.rules.architecture.rules,
        business: this.rules.business.rules,
      },
    };
  }

  /**
   * Generate ESLint rule configuration
   */
  generateEslintConfig() {
    return {
      rules: {
        'rulesdir/no-new-date': this.rules.timezone.enabled ? 'error' : 'off',
      },
    };
  }
}

// ============================================================================
// SECTION 3: SYNC MANAGER
// ============================================================================

class EnforcementSyncManager {
  constructor(claudeMdPath) {
    this.claudeMdPath = claudeMdPath;
    this.configPath = path.join(__dirname, 'enforcement-config.json');
    this.parser = new ClaudeMdParser(claudeMdPath);
  }

  /**
   * Check if CLAUDE.md has changed since last sync
   */
  hasChanged() {
    if (!fs.existsSync(this.configPath)) {
      return true;
    }

    const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    return config.claudeMdHash !== this.parser.hash;
  }

  /**
   * Sync enforcement system with CLAUDE.md
   */
  sync() {
    console.log('🔄 Syncing enforcement rules with CLAUDE.md...');

    // Validate /docs/ alignment first
    console.log('📋 Validating CLAUDE.md ↔ /docs/ alignment...');
    const validation = this.parser.validateDocsAlignment();

    // Report validation results
    if (validation.errors.length > 0) {
      console.log('\n❌ Documentation Alignment Errors:');
      validation.errors.forEach(err => {
        console.log(`   ${err.type}: ${err.message}`);
      });
      throw new Error('Documentation alignment errors must be fixed before syncing');
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Documentation Alignment Warnings:');
      validation.warnings.forEach(warn => {
        console.log(`   ${warn.type}: ${warn.message}`);
        if (warn.suggestion) {
          console.log(`   💡 ${warn.suggestion}`);
        }
      });
    }

    console.log(`\n✅ Referenced docs: ${validation.referencedDocs.length} files`);
    if (validation.orphanedDocs.length > 0) {
      console.log(`⚠️  Orphaned docs: ${validation.orphanedDocs.join(', ')}`);
    }

    // Parse CLAUDE.md
    console.log('\n🔍 Parsing CLAUDE.md rules...');
    const rules = this.parser.parse();

    // Report disabled rules
    console.log('\n📋 Rule Status:');
    const ruleStatus = [
      { name: 'Timezone', config: rules.timezone, key: 'timezone' },
      { name: 'Type Safety', config: rules.typeSafety, key: 'typeSafety' },
      { name: 'Logging', config: rules.logging, key: 'logging' },
    ];

    ruleStatus.forEach(({ name, config }) => {
      if (config.enabled) {
        console.log(`   ✅ ${name}: ENABLED`);
      } else {
        console.log(`   ⚠️  ${name}: DISABLED`);
        if (config.disabledReason) {
          console.log(`      Reason: ${config.disabledReason}`);
        }
      }
    });

    // Generate configurations
    const generator = new ValidatorConfigGenerator(rules);
    const validatorConfig = generator.generateValidatorConfig();
    const eslintConfig = generator.generateEslintConfig();

    // Save configuration
    const config = {
      claudeMdHash: this.parser.hash,
      lastSync: new Date().toISOString(),
      validatorConfig,
      eslintConfig,
      docsAlignment: {
        referencedDocs: validation.referencedDocs,
        orphanedDocs: validation.orphanedDocs,
        lastValidated: new Date().toISOString(),
      },
    };

    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));

    console.log('\n✅ Enforcement rules synced successfully');
    console.log(`   Hash: ${this.parser.hash.substring(0, 8)}...`);
    console.log(`   Rules: ${Object.keys(rules).length} categories`);

    return config;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    if (!fs.existsSync(this.configPath)) {
      return this.sync();
    }

    return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
  }
}

// ============================================================================
// SECTION 4: CLI INTERFACE
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  const claudeMdPath = path.join(__dirname, '..', '..', 'CLAUDE.md');
  const syncManager = new EnforcementSyncManager(claudeMdPath);

  switch (command) {
    case 'check':
      if (syncManager.hasChanged()) {
        console.log('⚠️  CLAUDE.md has changed - enforcement rules need updating');
        console.log('   Run: node scripts/enforcement/sync-enforcement-rules.js sync');
        process.exit(1);
      } else {
        console.log('✅ Enforcement rules are up to date');
        process.exit(0);
      }
      break;

    case 'sync':
      syncManager.sync();
      break;

    case 'status':
      const config = syncManager.getConfig();
      console.log('Enforcement System Status:');
      console.log(`  Last sync: ${config.lastSync}`);
      console.log(`  CLAUDE.md hash: ${config.claudeMdHash.substring(0, 16)}...`);
      console.log(`  Changed: ${syncManager.hasChanged() ? 'YES ⚠️' : 'NO ✅'}`);
      if (config.docsAlignment) {
        console.log(`\nDocumentation Alignment:`);
        console.log(`  Referenced docs: ${config.docsAlignment.referencedDocs.length}`);
        console.log(`  Orphaned docs: ${config.docsAlignment.orphanedDocs.length}`);
        console.log(`  Last validated: ${config.docsAlignment.lastValidated}`);
      }
      break;

    case 'validate-docs':
      console.log('📋 Validating CLAUDE.md ↔ /docs/ alignment...\n');
      const validation = syncManager.parser.validateDocsAlignment();

      if (validation.errors.length > 0) {
        console.log('❌ Errors:');
        validation.errors.forEach(err => {
          console.log(`   • ${err.message}`);
        });
        console.log('');
      }

      if (validation.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        validation.warnings.forEach(warn => {
          console.log(`   • ${warn.message}`);
          if (warn.suggestion) {
            console.log(`     💡 ${warn.suggestion}`);
          }
        });
        console.log('');
      }

      console.log('📊 Summary:');
      console.log(`   Referenced docs: ${validation.referencedDocs.length}`);
      console.log(`   Orphaned docs: ${validation.orphanedDocs.length}`);
      console.log(`   Missing references: ${validation.missingDocs.length}`);

      if (validation.referencedDocs.length > 0) {
        console.log('\n✅ Referenced documentation files:');
        validation.referencedDocs.forEach(doc => {
          console.log(`   • /docs/${doc}`);
        });
      }

      if (validation.orphanedDocs.length > 0) {
        console.log('\n⚠️  Orphaned documentation files:');
        validation.orphanedDocs.forEach(doc => {
          console.log(`   • /docs/${doc}`);
        });
      }

      if (validation.valid) {
        console.log('\n✅ Documentation alignment is valid');
        process.exit(0);
      } else {
        console.log('\n❌ Documentation alignment has errors');
        process.exit(1);
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node sync-enforcement-rules.js check         # Check if sync needed');
      console.log('  node sync-enforcement-rules.js sync          # Sync rules from CLAUDE.md');
      console.log('  node sync-enforcement-rules.js status        # Show sync status');
      console.log('  node sync-enforcement-rules.js validate-docs # Validate CLAUDE.md ↔ /docs/ alignment');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { ClaudeMdParser, ValidatorConfigGenerator, EnforcementSyncManager };
