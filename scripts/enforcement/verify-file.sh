#!/bin/bash

# Verify File Script
# Verifies that a file has no violations and passes all checks
# Usage: ./scripts/enforcement/verify-file.sh <file-path>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}Error: File path required${NC}"
    echo "Usage: $0 <file-path>"
    exit 1
fi

FILE_PATH="$1"

if [ ! -f "$FILE_PATH" ]; then
    echo -e "${RED}Error: File not found: $FILE_PATH${NC}"
    exit 1
fi

# Project root
PROJECT_ROOT="/Users/kylegovender/Documents/softwareDev/medbookings"
cd "$PROJECT_ROOT"

echo ""
echo "================================================"
echo "  FILE VERIFICATION"
echo "================================================"
echo "  File: $FILE_PATH"
echo "================================================"
echo ""

# Track overall status
ALL_PASSED=true

# 1. Check for violations
echo -e "${BLUE}1️⃣  Checking for violations...${NC}"
echo ""

TIMEZONE_COUNT=$(grep -n "new Date()\|Date.now()" "$FILE_PATH" | grep -v "timezone.ts" | wc -l | tr -d ' ')
LOGGING_COUNT=$(grep -n "console\." "$FILE_PATH" | grep -v "logger.ts" | wc -l | tr -d ' ')
TYPE_SAFETY_COUNT=$(grep -n "as any" "$FILE_PATH" | wc -l | tr -d ' ')

if [ "$TIMEZONE_COUNT" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Timezone: 0 violations"
else
    echo -e "  ${RED}✗${NC} Timezone: $TIMEZONE_COUNT violations"
    ALL_PASSED=false
fi

if [ "$LOGGING_COUNT" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Logging: 0 violations"
else
    echo -e "  ${RED}✗${NC} Logging: $LOGGING_COUNT violations"
    ALL_PASSED=false
fi

if [ "$TYPE_SAFETY_COUNT" -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Type Safety: 0 violations"
else
    echo -e "  ${RED}✗${NC} Type Safety: $TYPE_SAFETY_COUNT violations"
    ALL_PASSED=false
fi

echo ""

# 2. Run ESLint
echo -e "${BLUE}2️⃣  Running ESLint...${NC}"
if npx eslint "$FILE_PATH" --max-warnings=0 2>&1 | grep -q "error"; then
    echo -e "  ${RED}✗${NC} ESLint failed"
    npx eslint "$FILE_PATH" --max-warnings=0
    ALL_PASSED=false
else
    echo -e "  ${GREEN}✓${NC} ESLint passed"
fi
echo ""

# 3. Run TypeScript check
echo -e "${BLUE}3️⃣  Running TypeScript check...${NC}"
if npx tsc --noEmit 2>&1 | grep -q "$FILE_PATH"; then
    echo -e "  ${RED}✗${NC} TypeScript errors found"
    npx tsc --noEmit | grep "$FILE_PATH" || true
    ALL_PASSED=false
else
    echo -e "  ${GREEN}✓${NC} TypeScript passed"
fi
echo ""

# 4. Run validator (if exists)
echo -e "${BLUE}4️⃣  Running validator...${NC}"
if [ -f "$PROJECT_ROOT/scripts/claude-code-validator.js" ]; then
    if node "$PROJECT_ROOT/scripts/claude-code-validator.js" validate-file "$FILE_PATH" 2>&1 | grep -q "PASS"; then
        echo -e "  ${GREEN}✓${NC} Validator passed"
    else
        echo -e "  ${RED}✗${NC} Validator failed"
        node "$PROJECT_ROOT/scripts/claude-code-validator.js" validate-file "$FILE_PATH" || true
        ALL_PASSED=false
    fi
else
    echo -e "  ${YELLOW}⚠${NC}  Validator not found (skipping)"
fi
echo ""

# Final result
echo "================================================"
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✅ VERIFICATION PASSED${NC}"
    echo ""
    echo "File is ready for commit!"
    echo ""
    echo "Next steps:"
    echo "  git add $FILE_PATH"
    echo "  git commit -m \"fix: resolve violations in $(basename "$FILE_PATH")\""
    echo ""
    exit 0
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo ""
    echo "Please fix the issues above and re-run verification."
    echo ""
    exit 1
fi
