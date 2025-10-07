#!/bin/bash

# Violation Scanner Script
# Generates detailed list of violations by file
# Usage: ./scripts/compliance/scan-violations.sh [category]
#   category: timezone | logging | type-safety | all (default: all)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Project root - detect dynamically using git
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$PROJECT_ROOT" ]; then
    # Fallback to script location if not in a git repo
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi
cd "$PROJECT_ROOT"

# Output directory
OUTPUT_DIR="$PROJECT_ROOT/docs/compliance-remediation/scans"
mkdir -p "$OUTPUT_DIR"

CATEGORY="${1:-all}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo ""
echo "================================================"
echo "  VIOLATION SCANNER"
echo "================================================"
echo "  Category: $CATEGORY"
echo "  Time: $(date)"
echo "================================================"
echo ""

# Function to scan timezone violations
scan_timezone() {
    local output_file="$OUTPUT_DIR/timezone_violations_$TIMESTAMP.txt"

    echo -e "${BLUE}📅 Scanning Timezone Violations...${NC}"

    {
        echo "================================================"
        echo "TIMEZONE VIOLATIONS - $(date)"
        echo "================================================"
        echo ""
        echo "### new Date() violations:"
        echo ""
        grep -rn "new Date(" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "timezone.ts" | grep -v "timezone-helper.ts" || echo "None found"
        echo ""
        echo "### Date.now() violations:"
        echo ""
        grep -rn "Date.now()" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "timezone.ts" | grep -v "timezone-helper.ts" || echo "None found"
        echo ""
    } > "$output_file"

    echo -e "${GREEN}  ✓ Saved to: $output_file${NC}"
}

# Function to scan logging violations
scan_logging() {
    local output_file="$OUTPUT_DIR/logging_violations_$TIMESTAMP.txt"

    echo -e "${BLUE}📝 Scanning Logging Violations...${NC}"

    {
        echo "================================================"
        echo "LOGGING VIOLATIONS - $(date)"
        echo "================================================"
        echo ""
        echo "### console.log violations:"
        echo ""
        grep -rn "console\.log" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" || echo "None found"
        echo ""
        echo "### console.error violations:"
        echo ""
        grep -rn "console\.error" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" || echo "None found"
        echo ""
        echo "### console.warn violations:"
        echo ""
        grep -rn "console\.warn" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" || echo "None found"
        echo ""
        echo "### console.info violations:"
        echo ""
        grep -rn "console\.info" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" || echo "None found"
        echo ""
        echo "### console.debug violations:"
        echo ""
        grep -rn "console\.debug" src/ e2e/ --include="*.ts" --include="*.tsx" | grep -v "logger.ts" || echo "None found"
        echo ""
    } > "$output_file"

    echo -e "${GREEN}  ✓ Saved to: $output_file${NC}"
}

# Function to scan type safety violations
scan_type_safety() {
    local output_file="$OUTPUT_DIR/type_safety_violations_$TIMESTAMP.txt"

    echo -e "${BLUE}🔒 Scanning Type Safety Violations...${NC}"

    {
        echo "================================================"
        echo "TYPE SAFETY VIOLATIONS - $(date)"
        echo "================================================"
        echo ""
        echo "### 'as any' violations:"
        echo ""
        grep -rn "as any" src/ --include="*.ts" --include="*.tsx" || echo "None found"
        echo ""
        echo "### '@ts-ignore' violations:"
        echo ""
        grep -rn "@ts-ignore" src/ --include="*.ts" --include="*.tsx" || echo "None found"
        echo ""
    } > "$output_file"

    echo -e "${GREEN}  ✓ Saved to: $output_file${NC}"
}

# Run scans based on category
case "$CATEGORY" in
    timezone)
        scan_timezone
        ;;
    logging)
        scan_logging
        ;;
    type-safety)
        scan_type_safety
        ;;
    all)
        scan_timezone
        scan_logging
        scan_type_safety
        ;;
    *)
        echo -e "${RED}Error: Invalid category '$CATEGORY'${NC}"
        echo "Usage: $0 [timezone|logging|type-safety|all]"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Scan complete!${NC}"
echo ""
echo "View results in: $OUTPUT_DIR"
ls -lh "$OUTPUT_DIR"/*_$TIMESTAMP.txt 2>/dev/null || true
echo ""
