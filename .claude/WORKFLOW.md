# MedBookings PRP-Based Workflow System

This document defines the PRP-based workflow system for MedBookings. Works alongside CLAUDE.md for development standards.

## 👤 User vs 🤖 Claude Responsibilities

**IMPORTANT**: This workflow has clear separation of responsibilities:

- **🟢 Automatic** - Runs via code hooks (you don't need to think about these)
- **🟡 Claude's Job** - Claude calls these scripts during the workflow (not your responsibility)
- **🔴 Your Job** - You must manually run these (mostly setup/review tasks)

**For Users**: You mainly just use workflow commands (e.g., `implement feature-prp tasks from: ...`). Claude handles calling the scripts. You only manually run setup/review tasks.

## 🚀 Quick Start

```bash
# First-time setup
npm run workflow:init
npm run workflow:check

# Before starting work (manual)
npm run workflow:preflight
```

## 📦 Complete Setup Instructions

### Prerequisites

The workflow system requires these files (gitignored - create manually):
- `package.json.local` - Workflow npm scripts
- `run-local.js` - Script runner
- `.workflow-enabled` - Workflow enablement marker
- `.claude/settings.personal.json` - Claude Code permissions

**Important**: These files are gitignored and not committed. Each developer creates their own.

---

## ⚠️ CRITICAL SECURITY WARNING

The following files contain personal configuration and **MUST NEVER BE COMMITTED**:
- `package.json.local` - Personal workflow commands
- `run-local.js` - Personal script runner
- `.workflow-enabled` - Personal initialization marker
- `.claude/settings.personal.json` - **May contain credentials and API keys**

**Why this matters:**
- These files are gitignored for security and privacy reasons
- They may contain database credentials, API keys, or personal preferences
- Committing them exposes sensitive information in git history forever

**If you accidentally commit these files:**
1. Immediately notify the team
2. Rotate any exposed credentials (database passwords, API keys)
3. Use git history rewrite tools (BFG Repo-Cleaner) to remove from history
4. Force push cleaned history (requires team coordination)

**Protection mechanisms in place:**
- `.gitignore` prevents accidental staging
- Pre-commit hook blocks commits containing these files
- All files use `.local` or `.personal` naming convention

---

### Step-by-Step Setup

#### 1. Create package.json.local

Create a file named `package.json.local` in the repository root:

```bash
cat > package.json.local << 'EOF'
{
  "name": "medbookings-personal-workflow",
  "version": "0.1.0",
  "private": true,
  "description": "Personal workflow scripts for MedBookings development (not committed to repository)",
  "scripts": {
    "workflow:init": "node workflow/scripts/workflow-mgmt/workflow-init.js",
    "workflow:check": "node workflow/scripts/workflow-mgmt/check-workflow.js",
    "git:check": "node workflow/scripts/workflow-mgmt/check-git.js",
    "workflow:preflight": "npm run git:check && npm run workflow:check && npm run build && npm run lint",
    "prp:generate": "node workflow/scripts/workflow-mgmt/generate-prp.js create",
    "prp:validate": "node workflow/scripts/workflow-mgmt/generate-prp.js validate",
    "workflow:command": "node workflow/scripts/workflow-mgmt/process-command.js",
    "validate:pre": "node workflow/scripts/validation/validate.js --mode=pre",
    "validate:task": "node workflow/scripts/validation/validate.js --mode=task",
    "validate:integration": "node workflow/scripts/validation/validate.js --mode=integration",
    "validate:issue": "node workflow/scripts/validation/validate.js --mode=issue",
    "validate:all": "node workflow/scripts/validation/validate.js --mode=all",
    "db:integrity": "node workflow/scripts/validation/db-integrity.js",
    "patterns:auto": "node ./workflow/scripts/patterns/update-patterns.js auto-detect",
    "patterns:extract": "node ./workflow/scripts/patterns/update-patterns.js extract",
    "patterns:review": "node ./workflow/scripts/patterns/update-patterns.js review",
    "patterns:approve": "node ./workflow/scripts/patterns/update-patterns.js approve",
    "patterns:clean": "node ./workflow/scripts/patterns/update-patterns.js clean",
    "patterns:list": "node ./workflow/scripts/patterns/update-patterns.js list",
    "antipatterns:from-issue": "node ./workflow/scripts/patterns/capture-anti-patterns.js from-issue",
    "workflow:archive": "node workflow/scripts/workflow-mgmt/archive-completed.js",
    "db:migrate:local": "prisma migrate deploy && npm run db:integrity",
    "db:migrate:dev:local": "prisma migrate dev && npm run db:integrity"
  }
}
EOF
```

Verify:
```bash
test -f package.json.local && echo "✓ package.json.local created" || echo "✗ Failed to create"
```

#### 2. Create run-local.js

Create a file named `run-local.js` in the repository root:

```bash
cat > run-local.js << 'EOF'
#!/usr/bin/env node

/**
 * Script Runner for package.json.local
 *
 * Usage:
 *   node run-local.js <script-name>
 *   node run-local.js workflow:check
 *   node run-local.js validate:all
 *
 * Lists available scripts:
 *   node run-local.js --list
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOCAL_PACKAGE = path.join(__dirname, 'package.json.local');

// Check if package.json.local exists
if (!fs.existsSync(LOCAL_PACKAGE)) {
  console.error('❌ package.json.local not found');
  console.error('   This file contains personal workflow scripts.');
  console.error('   Ensure your workflow directory is set up correctly.');
  process.exit(1);
}

// Load package.json.local
let localPackage;
try {
  localPackage = JSON.parse(fs.readFileSync(LOCAL_PACKAGE, 'utf-8'));
} catch (error) {
  console.error('❌ Failed to parse package.json.local:', error.message);
  process.exit(1);
}

const scripts = localPackage.scripts || {};

// Handle --list or -l flag
if (process.argv[2] === '--list' || process.argv[2] === '-l') {
  console.log('\n📋 Available local scripts:\n');
  Object.keys(scripts).forEach((scriptName) => {
    console.log(`  ${scriptName.padEnd(30)} ${scripts[scriptName]}`);
  });
  console.log('');
  process.exit(0);
}

// Get script name from command line
const scriptName = process.argv[2];

if (!scriptName) {
  console.error('❌ No script name provided');
  console.error('\nUsage:');
  console.error('  node run-local.js <script-name>');
  console.error('  node run-local.js --list          (show all available scripts)');
  console.error('\nExample:');
  console.error('  node run-local.js workflow:check');
  process.exit(1);
}

// Check if script exists
if (!scripts[scriptName]) {
  console.error(`❌ Script "${scriptName}" not found in package.json.local`);
  console.error('\nAvailable scripts:');
  Object.keys(scripts).forEach((name) => {
    console.log(`  - ${name}`);
  });
  process.exit(1);
}

// Get the command to run
const command = scripts[scriptName];

console.log(`🚀 Running: ${scriptName}`);
console.log(`📝 Command: ${command}\n`);

// Execute the command
try {
  execSync(command, {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true,
  });
  console.log(`\n✅ Script "${scriptName}" completed successfully`);
} catch (error) {
  console.error(`\n❌ Script "${scriptName}" failed with exit code ${error.status}`);
  process.exit(error.status || 1);
}
EOF
```

Make executable and verify:
```bash
chmod +x run-local.js
test -f run-local.js && echo "✓ run-local.js created" || echo "✗ Failed to create"
```

#### 3. Create .workflow-enabled

Create a file named `.workflow-enabled` in the repository root:

```bash
cat > .workflow-enabled << 'EOF'
# Workflow system enabled for this developer
# Created: $(date +%Y-%m-%d)

Summary:
  Directories: Ready
  Templates: All present
  Backlog: Exists
  Complete: Exists
  Workflow Enabled: Yes
EOF
```

Verify:
```bash
test -f .workflow-enabled && echo "✓ .workflow-enabled created" || echo "✗ Failed to create"
```

#### 4. Create .claude/settings.personal.json

Create a file named `settings.personal.json` in the `.claude/` directory:

```bash
cat > .claude/settings.personal.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(git diff:*)",
      "Bash(git add:*)",
      "Bash(git log:*)",
      "Bash(git status:*)",
      "Bash(git branch:*)",
      "Bash(git checkout:*)",
      "Bash(git merge:*)",
      "Bash(git fetch:*)",
      "Bash(git remote:*)",
      "Bash(git push:*)",
      "Bash(git reset:*)",
      "Bash(npm install:*)",
      "Bash(npm uninstall:*)",
      "Bash(npm run build:*)",
      "Bash(npm run lint:*)",
      "Bash(npm run fix:*)",
      "Bash(npm ls:*)",
      "Bash(npx tsc:*)",
      "Bash(npx prisma migrate:*)",
      "Bash(npx prisma generate:*)",
      "mcp__filesystem-server__list_directory",
      "mcp__filesystem-server__read_multiple_files",
      "mcp__filesystem-server__read_text_file",
      "Bash(find:*)",
      "Bash(test:*)",
      "Bash(cat:*)",
      "Bash(awk:*)",
      "Bash(sort:*)",
      "Bash(chmod:*)",
      "Bash(for feature in src/features/*)",
      "Bash(done)"
    ],
    "deny": [],
    "ask": [
      "Bash(git commit:*)",
      "Bash(git push --force:*)",
      "Bash(rm:*)",
      "Bash(mv:*)"
    ]
  },
  "enabledMcpjsonServers": [
    "filesystem-server",
    "postgres-server",
    "playwright"
  ]
}
EOF
```

Verify:
```bash
test -f .claude/settings.personal.json && echo "✓ settings.personal.json created" || echo "✗ Failed to create"
```

**Note**: These files are gitignored (personal configuration, not shared with team).

#### 5. Verify Setup

```bash
# List available workflow commands
node run-local.js --list

# Should show 24 commands:
# - workflow:* (init, check, preflight, archive, command)
# - git:check
# - prp:* (generate, validate)
# - validate:* (pre, task, integration, issue, all)
# - db:* (integrity, migrate:local, migrate:dev:local)
# - patterns:* (auto, extract, review, approve, clean, list)
# - antipatterns:from-issue

# Verify workflow structure
node run-local.js workflow:check
```

#### 6. Initialize Workflow Directories

```bash
# Create necessary directories (if they don't exist)
node run-local.js workflow:init

# This creates:
# - workflow/prps/features/
# - workflow/prps/issues/
# - workflow/patterns/staging/
# - workflow/patterns/archive/
# - workflow/technical-plans/
```

### What Each File Does

#### package.json.local
Personal npm scripts (24 commands) for workflow automation. See creation template above.

#### run-local.js
Script runner that executes commands from `package.json.local`. Full source code in template above.

#### .workflow-enabled
Marker file indicating workflow system is enabled for this developer.

#### .claude/settings.personal.json
Claude Code permissions configuration. Defines what bash commands and operations Claude can execute during workflow automation. Full permission list in template above.

### Troubleshooting

**"Command not found" errors**:
```bash
# Verify run-local.js exists and is executable
ls -la run-local.js
chmod +x run-local.js

# Verify package.json.local exists
ls -la package.json.local

# If missing, recreate using template from setup instructions above
```

**"Workflow not enabled" errors**:
```bash
# Verify .workflow-enabled exists
ls -la .workflow-enabled

# If missing, recreate using template from setup instructions above
```

**"Permission denied" during workflow**:
```bash
# Check .claude/settings.personal.json exists
ls -la .claude/settings.personal.json

# If missing, recreate using template from setup instructions above
```

**Scripts fail to run**:
```bash
# Verify workflow/scripts directory exists
ls -la workflow/scripts/

# Should show:
# - workflow-mgmt/
# - validation/
# - patterns/
# - personal/
# - utils/

# If missing, workflow system files weren't restored from git
# These should be committed in the repository
```

## ⚡ Command Reference

### Core Workflow Commands

These commands are triggered by typing them to Claude Code:

| Command                                                         | Purpose                                          | Creates                           | Auto Actions                       |
| --------------------------------------------------------------- | ------------------------------------------------ | --------------------------------- | ---------------------------------- |
| `plan technical approach for: feature: [desc]`                  | **START HERE** - Technical analysis for features | Technical plan                    | Determines name & scope            |
| `plan technical approach for: issue: [desc]`                    | **START HERE** - Technical analysis for issues   | Technical plan                    | Determines name & scope            |
| `feature-prp required: [name]`                                  | Create feature PRP                               | PRP + Tasks                       | Validates, adds to backlog         |
| `issue-prp required: [name]`                                    | Create issue PRP                                 | PRP + Tasks                       | Validates, adds to backlog         |
| `implement feature-prp tasks from: [name]-feature-prp-tasks.md` | Execute feature (complete flow)                  | Implements + validates + archives | Runs all validations automatically |
| `implement issue-prp tasks from: [name]-issue-prp-tasks.md`     | Fix issue (complete flow)                        | Implements + validates + archives | Runs all validations automatically |
| `quick note feature: [idea]`                                    | Quick feature capture                            | Backlog entry                     | Updates statistics                 |
| `quick note issue: [idea]`                                      | Quick issue capture                              | Backlog entry                     | Updates statistics                 |

**Note**: The `implement` commands handle the **entire workflow** from implementation through validation to archiving. No separate validation commands are needed.

## 🔍 How Validation Works

### Validation System Architecture

The workflow uses a unified validation system (`workflow/scripts/validation/validate.js`) with five modes:

| Mode            | Triggered By             | What It Includes                                                 |
| --------------- | ------------------------ | ---------------------------------------------------------------- |
| **pre**         | `implement` commands     | TypeScript, lint, security, architecture                         |
| **task**        | `validate task:` command | Build, TypeScript, lint, security, architecture                  |
| **integration** | `mark feature complete:` | Build, TypeScript, database, architecture, integration checks    |
| **issue**       | `mark issue fixed:`      | Build, TypeScript, security, architecture, issue-specific checks |
| **all**         | `run pr checks for:`     | **ALL validations combined** (most comprehensive)                |

### What Each Validation Check Does

| Check            | Command/Tool                 | Critical?    | Purpose                                      |
| ---------------- | ---------------------------- | ------------ | -------------------------------------------- |
| **Build**        | `npm run build`              | YES          | Verifies code compiles                       |
| **TypeScript**   | `npx tsc --noEmit`           | YES          | Type safety validation                       |
| **Lint**         | `npm run lint`               | NO (warning) | Code quality checks                          |
| **Security**     | Pattern searches             | Mixed        | Finds console.logs, credentials, `any` types |
| **Database**     | Prisma validation            | YES          | Checks N+1 queries, pagination, schema       |
| **Architecture** | `npm run architecture:check` | YES          | Validates file structure, imports, patterns  |
| **Integration**  | Custom checks                | YES          | tRPC router registration, error handling     |
| **Issue**        | Custom checks                | Mixed        | Test .only/.skip, error boundaries           |

### Architecture Check Integration

**IMPORTANT**: `architecture:check` is automatically integrated into all validation modes.

- Script: `npm run architecture:check`
- Calls: `git fetch origin && node scripts/architecture/check-core-files.js`
- Called by: `validate.js` in all modes (pre, task, integration, issue, all)
- Checks: Cross-feature imports, Prisma in client code, protected file modifications
- Can also be run standalone: `npm run architecture:check`

## 📋 Workflow Process

### Mandatory Order

```
Technical Planning → PRP Generation → Implementation & Validation → PR Creation
    (REQUIRED)         (Manual)          (Complete flow -         (Manual)
                                         Claude follows process)
```

### Step 1: Technical Planning (ALWAYS START HERE)

- **Command**: `plan technical approach for: [feature|issue]: [description]`
- **Creates**: `workflow/technical-plans/[name]-technical-plan.md`
- **Purpose**: Analyze feasibility, determine scope, identify patterns
- **Required**: Must exist before PRP generation

### Step 2: PRP Generation

- **Feature**: `feature-prp required: [name]`
- **Issue**: `issue-prp required: [name]`
- **Creates**: PRP + Tasks in `workflow/prps/[features|issues]/`
- **Auto**: Validates structure, adds to backlog

### Step 3: Implementation & Validation (Complete Flow)

**Command**: `implement [feature|issue]-prp tasks from: [name]-[type]-prp-tasks.md`

This command tells Claude to follow the implementation process defined in `.claude/commands/tasks-process-enhanced.md`. The process includes:

#### Pre-flight (Claude should do):

1. Find task file in `/workflow/prps/[features|issues]/`
2. Run `npm run git:check` to verify git configuration
3. Create/checkout branch: `feature/[name]` or `issue/[name]`
4. Run `npm run validate:pre` (automatic via command handler)
5. **Context Loading**: Load minimal context (~3-5k tokens)
   - Read only files specified in technical plan
   - Use grep for database models (not entire schema)
   - Display: "📊 Context Loaded: X files, ~Yk tokens"

#### For Each Parent Task (Claude should do):

1. **Test-First Development**: For each sub-task:
   - Write test FIRST (before implementation)
   - Run test (should fail initially - proving it tests something)
   - Implement code to make test pass
   - Run test again (should pass)
2. After parent task complete, run `npm run build`
3. Run `npm run validate:task "[name]"`
4. Ask user: "Are you satisfied?"
5. If yes:
   - Create git commit: `feat: Complete [task name]` or `fix: Complete [task name]`
   - **Create checkpoint tag**: `checkpoint/[name]/[N]`
   - Display checkpoint info with rollback instructions
   - Run `npm run patterns:auto` to extract patterns
   - Display: "Patterns extracted to staging for later review"
6. If no: Revise and repeat

#### After All Tasks Complete (Claude automatically does):

1. Ask user: "All tasks complete. Are you satisfied?"
2. If yes, Claude runs the following **automatically** (no separate commands needed):
   - **Implementation Audit** (optional):
     - Ask: "Run implementation audit checklist?"
     - If approved: Guide through 5 systematic audit sections
       - ✅ Technical plan compliance (files, database, APIs)
       - ✅ PRD requirements (problem solved, objectives met)
       - ✅ Code quality (CLAUDE.md compliance)
       - ✅ Test coverage (85%+ with all tests passing)
       - ⚠️ Gaps and deviations (documented with justification)
     - Create audit notes: `/workflow/prps/[type]/[name]-AUDIT-NOTES.md`
     - Identify gaps before validation runs
   - ✅ Run `npm run validate:integration "[name]"` (for features)
   - ✅ Run `npm run validate:issue "[name]"` (for issues)
   - ✅ Run `npm run validate:all "[name]"` (comprehensive PR checks)
   - ✅ Update backlog.md marking task complete `[x]`
   - ✅ Update backlog statistics
   - ✅ Comprehensive pattern extraction:
     - For features: Run `npm run patterns:extract "[name]"`
     - For issues: Run `npm run antipatterns:from-issue "[name]"`
   - ✅ Archive completed work:
     - Run `npm run workflow:archive` or call `archive-completed.js` directly
     - Updates `complete.md`
   - ✅ Final steps:
     - Run `npm run build` for final verification
     - Create final commit: `chore: Complete [name] implementation`
3. Display: **"✅ All validations passed. Ready for PR submission."**

**Note**: All validation and archiving happens **automatically** in Step 3 - no additional manual validation commands needed.

### Step 4: Create Pull Request (Manual)

After Step 3 completes with all validations passing:

**Command**: `gh pr create --title "[Feature|Fix]: [name]" --body "..."`

**Or** use GitHub web interface to create PR.

**Note**: Step 3 already ran all validations (`validate:all`), so the PR is ready to submit.

### Step 5: Post-PR Merge Operations (Manual)

After PR is merged, optionally run:

- **Pattern Review**: `npm run patterns:review` - Review captured patterns
- **Pattern Approval**: `npm run patterns:approve` - Approve patterns for future use

## 🎯 Automation Levels

### 🟢 Fully Automated (Runs Without Human Intervention)

These run automatically via npm hooks or internal script logic:

| What                    | When                                | How                                        |
| ----------------------- | ----------------------------------- | ------------------------------------------ |
| **Validation modes**    | When validation commands are called | Command handlers call `validate:*` scripts |
| **Architecture checks** | During all validation modes         | Called by `validate.js` automatically      |
| **Pre-validation**      | When `implement` commands are used  | Command handler calls `validate:pre`       |

### 🟡 Prescriptive Automation (Claude Should Follow)

These are defined in `.claude/commands/tasks-process-enhanced.md` as instructions for Claude to follow:

| What                       | When                           | Claude Should Do                                       |
| -------------------------- | ------------------------------ | ------------------------------------------------------ |
| **Git check**              | Before branch creation         | Run `npm run git:check`                                |
| **Branch creation**        | Start of implementation        | Create/checkout `feature/` or `issue/` branch          |
| **Build checks**           | After each parent task         | Run `npm run build`                                    |
| **Task validation**        | After parent task complete     | Run `npm run validate:task`                            |
| **Pattern extraction**     | After each parent task commit  | Run `npm run patterns:auto`                            |
| **Comprehensive patterns** | After all tasks complete       | Run `patterns:extract` or `antipatterns:from-issue --` |
| **Archiving**              | After all tasks and validation | Run `workflow:archive` or call script directly         |
| **Backlog updates**        | After completion               | Mark tasks complete, update statistics                 |
| **Complete.md updates**    | After archiving                | Add entry to complete.md                               |

### 🔴 Manual Operations

#### User Must Run (Not Part of Workflow)

These are setup/verification tasks the user runs manually outside the workflow:

| Operation                   | Command                      | When To Run                                    |
| --------------------------- | ---------------------------- | ---------------------------------------------- |
| **Workflow initialization** | `npm run workflow:init`      | First-time setup only                          |
| **Preflight checks**        | `npm run workflow:preflight` | Optional - before starting work session        |
| **Pattern review**          | `npm run patterns:review`    | After work complete - review captured patterns |
| **Pattern approval**        | `npm run patterns:approve`   | After review - approve patterns for future use |
| **Pattern list**            | `npm run patterns:list`      | Anytime - view current pattern library         |
| **Database integrity**      | `npm run db:integrity`       | Troubleshooting - check database health        |
| **Testing**                 | `npm run test`               | Manual testing - run E2E test suite            |

#### Claude Runs These (Prescriptive - From tasks-process-enhanced.md)

These are NOT user responsibilities - Claude should call these during the workflow:

| Operation                   | Command                           | When Claude Runs It                               |
| --------------------------- | --------------------------------- | ------------------------------------------------- |
| **Git configuration check** | `npm run git:check`               | Before creating branches in implement commands    |
| **Architecture check**      | `npm run architecture:check`      | Integrated into all validation modes (automatic)  |
| **Pattern extraction**      | `npm run patterns:auto`           | After each parent task commit                     |
| **Comprehensive patterns**  | `npm run patterns:extract`        | After all feature tasks complete                  |
| **Anti-pattern extraction** | `npm run antipatterns:from-issue` | After all issue tasks complete                    |
| **Archiving**               | `npm run workflow:archive`        | After all tasks complete and validated            |
| **Build verification**      | `npm run build`                   | After each parent task implementation             |
| **Task validation**         | `npm run validate:task`           | After each parent task before asking satisfaction |

## 📁 Essential Paths

```
workflow/
├── config.json           # All workflow configuration
├── backlog.md           # Task tracking
├── complete.md          # Completion summary
├── technical-plans/     # Technical analysis
├── prps/
│   ├── features/        # Active feature PRPs & tasks
│   └── issues/          # Active issue PRPs & tasks
├── archive/             # Completed work archive
│   └── YYYY/MM/        # Organized by completion date
├── scripts/
│   ├── workflow-mgmt/   # Core workflow scripts
│   │   ├── process-command.js  # Command processor (all handlers)
│   │   ├── generate-prp.js     # PRP generation
│   │   ├── archive-completed.js # Archiving logic
│   │   ├── check-git.js        # Git configuration checks
│   │   └── check-workflow.js   # Workflow structure validation
│   ├── validation/      # Unified validation
│   │   ├── validate.js  # Main validation script (all modes)
│   │   └── db-integrity.js # Database health checks
│   ├── patterns/        # Pattern management
│   │   ├── update-patterns.js     # Pattern extraction and management
│   │   └── capture-anti-patterns.js # Anti-pattern capture
│   └── personal/        # Personal workflow helpers
│       └── suggest-context.js  # Context suggestion helper
└── reference/
    ├── prp/            # PRP templates
    └── code-patterns/  # Captured patterns and anti-patterns

.claude/
├── WORKFLOW.md         # This file (workflow overview)
└── commands/           # Command implementation docs
    ├── tasks-process-enhanced.md  # Detailed task implementation process
    ├── context-scoping-guide.md   # Context loading instructions
    ├── test-requirements.md       # Test-first development guide
    └── audit-checklist.md         # Implementation audit process
```

## 🔧 NPM Scripts Reference

### Workflow Core

```bash
npm run workflow:init      # Initialize workflow system (first-time setup)
npm run workflow:check     # Verify workflow structure
npm run workflow:preflight # Pre-work verification (git + workflow + build + lint)
npm run workflow:archive   # Archive completed work
npm run workflow:command   # Process workflow commands
```

### Validation (Unified System)

```bash
npm run validate:pre       # Pre-implementation (TypeScript, lint, security, architecture)
npm run validate:task      # Post-task (build, TypeScript, lint, security, architecture)
npm run validate:integration # Feature complete (build, TypeScript, database, architecture, integration)
npm run validate:issue     # Issue fixed (build, TypeScript, security, architecture, issue checks)
npm run validate:all       # Full suite (all validations combined - most comprehensive)
```

### Pattern Management

```bash
npm run patterns:auto            # Auto-detect and extract patterns from recent commits
npm run patterns:extract         # Extract patterns with manual context
npm run patterns:list            # View currently captured patterns
npm run patterns:review          # Review patterns in staging area
npm run patterns:approve         # Approve and move patterns from staging to active
npm run patterns:clean           # Clean staging area
npm run antipatterns:from-issue  # Capture anti-patterns from fixed issue
```

### Database Operations

```bash
npm run db:integrity       # Check database health (called by validation modes)
npm run db:migrate        # Run Prisma migrations + integrity check
npm run db:migrate:dev    # Create and run development migrations + integrity check
```

### Architecture

```bash
npm run architecture:check # git fetch origin && validate architecture
                          # (called automatically by all validation modes,
                          #  can also run standalone)
```

### Git Operations

```bash
npm run git:check         # Verify git configuration
```

### PRP Management

```bash
npm run prp:generate      # Generate PRP from technical plan
npm run prp:validate      # Validate PRP structure
```

## 📊 Pattern Extraction System

### How Pattern Extraction Works

#### Learning from Fixed Issues (Recommended Approach)

Anti-patterns are most valuable when captured from **actual fixes**, not raw errors:

```bash
# After fixing an issue, capture what was learned:
npm run antipatterns:from-issue -- <issue-name>
```

**What it does:**

1. Finds git commits mentioning the issue name
2. Analyzes the git diff showing before/after code
3. Extracts problematic patterns and their fixes
4. Saves to `/workflow/reference/code-patterns/anti-patterns.md`

**Example:**

```bash
# After fixing "infinite-loop-bug"
npm run antipatterns:from-issue -- infinite-loop-bug

# Creates entry showing:
# ❌ Don't do this (before fix)
# ✅ Do this instead (after fix)
```

**Why this approach is better:**

- Documents the SOLUTION, not just the problem
- Shows real-world fixes from your codebase
- Includes context about why the change was needed
- More actionable than raw error messages

#### Prescriptive Extraction (Claude should call)

**After Each Parent Task Commit:**

```bash
npm run patterns:auto  # Extract patterns from the commit just made
```

**After All Tasks Complete:**

- For features: `npm run patterns:extract "[feature-name]"`
- For issues: `npm run antipatterns:from-issue -- "[issue-name]"`

**Pattern Review Workflow:**

1. `npm run patterns:list` - See what's been captured
2. `npm run patterns:review` - Review patterns in staging
3. `npm run patterns:approve` - Move approved patterns to active
4. `npm run patterns:clean` - Clean staging area

### Pattern Storage

```
workflow/reference/code-patterns/
├── anti-patterns.md        # Captured anti-patterns (auto-updated)
├── patterns-staging.md     # Patterns awaiting review
└── patterns-active.md      # Approved patterns for use
```

## ⚙️ Configuration

All workflow behavior configured in `/workflow/config.json`:

### Key Configuration Sections

```json
{
  "paths": {
    // Directory structure configuration
  },
  "validation": {
    "automate": {
      "prpValidation": true, // Auto-validate PRP structure
      "taskValidation": true, // Auto-run validate:task
      "integrationValidation": "prompt", // Prompt before validate:integration
      "issueValidation": "prompt", // Prompt before validate:issue
      "allValidation": "prompt" // Prompt before validate:all
    },
    "allowSkip": {
      // Whether validations can be skipped on failure
    }
  },
  "git": {
    // Branch naming conventions
  },
  "priorities": {
    // P1/P2/P3 for features
  },
  "severities": {
    // S1-S4 for issues
  }
}
```

## 🎓 Understanding the Workflow

### The Three Types of Automation

1. **Hard Automation** 🟢

   - Actual code that runs automatically
   - Examples: validation system, architecture checks
   - You don't need to remember these

2. **Prescriptive Automation** 🟡

   - Instructions Claude should follow
   - Defined in `tasks-process-enhanced.md`
   - Claude reads and executes these steps
   - Examples: git check, pattern extraction after commits

3. **Manual Operations** 🔴
   - Must be explicitly requested
   - No automatic trigger exists
   - Examples: pattern review, workflow initialization

### Command vs Script

- **Commands**: Type to Claude (e.g., `validate task: my-feature`)

  - Processed by `process-command.js`
  - May trigger scripts internally

- **Scripts**: Run in terminal (e.g., `npm run validate:task`)

  - Direct npm script execution
  - Can be called by commands or manually

- **Hybrid**: Can be both command and script
  - Commands call the scripts
  - Scripts can also be run manually

### Prescriptive vs Descriptive

- **`.claude/commands/tasks-process-enhanced.md`**:

  - **Prescriptive** - tells Claude WHAT TO DO
  - Claude reads this file and follows the instructions
  - Not automatic - Claude must execute each step

- **`.claude/WORKFLOW.md`** (this file):
  - **Descriptive** - explains HOW THE SYSTEM WORKS
  - Documents what's automated, what's prescriptive, what's manual
  - Source of truth for understanding the workflow

## 🔄 Typical Workflow Example

```bash
# 1. Plan (Claude command)
plan technical approach for: feature: user-profile-editing

# 2. Generate PRP (Claude command)
feature-prp required: user-profile-editing

# 3. Implement & Validate (Claude command - complete flow)
implement feature-prp tasks from: user-profile-editing-feature-prp-tasks.md

# Claude automatically follows tasks-process-enhanced.md:
# ✅ Pre-flight:
#   - npm run git:check
#   - Create branch: feature/user-profile-editing
#   - npm run validate:pre (automatic)
# ✅ For each parent task:
#   - Implement sub-tasks
#   - npm run build
#   - npm run validate:task
#   - Ask for satisfaction → Create commit → npm run patterns:auto
# ✅ After all tasks complete (user says "satisfied"):
#   - npm run validate:integration (or validate:issue)
#   - npm run validate:all (comprehensive PR checks)
#   - npm run patterns:extract
#   - npm run workflow:archive
#   - Update backlog.md and complete.md
#   - Final commit
#   - Display: "✅ All validations passed. Ready for PR submission."

# 4. Create PR (manual)
gh pr create --title "Feature: user-profile-editing" --body "..."

# 5. After PR merge (manual, optional)
npm run patterns:review   # Review extracted patterns
npm run patterns:approve  # Approve good patterns
```

## 🎯 Personal Workflow Enhancements

These enhancements are integrated into the workflow system (personal use only):

### 1. Context Scoping System

**Purpose**: Keep Claude focused with optimal context size (~3-5k tokens)

**Automatic**: Claude loads minimal context at Pre-flight step 5

- Only files specified in technical plan
- Grep for database models (not entire schema)
- Displays token count

**Optional helper**:

```bash
node workflow/scripts/personal/suggest-context.js [feature-name]
```

### 2. Test-First Development with Checkpoints

**Purpose**: Ensure comprehensive testing with rollback capability

**Automatic**: Claude follows test-first approach and creates checkpoints

- Writes test BEFORE implementation (each sub-task)
- Creates checkpoint tags after each parent task
- Format: `checkpoint/[name]/[N]`

**Rollback to checkpoint**:

```bash
# List checkpoints
git tag -l "checkpoint/*"

# Revert to checkpoint
git checkout checkpoint/[name]/[N]

# Compare with checkpoint
git diff checkpoint/[name]/[N]
```

### 3. Implementation Audit System

**Purpose**: Validate implementation against technical plan & PRD

**Automatic**: Claude offers audit after all tasks complete

- User chooses "yes" (recommended) or "no"
- 5 systematic audit sections (~10 min interaction)
- Creates audit notes: `/workflow/prps/[type]/[name]-AUDIT-NOTES.md`

**View audit notes**:

```bash
cat workflow/prps/features/[name]-AUDIT-NOTES.md
cat workflow/prps/issues/[name]-AUDIT-NOTES.md
```

---

## ⚠️ Important Notes

### Workflow Rules

- **Always start with technical planning** - No shortcuts
- **Parent tasks only** - Sub-tasks don't trigger validation prompts
- **Prescriptive process** - Claude follows `tasks-process-enhanced.md` instructions
- **Configuration-driven** - Behavior controlled by config.json

### Common Misconceptions

❌ **MYTH**: "I need to manually run validation commands after implementation"
✅ **REALITY**: All validations run automatically when you confirm satisfaction in the `implement` command

❌ **MYTH**: "I need separate commands for 'mark feature complete' and 'run pr checks'"
✅ **REALITY**: The `implement` command does everything - implementation, validation, archiving, and PR prep

❌ **MYTH**: "Pattern extraction happens automatically after every commit"
✅ **REALITY**: Claude should run `npm run patterns:auto` after parent task commits (prescriptive)

❌ **MYTH**: "Git check runs automatically before branch creation"
✅ **REALITY**: Claude should run `npm run git:check` before creating branches (prescriptive)

❌ **MYTH**: "Architecture check is a separate manual step"
✅ **REALITY**: Architecture check IS automatically integrated into all validation modes (hard automation)

✅ **FACT**: "The `implement` command is a complete end-to-end workflow"
✅ **CONFIRMED**: From implementation through validation, archiving, to PR-ready state

✅ **FACT**: "Anti-patterns are captured from fixes, not failures"
✅ **CONFIRMED**: Run `antipatterns:from-issue` after fixing to document the solution

### Understanding the Three Tiers

**🟢 Tier 1: Hard Automation** (Runs automatically - no one needs to call)

1. **Architecture check** when any validation mode runs (called by validate.js)
2. **Pre-validation** when `implement` commands are used (called by command handler)
3. **Validation scripts** when validation commands are used (called by command handlers)

**🟡 Tier 2: Prescriptive** (Claude should call during workflow)

1. **Git check** before branch creation
2. **Pattern extraction** after parent task commits
3. **Comprehensive patterns** after all tasks complete
4. **Archiving** after completion
5. **Build verification** after each parent task
6. **Task validation** after parent task implementation

**🔴 Tier 3: User Manual** (User runs outside workflow)

1. **Workflow initialization** (one-time setup)
2. **Preflight checks** (optional before sessions)
3. **Pattern review/approval** (after work complete)
4. **Database integrity** (troubleshooting only)
5. **Testing** (manual test runs)

## 🆘 Troubleshooting

| Issue                       | Solution                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| Missing templates           | `npm run workflow:init`                                                       |
| Build failures              | Check `npm run validate:pre` output                                           |
| PRP generation fails        | Ensure technical plan exists first                                            |
| Validation not running      | Check config.json automation settings                                         |
| Script not found            | Run `npm run workflow:check`                                                  |
| Patterns not extracting     | Claude should call `npm run patterns:auto` after commits (prescriptive)       |
| Anti-patterns not capturing | Run `npm run antipatterns:from-issue -- <name>` after fixing issue            |
| Git check not running       | Claude should call `npm run git:check` before branches (prescriptive)         |
| Archiving not happening     | Claude should call `npm run workflow:archive` after completion (prescriptive) |
| Architecture check failures | Review cross-feature imports and Prisma usage in client code                  |

## 📚 Related Documentation

- **CLAUDE.md** - Development standards & architecture
- **workflow/config.json** - Workflow configuration
- **.claude/commands/tasks-process-enhanced.md** - **Prescriptive process definition** (Claude follows this)
- **.claude/commands/context-scoping-guide.md** - Context loading instructions
- **.claude/commands/test-requirements.md** - Test-first development guide
- **.claude/commands/audit-checklist.md** - Implementation audit process
- **workflow/reference/prp/** - PRP templates
- **README.md** - Project overview and setup

## 🎓 Learning Resources

### Understanding Validation Modes

- **Pre**: Fast checks before starting (no build)
- **Task**: Quick checks after each task (includes build)
- **Integration/Issue**: Comprehensive domain-specific checks
- **All**: Everything combined - slowest but most thorough

### Understanding Automation Types

1. **Hard Automation** 🟢: Actually runs automatically (validation system, architecture checks)
2. **Prescriptive** 🟡: Claude should do this (defined in tasks-process-enhanced.md)
3. **Manual** 🔴: Must be explicitly requested (no trigger exists)

### When to Use What

- **During development**: Follow prescriptive process (let Claude handle it)
- **Manual verification**: Run scripts directly in terminal
- **CI/CD**: Scripts run in automated pipelines
- **Pattern review**: Manual after work is complete
