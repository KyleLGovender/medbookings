/**
 * ESLint Rule: no-new-date
 * Prevents usage of new Date() and Date.now() outside allowed files
 * Enforces: CLAUDE.md Section 7 - Timezone Compliance
 */

module.exports = {
  meta: {
    type: 'error',
    docs: {
      description: 'Disallow new Date() and Date.now() - use timezone utilities from @/lib/timezone',
      category: 'CLAUDE.md Compliance',
      recommended: true,
    },
    messages: {
      noNewDate: 'Use nowUTC() or parseUTC() from @/lib/timezone instead of new Date()',
      noDateNow: 'Use nowUTC() from @/lib/timezone instead of Date.now()',
    },
    fixable: null,
  },
  create(context) {
    const filename = context.getFilename();

    // STRICT ENFORCEMENT: Only allow in core timezone utility files
    // Test files are NOT excluded - violations must be fixed
    const allowedFiles = [
      'timezone.ts',
      'env/server.ts',
    ];

    if (allowedFiles.some(allowed => filename.includes(allowed))) {
      return {};
    }

    return {
      NewExpression(node) {
        if (node.callee.name === 'Date') {
          context.report({
            node,
            messageId: 'noNewDate',
          });
        }
      },
      MemberExpression(node) {
        if (
          node.object.name === 'Date' &&
          node.property.name === 'now'
        ) {
          context.report({
            node,
            messageId: 'noDateNow',
          });
        }
      },
    };
  },
};
