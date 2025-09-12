#!/usr/bin/env node

const { execSync } = require('child_process');

function checkGit() {
  console.log('Checking Git configuration...\n');

  const checks = {
    initialized: false,
    userName: false,
    userEmail: false,
    cleanWorkingDir: false,
    onBranch: false,
  };

  try {
    // Check if git is initialized
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    checks.initialized = true;
    console.log('Git repository initialized');

    // Check user name
    try {
      const userName = execSync('git config user.name', { encoding: 'utf8' }).trim();
      if (userName) {
        checks.userName = true;
        console.log(`User name: ${userName}`);
      }
    } catch (e) {
      console.log('User name not configured');
      console.log('   Fix: git config user.name "Your Name"');
    }

    // Check user email
    try {
      const userEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
      if (userEmail) {
        checks.userEmail = true;
        console.log(`User email: ${userEmail}`);
      }
    } catch (e) {
      console.log('User email not configured');
      console.log('   Fix: git config user.email "your.email@example.com"');
    }

    // Check working directory status
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim() === '') {
        checks.cleanWorkingDir = true;
        console.log('Working directory clean');
      } else {
        console.log('Working directory has uncommitted changes');
        console.log('   Consider committing before creating new branches');
      }
    } catch (e) {
      console.log('Could not check working directory status');
    }

    // Check current branch
    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      if (branch) {
        checks.onBranch = true;
        console.log(`On branch: ${branch}`);
      } else {
        console.log(' Not on any branch (detached HEAD state)');
      }
    } catch (e) {
      console.log('Could not determine current branch');
    }
  } catch (error) {
    console.log('Not a git repository');
    console.log('   Fix: git init');
    return false;
  }

  const allChecks = Object.values(checks);
  const requiredChecks = [checks.initialized, checks.userName, checks.userEmail];

  if (requiredChecks.every((c) => c)) {
    console.log('\nGit is properly configured for workflow');
    return true;
  } else {
    console.log('\nGit configuration incomplete');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  const isConfigured = checkGit();
  process.exit(isConfigured ? 0 : 1);
}

module.exports = { checkGit };
