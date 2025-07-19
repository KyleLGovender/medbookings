---
trigger: manual
---

# Rule: Building a Bug Fix & Improvement Task List

## Goal

To guide an AI assistant in creating and maintaining a comprehensive task list for bug fixes, code improvements, and technical debt items discovered during code review or development. The task list should be iterative, allowing for continuous addition and prioritization of tasks with detailed context and execution instructions.

## Process

1. **Initialize Task List:** Create or update an existing bug/improvement task list document
2. **Analyze Code Issues:** Review code, identify bugs, performance issues, technical debt, or improvement opportunities
3. **Add Tasks Iteratively:** Add new tasks to the list with proper prioritization and context
4. **Provide Implementation Context:** Include detailed notes on how to approach each task
5. **Organize and Prioritize:** Continuously reorganize tasks by priority and complexity
6. **Track Progress:** Update task status as work progresses

## Task Categories

Tasks should be categorized into one of the following types:

- **Bug Fix:** Fixes for broken functionality or incorrect behavior
- **Performance:** Optimizations to improve speed, memory usage, or efficiency
- **Technical Debt:** Refactoring, code cleanup, or architectural improvements
- **Security:** Security vulnerabilities or hardening measures
- **UX/UI:** User experience improvements or visual fixes
- **Testing:** Adding or improving test coverage
- **Documentation:** Code comments, README updates, or API documentation

## File Structure

### Source Lists (Input)
Multiple categorized bug/task lists stored in `/project-planning/bugs/`:
- `provider-availability-bugs.md` - Bugs related to provider availability
- `organization-availability-bugs.md` - Bugs related to organization availability

### Output Files (For Claude Code Execution)
Generated task files in `/project-planning/bugs/`:
- `provider-availability-bugs-tasks.md` 
- `provider-availability-bugs-tasks.md` 

## Source List Format

Each source list in `/project-planning/bugs/` follows this structure:

```markdown
# Bug Fix & Improvement Task List

## High Priority Tasks

### 🔴 Critical Issues (Fix Immediately)
- [ ] **Bug Fix**: [Task Title] - `path/to/file.ts:123`
  - **Issue**: Brief description of the problem
  - **Impact**: How this affects users/system
  - **Implementation**: Step-by-step approach to fix
  - **Testing**: How to verify the fix works
  - **Estimated Time**: X hours/days

### 🟡 High Priority (Next Sprint)
- [ ] **Performance**: [Task Title] - `path/to/file.ts:456`
  - **Issue**: Description of performance problem
  - **Impact**: Performance metrics or user experience impact
  - **Implementation**: Detailed approach with code examples
  - **Testing**: Performance testing strategy
  - **Estimated Time**: X hours/days

## Medium Priority Tasks

### 🔵 Medium Priority (Upcoming)
- [ ] **Technical Debt**: [Task Title] - `path/to/file.ts:789`
  - **Issue**: Description of technical debt
  - **Impact**: How this affects maintainability/development
  - **Implementation**: Refactoring approach
  - **Testing**: Testing strategy for refactored code
  - **Estimated Time**: X hours/days

## Low Priority Tasks

### 🟢 Low Priority (Backlog)
- [ ] **UX/UI**: [Task Title] - `path/to/file.tsx:101`
  - **Issue**: Description of UX/UI improvement
  - **Impact**: User experience enhancement
  - **Implementation**: UI/UX changes needed
  - **Testing**: User testing or visual regression testing
  - **Estimated Time**: X hours/days

## Completed Tasks

### ✅ Recently Completed
- [x] **Bug Fix**: [Completed Task Title] - `path/to/file.ts:123`
  - **Completed**: YYYY-MM-DD
  - **Notes**: Brief notes on implementation

## Task Management Guidelines

### Adding New Tasks
1. Identify the issue type and priority level
2. Include file path and line number where applicable
3. Provide clear problem description and impact assessment
4. Detail implementation approach with specific steps
5. Define testing strategy
6. Estimate time required

### Prioritization Criteria
- **Critical**: System-breaking bugs, security vulnerabilities
- **High**: Performance issues, user-facing bugs, blocking issues
- **Medium**: Technical debt, code quality improvements
- **Low**: Nice-to-have improvements, minor UX enhancements

### Implementation Context
For each task, provide:
- **Root Cause**: Why the issue exists
- **Dependencies**: Other tasks or external factors
- **Code Context**: Relevant functions, components, or modules
- **Testing Requirements**: Unit tests, integration tests, manual testing
- **Rollback Plan**: How to revert if issues arise

## Workflow Integration

### When to Add Tasks
- During code reviews
- When debugging issues
- During feature development
- From user feedback or bug reports
- During refactoring sessions

### Task Lifecycle
1. **Identified**: Task added to appropriate priority section
2. **In Progress**: Move to active work section (not shown in template)
3. **Testing**: Undergoing verification
4. **Completed**: Move to completed section with notes
5. **Archived**: Remove from active document (periodic cleanup)

## Notes for AI Assistant

- Always include file paths with line numbers when possible
- Provide concrete implementation steps, not just high-level descriptions
- Consider dependencies between tasks and order accordingly
- Include code snippets or examples in implementation notes
- Update priority levels based on business impact and technical complexity
- Maintain consistent formatting and categorization
- Archive completed tasks periodically to keep document manageable

## Target Audience

The task list should be detailed enough for a **junior to mid-level developer** to understand the problem, approach the solution methodically, and test their implementation thoroughly.
```

## Output Files for Claude Code

The generated task files in `/project-planning/bugs/` follow this executable format:

```markdown
# [Category] - Executable Task List

## Overview
Brief description of the task category and total number of tasks.

## Instructions for Claude Code
- Complete tasks in order of priority
- Mark tasks as completed when finished
- Run tests after each task completion
- Update this file with completion status

## Task 1: [Task Title]
**Priority:** High
**File:** `path/to/file.ts:123`
**Estimated Time:** 2-3 hours

### Problem Description
Clear description of the issue or improvement needed.

### Implementation Steps
1. Step-by-step instructions
2. Specific code changes required
3. Configuration updates needed

### Testing Requirements
- Unit tests to write/update
- Integration tests needed
- Manual testing steps

### Acceptance Criteria
- [ ] Specific outcome 1
- [ ] Specific outcome 2
- [ ] All tests pass

### Notes
Additional context or considerations.

---

## Task 2: [Next Task Title]
[Same format as Task 1]
```

## Output

- **Source Lists Format:** Markdown (`.md`)
- **Source Lists Location:** `/project-planning/bugs/`
- **Output Tasks Format:** Markdown (`.md`)  
- **Output Tasks Location:** `/project-planning/bugs/`
- **Filename Pattern:** `[category]-bugs.md` (source) → `[category]-bugs-tasks.md` (output)

## Usage Instructions

1. **Start New List**: Create initial task list with any known issues
2. **Add Tasks**: Continuously add new tasks as they're discovered
3. **Review & Prioritize**: Regularly review and reprioritize tasks
4. **Update Progress**: Mark tasks as in-progress or completed
5. **Archive**: Periodically archive completed tasks to separate document

## Interaction Model

The AI should:
- Ask clarifying questions about task priority and impact
- Provide detailed implementation guidance for each task
- Suggest testing strategies appropriate to the task type
- Help reorganize tasks based on dependencies and priority
- Maintain consistent formatting and categorization
