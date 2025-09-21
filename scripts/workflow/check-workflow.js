const fs = require('fs');
const path = require('path');
const { checkGit } = require('./check-git');

// Check if workflow is enabled for this developer
if (!fs.existsSync('.workflow-enabled')) {
  console.log('ℹ️  Workflow system not enabled for this developer.');
  console.log('');
  console.log('This is Kyle\'s optional workflow system for project management.');
  console.log('');
  console.log('Options:');
  console.log('  • To enable workflow system: npm run workflow:init');
  console.log('  • To skip workflow checks: use npm run build directly');
  console.log('  • For regular development: npm run dev');
  console.log('');
  console.log('✅ Skipping workflow checks (this is normal)');
  process.exit(0); // Success, not failure
}

const requiredDirs = [
  'workflow/prds',
  'workflow/issues',
  'workflow/technical-plans',
  'workflow/technical-plans/archive',
  'workflow/reference/prd',
  'workflow/reference/issue',
  '.claude/commands',
];

const requiredFiles = [
  'workflow/backlog.md',
  'workflow/complete.md',
  'workflow/reference/prd/prd-tasks-template.md',
  'workflow/reference/issue/issue-tasks-template.md',
  '.claude/commands/feature-workflow.md',
  '.claude/commands/issue-workflow.md',
  '.claude/commands/quick-note-workflow.md',
  '.claude/commands/tasks-process-enhanced.md',
  '.claude/commands/technical-planning.md',
];

let allGood = true;

console.log('🔍 Checking workflow system for enabled developer...');

// Check directories
requiredDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Missing directory: ${dir}`);
    allGood = false;
  }
});

// Check files
requiredFiles.forEach((file) => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing file: ${file}`);
    allGood = false;
  }
});

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
