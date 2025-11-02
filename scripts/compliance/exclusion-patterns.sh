#!/bin/bash

# ═══════════════════════════════════════════════════════════
# Centralized Exclusion Patterns for CLAUDE.md Compliance
# ═══════════════════════════════════════════════════════════
#
# Purpose: Single source of truth for infrastructure files
# Usage: Source this file in pre-commit and CI/CD workflows
#
# Pattern Philosophy:
# - Production code (src/app, src/features, src/server) → VALIDATE
# - Infrastructure code (scripts, workflow, e2e, config) → SKIP
# - Logging utilities (logger.ts, debug.ts) → SKIP (implement console)
# - Workflow documentation (.claude/WORKFLOW.md) → SKIP (contains examples)

# Check if a file should be excluded from compliance validation
# Returns: 0 (true/exclude) or 1 (false/validate)
is_infrastructure_file() {
  local file="$1"

  # ─────────────────────────────────────────────────────────
  # Configuration Files
  # ─────────────────────────────────────────────────────────
  # Reason: Config syntax, not application logic
  if [[ "$file" =~ (\.eslintrc\.|next\.config\.|tailwind\.config\.|postcss\.config\.|prettier\.config\.|jest\.config\.) ]]; then
    return 0
  fi

  # ─────────────────────────────────────────────────────────
  # Infrastructure Directories
  # ─────────────────────────────────────────────────────────

  # E2E Tests - Playwright tests for end-to-end testing
  # Reason: Test utilities, not production code
  if [[ "$file" =~ ^e2e/ ]]; then
    return 0
  fi

  # Compliance Scripts - Validation tooling
  # Reason: CLI automation for development workflow
  if [[ "$file" =~ ^scripts/ ]]; then
    return 0
  fi

  # Workflow Automation - PRP-based development system
  # Reason: CLI tools for personal workflow (console.log appropriate)
  if [[ "$file" =~ ^workflow/ ]]; then
    return 0
  fi

  # ESLint Custom Rules - Compliance rule implementations
  # Reason: Metaprogramming, analyzes code structure
  if [[ "$file" =~ ^eslint-rules/ ]]; then
    return 0
  fi

  # Claude Directory (excluding CLAUDE.md itself)
  # Reason: Workflow documentation, may contain example code
  if [[ "$file" =~ ^\.claude/ ]] && [[ "$file" != "CLAUDE.md" ]]; then
    return 0
  fi

  # ─────────────────────────────────────────────────────────
  # Specific Infrastructure Files
  # ─────────────────────────────────────────────────────────

  # Logging Implementation - Console abstraction layer
  # Reason: Implements console wrapper, needs console access
  if [[ "$file" == "src/lib/logger.ts" ]]; then
    return 0
  fi

  # Debug Utilities - Development debugging tools
  # Reason: Debug-only code, not in production bundle
  if [[ "$file" == "src/lib/debug.ts" ]]; then
    return 0
  fi

  # Environment Validation - Server environment setup
  # Reason: Uses console for startup validation
  if [[ "$file" == "src/env/server.ts" ]]; then
    return 0
  fi

  # Audit Logging - Compliance audit implementation
  # Reason: May use console for audit trail debugging
  if [[ "$file" == "src/lib/audit.ts" ]]; then
    return 0
  fi

  # ─────────────────────────────────────────────────────────
  # Production Code - Should Be Validated
  # ─────────────────────────────────────────────────────────
  # If none of the above matched, this is production code
  return 1
}

# Export function for use in other scripts
export -f is_infrastructure_file
