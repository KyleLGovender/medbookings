# Compliance System Changelog

All notable changes to the CLAUDE.md compliance system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2025-10-05

### Added

- **GitHub Actions Baseline Fix**: CI validation now correctly compares against PR base branch or push parent commit instead of always using `HEAD~1`
- **CHANGELOG.md**: Added this changelog for tracking enforcement system changes over time
- **ESLint Fallback Documentation**: Documented fail-safe behavior when `compliance-config.json` is unreadable

### Fixed

- **Path Resolution Bug**: Fixed test script (`test-enhanced-warnings.js`) using incorrect path to CLAUDE.md
- **Transaction Detection**: Increased lookback from 10 to 50 lines to handle larger transaction blocks
- **Transaction Regex**: Updated regex to support array syntax `$transaction([...])` in addition to `$transaction(...)`

### Changed

- Improved validator error messages for better developer guidance

---

## [1.0.0] - 2025-10-04

### Added

- **Email Verification Race Condition Fix**: Enhanced handling for React Strict Mode duplicate requests
- **Enhanced PHI Validator**: Added confidence levels (HIGH/MEDIUM/LOW) for PHI warnings
- **Enhanced Transaction Validator**: Added risk assessment (CRITICAL/HIGH/MEDIUM/LOW) for transaction warnings
- **Suppression Comments**: Support for `// phi-safe:` and `// tx-safe:` suppression comments
- **Auto-Sync System**: SHA-256 hash-based automatic synchronization of CLAUDE.md changes with enforcement rules
- **Documentation Alignment Validation**: Ensures all /docs/ references in CLAUDE.md exist and are properly formatted

### Fixed

- **CI Exclusions**: Aligned GitHub Actions validation exclusions with pre-commit hook exclusions
- **Infrastructure File Handling**: Properly exclude timezone utility files and logging infrastructure from timezone checks
- **Console Check**: Exclude infrastructure files from console statement validation

### Changed

- Reorganized enforcement scripts into dedicated directory structure
- Updated enforcement documentation paths for clarity
- Improved git hooks setup and configuration

---

## [0.9.0] - Initial Release (Date: ~2025-09-30)

### Added

- **Three-Layer Enforcement Architecture**:
  - Layer 1: Real-time IDE feedback via ESLint custom rules
  - Layer 2: Pre-commit hooks via Husky
  - Layer 3: CI/CD gates via GitHub Actions
- **Core Validator**: Pattern-based code analysis engine (`claude-code-validator.js`)
- **ESLint Custom Rules**:
  - `no-new-date`: Prevents timezone violations
  - Type organization rules
  - PHI sanitization warnings
- **Pre-commit Hook**: Validates staged files before commit
- **GitHub Actions Workflow**: Comprehensive validation suite for CI/CD
- **Validation Rules**:
  - Timezone compliance (ERROR)
  - Type safety (ERROR)
  - Cross-feature imports (ERROR)
  - Hooks type exports (ERROR)
  - Database queries outside tRPC (ERROR)
  - Unbounded queries (ERROR)
  - PHI sanitization (WARNING)
  - Zod validation (WARNING)
  - Booking transactions (WARNING)
- **Enforcement Configuration**: Dynamic rule loading from `compliance-config.json`
- **Documentation**:
  - ENFORCEMENT.md
  - TIMEZONE-GUIDELINES.md
  - TYPE-SAFETY.md
  - LOGGING.md
  - BUG-DETECTION.md
  - DEVELOPMENT-WORKFLOW.md

---

## Version History Overview

| Version   | Release Date | Key Features                                            |
| --------- | ------------ | ------------------------------------------------------- |
| **1.1.0** | 2025-10-05   | Baseline fix, improved transaction detection, changelog |
| **1.0.0** | 2025-10-04   | Enhanced validators, suppression comments, auto-sync    |
| **0.9.0** | ~2025-09-30  | Initial three-layer enforcement system                  |

---

## Upgrade Guide

### Upgrading to 1.1.0 from 1.0.0

No breaking changes. Simply pull the latest changes:

```bash
git pull origin main
npm install  # Ensure dependencies are up to date
```

Verify the upgrade:

```bash
# Check enforcement config version
cat scripts/enforcement/compliance-config.json | grep version

# Run a test validation
node scripts/commit-gate/compliance-validator.js validate-file src/lib/auth.ts
```

### Upgrading to 1.0.0 from 0.9.0

1. **Update CLAUDE.md** if you have local modifications
2. **Run sync** to regenerate compliance-config.json:
   ```bash
   node scripts/enforcement/sync-compliance-rules.js sync
   ```
3. **Test suppression comments** if you have false positives:
   ```typescript
   // phi-safe: emailVerified is a boolean status, not the email address
   logger.info('User status', { emailVerified: user.emailVerified });
   ```

---

## Configuration Changes Log

### compliance-config.json Schema Evolution

#### Version 1.1.0

- No schema changes
- Version remains at "1.0.0" (config schema unchanged)

#### Version 1.0.0

```json
{
  "claudeMdHash": "SHA-256 hash of CLAUDE.md",
  "lastSync": "ISO 8601 timestamp",
  "validatorConfig": {
    "version": "1.0.0",
    "lastUpdated": "ISO 8601 timestamp",
    "rules": {
      "timezone": { "enabled": true, "severity": "ERROR", ... },
      "typeSafety": { "enabled": true, "severity": "ERROR", ... },
      "logging": { "enabled": true, "severity": "ERROR", ... },
      "architecture": [ ... ],
      "business": [ ... ]
    }
  },
  "eslintConfig": {
    "rules": { "rulesdir/no-new-date": "error" }
  },
  "docsAlignment": {
    "referencedDocs": [ ... ],
    "orphanedDocs": [ ... ],
    "lastValidated": "ISO 8601 timestamp"
  }
}
```

#### Version 0.9.0

- Initial schema (no config file - rules hardcoded)

---

## Rule Addition History

### Version 1.0.0

- Enhanced PHI detection with confidence levels
- Enhanced transaction detection with risk assessment
- Suppression comment support

### Version 0.9.0

- All initial rules (timezone, type safety, logging, architecture, business)

---

## Deprecation Notices

### None Currently

No rules or features are deprecated in the current version.

---

## Future Roadmap

### Planned for 1.2.0

- [ ] Performance monitoring for pre-commit hook on large commits
- [ ] Rule severity customization per project
- [ ] Integration with additional IDE extensions
- [ ] Automated false positive reporting

### Planned for 2.0.0

- [ ] ML-based violation detection
- [ ] Context-aware business logic validation
- [ ] Performance regression detection
- [ ] Security vulnerability scanning

---

## Contributing

When making changes to the compliance system:

1. **Update this CHANGELOG** with your changes
2. **Bump version** in `compliance-config.json` if changing schema
3. **Update documentation** in `/docs/compliance/`
4. **Test thoroughly** with both passing and failing cases
5. **Run validation suite**:
   ```bash
   npm run build
   npm run lint
   npx tsc --noEmit
   ```

---

## Questions or Issues?

- **Bug Reports**: File an issue with the `compliance-system` label
- **Feature Requests**: Open a discussion in GitHub Discussions
- **Questions**: Ask in team chat or code reviews

---

**Note**: This changelog tracks changes to the compliance system infrastructure itself, not to individual CLAUDE.md rules. For CLAUDE.md changes, see the main project changelog or git history.
