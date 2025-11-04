#!/bin/bash

echo "🔍 PAGINATION AUDIT REPORT"
echo "Generated: $(date)"
echo ""
echo "Searching for findMany() queries without take: parameter..."
echo ""

# Find all findMany without take in router files
violations=0

for file in src/server/api/routers/*.ts; do
  if [ -f "$file" ]; then
    # Get line numbers of findMany calls
    grep -n "\.findMany" "$file" | while IFS=: read -r linenum line; do
      # Check if take: appears in next 10 lines
      endline=$((linenum + 10))
      if ! sed -n "${linenum},${endline}p" "$file" | grep -q "take:"; then
        echo "⚠️  Missing pagination: $file:$linenum"
        violations=$((violations + 1))
      fi
    done
  fi
done

echo ""
echo "======================================"
echo "SUMMARY"
echo "======================================"

if [ $violations -eq 0 ]; then
  echo "✅ All findMany() queries have pagination!"
else
  echo "⚠️  Found $violations queries without pagination"
  echo ""
  echo "Action required:"
  echo "  1. Review violations listed above"
  echo "  2. Add take: parameter using PAGINATION_LIMITS"
  echo "  3. Import: import { PAGINATION_LIMITS } from '@/lib/constants'"
  echo "  4. Re-run this script to verify"
fi

echo ""
