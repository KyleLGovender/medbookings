# Scripts Directory

Organized utility scripts for the MedBookings project, grouped by purpose.

## 📁 Directory Structure

```
scripts/
├── architecture/       # Architecture validation scripts
├── communications/     # Email/SMS/WhatsApp templates and testing
├── compliance/        # CLAUDE.md compliance system (Rule Sync)
├── testing/           # Test utilities and E2E setup
├── commit-gate/       # Pre-commit validation (Commit Gate)
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

## 🛡️ **Compliance System** (`compliance/`)

CLAUDE.md compliance system management (Rule Sync component) - handles configuration and synchronization.

### Files
- **`setup-compliance.sh`** - One-command setup for entire compliance system
- **`sync-compliance-rules.js`** - Syncs CLAUDE.md changes with compliance rules
- **`compliance-config.json`** - Compliance configuration and rule severity
- **`count-violations.sh`** - Counts CLAUDE.md violations in the codebase
- **`scan-violations.sh`** - Scans for violations across files
- **`fix-file.sh`** - Interactive script to fix violations in a specific file
- **`verify-file.sh`** - Verifies a file has no violations and passes all checks

### Usage
```bash
# Initial setup (run once)
bash scripts/compliance/setup-compliance.sh

# Sync compliance rules after CLAUDE.md changes
node scripts/compliance/sync-compliance-rules.js

# Scan for violations
bash scripts/compliance/scan-violations.sh

# Count violations by category
bash scripts/compliance/count-violations.sh

# Fix violations in a specific file
bash scripts/compliance/fix-file.sh src/path/to/file.ts

# Verify a file is clean
bash scripts/compliance/verify-file.sh src/path/to/file.ts
```

---

## 🚪 **Commit Gate** (`commit-gate/`)

Pre-commit validation scripts (Commit Gate component) - validates changes before commits.

### Files
- **`compliance-validator.js`** - Main compliance validator engine
- **`pre-write-gate.sh`** - Pre-write validation wrapper
- **`post-write-gate.sh`** - Post-write validation wrapper
- **`phi-validator.js`** - PHI (Protected Health Information) validator
- **`transaction-validator.js`** - Database transaction validator

### Usage
```bash
# Validate a specific file
node scripts/commit-gate/compliance-validator.js validate-file src/path/to/file.ts

# Validate changes between old and new versions
node scripts/commit-gate/compliance-validator.js validate-change src/path/to/file.ts old.ts new.ts
```

**Note:** These scripts are typically called automatically by the pre-commit hook (`.husky/pre-commit`)

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

## 🔄 **Workflow Integration**

### Pre-commit Hook (`.husky/pre-commit`)
The pre-commit hook automatically runs validation scripts before each commit:
```bash
# Validation order:
1. compliance-validator.js - CLAUDE.md compliance
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
    "setup-compliance": "bash scripts/compliance/setup-compliance.sh",
    "validate-claude": "node scripts/commit-gate/compliance-validator.js validate-file",
    "sync:compliance": "node scripts/compliance/sync-enforcement-rules.js"
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
npm run setup-compliance

# 3. Verify setup
npm run validate-claude src/lib/auth.ts
```

### Fixing Violations
```bash
# 1. Scan for violations
bash scripts/compliance/scan-violations.sh

# 2. Fix specific file
bash scripts/compliance/fix-file.sh src/path/to/file.ts

# 3. Verify fix
bash scripts/compliance/verify-file.sh src/path/to/file.ts
```

### After CLAUDE.md Changes
```bash
# Sync enforcement rules with CLAUDE.md
npm run sync:compliance

# Verify sync worked
npm run lint
```

---

## 🔍 **Script Categories**

| Category | Purpose | When to Use |
|----------|---------|-------------|
| **Commit Gate** | Pre-commit validation | Automatic on commit, manual validation |
| **Compliance** | Setup and maintain rules | Initial setup, after CLAUDE.md changes |
| **Testing** | Test features and flows | Development, CI/CD |
| **Communications** | Manage templates | Template updates, testing emails/SMS |
| **Architecture** | Validate structure | After major changes, CI/CD |

---

## ⚠️ **Important Notes**

1. **Commit Gate vs Compliance Setup**
   - `commit-gate/` - Validates code changes before commits
   - `compliance/` - Sets up and maintains the rule system

2. **Execution Order**
   - Commit Gate validation runs first (fast feedback)
   - Compliance setup runs once or after rule changes

3. **File Permissions**
   - All `.sh` scripts should be executable: `chmod +x scripts/**/*.sh`
   - Node scripts don't need execute permission (run with `node`)

4. **Path References**
   - All scripts expect to be run from project root
   - Use relative paths: `scripts/commit-gate/...`
   - Import references use `../compliance/` for config

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
chmod +x scripts/compliance/setup-compliance.sh
```

### "Config file not found"
```bash
# Verify you're in project root
pwd  # Should show: .../medbookings

# Check config exists
ls -la scripts/compliance/compliance-config.json
```

### Validation fails after moving files
```bash
# Re-sync enforcement rules
npm run sync:compliance

# Rebuild
npm run build
```

---

## 📚 **Related Documentation**

- `/docs/compliance/COMPLIANCE-SYSTEM.md` - Detailed enforcement system guide
- `/docs/compliance/TIMEZONE-GUIDELINES.md` - Timezone handling rules
- `/docs/compliance/LOGGING.md` - Logging and PHI protection
- `/CLAUDE.md` - Complete project rules and patterns

---

## 🤝 **Contributing**

When adding new scripts:

1. **Choose the correct category**
   - Commit Gate: Pre-commit validation and code checking
   - Compliance: Rule setup/maintenance and configuration
   - Testing: Test utilities
   - Communications: Templates/notifications
   - Architecture: Structure validation

2. **Follow naming conventions**
   - kebab-case: `check-something.js`
   - Descriptive: `validate-timezone-usage.sh`
   - Purpose-focused: `setup-compliance.sh`

3. **Add to README**
   - List under appropriate category
   - Document usage with examples
   - Explain what it does

4. **Update references**
   - Check all files that might import it
   - Update package.json scripts if needed
   - Update CI/CD workflows

---

**Last Updated:** 2024-10-09
**Maintainer:** Development Team
