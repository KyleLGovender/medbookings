
Please process the task list from: $ARGUMENTS

**Initial Steps:**
1. **Read Task List:** Use the Read tool to read the task list file from the path provided in $ARGUMENTS
2. **Identify Task Type:** Determine if this is a PRD task list or Issue task list
3. **Validation:** If the task list is neither a PRD nor an Issue task list, respond with: "This doesn't appear to be a PRD or Issue task list. Please specify a task list type that I can process (PRD or Issue)."
4. **Set Branch Strategy:** 
   - For Issue tasks: Create branch with `issue/` prefix
   - For PRD/Feature tasks: Create branch with `feature/` prefix

## Execution Modes

### Default Mode (Interactive)
- **One sub-task at a time:** Do **NOT** start the next sub‑task until you ask the user for permission and they say "yes" or "y"
- Stop after each sub‑task and wait for the user's go‑ahead.

### YOLO Mode (Continuous)
- Execute all tasks continuously without stopping for confirmation
- Use this mode when user explicitly requests "yolo mode"
- Mark off tasks as completed but proceed immediately to next task without waiting
- **CRITICAL**: At the end of all tasks, run `npm run build` until it passes successfully
- **NEVER** create PR automatically - always prompt user for permission first

## Task Implementation

- **Completion protocol:**
  1. When you finish a **sub‑task**, immediately mark it as completed by changing `[ ]` to `[x]`.
  2. If **all** subtasks underneath a parent task are now `[x]`, also mark the **parent task** as completed.

## Source Reference Protocol

When working with generated task files:

1. **Always reference the source specification** for complete context
2. **Check the task file header** for the source file reference (e.g., "Generated from: user-profile-prd.md" or "Generated from: login-bug-issue.md")
3. **Consult the original specification** when you need:
   - For Issues: Detailed problem explanations, reproduction steps, impact assessments
   - For PRDs: Feature requirements, user stories, acceptance criteria

The task files contain actionable implementation steps, but the source specifications contain the complete context.

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

1. **Create Branch (based on task type):**
   ```bash
   # For issue/bug fixes (from /workflow/issues/ task lists)
   git checkout -b issue/task-name-or-description
   
   # For feature development (from /workflow/prds/ task lists)
   git checkout -b feature/task-name-or-description
   ```

2. **Regular Development:**
   - Make incremental commits as you complete sub-tasks
   - Use descriptive commit messages referencing task numbers
   - Example: `feat(task-1.2): add subscription creation API with polymorphic validation`

3. **Before Creating PR - Critical Build and Test Verification:**
   ```bash
   # REQUIRED: Verify application compiles successfully
   npm run build
   
   # REQUIRED: Fix any compilation errors before proceeding
   # Only continue after successful build
   
   # REQUIRED: Run Playwright e2e tests to verify functionality
   # Use Playwright MCP tools for better integration and troubleshooting
   # First take a browser snapshot to understand current state
   # Then run tests and troubleshoot any failures interactively
   npx playwright test
   
   # REQUIRED: Fix any failing tests before proceeding to PR creation
   # Use Playwright MCP browser tools to:
   # - Navigate to failing pages/components
   # - Take screenshots for debugging
   # - Interact with elements to reproduce issues
   # - Verify fixes by running specific test scenarios
   # Only continue to PR creation after successful build AND passing tests
   ```

4. **After All Tasks Complete, Build Passes, and Tests Pass:**
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
   
   # Push to remote (use appropriate branch prefix based on task type)
   git push -u origin issue/task-name       # For issue fixes
   git push -u origin feature/task-name     # For features
   
   # Create PR with comprehensive description (adjust title based on task type)
   gh pr create --title "fix: [Task Group] - [Description]" --body "[detailed PR description]"    # For issues
   gh pr create --title "feat: [Task Group] - [Description]" --body "[detailed PR description]"   # For features
   ```

5. **User Review Process (Only to be done by Developer. Never to be done by AI):**
   - User reviews PR on GitHub
   - User merges PR when satisfied
   - User deletes feature branch on GitHub (click "Delete branch" button)

6. **Local Cleanup (Only to be done by Developer. Never to be done by AI):**
   ```bash
   # Switch back to master
   git checkout master
   
   # Update local master with merged changes
   git pull origin master
   
   # Delete local branch (use appropriate branch prefix based on task type)
   git branch -d issue/task-name         # For issue fixes
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
   - **YOLO Mode:** After implementing a sub‑task, commit changes, update the file, and immediately proceed to the next task without waiting for approval. When ALL tasks are complete, run `npm run build` repeatedly until it passes, then run `npx playwright test` using MCP browser tools to troubleshoot any failures until tests pass, then ASK USER for permission to create PR.

4. **MCP Tool Usage:**
   - **PostgreSQL Server** (`mcp__postgres-server__query`): Use for database queries, constraint verification, data integrity checks
   - **Filesystem Server** (`mcp__filesystem-server__*`): Use for file operations when available, preferred over traditional file tools
   - **IDE Integration** (`mcp__ide__*`): Use for getting diagnostics and executing code when available
   - **Playwright Browser** (`mcp__playwright__*`): Use for e2e test troubleshooting, browser automation, and interactive debugging
   - **Preference**: Always prefer MCP tools over traditional command-line equivalents when available
   - **Database Verification**: Use PostgreSQL MCP server to verify migrations, constraints, and data integrity instead of bash commands
   - **Test Debugging**: Use Playwright MCP tools to interactively debug failing tests, take screenshots, and verify fixes

5. **Interactive Commands Policy:**
   - **NEVER** execute commands that require interactive environments (e.g., `npx prisma migrate dev`, `npm init`, interactive prompts)
   - **STOP and ASK** the user to execute these commands manually
   - **Commands to avoid**: 
     - `npx prisma migrate dev` (requires interaction)
     - `npm init` (requires interaction)
     - Any command with interactive prompts or confirmations
   - **Safe alternatives**:
     - Use `npx prisma migrate deploy` for non-interactive migration application
     - Use `npx prisma generate` for client generation
     - Create migration files manually when needed
     - Use MCP PostgreSQL server for database verification instead of interactive commands

6. **Build and Test Verification:**
   - **CRITICAL**: Before creating any PR, ALWAYS run `npm run build` to verify the application compiles successfully
   - **CRITICAL**: After successful build, run `npx playwright test` to verify end-to-end functionality
   - **Use Playwright MCP Tools for Test Troubleshooting:**
     - When tests fail, use `mcp__playwright__browser_navigate` to go to failing pages
     - Use `mcp__playwright__browser_snapshot` to capture current page state
     - Use `mcp__playwright__browser_take_screenshot` for visual debugging
     - Use `mcp__playwright__browser_click`, `mcp__playwright__browser_type` to interact with failing elements
     - Use `mcp__playwright__browser_evaluate` to run JavaScript and inspect page state
     - Systematically reproduce test failures and verify fixes through browser automation
   - Fix ALL compilation errors and test failures before proceeding to PR creation
   - This prevents failed CI/CD builds, deployment issues, and broken functionality
   - Both build AND tests must pass completely before any PR is created

7. **PR Creation:**
   - When all tasks in a group are complete, build passes, AND tests pass, **ASK USER FOR PERMISSION** before creating PR
   - **NEVER** automatically create PRs without explicit user consent
   - In YOLO mode: Complete all tasks, verify build passes, run tests, then prompt: "All tasks complete, build successful, and tests passing. Would you like me to create a PR?"
   - Only create PR after user confirms with "yes" or similar affirmative response
   - Include detailed description, test plan, and file change summary when creating PR
   - Reference original task documentation
