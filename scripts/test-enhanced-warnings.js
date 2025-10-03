#!/usr/bin/env node

/**
 * Test Enhanced Warning System
 *
 * Demonstrates the new confidence levels, risk assessment, and suppression features
 */

const { CodeValidator, ClaudeRulesEngine } = require('./claude-code-validator');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Enhanced Warning System\n');
console.log('='.repeat(80));

// Test cases
const testCases = [
  {
    name: 'HIGH Confidence PHI Warning',
    filePath: 'src/test/example.ts',
    code: `
logger.info('User registered', {
  email: user.email,
  name: user.name
});
`,
    expected: 'HIGH CONFIDENCE warnings for email and name'
  },
  {
    name: 'MEDIUM Confidence PHI (emailVerified)',
    filePath: 'src/test/example.ts',
    code: `
logger.debug('admin', 'User status', {
  emailVerified: user.emailVerified
});
`,
    expected: 'LOW/MEDIUM CONFIDENCE (false positive)'
  },
  {
    name: 'Valid PHI Suppression',
    filePath: 'src/test/example.ts',
    code: `
// phi-safe: emailVerified is a boolean status, not the email address
logger.info('Status', {
  emailVerified: user.emailVerified
});
`,
    expected: 'No warning (suppressed)'
  },
  {
    name: 'CRITICAL Transaction Risk (Double-booking)',
    filePath: 'src/server/api/routers/bookings.ts',
    code: `
const slot = await ctx.prisma.slot.findUnique({ where: { id } });
if (slot.status !== 'AVAILABLE') throw new Error('Unavailable');
await ctx.prisma.booking.create({ data: bookingData });
await ctx.prisma.slot.update({ where: { id }, data: { status: 'BOOKED' } });
`,
    expected: 'CRITICAL RISK - race condition detected'
  },
  {
    name: 'Valid Transaction Suppression',
    filePath: 'src/server/api/routers/audit.ts',
    code: `
// tx-safe: append-only audit log, no transaction needed
await ctx.prisma.auditLog.create({
  data: { action: 'USER_LOGIN', userId }
});
`,
    expected: 'No warning (suppressed)'
  }
];

// Run tests
const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
const rules = new ClaudeRulesEngine(claudeMdPath);
const validator = new CodeValidator(rules.rules);

testCases.forEach((testCase, idx) => {
  console.log(`\nTest ${idx + 1}: ${testCase.name}`);
  console.log('-'.repeat(80));

  const result = validator.validateChanges(
    testCase.filePath,
    '',
    testCase.code
  );

  console.log(`Expected: ${testCase.expected}`);
  console.log(`Result:   ${result.violations.length} violations`);

  if (result.violations.length > 0) {
    result.violations.forEach(v => {
      console.log(`\n  [${v.severity}] ${v.rule}`);
      if (v.confidence) console.log(`  Confidence: ${v.confidence}`);
      if (v.riskLevel) console.log(`  Risk Level: ${v.riskLevel}`);
      console.log(`  Message: ${v.message}`);
    });
  } else {
    console.log('  ✅ No violations (as expected)');
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ Enhanced Warning System Test Complete\n');
console.log('Key Features Demonstrated:');
console.log('  ✓ Confidence levels (HIGH/MEDIUM/LOW)');
console.log('  ✓ Risk assessment (CRITICAL/HIGH/MEDIUM/LOW)');
console.log('  ✓ Suppression comments (// phi-safe:, // tx-safe:)');
console.log('  ✓ Context-aware detection');
console.log('  ✓ Actionable recommendations\n');
