---
trigger: manual
---

# Processing a list of tasks

Guidelines for managing task lists in markdown files to track progress on completing a PRD or Task Spec

## Execution Modes

### Default Mode (Interactive)
- **One sub-task at a time:** Do **NOT** start the next sub‑task until you ask the user for permission and they say "yes" or "y"
- Stop after each sub‑task and wait for the user's go‑ahead.

### YOLO Mode (Continuous)
- Execute all tasks continuously without stopping for confirmation
- Use this mode when user explicitly requests: "execute tasks using @project-planning/process-tasks.md yolo mode"
- Mark off tasks as completed but proceed immediately to next task without waiting

## Task Implementation

- **Completion protocol:**
  1. When you finish a **sub‑task**, immediately mark it as completed by changing `[ ]` to `[x]`.
  2. If **all** subtasks underneath a parent task are now `[x]`, also mark the **parent task** as completed.

## Source Reference Protocol

When working with generated task files:

1. **Always reference the source bug list** for complete context
2. **Check the task file header** for the source file reference (e.g., "Generated from: calendar-v20250715-bugs.md")
3. **Consult the original bug list** when you need:
   - Detailed issue explanations
   - Root cause analysis
   - Time estimates
   - Specific reproduction steps
   - Full impact assessments

The task files contain actionable implementation steps, but the source bug lists contain the complete problem context.

## Task List Maintenance

1. **Update the task list as you work:**

   - Mark tasks and subtasks as completed (`[x]`) per the protocol above.
   - Add new tasks as they emerge.

2. **Maintain the "Relevant Files" section:**
   - List every file created or modified.
   - Give each file a one‑line description of its purpose.

## Git Workflow for Task Implementation

### Branch and PR Management

When implementing tasks, follow this Git workflow:

1. **Create Branch:**
   ```bash
   # For bug fixes (from @project-planning/bugs/ directory)
   git checkout -b bugs/task-name-or-description
   
   # For feature development (from @project-planning/prd/ directory)
   git checkout -b feature/task-name-or-description
   ```

2. **Regular Development:**
   - Make incremental commits as you complete sub-tasks
   - Use descriptive commit messages referencing task numbers
   - Example: `feat(task-1.2): add subscription creation API with polymorphic validation`

3. **After All Tasks Complete:**
   ```bash
   # Stage all changes
   git add .
   
   # Create comprehensive commit with task summary
   git commit -m "implement [task group name] - [brief description]
   
   Completed Tasks:
   - Task X.X: [description]
   - Task Y.Y: [description]
   
   Technical improvements:
   - [key improvement 1]
   - [key improvement 2]
   
   Files modified: X files changed, Y insertions, Z deletions
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>"
   
   # Push to remote (use appropriate branch prefix)
   git push -u origin bugs/task-name        # For bug fixes
   git push -u origin feature/task-name     # For features
   
   # Create PR with comprehensive description
   gh pr create --title "feat: [Task Group] - [Description]" --body "[detailed PR description]"
   ```

4. **User Review Process:**
   - User reviews PR on GitHub
   - User merges PR when satisfied
   - User deletes feature branch on GitHub (click "Delete branch" button)

5. **Local Cleanup:**
   ```bash
   # Switch back to master
   git checkout master
   
   # Update local master with merged changes
   git pull origin master
   
   # Delete local branch (use appropriate branch prefix)
   git branch -d bugs/task-name          # For bug fixes
   git branch -d feature/task-name       # For features
   ```

### Commit Message Guidelines

- Use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.
- Include task references in commit messages
- For comprehensive task completion commits, include:
  - Summary of completed tasks
  - Key technical improvements
  - File change statistics
  - Claude Code attribution

## AI Instructions

When working with task lists, the AI must:

1. **Follow Git Workflow:**
   - **FIRST STEP**: Create feature branch before starting ANY work
   - Confirm branch creation and announce current branch to user
   - Make incremental commits after completing each sub-task
   - Use descriptive commit messages referencing task numbers
   - Create comprehensive final commit when all parent tasks complete
   - Create detailed PR with proper description and test plan

2. **Task Management:**
   - Regularly update the task list file after finishing any significant work
   - Follow the completion protocol:
     - Mark each finished **sub‑task** `[x]`
     - Mark the **parent task** `[x]` once **all** its subtasks are `[x]`
   - Add newly discovered tasks
   - Keep "Relevant Files" accurate and up to date

3. **Execution Modes:**
   - **Before starting work**: Verify correct branch and announce current working branch
   - Check which sub‑task is next
   - **Default Mode:** After implementing a sub‑task, commit changes, update the file, and then pause for user approval
   - **YOLO Mode:** After implementing a sub‑task, commit changes, update the file, and immediately proceed to the next task without waiting for approval

4. **PR Creation:**
   - When all tasks in a group are complete, create comprehensive PR
   - Include detailed description, test plan, and file change summary
   - Reference original task documentation
