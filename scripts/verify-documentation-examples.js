#!/usr/bin/env node

/**
 * Documentation Example Verification Script
 * Verifies that all code examples in API documentation are syntactically valid
 * and follow the correct API patterns.
 */

const fs = require('fs');
const path = require('path');

// Documentation files to verify
const docFiles = [
  'docs/api/providers.md',
  'docs/api-routes.md'
];

// Track verification results
const results = {
  totalExamples: 0,
  validExamples: 0,
  invalidExamples: 0,
  errors: []
};

/**
 * Extract JSON code blocks from markdown content
 */
function extractJsonExamples(content) {
  const jsonBlocks = [];
  const regex = /```json\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    jsonBlocks.push({
      content: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return jsonBlocks;
}

/**
 * Extract TypeScript code blocks from markdown content
 */
function extractTypeScriptExamples(content) {
  const tsBlocks = [];
  const regex = /```typescript\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    tsBlocks.push({
      content: match[1],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return tsBlocks;
}

/**
 * Extract URL examples from markdown content
 */
function extractUrlExamples(content) {
  const urlBlocks = [];
  const regex = /```\n(GET|POST|PUT|DELETE) ([^\n]+)\n```/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    urlBlocks.push({
      method: match[1],
      url: match[2],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return urlBlocks;
}

/**
 * Validate JSON syntax
 */
function validateJson(jsonString, context) {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: `JSON syntax error: ${error.message}`,
      context 
    };
  }
}

/**
 * Validate TypeScript interface syntax (basic check)
 */
function validateTypeScript(tsString, context) {
  // Basic syntax checks for TypeScript interfaces and types
  const issues = [];
  
  // Check for balanced braces
  const openBraces = (tsString.match(/{/g) || []).length;
  const closeBraces = (tsString.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    issues.push('Unbalanced braces in TypeScript code');
  }
  
  // Check for balanced brackets
  const openBrackets = (tsString.match(/\[/g) || []).length;
  const closeBrackets = (tsString.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    issues.push('Unbalanced brackets in TypeScript code');
  }
  
  // Check for balanced parentheses
  const openParens = (tsString.match(/\(/g) || []).length;
  const closeParens = (tsString.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push('Unbalanced parentheses in TypeScript code');
  }
  
  return {
    valid: issues.length === 0,
    errors: issues,
    context
  };
}

/**
 * Validate URL format and parameters
 */
function validateUrl(method, url, context) {
  const issues = [];
  
  // Check if URL starts with /api/
  if (!url.startsWith('/api/')) {
    issues.push(`URL should start with /api/, got: ${url}`);
  }
  
  // Check for valid HTTP methods
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  if (!validMethods.includes(method)) {
    issues.push(`Invalid HTTP method: ${method}`);
  }
  
  // Check for valid query parameter syntax
  if (url.includes('?')) {
    const [path, queryString] = url.split('?');
    const params = queryString.split('&');
    
    for (const param of params) {
      if (!param.includes('=')) {
        issues.push(`Invalid query parameter syntax: ${param}`);
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    errors: issues,
    context
  };
}

/**
 * Verify API patterns in examples
 */
function verifyApiPatterns(content, filePath) {
  const issues = [];
  
  // Check for multi-type provider examples
  if (filePath.includes('providers')) {
    // Verify that multi-type examples include serviceProviderTypeIds
    if (content.includes('serviceProviderTypeId') && 
        !content.includes('serviceProviderTypeIds')) {
      issues.push('Multi-type provider examples should include serviceProviderTypeIds array');
    }
    
    // Verify typeAssignments are mentioned in response examples
    if (content.includes('"providers":') && 
        !content.includes('typeAssignments')) {
      issues.push('Provider response examples should include typeAssignments for multi-type support');
    }
  }
  
  return issues;
}

/**
 * Main verification function
 */
function verifyDocumentation() {
  console.log('🔍 Verifying documentation examples...\n');
  
  for (const docFile of docFiles) {
    const filePath = path.join(process.cwd(), docFile);
    
    if (!fs.existsSync(filePath)) {
      results.errors.push(`Documentation file not found: ${docFile}`);
      continue;
    }
    
    console.log(`📄 Checking ${docFile}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract and validate JSON examples
    const jsonExamples = extractJsonExamples(content);
    console.log(`  Found ${jsonExamples.length} JSON examples`);
    
    for (const example of jsonExamples) {
      results.totalExamples++;
      const validation = validateJson(example.content, {
        file: docFile,
        line: example.line,
        type: 'JSON'
      });
      
      if (validation.valid) {
        results.validExamples++;
      } else {
        results.invalidExamples++;
        results.errors.push(validation);
      }
    }
    
    // Extract and validate TypeScript examples
    const tsExamples = extractTypeScriptExamples(content);
    console.log(`  Found ${tsExamples.length} TypeScript examples`);
    
    for (const example of tsExamples) {
      results.totalExamples++;
      const validation = validateTypeScript(example.content, {
        file: docFile,
        line: example.line,
        type: 'TypeScript'
      });
      
      if (validation.valid) {
        results.validExamples++;
      } else {
        results.invalidExamples++;
        results.errors.push({
          valid: false,
          error: validation.errors.join(', '),
          context: validation.context
        });
      }
    }
    
    // Extract and validate URL examples
    const urlExamples = extractUrlExamples(content);
    console.log(`  Found ${urlExamples.length} URL examples`);
    
    for (const example of urlExamples) {
      results.totalExamples++;
      const validation = validateUrl(example.method, example.url, {
        file: docFile,
        line: example.line,
        type: 'URL'
      });
      
      if (validation.valid) {
        results.validExamples++;
      } else {
        results.invalidExamples++;
        results.errors.push({
          valid: false,
          error: validation.errors.join(', '),
          context: validation.context
        });
      }
    }
    
    // Verify API patterns
    const patternIssues = verifyApiPatterns(content, docFile);
    for (const issue of patternIssues) {
      results.errors.push({
        valid: false,
        error: issue,
        context: {
          file: docFile,
          type: 'API Pattern'
        }
      });
    }
    
    console.log(`  ✅ Processed ${docFile}\n`);
  }
}

/**
 * Generate verification report
 */
function generateReport() {
  console.log('📊 Documentation Verification Report');
  console.log('====================================\n');
  
  console.log(`Total examples checked: ${results.totalExamples}`);
  console.log(`Valid examples: ${results.validExamples}`);
  console.log(`Invalid examples: ${results.invalidExamples}`);
  console.log(`Success rate: ${((results.validExamples / results.totalExamples) * 100).toFixed(1)}%\n`);
  
  if (results.errors.length > 0) {
    console.log('❌ Issues found:');
    console.log('================\n');
    
    for (const error of results.errors) {
      console.log(`❌ ${error.context?.type || 'Unknown'} Error in ${error.context?.file || 'unknown file'}`);
      if (error.context?.line) {
        console.log(`   Line: ${error.context.line}`);
      }
      console.log(`   Issue: ${error.error}`);
      console.log('');
    }
  } else {
    console.log('✅ All examples are valid!');
  }
  
  // Check specific multi-type provider requirements
  console.log('\n🔍 Multi-Type Provider Verification');
  console.log('===================================');
  
  const providerDoc = fs.readFileSync(path.join(process.cwd(), 'docs/api/providers.md'), 'utf8');
  
  // Check if key multi-type concepts are documented
  const requiredConcepts = [
    'serviceProviderTypeIds',
    'typeAssignments',
    'ServiceProviderTypeAssignment',
    'multiple provider types',
    'n:n relationship'
  ];
  
  const missingConcepts = requiredConcepts.filter(concept => 
    !providerDoc.toLowerCase().includes(concept.toLowerCase())
  );
  
  if (missingConcepts.length === 0) {
    console.log('✅ All multi-type provider concepts are documented');
  } else {
    console.log('❌ Missing multi-type concepts:');
    for (const concept of missingConcepts) {
      console.log(`   - ${concept}`);
    }
  }
  
  // Exit with appropriate code
  process.exit(results.errors.length > 0 ? 1 : 0);
}

// Run verification
verifyDocumentation();
generateReport();