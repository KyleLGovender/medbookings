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

## AI Instructions

When working with task lists, the AI must:

1. Regularly update the task list file after finishing any significant work.
2. Follow the completion protocol:
   - Mark each finished **sub‑task** `[x]`.
   - Mark the **parent task** `[x]` once **all** its subtasks are `[x]`.
3. Add newly discovered tasks.
4. Keep "Relevant Files" accurate and up to date.
5. Before starting work, check which sub‑task is next.
6. **Default Mode:** After implementing a sub‑task, update the file and then pause for user approval.
7. **YOLO Mode:** After implementing a sub‑task, update the file and immediately proceed to the next task without waiting for approval.
