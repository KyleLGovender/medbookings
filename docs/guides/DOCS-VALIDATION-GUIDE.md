# Documentation Validation Guide

**Quick Reference for CLAUDE.md ↔ /docs/ Alignment**

---

## Overview

The documentation validation system ensures CLAUDE.md and /docs/ folder stay synchronized. It prevents:

- ❌ References to non-existent docs
- ❌ Orphaned documentation files
- ❌ Missing critical documentation references
- ❌ Inconsistent reference formatting

---

## Quick Commands

### Validate Documentation Alignment

```bash
node scripts/compliance/sync-compliance-rules.js validate-docs
```

**Output**:
```
📋 Validating CLAUDE.md ↔ /docs/ alignment...

✅ Referenced documentation files:
   • /docs/compliance/CONTEXT-LOADING.md
   • /docs/compliance/TYPE-SAFETY.md
   [... 8 more ...]

✅ Documentation alignment is valid
```

### Check Enforcement Status

```bash
node scripts/compliance/sync-compliance-rules.js status
```

**Output includes**:
- Last sync timestamp
- CLAUDE.md hash
- Documentation alignment stats
- Orphaned docs count

### Sync Enforcement Rules

```bash
node scripts/compliance/sync-compliance-rules.js sync
```

**This command**:
1. Validates docs alignment first
2. Blocks if errors exist
3. Warns if orphaned docs found
4. Syncs compliance rules if valid

---

## Reference Format Standard

### Correct Format

```markdown
📄 **[Topic Name]**: See `/docs/[FILENAME].md` for [description]
```

### Examples

**Simple**:
```markdown
📄 **Complete Workflow Guide**: See `/docs/compliance/DEVELOPMENT-WORKFLOW.md` for detailed task execution flow, development standards, and command execution policy.
```

**With Bullets**:
```markdown
📄 **Type Safety Patterns**: See `/docs/compliance/TYPE-SAFETY.md` for:
- Prisma JSON field handling with Zod schemas
- Type guard implementation patterns
- tRPC type extraction examples
```

---

## Adding New Documentation

### Step 1: Create the Doc File

```bash
# Create new documentation file
vim docs/NEW-TOPIC.md
```

**Template**:
```markdown
# [Topic Name]

**Reference:** CLAUDE.md Section X

## Overview

[Brief description]

## [Main Section 1]

[Content]

## [Main Section 2]

[Content]
```

### Step 2: Add Reference to CLAUDE.md

Edit the appropriate section:

```markdown
## SECTION X: [SECTION NAME]

📄 **[Topic Name]**: See `/docs/NEW-TOPIC.md` for [description]

[Rest of section content...]
```

### Step 3: Validate

```bash
# Check alignment
node scripts/compliance/sync-compliance-rules.js validate-docs

# Expected output:
# ✅ Referenced docs: 11
# ✅ Documentation alignment is valid
```

### Step 4: Commit Both Files

```bash
git add docs/NEW-TOPIC.md CLAUDE.md
git commit -m "docs: add NEW-TOPIC documentation with CLAUDE.md reference"

# Pre-commit hook will:
# 1. Validate docs alignment
# 2. Sync compliance rules
# 3. Auto-stage compliance-config.json
```

---

## Validation Output Explained

### Success Output

```
📊 Summary:
   Referenced docs: 10        ← All expected docs referenced
   Orphaned docs: 0           ← No unreferenced docs found
   Missing references: 0      ← All expected references present

✅ Documentation alignment is valid
```

### Warning Output

```
⚠️  Warnings:
   • ORPHANED_DOC: /docs/OLD-TOPIC.md exists but is not referenced in CLAUDE.md
     💡 Consider adding a reference to this doc in the appropriate CLAUDE.md section

📊 Summary:
   Referenced docs: 10
   Orphaned docs: 1           ← Action needed
   Missing references: 0
```

**Action Required**: Either:
1. Add reference to CLAUDE.md, OR
2. Delete the orphaned doc if no longer needed

### Error Output

```
❌ Errors:
   • MISSING_DOC: CLAUDE.md references /docs/MISSING.md but file does not exist

❌ Documentation alignment has errors
```

**Action Required**: Either:
1. Create the missing doc file, OR
2. Remove the reference from CLAUDE.md

---

## Troubleshooting

### "Orphaned docs detected"

**Cause**: Doc file exists but isn't referenced in CLAUDE.md

**Fix**:
```bash
# Option 1: Add reference
vim CLAUDE.md
# Add: 📄 **Topic**: See `/docs/ORPHANED.md`

# Option 2: Remove orphaned doc
rm docs/ORPHANED.md
```

### "Referenced doc doesn't exist"

**Cause**: CLAUDE.md references a file that doesn't exist

**Fix**:
```bash
# Option 1: Create the missing doc
vim docs/MISSING.md

# Option 2: Remove reference from CLAUDE.md
vim CLAUDE.md
# Delete the line referencing /docs/MISSING.md
```

### "Sync blocked by alignment errors"

**Cause**: Critical errors in docs alignment

**Fix**:
```bash
# 1. Run validation to see errors
node scripts/compliance/sync-compliance-rules.js validate-docs

# 2. Fix all reported errors

# 3. Re-validate
node scripts/compliance/sync-compliance-rules.js validate-docs

# 4. Try sync again
node scripts/compliance/sync-compliance-rules.js sync
```

---

## Pre-Commit Hook Behavior

When you commit changes to CLAUDE.md:

```bash
git add CLAUDE.md
git commit -m "docs: update references"

# Hook runs automatically:
# 1. Detects CLAUDE.md changed
# 2. Validates docs alignment
# 3. Syncs compliance rules
# 4. Auto-stages compliance-config.json
# 5. Continues commit if valid
```

**If alignment errors exist**:
```
❌ Documentation alignment errors detected
🚫 Commit blocked. Please fix the violations above.
```

---

## Expected Documentation Files

The validation system expects these files to be referenced:

1. ✅ `CONTEXT-LOADING.md` - Context management rules
2. ✅ `TYPE-SAFETY.md` - Type system patterns
3. ✅ `VERIFICATION-PROTOCOLS.md` - Verification checklists
4. ✅ `TIMEZONE-GUIDELINES.md` - Timezone handling
5. ✅ `LOGGING.md` - Logging & PHI protection
6. ✅ `BUG-DETECTION.md` - Bug detection patterns
7. ✅ `DEVELOPMENT-WORKFLOW.md` - Development workflow
8. ✅ `COMPLIANCE-SYSTEM.md` - Enforcement system
9. ✅ `CLAUDE-MD-AUTO-SYNC.md` - Auto-sync system
10. ✅ `DEPLOYMENT.md` - Production deployment

---

## Validation Configuration

The validation logic is in:

```
scripts/compliance/sync-compliance-rules.js
└── ClaudeMdParser.validateDocsAlignment()
```

**Checks performed**:
1. Extract all `/docs/*.md` references from CLAUDE.md
2. Verify each referenced file exists
3. Find docs that exist but aren't referenced
4. Check for missing expected references
5. Validate reference format consistency

**Configuration stored in**:
```
scripts/compliance/compliance-config.json
└── docsAlignment: {
      referencedDocs: [...],
      orphanedDocs: [...],
      lastValidated: "..."
    }
```

---

## Integration with CI/CD

The GitHub Actions workflow validates docs alignment:

```yaml
# .github/workflows/claude-compliance.yml

- name: Validate Documentation Alignment
  run: |
    node scripts/compliance/sync-compliance-rules.js validate-docs
    if [ $? -ne 0 ]; then
      echo "❌ Documentation alignment validation failed"
      exit 1
    fi
```

**Runs on**:
- Push to protected branches
- Pull requests to main/master

---

## Best Practices

### When Adding Documentation

1. ✅ Create doc file first
2. ✅ Add reference to CLAUDE.md
3. ✅ Validate alignment
4. ✅ Commit both files together

### When Removing Documentation

1. ✅ Remove reference from CLAUDE.md first
2. ✅ Delete doc file
3. ✅ Validate alignment
4. ✅ Commit both changes together

### When Refactoring Docs

1. ✅ Update doc content
2. ✅ Update CLAUDE.md reference (if description changed)
3. ✅ Validate alignment
4. ✅ Commit changes

---

## Quick Checklist

Before committing CLAUDE.md changes:

- [ ] All `/docs/*.md` references point to existing files
- [ ] No orphaned docs exist (or intentionally kept)
- [ ] Reference format is consistent
- [ ] `node scripts/compliance/sync-compliance-rules.js validate-docs` passes

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Main coding guidelines
- [CLAUDE-DOCS-INTEGRATION-PLAN.md](../CLAUDE-DOCS-INTEGRATION-PLAN.md) - Original integration plan
- [CLAUDE-DOCS-INTEGRATION-SUMMARY.md](../CLAUDE-DOCS-INTEGRATION-SUMMARY.md) - Implementation summary
- [CLAUDE-MD-AUTO-SYNC.md](CLAUDE-MD-AUTO-SYNC.md) - Auto-sync system details

---

**Last Updated**: 2025-10-03
**Maintained By**: Development Team
