#!/bin/bash

# ═══════════════════════════════════════════════════════════
# CLAUDE.md Compliance - Exclusion Pattern Tests
# ═══════════════════════════════════════════════════════════
#
# Purpose: Verify exclusion patterns work correctly
# Usage: bash scripts/compliance/test-exclusions.sh
# CI/CD: Run in GitHub Actions to catch regressions

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  CLAUDE.md Compliance - Exclusion Pattern Tests      ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Source the exclusion patterns
source scripts/compliance/exclusion-patterns.sh

# Test counters
PASS=0
FAIL=0
TOTAL=0

# ─────────────────────────────────────────────────────────
# Test Helper Functions
# ─────────────────────────────────────────────────────────

test_should_skip() {
  local file="$1"
  local reason="$2"
  TOTAL=$((TOTAL + 1))

  if is_infrastructure_file "$file"; then
    echo "✅ PASS: $file"
    echo "   └─ Correctly excluded ($reason)"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL: $file"
    echo "   └─ Should be excluded but isn't! ($reason)"
    FAIL=$((FAIL + 1))
  fi
}

test_should_validate() {
  local file="$1"
  local reason="$2"
  TOTAL=$((TOTAL + 1))

  if ! is_infrastructure_file "$file"; then
    echo "✅ PASS: $file"
    echo "   └─ Correctly validated ($reason)"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL: $file"
    echo "   └─ Should be validated but is excluded! ($reason)"
    FAIL=$((FAIL + 1))
  fi
}

# ─────────────────────────────────────────────────────────
# Configuration Files (Should Be Excluded)
# ─────────────────────────────────────────────────────────

echo "📋 Testing Configuration Files..."
echo ""

test_should_skip ".eslintrc.js" "ESLint configuration"
test_should_skip ".eslintrc.json" "ESLint configuration"
test_should_skip "next.config.mjs" "Next.js configuration"
test_should_skip "tailwind.config.ts" "Tailwind configuration"
test_should_skip "postcss.config.js" "PostCSS configuration"
test_should_skip "prettier.config.js" "Prettier configuration"
test_should_skip "jest.config.js" "Jest configuration"

echo ""

# ─────────────────────────────────────────────────────────
# Infrastructure Directories (Should Be Excluded)
# ─────────────────────────────────────────────────────────

echo "📁 Testing Infrastructure Directories..."
echo ""

# E2E Tests
test_should_skip "e2e/tests/booking.spec.ts" "E2E test file"
test_should_skip "e2e/fixtures/test-data.ts" "E2E fixture"
test_should_skip "e2e/utils/helpers.ts" "E2E utility"

# Compliance Scripts
test_should_skip "scripts/compliance/sync-compliance-rules.js" "Compliance automation"
test_should_skip "scripts/commit-gate/compliance-validator.js" "Commit gate validator"
test_should_skip "scripts/build/generate-sitemap.js" "Build script"

# Workflow Automation (NEW - This was causing failures!)
test_should_skip "workflow/scripts/validation/validate.js" "Workflow validation CLI"
test_should_skip "workflow/scripts/patterns/update-patterns.js" "Workflow pattern management"
test_should_skip "workflow/scripts/workflow-mgmt/workflow-init.js" "Workflow initialization"
test_should_skip "workflow/README.md" "Workflow documentation"

# ESLint Rules
test_should_skip "eslint-rules/no-new-date.js" "Custom ESLint rule"
test_should_skip "eslint-rules/type-organization.js" "Custom ESLint rule"

# Claude Directory
test_should_skip ".claude/WORKFLOW.md" "Workflow documentation (contains examples)"
test_should_skip ".claude/commands/feature-workflow.md" "Claude command template"
test_should_skip ".claude/commands/README.md" "Claude commands documentation"

echo ""

# ─────────────────────────────────────────────────────────
# Logging Infrastructure (Should Be Excluded)
# ─────────────────────────────────────────────────────────

echo "📊 Testing Logging Infrastructure..."
echo ""

test_should_skip "src/lib/logger.ts" "Logger implementation (uses console)"
test_should_skip "src/lib/debug.ts" "Debug utilities"
test_should_skip "src/env/server.ts" "Environment validation"
test_should_skip "src/lib/audit.ts" "Audit logging"

echo ""

# ─────────────────────────────────────────────────────────
# Production Code (Should Be Validated)
# ─────────────────────────────────────────────────────────

echo "🏭 Testing Production Code (should be validated)..."
echo ""

# Application Routes
test_should_validate "src/app/page.tsx" "Landing page"
test_should_validate "src/app/layout.tsx" "Root layout"
test_should_validate "src/app/api/auth/[...nextauth]/route.ts" "Auth API route"

# Feature Modules
test_should_validate "src/features/providers/components/provider-card.tsx" "Provider component"
test_should_validate "src/features/providers/hooks/use-providers.ts" "Provider hook"
test_should_validate "src/features/providers/lib/provider-actions.ts" "Provider server action"
test_should_validate "src/features/calendar/components/calendar-view.tsx" "Calendar component"
test_should_validate "src/features/bookings/hooks/use-bookings.ts" "Booking hook"

# Server API (tRPC)
test_should_validate "src/server/api/routers/admin.ts" "Admin tRPC router"
test_should_validate "src/server/api/routers/providers.ts" "Provider tRPC router"
test_should_validate "src/server/api/routers/bookings.ts" "Booking tRPC router"
test_should_validate "src/server/api/root.ts" "tRPC root router"
test_should_validate "src/server/trpc.ts" "tRPC configuration"

# Shared Libraries
test_should_validate "src/lib/auth.ts" "Authentication configuration"
test_should_validate "src/lib/prisma.ts" "Database client"
test_should_validate "src/lib/timezone.ts" "Timezone utilities"
test_should_validate "src/lib/communications/email.ts" "Email service"
test_should_validate "src/lib/communications/sms.ts" "SMS service"

# Shared Components
test_should_validate "src/components/ui/button.tsx" "UI component"
test_should_validate "src/components/ui/calendar.tsx" "Calendar UI component"
test_should_validate "src/components/layout/navbar.tsx" "Layout component"

# Utilities
test_should_validate "src/utils/api.ts" "tRPC client utilities"
test_should_validate "src/utils/format.ts" "Formatting utilities"

# Configuration Files That Should Be Validated
test_should_validate "CLAUDE.md" "Main compliance guidelines"
test_should_validate "src/middleware.ts" "Next.js middleware"

echo ""

# ─────────────────────────────────────────────────────────
# Edge Cases
# ─────────────────────────────────────────────────────────

echo "🔍 Testing Edge Cases..."
echo ""

# Files with similar names but different contexts
test_should_skip "workflow/config.json" "Workflow configuration"
test_should_validate "src/config/app-config.ts" "Application configuration"

# Test files (mixed - some excluded, some validated)
test_should_skip "e2e/tests/providers.spec.ts" "E2E test (excluded)"
test_should_validate "src/features/providers/__tests__/provider.test.tsx" "Unit test (validated)"

# Documentation files
test_should_skip "workflow/README.md" "Workflow docs (excluded)"
test_should_validate "README.md" "Main README (validated)"
test_should_validate "docs/compliance/COMPLIANCE-SYSTEM.md" "Compliance docs (validated)"

echo ""

# ─────────────────────────────────────────────────────────
# Results Summary
# ─────────────────────────────────────────────────────────

echo "╔═══════════════════════════════════════════════════════╗"
echo "║                    Test Results                        ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Total Tests:  $TOTAL"
echo "✅ Passed:    $PASS"
echo "❌ Failed:    $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 All exclusion pattern tests passed!"
  echo ""
  exit 0
else
  echo "⚠️  Some tests failed. Please review exclusion patterns."
  echo ""
  exit 1
fi
