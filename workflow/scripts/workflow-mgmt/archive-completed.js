#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../utils/config-loader');

/**
 * Archive Completed Work Script
 * Moves completed PRP files and technical plans to the archive folder
 * Maintains history and keeps active folders clean
 */

const config = loadConfig();

/**
 * Archive a completed feature or issue
 * @param {string} name - The feature/issue name
 * @param {string} type - 'feature' or 'issue'
 * @param {boolean} includeTaskFile - Whether to archive the tasks file too
 */
function archiveCompleted(name, type, includeTaskFile = true) {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  // Create year/month subdirectories in archive
  const archiveDir = path.join('workflow', 'archive', year.toString(), month);
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
    console.log(`📁 Created archive directory: ${archiveDir}`);
  }

  const sourcePaths = {
    feature: {
      prp: path.join('workflow', 'prps', 'features', `${name}-feature-prp.md`),
      tasks: path.join('workflow', 'prps', 'features', `${name}-feature-prp-tasks.md`),
      technicalPlan: path.join('workflow', 'technical-plans', `${name}-technical-plan.md`),
    },
    issue: {
      prp: path.join('workflow', 'prps', 'issues', `${name}-issue-prp.md`),
      tasks: path.join('workflow', 'prps', 'issues', `${name}-issue-prp-tasks.md`),
      technicalPlan: path.join('workflow', 'technical-plans', `${name}-technical-plan.md`),
    },
  };

  const destPaths = {
    prp: path.join(archiveDir, `${timestamp}-${name}-${type}-prp.md`),
    tasks: path.join(archiveDir, `${timestamp}-${name}-${type}-prp-tasks.md`),
    technicalPlan: path.join(archiveDir, `${timestamp}-${name}-technical-plan.md`),
  };

  let archivedFiles = [];
  let errors = [];

  // Archive PRP file
  if (fs.existsSync(sourcePaths[type].prp)) {
    try {
      fs.renameSync(sourcePaths[type].prp, destPaths.prp);
      archivedFiles.push(`PRP: ${destPaths.prp}`);
      console.log(`✅ Archived PRP: ${name}`);
    } catch (error) {
      errors.push(`Failed to archive PRP: ${error.message}`);
    }
  } else {
    console.log(`⚠️  PRP file not found: ${sourcePaths[type].prp}`);
  }

  // Archive tasks file if requested
  if (includeTaskFile && fs.existsSync(sourcePaths[type].tasks)) {
    try {
      fs.renameSync(sourcePaths[type].tasks, destPaths.tasks);
      archivedFiles.push(`Tasks: ${destPaths.tasks}`);
      console.log(`✅ Archived tasks: ${name}`);
    } catch (error) {
      errors.push(`Failed to archive tasks: ${error.message}`);
    }
  }

  // Archive technical plan if it exists
  if (fs.existsSync(sourcePaths[type].technicalPlan)) {
    try {
      // Technical plans might be shared, so copy instead of move
      const technicalPlanContent = fs.readFileSync(sourcePaths[type].technicalPlan, 'utf8');

      // Check if this plan is referenced by other PRPs
      const otherPrps = fs
        .readdirSync(path.join('workflow', 'prps', 'features'))
        .concat(fs.readdirSync(path.join('workflow', 'prps', 'issues')))
        .filter((file) => !file.includes(name));

      let isShared = false;
      for (const prpFile of otherPrps) {
        const prpPath = path.join(
          'workflow',
          'prps',
          prpFile.includes('feature') ? 'features' : 'issues',
          prpFile
        );
        if (fs.existsSync(prpPath)) {
          const content = fs.readFileSync(prpPath, 'utf8');
          if (content.includes(`${name}-technical-plan`)) {
            isShared = true;
            break;
          }
        }
      }

      if (isShared) {
        // Copy if shared
        fs.writeFileSync(destPaths.technicalPlan, technicalPlanContent);
        console.log(`📋 Copied technical plan (shared with other PRPs): ${name}`);
      } else {
        // Move if not shared
        fs.renameSync(sourcePaths[type].technicalPlan, destPaths.technicalPlan);
        console.log(`✅ Archived technical plan: ${name}`);
      }
      archivedFiles.push(`Technical Plan: ${destPaths.technicalPlan}`);
    } catch (error) {
      errors.push(`Failed to archive technical plan: ${error.message}`);
    }
  }

  // Update complete.md with archive references
  updateCompleteFile(name, type, timestamp, archiveDir);

  // Summary
  console.log('\n📦 Archive Summary:');
  console.log('='.repeat(50));

  if (archivedFiles.length > 0) {
    console.log('✅ Archived files:');
    archivedFiles.forEach((file) => console.log(`  • ${file}`));
  }

  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach((error) => console.log(`  • ${error}`));
  }

  return { success: errors.length === 0, archivedFiles, errors };
}

/**
 * Update complete.md with archive references
 */
function updateCompleteFile(name, type, timestamp, archiveDir) {
  const completePath = path.join('workflow', 'complete.md');

  if (!fs.existsSync(completePath)) {
    console.log('⚠️  complete.md not found, skipping update');
    return;
  }

  let content = fs.readFileSync(completePath, 'utf8');
  const archiveRef = `[Archived: ${archiveDir}]`;

  // Add entry under appropriate section
  const sectionMarker =
    type === 'feature' ? '## Completed Features (via PRP)' : '## Resolved Issues (via Issue-PRP)';

  const entry = `\n- **${timestamp}** - ${name} ${archiveRef}`;

  // Find section and add entry
  const sectionIndex = content.indexOf(sectionMarker);
  if (sectionIndex !== -1) {
    const nextSectionIndex = content.indexOf('\n##', sectionIndex + 1);
    const insertIndex = nextSectionIndex !== -1 ? nextSectionIndex : content.length;

    // Insert before the next section
    content = content.slice(0, insertIndex) + entry + '\n' + content.slice(insertIndex);

    // Update statistics
    const statsMatch = content.match(/Total Completed (Features|Issues):\*\* (\d+)/g);
    if (statsMatch) {
      statsMatch.forEach((match) => {
        if (
          (type === 'feature' && match.includes('Features')) ||
          (type === 'issue' && match.includes('Issues'))
        ) {
          const count = parseInt(match.match(/\d+/)[0]) + 1;
          content = content.replace(match, match.replace(/\d+/, count));
        }
      });
    }

    fs.writeFileSync(completePath, content);
    console.log(`📝 Updated complete.md with archive reference`);
  }
}

/**
 * Clean up old archives (optional maintenance function)
 */
function cleanOldArchives(monthsToKeep = 6) {
  const archiveRoot = path.join('workflow', 'archive');
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);

  console.log(`🧹 Cleaning archives older than ${monthsToKeep} months...`);

  if (!fs.existsSync(archiveRoot)) {
    console.log('No archive directory found');
    return;
  }

  const years = fs.readdirSync(archiveRoot).filter((y) => /^\d{4}$/.test(y));
  let cleaned = 0;

  years.forEach((year) => {
    const yearPath = path.join(archiveRoot, year);
    const months = fs.readdirSync(yearPath).filter((m) => /^\d{2}$/.test(m));

    months.forEach((month) => {
      const archiveDate = new Date(`${year}-${month}-01`);
      if (archiveDate < cutoffDate) {
        const monthPath = path.join(yearPath, month);
        const files = fs.readdirSync(monthPath);

        // Move to deep archive instead of deleting
        const deepArchivePath = path.join(archiveRoot, 'deep-archive', year, month);
        if (!fs.existsSync(deepArchivePath)) {
          fs.mkdirSync(deepArchivePath, { recursive: true });
        }

        files.forEach((file) => {
          fs.renameSync(path.join(monthPath, file), path.join(deepArchivePath, file));
          cleaned++;
        });

        // Remove empty month directory
        fs.rmdirSync(monthPath);
      }
    });

    // Remove empty year directory
    if (fs.readdirSync(yearPath).length === 0) {
      fs.rmdirSync(yearPath);
    }
  });

  console.log(`✅ Moved ${cleaned} old files to deep archive`);
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'archive') {
    const name = args[1];
    const type = args[2] || 'feature';

    if (!name) {
      console.error('Usage: node archive-completed.js archive <name> [feature|issue]');
      process.exit(1);
    }

    archiveCompleted(name, type);
  } else if (command === 'clean') {
    const months = parseInt(args[1]) || 6;
    cleanOldArchives(months);
  } else {
    console.log('Archive Management Tool');
    console.log('='.repeat(50));
    console.log('Commands:');
    console.log('  archive <name> [feature|issue] - Archive completed work');
    console.log('  clean [months]                 - Move old archives to deep storage');
    console.log('');
    console.log('Examples:');
    console.log('  node archive-completed.js archive user-auth feature');
    console.log('  node archive-completed.js archive login-bug issue');
    console.log('  node archive-completed.js clean 12');
  }
}

module.exports = { archiveCompleted, cleanOldArchives };
