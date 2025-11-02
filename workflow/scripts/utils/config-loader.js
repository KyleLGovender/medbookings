#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Configuration Loader for Workflow System
 * Loads and validates workflow configuration from config.json
 */

let cachedConfig = null;

/**
 * Load configuration from workflow/config.json
 * @returns {Object} Configuration object
 */
function loadConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join('workflow', 'config.json');

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Configuration file not found at: ${configPath}`);
    console.log('💡 Run: npm run workflow:init to initialize workflow system');
    process.exit(1);
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    cachedConfig = JSON.parse(configContent);
    return cachedConfig;
  } catch (error) {
    console.error(`❌ Failed to parse configuration file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Get a nested configuration value using dot notation
 * @param {string} key - Dot notation path (e.g., 'paths.features')
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Configuration value
 */
function getConfig(key, defaultValue = null) {
  const config = loadConfig();
  const keys = key.split('.');
  let value = config;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return defaultValue;
    }
  }

  return value;
}

/**
 * Get file path for a specific type (feature/issue) and category (prp/tasks/technicalPlan)
 * @param {string} type - 'feature' or 'issue'
 * @param {string} category - 'prp', 'tasks', or 'technicalPlan'
 * @param {string} name - Feature/issue name
 * @returns {string} Full file path
 */
function getFilePath(type, category, name) {
  const config = loadConfig();

  // Get the directory
  let dir;
  if (category === 'technicalPlan') {
    dir = config.paths.technicalPlans;
  } else {
    dir = type === 'feature' ? config.paths.features : config.paths.issues;
  }

  // Get the filename pattern
  const pattern = config.fileNaming[type][category];
  const filename = pattern.replace('{name}', name);

  return path.join(dir, filename);
}

/**
 * Get template path for a specific type (feature/issue) and category (prp/tasks)
 * @param {string} type - 'feature' or 'issue'
 * @param {string} category - 'prp' or 'tasks'
 * @returns {string} Full template path
 */
function getTemplatePath(type, category) {
  const config = loadConfig();
  const dir = type === 'feature' ? config.paths.referenceFeature : config.paths.referenceIssue;
  const filename = config.templates[type][category];
  return path.join(dir, filename);
}

/**
 * Get backlog section marker for a priority level and type
 * @param {string} priority - 'High', 'Medium', 'Low'
 * @param {string} type - 'feature' or 'issue'
 * @returns {string} Section marker string
 */
function getBacklogSection(priority, type) {
  const config = loadConfig();
  const sectionKey = priority.toLowerCase() + 'Priority';
  const section = config.backlog.sections[sectionKey];
  const subsection =
    type === 'feature' ? config.backlog.subsections.features : config.backlog.subsections.issues;
  return `${section}\n\n${subsection}`;
}

/**
 * Get priority label (P1, P2, P3 for features; S1, S2, S3, S4 for issues)
 * @param {string} type - 'feature' or 'issue'
 * @param {string} priority - Priority level
 * @returns {string} Priority label
 */
function getPriorityLabel(type, priority) {
  const config = loadConfig();
  return config.priorities[type].labels[priority] || '';
}

/**
 * Get inference patterns for a specific category
 * @param {string} category - 'priority', 'featureType', 'severity', 'issueType'
 * @returns {Object} Inference patterns
 */
function getInferencePatterns(category) {
  const config = loadConfig();
  return config.inference[category] || {};
}

/**
 * Format filename from name (kebab-case conversion)
 * @param {string} name - Feature/issue name
 * @returns {string} Formatted filename
 */
function formatFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get current date in configured format
 * @returns {string} Formatted date
 */
function getCurrentDate() {
  const config = loadConfig();
  const format = config.formatting.dateFormat;
  const date = new Date();

  // Simple YYYY-MM-DD format
  if (format === 'YYYY-MM-DD') {
    return date.toISOString().split('T')[0];
  }

  return date.toISOString().split('T')[0];
}

/**
 * Validate workflow directory structure
 * @returns {Object} { valid: boolean, missing: string[] }
 */
function validateWorkflowStructure() {
  const config = loadConfig();
  const missing = [];

  // Check directories
  config.validation.requiredDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      missing.push(`Directory: ${dir}`);
    }
  });

  // Check files
  config.validation.requiredFiles.forEach((file) => {
    if (!fs.existsSync(file)) {
      missing.push(`File: ${file}`);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get all available priorities for a type
 * @param {string} type - 'feature' or 'issue'
 * @returns {string[]} Array of priority levels
 */
function getPriorities(type) {
  const config = loadConfig();
  return config.priorities[type].levels;
}

/**
 * Get default priority for a type
 * @param {string} type - 'feature' or 'issue'
 * @returns {string} Default priority
 */
function getDefaultPriority(type) {
  const config = loadConfig();
  return config.priorities[type].default;
}

/**
 * Get all available types for a category
 * @param {string} category - 'feature' or 'issue'
 * @returns {string[]} Array of types
 */
function getTypes(category) {
  const config = loadConfig();
  return config.types[category];
}

/**
 * Get excerpt length from config
 * @returns {number} Excerpt length in characters
 */
function getExcerptLength() {
  const config = loadConfig();
  return config.formatting.excerptLength;
}

/**
 * Get git branch prefix for type
 * @param {string} type - 'feature', 'issue', or 'hotfix'
 * @returns {string} Branch prefix
 */
function getBranchPrefix(type) {
  const config = loadConfig();
  return config.git.branchPrefixes[type] || '';
}

module.exports = {
  loadConfig,
  getConfig,
  getFilePath,
  getTemplatePath,
  getBacklogSection,
  getPriorityLabel,
  getInferencePatterns,
  formatFileName,
  getCurrentDate,
  validateWorkflowStructure,
  getPriorities,
  getDefaultPriority,
  getTypes,
  getExcerptLength,
  getBranchPrefix,
};
