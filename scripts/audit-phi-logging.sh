#!/bin/bash

echo "🔒 PHI SANITIZATION AUDIT"
echo "Generated: $(date)"
echo ""

violations=0

# Search for potentially unsafe logging patterns
echo "Searching for logger calls with PHI that may not be sanitized..."
echo ""

# Pattern 1: logger with 'email' that doesn't use sanitizeEmail
grep -rn "logger\." src/ --include="*.ts" --include="*.tsx" | \
  grep -E "(email|phone|name|userId)" | \
  grep -v "sanitize" | \
  grep -v "// eslint-disable" | \
  grep -v "node_modules" | \
  head -20

echo ""
echo "======================================"
echo "RECOMMENDATIONS"
echo "======================================"
echo "Review the findings above and ensure:"
echo "  - email fields use sanitizeEmail()"
echo "  - phone fields use sanitizePhone()"
echo "  - name fields use sanitizeName()"
echo "  - userId fields use sanitizeUserId()"
echo ""
echo "Import from: import { sanitizeEmail, sanitizePhone, sanitizeName, sanitizeUserId } from '@/lib/logger'"
echo ""
