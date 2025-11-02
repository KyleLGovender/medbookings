#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PatternManager {
  constructor() {
    this.baseDir = path.join(__dirname, '../../');
    this.patternsDir = path.join(this.baseDir, 'patterns');
    this.stagingDir = path.join(this.patternsDir, 'staging');
    this.archiveDir = path.join(this.patternsDir, 'archive');
    this.referenceDir = path.join(this.baseDir, 'reference/code-patterns');

    // Pattern categories
    this.categories = {
      api: 'api-patterns.md',
      component: 'component-patterns.md',
      hook: 'hook-patterns.md',
      validation: 'validation-patterns.md',
      antipattern: 'anti-patterns.md',
    };
  }

  async ensureDirectories() {
    const dirs = [this.patternsDir, this.stagingDir, this.archiveDir, this.referenceDir];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Auto-detect patterns from recently modified files
  async autoDetect() {
    console.log('🔍 Auto-detecting patterns from recent changes...\n');

    try {
      // Get recently modified TypeScript/TSX files
      const { stdout } = await execPromise(
        'git diff --name-only HEAD~1 HEAD -- "*.ts" "*.tsx" | head -20'
      );

      const files = stdout.trim().split('\n').filter(Boolean);

      if (files.length === 0) {
        console.log('No recently modified files found.');
        return;
      }

      console.log(`Found ${files.length} recently modified files:`);
      files.forEach((file) => console.log(`  - ${file}`));
      console.log();

      const patterns = [];

      for (const file of files) {
        const fullPath = path.join(process.cwd(), file);

        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const extracted = await this.extractPatternsFromFile(file, content);
          patterns.push(...extracted);
        } catch (error) {
          console.warn(`  ⚠️  Could not read ${file}: ${error.message}`);
        }
      }

      if (patterns.length > 0) {
        await this.savePatternsToStaging(patterns);
        console.log(`\n✅ Extracted ${patterns.length} patterns to staging`);
        console.log('   Run "npm run patterns:review" to review them');
      } else {
        console.log('\nNo new patterns detected');
      }
    } catch (error) {
      console.error('Error during auto-detection:', error.message);
    }
  }

  // Extract patterns from a specific file/feature
  async extract(featureName) {
    console.log(`📤 Extracting patterns${featureName ? ` from ${featureName}` : ''}...\n`);

    const patterns = [];

    if (featureName) {
      // Extract from specific feature
      const featurePaths = [
        `src/features/${featureName}`,
        `src/server/api/routers/${featureName}.ts`,
        `src/app/**/*${featureName}*/**/*.tsx`,
      ];

      for (const pattern of featurePaths) {
        try {
          const { stdout } = await execPromise(`find . -path "./${pattern}" -type f 2>/dev/null`);
          const files = stdout.trim().split('\n').filter(Boolean);

          for (const file of files) {
            const content = await fs.readFile(file, 'utf8');
            const extracted = await this.extractPatternsFromFile(file, content);
            patterns.push(...extracted);
          }
        } catch (error) {
          // Path might not exist, continue
        }
      }
    } else {
      // Extract from all staged files
      try {
        const { stdout } = await execPromise('git diff --cached --name-only -- "*.ts" "*.tsx"');
        const files = stdout.trim().split('\n').filter(Boolean);

        for (const file of files) {
          const content = await fs.readFile(file, 'utf8');
          const extracted = await this.extractPatternsFromFile(file, content);
          patterns.push(...extracted);
        }
      } catch (error) {
        console.error('Error extracting from staged files:', error.message);
      }
    }

    if (patterns.length > 0) {
      await this.savePatternsToStaging(patterns);
      console.log(`✅ Extracted ${patterns.length} patterns to staging`);
      console.log('   Run "npm run patterns:review" to review them');
    } else {
      console.log('No patterns found to extract');
    }
  }

  // Extract patterns from file content
  async extractPatternsFromFile(filePath, content) {
    const patterns = [];

    // Detect tRPC procedures
    if (content.includes('Procedure') && content.includes('.input(')) {
      const procedureMatch = content.match(/(\w+):\s*\w+Procedure[\s\S]*?\.(?:query|mutation)\(/g);

      if (procedureMatch) {
        patterns.push({
          type: 'api',
          name: 'tRPC Procedure Pattern',
          source: filePath,
          pattern: procedureMatch[0],
          category: 'api',
        });
      }
    }

    // Detect React components with hooks
    if (content.includes('export function') && content.includes('use')) {
      const componentMatch = content.match(
        /export\s+function\s+\w+.*?\{[\s\S]*?(?:use\w+)[\s\S]*?return[\s\S]*?\}/
      );

      if (componentMatch) {
        patterns.push({
          type: 'component',
          name: 'Component with Hooks Pattern',
          source: filePath,
          pattern: componentMatch[0].slice(0, 500), // Limit size
          category: 'component',
        });
      }
    }

    // Detect custom hooks
    if (content.match(/export\s+function\s+use\w+/)) {
      const hookMatch = content.match(/export\s+function\s+use\w+.*?\{[\s\S]*?return[\s\S]*?\}/);

      if (hookMatch) {
        patterns.push({
          type: 'hook',
          name: 'Custom Hook Pattern',
          source: filePath,
          pattern: hookMatch[0].slice(0, 500),
          category: 'hook',
        });
      }
    }

    // Detect Zod schemas
    if (content.includes('z.object') || content.includes('z.union')) {
      const schemaMatch = content.match(
        /export\s+const\s+\w+Schema\s*=\s*z\.(?:object|union)[\s\S]*?\}\)/
      );

      if (schemaMatch) {
        patterns.push({
          type: 'validation',
          name: 'Zod Schema Pattern',
          source: filePath,
          pattern: schemaMatch[0],
          category: 'validation',
        });
      }
    }

    return patterns;
  }

  // Save patterns to staging directory
  async savePatternsToStaging(patterns) {
    const timestamp = new Date().toISOString().split('T')[0];
    const stagingFile = path.join(this.stagingDir, `patterns-${timestamp}.json`);

    await fs.writeFile(stagingFile, JSON.stringify(patterns, null, 2), 'utf8');

    return stagingFile;
  }

  // Review patterns in staging
  async review() {
    console.log('📋 Reviewing patterns in staging...\n');

    try {
      const files = await fs.readdir(this.stagingDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      if (jsonFiles.length === 0) {
        console.log('No patterns in staging to review');
        return;
      }

      console.log(`Found ${jsonFiles.length} staging file(s):\n`);

      for (const file of jsonFiles) {
        const filePath = path.join(this.stagingDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const patterns = JSON.parse(content);

        console.log(`📄 ${file}:`);
        console.log(`   Patterns: ${patterns.length}`);

        // Group by category
        const byCategory = patterns.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {});

        Object.entries(byCategory).forEach(([cat, count]) => {
          console.log(`   - ${cat}: ${count}`);
        });

        console.log('\n   Sample patterns:');
        patterns.slice(0, 3).forEach((p) => {
          console.log(`   • ${p.name} (from ${p.source})`);
        });
        console.log();
      }

      console.log('To approve these patterns, run: npm run patterns:approve');
      console.log('To clean old patterns, run: npm run patterns:clean');
    } catch (error) {
      console.error('Error reviewing patterns:', error.message);
    }
  }

  // Approve patterns and move to reference
  async approve() {
    console.log('✅ Approving patterns from staging...\n');

    try {
      const files = await fs.readdir(this.stagingDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      if (jsonFiles.length === 0) {
        console.log('No patterns in staging to approve');
        return;
      }

      let totalApproved = 0;

      for (const file of jsonFiles) {
        const filePath = path.join(this.stagingDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const patterns = JSON.parse(content);

        // Group patterns by category
        const byCategory = {};
        patterns.forEach((p) => {
          if (!byCategory[p.category]) {
            byCategory[p.category] = [];
          }
          byCategory[p.category].push(p);
        });

        // Append to respective pattern files
        for (const [category, categoryPatterns] of Object.entries(byCategory)) {
          const targetFile = path.join(this.referenceDir, this.categories[category]);

          // Read existing content or create new
          let existingContent = '';
          try {
            existingContent = await fs.readFile(targetFile, 'utf8');
          } catch (error) {
            // File doesn't exist, create header
            existingContent = `# ${category.charAt(0).toUpperCase() + category.slice(1)} Patterns\n\n`;
          }

          // Append new patterns
          const newContent = categoryPatterns
            .map((p) => {
              const date = new Date().toISOString().split('T')[0];
              return `
## ${p.name}
**Source:** ${p.source}
**Added:** ${date}

\`\`\`typescript
${p.pattern}
\`\`\`
`;
            })
            .join('\n');

          await fs.writeFile(targetFile, existingContent + newContent, 'utf8');

          totalApproved += categoryPatterns.length;
        }

        // Archive the processed staging file
        const archivePath = path.join(this.archiveDir, `approved-${file}`);
        await fs.rename(filePath, archivePath);
      }

      console.log(`✅ Approved ${totalApproved} patterns`);
      console.log(`   Staging files archived to: ${this.archiveDir}`);
    } catch (error) {
      console.error('Error approving patterns:', error.message);
    }
  }

  // Clean old or obsolete patterns
  async clean() {
    console.log('🧹 Cleaning old patterns...\n');

    try {
      // Clean old staging files (older than 7 days)
      const stagingFiles = await fs.readdir(this.stagingDir);
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      let cleanedCount = 0;

      for (const file of stagingFiles) {
        const filePath = path.join(this.stagingDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > sevenDays) {
          const archivePath = path.join(this.archiveDir, `expired-${file}`);
          await fs.rename(filePath, archivePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`📦 Archived ${cleanedCount} old staging file(s)`);
      }

      // Clean archived files older than 30 days
      const archiveFiles = await fs.readdir(this.archiveDir);
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of archiveFiles) {
        const filePath = path.join(this.archiveDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > thirtyDays) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`🗑️  Deleted ${deletedCount} old archive file(s)`);
      }

      if (cleanedCount === 0 && deletedCount === 0) {
        console.log('Nothing to clean');
      }
    } catch (error) {
      console.error('Error cleaning patterns:', error.message);
    }
  }

  // List all available patterns
  async list() {
    console.log('📚 Available Patterns:\n');

    try {
      // List reference patterns
      console.log('=== Reference Patterns ===\n');
      const referenceFiles = await fs.readdir(this.referenceDir);

      for (const file of referenceFiles) {
        if (file.endsWith('.md')) {
          const filePath = path.join(this.referenceDir, file);
          const content = await fs.readFile(filePath, 'utf8');

          // Count patterns (by counting ## headers)
          const patternCount = (content.match(/^##\s+[^#]/gm) || []).length;

          console.log(`📄 ${file}`);
          console.log(`   Patterns: ${patternCount}`);

          // Extract pattern names
          const patternNames = content.match(/^##\s+([^#\n]+)/gm) || [];
          if (patternNames.length > 0) {
            console.log('   Recent:');
            patternNames.slice(-3).forEach((name) => {
              console.log(`   • ${name.replace('## ', '')}`);
            });
          }
          console.log();
        }
      }

      // List staging patterns
      const stagingFiles = await fs.readdir(this.stagingDir);
      if (stagingFiles.length > 0) {
        console.log('=== Staging Patterns (awaiting review) ===\n');

        for (const file of stagingFiles.filter((f) => f.endsWith('.json'))) {
          const filePath = path.join(this.stagingDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const patterns = JSON.parse(content);

          console.log(`📝 ${file}`);
          console.log(`   Patterns: ${patterns.length}`);
          console.log(`   Status: Awaiting review`);
          console.log();
        }

        console.log('Run "npm run patterns:review" to review staging patterns');
      }
    } catch (error) {
      console.error('Error listing patterns:', error.message);
    }
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  const argument = process.argv[3];

  const manager = new PatternManager();
  await manager.ensureDirectories();

  switch (command) {
    case 'auto-detect':
      await manager.autoDetect();
      break;

    case 'extract':
      await manager.extract(argument);
      break;

    case 'review':
      await manager.review();
      break;

    case 'approve':
      await manager.approve();
      break;

    case 'clean':
      await manager.clean();
      break;

    case 'list':
      await manager.list();
      break;

    default:
      console.log('Pattern Management Tool\n');
      console.log('Usage: node update-patterns.js <command> [argument]\n');
      console.log('Commands:');
      console.log('  auto-detect     - Auto-detect patterns from recent changes');
      console.log('  extract [name]  - Extract patterns from feature or staged files');
      console.log('  review          - Review patterns in staging');
      console.log('  approve         - Approve staged patterns to reference');
      console.log('  clean           - Clean old patterns');
      console.log('  list            - List all available patterns');
      console.log('\nExamples:');
      console.log('  npm run patterns:auto');
      console.log('  npm run patterns:extract user-auth');
      console.log('  npm run patterns:review');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = { PatternManager };
