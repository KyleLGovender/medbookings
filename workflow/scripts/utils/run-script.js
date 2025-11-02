#!/usr/bin/env node

/**
 * Script Runner for package.json.local
 *
 * This module allows workflow scripts to run npm scripts from package.json.local
 * Usage:
 *   const runScript = require('./utils/run-script');
 *   runScript('workflow:check');
 *   runScript('validate:all', { stdio: 'inherit' });
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to package.json.local (relative to project root)
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const LOCAL_PACKAGE = path.join(PROJECT_ROOT, 'package.json.local');
const REGULAR_PACKAGE = path.join(PROJECT_ROOT, 'package.json');

/**
 * Load scripts from package.json.local or fallback to package.json
 */
function loadScripts() {
  // Try package.json.local first (for personal workflow scripts)
  if (fs.existsSync(LOCAL_PACKAGE)) {
    try {
      const localPackage = JSON.parse(fs.readFileSync(LOCAL_PACKAGE, 'utf-8'));
      return { scripts: localPackage.scripts || {}, source: 'package.json.local' };
    } catch (error) {
      console.warn(`⚠️  Warning: Could not load package.json.local: ${error.message}`);
    }
  }

  // Fallback to regular package.json
  if (fs.existsSync(REGULAR_PACKAGE)) {
    try {
      const regularPackage = JSON.parse(fs.readFileSync(REGULAR_PACKAGE, 'utf-8'));
      return { scripts: regularPackage.scripts || {}, source: 'package.json' };
    } catch (error) {
      throw new Error(`Failed to load package.json: ${error.message}`);
    }
  }

  throw new Error('Neither package.json.local nor package.json found');
}

/**
 * Run a script from package.json.local or package.json
 *
 * @param {string} scriptName - Name of the script to run
 * @param {object} options - Options to pass to execSync (e.g., { stdio: 'inherit' })
 * @returns {Buffer|string} - Output from the command
 */
function runScript(scriptName, options = {}) {
  const { scripts, source } = loadScripts();

  // Check if script exists
  if (!scripts[scriptName]) {
    throw new Error(
      `Script "${scriptName}" not found in ${source}\n` +
        `Available scripts: ${Object.keys(scripts).join(', ')}`
    );
  }

  const command = scripts[scriptName];

  // Default options
  const defaultOptions = {
    cwd: PROJECT_ROOT,
    shell: true,
    ...options,
  };

  // Run the command
  try {
    return execSync(command, defaultOptions);
  } catch (error) {
    // Re-throw with more context
    error.message = `Failed to run script "${scriptName}": ${error.message}`;
    throw error;
  }
}

/**
 * Check if a script exists
 *
 * @param {string} scriptName - Name of the script to check
 * @returns {boolean} - True if script exists
 */
function hasScript(scriptName) {
  try {
    const { scripts } = loadScripts();
    return scriptName in scripts;
  } catch (error) {
    return false;
  }
}

/**
 * Get the command for a script without running it
 *
 * @param {string} scriptName - Name of the script
 * @returns {string|null} - The command or null if not found
 */
function getScriptCommand(scriptName) {
  try {
    const { scripts } = loadScripts();
    return scripts[scriptName] || null;
  } catch (error) {
    return null;
  }
}

module.exports = runScript;
module.exports.runScript = runScript;
module.exports.hasScript = hasScript;
module.exports.getScriptCommand = getScriptCommand;
