#!/usr/bin/env bash
# ============================================================================
# Claude Code Pre-Write Validator
# ============================================================================
# PURPOSE: Validate code changes BEFORE Claude Code writes them to disk
# USAGE: Called by Claude Code hooks before Edit/Write tool execution
#
# This script intercepts Claude Code's file modification tools and validates
# changes against CLAUDE.md rules BEFORE they're written to disk.
#
# WORKFLOW:
# 1. Claude Code attempts to edit/write a file
# 2. This script is triggered
# 3. Validates new content against CLAUDE.md
# 4. If valid: allows write to proceed
# 5. If invalid: blocks write and shows violations to Claude
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# ARGUMENTS
# ============================================================================
# $1 = file_path (absolute path to file being modified)
# $2 = new_content_path (path to temp file with new content)
# ============================================================================

FILE_PATH="$1"
NEW_CONTENT_PATH="$2"

if [ -z "$FILE_PATH" ] || [ -z "$NEW_CONTENT_PATH" ]; then
  echo -e "${RED}❌ Error: Missing arguments${NC}"
  echo "Usage: $0 <file_path> <new_content_path>"
  exit 1
fi

# ============================================================================
# VALIDATION LOGIC
# ============================================================================

echo -e "${YELLOW}🔍 Validating changes to: $FILE_PATH${NC}"

# Get old content (current file on disk, or empty if new file)
OLD_CONTENT=""
if [ -f "$FILE_PATH" ]; then
  OLD_CONTENT=$(cat "$FILE_PATH")
fi

# Create temp file for old content
OLD_TEMP=$(mktemp)
echo "$OLD_CONTENT" > "$OLD_TEMP"

# Run validator
VALIDATION_OUTPUT=$(node "$(dirname "$0")/claude-code-validator.js" validate-change "$FILE_PATH" "$OLD_TEMP" "$NEW_CONTENT_PATH" 2>&1)
VALIDATION_EXIT=$?

# Clean up temp file
rm "$OLD_TEMP"

# ============================================================================
# HANDLE VALIDATION RESULTS
# ============================================================================

if [ $VALIDATION_EXIT -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ CLAUDE.md COMPLIANCE VIOLATION DETECTED${NC}"
  echo -e "${RED}===========================================${NC}"
  echo ""
  echo "$VALIDATION_OUTPUT"
  echo ""
  echo -e "${RED}🚫 File write BLOCKED by pre-write validator${NC}"
  echo -e "${YELLOW}💡 Please fix the violations above before proceeding${NC}"
  echo ""
  exit 1
fi

# Validation passed
echo -e "${GREEN}✅ CLAUDE.md compliance validated${NC}"
exit 0
