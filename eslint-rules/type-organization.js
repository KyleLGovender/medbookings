/**
 * Custom ESLint rules for enforcing type organization patterns
 * in the MedBookings codebase.
 */

module.exports = {
  /**
   * Prevents creation of barrel export files in types directories
   */
  'no-type-barrel-exports': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Prevent barrel exports in type files to enforce direct imports',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        noTypeBarrel: 'Barrel exports are not allowed in type directories. Use direct imports instead.',
        noIndexExport: 'Index files are not allowed in type directories. Use specific file names like types.ts, schemas.ts, guards.ts.',
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
  },

  /**
   * Enforces proper type file structure and organization
   */
  'enforce-type-file-structure': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Enforce consistent type file structure with proper section organization',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        missingFileHeader: 'Type files must start with a descriptive header comment block.',
        improperSectionOrder: 'Type sections must be organized as: Enums → Base Interfaces → Complex Interfaces → Utility Types → Prisma-Derived Types.',
        missingJSDocComplex: 'Complex types and interfaces should have comprehensive JSDoc documentation.',
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
          const hasHeaderComment = comments.some(comment => 
            comment.value.includes('=============================================================================') &&
            comment.value.includes('TYPES')
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
            const comments = sourceCode.getCommentsBefore(node);
            const hasJSDoc = comments.some(comment => 
              comment.type === 'Block' && comment.value.includes('*')
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
  },

  /**
   * Prevents direct imports from features without going through types files
   */
  'enforce-direct-type-imports': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce direct imports from specific type files instead of barrel exports',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        useDirectImport: 'Import types directly from {{correctPath}} instead of using barrel exports.',
        invalidTypeImport: 'Type imports should come from /types/types.ts, /types/schemas.ts, or /types/guards.ts files.',
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
  },

  /**
   * Ensures type files follow naming conventions
   */
  'enforce-type-file-naming': {
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
  },

  /**
   * Enforces proper Prisma-derived type patterns
   */
  'enforce-prisma-derived-patterns': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Enforce consistent patterns for Prisma-derived types',
        category: 'Best Practices',
        recommended: true,
      },
      messages: {
        usePrismaGetPayload: 'Use Prisma.ModelGetPayload<{...}> pattern for database query types.',
        consistentNaming: 'Prisma-derived types should follow the pattern: ModelNameDetailSelect, ModelNameListSelect, ModelNameBasicSelect.',
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
            const hasValidSuffix = validSuffixes.some(suffix => typeName.endsWith(suffix));
            
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
  },
};