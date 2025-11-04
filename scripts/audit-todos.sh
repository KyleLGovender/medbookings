#!/bin/bash

echo "📝 TODO/FIXME/HACK AUDIT"
echo "Generated: $(date)"
echo ""

echo "## High Priority (FIXME)"
fixme_count=$(grep -r "FIXME" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
grep -rn "FIXME" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20

echo ""
echo "## Medium Priority (TODO)"
todo_count=$(grep -r "TODO" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
grep -rn "TODO" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20

echo ""
echo "## Low Priority (HACK)"
hack_count=$(grep -r "HACK" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
grep -rn "HACK" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20

echo ""
echo "======================================"
echo "SUMMARY"
echo "======================================"
echo "FIXME: $fixme_count"
echo "TODO: $todo_count"  
echo "HACK: $hack_count"
echo ""
