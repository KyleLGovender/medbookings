/**
 * ESLint Rule: enforce-type-file-naming
 * Ensures type files follow naming conventions
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce consistent naming conventions for type files',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      invalidFileName: 'Type files must be named types.ts, schemas.ts, guards.ts, or enums.ts.',
      noInterfacesSuffix: 'Avoid using interfaces.ts filename. Use types.ts instead.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    return {
      Program(node) {
        if (filename.includes('/types/')) {
          const baseName = filename.split('/').pop();
          const validNames = ['types.ts', 'schemas.ts', 'guards.ts', 'enums.ts'];

          if (baseName === 'interfaces.ts') {
            context.report({
              node,
              messageId: 'noInterfacesSuffix',
            });
          } else if (!validNames.includes(baseName) && !baseName.startsWith('index.')) {
            context.report({
              node,
              messageId: 'invalidFileName',
            });
          }
        }
      },
    };
  },
};
