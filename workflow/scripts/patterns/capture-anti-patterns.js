#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Anti-Pattern Capture System
 *
 * Captures anti-patterns from fixed issues by analyzing:
 * - Git diffs showing before/after code
 * - Commit messages explaining the fix
 * - Related test changes
 *
 * This is more valuable than capturing raw errors because it documents
 * the SOLUTION, not just the problem.
 */
class AntiPatternCapture {
  constructor() {
    this.antiPatternsFile = path.join(__dirname, '../../reference/code-patterns/anti-patterns.md');
  }

  async captureFromIssue(issueName) {
    console.log(`\n📋 Capturing anti-patterns from fixed issue: ${issueName}\n`);

    try {
      // Get the most recent commits related to this issue
      const { stdout: logOutput } = await execPromise(
        `git log --all --grep="${issueName}" --format="%H|%s|%an|%ad" --date=short -10`
      );

      if (!logOutput.trim()) {
        console.log(`⚠️  No commits found mentioning "${issueName}"`);
        console.log('Tip: Commit messages should reference the issue name');
        return;
      }

      const commits = logOutput
        .trim()
        .split('\n')
        .map((line) => {
          const [hash, subject, author, date] = line.split('|');
          return { hash, subject, author, date };
        });

      console.log(`Found ${commits.length} related commit(s):\n`);
      commits.forEach((commit, i) => {
        console.log(`  ${i + 1}. ${commit.subject}`);
        console.log(`     ${commit.hash.substring(0, 7)} by ${commit.author} on ${commit.date}`);
      });

      // Analyze the most recent commit (likely the fix)
      const fixCommit = commits[0];
      console.log(`\n🔍 Analyzing fix commit: ${fixCommit.hash.substring(0, 7)}\n`);

      // Get the diff
      const { stdout: diffOutput } = await execPromise(
        `git show ${fixCommit.hash} --format="" --unified=5`
      );

      // Parse the diff to find problem patterns
      const patterns = this.extractPatternsFromDiff(diffOutput, fixCommit, issueName);

      if (patterns.length > 0) {
        await this.saveAntiPatterns(patterns, issueName);
        console.log(`\n✅ Captured ${patterns.length} anti-pattern(s) from issue fix`);
        console.log(`   Saved to: ${this.antiPatternsFile}\n`);
      } else {
        console.log('\n⚠️  No clear anti-patterns identified from the diff');
        console.log('The changes may be too complex or not follow a clear before/after pattern\n');
      }
    } catch (error) {
      console.error('\n❌ Error capturing anti-patterns:', error.message);
      console.error('Make sure git is available and the issue name is correct\n');
    }
  }

  extractPatternsFromDiff(diffOutput, commit, issueName) {
    const patterns = [];
    const files = diffOutput.split('diff --git');

    files.forEach((fileDiff) => {
      if (!fileDiff.trim()) return;

      // Extract file path
      const fileMatch = fileDiff.match(/b\/(.*?)(?:\n|$)/);
      if (!fileMatch) return;
      const filePath = fileMatch[1];

      // Only analyze code files
      if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;

      // Extract removed (bad) and added (good) code
      const lines = fileDiff.split('\n');
      let removedBlock = [];
      let addedBlock = [];
      let inChange = false;

      lines.forEach((line) => {
        if (line.startsWith('@@')) {
          // If we have a previous change, save it
          if (removedBlock.length > 0 && addedBlock.length > 0) {
            patterns.push({
              file: filePath,
              badCode: removedBlock.join('\n'),
              goodCode: addedBlock.join('\n'),
              commit: commit.hash.substring(0, 7),
            });
          }
          removedBlock = [];
          addedBlock = [];
          inChange = true;
        } else if (inChange) {
          if (line.startsWith('-') && !line.startsWith('---')) {
            removedBlock.push(line.substring(1));
          } else if (line.startsWith('+') && !line.startsWith('+++')) {
            addedBlock.push(line.substring(1));
          }
        }
      });

      // Save the last change
      if (removedBlock.length > 0 && addedBlock.length > 0) {
        patterns.push({
          file: filePath,
          badCode: removedBlock.join('\n'),
          goodCode: addedBlock.join('\n'),
          commit: commit.hash.substring(0, 7),
        });
      }
    });

    return patterns;
  }

  async saveAntiPatterns(patterns, issueName) {
    let content = await fs
      .readFile(this.antiPatternsFile, 'utf-8')
      .catch(() => '# Anti-Patterns to Avoid\n\nLearned from fixed issues.\n\n');

    const timestamp = new Date().toISOString().split('T')[0];

    content += `\n## Issue: ${issueName} (Fixed ${timestamp})\n\n`;

    patterns.forEach((pattern, index) => {
      content += `### Pattern ${index + 1} - ${pattern.file}\n\n`;
      content += `**Commit:** \`${pattern.commit}\`\n\n`;
      content += `**❌ Don't do this (before):**\n`;
      content += `\`\`\`typescript\n${pattern.badCode}\n\`\`\`\n\n`;
      content += `**✅ Do this instead (after):**\n`;
      content += `\`\`\`typescript\n${pattern.goodCode}\n\`\`\`\n\n`;
      content += `---\n\n`;
    });

    await fs.writeFile(this.antiPatternsFile, content);
  }
}

// CLI Usage
async function main() {
  const capture = new AntiPatternCapture();
  const command = process.argv[2];
  const argument = process.argv[3];

  if (!command || command === 'help' || command === '--help') {
    console.log('\nAnti-Pattern Capture - Learn from fixed issues\n');
    console.log('Usage:');
    console.log('  npm run antipatterns:from-issue -- <issue-name>');
    console.log('  node capture-anti-patterns.js from-issue <issue-name>\n');
    console.log('Example:');
    console.log('  npm run antipatterns:from-issue -- infinite-loop-bug\n');
    console.log('This will:');
    console.log('  1. Find commits mentioning the issue name');
    console.log('  2. Analyze the git diff showing the fix');
    console.log('  3. Extract before/after code patterns');
    console.log('  4. Save to workflow/reference/code-patterns/anti-patterns.md\n');
    return;
  }

  if (command === 'from-issue' || command === 'issue') {
    if (!argument) {
      console.error('\n❌ Error: Issue name required\n');
      console.log('Usage: npm run antipatterns:from-issue -- <issue-name>');
      console.log('Example: npm run antipatterns:from-issue -- infinite-loop-bug\n');
      process.exit(1);
    }
    await capture.captureFromIssue(argument);
  } else {
    console.error(`\n❌ Unknown command: ${command}\n`);
    console.log('Run with --help for usage information\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { AntiPatternCapture };
