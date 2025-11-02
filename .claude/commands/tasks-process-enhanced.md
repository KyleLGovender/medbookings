implement feature-prp tasks from: $ARGUMENTS
OR
implement issue-prp tasks from: $ARGUMENTS

**Trigger Format:**

- Must start with either: "implement feature-prp tasks from:" OR "implement issue-prp tasks from:"
- Everything after colon is $ARGUMENTS (the task filename)
- Strip leading/trailing whitespace from $ARGUMENTS
- Example: "implement feature-prp tasks from: user-auth-feature-prp-tasks.md"

## Goal

To process and implement tasks from a task list file, updating the individual task file, backlog, and complete.md as tasks are completed.

## Process

1. **Rules, Reference context, Standards**

   - Analyse and comprehend the CLAUDE.md file in project root, and WORKFLOW.md file in the /.claude folder

2. **Pre-flight Checks:**

- Parse $ARGUMENTS to extract task filename
- Check paths: `/workflow/prps/features/$ARGUMENTS`, then `/workflow/prps/issues/$ARGUMENTS`
- If none exists: "Task file not found in /workflow/prps/features/ or /workflow/prps/issues/. Check filename."
- Derive feature/issue name by stripping associated suffix `-feature-prp-tasks.md` or `-issue-prp-tasks.md`
  **Git Verification (Run check-git.js):**
- Before creating any branches, verify git configuration by checking output of `npm run git:check`
- If git check fails, stop workflow and ask user to fix git configuration first
- Only proceed if git check passes

3. **Initial Setup**

   - Read task list file from $ARGUMENTS
   - Determine type based on filename:
     - Contains `-feature-prp-tasks.md` → Type = FEATURE
     - Contains `-issue-prp-tasks.md` → Type = ISSUE
   - Store this type for use throughout the workflow
   - Read current `/workflow/backlog.md` to locate the corresponding entry
   - Set branch prefix: `feature/` for feature-PRPs, `issue/` for issue-PRPs
   - **Automatic Branch Creation**:
     - Branch name: `[feature|issue]/[name]` where name is derived from task file
     - Check if branch exists:
       - If exists: Automatically checkout existing branch
       - If not: Create and checkout new branch
     - No user prompts required for branch management

4. **Load PRP Context**

   - Read associated PRP document
   - Load code patterns for this feature type
   - Set up validation checkpoints
   - Configure auto-linting after each file save

5. **Smart Context Loading** (Follow `.claude/commands/context-scoping-guide.md`)
   **Purpose**: Maintain optimal context size (3,000-5,000 tokens) to avoid confusion

   **Process**:

   1. Read technical plan's "Files to Modify" and "Files to Create" sections
   2. Load ONLY those specific files (not entire feature modules)
      - Read entire file (don't skim)
      - Read direct imports (one level deep)
      - Read type definitions used
   3. Load relevant patterns from `/workflow/reference/code-patterns/`:
      - API work: `api-patterns.md`
      - Components: `component-patterns.md`
      - Hooks: `hook-patterns.md`
      - Validation: `validation-patterns.md`
      - **Maximum**: 2 pattern files per task
   4. If database changes: Use grep for specific models only
      ```bash
      # Example: Load only Provider and Availability models
      grep -A 20 "^model Provider\|^model Availability" prisma/schema.prisma
      ```
   5. Load relevant CLAUDE.md sections only (use offset/limit parameters)

   **Display to user**:

   ```
   📊 Context Loaded:
   - Files read: [X]
   - Patterns loaded: [Y]
   - Database models: [Z]
   - Estimated tokens: ~[N]k

   Ready to implement [task description]
   ```

   **Context Size Guidelines**:

   - Target: 3,000-5,000 tokens (optimal)
   - Warning at 8,000+ tokens (reload context)
   - Refresh after each parent task if switching domains (API → UI)

   **What NOT to load**:

   - ❌ Entire feature modules
   - ❌ All database models (grep specific ones)
   - ❌ Unrelated routers/components
   - ❌ Test files (unless task involves tests)
   - ❌ Complete CLAUDE.md (read sections only)

6. **Test-First Task Implementation** (Follow `.claude/commands/test-requirements.md`)

   **For each sub-task involving code**:

   **Step 6.1: Determine Test Requirements**

   - Identify what needs testing (function, component, API endpoint)
   - Determine test type:
     - Pure functions/utils → Unit test (Vitest)
     - tRPC procedures → Unit test (Vitest)
     - React components → Unit test (Vitest + RTL)
     - Complete user flows → E2E test (Playwright)
   - Determine test location:
     - Unit: `/src/[path]/__tests__/[file].test.ts`
     - E2E: `/e2e/tests/[feature]/[scenario].spec.ts`

   **Step 6.2: Write Test FIRST**

   - Write test that defines expected behavior
   - Test should cover:
     - ✅ Happy path (normal operation)
     - ✅ At least 2 error scenarios
     - ✅ At least 2 edge cases
   - Use descriptive test names: `it('should [behavior] when [condition]')`
   - Follow AAA pattern: Arrange → Act → Assert

   **Step 6.3: Run Test (Should FAIL)**

   ```bash
   npm run test:unit  # For unit tests (if configured)
   npm test -- [test-file]  # For E2E tests
   ```

   - Expected: Test FAILS (no implementation yet)
   - If test passes: Test is broken, fix before proceeding

   **Step 6.4: Implement Code**

   - Write minimal code to make test pass
   - Follow Red → Green → Refactor cycle
   - Stay focused on making test pass (don't over-implement)

   **Step 6.5: Run Test Again (Should PASS)**

   - Run same test command
   - Expected: Test PASSES
   - If still failing: Debug and fix until passing

   **Step 6.6: Mark Sub-Task Complete**

   - Mark sub-task complete `[x]` in task file
   - No satisfaction check needed for sub-tasks

   **Exception**: Skip testing for documentation, config updates, typos (or if user explicitly requests)

7. **Build Verification & Test Suite**

   After implementing each parent task:

   **Step 7.1: Compile Check**

   ```bash
   npm run build
   ```

   - Must pass before proceeding
   - Fix any compilation errors

   **Step 7.2: Test Suite Verification**

   ```bash
   # Run unit tests (if configured)
   npm run test:unit

   # Run E2E tests
   npm test
   ```

   - All tests must pass
   - Fix failing tests before proceeding

   **Step 7.3: Type Check**

   ```bash
   npx tsc --noEmit
   ```

   - Verify no type errors

8. **Parent Task Completion with Checkpoint** (Follow `.claude/commands/test-requirements.md`)

   When all sub-tasks under a parent are complete:

   **Step 8.1: Mark Parent Complete**

   - Mark parent task as complete `[x]` in the task file

   **Step 8.2: Run Validation**

   - Automatically run validation: `npm run validate:task "[name]"`
   - If validation fails: Fix issues and re-run until passes

   **Step 8.3: User Satisfaction Check**

   - **Ask user**: "Parent task [X.0] is now complete and validated. Are you satisfied? (yes/no)"

   **If NO**:

   - Ask what needs revision
   - Implement changes
   - Re-validate (Steps 7.1-7.3)
   - Ask again (no commit until satisfied)

   **If YES**:

   **Step 8.4: Verify Tests**

   ```bash
   npm run test:unit  # Unit tests (if configured)
   npm test           # E2E tests
   ```

   - Must ALL pass before checkpoint
   - If any fail: Fix before proceeding

   **Step 8.5: Create Checkpoint Commit**

   ```bash
   git add .
   git commit -m "feat: Complete [parent task name] - Checkpoint [N]"
   # For issues: Use "fix:" instead of "feat:"
   ```

   **Step 8.6: Create Checkpoint Tag**

   ```bash
   git tag -a checkpoint/[feature-name]/[N] -m "Working state: [description]"
   ```

   - Tag format: `checkpoint/[feature-name]/[N]`
   - N = sequential number (1, 2, 3...)
   - Description = what's working at this checkpoint

   **Step 8.7: Display Checkpoint Info**

   ```
   ═══════════════════════════════════════════════
   ✅ Checkpoint [N] Created Successfully
   ═══════════════════════════════════════════════

   📊 Tests Status:
      - Unit tests: [X] passing
      - E2E tests: [Y] passing
      - Total: [X+Y] tests passing

   🏷️  Checkpoint Tag: checkpoint/[feature-name]/[N]
   📝 Description: [what's working]

   🔄 To revert to this checkpoint:
      git checkout checkpoint/[feature-name]/[N]

   🔄 To compare current vs checkpoint:
      git diff checkpoint/[feature-name]/[N]

   ═══════════════════════════════════════════════
   ```

   **Step 8.8: Pattern Extraction**

   - Automatically run: `npm run patterns:auto`
   - Display: "Patterns extracted to staging for later review"

   **Step 8.9: Update Task File**

   - Save updated task file immediately

9. **Backlog Update**

   - When ALL tasks in the file are complete:
     - **Ask user**: "All tasks for [feature/issue-name] are complete. Are you satisfied with the overall implementation? (yes/no)"
     - If no:
     - Ask: "What aspects need revision?"
     - Guide user to specific tasks that need rework
     - Continue with task implementation process
     - If yes: Proceed to Step 10 (Implementation Audit)

10. **Implementation Audit** (Follow `.claude/commands/audit-checklist.md`)

    **Purpose**: Systematically verify implementation matches technical plan & PRD before validation.

When user satisfied with overall implementation:

**Step 10.1: Offer Audit**

- **Ask user**: "Run implementation audit checklist? (yes/recommended / no)"

**If user says NO**:

- **Warn**: "⚠️ Skipping audit may miss gaps vs technical plan/PRD"
- **Ask**: "Proceed to validation without audit? (confirm)"
- If confirmed: Skip to Step 11 (Backlog statistics update)
- If not confirmed: Conduct audit

**If user says YES**:

**Step 10.2: Conduct Systematic Audit**

Guide user through audit-checklist.md sections:

**A. Technical Plan Compliance** (2-3 minutes):

- Review files modified/created vs plan
- Verify database changes match plan
- Verify API endpoints match specifications
- Ask: "Any deviations from technical plan? (yes/no)"
- Document deviations with justifications

**B. PRD Business Requirements** (2-3 minutes):

- Verify problem statement solved
- Confirm business objectives achieved
- Validate user stories satisfied
- Ask: "Can you demonstrate solution working? (yes/no)"

**C. Code Quality Verification** (2-3 minutes):

- Check for prohibited patterns:

  ```bash
  # Cross-feature imports?
  grep -r "from '@/features/" src/features/[feature]/ --include="*.ts"

  # Prisma in client?
  grep -r "from '@/lib/prisma'" src/app/ src/features/ --include="*.tsx"

  # console.log violations?
  grep -r "console\.log" src/features/[feature]/ --include="*.ts"

  # new Date() violations?
  grep -r "new Date()" src/features/[feature]/ --include="*.ts"
  ```

- Verify CLAUDE.md compliance
- Ask: "Any compliance violations found? (yes/no)"

**D. Test Coverage Verification** (1-2 minutes):

- Verify all critical code has tests
- Run test suite: `npm run test:unit && npm test`
- Confirm all tests passing
- Ask: "Coverage meets targets (85%+)? (yes/no)"

**E. Gaps & Deviations** (1-2 minutes):

- List any missing features/requirements
- Document justifications
- Assess impact (low/medium/high)
- Ask: "Any gaps need addressing before PR? (yes/no)"

**Step 10.3: Create Audit Notes**

- Create: `/workflow/prps/[features|issues]/[name]-AUDIT-NOTES.md`
- Use template from audit-checklist.md
- Document all findings:
  - Technical plan compliance status
  - PRD requirements status
  - Code quality status
  - Test coverage metrics
  - Identified gaps with actions
- Display audit summary to user

**Step 10.4: Assess Results**

- **Ask user**: "Audit complete. Ready for validation, or gaps to address first?"

**If gaps need addressing**:

- List specific items from audit
- Guide user to address gaps
- Re-run affected validations
- Ask again: "Gaps addressed. Ready for validation? (yes/no)"

**If ready for validation**:

- Document in audit notes: "Ready for validation: YES"
- Display: "✅ Audit passed. Proceeding to validation."
- Continue to Step 11

**Step 10.5: Final Validation**

- Based on type determined in Initial Setup:
  - If FEATURE: Automatically run `npm run validate:integration "[name]"`
  - If ISSUE: Automatically run `npm run validate:issue "[name]"`
- Then automatically run: `npm run validate:all "[name]"` for comprehensive PR checks
- Display validation results

11. **Update Backlog Statistics**

After audit and validation complete:

- Locate entry in `/workflow/backlog.md`
- If not found:
  - Warn: "No backlog entry found for [name]. May have been manually edited."
  - Ask: "Create new backlog entry? (yes/no)"
- Change `[ ]` to `[x]` for the main backlog entry
- Save updated backlog.md

12. **Update Backlog Statistics After Completion**

- After marking entry complete with `[x]`, automatically update statistics:
  - Count all `- [ ]` items in "## High Priority" sections (both Features and Issues)
  - Count all `- [ ]` items in "## Medium Priority" sections (both Features and Issues)
  - Count all `- [ ]` items in "## Low Priority" sections (both Features and Issues)
  - Count all `- [ ]` items in "## Quick Feature Notes" and "## Quick Issue Notes"
  - Count all `- [x]` items throughout entire document
  - Calculate total: Sum of all checkbox items (both `[ ]` and `[x]`)

**Counting Pattern Instructions:**

- Use pattern `^\s*- \[ \]` to match uncompleted items
- Use pattern `^\s*- \[x\]` to match completed items (case-insensitive)
- Section boundaries: Count stops at next `##` heading or `---` separator
- Include all indentation levels (sub-items under main checkbox items)

- Replace placeholder values in backlog.md:
  - `**Total Items:** [auto-count]` → Replace with total count
  - `**High Priority:** [auto-count]` → Replace with high priority count
  - `**Medium Priority:** [auto-count]` → Replace with medium priority count
  - `**Low Priority:** [auto-count]` → Replace with low priority count
  - `**Completed:** [auto-count]` → Replace with completed count
  - `**Last Updated:** [Date]` → Replace with today's date (YYYY-MM-DD)

13. **Recalculate Backlog Statistics**

- After marking item complete with [x]:
  - Recount all sections
  - Update all [auto-count] placeholders
  - Update Last Updated date

14. **Automatic Pattern Extraction**
    Pattern extraction happens at TWO points:

- After EACH parent task commit (using `patterns:auto`)
- After ALL tasks complete (comprehensive extraction)

After marking item complete but before final steps:

```bash
# Comprehensive Pattern Extraction (runs after all tasks complete)
if [ "$ALL_TASKS_COMPLETE" = true ]; then
  echo "Running comprehensive pattern extraction for completed $TYPE..."

  # Determine if feature or issue
  if [[ "$TASK_FILE" == *"-feature-prp-tasks.md" ]]; then
    # Extract specific feature patterns
    node ./workflow/scripts/update-patterns.js extract "$FEATURE_NAME"
    echo "✅ Feature-specific patterns extracted"
  elif [[ "$TASK_FILE" == *"-issue-prp-tasks.md" ]]; then
    # Capture anti-patterns from the fixed issue
    npm run antipatterns:from-issue -- "$ISSUE_NAME"
    echo "✅ Anti-patterns captured from issue fix"
  fi

  # Review all patterns collected during development
  echo "💡 Patterns collected throughout development are in staging."
  echo "   Run 'npm run patterns:review' to review all extracted patterns"
fi
```

Note: `patterns:auto` runs automatically after each parent task commit, continuously learning from your implementation as you progress.

15. **Archive Completed Work**

- After validation passes and user is satisfied:
  - Run: `node workflow/scripts/workflow-mgmt/archive-completed.js archive "[name]" [feature|issue]`
  - This automatically:
    - Moves PRP and task files to `/workflow/archive/YYYY/MM/`
    - Archives or copies technical plan (copies if shared with other PRPs)
    - Updates complete.md with archive reference
  - Display: "✅ Work archived to workflow/archive/[YYYY]/[MM]/"

16. **Complete.md Update**

- After archiving is complete:

  - Read `/workflow/complete.md`
  - Add entry to appropriate section (archive script handles basic entry):

  For features:

```markdown
### [Feature Name] - [Completion Date]

- **Description:** [Brief description from PRP]
- **Key Deliverables:** [Main accomplishments]
- **Archived:** `/workflow/archive/[YYYY]/[MM]/`
- **Completed By:** [User/AI pair]
```

     For issues:

```markdown
### [Issue Name] - [Completion Date]

- **Description:** [Brief description from Issue PRP]
- **Key Deliverables:** [Main accomplishments]
- **Archived:** `/workflow/archive/[YYYY]/[MM]/`
- **Completed By:** [User/AI pair]
```

17. **Final Backlog Statistics Update**

- After moving item to complete.md, update backlog statistics one more time:
  - Remove the completed item from "## Recently Completed (Last 7 Days)" if present
  - Recount all sections as per Step 12
  - Update all statistics placeholders with new counts
  - Ensure backlog.md reflects accurate current state

18. **Final Steps**

- Run `npm run build` to verify final compilation
- Create final comprehensive git commit with message: "chore: Complete [feature/issue name] implementation"
- Display summary: "Implementation complete and all validations passed. Ready for PR submission."

## Execution Modes

- **Default Mode**: Interactive with confirmation at each step
- **YOLO Mode**: If user specifies, implement continuously but still ask for satisfaction confirmation before marking complete

## Success Criteria

- All task completions are confirmed by user before marking
- Backlog.md accurately reflects completion status
- Complete.md maintains historical record
- Git history shows clear progression
