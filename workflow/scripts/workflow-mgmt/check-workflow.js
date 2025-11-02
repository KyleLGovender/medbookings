#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { checkGit } = require('./check-git');
const { validateWorkflowStructure } = require('../utils/config-loader');

// Check if workflow is enabled for this developer
if (!fs.existsSync('.workflow-enabled')) {
  console.log('ℹ️  Workflow system not enabled for this developer.');
  console.log('');
  console.log("This is Kyle's optional workflow system for project management.");
  console.log('');
  console.log('Options:');
  console.log('  • To enable workflow system: npm run workflow:init');
  console.log('  • To skip workflow checks: use npm run build directly');
  console.log('  • For regular development: npm run dev');
  console.log('');
  console.log('✅ Skipping workflow checks (this is normal)');
  process.exit(0); // Success, not failure
}

console.log('🔍 Checking workflow system for enabled developer...');

// Use config-based validation
const validation = validateWorkflowStructure();
let allGood = validation.valid;

if (!validation.valid) {
  console.error('❌ Workflow structure validation failed:');
  validation.missing.forEach((item) => {
    console.error(`   - Missing: ${item}`);
  });
}

// Use the existing check-git.js
console.log('\n');
const gitReady = checkGit();
if (!gitReady) {
  allGood = false;
}

if (allGood) {
  console.log('\n✅ Workflow system ready!');
} else {
  console.error('\n❌ Workflow system needs reinitialization. Run: npm run workflow:init');
  process.exit(1);
}
