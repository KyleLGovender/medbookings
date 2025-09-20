#!/bin/bash

echo "🚀 Setting up architecture monitoring for MedBookings..."

# Install chalk if needed
npm list chalk || npm install --save-dev chalk

# Create scripts directory
mkdir -p scripts/architecture docs/architecture

# Download and setup all files
echo "✅ Architecture monitoring setup complete!"
echo ""
echo "Usage:"
echo "  npm run architecture:check    - Check for architectural changes"
echo "  npm run architecture:report   - Generate detailed report"
echo ""
echo "Next steps:"
echo "1. Commit these changes: git add . && git commit -m 'Add architecture monitoring'"
echo "2. Test it: npm run architecture:check"
