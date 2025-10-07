/**
 * ESLint Rule: enforce-direct-type-imports
 * Prevents direct imports from features without going through types files
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce direct imports from specific type files instead of barrel exports',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      useDirectImport:
        'Import types directly from {{correctPath}} instead of using barrel exports.',
      invalidTypeImport:
        'Type imports should come from /types/types.ts, /types/schemas.ts, or /types/guards.ts files.',
    },
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Check for imports from feature barrel exports
        if (importPath.match(/^@\/features\/\w+\/types$/)) {
          const featureName = importPath.split('/')[2];
          context.report({
            node,
            messageId: 'useDirectImport',
            data: {
              correctPath: `@/features/${featureName}/types/types`,
            },
          });
        }

        // Check for imports from global types directory without specific file
        if (importPath === '@/types') {
          context.report({
            node,
            messageId: 'useDirectImport',
            data: {
              correctPath: '@/types/api or @/types/guards',
            },
          });
        }
      },
    };
  },
};
