#!/usr/bin/env node

/**
 * CLAUDE.md Compliance Validator (Enhanced)
 *
 * PURPOSE: Validate code changes BEFORE Claude Code writes them to disk
 * USAGE: Called by validation hooks or manually before tool execution
 *
 * ENHANCEMENTS:
 * - Confidence levels for PHI warnings (HIGH/MEDIUM/LOW)
 * - Risk assessment for transaction warnings (CRITICAL/HIGH/MEDIUM/LOW)
 * - Suppression comment support (// phi-safe:, // tx-safe:)
 * - Context-aware detection
 * - Better guidance with actionable recommendations
 *
 * This ensures Claude Code agent adheres to CLAUDE.md during code generation
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SECTION 1: CLAUDE.md RULES ENGINE
// ============================================================================

class ClaudeRulesEngine {
  constructor(claudeMdPath) {
    this.rules = this.parseClaudeMd(claudeMdPath);
  }

  parseClaudeMd(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    return {
      // Section 1: Fundamental Principles
      fundamentalPrinciples: {
        preferEditing: this.extractRule(content, 'PREFER EDITING'),
        noAssumptions: this.extractRule(content, 'NO ASSUMPTIONS'),
        confidenceRule: this.extractRule(content, '95% CONFIDENCE RULE'),
        verifyEverything: this.extractRule(content, 'VERIFY EVERYTHING'),
      },

      // Section 3: Architecture Patterns
      architecturePatterns: {
        noHookTypeExports: /hooks.*MUST NOT export types/i.test(content),
        dbQueriesOnlyInTrpc: /Database queries ONLY in tRPC/i.test(content),
        noCrossFeatureImports: /Cross-feature imports.*FORBIDDEN/i.test(content),
        singleQueryPerEndpoint: /Single database query per endpoint/i.test(content),
      },

      // Section 7: Timezone Compliance
      timezoneRules: {
        noNewDate: /NEVER.*new Date\(\)/i.test(content),
        alwaysUseUtilities: /ALWAYS use timezone utilities/i.test(content),
        utcStorage: /Database.*ALL dates.*UTC/i.test(content),
      },

      // Section 8.5: Logging & PHI
      loggingRules: {
        neverConsole: /NEVER use console/i.test(content),
        alwaysSanitizePHI: /PHI.*sanitized.*logging/i.test(content),
        useLogger: /use logger system/i.test(content),
      },

      // Section 3: Type Safety
      typeSafetyRules: {
        noAsAny: /NEVER.*as any/i.test(content),
        strictMode: /strict.*true/i.test(content),
        zodValidation: /Zod validation REQUIRED/i.test(content),
      },
    };
  }

  extractRule(content, keyword) {
    const regex = new RegExp(`[-•]\\s*${keyword}:?(.+?)(?=\\n[-•]|\\n\\n|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }
}

// ============================================================================
// SECTION 2: ENHANCED VALIDATORS
// ============================================================================

/**
 * Enhanced PHI Validator with confidence levels
 */
class EnhancedPHIValidator {
  validatePHISanitization(addedLines, filePath, fullContent) {
    const violations = [];
    const lines = fullContent.split('\n');

    addedLines.forEach((line, idx) => {
      // Find actual line number in full content
      const actualLineIdx = lines.indexOf(line);

      // Skip if line has suppression comment
      if (this.hasSuppression(line, lines, actualLineIdx)) {
        return;
      }

      // Check for logger calls
      if (/logger\.(info|error|warn|audit|debug)/.test(line)) {
        const phiDetection = this.detectPHI(line, lines, actualLineIdx);

        if (phiDetection.found && !phiDetection.isSanitized) {
          violations.push({
            severity: 'WARNING',
            rule: 'POTENTIAL_PHI_LEAK',
            file: filePath,
            line: actualLineIdx >= 0 ? actualLineIdx + 1 : idx + 1,
            content: line.trim(),
            confidence: phiDetection.confidence,
            phiFields: phiDetection.fields,
            message: this.buildMessage(phiDetection),
            fix: this.buildFix(phiDetection),
            suppressionGuidance: this.buildSuppressionGuidance(phiDetection),
            reference: '/docs/enforcement/LOGGING.md',
          });
        }
      }
    });

    return violations;
  }

  hasSuppression(line, allLines, currentIdx) {
    if (currentIdx < 0) return false;

    // Check current line
    if (/\/\/\s*phi-safe(-ignore)?:/.test(line)) {
      return true;
    }

    // Check previous line (inline comment)
    if (currentIdx > 0) {
      const prevLine = allLines[currentIdx - 1];
      if (/\/\/\s*phi-safe(-ignore)?:/.test(prevLine)) {
        return true;
      }
    }

    return false;
  }

  detectPHI(line, allLines, currentIdx) {
    const result = {
      found: false,
      isSanitized: false,
      confidence: 'LOW',
      fields: [],
      context: {},
    };

    const phiPatterns = [
      // HIGH confidence - direct PHI access
      {
        pattern: /\.email(?!Verified)/,
        field: 'email',
        sanitizer: 'sanitizeEmail',
        confidence: 'HIGH',
        phiType: 'Email Address',
      },
      {
        pattern: /\.phone|\.mobile|\.contactPhone|\.whatsapp|guestPhone/,
        field: 'phone',
        sanitizer: 'sanitizePhone',
        confidence: 'HIGH',
        phiType: 'Phone Number',
      },
      {
        pattern: /\.name|guestName|patientName|clientName|user\.name/,
        field: 'name',
        sanitizer: 'sanitizeName',
        confidence: 'HIGH',
        phiType: 'Name',
      },
      {
        pattern: /\.notes|appointmentNotes|medicalHistory|booking\.notes/,
        field: 'notes',
        sanitizer: 'DO_NOT_LOG',
        confidence: 'HIGH',
        phiType: 'Medical Notes (DO NOT LOG)',
      },

      // MEDIUM confidence - possible PHI
      {
        pattern: /user\[['"]email['"]\]/,
        field: 'email',
        sanitizer: 'sanitizeEmail',
        confidence: 'MEDIUM',
        phiType: 'Email Address',
      },

      // LOW confidence - ambiguous
      {
        pattern: /\bemail\b/i,
        field: 'email',
        sanitizer: 'sanitizeEmail',
        confidence: 'LOW',
        phiType: 'Possible Email',
      },
    ];

    for (const pattern of phiPatterns) {
      if (pattern.pattern.test(line)) {
        result.found = true;
        result.confidence = pattern.confidence;
        result.fields.push({
          field: pattern.field,
          sanitizer: pattern.sanitizer,
          phiType: pattern.phiType,
        });

        // Check if sanitizer is used
        if (line.includes(pattern.sanitizer)) {
          result.isSanitized = true;
        }

        // Extract variable context
        const varMatch = line.match(/(\w+)\.email|(\w+)\.name|(\w+)\.phone|\{.*?(\w+).*?\}/);
        if (varMatch) {
          result.context.variable = varMatch[1] || varMatch[2] || varMatch[3] || varMatch[4];
        }

        break;
      }
    }

    return result;
  }

  buildMessage(detection) {
    const field = detection.fields[0];
    const conf = detection.confidence;

    let message = `[${conf} CONFIDENCE] Potential unsanitized PHI: ${field.phiType}`;

    if (conf === 'LOW') {
      message += ' (Review: May be false positive)';
    } else if (field.sanitizer === 'DO_NOT_LOG') {
      message += ' - NEVER log this field';
    }

    return message;
  }

  buildFix(detection) {
    const field = detection.fields[0];
    const conf = detection.confidence;

    if (field.sanitizer === 'DO_NOT_LOG') {
      return '❌ REMOVE this field from logger - contains sensitive medical info';
    }

    if (conf === 'HIGH') {
      return `✅ RECOMMENDED: FIX\n` +
             `   import { ${field.sanitizer} } from '@/lib/logger';\n` +
             `   ${field.field}: ${field.sanitizer}(${detection.context.variable || 'value'}.${field.field})`;
    }

    if (conf === 'MEDIUM') {
      return `⚠️  RECOMMENDED: REVIEW & DECIDE\n` +
             `   If this IS PHI: Use ${field.sanitizer}()\n` +
             `   If this is NOT PHI: Add suppression comment`;
    }

    return `⚠️  RECOMMENDED: REVIEW\n` +
           `   1. If this IS PHI → Use ${field.sanitizer}()\n` +
           `   2. If this is NOT PHI → Add suppression comment\n` +
           `   3. If unsure → Ask in code review`;
  }

  buildSuppressionGuidance(detection) {
    const conf = detection.confidence;

    if (conf === 'HIGH') {
      return 'Suppress only if certain this is NOT PHI:\n' +
             '     // phi-safe: [explain why this is not PHI]\n' +
             '     logger.info(...)';
    }

    return 'To suppress:\n' +
           '     // phi-safe: [explain why this is not PHI]\n' +
           '     logger.info(...)\n' +
           '   Valid reasons: field already sanitized, system config, emailVerified (boolean)';
  }
}

/**
 * Enhanced Transaction Validator with risk assessment
 */
class EnhancedTransactionValidator {
  validateTransactionUsage(addedLines, filePath, fullContent) {
    const violations = [];
    const lines = fullContent.split('\n');

    // Only check tRPC router files
    if (!filePath.includes('/routers/')) {
      return violations;
    }

    addedLines.forEach((line, idx) => {
      // Find actual line number
      const actualLineIdx = lines.indexOf(line);

      // Skip suppression comments
      if (this.hasSuppression(line, lines, actualLineIdx)) {
        return;
      }

      // Detect booking operations
      const operationContext = this.analyzeOperation(lines, actualLineIdx, fullContent);

      if (operationContext.needsTransaction && !operationContext.hasTransaction) {
        violations.push({
          severity: 'WARNING',
          rule: 'MISSING_TRANSACTION',
          file: filePath,
          line: actualLineIdx >= 0 ? actualLineIdx + 1 : idx + 1,
          content: line.trim(),
          riskLevel: operationContext.riskLevel,
          operations: operationContext.operations,
          message: this.buildMessage(operationContext),
          fix: this.buildFix(operationContext),
          suppressionGuidance: this.buildSuppressionGuidance(operationContext),
          reference: 'CLAUDE.md Section 7 - Booking Integrity',
        });
      }
    });

    return violations;
  }

  hasSuppression(line, allLines, currentIdx) {
    if (currentIdx < 0) return false;

    if (/\/\/\s*tx-safe(-ignore)?:/.test(line)) {
      return true;
    }

    if (currentIdx > 0) {
      const prevLine = allLines[currentIdx - 1];
      if (/\/\/\s*tx-safe(-ignore)?:/.test(prevLine)) {
        return true;
      }
    }

    return false;
  }

  analyzeOperation(lines, currentIdx, fullContent) {
    const context = {
      needsTransaction: false,
      hasTransaction: false,
      riskLevel: 'LOW',
      operations: [],
      reason: '',
    };

    if (currentIdx < 0) return context;

    // Check if we're inside a transaction (look back up to 50 lines)
    const beforeContext = lines.slice(Math.max(0, currentIdx - 50), currentIdx).join('\n');
    if (/\$transaction\s*[\(\[]|transaction\s*\(async/.test(beforeContext)) {
      context.hasTransaction = true;
      return context;
    }

    // Get surrounding context
    const contextStart = Math.max(0, currentIdx - 20);
    const contextEnd = Math.min(lines.length, currentIdx + 20);
    const surroundingCode = lines.slice(contextStart, contextEnd).join('\n');

    // Detect operation patterns
    const operations = this.detectOperations(surroundingCode);
    context.operations = operations;

    context.needsTransaction = this.evaluateTransactionNeed(operations);
    context.riskLevel = this.assessRiskLevel(operations);
    context.reason = this.determineReason(operations);

    return context;
  }

  detectOperations(code) {
    const operations = [];

    if (/booking\.create|createBooking/.test(code)) {
      operations.push({ type: 'BOOKING_CREATE', critical: true });
    }

    if (/slot\.(update|findUnique).*status/.test(code)) {
      operations.push({ type: 'SLOT_UPDATE', critical: true });
    }

    const writeOps = code.match(/\.(create|update|delete|upsert)\(/g);
    if (writeOps && writeOps.length > 1) {
      operations.push({ type: 'MULTIPLE_WRITES', count: writeOps.length, critical: true });
    }

    if (/findUnique.*\n.*if.*\n.*create|update/.test(code)) {
      operations.push({ type: 'CHECK_THEN_ACT', critical: true });
    }

    if (/findMany|findUnique|findFirst/.test(code) && !/create|update|delete/.test(code)) {
      operations.push({ type: 'READ_ONLY', critical: false });
    }

    if (writeOps && writeOps.length === 1 && !/findUnique.*if/.test(code)) {
      operations.push({ type: 'SINGLE_WRITE', critical: false });
    }

    return operations;
  }

  evaluateTransactionNeed(operations) {
    const criticalOps = operations.filter(op => op.critical);
    if (criticalOps.length > 0) return true;

    if (operations.every(op => op.type === 'READ_ONLY')) return false;

    if (operations.length === 1 && operations[0].type === 'SINGLE_WRITE') return false;

    return false;
  }

  assessRiskLevel(operations) {
    if (operations.some(op => op.type === 'CHECK_THEN_ACT')) {
      return 'CRITICAL';
    }

    if (
      operations.some(op => op.type === 'BOOKING_CREATE') &&
      operations.some(op => op.type === 'SLOT_UPDATE')
    ) {
      return 'CRITICAL';
    }

    const multiWrite = operations.find(op => op.type === 'MULTIPLE_WRITES');
    if (multiWrite && multiWrite.count >= 3) {
      return 'HIGH';
    }

    if (operations.every(op => op.type === 'READ_ONLY')) {
      return 'LOW';
    }

    return 'MEDIUM';
  }

  determineReason(operations) {
    if (operations.some(op => op.type === 'CHECK_THEN_ACT')) {
      return 'Race condition: Another request could modify data between check and action';
    }

    if (
      operations.some(op => op.type === 'BOOKING_CREATE') &&
      operations.some(op => op.type === 'SLOT_UPDATE')
    ) {
      return 'Double-booking prevention: Booking and slot must update atomically';
    }

    const multiWrite = operations.find(op => op.type === 'MULTIPLE_WRITES');
    if (multiWrite) {
      return `Data consistency: ${multiWrite.count} writes should be atomic`;
    }

    if (operations.every(op => op.type === 'READ_ONLY')) {
      return 'Read-only operation - transaction not needed';
    }

    return 'Review needed';
  }

  buildMessage(context) {
    return `[${context.riskLevel} RISK] ${context.reason}`;
  }

  buildFix(context) {
    if (context.riskLevel === 'LOW') {
      return '✅ Transaction not needed - add suppression comment if warning is noise';
    }

    if (context.riskLevel === 'CRITICAL' || context.riskLevel === 'HIGH') {
      return '❌ RECOMMENDED: FIX IMMEDIATELY\n' +
             '   await ctx.prisma.$transaction(async (tx) => {\n' +
             '     const slot = await tx.slot.findUnique({ where: { id } });\n' +
             '     if (slot.status !== "AVAILABLE") throw new TRPCError(...);\n' +
             '     await tx.booking.create({ data });\n' +
             '     await tx.slot.update({ where: { id }, data: { status: "BOOKED" } });\n' +
             '   }, { maxWait: 10000, timeout: 20000 });';
    }

    return '⚠️  RECOMMENDED: REVIEW & DECIDE\n' +
           '   If race condition possible → Wrap in transaction\n' +
           '   If operations independent → Add suppression comment';
  }

  buildSuppressionGuidance(context) {
    if (context.riskLevel === 'LOW') {
      return 'Safe to suppress:\n' +
             '     // tx-safe: read-only operation\n' +
             '     const data = await ctx.prisma.model.findMany();';
    }

    if (context.riskLevel === 'MEDIUM') {
      return 'Suppress ONLY if certain no race condition exists:\n' +
             '     // tx-safe: single write, no concurrent access risk\n' +
             '     await ctx.prisma.log.create({ data });';
    }

    return '⚠️  DO NOT suppress CRITICAL/HIGH risk operations\n' +
           '   Valid reasons: idempotent operation, external transaction, team-reviewed';
  }
}

// ============================================================================
// SECTION 3: CODE VALIDATORS
// ============================================================================

class CodeValidator {
  constructor(rules) {
    this.rules = rules;
    this.violations = [];

    // Initialize enhanced validators
    this.phiValidator = new EnhancedPHIValidator();
    this.transactionValidator = new EnhancedTransactionValidator();

    // Load enforcement configuration
    this.loadEnforcementConfig();
  }

  loadEnforcementConfig() {
    const configPath = path.join(__dirname, '../enforcement/enforcement-config.json');

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        this.enforcementConfig = config.validatorConfig?.rules || {};
      } catch (error) {
        console.warn('Warning: Could not load enforcement-config.json, using defaults');
        this.enforcementConfig = {};
      }
    } else {
      this.enforcementConfig = {};
    }
  }

  isRuleEnabled(ruleName) {
    const ruleConfig = this.enforcementConfig[ruleName];
    if (!ruleConfig) return true;
    return ruleConfig.enabled !== false;
  }

  validateChanges(filePath, oldContent, newContent) {
    this.violations = [];
    const addedLines = this.getAddedLines(oldContent, newContent);

    // Run validators
    if (this.isRuleEnabled('timezone')) {
      this.validateTimezone(addedLines, filePath);
    }

    if (this.isRuleEnabled('typeSafety')) {
      this.validateTypeSafety(addedLines, filePath);
    }

    if (this.isRuleEnabled('logging')) {
      // Use enhanced PHI validator
      const phiViolations = this.phiValidator.validatePHISanitization(
        addedLines,
        filePath,
        newContent
      );

      // Also check for console usage (ERROR)
      this.validateConsoleUsage(addedLines, filePath);

      this.violations.push(...phiViolations);
    }

    this.validateArchitecture(filePath, newContent);

    // Use enhanced transaction validator
    const txViolations = this.transactionValidator.validateTransactionUsage(
      addedLines,
      filePath,
      newContent
    );
    this.violations.push(...txViolations);

    // Keep unbounded query check
    this.validateUnboundedQueries(filePath, newContent);

    return {
      valid: this.violations.length === 0,
      violations: this.violations,
    };
  }

  getAddedLines(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    return newLines.filter(line => !oldLines.includes(line));
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 1: Timezone Compliance
  // -------------------------------------------------------------------------
  validateTimezone(addedLines, filePath) {
    if (filePath.includes('timezone.ts') || filePath.includes('env/server.ts')) {
      return;
    }

    addedLines.forEach((line, idx) => {
      if (/new Date\(/.test(line)) {
        this.violations.push({
          severity: 'ERROR',
          rule: 'TIMEZONE_VIOLATION',
          file: filePath,
          line: idx + 1,
          content: line.trim(),
          message: 'Use timezone utilities from @/lib/timezone instead of new Date()',
          fix: 'Replace with nowUTC(), parseUTC(), or date-fns functions',
          reference: '/docs/enforcement/TIMEZONE-GUIDELINES.md',
        });
      }

      if (/Date\.now\(\)/.test(line)) {
        this.violations.push({
          severity: 'ERROR',
          rule: 'TIMEZONE_VIOLATION',
          file: filePath,
          line: idx + 1,
          content: line.trim(),
          message: 'Use nowUTC() from @/lib/timezone instead of Date.now()',
          reference: '/docs/enforcement/TIMEZONE-GUIDELINES.md',
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 2: Type Safety
  // -------------------------------------------------------------------------
  validateTypeSafety(addedLines, filePath) {
    const whitelist = ['src/lib/auth.ts', 'src/server/trpc.ts', 'src/types/guards.ts'];
    if (whitelist.some(allowed => filePath.includes(allowed))) {
      return;
    }

    addedLines.forEach((line, idx) => {
      if (/as any/.test(line)) {
        this.violations.push({
          severity: 'ERROR',
          rule: 'TYPE_SAFETY_VIOLATION',
          file: filePath,
          line: idx + 1,
          content: line.trim(),
          message: '"as any" violates type safety. Use proper type guards or type narrowing',
          fix: 'Create a type guard or use proper TypeScript narrowing',
          reference: '/docs/enforcement/TYPE-SAFETY.md',
        });
      }

      if (/@ts-ignore/.test(line)) {
        const hasComment = /@ts-ignore\s*-\s*.+/.test(line);
        if (!hasComment) {
          this.violations.push({
            severity: 'ERROR',
            rule: 'UNDOCUMENTED_TS_IGNORE',
            file: filePath,
            line: idx + 1,
            content: line.trim(),
            message: '@ts-ignore must be documented with reason',
            fix: 'Add comment: // @ts-ignore - Reason here',
            reference: 'CLAUDE.md Section 3',
          });
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 3: Console Usage (ERROR severity)
  // -------------------------------------------------------------------------
  validateConsoleUsage(addedLines, filePath) {
    addedLines.forEach((line, idx) => {
      if (/console\.(log|error|warn|info)/.test(line)) {
        const allowedFiles = ['logger.ts', 'env/server.ts', 'audit.ts', 'debug.ts'];
        if (!allowedFiles.some(file => filePath.includes(file))) {
          this.violations.push({
            severity: 'ERROR',
            rule: 'CONSOLE_USAGE',
            file: filePath,
            line: idx + 1,
            content: line.trim(),
            message: 'Use logger from @/lib/logger instead of console',
            fix: 'Replace with logger.info(), logger.error(), logger.audit()',
            reference: '/docs/enforcement/LOGGING.md',
          });
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 4: Architecture Patterns
  // -------------------------------------------------------------------------
  validateArchitecture(filePath, fullContent) {
    // Hooks must not export types
    if (filePath.includes('/hooks/')) {
      const exportTypeMatches = fullContent.match(/export type \w+/g);
      if (exportTypeMatches && exportTypeMatches.length > 0) {
        this.violations.push({
          severity: 'ERROR',
          rule: 'HOOKS_EXPORT_TYPES',
          file: filePath,
          message: 'Hooks MUST NOT export types. Move types to api-types.ts',
          fix: 'Create /types/api-types.ts and export types there',
          reference: 'CLAUDE.md Section 3: Type System Architecture',
        });
      }
    }

    // Database queries only in tRPC routers
    if (!filePath.includes('/routers/') && !filePath.includes('/server/')) {
      if (/prisma\.(findMany|findUnique|create|update|delete)/.test(fullContent)) {
        this.violations.push({
          severity: 'ERROR',
          rule: 'DB_QUERY_OUTSIDE_TRPC',
          file: filePath,
          message: 'Database queries ONLY allowed in tRPC procedures',
          fix: 'Move query to appropriate router in /server/api/routers/',
          reference: 'CLAUDE.md Section 3: Data Flow Architecture',
        });
      }
    }

    // No cross-feature imports
    const featureMatch = filePath.match(/\/features\/(\w+)\//);
    if (featureMatch) {
      const currentFeature = featureMatch[1];
      const crossImportPattern = new RegExp(`from ['"]@/features/(?!${currentFeature})\\w+`, 'g');
      const crossImports = fullContent.match(crossImportPattern);

      if (crossImports) {
        this.violations.push({
          severity: 'ERROR',
          rule: 'CROSS_FEATURE_IMPORT',
          file: filePath,
          message: 'Cross-feature imports are FORBIDDEN',
          fix: 'Use shared types or refactor to feature-specific code',
          reference: 'CLAUDE.md Section 3: Architectural Integrity',
          details: crossImports.join(', '),
        });
      }
    }

    // tRPC procedures should have Zod validation
    if (filePath.includes('/routers/')) {
      const procedureMatches = fullContent.match(/\.(query|mutation)\(async/g);
      const inputMatches = fullContent.match(/\.input\(/g);

      if (procedureMatches && procedureMatches.length > (inputMatches?.length || 0)) {
        this.violations.push({
          severity: 'WARNING',
          rule: 'MISSING_ZOD_VALIDATION',
          file: filePath,
          message: 'tRPC procedures should have .input() Zod validation',
          fix: 'Add .input(z.object({...})) before .query() or .mutation()',
          reference: 'CLAUDE.md Section 3: API Pattern',
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 5: Unbounded Queries
  // -------------------------------------------------------------------------
  validateUnboundedQueries(filePath, fullContent) {
    if (filePath.includes('/routers/')) {
      const findManyMatches = fullContent.match(/\.findMany\(\{[^}]*\}\)/gs);
      if (findManyMatches) {
        findManyMatches.forEach(match => {
          if (!/take:/.test(match)) {
            this.violations.push({
              severity: 'ERROR',
              rule: 'UNBOUNDED_QUERY',
              file: filePath,
              message: 'findMany() must have take: limit for pagination',
              fix: 'Add take: input.take || 50 to prevent unbounded queries',
              reference: 'CLAUDE.md Section 9: Performance Requirements',
            });
          }
        });
      }
    }
  }
}

// ============================================================================
// SECTION 4: ENHANCED CLI INTERFACE
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'validate-change') {
    const filePath = args[1];
    const oldContentPath = args[2];
    const newContentPath = args[3];

    const oldContent = fs.existsSync(oldContentPath) ? fs.readFileSync(oldContentPath, 'utf-8') : '';
    const newContent = fs.readFileSync(newContentPath, 'utf-8');

    const claudeMdPath = path.join(__dirname, '..', '..', 'CLAUDE.md');
    const rules = new ClaudeRulesEngine(claudeMdPath);
    const validator = new CodeValidator(rules.rules);
    const result = validator.validateChanges(filePath, oldContent, newContent);

    if (!result.valid) {
      console.log('\n❌ CLAUDE.md Compliance Violations Detected:\n');

      result.violations.forEach((v, idx) => {
        console.log('━'.repeat(80));
        console.log(`\n${idx + 1}. [${v.severity}] ${v.rule}`);
        console.log(`   File: ${v.file}${v.line ? `:${v.line}` : ''}\n`);

        // Enhanced: Show confidence/risk level
        if (v.confidence) {
          const emoji = v.confidence === 'HIGH' ? '🔴' :
                        v.confidence === 'MEDIUM' ? '🟡' : '🟢';
          console.log(`   ${emoji} CONFIDENCE: ${v.confidence}\n`);
        }
        if (v.riskLevel) {
          const emoji = v.riskLevel === 'CRITICAL' ? '🔴' :
                        v.riskLevel === 'HIGH' ? '🔴' :
                        v.riskLevel === 'MEDIUM' ? '🟡' : '🟢';
          console.log(`   ${emoji} RISK LEVEL: ${v.riskLevel}\n`);
        }

        console.log(`   Message:\n     ${v.message}`);

        if (v.content) {
          console.log(`\n   Code:\n     ${v.content}`);
        }

        console.log(`\n   ${v.fix}`);

        // Enhanced: Show suppression guidance
        if (v.suppressionGuidance) {
          console.log(`\n   📝 To Suppress:\n     ${v.suppressionGuidance}`);
        }

        console.log(`\n   Reference: ${v.reference}\n`);
      });

      // Enhanced: Summary with actionable breakdown
      const errors = result.violations.filter(v => v.severity === 'ERROR').length;
      const warnings = result.violations.filter(v => v.severity === 'WARNING').length;
      const critical = result.violations.filter(v =>
        v.confidence === 'HIGH' || v.riskLevel === 'CRITICAL' || v.riskLevel === 'HIGH'
      ).length;

      console.log('\n' + '━'.repeat(80));
      console.log('\n📊 Summary:');
      console.log(`   Total Violations: ${result.violations.length}\n`);

      if (errors > 0) {
        console.log(`   By Severity:`);
        console.log(`     🔴 ERRORS:   ${errors}  ← Must fix (blocks commit)`);
        if (warnings > 0) {
          console.log(`     🟡 WARNINGS: ${warnings}  ← Review and decide (allows commit)`);
        }
      }

      if (warnings > 0 && critical > 0) {
        console.log(`\n   Warning Priority:`);
        console.log(`     🔴 HIGH/CRITICAL: ${critical}  ← Fix immediately`);
        console.log(`     🟡 MEDIUM/LOW:    ${warnings - critical}  ← Review and decide`);
      }

      console.log(`\n   📚 Quick Help:`);
      console.log(`     - PHI sanitization: Use sanitizeEmail(), sanitizePhone(), sanitizeName()`);
      console.log(`     - Transactions: Wrap booking operations in prisma.$transaction()`);
      console.log('\n' + '━'.repeat(80) + '\n');

      // Only exit with error for ERROR severity, not WARNING
      const hasErrors = result.violations.some(v => v.severity === 'ERROR');
      if (hasErrors) {
        console.log('🚫 Commit blocked due to ERROR violations\n');
      } else {
        console.log('✅ Commit allowed (warnings present)\n');
        console.log('⚠️  Please review and resolve warnings\n');
      }
      process.exit(hasErrors ? 1 : 0);
    } else {
      console.log('✅ CLAUDE.md compliance verified');
      process.exit(0);
    }
  } else if (command === 'validate-file') {
    const filePath = args[1];
    const content = fs.readFileSync(filePath, 'utf-8');

    const claudeMdPath = path.join(__dirname, '..', '..', 'CLAUDE.md');
    const rules = new ClaudeRulesEngine(claudeMdPath);
    const validator = new CodeValidator(rules.rules);
    const result = validator.validateChanges(filePath, '', content);

    console.log(result.valid ? '✅ Valid' : '❌ Invalid');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('Usage:');
    console.log('  node claude-code-validator.js validate-change <file> <old> <new>');
    console.log('  node claude-code-validator.js validate-file <file>');
  }
}

if (require.main === module) {
  main();
}

module.exports = { ClaudeRulesEngine, CodeValidator };
