#!/bin/bash
# Initialize workflow system - Safe for existing installations

echo "Initializing workflow directories..."
mkdir -p workflow/prds
mkdir -p workflow/issues  
mkdir -p workflow/technical-plans
mkdir -p workflow/technical-plans/archive
mkdir -p workflow/reference/prd
mkdir -p workflow/reference/issue

echo ""
echo "Checking Git configuration..."
if node scripts/workflow/check-git.js; then
  echo "  Git configuration verified"
else
  echo "  Git configuration issues detected. Please fix the issues above before continuing."
  echo "  Workflow branching will not work without proper git configuration."
fi
echo ""

echo "Checking template files..."
# Templates should already exist in workflow/reference/
if [ ! -f "workflow/reference/prd/prd-tasks-template.md" ]; then
  echo "  PRD tasks template not found at workflow/reference/prd/prd-tasks-template.md"
  echo "  Please ensure this file exists before running workflows"
else
  echo "  PRD tasks template exists"
fi

if [ ! -f "workflow/reference/issue/issue-tasks-template.md" ]; then
  echo "  Issue tasks template not found at workflow/reference/issue/issue-tasks-template.md"
  echo "  Please ensure this file exists before running workflows"
else
  echo "  Issue tasks template exists"
fi

echo "Checking backlog and complete files..."
if [ ! -f "workflow/backlog.md" ]; then
  echo "  Creating backlog.md..."
  cat > workflow/backlog.md << EOF
# Project Backlog

## Backlog Statistics

- **Total Items:** 0
- **High Priority:** 0
- **Medium Priority:** 0
- **Low Priority:** 0
- **Completed:** 0
- **Last Updated:** $(date +%Y-%m-%d)

---

## High Priority

### Features
<!-- Features that block other work or affect many users -->

### Issues
<!-- Critical bugs blocking user workflows -->

---

## Medium Priority

### Features
<!-- Important features that improve user experience -->

### Issues
<!-- Issues with workarounds available -->

---

## Low Priority

### Features
<!-- Nice-to-have improvements -->

### Issues
<!-- Minor bugs with minimal impact -->

---

## Quick Feature Notes
<!-- Feature ideas captured quickly for later specification -->

---

## Quick Issue Notes
<!-- Issues noted quickly for later investigation -->

---

## Recently Completed (Last 7 Days)
<!-- Items marked complete are moved here temporarily before going to complete.md -->
EOF
else
  echo "  backlog.md already exists - preserving existing content"
fi

if [ ! -f "workflow/complete.md" ]; then
  echo "  Creating complete.md..."
  cat > workflow/complete.md << EOF
# Completed Work Archive

## Completion Statistics

- **Total Completed Features:** 0
- **Total Resolved Issues:** 0
- **This Month:** 0
- **This Quarter:** 0

---

## Completed Features

<!-- Features are added here when all tasks are marked complete and user confirms satisfaction -->

---

## Resolved Issues

<!-- Issues are added here when all tasks are marked complete and user confirms satisfaction -->

---

## Quick Notes Promoted

<!-- Track which quick notes became full features/issues -->

### From Quick Notes to Full Implementation

<!-- Entries added here when quick notes are expanded to full specs -->
EOF
else
  echo "  complete.md already exists - preserving existing content"
fi

echo "Creating workflow enabled flag..."
echo "# This file indicates that the workflow system is enabled for this developer" > .workflow-enabled
echo "# Created on: $(date)" >> .workflow-enabled
echo "# This file is gitignored and personal to each developer" >> .workflow-enabled

echo ""
echo "✅ Workflow system initialization complete!"
echo ""
echo "Summary:"
echo "  Directories: Ready"
echo "  Templates: $([ -f "workflow/reference/prd/prd-tasks-template.md" ] && [ -f "workflow/reference/issue/issue-tasks-template.md" ] && echo "Both present" || echo "Missing - check above")"
echo "  Backlog: $([ -f "workflow/backlog.md" ] && echo "Exists" || echo "Created")"
echo "  Complete: $([ -f "workflow/complete.md" ] && echo "Exists" || echo "Created")"
echo "  Workflow Enabled: Yes"
echo ""
echo "✨ Your workflow system is now active!"
echo "You can now run commands like 'npm run workflow:preflight' successfully."
echo ""
echo "Note: Other developers won't see these workflow files (they're gitignored)."
echo "Your existing work has been preserved."
