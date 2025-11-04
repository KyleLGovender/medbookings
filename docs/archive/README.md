# Documentation Archive

**Purpose**: Historical documentation that is no longer actively maintained but kept for reference.

**Status**: Archive | **Last Updated**: 2025-11-04

---

## 📋 What's in the Archive?

This folder contains documentation that was previously part of the active documentation but has been archived for one of the following reasons:

1. **Completed Projects**: Documentation for projects that have been completed and integrated
2. **Historical Reference**: Implementation plans or status documents that are no longer needed for active development
3. **Superseded Documentation**: Files that have been replaced by more current documentation

---

## 📁 Archived Files

### [REMEDIATION-STATUS.md](./REMEDIATION-STATUS.md)

**Original Location**: `/docs/deployment/REMEDIATION-STATUS.md`
**Archived**: 2025-11-04
**Reason**: Remediation project completed

**Contents**:
- Security audit findings (9 critical/high/medium issues)
- 6-phase remediation plan
- Implementation status tracking
- Related documentation references

**Why Archived**:
- Remediation work completed (5 of 14 tasks done, others deprioritized)
- Security fixes implemented and verified
- Active documentation now covers all implemented features
- Kept for historical reference of security improvements

**Related Active Documentation**:
- [Security Checklist](/docs/deployment/SECURITY-CHECKLIST.md) - Current security verification
- [Logging](/docs/compliance/LOGGING.md) - PHI protection implementation
- [Timezone Guidelines](/docs/compliance/TIMEZONE-GUIDELINES.md) - Timezone handling

---

## 🔍 When to Reference Archived Docs

Archived documentation should be referenced when:

1. **Understanding History**: Learning about past architectural decisions or implementations
2. **Security Audits**: Reviewing previous security issues and how they were resolved
3. **Future Planning**: Understanding what approaches were tried and why they were chosen or abandoned
4. **Onboarding**: Providing context to new team members about project evolution

---

## ⚠️ Important Notes

- **Not Maintained**: Archived documents are NOT updated with current codebase changes
- **May Be Outdated**: Code examples, file paths, and references may no longer be accurate
- **Reference Only**: Use for historical context, not as implementation guide
- **Active Docs First**: Always check active documentation before referencing archived docs

---

## 📝 Archival Process

When archiving documentation:

1. **Move** the file to `/docs/archive/`
2. **Update** this README with details about the archived file
3. **Fix References**: Update or remove references to the archived file in active documentation
4. **Update INDEX.md**: Reflect the new structure in the documentation index
5. **Commit**: Document the archival in git commit message

---

## 🔄 Restoring Archived Documentation

If archived documentation needs to be restored:

1. **Review Content**: Ensure it's still relevant and accurate
2. **Update Information**: Bring code examples and references up to date
3. **Move Back**: Restore to appropriate active documentation folder
4. **Update INDEX.md**: Add back to active documentation navigation
5. **Test References**: Verify all internal links still work

---

## 📚 Related Documentation

- [Documentation Index](/docs/INDEX.md) - Current active documentation
- [Documentation Validation Guide](/docs/guides/DOCS-VALIDATION-GUIDE.md) - Documentation standards
- [CLAUDE.md](/CLAUDE.md) - Main project guidelines

---

**Last Updated**: 2025-11-04
**Maintained by**: Development Team
