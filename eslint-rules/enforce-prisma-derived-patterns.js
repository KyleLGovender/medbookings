/**
 * ESLint Rule: enforce-prisma-derived-patterns
 * Enforces proper Prisma-derived type patterns
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent patterns for Prisma-derived types',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      usePrismaGetPayload: 'Use Prisma.ModelGetPayload<{...}> pattern for database query types.',
      consistentNaming:
        'Prisma-derived types should follow the pattern: ModelNameDetailSelect, ModelNameListSelect, ModelNameBasicSelect.',
    },
    schema: [],
  },
  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        const typeName = node.id.name;

        // Check for Prisma-derived type naming patterns
        if (typeName.includes('Select') || typeName.includes('Include')) {
          const hasGetPayload = context.getSourceCode().getText(node).includes('GetPayload');

          if (!hasGetPayload) {
            context.report({
              node,
              messageId: 'usePrismaGetPayload',
            });
          }

          // Check naming convention
          const validSuffixes = ['DetailSelect', 'ListSelect', 'BasicSelect'];
          const hasValidSuffix = validSuffixes.some((suffix) => typeName.endsWith(suffix));

          if (!hasValidSuffix) {
            context.report({
              node,
              messageId: 'consistentNaming',
            });
          }
        }
      },
    };
  },
};
