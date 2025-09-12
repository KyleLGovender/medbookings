implement feature tasks from: $ARGUMENTS
OR
implement issue tasks from: $ARGUMENTS

**Trigger Format:**
- Must start with either: "implement feature tasks from:" OR "implement issue tasks from:"
- Everything after colon is $ARGUMENTS (the task filename)
- Strip leading/trailing whitespace from $ARGUMENTS
- Example: "implement feature tasks from: user-auth-prd-tasks.md"

## Goal

To process and implement tasks from a task list file, updating the individual task file, backlog, and complete.md as tasks are completed.

## Process

0. **Pre-flight Checks:**
- Parse $ARGUMENTS to extract task filename
- Check both paths: `/workflow/prds/$ARGUMENTS` then `/workflow/issues/$ARGUMENTS`
- If neither exists: "Task file not found in /workflow/prds/ or /workflow/issues/. Check filename."
- Derive feature/issue name by stripping associated suffix `-prd-tasks.md` or `-issue-tasks.md` 
   **Git Verification (Run check-git.js):**
- Before creating any branches, verify git configuration by checking output of `npm run git:check`
- If git check fails, stop workflow and ask user to fix git configuration first
- Only proceed if git check passes

- Check if git branch `[feature|issue]/[name]` exists
  - If exists: "Branch exists. Use existing/Create new/Cancel? (u/n/c)"

1. **Initial Setup**

   - Read task list file from $ARGUMENTS
   - Determine if this is a feature (PRD) or issue task list
   - Read current `/workflow/backlog.md` to locate the corresponding entry
   - Set branch prefix: `feature/` for PRDs, `issue/` for issues
   - Create and checkout appropriate git branch

2. **Task Implementation**
   - For each sub-task:
     - Implement the sub-task
     - **Ask user**: "Sub-task [X.X] has been implemented. Are you satisfied with the implementation? (yes/no)"
     - If yes: Mark sub-task as complete `[x]` in the task file
     - If no: Revise implementation and ask again
     - Commit changes with message referencing task number

3. **Build Verification**

- After implementing each parent task:
  - Run `npm run build` to catch compilation errors
  - Fix any build errors before proceeding
  - Only mark task complete when build passes

4. **Parent Task Completion**

   - When all sub-tasks under a parent are complete:
     - Mark parent task as complete `[x]` in the task file
     - **Ask user**: "Parent task [X.0] is now complete. Are you satisfied? (yes/no)"
     - Update task file immediately

5. **Backlog Update**

   - When ALL tasks in the file are complete:
     - **Ask user**: "All tasks for [feature/issue-name] are complete. Are you satisfied with the overall implementation? (yes/no)"
     - If yes:
      - Locate entry in `/workflow/backlog.md`
      - If not found:
       - Warn: "No backlog entry found for [name]. May have been manually edited."
       - Ask: "Create new backlog entry? (yes/no)"
      - Change `[ ]` to `[x]` for the main backlog entry
      - Save updated backlog.md

6. **Update Backlog Statistics After Completion**

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

7. **Recalculate Backlog Statistics**
   - After marking item complete with [x]:
     - Recount all sections
     - Update all [auto-count] placeholders
     - Update Last Updated date

8. **Complete.md Update**

   - After backlog is marked complete:

     - Read `/workflow/complete.md`
     - Add entry to appropriate section:

     For features:
```markdown
### [Feature Name] - [Completion Date]
     
- **Description:** [Brief description from PRD]
- **Key Deliverables:** [Main accomplishments]
- **PRD:** `/workflow/prds/[feature-name]-prd.md`
- **Tasks:** `/workflow/prds/[feature-name]-prd-tasks.md`
- **Completed By:** [User/AI pair]
```

     For issues:
```markdown
### [Issue Name] - [Completion Date]
     
- **Problem:** [Brief problem description]
- **Resolution:** [How it was fixed]
- **Spec:** `/workflow/issues/[issue-name]-issue.md`
- **Tasks:** `/workflow/issues/[issue-name]-issue-tasks.md`
- **Resolved By:** [User/AI pair]
```

9. **Final Backlog Statistics Update**

   - After moving item to complete.md, update backlog statistics one more time:
     - Remove the completed item from "## Recently Completed (Last 7 Days)" if present
     - Recount all sections as per Step 6
     - Update all statistics placeholders with new counts
     - Ensure backlog.md reflects accurate current state

10. **Final Steps**
   - Run `npm run build` to verify compilation
   - Create comprehensive git commit
   - Ask: "Would you like me to create a PR for these changes? (yes/no)"
   - If yes, create PR with detailed description

## Execution Modes

- **Default Mode**: Interactive with confirmation at each step
- **YOLO Mode**: If user specifies, implement continuously but still ask for satisfaction confirmation before marking complete

## Success Criteria

- All task completions are confirmed by user before marking
- Backlog.md accurately reflects completion status
- Complete.md maintains historical record
- Git history shows clear progression
