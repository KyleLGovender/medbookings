#!/bin/bash

# Violation Counter Script
# Counts all compliance violations in the codebase
# Usage: ./scripts/compliance/count-violations.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "================================================"
echo "  STRICT ENFORCEMENT VIOLATION COUNTER"
echo "================================================"
echo ""

# Project root - detect dynamically using git
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$PROJECT_ROOT" ]; then
    # Fallback to script location if not in a git repo
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

# Timezone violations
echo -e "${BLUE}📅 Counting Timezone Violations...${NC}"
TIMEZONE_NEW_DATE=$(grep -r "new Date(" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "timezone.ts" | grep -v "timezone-helper.ts" | wc -l | tr -d ' ')
TIMEZONE_DATE_NOW=$(grep -r "Date.now()" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "timezone.ts" | grep -v "timezone-helper.ts" | wc -l | tr -d ' ')
TIMEZONE_TOTAL=$((TIMEZONE_NEW_DATE + TIMEZONE_DATE_NOW))

echo "  - new Date():  $TIMEZONE_NEW_DATE"
echo "  - Date.now():  $TIMEZONE_DATE_NOW"
echo -e "  ${YELLOW}Total:         $TIMEZONE_TOTAL${NC}"
echo ""

# Logging violations
echo -e "${BLUE}📝 Counting Logging Violations...${NC}"
LOGGING_LOG=$(grep -r "console\.log" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | wc -l | tr -d ' ')
LOGGING_ERROR=$(grep -r "console\.error" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | wc -l | tr -d ' ')
LOGGING_WARN=$(grep -r "console\.warn" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | wc -l | tr -d ' ')
LOGGING_INFO=$(grep -r "console\.info" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | wc -l | tr -d ' ')
LOGGING_DEBUG=$(grep -r "console\.debug" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" | wc -l | tr -d ' ')
LOGGING_TOTAL=$((LOGGING_LOG + LOGGING_ERROR + LOGGING_WARN + LOGGING_INFO + LOGGING_DEBUG))

echo "  - console.log:   $LOGGING_LOG"
echo "  - console.error: $LOGGING_ERROR"
echo "  - console.warn:  $LOGGING_WARN"
echo "  - console.info:  $LOGGING_INFO"
echo "  - console.debug: $LOGGING_DEBUG"
echo -e "  ${YELLOW}Total:           $LOGGING_TOTAL${NC}"
echo ""

# Type Safety violations
echo -e "${BLUE}🔒 Counting Type Safety Violations...${NC}"
TYPE_SAFETY_AS_ANY=$(grep -r "as any" src/ --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')
TYPE_SAFETY_TS_IGNORE=$(grep -r "@ts-ignore" src/ --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')
TYPE_SAFETY_TOTAL=$((TYPE_SAFETY_AS_ANY + TYPE_SAFETY_TS_IGNORE))

echo "  - as any:       $TYPE_SAFETY_AS_ANY"
echo "  - @ts-ignore:   $TYPE_SAFETY_TS_IGNORE"
echo -e "  ${YELLOW}Total:          $TYPE_SAFETY_TOTAL${NC}"
echo ""

# Grand total
GRAND_TOTAL=$((TIMEZONE_TOTAL + LOGGING_TOTAL + TYPE_SAFETY_TOTAL))

echo "================================================"
echo -e "${YELLOW}📊 SUMMARY${NC}"
echo "================================================"
echo ""
printf "%-20s %10s\n" "Category" "Count"
echo "------------------------------------------------"
printf "%-20s %10s\n" "Timezone" "$TIMEZONE_TOTAL"
printf "%-20s %10s\n" "Logging" "$LOGGING_TOTAL"
printf "%-20s %10s\n" "Type Safety" "$TYPE_SAFETY_TOTAL"
echo "------------------------------------------------"
printf "%-20s %10s\n" "TOTAL" "$GRAND_TOTAL"
echo "================================================"
echo ""

# Determine status
if [ "$GRAND_TOTAL" -eq 0 ]; then
    echo -e "${GREEN}✅ SUCCESS: Zero violations! Production ready.${NC}"
    exit 0
else
    echo -e "${RED}❌ VIOLATIONS FOUND: $GRAND_TOTAL remaining${NC}"
    echo ""
    echo "Run detailed scan: ./scripts/compliance/scan-violations.sh"
    exit 1
fi
