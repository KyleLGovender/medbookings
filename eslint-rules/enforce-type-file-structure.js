/**
 * ESLint Rule: enforce-type-file-structure
 * Enforces proper type file structure and organization
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent type file structure with proper section organization',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingFileHeader: 'Type files must start with a descriptive header comment block.',
      improperSectionOrder:
        'Type sections must be organized as: Enums → Base Interfaces → Complex Interfaces → Utility Types → Prisma-Derived Types.',
      missingJSDocComplex:
        'Complex types and interfaces should have comprehensive JSDoc documentation.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    // Only apply to type files
    if (!filename.includes('/types/types.ts')) {
      return {};
    }

    return {
      Program(node) {
        const comments = sourceCode.getAllComments();
        const hasHeaderComment = comments.some(
          (comment) =>
            comment.value.includes(
              '============================================================================='
            ) && comment.value.includes('TYPES')
        );

        if (!hasHeaderComment) {
          context.report({
            node,
            messageId: 'missingFileHeader',
          });
        }
      },

      // Check for JSDoc on complex interfaces
      TSInterfaceDeclaration(node) {
        // Consider interfaces with more than 5 properties as "complex"
        if (node.body.body.length > 5) {
          // Check for comments before the interface node
          let comments = sourceCode.getCommentsBefore(node);

          // If no comments found and parent is an export declaration,
          // check for comments before the export declaration
          if (comments.length === 0 && node.parent && node.parent.type === 'ExportNamedDeclaration') {
            comments = sourceCode.getCommentsBefore(node.parent);
          }

          const hasJSDoc = comments.some(
            (comment) => comment.type === 'Block' && comment.value.includes('*')
          );

          if (!hasJSDoc) {
            context.report({
              node,
              messageId: 'missingJSDocComplex',
            });
          }
        }
      },
    };
  },
};
