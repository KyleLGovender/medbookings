#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loadConfig } = require('../utils/config-loader');

/**
 * Initialize workflow system - Safe for existing installations
 * Converted from workflow-init.sh to Node.js for consistency
 */

console.log('Initializing workflow directories...');

// Load configuration
const config = loadConfig();

// Create all required directories from config
const directories = [
  'workflow/prps',
  'workflow/prps/features',
  'workflow/prps/issues',
  'workflow/technical-plans',
  'workflow/technical-plans/archive',
  'workflow/reference',
  'workflow/reference/prp',
  'workflow/reference/prp/feature',
  'workflow/reference/prp/issue',
  'workflow/archive',
  'workflow/patterns',
  'workflow/patterns/staging',
  'workflow/patterns/archive',
];

// Legacy directories (for backward compatibility)
const legacyDirs = [
  'workflow/prds', // Legacy - will be archived
  'workflow/issues', // Legacy folder structure
  'workflow/reference/prd', // Legacy - will be archived
  'workflow/reference/issue', // Old issue location
  'workflow/archive/prd-legacy',
];

// Create all directories
[...directories, ...legacyDirs].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Created: ${dir}`);
  }
});

console.log('');
console.log('Checking Git configuration...');
try {
  // Run the check-git script
  require('./check-git');
  console.log('  Git configuration verified');
} catch (error) {
  console.log(
    '  Git configuration issues detected. Please fix the issues above before continuing.'
  );
  console.log('  Workflow branching will not work without proper git configuration.');
}
console.log('');

console.log('Checking template files...');

// Template file checks based on config
const templates = [
  {
    path: 'workflow/reference/prp/feature/feature-prp-template.md',
    name: 'Feature PRP template',
  },
  {
    path: 'workflow/reference/prp/feature/feature-prp-tasks-template.md',
    name: 'Feature tasks template',
  },
  {
    path: 'workflow/reference/prp/issue/issue-prp-template.md',
    name: 'Issue PRP template',
  },
  {
    path: 'workflow/reference/prp/issue/issue-prp-tasks-template.md',
    name: 'Issue tasks template',
  },
];

templates.forEach((template) => {
  if (!fs.existsSync(template.path)) {
    console.log(`  ${template.name} not found at ${template.path}`);
    console.log(`  Please ensure this file exists before running workflows`);
  } else {
    console.log(`  ${template.name} exists`);
  }
});

console.log('Checking backlog and complete files...');

// Create backlog.md if it doesn't exist
const backlogPath = 'workflow/backlog.md';
if (!fs.existsSync(backlogPath)) {
  console.log('  Creating backlog.md...');
  const backlogContent = `# Project Backlog

## Backlog Statistics

- **Total Items:** 0
- **High Priority:** 0
- **Medium Priority:** 0
- **Low Priority:** 0
- **Completed:** 0
- **Last Updated:** ${new Date().toISOString().split('T')[0]}

---

## High Priority

### Features
<!-- Features that block other work or affect many users -->

### Issues
<!-- Critical bugs blocking user workflows -->

---

## Medium Priority

### Features
<!-- Important features that improve user experience -->

### Issues
<!-- Issues with workarounds available -->

---

## Low Priority

### Features
<!-- Nice-to-have improvements -->

### Issues
<!-- Minor bugs with minimal impact -->

---

## Quick Feature Notes
<!-- Feature ideas captured quickly for later specification -->

---

## Quick Issue Notes
<!-- Issues noted quickly for later investigation -->

---

## Recently Completed (Last 7 Days)
<!-- Items marked complete are moved here temporarily before going to complete.md -->
`;
  fs.writeFileSync(backlogPath, backlogContent);
} else {
  console.log('  backlog.md already exists - preserving existing content');
}

// Create complete.md if it doesn't exist
const completePath = 'workflow/complete.md';
if (!fs.existsSync(completePath)) {
  console.log('  Creating complete.md...');
  const completeContent = `# Completed Work Archive

## Completion Statistics

- **Total Completed Features:** 0
- **Total Resolved Issues:** 0
- **This Month:** 0
- **This Quarter:** 0

---

## Completed Features (via PRP)

<!-- Features implemented through PRP workflow -->
<!-- Format: Date | Feature Name | PRP Link | Technical Plan Link -->

---

## Resolved Issues (via Issue-PRP)

<!-- Issues resolved through Issue-PRP workflow -->
<!-- Format: Date | Issue Name | Issue-PRP Link | Root Cause | Fix Summary -->

---

## Legacy PRD Completions

<!-- Old PRD-based implementations - archived for reference -->
<!-- These used the previous PRD workflow system -->

---

## Quick Notes Promoted

<!-- Track which quick notes became full features/issues -->

### From Quick Notes to Full Implementation

<!-- Entries added here when quick notes are expanded to full specs -->
`;
  fs.writeFileSync(completePath, completeContent);
} else {
  console.log('  complete.md already exists - preserving existing content');
}

// Create workflow enabled flag
console.log('Creating workflow enabled flag...');
const enabledFlagContent = `# This file indicates that the workflow system is enabled for this developer
# Created on: ${new Date().toISOString()}
# This file is gitignored and personal to each developer

Summary:
  Directories: Ready
  Templates: ${templates.every((t) => fs.existsSync(t.path)) ? 'All present' : 'Some missing - check above'}
  Backlog: ${fs.existsSync(backlogPath) ? 'Exists' : 'Created'}
  Complete: ${fs.existsSync(completePath) ? 'Exists' : 'Created'}
  Workflow Enabled: Yes
`;
fs.writeFileSync('.workflow-enabled', enabledFlagContent);

console.log('');
console.log('✅ Workflow system initialization complete!');
console.log('');
console.log('✨ Your workflow system is now active!');
console.log("You can now run commands like 'npm run workflow:preflight' successfully.");
console.log('');
console.log("Note: Other developers won't see these workflow files (they're gitignored).");
console.log('Your existing work has been preserved.');
console.log('');
