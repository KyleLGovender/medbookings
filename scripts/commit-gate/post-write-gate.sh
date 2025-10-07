#!/usr/bin/env bash
# ============================================================================
# Claude Code Post-Write Validator
# ============================================================================
# PURPOSE: Validate code changes AFTER Claude Code writes them to disk
# USAGE: Called by Claude Code hooks after Edit/Write tool execution
#
# This script runs after Claude Code has written files to provide additional
# validation and can trigger rollback if violations are detected.
#
# WORKFLOW:
# 1. Claude Code writes file to disk
# 2. This script is triggered
# 3. Validates written content against CLAUDE.md
# 4. If invalid: warns Claude and suggests fixes
# 5. Optionally: can rollback changes (if backup exists)
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
# $1 = file_path (absolute path to file that was modified)
# $2 = backup_path (optional: path to backup of old content)
# ============================================================================

FILE_PATH="$1"
BACKUP_PATH="${2:-}"

if [ -z "$FILE_PATH" ]; then
  echo -e "${RED}❌ Error: Missing file path${NC}"
  echo "Usage: $0 <file_path> [backup_path]"
  exit 1
fi

# ============================================================================
# VALIDATION LOGIC
# ============================================================================

echo -e "${YELLOW}🔍 Post-write validation for: $FILE_PATH${NC}"

# Get old content from backup (if exists)
OLD_CONTENT=""
if [ -n "$BACKUP_PATH" ] && [ -f "$BACKUP_PATH" ]; then
  OLD_CONTENT=$(cat "$BACKUP_PATH")
fi

# Create temp file for old content
OLD_TEMP=$(mktemp)
echo "$OLD_CONTENT" > "$OLD_TEMP"

# Run validator
VALIDATION_OUTPUT=$(node "$(dirname "$0")/claude-code-validator.js" validate-change "$FILE_PATH" "$OLD_TEMP" "$FILE_PATH" 2>&1)
VALIDATION_EXIT=$?

# Clean up temp file
rm "$OLD_TEMP"

# ============================================================================
# HANDLE VALIDATION RESULTS
# ============================================================================

if [ $VALIDATION_EXIT -ne 0 ]; then
  echo ""
  echo -e "${RED}❌ CLAUDE.md COMPLIANCE VIOLATION DETECTED (POST-WRITE)${NC}"
  echo -e "${RED}=======================================================${NC}"
  echo ""
  echo "$VALIDATION_OUTPUT"
  echo ""

  # Offer rollback if backup exists
  if [ -n "$BACKUP_PATH" ] && [ -f "$BACKUP_PATH" ]; then
    echo -e "${YELLOW}⚠️  Backup available at: $BACKUP_PATH${NC}"
    echo -e "${YELLOW}💡 Consider reverting changes to fix violations${NC}"
  else
    echo -e "${RED}🚫 No backup available for rollback${NC}"
  fi

  echo ""
  echo -e "${YELLOW}⚠️  File has been written but contains violations${NC}"
  echo -e "${YELLOW}📝 Please fix the violations before committing${NC}"
  echo ""

  # Exit with warning code (not error, since file is already written)
  exit 2
fi

# Validation passed
echo -e "${GREEN}✅ Post-write validation passed${NC}"

# Clean up backup if validation passed
if [ -n "$BACKUP_PATH" ] && [ -f "$BACKUP_PATH" ]; then
  rm "$BACKUP_PATH"
  echo -e "${GREEN}🗑️  Backup cleaned up${NC}"
fi

exit 0
