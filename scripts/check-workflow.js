const fs = require('fs');
const path = require('path');
const { checkGit } = require('./check-git');

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

// Check directories
requiredDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.error(`Missing directory: ${dir}`);
    allGood = false;
  }
});

// Check files
requiredFiles.forEach((file) => {
  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${file}`);
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
  console.log('\nWorkflow system ready!');
} else {
  console.error('\nWorkflow system needs initialization. Fix the issues above.');
  process.exit(1);
}
