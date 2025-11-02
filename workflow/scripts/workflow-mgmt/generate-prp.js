#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {
  getFilePath,
  getTemplatePath,
  getBacklogSection,
  getPriorityLabel,
  getInferencePatterns,
  getCurrentDate,
  getConfig,
  getDefaultPriority,
  getExcerptLength,
} = require('../utils/config-loader');

/**
 * Generate PRP (Product Requirement Prompt) from Technical Plan
 */

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const featureName = args[1];
const type = args[2] || 'feature'; // 'feature' or 'issue'

function showUsage() {
  console.log('\nUsage: node generate-prp.js <command> <name> [type]');
  console.log('\nCommands:');
  console.log('  create    Create a new PRP from technical plan');
  console.log('  validate  Validate existing PRP structure');
  console.log('\nExamples:');
  console.log('  node generate-prp.js create user-authentication feature');
  console.log('  node generate-prp.js create calendar-sync-bug issue');
  console.log('  node generate-prp.js validate user-authentication');
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function generateFeaturePRP(name, technicalPlan) {
  const templatePath = getTemplatePath('feature', 'prp');

  if (!fs.existsSync(templatePath)) {
    console.error(`❌ Feature PRP template not found at ${templatePath}`);
    return false;
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  const excerptLength = getExcerptLength();
  const technicalPlanPath = getFilePath('feature', 'technicalPlan', name);

  // Extract key information from technical plan
  const summary =
    extractSection(technicalPlan, 'Executive Summary') ||
    'Implementation based on technical analysis';
  const scope =
    extractSection(technicalPlan, 'Scope Definition') ||
    extractSection(technicalPlan, "What We're Building") ||
    '';
  const architecture = extractSection(technicalPlan, 'Technical Architecture') || '';
  const risks = extractSection(technicalPlan, 'Risk Assessment') || '';

  // Generate PRP content
  let prpContent = template.replace(/\[Feature Name\]/g, name);

  // Add implementation context from technical plan
  const contextSection = `### Codebase Patterns
- Based on technical plan analysis: \`${technicalPlanPath}\`
${architecture ? `- Architecture decisions: ${architecture.substring(0, excerptLength)}...` : ''}
`;

  prpContent = prpContent.replace(
    '### Codebase Patterns\n- Authentication: [Reference to existing auth implementation]',
    contextSection
  );

  // Add validation rules from technical plan
  if (scope) {
    const validationSection = `### Validation Rules
${scope}
- All dates use date-fns
- All forms use react-hook-form with zodResolver
- All API calls include error handling`;

    prpContent = prpContent.replace(
      '### Validation Rules\n- All dates use date-fns',
      validationSection
    );
  }

  // Add risk assessment
  if (risks) {
    prpContent = prpContent.replace(
      '## Migration Requirements',
      `## Risk Assessment\n${risks}\n\n## Migration Requirements`
    );
  }

  return prpContent;
}

function generateIssuePRP(name, technicalPlan) {
  const templatePath = getTemplatePath('issue', 'prp');

  // If issue template doesn't exist, use feature template for now
  if (!fs.existsSync(templatePath)) {
    console.log('⚠️ Issue PRP template not found, using feature template');
    return generateFeaturePRP(name, technicalPlan);
  }

  const template = fs.readFileSync(templatePath, 'utf8');

  // Extract issue-specific information
  const rootCause =
    extractSection(technicalPlan, 'Root Cause') ||
    extractSection(technicalPlan, 'Problem Analysis') ||
    '';
  const impact = extractSection(technicalPlan, 'Impact Assessment') || '';
  const fix =
    extractSection(technicalPlan, 'Fix Strategy') ||
    extractSection(technicalPlan, 'Solution Approach') ||
    '';

  let prpContent = template.replace(/\[Issue Name\]/g, name);

  // Add root cause analysis
  if (rootCause) {
    prpContent = prpContent.replace(
      '## Root Cause Analysis',
      `## Root Cause Analysis\n${rootCause}`
    );
  }

  // Add fix strategy
  if (fix) {
    prpContent = prpContent.replace('## Fix Implementation', `## Fix Implementation\n${fix}`);
  }

  return prpContent;
}

function generatePRPTasks(name, prpContent, type) {
  // Select correct template based on type
  const tasksTemplatePath = getTemplatePath(type, 'tasks');

  if (!fs.existsSync(tasksTemplatePath)) {
    console.error(`❌ Tasks template not found at ${tasksTemplatePath}`);
    return false;
  }

  const tasksTemplate = fs.readFileSync(tasksTemplatePath, 'utf8');

  // Replace placeholders
  const nameLabel = type === 'feature' ? 'Feature Name' : 'Issue Name';
  let tasksContent = tasksTemplate.replace(new RegExp(`\\[${nameLabel}\\]`, 'g'), name);
  tasksContent = tasksContent.replace(/\[feature-name\]/g, name);
  tasksContent = tasksContent.replace(/\[issue-name\]/g, name);
  tasksContent = tasksContent.replace(/\[YYYY-MM-DD\]/g, getCurrentDate());

  // Calculate task count dynamically based on PRP content
  const taskCount = calculateTaskCount(prpContent, type);
  tasksContent = tasksContent.replace(/\[Count\]/g, taskCount.toString());

  return tasksContent;
}

/**
 * Calculate estimated task count based on PRP content
 * @param {string} prpContent - PRP content to analyze
 * @param {string} type - 'feature' or 'issue'
 * @returns {number} Estimated task count
 */
function calculateTaskCount(prpContent, type) {
  // Count sections (each ## or ### represents a task area)
  const sections = (prpContent.match(/^##+ /gm) || []).length;

  // Count bullet points (rough indicator of complexity)
  const bullets = (prpContent.match(/^[\s]*[-*] /gm) || []).length;

  // Base calculation
  let baseCount = Math.max(5, Math.min(sections * 2, 20));

  // Adjust based on content complexity
  if (bullets > 50) baseCount += 5;
  if (bullets > 100) baseCount += 5;

  // Type-specific adjustments
  if (type === 'feature') {
    // Features typically need more tasks
    return Math.min(baseCount + 3, 25);
  } else {
    // Issues typically need fewer tasks
    return Math.min(baseCount, 15);
  }
}

function extractSection(content, sectionName) {
  const regex = new RegExp(`## ${sectionName}\\n([^#]+)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Analyze technical plan and PRP content to infer priority/severity
 */
function inferMetadata(type, technicalPlan, prpContent) {
  const content = (technicalPlan + '\n' + prpContent).toLowerCase();

  // Load inference patterns from config
  const priorityPatterns = getInferencePatterns('priority');
  const severityPatterns = getInferencePatterns('severity');
  const featureTypePatterns = getInferencePatterns('featureType');
  const issueTypePatterns = getInferencePatterns('issueType');

  let priority = getDefaultPriority('feature');
  let featureType = 'Enhancement';
  let severity = getDefaultPriority('issue');
  let issueType = 'Bug Fix';

  if (type === 'feature') {
    // Infer Priority (High/Medium/Low) using config patterns
    const highPattern = new RegExp(priorityPatterns.high.join('|'), 'i');
    const lowPattern = new RegExp(priorityPatterns.low.join('|'), 'i');
    const userImpactPattern = new RegExp(priorityPatterns.userImpact.join('|'), 'i');

    if (content.match(highPattern)) {
      priority = 'High';
    } else if (content.match(lowPattern)) {
      priority = 'Low';
    }

    // Infer Feature Type using config patterns
    if (content.match(new RegExp(featureTypePatterns.newFeature.join('|'), 'i'))) {
      featureType = 'New Feature';
    } else if (content.match(new RegExp(featureTypePatterns.refactor.join('|'), 'i'))) {
      featureType = 'Refactor';
    } else if (content.match(new RegExp(featureTypePatterns.performance.join('|'), 'i'))) {
      featureType = 'Performance';
    } else if (content.match(new RegExp(featureTypePatterns.security.join('|'), 'i'))) {
      featureType = 'Security';
    } else if (content.match(new RegExp(featureTypePatterns.enhancement.join('|'), 'i'))) {
      featureType = 'Enhancement';
    }

    // Check for user impact indicators
    if (content.match(userImpactPattern)) {
      priority = 'High';
    }
  } else {
    // Infer Severity (Critical/High/Medium/Low) using config patterns
    const criticalPattern = new RegExp(severityPatterns.critical.join('|'), 'i');
    const highPattern = new RegExp(severityPatterns.high.join('|'), 'i');
    const lowPattern = new RegExp(severityPatterns.low.join('|'), 'i');
    const criticalUserImpact = new RegExp(severityPatterns.userImpact.critical.join('|'), 'i');
    const highUserImpact = new RegExp(severityPatterns.userImpact.high.join('|'), 'i');

    if (content.match(criticalPattern)) {
      severity = 'Critical';
    } else if (content.match(highPattern)) {
      severity = 'High';
    } else if (content.match(lowPattern)) {
      severity = 'Low';
    }

    // Infer Issue Type using config patterns
    if (content.match(new RegExp(issueTypePatterns.security.join('|'), 'i'))) {
      issueType = 'Security Issue';
    } else if (content.match(new RegExp(issueTypePatterns.performance.join('|'), 'i'))) {
      issueType = 'Performance Issue';
    } else if (content.match(new RegExp(issueTypePatterns.data.join('|'), 'i'))) {
      issueType = 'Data Issue';
    } else if (content.match(new RegExp(issueTypePatterns.uiux.join('|'), 'i'))) {
      issueType = 'UI/UX Issue';
    } else if (content.match(new RegExp(issueTypePatterns.integration.join('|'), 'i'))) {
      issueType = 'Integration Issue';
    }

    // Check for user impact
    if (content.match(criticalUserImpact)) {
      severity = 'Critical';
    } else if (content.match(highUserImpact)) {
      severity = 'High';
    }
  }

  return { priority, featureType, severity, issueType };
}

function updateBacklog(name, type, technicalPlan, prpContent) {
  const backlogPath = getConfig('paths.backlog');

  if (!fs.existsSync(backlogPath)) {
    console.log('⚠️ Backlog file not found, skipping backlog update');
    return;
  }

  const backlog = fs.readFileSync(backlogPath, 'utf8');
  const date = getCurrentDate();

  // Infer metadata from content
  const metadata = inferMetadata(type, technicalPlan || '', prpContent || '');

  console.log('\n📊 Inferred Metadata:');
  if (type === 'feature') {
    console.log(`   Priority: ${metadata.priority}`);
    console.log(`   Type: ${metadata.featureType}`);
  } else {
    console.log(`   Severity: ${metadata.severity}`);
    console.log(`   Type: ${metadata.issueType}`);
  }
  console.log('');

  // Get file paths using config
  const prpPath = getFilePath(type, 'prp', name);
  const tasksPath = getFilePath(type, 'tasks', name);
  const technicalPlanPath = getFilePath(type, 'technicalPlan', name);

  // Get priority label and status
  const priorityOrSeverity = type === 'feature' ? metadata.priority : metadata.severity;
  const priorityLabel = getPriorityLabel(type, priorityOrSeverity);
  const statusConfig = getConfig('status.notStarted');

  const entry =
    type === 'feature'
      ? `
#### ${name}
**Feature**: ${name.replace(/-/g, ' ')}
**Priority**: ${priorityLabel} ${metadata.priority}
**Type**: ${metadata.featureType}
**Status**: ${statusConfig}
**PRP**: \`${prpPath}\`
**Tasks**: \`${tasksPath}\`
**Technical Plan**: \`${technicalPlanPath}\`
**Added**: ${date}
`
      : `
#### ${name}
**Issue**: ${name.replace(/-/g, ' ')}
**Severity**: ${metadata.severity}
**Type**: ${metadata.issueType}
**Status**: ${statusConfig}
**Issue PRP**: \`${prpPath}\`
**Tasks**: \`${tasksPath}\`
**Technical Plan**: \`${technicalPlanPath}\`
**Added**: ${date}
`;

  // Determine section based on inferred priority/severity using config
  let sectionMarker;
  if (type === 'feature') {
    sectionMarker = getBacklogSection(metadata.priority, 'feature');
  } else {
    // Map severity to priority for section placement
    const sectionPriority =
      metadata.severity === 'Critical' || metadata.severity === 'High'
        ? 'High'
        : metadata.severity === 'Low'
          ? 'Low'
          : 'Medium';
    sectionMarker = getBacklogSection(sectionPriority, 'issue');
  }

  // Find the section and add entry
  const updatedBacklog = backlog.replace(
    new RegExp(`(${sectionMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[^\n]*\n)?)`),
    `$1${entry}`
  );

  fs.writeFileSync(backlogPath, updatedBacklog);
  console.log('✅ Updated backlog.md with inferred metadata');
}

// Main execution
if (!command || command === '--help' || command === '-h') {
  showUsage();
  process.exit(0);
}

if (command === 'create') {
  if (!featureName) {
    console.error('❌ Please provide a feature/issue name');
    showUsage();
    process.exit(1);
  }

  const technicalPlanPath = getFilePath(type, 'technicalPlan', featureName);

  if (!fs.existsSync(technicalPlanPath)) {
    console.error(`❌ Technical plan not found at ${technicalPlanPath}`);
    console.log(
      '💡 Create a technical plan first using: plan technical approach for: ' +
        type +
        ': ' +
        featureName
    );
    process.exit(1);
  }

  const technicalPlan = fs.readFileSync(technicalPlanPath, 'utf8');

  // Ensure directories exist using config
  const targetDir = type === 'feature' ? getConfig('paths.features') : getConfig('paths.issues');
  ensureDirectoryExists(targetDir);

  // Generate PRP
  const prpContent =
    type === 'feature'
      ? generateFeaturePRP(featureName, technicalPlan)
      : generateIssuePRP(featureName, technicalPlan);

  if (!prpContent) {
    console.error('❌ Failed to generate PRP');
    process.exit(1);
  }

  // Generate tasks
  const tasksContent = generatePRPTasks(featureName, prpContent, type);

  if (!tasksContent) {
    console.error('❌ Failed to generate PRP tasks');
    process.exit(1);
  }

  // Write files using config paths
  const prpPath = getFilePath(type, 'prp', featureName);
  const tasksPath = getFilePath(type, 'tasks', featureName);

  fs.writeFileSync(prpPath, prpContent);
  fs.writeFileSync(tasksPath, tasksContent);
  console.log(`✅ Created ${prpPath}`);
  console.log(`✅ Created ${tasksPath}`);

  // Update backlog with technical plan and PRP content for inference
  updateBacklog(featureName, type, technicalPlan, prpContent);

  // Auto-validate PRP structure if enabled in config
  const autoValidate = getConfig('validation.automate.prpValidation', true);
  if (autoValidate) {
    console.log('\n🔍 Validating PRP structure...');
    try {
      execSync(
        `node workflow/scripts/workflow-mgmt/generate-prp.js validate ${featureName} ${type}`,
        {
          stdio: 'inherit',
        }
      );
      console.log('✅ PRP validation passed');
    } catch (error) {
      console.log('⚠️  PRP validation found issues - review before proceeding');
    }
  }

  console.log('\n🎉 PRP generation complete!');
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated PRP and customize as needed`);
  console.log(
    `2. Implement using: implement ${type === 'feature' ? 'feature-prp' : 'issue-prp'} tasks from: ${featureName}-${type === 'feature' ? 'feature-prp' : 'issue-prp'}-tasks.md`
  );
} else if (command === 'validate') {
  if (!featureName) {
    console.error('❌ Please provide a feature/issue name to validate');
    showUsage();
    process.exit(1);
  }

  // Check if PRP files exist using config paths
  const prpPath = getFilePath(type, 'prp', featureName);
  const tasksPath = getFilePath(type, 'tasks', featureName);

  const errors = [];

  if (!fs.existsSync(prpPath)) {
    errors.push(`PRP file not found: ${prpPath}`);
  }

  if (!fs.existsSync(tasksPath)) {
    errors.push(`Tasks file not found: ${tasksPath}`);
  }

  if (errors.length > 0) {
    console.error('❌ Validation failed:');
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('✅ PRP validation successful');
  console.log(`  - PRP: ${prpPath}`);
  console.log(`  - Tasks: ${tasksPath}`);
} else {
  console.error(`❌ Unknown command: ${command}`);
  showUsage();
  process.exit(1);
}
