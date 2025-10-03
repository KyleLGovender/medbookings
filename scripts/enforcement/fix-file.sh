#!/bin/bash

# Fix File Script
# Interactive script to fix violations in a specific file
# Usage: ./scripts/enforcement/fix-file.sh <file-path>

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

echo ""
echo "================================================"
echo "  FILE VIOLATION FIXER"
echo "================================================"
echo "  File: $FILE_PATH"
echo "================================================"
echo ""

# Count violations before
echo -e "${BLUE}📊 Analyzing violations...${NC}"
echo ""

TIMEZONE_BEFORE=$(grep -n "new Date()\|Date.now()" "$FILE_PATH" | wc -l | tr -d ' ')
LOGGING_BEFORE=$(grep -n "console\." "$FILE_PATH" | wc -l | tr -d ' ')
TYPE_SAFETY_BEFORE=$(grep -n "as any" "$FILE_PATH" | wc -l | tr -d ' ')

echo "Before:"
echo "  - Timezone:     $TIMEZONE_BEFORE"
echo "  - Logging:      $LOGGING_BEFORE"
echo "  - Type Safety:  $TYPE_SAFETY_BEFORE"
echo ""

if [ "$TIMEZONE_BEFORE" -eq 0 ] && [ "$LOGGING_BEFORE" -eq 0 ] && [ "$TYPE_SAFETY_BEFORE" -eq 0 ]; then
    echo -e "${GREEN}✅ No violations found! File is clean.${NC}"
    exit 0
fi

# Show violations
if [ "$TIMEZONE_BEFORE" -gt 0 ]; then
    echo -e "${YELLOW}Timezone violations:${NC}"
    grep -n "new Date()\|Date.now()" "$FILE_PATH" | head -5
    if [ "$TIMEZONE_BEFORE" -gt 5 ]; then
        echo "  ... and $((TIMEZONE_BEFORE - 5)) more"
    fi
    echo ""
fi

if [ "$LOGGING_BEFORE" -gt 0 ]; then
    echo -e "${YELLOW}Logging violations:${NC}"
    grep -n "console\." "$FILE_PATH" | head -5
    if [ "$LOGGING_BEFORE" -gt 5 ]; then
        echo "  ... and $((LOGGING_BEFORE - 5)) more"
    fi
    echo ""
fi

if [ "$TYPE_SAFETY_BEFORE" -gt 0 ]; then
    echo -e "${YELLOW}Type safety violations:${NC}"
    grep -n "as any" "$FILE_PATH" | head -5
    if [ "$TYPE_SAFETY_BEFORE" -gt 5 ]; then
        echo "  ... and $((TYPE_SAFETY_BEFORE - 5)) more"
    fi
    echo ""
fi

# Ask for confirmation
echo -e "${YELLOW}⚠️  Manual fixes required.${NC}"
echo ""
echo "Fix patterns:"
echo ""
echo "1. Timezone:"
echo "   new Date() → import { nowUTC } from '@/lib/timezone'; nowUTC()"
echo ""
echo "2. Logging:"
echo "   console.log() → import { logger } from '@/lib/logger'; logger.info()"
echo ""
echo "3. Type Safety:"
echo "   Review each 'as any' and add proper type guards"
echo ""
echo "After fixing, run:"
echo "  npx eslint $FILE_PATH --fix"
echo "  npm run build"
echo "  node scripts/claude-code-validator.js validate-file $FILE_PATH"
echo ""

# Open file in editor (optional)
read -p "Open file in editor? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Try to open in VS Code, fall back to default editor
    if command -v code &> /dev/null; then
        code "$FILE_PATH"
    elif [ -n "$EDITOR" ]; then
        $EDITOR "$FILE_PATH"
    else
        echo -e "${YELLOW}No editor found. Please open manually: $FILE_PATH${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📝 After fixing, verify with:${NC}"
echo "  ./scripts/enforcement/verify-file.sh $FILE_PATH"
echo ""
