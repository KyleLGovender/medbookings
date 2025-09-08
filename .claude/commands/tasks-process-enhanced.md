implement feature tasks from: $ARGUMENTS
OR
implement issue tasks from: $ARGUMENTS

## Goal

To process and implement tasks from a task list file, updating the individual task file, backlog, and complete.md as tasks are completed.

## Process

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
3. **Parent Task Completion**

   - When all sub-tasks under a parent are complete:
     - Mark parent task as complete `[x]` in the task file
     - **Ask user**: "Parent task [X.0] is now complete. Are you satisfied? (yes/no)"
     - Update task file immediately

4. **Backlog Update**

   - When ALL tasks in the file are complete:
     - **Ask user**: "All tasks for [feature/issue-name] are complete. Are you satisfied with the overall implementation? (yes/no)"
     - If yes:
       - Locate entry in `/workflow/backlog.md`
       - Change `[ ]` to `[x]` for the main backlog entry
       - Save updated backlog.md

5. **Complete.md Update**

   - After backlog is marked complete:

     - Read `/workflow/complete.md`
     - Add entry to appropriate section:

     For features:

     ```markdown
     ## Completed Features

     ### [Feature Name] - [Completion Date]

     - **Description:** [Brief description from PRD]
     - **Key Deliverables:** [Main accomplishments]
     - **PRD:** `/workflow/prds/[feature-name]-prd.md`
     - **Tasks:** `/workflow/prds/[feature-name]-prd-tasks.md`
     - **Completed By:** [User/AI pair]
     ```

     For issues:

     ```markdown
     ## Resolved Issues

     ### [Issue Name] - [Completion Date]

     - **Problem:** [Brief problem description]
     - **Resolution:** [How it was fixed]
     - **Spec:** `/workflow/issues/[issue-name]-issue.md`
     - **Tasks:** `/workflow/issues/[issue-name]-issue-tasks.md`
     - **Resolved By:** [User/AI pair]
     ```

6. **Final Steps**
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
