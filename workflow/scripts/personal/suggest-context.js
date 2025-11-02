#!/usr/bin/env node

/**
 * Context Suggestion Helper
 *
 * Reads a technical plan and suggests which files Claude should load
 * to maintain optimal context size (3,000-5,000 tokens).
 *
 * Usage:
 *   node workflow/scripts/personal/suggest-context.js [feature-name]
 *
 * Example:
 *   node workflow/scripts/personal/suggest-context.js user-profile-editing
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Feature/issue name required\n');
  console.log('Usage: node workflow/scripts/personal/suggest-context.js [name]\n');
  console.log('Example: node workflow/scripts/personal/suggest-context.js user-profile-editing');
  process.exit(1);
}

const featureName = args[0];

// Determine paths
const technicalPlanPath = path.join(
  'workflow',
  'technical-plans',
  `${featureName}-technical-plan.md`
);

// Check if technical plan exists
if (!fs.existsSync(technicalPlanPath)) {
  console.error(`❌ Error: Technical plan not found at: ${technicalPlanPath}\n`);
  console.log('Make sure you have created the technical plan first:');
  console.log(`  plan technical approach for: feature: ${featureName}`);
  process.exit(1);
}

console.log(`📋 Analyzing technical plan: ${featureName}\n`);

// Read technical plan
const technicalPlan = fs.readFileSync(technicalPlanPath, 'utf8');

// Extract sections
const sections = {
  filesToModify: extractSection(technicalPlan, '### Files to Modify'),
  filesToCreate: extractSection(technicalPlan, '### Files to Create'),
  databaseChanges: extractSection(technicalPlan, '### Database Changes'),
  apiEndpoints: extractSection(technicalPlan, '### API Endpoints'),
  implementation: extractSection(technicalPlan, '## Implementation Details'),
};

// Analyze and generate suggestions
const suggestions = generateSuggestions(sections, featureName);

// Display suggestions
displaySuggestions(suggestions);

/**
 * Extract content after a markdown heading until next heading of same or higher level
 */
function extractSection(content, heading) {
  const headingRegex = new RegExp(
    `${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\n([\\s\\S]*?)(?=\\n#+|$)`,
    'i'
  );
  const match = content.match(headingRegex);
  return match ? match[1].trim() : '';
}

/**
 * Generate context loading suggestions based on technical plan analysis
 */
function generateSuggestions(sections, featureName) {
  const suggestions = {
    filesToRead: [],
    patternsToLoad: [],
    databaseModels: [],
    claudeSections: [],
    estimatedTokens: 0,
    warnings: [],
  };

  // Extract files to modify/create
  const fileRegex = /[\/\w\-\.]+\.tsx?/g;

  const modifyMatches = sections.filesToModify.match(fileRegex) || [];
  const createMatches = sections.filesToCreate.match(fileRegex) || [];

  suggestions.filesToRead = [...new Set([...modifyMatches, ...createMatches])];

  // Determine which patterns are needed based on file types and content
  const hasApiWork = suggestions.filesToRead.some(
    (f) => f.includes('/routers/') || f.includes('/api/')
  );
  const hasComponents = suggestions.filesToRead.some((f) => f.includes('/components/'));
  const hasHooks = suggestions.filesToRead.some((f) => f.includes('/hooks/'));
  const hasValidation =
    sections.implementation.toLowerCase().includes('validation') ||
    sections.implementation.toLowerCase().includes('zod') ||
    sections.implementation.toLowerCase().includes('schema');

  if (hasApiWork) suggestions.patternsToLoad.push('api-patterns.md');
  if (hasComponents) suggestions.patternsToLoad.push('component-patterns.md');
  if (hasHooks) suggestions.patternsToLoad.push('hook-patterns.md');
  if (hasValidation) suggestions.patternsToLoad.push('validation-patterns.md');

  // Limit to 2 pattern files (most important)
  if (suggestions.patternsToLoad.length > 2) {
    suggestions.warnings.push('⚠️  More than 2 patterns identified. Prioritize the most relevant.');
    suggestions.patternsToLoad = suggestions.patternsToLoad.slice(0, 2);
  }

  // Extract database models mentioned
  const modelRegex = /model\s+(\w+)/gi;
  const modelMatches = [...sections.databaseChanges.matchAll(modelRegex)];
  suggestions.databaseModels = [...new Set(modelMatches.map((m) => m[1]))];

  // Suggest CLAUDE.md sections based on work type
  if (hasApiWork)
    suggestions.claudeSections.push('Section 3: Architecture & Tech Stack (tRPC patterns)');
  if (sections.databaseChanges)
    suggestions.claudeSections.push('Section 7: Healthcare Compliance (timezone, transactions)');
  if (hasValidation)
    suggestions.claudeSections.push('Section 12: Development Workflow (form standards)');
  if (
    sections.apiEndpoints.toLowerCase().includes('auth') ||
    sections.implementation.toLowerCase().includes('security')
  ) {
    suggestions.claudeSections.push('Section 8: Security Checklist');
  }

  // Estimate token count
  suggestions.estimatedTokens = estimateTokenCount(suggestions);

  // Add warnings if context might be too large
  if (suggestions.estimatedTokens > 8000) {
    suggestions.warnings.push(
      '🔴 Estimated context exceeds 8,000 tokens - consider breaking into smaller tasks'
    );
  } else if (suggestions.estimatedTokens > 5000) {
    suggestions.warnings.push('⚠️  Estimated context is high (>5k tokens) - stay focused');
  }

  if (suggestions.filesToRead.length > 10) {
    suggestions.warnings.push(
      '⚠️  Many files to modify - consider splitting into multiple parent tasks'
    );
  }

  return suggestions;
}

/**
 * Estimate token count for suggested context
 * Rough estimation: 1 file ≈ 300 tokens, 1 pattern ≈ 200 tokens, 1 model ≈ 100 tokens
 */
function estimateTokenCount(suggestions) {
  const fileTokens = suggestions.filesToRead.length * 300;
  const patternTokens = suggestions.patternsToLoad.length * 200;
  const modelTokens = suggestions.databaseModels.length * 100;
  const claudeTokens = suggestions.claudeSections.length * 150;

  return fileTokens + patternTokens + modelTokens + claudeTokens;
}

/**
 * Display suggestions in a user-friendly format
 */
function displaySuggestions(suggestions) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 CONTEXT LOADING SUGGESTIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Files to read
  if (suggestions.filesToRead.length > 0) {
    console.log('📁 Files to Read:');
    suggestions.filesToRead.forEach((file) => {
      console.log(`   ✓ ${file}`);
    });
    console.log(`   Total: ${suggestions.filesToRead.length} files\n`);
  } else {
    console.log('📁 Files to Read: None specified in technical plan\n');
  }

  // Patterns to load
  if (suggestions.patternsToLoad.length > 0) {
    console.log('📚 Patterns to Load:');
    suggestions.patternsToLoad.forEach((pattern) => {
      console.log(`   ✓ /workflow/reference/code-patterns/${pattern}`);
    });
    console.log(`   Total: ${suggestions.patternsToLoad.length} patterns\n`);
  } else {
    console.log('📚 Patterns to Load: None recommended\n');
  }

  // Database models
  if (suggestions.databaseModels.length > 0) {
    console.log('🗄️  Database Models to Grep:');
    console.log('   Command:');
    const modelList = suggestions.databaseModels.map((m) => `^model ${m}`).join('\\|');
    console.log(`   grep -A 20 "${modelList}" prisma/schema.prisma\n`);
    console.log('   Models:');
    suggestions.databaseModels.forEach((model) => {
      console.log(`   ✓ ${model}`);
    });
    console.log(`   Total: ${suggestions.databaseModels.length} models\n`);
  } else {
    console.log('🗄️  Database Models: No database changes detected\n');
  }

  // CLAUDE.md sections
  if (suggestions.claudeSections.length > 0) {
    console.log('📖 CLAUDE.md Sections to Reference:');
    suggestions.claudeSections.forEach((section) => {
      console.log(`   ✓ ${section}`);
    });
    console.log('');
  }

  // Estimated tokens
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📊 Estimated Context Size: ~${suggestions.estimatedTokens} tokens`);

  if (suggestions.estimatedTokens >= 3000 && suggestions.estimatedTokens <= 5000) {
    console.log('✅ Optimal range (3,000-5,000 tokens)');
  } else if (suggestions.estimatedTokens < 3000) {
    console.log('⚠️  Below optimal range - verify you have all necessary context');
  } else if (suggestions.estimatedTokens <= 8000) {
    console.log('⚠️  Above optimal but acceptable - stay focused');
  } else {
    console.log('🔴 Too large - consider breaking into smaller tasks');
  }
  console.log('═══════════════════════════════════════════════════════\n');

  // Warnings
  if (suggestions.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    suggestions.warnings.forEach((warning) => {
      console.log(`   ${warning}`);
    });
    console.log('');
  }

  // Recommendations
  console.log('💡 Recommendations:');
  console.log("   1. Start with suggested files only (don't load entire modules)");
  console.log("   2. Use grep for database models (don't read entire schema)");
  console.log('   3. Reference CLAUDE.md sections with offset/limit parameters');
  console.log('   4. Reload context if it exceeds 8,000 tokens during work');
  console.log('   5. Follow context-scoping-guide.md throughout implementation\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('Next Steps:');
  console.log('   1. Copy suggestions to share with Claude');
  console.log('   2. Claude will load context following these recommendations');
  console.log('   3. Begin implementation with optimal context size');
  console.log('═══════════════════════════════════════════════════════\n');
}
