/**
 * Custom ESLint plugin for MedBookings type organization rules
 */

const typeOrganizationRules = require('./type-organization');

module.exports = {
  rules: typeOrganizationRules,
  configs: {
    recommended: {
      plugins: ['type-organization'],
      rules: {
        'type-organization/no-type-barrel-exports': 'error',
        'type-organization/enforce-type-file-structure': 'warn',
        'type-organization/enforce-direct-type-imports': 'error',
        'type-organization/enforce-type-file-naming': 'error',
        'type-organization/enforce-prisma-derived-patterns': 'warn',
      },
    },
  },
};
