# CLAUDE.md Auto-Sync System

## Overview

This document describes the **automatic synchronization system** that keeps the enforcement validators synchronized with CLAUDE.md as it changes throughout the development lifecycle.

**Problem Solved:** CLAUDE.md was 40,676 characters (exceeding Claude Code's 40k optimal limit). The file has been condensed to 17,151 characters (58% reduction) by extracting verbose sections to `/docs/*`. The auto-sync system ensures enforcement rules stay aligned with CLAUDE.md changes.

---

## Architecture

### Component Overview

```
CLAUDE.md (17k chars)
    ↓
    ↓ [Modified]
    ↓
Pre-Commit Hook Detects Change
    ↓
    ↓ [Triggers]
    ↓
scripts/enforcement/sync-enforcement-rules.js
    ↓
    ↓ [Parses & Extracts]
    ↓
scripts/enforcement/enforcement-config.json
    ↓
    ↓ [Read By]
    ↓
scripts/validation/claude-code-validator.js
    ↓
    ↓ [Validates Code]
    ↓
Enforcement System Blocks Violations
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Condensed CLAUDE.md** | Main rules (17k chars) | `/CLAUDE.md` |
| **Full CLAUDE.md Backup** | Original version (40k chars) | `/CLAUDE.md.full-backup` |
| **Extracted Documentation** | Verbose sections | `/docs/*` |
| **Sync Script** | Parses CLAUDE.md and generates config | `scripts/enforcement/sync-enforcement-rules.js` |
| **Enforcement Config** | Auto-generated rule definitions | `scripts/enforcement/enforcement-config.json` |
| **Validator** | Validates code against config | `scripts/validation/claude-code-validator.js` |
| **Pre-Commit Hook** | Detects CLAUDE.md changes | `.husky/pre-commit` |

---

## How It Works

### 1. CLAUDE.md is Modified

When you edit CLAUDE.md to add/modify rules:

```markdown
Timezone Handling (CRITICAL)

FORBIDDEN Timezone Patterns (NEVER USE):
❌ const now = new Date();
❌ const timestamp = Date.now();
```

### 2. Git Commit Triggers Auto-Sync

When you run `git commit`, the pre-commit hook detects the CLAUDE.md change:

```bash
$ git commit -m "docs: update timezone rules"

🔍 Running CLAUDE.md compliance validation...
⚠️  CLAUDE.md has been modified - syncing enforcement rules...
✅ Enforcement rules synced with CLAUDE.md
📝 Auto-staged: scripts/enforcement/enforcement-config.json
```

### 3. Sync Script Parses CLAUDE.md

`scripts/enforcement/sync-enforcement-rules.js` extracts enforceable rules:

```javascript
class ClaudeMdParser {
  parse() {
    return {
      timezone: this.extractTimezoneRules(),
      typeSafety: this.extractTypeSafetyRules(),
      logging: this.extractLoggingRules(),
      architecture: this.extractArchitectureRules(),
      business: this.extractBusinessRules(),
      // ... more categories
    };
  }
}
```

### 4. Config is Generated

The script generates `scripts/enforcement/enforcement-config.json`:

```json
{
  "claudeMdHash": "1a2542...",
  "lastSync": "2025-10-02T14:49:19.505Z",
  "validatorConfig": {
    "rules": {
      "timezone": {
        "enabled": true,
        "patterns": {
          "forbidden": ["new Date()", "Date.now()"],
          "allowed": ["nowUTC()", "nowSAST()"]
        },
        "severity": "ERROR"
      }
    }
  }
}
```

### 5. Validator Uses Config

`scripts/validation/claude-code-validator.js` reads the config to validate code:

```javascript
const config = JSON.parse(fs.readFileSync('scripts/enforcement/enforcement-config.json'));

if (config.validatorConfig.rules.timezone.enabled) {
  // Check for forbidden patterns
  if (/new Date\(\)/.test(code)) {
    violations.push({ rule: 'TIMEZONE_VIOLATION', ... });
  }
}
```

### 6. Enforcement System Blocks Violations

Pre-commit hook validates all code changes:

```bash
❌ CLAUDE.md Compliance Violations Detected

1. [ERROR] TIMEZONE_VIOLATION
   File: src/lib/auth.ts:39
   Use timezone utilities from @/lib/timezone instead of new Date()
   Code: if (user.accountLockedUntil < new Date()) {
   Fix: Replace with nowUTC(), parseUTC(), or date-fns functions

🚫 Commit blocked. Please fix the violations above.
```

---

## Extracted Documentation

CLAUDE.md now references these extracted docs for verbose details:

| Reference | Description | Size | Location |
|-----------|-------------|------|----------|
| **Context Loading** | Initial context, task-specific context, context management | 900+ lines | `/docs/CONTEXT-LOADING.md` |
| **Type Safety** | Type system architecture, Prisma JSON fields | 530+ lines | `/docs/TYPE-SAFETY.md` |
| **Timezone Guidelines** | UTC storage, SAST display, utilities | 450+ lines | `/docs/TIMEZONE-GUIDELINES.md` |
| **Logging** | Logger API, PHI sanitization, POPIA compliance | 925+ lines | `/docs/LOGGING.md` |
| **Deployment** | Production requirements, pre-deployment checklist | 416+ lines | `/docs/DEPLOYMENT.md` |
| **Enforcement** | Three-layer enforcement system, rule documentation | 500+ lines | `/docs/ENFORCEMENT.md` |
| **Verification Protocols** | Route validation, data source checks, build protocol | 150+ lines | `/docs/VERIFICATION-PROTOCOLS.md` |
| **Bug Detection** | React issues, database issues, debugging protocol | 200+ lines | `/docs/BUG-DETECTION.md` |
| **Development Workflow** | Task execution flow, development standards | 150+ lines | `/docs/DEVELOPMENT-WORKFLOW.md` |

---

## Usage

### Automatic Sync (Recommended)

The sync happens **automatically** when you commit CLAUDE.md changes:

```bash
# 1. Edit CLAUDE.md
vim CLAUDE.md

# 2. Stage and commit
git add CLAUDE.md
git commit -m "docs: update timezone rules"

# ✅ Auto-sync happens in pre-commit hook
# ✅ enforcement-config.json is auto-generated
# ✅ enforcement-config.json is auto-staged
```

### Manual Sync

You can also manually sync:

```bash
# Sync enforcement rules from CLAUDE.md
npm run sync-enforcement

# Check if sync is needed
npm run check-enforcement-sync
```

### Check Sync Status

```bash
$ node scripts/enforcement/sync-enforcement-rules.js status

Enforcement System Status:
  Last sync: 2025-10-02T14:49:19.505Z
  CLAUDE.md hash: 1a254207820372bb...
  Changed: NO ✅
```

---

## Sync Detection

The sync script uses **SHA-256 hashing** to detect CLAUDE.md changes:

```javascript
class ClaudeMdParser {
  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.content)
      .digest('hex');
  }
}
```

**Hash is stored in:** `scripts/enforcement/enforcement-config.json`
**Checked by:** Pre-commit hook, CI/CD workflow

If CLAUDE.md hash doesn't match config hash → **Sync required**

---

## Rule Extraction Patterns

The sync script extracts rules using pattern matching:

### Timezone Rules

**Pattern Searched:**
```markdown
FORBIDDEN Timezone Patterns (NEVER USE):
❌ const now = new Date();
```

**Extracted:**
```json
{
  "timezone": {
    "forbidden": ["new Date()", "Date.now()"],
    "severity": "ERROR"
  }
}
```

### Type Safety Rules

**Pattern Searched:**
```markdown
Type Safety Rules (Zero Tolerance):
- ❌ NEVER use `as any`
```

**Extracted:**
```json
{
  "typeSafety": {
    "forbidden": ["as any", "@ts-ignore"],
    "severity": "ERROR"
  }
}
```

### Architecture Rules

**Pattern Searched:**
```markdown
CRITICAL RULES:
- Hooks MUST NOT export types
- Database queries ONLY in tRPC procedures
```

**Extracted:**
```json
{
  "architecture": [
    {
      "name": "HOOKS_EXPORT_TYPES",
      "message": "Hooks MUST NOT export types",
      "severity": "ERROR"
    }
  ]
}
```

---

## CI/CD Integration

The GitHub Actions workflow also checks sync status:

```yaml
# .github/workflows/claude-compliance.yml

- name: Check Enforcement Sync
  run: |
    if ! npm run check-enforcement-sync; then
      echo "❌ CLAUDE.md has changed but enforcement rules not synced"
      echo "Run: npm run sync-enforcement"
      exit 1
    fi
```

---

## Maintaining the System

### When Adding New Rules to CLAUDE.md

1. **Add the rule to CLAUDE.md** using standard format:
   ```markdown
   FORBIDDEN Patterns:
   ❌ Pattern to forbid

   REQUIRED Patterns:
   ✅ Pattern to require
   ```

2. **Commit CLAUDE.md:**
   ```bash
   git add CLAUDE.md
   git commit -m "docs: add new rule for X"
   ```

3. **Auto-sync happens automatically** in pre-commit hook

4. **Verify sync:**
   ```bash
   cat scripts/enforcement/enforcement-config.json | grep "newRule"
   ```

### When Extracting Sections to Docs

If a section becomes too verbose in CLAUDE.md:

1. **Create new doc:** `/docs/NEW-TOPIC.md`
2. **Move verbose content** to new doc
3. **Replace in CLAUDE.md** with:
   ```markdown
   **Full Details:** `/docs/NEW-TOPIC.md`

   Brief summary here (key rules only)
   ```
4. **Commit both files:**
   ```bash
   git add CLAUDE.md docs/NEW-TOPIC.md
   git commit -m "docs: extract verbose section to NEW-TOPIC.md"
   ```

### When Updating Sync Script

If you need to extract new rule types:

1. **Edit** `scripts/enforcement/sync-enforcement-rules.js`
2. **Add extraction method:**
   ```javascript
   extractNewRuleType() {
     return {
       enabled: /NEW RULE PATTERN/i.test(this.content),
       patterns: this.extractPatterns(),
       severity: 'ERROR'
     };
   }
   ```
3. **Add to parse():**
   ```javascript
   parse() {
     return {
       // ... existing rules
       newRuleType: this.extractNewRuleType(),
     };
   }
   ```
4. **Test extraction:**
   ```bash
   npm run sync-enforcement
   cat scripts/enforcement/enforcement-config.json | grep "newRuleType"
   ```

---

## Troubleshooting

### "Sync failed" Error

**Cause:** Parsing error in sync-enforcement-rules.js

**Fix:**
```bash
# Run sync manually to see detailed error
node scripts/enforcement/sync-enforcement-rules.js sync

# Check for syntax errors in CLAUDE.md
cat CLAUDE.md | grep "🔴\|📂\|🏗️"  # Verify sections
```

### "Enforcement rules out of sync" Warning

**Cause:** CLAUDE.md changed but not committed yet

**Fix:**
```bash
# Check status
npm run check-enforcement-sync

# Sync manually
npm run sync-enforcement

# Verify hash
git diff scripts/enforcement/enforcement-config.json
```

### Config Not Auto-Staged

**Cause:** Pre-commit hook didn't detect CLAUDE.md change

**Fix:**
```bash
# Manually sync and stage
npm run sync-enforcement
git add scripts/enforcement/enforcement-config.json

# Verify pre-commit hook
cat .husky/pre-commit | grep "CLAUDE.md"
```

---

## Performance Impact

### Before Optimization
- **CLAUDE.md Size:** 40,676 characters
- **Claude Code Warning:** ⚠️ Large CLAUDE.md (40.4k > 40.0k)
- **Token Usage:** ~10k tokens per session
- **Performance:** Degraded

### After Optimization
- **CLAUDE.md Size:** 17,151 characters (58% reduction)
- **Claude Code Warning:** ✅ None
- **Token Usage:** ~4k tokens per session
- **Performance:** Optimal

### Extracted Docs Impact
- **Total Documentation:** 4,000+ lines across 9 docs
- **Referenced On-Demand:** Only loaded when explicitly needed
- **No Performance Impact:** Docs not loaded unless referenced

---

## Related Documentation

- [CLAUDE.md](/CLAUDE.md) - Main coding guidelines (condensed)
- [ENFORCEMENT.md](/docs/ENFORCEMENT.md) - Enforcement system details
- [TYPE-SAFETY.md](/docs/TYPE-SAFETY.md) - Type system architecture
- [TIMEZONE-GUIDELINES.md](/docs/TIMEZONE-GUIDELINES.md) - Timezone handling
- [LOGGING.md](/docs/LOGGING.md) - Logging & PHI protection

---

## Summary

The auto-sync system ensures that:

1. ✅ CLAUDE.md stays under 40k character limit
2. ✅ Enforcement rules always match CLAUDE.md
3. ✅ No manual sync required
4. ✅ Pre-commit hook blocks outdated validators
5. ✅ CI/CD validates sync status
6. ✅ Documentation extracted for verbosity
7. ✅ Performance optimized

**Result:** Maintainable, automated, and performant enforcement system that scales with CLAUDE.md changes.
