#!/usr/bin/env node

/**
 * Enhanced Transaction Validator
 *
 * Improvements:
 * 1. Distinguish critical vs non-critical operations
 * 2. Detection heuristics for race conditions
 * 3. Suppression for legitimate single-operation cases
 * 4. Clear guidance on when transactions are needed
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
      // Skip suppression comments
      if (this.hasSuppression(line, lines, idx)) {
        return;
      }

      // Detect booking operations
      const operationContext = this.analyzeOperation(lines, idx, fullContent);

      if (operationContext.needsTransaction && !operationContext.hasTransaction) {
        violations.push({
          severity: 'WARNING',
          rule: 'MISSING_TRANSACTION',
          file: filePath,
          line: idx + 1,
          content: line.trim(),
          riskLevel: operationContext.riskLevel, // CRITICAL/HIGH/MEDIUM/LOW
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
    // Check for suppression comments
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

  /**
   * Analyze operation to determine if transaction is needed
   */
  analyzeOperation(lines, currentIdx, fullContent) {
    const context = {
      needsTransaction: false,
      hasTransaction: false,
      riskLevel: 'LOW',
      operations: [],
      reason: '',
    };

    // Check if we're inside a transaction
    const beforeContext = lines.slice(Math.max(0, currentIdx - 10), currentIdx).join('\n');
    if (/\$transaction\s*\(|transaction\s*\(async/.test(beforeContext)) {
      context.hasTransaction = true;
      return context;
    }

    // Get surrounding context (20 lines before and after)
    const contextStart = Math.max(0, currentIdx - 20);
    const contextEnd = Math.min(lines.length, currentIdx + 20);
    const surroundingCode = lines.slice(contextStart, contextEnd).join('\n');

    // Detect operation patterns
    const operations = this.detectOperations(surroundingCode);
    context.operations = operations;

    // Decision tree for transaction necessity
    context.needsTransaction = this.evaluateTransactionNeed(operations);
    context.riskLevel = this.assessRiskLevel(operations);
    context.reason = this.determineReason(operations);

    return context;
  }

  detectOperations(code) {
    const operations = [];

    // Pattern 1: Booking creation
    if (/booking\.create|createBooking/.test(code)) {
      operations.push({ type: 'BOOKING_CREATE', critical: true });
    }

    // Pattern 2: Slot status change
    if (/slot\.(update|findUnique).*status/.test(code)) {
      operations.push({ type: 'SLOT_UPDATE', critical: true });
    }

    // Pattern 3: Multiple writes
    const writeOps = code.match(/\.(create|update|delete|upsert)\(/g);
    if (writeOps && writeOps.length > 1) {
      operations.push({
        type: 'MULTIPLE_WRITES',
        count: writeOps.length,
        critical: true,
      });
    }

    // Pattern 4: Check-then-act (race condition risk)
    if (/findUnique.*\n.*if.*\n.*create|update/.test(code)) {
      operations.push({ type: 'CHECK_THEN_ACT', critical: true });
    }

    // Pattern 5: Read-only operations
    if (/findMany|findUnique|findFirst/.test(code) && !/create|update|delete/.test(code)) {
      operations.push({ type: 'READ_ONLY', critical: false });
    }

    // Pattern 6: Single write with no race condition
    if (writeOps && writeOps.length === 1 && !/findUnique.*if/.test(code)) {
      operations.push({ type: 'SINGLE_WRITE', critical: false });
    }

    return operations;
  }

  evaluateTransactionNeed(operations) {
    // CRITICAL: Always needs transaction
    const criticalOps = operations.filter(op => op.critical);
    if (criticalOps.length > 0) {
      return true;
    }

    // Read-only: Never needs transaction
    if (operations.every(op => op.type === 'READ_ONLY')) {
      return false;
    }

    // Single write with no dependencies: Probably safe
    if (operations.length === 1 && operations[0].type === 'SINGLE_WRITE') {
      return false;
    }

    return false;
  }

  assessRiskLevel(operations) {
    // Check-then-act = CRITICAL (race condition)
    if (operations.some(op => op.type === 'CHECK_THEN_ACT')) {
      return 'CRITICAL';
    }

    // Booking + Slot = CRITICAL (double-booking risk)
    if (
      operations.some(op => op.type === 'BOOKING_CREATE') &&
      operations.some(op => op.type === 'SLOT_UPDATE')
    ) {
      return 'CRITICAL';
    }

    // Multiple writes = HIGH
    const multiWrite = operations.find(op => op.type === 'MULTIPLE_WRITES');
    if (multiWrite && multiWrite.count >= 3) {
      return 'HIGH';
    }

    // Read-only = LOW
    if (operations.every(op => op.type === 'READ_ONLY')) {
      return 'LOW';
    }

    return 'MEDIUM';
  }

  determineReason(operations) {
    if (operations.some(op => op.type === 'CHECK_THEN_ACT')) {
      return 'Race condition: Another request could modify data between check and action';
    }

    if (operations.some(op => op.type === 'BOOKING_CREATE') &&
        operations.some(op => op.type === 'SLOT_UPDATE')) {
      return 'Double-booking prevention: Booking and slot must update atomically';
    }

    const multiWrite = operations.find(op => op.type === 'MULTIPLE_WRITES');
    if (multiWrite) {
      return `Data consistency: ${multiWrite.count} writes should be atomic`;
    }

    if (operations.every(op => op.type === 'READ_ONLY')) {
      return 'Read-only operation - transaction not needed';
    }

    return 'Review needed to determine if transaction is necessary';
  }

  buildMessage(context) {
    return `[${context.riskLevel} RISK] ${context.reason}\n` +
           `   Operations detected: ${context.operations.map(op => op.type).join(', ')}`;
  }

  buildFix(context) {
    if (context.riskLevel === 'LOW') {
      return '✅ Transaction not needed - add suppression comment if this warning is noise';
    }

    if (context.riskLevel === 'CRITICAL' || context.riskLevel === 'HIGH') {
      return '❌ TRANSACTION REQUIRED for data integrity:\n\n' +
             '   await ctx.prisma.$transaction(async (tx) => {\n' +
             '     // 1. Read data with tx (not ctx.prisma)\n' +
             '     const slot = await tx.slot.findUnique({ where: { id } });\n' +
             '     \n' +
             '     // 2. Validate\n' +
             '     if (slot.status !== "AVAILABLE") {\n' +
             '       throw new TRPCError({ code: "CONFLICT", message: "Slot unavailable" });\n' +
             '     }\n' +
             '     \n' +
             '     // 3. Write atomically\n' +
             '     await tx.booking.create({ data: bookingData });\n' +
             '     await tx.slot.update({ where: { id }, data: { status: "BOOKED" } });\n' +
             '   }, {\n' +
             '     maxWait: 10000,\n' +
             '     timeout: 20000,\n' +
             '   });';
    }

    return '⚠️  REVIEW NEEDED - Transaction may be required:\n' +
           '   - Multiple database writes?\n' +
           '   - Check-then-act pattern?\n' +
           '   - If yes → Wrap in transaction\n' +
           '   - If no → Add suppression comment';
  }

  buildSuppressionGuidance(context) {
    if (context.riskLevel === 'LOW') {
      return 'Safe to suppress:\n' +
             '   // tx-safe: read-only operation\n' +
             '   const data = await ctx.prisma.model.findMany();';
    }

    if (context.riskLevel === 'MEDIUM') {
      return 'Suppress ONLY if you\'re certain no race condition exists:\n' +
             '   // tx-safe: single write, no check-then-act, no concurrent access risk\n' +
             '   await ctx.prisma.log.create({ data: logData });';
    }

    return '⚠️  DO NOT suppress CRITICAL/HIGH risk operations without team review\n\n' +
           'Valid suppression reasons:\n' +
           '   - Idempotent operation (safe to retry)\n' +
           '   - External transaction handling\n' +
           '   - Reviewed and accepted race condition\n\n' +
           'Example:\n' +
           '   // tx-safe: operation is idempotent, handled by external system\n' +
           '   await ctx.prisma.auditLog.create({ data });';
  }
}

module.exports = { EnhancedTransactionValidator };
