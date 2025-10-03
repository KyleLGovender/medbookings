#!/usr/bin/env node

/**
 * Enhanced PHI Sanitization Validator
 *
 * Improvements:
 * 1. Suppression comments for false positives
 * 2. Confidence levels (HIGH/MEDIUM/LOW)
 * 3. Specific field detection
 * 4. Better guidance
 */

class EnhancedPHIValidator {
  validatePHISanitization(addedLines, filePath, fullContent) {
    const violations = [];
    const lines = fullContent.split('\n');

    addedLines.forEach((line, idx) => {
      // Skip if line has suppression comment
      if (this.hasSuppression(line, lines, idx)) {
        return;
      }

      // Check for logger calls
      if (/logger\.(info|error|warn|audit|debug)/.test(line)) {
        const phiDetection = this.detectPHI(line, lines, idx);

        if (phiDetection.found && !phiDetection.isSanitized) {
          violations.push({
            severity: 'WARNING',
            rule: 'POTENTIAL_PHI_LEAK',
            file: filePath,
            line: idx + 1,
            content: line.trim(),
            confidence: phiDetection.confidence, // NEW: HIGH/MEDIUM/LOW
            phiFields: phiDetection.fields,      // NEW: Specific fields
            message: this.buildMessage(phiDetection),
            fix: this.buildFix(phiDetection),
            suppressionExample: this.buildSuppressionExample(phiDetection),
            reference: '/docs/LOGGING.md',
          });
        }
      }
    });

    return violations;
  }

  /**
   * Check if line has suppression comment
   *
   * Supports:
   * // phi-safe: field is already sanitized upstream
   * // phi-safe: not actual PHI (system field)
   * // phi-safe-ignore: reviewed and documented
   */
  hasSuppression(line, allLines, currentIdx) {
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

  /**
   * Detect PHI with confidence level
   */
  detectPHI(line, allLines, currentIdx) {
    const result = {
      found: false,
      isSanitized: false,
      confidence: 'LOW',
      fields: [],
      context: {},
    };

    // Pattern matching with confidence levels
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
        pattern: /\.phone|\.mobile|\.whatsapp/,
        field: 'phone',
        sanitizer: 'sanitizePhone',
        confidence: 'HIGH',
        phiType: 'Phone Number',
      },
      {
        pattern: /\.name|guestName|patientName|clientName/,
        field: 'name',
        sanitizer: 'sanitizeName',
        confidence: 'HIGH',
        phiType: 'Name',
      },
      {
        pattern: /\.notes|appointmentNotes|medicalHistory/,
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
        pattern: /email/,
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
        const varMatch = line.match(/(\w+)\.email|\{.*?(\w+).*?\}/);
        if (varMatch) {
          result.context.variable = varMatch[1] || varMatch[2];
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
      return `✅ Use ${field.sanitizer}() to protect PHI:\n` +
             `   import { ${field.sanitizer} } from '@/lib/logger';\n` +
             `   ${field.field}: ${field.sanitizer}(${detection.context.variable || 'value'}.${field.field})`;
    }

    if (conf === 'MEDIUM') {
      return `⚠️  If this IS PHI: Use ${field.sanitizer}()\n` +
             `   If this is NOT PHI: Add suppression comment (see example below)`;
    }

    if (conf === 'LOW') {
      return `⚠️  REVIEW NEEDED:\n` +
             `   1. If this IS PHI → Use ${field.sanitizer}()\n` +
             `   2. If this is NOT PHI → Add suppression comment\n` +
             `   3. If unsure → Ask in code review`;
    }

    return 'Review and sanitize if PHI';
  }

  buildSuppressionExample(detection) {
    const field = detection.fields[0];
    const conf = detection.confidence;

    if (conf === 'HIGH') {
      return '⚠️  Only suppress if absolutely certain this is not PHI:\n' +
             '   // phi-safe: email is system notification address, not user PHI\n' +
             '   logger.info("Notification sent", { email: SYSTEM_EMAIL });';
    }

    return 'To suppress this warning:\n' +
           '   // phi-safe: [explain why this is not PHI]\n' +
           '   logger.info(...);\n\n' +
           'Common valid reasons:\n' +
           '   - Field already sanitized upstream\n' +
           '   - System/configuration value (not user data)\n' +
           '   - Debug-only code (will be removed)\n' +
           '   - emailVerified status (boolean, not email address)';
  }
}

module.exports = { EnhancedPHIValidator };
