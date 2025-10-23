/**
 * ESLint Rule: no-type-barrel-exports
 * Prevents creation of barrel export files in types directories
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent barrel exports in type files to enforce direct imports',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noTypeBarrel:
        'Barrel exports are not allowed in type directories. Use direct imports instead.',
      noIndexExport:
        'Index files are not allowed in type directories. Use specific file names like types.ts, schemas.ts, guards.ts.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    return {
      // Check for export * from declarations in type files
      ExportAllDeclaration(node) {
        if (filename.includes('/types/') && node.source.value.includes('/types')) {
          context.report({
            node,
            messageId: 'noTypeBarrel',
          });
        }
      },

      // Check for index.ts files in type directories
      Program(node) {
        if (filename.endsWith('/types/index.ts') || filename.endsWith('/types/index.tsx')) {
          context.report({
            node,
            messageId: 'noIndexExport',
          });
        }
      },
    };
  },
};
