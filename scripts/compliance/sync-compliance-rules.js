#!/usr/bin/env node
/**
 * CLAUDE.md Compliance Rules Synchronization System
 *
 * PURPOSE: Automatically sync compliance validators with CLAUDE.md changes
 * USAGE: Called by pre-commit hook when CLAUDE.md is modified
 *
 * This ensures the compliance system always matches CLAUDE.md rules.
 *
 * WORKFLOW:
 * 1. Parse CLAUDE.md to extract enforceable rules
 * 2. Generate validator configuration
 * 3. Update compliance-validator.js patterns
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
    const ruleDefinedInClaudeMd =
      /TIMEZONE-GUIDELINES\.md/i.test(this.content) ||
      /nowUTC\(\)|parseUTC\(\)/i.test(this.content);

    return {
      enabled: ruleDefinedInClaudeMd, // Always enabled if CLAUDE.md defines it
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
      allowedFiles: ['timezone.ts', 'env/server.ts'], // Removed test file exclusions
      reference: '/docs/compliance/TIMEZONE-GUIDELINES.md',
      severity: 'ERROR',
    };
  }

  extractTypeSafetyRules() {
    const section = this.extractSection('Type Safety Rules');

    // STRICT ENFORCEMENT: Always enabled if CLAUDE.md references type safety
    const ruleDefinedInClaudeMd =
      /TYPE-SAFETY\.md/i.test(this.content) || /NEVER.*as any/i.test(this.content);

    return {
      enabled: ruleDefinedInClaudeMd, // Always enabled if defined
      forbidden: [
        { pattern: 'as any', message: 'Use proper type guards or type narrowing' },
        { pattern: '@ts-ignore', message: '@ts-ignore must be documented', requiresComment: true },
      ],
      allowedFiles: ['src/lib/auth.ts', 'src/server/trpc.ts', 'src/types/guards.ts'],
      reference: '/docs/compliance/TYPE-SAFETY.md',
      severity: 'ERROR',
    };
  }

  extractLoggingRules() {
    const section = this.extractSection('SECTION 8.5: LOGGING SYSTEM');

    // STRICT ENFORCEMENT: Always enabled if CLAUDE.md references logging
    const ruleDefinedInClaudeMd =
      /LOGGING\.md/i.test(this.content) || /NEVER use console/i.test(this.content);

    return {
      enabled: ruleDefinedInClaudeMd, // Always enabled if defined
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
      reference: '/docs/compliance/LOGGING.md',
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
          message: 'tRPC procedures should have .input() Zod commit_gate',
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
          patterns: ['process.env.API_KEY', 'password =', 'secret =', 'token ='],
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
   * Returns commit_gate results with warnings/errors
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

    // Expected /docs/compliance/ files
    const expectedDocs = [
      'compliance/CONTEXT-LOADING.md',
      'compliance/TYPE-SAFETY.md',
      'compliance/VERIFICATION-PROTOCOLS.md',
      'compliance/TIMEZONE-GUIDELINES.md',
      'compliance/LOGGING.md',
      'compliance/BUG-DETECTION.md',
      'compliance/DEVELOPMENT-WORKFLOW.md',
      'compliance/COMPLIANCE-SYSTEM.md',
      'compliance/SECURITY-CHECKLIST.md',
      'compliance/CLAUDE-MD-AUTO-SYNC.md',
      'core/CLAUDE-AGENT-CONTEXT.md',
      'core/DATABASE-OPERATIONS.md',
      'core/TODO-TRACKING.md',
    ];

    // Extract all /docs/ references from CLAUDE.md (including subdirectories)
    const docRefPattern = /\/docs\/((?:compliance|guides|core|deployment)\/[A-Z-]+\.md)/g;
    const matches = this.content.matchAll(docRefPattern);

    for (const match of matches) {
      const docFile = match[1]; // Now includes subdirectory (e.g., 'compliance/FILE.md')
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
      // Check subdirectories: compliance/ and guides/
      const subdirs = ['compliance', 'guides'];
      const actualDocs = [];

      for (const subdir of subdirs) {
        const subdirPath = path.join(docsDir, subdir);
        if (fs.existsSync(subdirPath)) {
          const files = fs.readdirSync(subdirPath).filter((f) => f.endsWith('.md'));
          files.forEach((f) => actualDocs.push(`${subdir}/${f}`));
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
   * Generate configuration for compliance-validator.js
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
            forbidden: this.rules.timezone.forbidden.map((f) => f.pattern),
            allowed: this.rules.timezone.utilities,
          },
          allowedFiles: this.rules.timezone.allowedFiles,
          severity: this.rules.timezone.severity,
          reference: this.rules.timezone.reference,
        },
        typeSafety: {
          enabled: this.rules.typeSafety.enabled,
          patterns: {
            forbidden: this.rules.typeSafety.forbidden.map((f) => f.pattern),
          },
          allowedFiles: this.rules.typeSafety.allowedFiles,
          severity: this.rules.typeSafety.severity,
          reference: this.rules.typeSafety.reference,
        },
        logging: {
          enabled: this.rules.logging.enabled,
          patterns: {
            forbidden: this.rules.logging.forbidden.map((f) => f.pattern),
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

class ComplianceSyncManager {
  constructor(claudeMdPath) {
    this.claudeMdPath = claudeMdPath;
    this.configPath = path.join(__dirname, 'compliance-config.json');
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
   * Sync compliance system with CLAUDE.md
   */
  sync() {
    console.log('🔄 Syncing compliance rules with CLAUDE.md...');

    // Validate /docs/ alignment first
    console.log('📋 Validating CLAUDE.md ↔ /docs/ alignment...');
    const commit_gate = this.parser.validateDocsAlignment();

    // Report commit_gate results
    if (commit_gate.errors.length > 0) {
      console.log('\n❌ Documentation Alignment Errors:');
      commit_gate.errors.forEach((err) => {
        console.log(`   ${err.type}: ${err.message}`);
      });
      throw new Error('Documentation alignment errors must be fixed before syncing');
    }

    if (commit_gate.warnings.length > 0) {
      console.log('\n⚠️  Documentation Alignment Warnings:');
      commit_gate.warnings.forEach((warn) => {
        console.log(`   ${warn.type}: ${warn.message}`);
        if (warn.suggestion) {
          console.log(`   💡 ${warn.suggestion}`);
        }
      });
    }

    console.log(`\n✅ Referenced docs: ${commit_gate.referencedDocs.length} files`);
    if (commit_gate.orphanedDocs.length > 0) {
      console.log(`⚠️  Orphaned docs: ${commit_gate.orphanedDocs.join(', ')}`);
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
        referencedDocs: commit_gate.referencedDocs,
        orphanedDocs: commit_gate.orphanedDocs,
        lastValidated: new Date().toISOString(),
      },
    };

    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));

    console.log('\n✅ Compliance rules synced successfully');
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
  const syncManager = new ComplianceSyncManager(claudeMdPath);

  switch (command) {
    case 'check':
      if (syncManager.hasChanged()) {
        console.log('⚠️  CLAUDE.md has changed - compliance rules need updating');
        console.log('   Run: node scripts/compliance/sync-compliance-rules.js sync');
        process.exit(1);
      } else {
        console.log('✅ Compliance rules are up to date');
        process.exit(0);
      }

    case 'sync':
      syncManager.sync();
      break;

    case 'status':
      const config = syncManager.getConfig();
      console.log('Compliance System Status:');
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
      const commit_gate = syncManager.parser.validateDocsAlignment();

      if (commit_gate.errors.length > 0) {
        console.log('❌ Errors:');
        commit_gate.errors.forEach((err) => {
          console.log(`   • ${err.message}`);
        });
        console.log('');
      }

      if (commit_gate.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        commit_gate.warnings.forEach((warn) => {
          console.log(`   • ${warn.message}`);
          if (warn.suggestion) {
            console.log(`     💡 ${warn.suggestion}`);
          }
        });
        console.log('');
      }

      console.log('📊 Summary:');
      console.log(`   Referenced docs: ${commit_gate.referencedDocs.length}`);
      console.log(`   Orphaned docs: ${commit_gate.orphanedDocs.length}`);
      console.log(`   Missing references: ${commit_gate.missingDocs.length}`);

      if (commit_gate.referencedDocs.length > 0) {
        console.log('\n✅ Referenced documentation files:');
        commit_gate.referencedDocs.forEach((doc) => {
          console.log(`   • /docs/${doc}`);
        });
      }

      if (commit_gate.orphanedDocs.length > 0) {
        console.log('\n⚠️  Orphaned documentation files:');
        commit_gate.orphanedDocs.forEach((doc) => {
          console.log(`   • /docs/${doc}`);
        });
      }

      if (commit_gate.valid) {
        console.log('\n✅ Documentation alignment is valid');
        process.exit(0);
      } else {
        console.log('\n❌ Documentation alignment has errors');
        process.exit(1);
      }

    default:
      console.log('Usage:');
      console.log('  node sync-compliance-rules.js check         # Check if sync needed');
      console.log('  node sync-compliance-rules.js sync          # Sync rules from CLAUDE.md');
      console.log('  node sync-compliance-rules.js status        # Show sync status');
      console.log(
        '  node sync-compliance-rules.js validate-docs # Validate CLAUDE.md ↔ /docs/ alignment'
      );
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { ClaudeMdParser, ValidatorConfigGenerator, ComplianceSyncManager };
