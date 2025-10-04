#!/usr/bin/env bash
# ============================================================================
# CLAUDE.md Enforcement System Setup Script
# ============================================================================
# PURPOSE: One-command setup for the entire enforcement system
# USAGE: npm run setup-enforcement
#
# This script:
# 1. Installs required dependencies
# 2. Initializes git hooks
# 3. Makes scripts executable
# 4. Validates configuration
# 5. Runs test validation
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
print_section() {
  echo ""
  echo -e "${BLUE}============================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}============================================${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# ============================================================================
# STEP 1: CHECK PREREQUISITES
# ============================================================================

print_section "Step 1: Checking Prerequisites"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  print_error "Not a git repository. Please run this script from the project root."
  exit 1
fi
print_success "Git repository detected"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed. Please install Node.js first."
  exit 1
fi
print_success "Node.js $(node --version) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  print_error "npm is not installed. Please install npm first."
  exit 1
fi
print_success "npm $(npm --version) detected"

# Check if required files exist
REQUIRED_FILES=(
  "CLAUDE.md"
  "scripts/validation/claude-code-validator.js"
  "eslint-rules/claude-compliance.js"
  ".eslintrc.json"
  "tsconfig.json"
)

for FILE in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$FILE" ]; then
    print_error "Required file not found: $FILE"
    exit 1
  fi
done
print_success "All required files present"

# ============================================================================
# STEP 2: INSTALL DEPENDENCIES
# ============================================================================

print_section "Step 2: Installing Dependencies"

print_info "Installing husky..."
npm install --save-dev husky

print_info "Installing eslint-plugin-rulesdir..."
npm install --save-dev eslint-plugin-rulesdir

print_success "Dependencies installed"

# ============================================================================
# STEP 3: INITIALIZE GIT HOOKS
# ============================================================================

print_section "Step 3: Initializing Git Hooks"

print_info "Running husky init..."
npx husky init

print_success "Git hooks initialized"

# ============================================================================
# STEP 4: MAKE SCRIPTS EXECUTABLE
# ============================================================================

print_section "Step 4: Making Scripts Executable"

chmod +x scripts/validation/claude-code-validator.js
print_success "claude-code-validator.js is executable"

chmod +x scripts/validation/claude-pre-write-validator.sh
print_success "claude-pre-write-validator.sh is executable"

chmod +x scripts/validation/claude-post-write-validator.sh
print_success "claude-post-write-validator.sh is executable"

chmod +x .husky/pre-commit
print_success "pre-commit hook is executable"

# ============================================================================
# STEP 5: VALIDATE CONFIGURATION
# ============================================================================

print_section "Step 5: Validating Configuration"

# Check ESLint configuration
print_info "Checking ESLint configuration..."
if grep -q "rulesdir" .eslintrc.json; then
  print_success "ESLint configured with custom rules"
else
  print_error "ESLint not configured correctly (missing rulesdir)"
  exit 1
fi

# Check TypeScript configuration
print_info "Checking TypeScript configuration..."
if grep -q "noImplicitAny" tsconfig.json; then
  print_success "TypeScript strict mode enabled"
else
  print_error "TypeScript strict mode not enabled"
  exit 1
fi

# Check .gitignore for backup files
print_info "Checking .gitignore..."
if grep -q "*.backup" .gitignore; then
  print_success ".gitignore configured for backup files"
else
  print_error ".gitignore not configured for backup files"
  exit 1
fi

# Check GitHub workflow
if [ -f ".github/workflows/claude-compliance.yml" ]; then
  print_success "CI/CD workflow configured"
else
  print_error "CI/CD workflow not found"
  exit 1
fi

# ============================================================================
# STEP 6: RUN TEST VALIDATION
# ============================================================================

print_section "Step 6: Running Test Validation"

# Create a temporary test file with a known violation
TEST_FILE="test-enforcement-violation.ts"
cat > "$TEST_FILE" << 'EOF'
// Test file with intentional violations
const now = new Date(); // TIMEZONE_VIOLATION
const user = data as any; // TYPE_SAFETY_VIOLATION
console.log('test'); // CONSOLE_USAGE
EOF

print_info "Created test file with violations: $TEST_FILE"

# Run validator on test file (should fail)
print_info "Running validator on test file (expecting failures)..."
if node scripts/validation/claude-code-validator.js validate-file "$TEST_FILE" 2>&1 | grep -q "TIMEZONE_VIOLATION"; then
  print_success "Validator correctly detected timezone violation"
else
  print_error "Validator failed to detect violations"
  rm "$TEST_FILE"
  exit 1
fi

# Clean up test file
rm "$TEST_FILE"
print_success "Test validation completed"

# ============================================================================
# STEP 7: ADD PACKAGE.JSON SCRIPTS
# ============================================================================

print_section "Step 7: Checking package.json Scripts"

if grep -q "setup-enforcement" package.json; then
  print_success "package.json scripts already configured"
else
  print_info "Adding setup-enforcement script to package.json..."
  print_info "Please add the following to package.json manually:"
  echo ""
  echo "  \"scripts\": {"
  echo "    \"setup-enforcement\": \"bash scripts/enforcement/setup-enforcement.sh\","
  echo "    \"validate-claude\": \"node scripts/validation/claude-code-validator.js validate-file\""
  echo "  }"
  echo ""
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================

print_section "Setup Complete! 🎉"

echo ""
echo -e "${GREEN}✅ CLAUDE.md Enforcement System is now active!${NC}"
echo ""
echo "The following layers are now protecting your codebase:"
echo ""
echo "  1. ⚡ Real-Time IDE Feedback (ESLint)"
echo "     - 8 custom rules active"
echo "     - Violations shown as you type"
echo ""
echo "  2. 🛡️  Pre-Commit Hooks (Git Hooks)"
echo "     - Validates changes before commit"
echo "     - Runs automatically on 'git commit'"
echo "     - Bypass: git commit --no-verify (use sparingly)"
echo ""
echo "  3. 🚀 CI/CD Gates (GitHub Actions)"
echo "     - Blocks PRs with violations"
echo "     - Comprehensive validation suite"
echo "     - Cannot bypass (protects production)"
echo ""
echo "📚 Documentation:"
echo "   - Full guide: docs/ENFORCEMENT.md"
echo "   - CLAUDE.md: Project guidelines"
echo ""
echo "🧪 Test the system:"
echo "   npm run validate-claude src/lib/auth.ts"
echo ""
echo "🔧 Useful commands:"
echo "   npm run lint          # Check for violations"
echo "   npx tsc --noEmit      # Type check"
echo "   npm run build         # Full build"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "   - Fix violations as they appear"
echo "   - Don't use --no-verify unless absolutely necessary"
echo "   - CI/CD will block PRs with violations"
echo ""
echo -e "${GREEN}Happy coding! 🎨${NC}"
echo ""
