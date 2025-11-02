#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getFilePath, getConfig } = require('../utils/config-loader');
const runScript = require('../utils/run-script');

/**
 * Unified Workflow Command Processor
 * Handles all workflow commands in a consistent manner
 */

// Parse command from arguments
const args = process.argv.slice(2);
const fullCommand = args.join(' ');

console.log('🔧 Processing workflow command...\n');
console.log(`Command: ${fullCommand}\n`);

// Command patterns
const commands = {
  // Technical planning
  'plan technical approach for: feature:': {
    handler: 'planTechnicalFeature',
    regex: /plan technical approach for:\s*feature:\s*(.+)/i,
  },
  'plan technical approach for: issue:': {
    handler: 'planTechnicalIssue',
    regex: /plan technical approach for:\s*issue:\s*(.+)/i,
  },

  // PRP generation
  'feature-prp required:': {
    handler: 'generateFeaturePRP',
    regex: /feature-prp required:\s*(.+)/i,
  },
  'issue-prp required:': {
    handler: 'generateIssuePRP',
    regex: /issue-prp required:\s*(.+)/i,
  },

  // Implementation
  'implement feature-prp tasks from:': {
    handler: 'implementFeaturePRPTasks',
    regex: /implement feature-prp tasks from:\s*(.+)/i,
  },
  'implement issue-prp tasks from:': {
    handler: 'implementIssuePRPTasks',
    regex: /implement issue-prp tasks from:\s*(.+)/i,
  },

  // Quick notes
  'quick note feature:': {
    handler: 'quickNoteFeature',
    regex: /quick note feature:\s*(.+)/i,
  },
  'quick note issue:': {
    handler: 'quickNoteIssue',
    regex: /quick note issue:\s*(.+)/i,
  },

  // Validation
  'validate feature:': {
    handler: 'validateFeature',
    regex: /validate feature:\s*(.+)/i,
  },
  'validate issue:': {
    handler: 'validateIssue',
    regex: /validate issue:\s*(.+)/i,
  },

  // Task completion validation
  'validate task:': {
    handler: 'validateTask',
    regex: /validate task:\s*(.+)/i,
  },

  // Feature/Issue completion
  'mark feature complete:': {
    handler: 'markFeatureComplete',
    regex: /mark feature complete:\s*(.+)/i,
  },
  'mark issue fixed:': {
    handler: 'markIssueFixed',
    regex: /mark issue fixed:\s*(.+)/i,
  },

  // PR checks
  'run pr checks for:': {
    handler: 'runPRChecks',
    regex: /run pr checks for:\s*(.+)/i,
  },
};

// Command handlers
const handlers = {
  planTechnicalFeature(name) {
    console.log(`📋 Creating technical plan for feature: ${name}\n`);

    const planPath = getFilePath('feature', 'technicalPlan', name);

    if (fs.existsSync(planPath)) {
      console.log(`⚠️ Technical plan already exists at: ${planPath}`);
      console.log('Edit the existing plan or create with a different name.');
      return;
    }

    const template = `# Technical Plan: ${name}

## Type: Feature

## Executive Summary
[2-3 sentences describing the minimal solution approach]

## Scope Definition
### What We're Building
- [Essential functionality only]
- [No legacy fallback unless explicitly requested]

### What We're NOT Building
- [Future features]
- [Backwards compatibility unless required]
- [Nice-to-haves]

## Technical Architecture
### Files to Modify
/src/[path/file.ts] - [Specific changes needed]

### Files to Create
/src/[path/new-file.ts] - [Purpose and contents]

### Database Changes
- [Schema modifications if any]
- [Migration requirements]

## Implementation Details
### Core Functions
\`\`\`typescript
// Function: functionName
// Purpose: [What it does]
// Location: /src/[path]
functionName(params: Types): ReturnType
\`\`\`

### API Endpoints
\`\`\`typescript
// tRPC Procedure: procedureName
// Purpose: [What it does]
// Input: [Schema description]
// Output: [Return type]
\`\`\`

## Test Coverage Strategy
### Unit Tests
- should [behavior] - [Test description]

### Integration Tests
- API: [endpoint] returns [data] - [What to verify]

### E2E Tests
- User can [action] - [User flow to test]

## Implementation Sequence
1. Phase 1: Foundation
   - [First thing to implement]
   - [Test to write]

2. Phase 2: Core Logic
   - [Implementation step]
   - [Test to write]

3. Phase 3: Integration
   - [Final connections]
   - [Integration tests]

## Risk Assessment
- Technical Risk: [Any identified risks]
- Performance Impact: [Expected impact]
- Breaking Changes: [Any breaking changes]

## Code Quality Requirements
[ ] No legacy fallback code
[ ] Minimal implementation only
[ ] Each code block must pass linting
[ ] Each code block must compile
[ ] Tests written before next code block
[ ] No backwards compatibility unless requested
`;

    fs.writeFileSync(planPath, template);
    console.log(`✅ Created technical plan at: ${planPath}`);
    console.log('\nNext steps:');
    console.log('1. Edit the technical plan with your analysis');
    console.log(`2. Generate PRP: feature-prp required: ${name}`);
  },

  planTechnicalIssue(name) {
    console.log(`🐛 Creating technical plan for issue: ${name}\n`);

    const planPath = path.join('workflow', 'technical-plans', `${name}-technical-plan.md`);

    if (fs.existsSync(planPath)) {
      console.log(`⚠️ Technical plan already exists at: ${planPath}`);
      return;
    }

    const template = `# Technical Plan: ${name}

## Type: Issue

## Problem Analysis
[Detailed analysis of the issue]

## Root Cause
[Identified root cause from investigation]

## Impact Assessment
- User Impact: [Critical/High/Medium/Low]
- Business Impact: [Description]
- Technical Impact: [Description]

## Fix Strategy
### Immediate Fix
- [What needs to be fixed right now]

### Long-term Solution
- [Preventive measures]

## Technical Implementation
### Files to Modify
/src/[path/file.ts] - [Specific fix needed]

### Code Changes
\`\`\`typescript
// Before (problematic code)

// After (fixed code)
\`\`\`

## Test Coverage
### Regression Tests
- Verify [issue doesn't recur]

### Edge Cases
- Test [edge case scenarios]

## Rollback Plan
- How to revert if fix causes problems

## Prevention Strategy
- Code patterns to avoid
- Review checklist updates
`;

    fs.writeFileSync(planPath, template);
    console.log(`✅ Created technical plan at: ${planPath}`);
    console.log('\nNext steps:');
    console.log('1. Edit the technical plan with root cause analysis');
    console.log(`2. Generate Issue PRP: issue-prp required: ${name}`);
  },

  generateFeaturePRP(name) {
    console.log(`📝 Generating PRP for feature: ${name}\n`);

    try {
      execSync(`node scripts/workflow/generate-prp.js create ${name} feature`, {
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('❌ Failed to generate PRP');
      process.exit(1);
    }
  },

  generateIssuePRP(name) {
    console.log(`🐛 Generating Issue PRP for: ${name}\n`);

    try {
      execSync(`node scripts/workflow/generate-prp.js create ${name} issue`, {
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('❌ Failed to generate Issue PRP');
      process.exit(1);
    }
  },

  implementFeaturePRPTasks(fileName) {
    console.log(`🚀 Implementing Feature PRP tasks from: ${fileName}\n`);

    const featuresDir = getConfig('paths.features');
    const tasksPath = path.join(featuresDir, fileName);

    if (!fs.existsSync(tasksPath)) {
      console.error(`❌ Tasks file not found at: ${tasksPath}`);
      process.exit(1);
    }

    console.log('📋 Tasks file found.');
    console.log('\n🔍 Running pre-implementation validation...\n');

    // Run pre-implementation checks automatically
    try {
      runScript('validate:pre', { stdio: 'inherit' });
      console.log('\n✅ Pre-implementation checks passed!');
    } catch (error) {
      console.error('\n❌ Pre-implementation checks failed. Fix issues before proceeding.');
      process.exit(1);
    }

    console.log('\n📋 Ready for implementation.');
    console.log('\nImplementation guidance:');
    console.log('1. Work through tasks sequentially');
    console.log('2. Run validation after each phase: npm run validate:task');
    console.log('3. Commit after each major milestone');
    console.log('4. Run full validation when complete: npm run validate:all');
  },

  implementIssuePRPTasks(fileName) {
    console.log(`🐛 Implementing Issue PRP tasks from: ${fileName}\n`);

    const issuesDir = getConfig('paths.issues');
    const tasksPath = path.join(issuesDir, fileName);

    if (!fs.existsSync(tasksPath)) {
      console.error(`❌ Tasks file not found at: ${tasksPath}`);
      process.exit(1);
    }

    console.log('📋 Issue tasks file found.');
    console.log('\n🔍 Running pre-implementation validation...\n');

    // Run pre-implementation checks automatically
    try {
      runScript('validate:pre', { stdio: 'inherit' });
      console.log('\n✅ Pre-implementation checks passed!');
    } catch (error) {
      console.error('\n❌ Pre-implementation checks failed. Fix issues before proceeding.');
      process.exit(1);
    }

    console.log('\n📋 Ready for implementation.');
    console.log('\nImplementation guidance:');
    console.log('1. Reproduce the issue first');
    console.log('2. Implement fix following tasks');
    console.log('3. Verify fix resolves issue');
    console.log('4. Run regression tests');
    console.log('5. Validate: npm run validate:all');
  },

  quickNoteFeature(note) {
    console.log(`📝 Adding quick feature note: ${note}\n`);

    const backlogPath = path.join('workflow', 'backlog.md');

    if (!fs.existsSync(backlogPath)) {
      console.error('❌ Backlog file not found');
      process.exit(1);
    }

    const backlog = fs.readFileSync(backlogPath, 'utf8');
    const date = new Date().toISOString().split('T')[0];

    const noteEntry = `\n- **${date}**: ${note}`;

    const updatedBacklog = backlog.replace(
      '## Quick Feature Notes\n<!-- Feature ideas captured quickly for later specification -->',
      `## Quick Feature Notes\n<!-- Feature ideas captured quickly for later specification -->${noteEntry}`
    );

    fs.writeFileSync(backlogPath, updatedBacklog);
    console.log('✅ Added to quick feature notes in backlog');
  },

  quickNoteIssue(note) {
    console.log(`🐛 Adding quick issue note: ${note}\n`);

    const backlogPath = path.join('workflow', 'backlog.md');

    if (!fs.existsSync(backlogPath)) {
      console.error('❌ Backlog file not found');
      process.exit(1);
    }

    const backlog = fs.readFileSync(backlogPath, 'utf8');
    const date = new Date().toISOString().split('T')[0];

    const noteEntry = `\n- **${date}**: ${note}`;

    const updatedBacklog = backlog.replace(
      '## Quick Issue Notes\n<!-- Issues noted quickly for later investigation -->',
      `## Quick Issue Notes\n<!-- Issues noted quickly for later investigation -->${noteEntry}`
    );

    fs.writeFileSync(backlogPath, updatedBacklog);
    console.log('✅ Added to quick issue notes in backlog');
  },

  validateFeature(name) {
    console.log(`✅ Validating feature: ${name}\n`);

    try {
      execSync(`node workflow/scripts/run-all-validations.js ${name}`, {
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('❌ Validation failed');
      process.exit(1);
    }
  },

  validateIssue(name) {
    console.log(`✅ Validating issue fix: ${name}\n`);

    try {
      execSync(`node workflow/scripts/run-all-validations.js ${name}`, {
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('❌ Validation failed');
      process.exit(1);
    }
  },

  validateTask(taskName) {
    console.log(`🔍 Running post-task validation for: ${taskName}\n`);
    console.log('This checks: build, types, lint, code quality\n');

    const autoValidate = getConfig('validation.automate.taskValidation', true);

    if (!autoValidate) {
      console.log('⚠️  Task validation is disabled in config');
      console.log(
        'To enable: Set validation.automate.taskValidation = true in /workflow/config.json'
      );
      return;
    }

    try {
      runScript('validate:task', { stdio: 'inherit' });
      console.log('\n✅ Task validation passed - ready to mark complete');
    } catch (error) {
      console.log('\n❌ Task validation failed');
      const allowSkip = getConfig('validation.allowSkip.taskValidation', true);

      if (allowSkip) {
        console.log('\nOptions:');
        console.log('  1. Fix issues and run validation again');
        console.log('  2. Skip validation (not recommended) - proceed anyway');
        console.log('  3. Review errors and decide');
      } else {
        console.log('\nFix issues before proceeding.');
        process.exit(1);
      }
    }
  },

  markFeatureComplete(featureName) {
    console.log('⚠️  DEPRECATED: This command is for manual validation only.');
    console.log('The "implement" command automatically runs all validations.\n');
    console.log(`✅ Marking feature as complete: ${featureName}\n`);

    const autoValidate = getConfig('validation.automate.integrationValidation', 'prompt');

    if (autoValidate === 'prompt' || autoValidate === true) {
      console.log('Feature marked as complete.');
      console.log('Running comprehensive integration validation...');
      console.log('This may take 2-5 minutes and includes:');
      console.log('  • Build verification');
      console.log('  • API endpoint validation');
      console.log('  • Security checks');
      console.log('  • Performance analysis');
      console.log('  • Circular dependency detection\n');

      try {
        runScript('validate:integration', { stdio: 'inherit' });
        console.log('\n✅ Integration validation passed');
        console.log('Feature is ready for PR creation');
        console.log('\nTo run PR checks, run: run pr checks for: ' + featureName);
      } catch (error) {
        console.log('\n⚠️  Integration validation found issues');
        console.log('Review warnings before creating PR');
        console.log('Non-critical warnings may be acceptable');
      }
    } else {
      console.log('Integration validation disabled in config.');
      console.log('To validate manually, run: npm run validate:integration ' + featureName);
    }
  },

  markIssueFixed(issueName) {
    console.log('⚠️  DEPRECATED: This command is for manual validation only.');
    console.log('The "implement" command automatically runs all validations.\n');
    console.log(`✅ Marking issue as fixed: ${issueName}\n`);

    const autoValidate = getConfig('validation.automate.issueValidation', 'prompt');

    if (autoValidate === 'prompt' || autoValidate === true) {
      console.log('Issue fix marked as complete.');
      console.log('Running issue fix integration validation...');
      console.log('This checks for:');
      console.log('  • Regression prevention');
      console.log('  • Security issues in fix');
      console.log('  • Performance impact');
      console.log('  • Related functionality\n');

      try {
        runScript('validate:issue', { stdio: 'inherit' });
        console.log('\n✅ Issue fix validation passed');
        console.log('Remember to manually verify fix using Issue PRP reproduction steps');
        console.log('\nTo run PR checks, run: run pr checks for: ' + issueName);
      } catch (error) {
        console.log('\n⚠️  Issue fix validation found concerns');
        console.log('Review before closing issue');
      }
    } else {
      console.log('Issue validation disabled in config.');
      console.log('To validate manually, run: npm run validate:issue ' + issueName);
    }
  },

  runPRChecks(featureName) {
    console.log('⚠️  DEPRECATED: This command is for manual validation only.');
    console.log('The "implement" command automatically runs all validations.\n');
    console.log(`🚀 Running PR checks for: ${featureName}\n`);

    const autoValidate = getConfig('validation.automate.allValidation', 'prompt');

    if (autoValidate === 'prompt' || autoValidate === true) {
      console.log('Running complete validation suite before PR...');
      console.log('This runs ALL validations and may take 3-7 minutes\n');

      try {
        runScript('validate:all', { stdio: 'inherit' });
        console.log('\n✅ All validations passed - PR can be created');
        console.log('\nNext: Use GitHub CLI or UI to create PR');
        console.log('Example: gh pr create --title "Feature: ' + featureName + '"');
      } catch (error) {
        console.log('\n❌ Validation suite failed');
        console.log('Fix critical issues before creating PR');
        process.exit(1);
      }
    } else {
      console.log('Complete validation disabled in config.');
      console.log('Creating PR without full validation suite...');
      console.log('\n⚠️  Consider running: npm run validate:all ' + featureName);
    }
  },
};

// Process command
let commandProcessed = false;

for (const [commandPattern, config] of Object.entries(commands)) {
  const match = fullCommand.match(config.regex);

  if (match) {
    const parameter = match[1].trim();
    const handlerFunc = handlers[config.handler];

    if (handlerFunc) {
      handlerFunc(parameter);
      commandProcessed = true;
      break;
    }
  }
}

if (!commandProcessed) {
  console.error('❌ Unrecognized command format\n');
  console.log('Available commands:');
  console.log('\nPlanning:');
  console.log('  plan technical approach for: feature: <name>');
  console.log('  plan technical approach for: issue: <name>');
  console.log('\nPRP Generation:');
  console.log('  feature-prp required: <name>');
  console.log('  issue-prp required: <name>');
  console.log('\nImplementation:');
  console.log('  implement feature-prp tasks from: <filename>');
  console.log('  implement issue-prp tasks from: <filename>');
  console.log('\nQuick Notes:');
  console.log('  quick note feature: <note>');
  console.log('  quick note issue: <note>');
  console.log('\nValidation:');
  console.log('  validate feature: <name>');
  console.log('  validate issue: <name>');
  process.exit(1);
}
