# MedBookings Workflow System

This directory contains the PRP-based workflow automation system for MedBookings development.

## Overview

The workflow system provides:
- **PRP-based task management** - Structured development process with Planning, Requirements, Prioritization
- **Automated validation** - 5 validation modes (pre, task, integration, issue, all)
- **Pattern extraction** - Learn from successful implementations and capture anti-patterns
- **Git workflow automation** - Automated checks and workflow orchestration
- **Database integrity checks** - Validate database health during development

## Quick Start

## ⚠️ Security Notice

Personal workflow files (`package.json.local`, `run-local.js`, `.workflow-enabled`, `settings.personal.json`) are gitignored and **MUST NEVER be committed**. They may contain credentials and personal configuration. See `.claude/WORKFLOW.md` for complete security guidelines.

### 1. Initial Setup

```bash
# For complete setup instructions with file templates, see:
# .claude/WORKFLOW.md - Section "📦 Complete Setup Instructions"

# After creating the required files (package.json.local, run-local.js,
# .workflow-enabled, .claude/settings.personal.json), verify setup:
node run-local.js workflow:check

# Initialize workflow directories (if needed)
node run-local.js workflow:init
```

### 2. List Available Commands

```bash
# Show all workflow commands
node run-local.js --list
```

### 3. Run Your First Workflow Command

```bash
# Check git status
node run-local.js git:check

# Run pre-implementation validation
node run-local.js validate:pre

# List all code patterns
node run-local.js patterns:list
```

## Directory Structure

```
workflow/
├── config.json              # Workflow configuration (committed)
├── scripts/                # Automation scripts (committed)
│   ├── workflow-mgmt/      # Core workflow management
│   ├── validation/         # Validation system
│   ├── patterns/           # Pattern extraction
│   ├── personal/           # Personal helpers
│   └── utils/              # Shared utilities
├── reference/              # Templates and guides (committed)
│   ├── code-patterns/      # Code pattern reference
│   ├── prp/                # PRP templates
│   └── runbooks/           # Validation runbooks
├── prps/                   # Work in progress (gitignored)
│   ├── features/           # Feature PRPs
│   └── issues/             # Issue PRPs
├── patterns/               # Pattern storage (gitignored)
│   ├── staging/            # Patterns being reviewed
│   └── archive/            # Approved patterns
└── technical-plans/        # Planning docs (gitignored)
```

## Available Commands

### Workflow Management

- `workflow:init` - Initialize workflow directories
- `workflow:check` - Verify workflow structure
- `workflow:preflight` - Run all pre-implementation checks
- `workflow:archive` - Archive completed work
- `workflow:command` - Process workflow commands

### Git Operations

- `git:check` - Check git status and branch information

### PRP Management

- `prp:generate` - Generate PRP documents
- `prp:validate` - Validate PRP structure

### Validation System

- `validate:pre` - Pre-implementation validation
- `validate:task` - Post-task validation
- `validate:integration` - Integration testing validation
- `validate:issue` - Issue fix validation
- `validate:all` - Comprehensive validation (all modes)

### Database Operations

- `db:integrity` - Run database integrity checks
- `db:migrate:local` - Run Prisma migrations locally with integrity check
- `db:migrate:dev:local` - Run Prisma dev migrations with integrity check

### Pattern Management

- `patterns:auto` - Auto-detect patterns from recent commits
- `patterns:extract` - Extract patterns manually
- `patterns:review` - Review staged patterns
- `patterns:approve` - Approve and move patterns to archive
- `patterns:clean` - Clean up pattern staging area
- `patterns:list` - List all available patterns
- `antipatterns:from-issue` - Capture anti-patterns from fixed issues

## Workflow Concepts

### PRP (Planning, Requirements, Prioritization)

The workflow system uses a PRP-based approach where each feature or issue goes through:

1. **Planning** - Technical analysis and design
2. **Requirements** - Specific tasks and acceptance criteria
3. **Prioritization** - Task ordering and dependencies

PRPs are stored in:
- `workflow/prps/features/` - For new features
- `workflow/prps/issues/` - For bug fixes and issues

### Validation Modes

The system supports 5 validation modes:

1. **Pre** (`validate:pre`) - Before starting implementation
   - Git status clean
   - Build passing
   - No linting errors

2. **Task** (`validate:task`) - After completing each task
   - Build still passes
   - No new linting errors
   - Tests passing (if applicable)

3. **Integration** (`validate:integration`) - After all tasks complete
   - Integration tests pass
   - No breaking changes
   - API contracts maintained

4. **Issue** (`validate:issue`) - After fixing an issue
   - Issue actually fixed
   - No regression introduced
   - Anti-pattern captured (if applicable)

5. **All** (`validate:all`) - Comprehensive validation
   - Runs all validation modes
   - Final check before PR

### Pattern System

The workflow system learns from your code:

- **Auto-detection** - Scans recent commits for successful patterns
- **Extraction** - Manually extract patterns from exemplary code
- **Review** - Staged patterns reviewed before approval
- **Approval** - Approved patterns moved to archive for future reference
- **Anti-patterns** - Capture patterns to avoid from fixed issues

## Configuration

### workflow/config.json

Main configuration file (committed to git). Contains:
- Directory paths
- Validation settings
- Pattern extraction rules
- PRP templates

### package.json.local

Personal workflow scripts (gitignored). Contains:
- npm scripts for workflow commands
- Personal script configurations
- Custom workflow aliases

### .claude/settings.personal.json

Claude Code permissions (gitignored). Contains:
- Bash command permissions
- File system permissions
- MCP server settings

## Customization

### Adding New Workflow Commands

1. Create a new script in `workflow/scripts/`
2. Add corresponding npm script to `package.json.local`
3. Test with `node run-local.js <command-name>`

### Modifying Validation Rules

1. Edit `workflow/scripts/validation/validate.js`
2. Update validation modes as needed
3. Test with `node run-local.js validate:all`

### Adding Code Patterns

1. Manually: `node run-local.js patterns:extract`
2. Auto: `node run-local.js patterns:auto`
3. Review: `node run-local.js patterns:review`
4. Approve: `node run-local.js patterns:approve`

## Troubleshooting

### "Workflow not initialized" error

```bash
node run-local.js workflow:init
```

### "Script not found" error

Ensure you've copied `package.json.local.example`:
```bash
cp package.json.local.example package.json.local
```

### "Permission denied" errors

Check `.claude/settings.personal.json` permissions:
```bash
cp .claude/settings.personal.json.example .claude/settings.personal.json
```

### Build or lint errors during validation

Fix errors first, then re-run validation:
```bash
npm run build
npm run lint
node run-local.js validate:pre
```

## Integration with Claude Code

This workflow system is designed to work seamlessly with Claude Code:

1. **Workflow Commands** - Available in `.claude/commands/`
2. **Workflow Documentation** - See `.claude/WORKFLOW.md`
3. **Permissions** - Configured in `.claude/settings.personal.json`

## Documentation

- **Workflow Guide**: `.claude/WORKFLOW.md`
- **Command Reference**: `.claude/commands/README.md`
- **Code Patterns**: `workflow/reference/code-patterns/`
- **PRP Templates**: `workflow/reference/prp/`
- **Runbooks**: `workflow/reference/runbooks/`

## Support

For questions or issues with the workflow system:
1. Check the troubleshooting section above
2. Review `.claude/WORKFLOW.md` for detailed guidance
3. Examine existing PRPs in `workflow/reference/prp/` for examples

## Notes

- **Gitignored Files**: `package.json.local`, `.workflow-enabled`, `.claude/settings.personal.json`, and all `workflow/prps/`, `workflow/patterns/staging/`, `workflow/technical-plans/` contents are personal and not committed
- **Shared Files**: Scripts, templates, and configuration are committed and shared with the team
- **Personal Preference**: The workflow system is optional - use what works for you!
