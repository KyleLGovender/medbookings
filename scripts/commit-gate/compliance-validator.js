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
 *
 * @typedef {Object} Violation
 * @property {'ERROR'|'WARNING'} severity - Violation severity level
 * @property {string} rule - Rule identifier
 * @property {string} file - File path where violation occurred
 * @property {number} [line] - Line number of violation
 * @property {string} [content] - Code content with violation
 * @property {string} message - Human-readable violation message
 * @property {string} [fix] - Suggested fix
 * @property {string} [reference] - Documentation reference
 * @property {'HIGH'|'MEDIUM'|'LOW'} [confidence] - PHI detection confidence
 * @property {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} [riskLevel] - Transaction risk level
 * @property {string} [suppressionGuidance] - How to suppress if false positive
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// SECTION 1: CLAUDE.md RULES ENGINE
// ============================================================================

class ClaudeRulesEngine {
  /**
   * @param {string} claudeMdPath - Path to CLAUDE.md file
   */
  constructor(claudeMdPath) {
    this.rules = this.parseClaudeMd(claudeMdPath);
  }

  /**
   * Parse CLAUDE.md and extract rules
   * @param {string} filePath - Path to CLAUDE.md
   * @returns {Object} Parsed rules object
   */
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

  /**
   * Extract a specific rule from CLAUDE.md content
   * @param {string} content - CLAUDE.md file content
   * @param {string} keyword - Rule keyword to search for
   * @returns {string|null} Extracted rule text or null
   */
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
  /**
   * Validate PHI sanitization in logger calls
   * @param {string[]} addedLines - Lines added in this change
   * @param {string} filePath - Path to file being validated
   * @param {string} fullContent - Complete file content
   * @returns {Violation[]} Array of PHI violations found
   */
  validatePHISanitization(addedLines, filePath, fullContent) {
    /** @type {Violation[]} */
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
            reference: '/docs/compliance/LOGGING.md',
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
  /**
   * @param {Object} rules - Parsed CLAUDE.md rules
   */
  constructor(rules) {
    this.rules = rules;
    /** @type {Violation[]} */
    this.violations = [];

    // Initialize enhanced validators
    this.phiValidator = new EnhancedPHIValidator();
    this.transactionValidator = new EnhancedTransactionValidator();

    // Load compliance configuration
    this.loadComplianceConfig();
  }

  loadComplianceConfig() {
    const configPath = path.join(__dirname, '../compliance/compliance-config.json');

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        this.complianceConfig = config.validatorConfig?.rules || {};
      } catch (error) {
        console.warn('Warning: Could not load compliance-config.json, using defaults');
        this.complianceConfig = {};
      }
    } else {
      this.complianceConfig = {};
    }
  }

  isRuleEnabled(ruleName) {
    const ruleConfig = this.complianceConfig[ruleName];
    if (!ruleConfig) return true;
    return ruleConfig.enabled !== false;
  }

  /**
   * Validate all code changes against CLAUDE.md rules
   * @param {string} filePath - Path to file being validated
   * @param {string} oldContent - Original file content
   * @param {string} newContent - Modified file content
   * @returns {{valid: boolean, violations: Violation[]}} Validation result
   */
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

    // NEW VALIDATORS (Option C - 85% Automation)
    // Phase 1: Quick Wins
    this.validateImageUsage(filePath, newContent);              // Validator 6
    this.validateStateManagement(filePath, newContent);         // Validator 7
    this.validateProcedureType(filePath, newContent);           // Validator 8

    // Phase 2: Medium Complexity
    this.validateSingleQueryPerEndpoint(filePath, newContent);  // Validator 9
    this.validateAuthorizationOrder(filePath, newContent);      // Validator 10

    // Phase 3: Advanced
    this.validateInputSanitization(filePath, newContent);       // Validator 11
    this.validatePerformancePatterns(filePath, newContent);     // Validator 12
    this.validateFormPatterns(filePath, newContent);            // Validator 13

    return {
      valid: this.violations.length === 0,
      violations: this.violations,
    };
  }

  /**
   * Extract lines that were added (not in old content)
   * @param {string} oldContent - Original content
   * @param {string} newContent - New content
   * @returns {string[]} Array of added lines
   */
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
          reference: '/docs/compliance/TIMEZONE-GUIDELINES.md',
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
          reference: '/docs/compliance/TIMEZONE-GUIDELINES.md',
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 2: Type Safety
  // -------------------------------------------------------------------------
  validateTypeSafety(addedLines, filePath) {
    const whitelist = [
      'src/lib/auth.ts',
      'src/server/trpc.ts',
      'src/types/guards.ts',
      'src/app/api/trpc/[trpc]/route.ts', // tRPC App Router adapter - type mismatch between Web API and Node API
    ];
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
          reference: '/docs/compliance/TYPE-SAFETY.md',
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
            reference: '/docs/compliance/LOGGING.md',
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

    // No cross-feature imports (with exceptions for page-level aggregation)
    const featureMatch = filePath.match(/\/features\/(\w+)\//);
    if (featureMatch) {
      const currentFeature = featureMatch[1];

      // Exception: Page-level wrapper components can aggregate data from multiple features
      // These components use tRPC hooks (API calls) to fetch data, not importing business logic
      const isPageWrapper = filePath.endsWith('-page.tsx');

      if (!isPageWrapper) {
        const crossImportPattern = new RegExp(`from ['"]@/features/(?!${currentFeature})\\w+`, 'g');
        const crossImports = fullContent.match(crossImportPattern);

        // Check for suppression comment (matches PHI suppression pattern)
        const hasSuppression = /\/\/\s*cross-feature-import-safe:/i.test(fullContent);

        if (crossImports && !hasSuppression) {
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
      // Enhanced: Use balanced bracket matching instead of regex
      // to properly handle nested braces in where clauses, etc.
      const findManyMatches = this.extractFindManyCalls(fullContent);

      findManyMatches.forEach(match => {
        if (!/take:/.test(match.text)) {
          this.violations.push({
            severity: 'ERROR',
            rule: 'UNBOUNDED_QUERY',
            file: filePath,
            line: match.line,
            message: 'findMany() must have take: limit for pagination',
            fix: 'Add take: input.take || 50 to prevent unbounded queries',
            reference: 'CLAUDE.md Section 9: Performance Requirements',
          });
        }
      });
    }
  }

  /**
   * Extract all findMany() calls using balanced bracket matching
   * Handles nested braces properly (e.g., where: { id: 1 })
   * @param {string} content - File content
   * @returns {Array<{text: string, line: number}>} Array of findMany call objects
   */
  extractFindManyCalls(content) {
    const results = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const findManyIndex = line.indexOf('.findMany(');

      if (findManyIndex === -1) continue;

      // Start from the opening parenthesis after findMany
      let depth = 0;
      let startLine = lineIdx;
      let startCol = findManyIndex + '.findMany('.length;
      let queryText = '';
      let foundStart = false;

      // Scan forward to find the matching closing parenthesis
      for (let i = lineIdx; i < lines.length; i++) {
        const currentLine = lines[i];
        const startIdx = (i === lineIdx) ? startCol : 0;

        for (let j = startIdx; j < currentLine.length; j++) {
          const char = currentLine[j];
          queryText += char;

          if (char === '(' || char === '{' || char === '[') {
            depth++;
            foundStart = true;
          } else if (char === ')' || char === '}' || char === ']') {
            depth--;

            // Found the matching closing parenthesis
            if (depth === 0 && foundStart && char === ')') {
              results.push({
                text: queryText,
                line: startLine + 1, // 1-indexed for display
              });

              // Move past this match to avoid duplicates
              lineIdx = i;
              break;
            }
          }
        }

        // If we found the end, break outer loop
        if (depth === 0 && foundStart) break;

        // Add newline for multi-line queries
        if (i < lines.length - 1) {
          queryText += '\n';
        }
      }
    }

    return results;
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 6: Image Component Usage (Phase 1 - Quick Win)
  // -------------------------------------------------------------------------
  validateImageUsage(filePath, fullContent) {
    // Skip non-TSX files and README
    if (!filePath.endsWith('.tsx') || filePath.includes('README')) {
      return;
    }

    // Detect <img> tags
    const imgTagPattern = /<img\s+[^>]*>/g;
    const matches = fullContent.match(imgTagPattern);

    if (matches) {
      const lines = fullContent.split('\n');
      matches.forEach(match => {
        const lineIdx = lines.findIndex(line => line.includes(match));

        this.violations.push({
          severity: 'ERROR',
          rule: 'USE_NEXT_IMAGE',
          file: filePath,
          line: lineIdx + 1,
          content: match.substring(0, 80) + '...',
          message: 'Use Next.js Image component instead of <img> tag',
          fix: 'Replace <img> with <Image> from "next/image"\n' +
               '   import Image from "next/image";\n' +
               '   <Image src="/path" alt="..." width={X} height={Y} />',
          reference: 'DEVELOPER-PRINCIPLES.md Section 15 - Component Development',
        });
      });
    }
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 7: State Management (Phase 1 - Quick Win)
  // -------------------------------------------------------------------------
  validateStateManagement(filePath, fullContent) {
    // Skip if not a feature file
    if (!filePath.includes('/features/')) {
      return;
    }

    const forbiddenLibraries = [
      { pattern: /from ['"]redux['"]|import.*from ['"]react-redux['"]/, name: 'Redux' },
      { pattern: /from ['"]zustand['"]/, name: 'Zustand' },
      { pattern: /createContext\(|useContext\(/, name: 'React Context (for features)' },
      { pattern: /from ['"]@reduxjs\/toolkit['"]/, name: 'Redux Toolkit' },
      { pattern: /from ['"]jotai['"]/, name: 'Jotai' },
      { pattern: /from ['"]recoil['"]/, name: 'Recoil' },
    ];

    forbiddenLibraries.forEach(lib => {
      if (lib.pattern.test(fullContent)) {
        const lines = fullContent.split('\n');
        const lineIdx = lines.findIndex(line => lib.pattern.test(line));

        this.violations.push({
          severity: 'ERROR',
          rule: 'FORBIDDEN_STATE_LIBRARY',
          file: filePath,
          line: lineIdx + 1,
          content: lines[lineIdx]?.trim(),
          message: `${lib.name} is forbidden in features. Use TanStack Query via tRPC for state management`,
          fix: 'Replace with tRPC hooks:\n' +
               '   import { api } from "@/utils/api";\n' +
               '   const { data } = api.router.procedure.useQuery();',
          reference: 'DEVELOPER-PRINCIPLES.md Section 16 - State Management',
        });
      }
    });
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 8: Procedure Type (Phase 1 - Quick Win)
  // -------------------------------------------------------------------------
  validateProcedureType(filePath, fullContent) {
    // Only check router files
    if (!filePath.includes('/routers/')) {
      return;
    }

    const lines = fullContent.split('\n');

    // Patterns that require specific procedures
    const sensitivePatterns = [
      {
        operation: /\.(delete|update).*[Uu]ser/,
        requires: 'adminProcedure or superAdminProcedure',
        wrongProcedures: ['publicProcedure', 'protectedProcedure'],
      },
      {
        operation: /approve[A-Z]|reject[A-Z]|updateRole|deleteUser/,
        requires: 'adminProcedure or superAdminProcedure',
        wrongProcedures: ['publicProcedure', 'protectedProcedure'],
        // Exception: rejectInvitation is a user-level operation (users rejecting their own invitations)
        exceptions: ['rejectInvitation'],
      },
      {
        operation: /\.(create|update|delete).*[Bb]ooking/,
        requires: 'protectedProcedure or higher',
        wrongProcedures: ['publicProcedure'],
      },
    ];

    lines.forEach((line, idx) => {
      sensitivePatterns.forEach(pattern => {
        if (pattern.operation.test(line)) {
          // Check if this matches an exception
          if (pattern.exceptions) {
            const isException = pattern.exceptions.some(exception =>
              line.includes(exception)
            );
            if (isException) {
              return; // Skip validation for exceptions
            }
          }

          // Look back up to 20 lines for procedure definition
          const contextStart = Math.max(0, idx - 20);
          const context = lines.slice(contextStart, idx + 1).join('\n');

          // Check if using wrong procedure type
          pattern.wrongProcedures.forEach(wrongProc => {
            if (new RegExp(wrongProc).test(context)) {
              this.violations.push({
                severity: 'ERROR',
                rule: 'WRONG_PROCEDURE_TYPE',
                file: filePath,
                line: idx + 1,
                content: line.trim(),
                message: `Sensitive operation requires ${pattern.requires}, not ${wrongProc}`,
                fix: `Change procedure type:\n` +
                     `   ${wrongProc} → ${pattern.requires}`,
                reference: 'DEVELOPER-PRINCIPLES.md Section 13 - Authentication & Authorization',
              });
            }
          });
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 9: Multiple Queries Per Endpoint (Phase 2 - Medium)
  // -------------------------------------------------------------------------
  validateSingleQueryPerEndpoint(filePath, fullContent) {
    // Only check router files
    if (!filePath.includes('/routers/')) {
      return;
    }

    // Find all tRPC procedures
    const procedurePattern = /(\w+):\s*(publicProcedure|protectedProcedure|adminProcedure|superAdminProcedure)[^}]+?\.(?:query|mutation)\(async[^}]+?\{([^}]+?)\}\)/gs;

    let match;
    while ((match = procedurePattern.exec(fullContent)) !== null) {
      const procedureName = match[1];
      const procedureBody = match[3];

      // Skip if inside transaction
      if (/\$transaction\(async/.test(procedureBody)) {
        continue;
      }

      // Count prisma queries
      const queryPattern = /(?:ctx\.)?prisma\.\w+\.(findMany|findUnique|findFirst|create|update|delete|upsert)\(/g;
      const queries = procedureBody.match(queryPattern) || [];

      if (queries.length > 1) {
        // Find line number
        const beforeMatch = fullContent.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;

        this.violations.push({
          severity: 'WARNING',
          rule: 'MULTIPLE_QUERIES_PER_ENDPOINT',
          file: filePath,
          line: lineNumber,
          content: `${procedureName}: ${queries.length} queries detected`,
          message: `Found ${queries.length} database queries in single endpoint. Use single query with include or transaction`,
          fix: 'Combine queries:\n' +
               '   ✅ Single query: await ctx.prisma.model.findUnique({ include: { related: true } })\n' +
               '   ✅ Transaction: await ctx.prisma.$transaction(async (tx) => { ... })',
          reference: 'DEVELOPER-PRINCIPLES.md Section 14 - API Development',
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 10: Authorization Order (Phase 2 - Medium)
  // -------------------------------------------------------------------------
  validateAuthorizationOrder(filePath, fullContent) {
    // Only check router files
    if (!filePath.includes('/routers/')) {
      return;
    }

    const procedurePattern = /(protectedProcedure|adminProcedure|superAdminProcedure)[^}]+?\.(?:query|mutation)\(async[^}]+?\{([^}]+?)\}\)/gs;

    let match;
    while ((match = procedurePattern.exec(fullContent)) !== null) {
      const procedureBody = match[2];
      const lines = procedureBody.split('\n');

      let hasBusinessLogic = false;
      let businessLogicLine = -1;
      let hasAuthCheck = false;
      let authCheckLine = -1;

      lines.forEach((line, idx) => {
        // Detect business logic (DB operations, return statements)
        if (/prisma\.\w+\.(create|update|delete)|return\s+/.test(line) && !hasBusinessLogic) {
          hasBusinessLogic = true;
          businessLogicLine = idx;
        }

        // Detect auth checks
        if (/if\s*\(.*?(session|user|role|permission)|throw new TRPCError.*FORBIDDEN|UNAUTHORIZED/.test(line)) {
          hasAuthCheck = true;
          authCheckLine = idx;
        }
      });

      // If business logic comes before auth check
      if (hasBusinessLogic && hasAuthCheck && businessLogicLine < authCheckLine) {
        const beforeMatch = fullContent.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length + businessLogicLine;

        this.violations.push({
          severity: 'WARNING',
          rule: 'AUTH_CHECK_ORDER',
          file: filePath,
          line: lineNumber,
          message: 'Authorization checks should come BEFORE business logic',
          fix: 'Move authorization checks to the beginning of the procedure:\n' +
               '   1. Authorization check (if/throw)\n' +
               '   2. Business logic (DB queries)\n' +
               '   3. Return data',
          reference: 'DEVELOPER-PRINCIPLES.md Section 14 - API Development',
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 11: Input Sanitization (Phase 3 - Advanced)
  // -------------------------------------------------------------------------
  validateInputSanitization(filePath, fullContent) {
    // Check both routers and components
    if (!filePath.includes('/routers/') && !filePath.includes('/components/') && !filePath.includes('/features/')) {
      return;
    }

    const lines = fullContent.split('\n');

    // Dangerous patterns
    const dangerousPatterns = [
      {
        pattern: /dangerouslySetInnerHTML/,
        severity: 'ERROR',
        message: 'dangerouslySetInnerHTML is forbidden without explicit sanitization',
        fix: 'Use DOMPurify.sanitize() or avoid innerHTML entirely',
      },
      {
        pattern: /innerHTML\s*=/,
        severity: 'ERROR',
        message: 'Direct innerHTML assignment is forbidden',
        fix: 'Use textContent or sanitize with DOMPurify',
      },
      {
        pattern: /eval\(/,
        severity: 'ERROR',
        message: 'eval() is forbidden (arbitrary code execution)',
        fix: 'Remove eval() and use safe alternatives',
      },
    ];

    lines.forEach((line, idx) => {
      dangerousPatterns.forEach(danger => {
        if (danger.pattern.test(line)) {
          this.violations.push({
            severity: danger.severity,
            rule: 'UNSAFE_INPUT_HANDLING',
            file: filePath,
            line: idx + 1,
            content: line.trim(),
            message: danger.message,
            fix: danger.fix,
            reference: 'DEVELOPER-PRINCIPLES.md Section 19 - Security Standards',
          });
        }
      });
    });

    // Check for direct user input rendering without validation
    if (filePath.endsWith('.tsx')) {
      lines.forEach((line, idx) => {
        // Detect {userInput} in JSX without sanitization
        if (/\{.*?(input|params|searchParams|query)\.\w+\}/.test(line) &&
            !/sanitize|escape|encode/.test(line)) {

          this.violations.push({
            severity: 'WARNING',
            rule: 'UNVALIDATED_USER_INPUT',
            file: filePath,
            line: idx + 1,
            content: line.trim(),
            message: 'User input should be validated before rendering',
            fix: 'Add validation:\n' +
                 '   1. Validate with Zod schema\n' +
                 '   2. Escape special characters\n' +
                 '   3. Use textContent instead of innerHTML',
            reference: 'DEVELOPER-PRINCIPLES.md Section 19 - Security Standards',
          });
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 12: Performance Patterns (Phase 3 - Advanced)
  // -------------------------------------------------------------------------
  validatePerformancePatterns(filePath, fullContent) {
    // Only check React components
    if (!filePath.endsWith('.tsx') || filePath.includes('.test.')) {
      return;
    }

    const lines = fullContent.split('\n');

    // Pattern 1: API calls in loops
    lines.forEach((line, idx) => {
      if (/for\s*\(|\.forEach\(|\.map\(/.test(line)) {
        // Look ahead for API calls
        const nextLines = lines.slice(idx, Math.min(idx + 10, lines.length)).join('\n');

        if (/\.useQuery\(|\.useMutation\(|await.*api\.|fetch\(/.test(nextLines)) {
          this.violations.push({
            severity: 'ERROR',
            rule: 'API_CALL_IN_LOOP',
            file: filePath,
            line: idx + 1,
            content: line.trim(),
            message: 'API calls inside loops are forbidden (performance issue)',
            fix: 'Batch fetch instead:\n' +
                 '   ❌ for (id of ids) { await api.get({ id }) }\n' +
                 '   ✅ await api.getBatch({ ids })',
            reference: 'DEVELOPER-PRINCIPLES.md Section 18 - Performance Standards',
          });
        }
      }
    });

    // Pattern 2: Large components without memoization
    const hasExpensiveOps = /map\(|filter\(|reduce\(|sort\(/.test(fullContent);
    const hasMemoization = /useMemo|useCallback|memo\(/.test(fullContent);
    const lineCount = lines.length;

    if (hasExpensiveOps && !hasMemoization && lineCount > 100) {
      this.violations.push({
        severity: 'WARNING',
        rule: 'MISSING_MEMOIZATION',
        file: filePath,
        message: 'Large component with expensive operations should use memoization',
        fix: 'Consider adding:\n' +
             '   - useMemo() for expensive calculations\n' +
             '   - useCallback() for event handlers\n' +
             '   - memo() for component itself',
        reference: 'DEVELOPER-PRINCIPLES.md Section 18 - Performance Standards',
      });
    }

    // Pattern 3: Missing cache configuration for useQuery
    const queryPattern = /\.useQuery\([^)]+\)/gs;
    let queryMatch;
    while ((queryMatch = queryPattern.exec(fullContent)) !== null) {
      const queryCall = queryMatch[0];

      // Check if has cache config
      if (!/staleTime|cacheTime/.test(queryCall)) {
        const beforeMatch = fullContent.substring(0, queryMatch.index);
        const lineNumber = beforeMatch.split('\n').length;

        this.violations.push({
          severity: 'WARNING',
          rule: 'MISSING_CACHE_CONFIG',
          file: filePath,
          line: lineNumber,
          message: 'GET requests should have cache configuration (min 5 seconds)',
          fix: 'Add cache config:\n' +
               '   api.router.get.useQuery(input, {\n' +
               '     staleTime: 5000,  // 5 seconds\n' +
               '     cacheTime: 300000 // 5 minutes\n' +
               '   })',
          reference: 'DEVELOPER-PRINCIPLES.md Section 18 - Performance Standards',
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // VALIDATOR 13: Form Patterns (Phase 3 - Advanced)
  // -------------------------------------------------------------------------
  validateFormPatterns(filePath, fullContent) {
    // Only check component files
    if (!filePath.endsWith('.tsx') || !filePath.includes('/components/')) {
      return;
    }

    // Detect form usage
    const hasFormElement = /<form/.test(fullContent);
    if (!hasFormElement) {
      return;
    }

    // Updated regex to handle TypeScript generics: useForm() or useForm<Type>()
    const hasUseForm = /useForm[<(]/.test(fullContent);
    const hasZodResolver = /zodResolver/.test(fullContent);
    const hasZodSchema = /z\.object\(/.test(fullContent) || /import.*Schema.*from/.test(fullContent);

    if (!hasUseForm) {
      this.violations.push({
        severity: 'ERROR',
        rule: 'MISSING_REACT_HOOK_FORM',
        file: filePath,
        message: 'Forms must use React Hook Form (not manual state)',
        fix: 'Add React Hook Form:\n' +
             '   import { useForm } from "react-hook-form";\n' +
             '   const { register, handleSubmit } = useForm();',
        reference: 'DEVELOPER-PRINCIPLES.md Section 17 - Form Handling',
      });
    }

    if (hasUseForm && !hasZodResolver) {
      this.violations.push({
        severity: 'ERROR',
        rule: 'MISSING_ZOD_RESOLVER',
        file: filePath,
        message: 'React Hook Form must use zodResolver for validation',
        fix: 'Add Zod resolver:\n' +
             '   import { zodResolver } from "@hookform/resolvers/zod";\n' +
             '   const form = useForm({ resolver: zodResolver(schema) });',
        reference: 'DEVELOPER-PRINCIPLES.md Section 17 - Form Handling',
      });
    }

    if (hasUseForm && hasZodResolver && !hasZodSchema) {
      this.violations.push({
        severity: 'WARNING',
        rule: 'MISSING_ZOD_SCHEMA',
        file: filePath,
        message: 'Form should have Zod schema for validation',
        fix: 'Create Zod schema:\n' +
             '   const schema = z.object({ field: z.string() });',
        reference: 'DEVELOPER-PRINCIPLES.md Section 17 - Form Handling',
      });
    }

    // Check for Prisma enum usage in forms
    if (hasZodSchema && /z\.enum\(\[/.test(fullContent) && filePath.includes('/features/')) {
      const lines = fullContent.split('\n');
      lines.forEach((line, idx) => {
        if (/z\.enum\(\[/.test(line) && !/z\.nativeEnum/.test(line)) {
          this.violations.push({
            severity: 'WARNING',
            rule: 'USE_NATIVE_ENUM',
            file: filePath,
            line: idx + 1,
            content: line.trim(),
            message: 'Use z.nativeEnum(PrismaEnum) instead of z.enum()',
            fix: 'Replace with Prisma enum:\n' +
                 '   import { Status } from "@prisma/client";\n' +
                 '   z.nativeEnum(Status)',
            reference: 'DEVELOPER-PRINCIPLES.md Section 17 - Form Handling',
          });
        }
      });
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
    console.log('  node compliance-validator.js validate-change <file> <old> <new>');
    console.log('  node compliance-validator.js validate-file <file>');
  }
}

if (require.main === module) {
  main();
}

module.exports = { ClaudeRulesEngine, CodeValidator };
