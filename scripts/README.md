# Scripts Directory

Organized utility scripts for the MedBookings project, grouped by purpose.

## 📁 Directory Structure

```
scripts/
├── architecture/       # Architecture validation scripts
├── communications/     # Email/SMS/WhatsApp templates and testing
├── enforcement/       # CLAUDE.md enforcement and setup
├── testing/           # Test utilities and E2E setup
├── validation/        # Code validation and compliance checking
└── archive/           # Deprecated/old scripts
```

---

## 🏗️ **Architecture** (`architecture/`)

Scripts for validating architectural integrity and core file structure.

### Files
- **`check-core-files.js`** - Validates that critical infrastructure files exist and are properly configured

### Usage
```bash
node scripts/architecture/check-core-files.js
```

---

## 📧 **Communications** (`communications/`)

Email, SMS, and WhatsApp template management and testing utilities.

### Files
- **`check-sendgrid-config.js`** - Validates SendGrid configuration
- **`check-specific-templates.js`** - Checks specific email templates
- **`check-twilio-templates.js`** - Validates Twilio SMS templates
- **`create-or-update-templates.js`** - Creates or updates communication templates
- **`email-templates-for-testing.js`** - Email templates for testing
- **`get-template-details.js`** - Retrieves template details
- **`monitor-booking-emails.js`** - Monitors booking email delivery

### Usage
```bash
# Check SendGrid configuration
node scripts/communications/check-sendgrid-config.js

# Create/update templates
node scripts/communications/create-or-update-templates.js
```

---

## 🛡️ **Enforcement** (`enforcement/`)

CLAUDE.md compliance enforcement system setup, configuration, and violation scanning.

### Files
- **`setup-enforcement.sh`** - One-command setup for entire enforcement system
- **`sync-enforcement-rules.js`** - Syncs CLAUDE.md changes with enforcement rules
- **`enforcement-config.json`** - Enforcement configuration and rule severity
- **`count-violations.sh`** - Counts CLAUDE.md violations in the codebase
- **`scan-violations.sh`** - Scans for violations across files
- **`fix-file.sh`** - Interactive script to fix violations in a specific file
- **`verify-file.sh`** - Verifies a file has no violations and passes all checks

### Usage
```bash
# Initial setup (run once)
bash scripts/enforcement/setup-enforcement.sh

# Sync enforcement rules after CLAUDE.md changes
node scripts/enforcement/sync-enforcement-rules.js

# Scan for violations
bash scripts/enforcement/scan-violations.sh

# Count violations by category
bash scripts/enforcement/count-violations.sh

# Fix violations in a specific file
bash scripts/enforcement/fix-file.sh src/path/to/file.ts

# Verify a file is clean
bash scripts/enforcement/verify-file.sh src/path/to/file.ts
```

---

## 🧪 **Testing** (`testing/`)

Test utilities, E2E test setup, and testing helper scripts.

### Files
- **`setup-e2e.sh`** - Sets up Playwright E2E testing environment
- **`test-setup.sh`** - General test setup script
- **`create-test-booking.js`** - Creates test bookings for testing
- **`test-booking-email-flow.js`** - Tests booking email flow
- **`test-booking-notifications.js`** - Tests booking notifications
- **`test-email-system.js`** - Tests email system functionality
- **`test-new-templates.js`** - Tests new communication templates
- **`test-enhanced-warnings.js`** - Tests enhanced warning system

### Usage
```bash
# Setup E2E tests
bash scripts/testing/setup-e2e.sh

# Test email system
node scripts/testing/test-email-system.js

# Test booking flow
node scripts/testing/test-booking-email-flow.js

# Test enhanced warnings
node scripts/testing/test-enhanced-warnings.js
```

---

## ✅ **Validation** (`validation/`)

Code validation, compliance checking, and CLAUDE.md rule enforcement.

### Files
- **`claude-code-validator.js`** - Main CLAUDE.md compliance validator
- **`claude-pre-write-validator.sh`** - Pre-write validation hook
- **`claude-post-write-validator.sh`** - Post-write validation hook
- **`enhanced-phi-validator.js`** - PHI (Protected Health Information) validation
- **`enhanced-transaction-validator.js`** - Database transaction validation

### Usage
```bash
# Validate a specific file
node scripts/validation/claude-code-validator.js validate-file src/path/to/file.ts

# Validate code changes
node scripts/validation/claude-code-validator.js validate-change <file> <old-temp> <new-file>

# Run PHI validation
node scripts/validation/enhanced-phi-validator.js

# Run transaction validation
node scripts/validation/enhanced-transaction-validator.js
```

---

## 🔄 **Workflow Integration**

### Pre-commit Hook (`.husky/pre-commit`)
The pre-commit hook automatically runs validation scripts before each commit:
```bash
# Validation order:
1. claude-code-validator.js - CLAUDE.md compliance
2. Console statement check
3. Timezone violation check
4. Backup file check
```

### CI/CD Pipeline (`.github/workflows/claude-compliance.yml`)
GitHub Actions runs comprehensive validation on every push:
```yaml
- CLAUDE.md Rule Validation
- ESLint with custom rules
- TypeScript type check
- Backup file check
- Console statement check
- Timezone violation check
```

### Package.json Scripts
```json
{
  "scripts": {
    "setup-enforcement": "bash scripts/enforcement/setup-enforcement.sh",
    "validate-claude": "node scripts/validation/claude-code-validator.js validate-file",
    "sync:enforcement": "node scripts/enforcement/sync-enforcement-rules.js"
  }
}
```

---

## 📋 **Common Tasks**

### Initial Setup (New Developer)
```bash
# 1. Install dependencies
npm install

# 2. Setup enforcement system
npm run setup-enforcement

# 3. Verify setup
npm run validate-claude src/lib/auth.ts
```

### Fixing Violations
```bash
# 1. Scan for violations
bash scripts/enforcement/scan-violations.sh

# 2. Fix specific file
bash scripts/enforcement/fix-file.sh src/path/to/file.ts

# 3. Verify fix
bash scripts/enforcement/verify-file.sh src/path/to/file.ts
```

### After CLAUDE.md Changes
```bash
# Sync enforcement rules with CLAUDE.md
npm run sync:enforcement

# Verify sync worked
npm run lint
```

---

## 🔍 **Script Categories**

| Category | Purpose | When to Use |
|----------|---------|-------------|
| **Validation** | Check code compliance | Before commits, during development |
| **Enforcement** | Setup and maintain rules | Initial setup, after CLAUDE.md changes |
| **Testing** | Test features and flows | Development, CI/CD |
| **Communications** | Manage templates | Template updates, testing emails/SMS |
| **Architecture** | Validate structure | After major changes, CI/CD |

---

## ⚠️ **Important Notes**

1. **Validation vs Enforcement**
   - `validation/` - Checks if code follows rules
   - `enforcement/` - Sets up and maintains the rule system

2. **Execution Order**
   - Validation runs first (fast feedback)
   - Enforcement setup runs once or after rule changes

3. **File Permissions**
   - All `.sh` scripts should be executable: `chmod +x scripts/**/*.sh`
   - Node scripts don't need execute permission (run with `node`)

4. **Path References**
   - All scripts expect to be run from project root
   - Use relative paths: `scripts/validation/...`
   - Import references use `../enforcement/` for config

---

## 🆘 **Troubleshooting**

### "Command not found: node"
```bash
# Install Node.js first
brew install node  # macOS
```

### "Permission denied" errors
```bash
# Make script executable
chmod +x scripts/enforcement/setup-enforcement.sh
```

### "Config file not found"
```bash
# Verify you're in project root
pwd  # Should show: .../medbookings

# Check config exists
ls -la scripts/enforcement/enforcement-config.json
```

### Validation fails after moving files
```bash
# Re-sync enforcement rules
npm run sync:enforcement

# Rebuild
npm run build
```

---

## 📚 **Related Documentation**

- `/docs/enforcement/ENFORCEMENT.md` - Detailed enforcement system guide
- `/docs/enforcement/TIMEZONE-GUIDELINES.md` - Timezone handling rules
- `/docs/enforcement/LOGGING.md` - Logging and PHI protection
- `/CLAUDE.md` - Complete project rules and patterns

---

## 🤝 **Contributing**

When adding new scripts:

1. **Choose the correct category**
   - Validation: Code checking/compliance
   - Enforcement: Rule setup/maintenance
   - Testing: Test utilities
   - Communications: Templates/notifications
   - Architecture: Structure validation

2. **Follow naming conventions**
   - kebab-case: `check-something.js`
   - Descriptive: `validate-timezone-usage.sh`
   - Purpose-focused: `setup-enforcement.sh`

3. **Add to README**
   - List under appropriate category
   - Document usage with examples
   - Explain what it does

4. **Update references**
   - Check all files that might import it
   - Update package.json scripts if needed
   - Update CI/CD workflows

---

**Last Updated:** 2025-10-04
**Maintainer:** Development Team
