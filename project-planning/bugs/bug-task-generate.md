---
trigger: manual
---

# Rule: Generating Bug Fix & Improvement Tasks

## Goal

To guide an AI assistant in converting categorized bug/improvement source lists into executable task files that Claude Code can work through systematically.

## Input & Output

### Input (Source Lists)
- **Format:** Markdown (`.md`)
- **Location:** `/project-planning/bugs/`
- **Files:** `provider-availability-bugs.md`, `backend-bugs.md`, `performance-issues.md`, etc.

### Output (Executable Tasks)
- **Format:** Markdown (`.md`)
- **Location:** `/project-planning/bugs/`
- **Files:** `provider-availability-bugs-tasks.md`, `backend-bugs-tasks.md`, `performance-tasks.md`, etc.
- **Task Format:** Hierarchical structure with parent tasks (1.0, 2.0, etc.) and sub-tasks (1.1, 1.2, etc.)

## Process

### Adding Tasks to Source Lists
1. **Receive Task Input:** User provides bug/improvement details
2. **Determine Category:** Choose appropriate source list (frontend, backend, performance, etc.)
3. **Add to Source List:** Update the relevant `/project-planning/bugs/[category]-bugs.md` file
4. **Organize by Priority:** Place in appropriate priority section

### Generating Executable Tasks
1. **Receive Generation Request:** User requests tasks for specific category (e.g., "Generate tasks for frontend-bugs.md")
2. **Read Source List:** Analyze the source list and prioritize tasks
3. **Convert to Executable Format:** Transform each bug/improvement into detailed task with:
   - Clear problem description
   - Step-by-step implementation
   - Testing requirements
   - Acceptance criteria
4. **Save Output File:** Create `/project-planning/bugs/[category]-bugs-tasks.md`
5. **Present to User:** Show generated tasks for review before finalizing

## Task Entry Requirements

Each task entry must include:

### Essential Information
- **Task Type**: Bug Fix, Performance, Technical Debt, Security, UX/UI, Testing, Documentation
- **Priority Level**: Critical (🔴), High (🟡), Medium (🔵), Low (🟢)
- **File Reference**: `path/to/file.ts:line_number` when applicable
- **Clear Title**: Descriptive title that explains the issue

### Detailed Context
- **Issue**: Clear description of the problem or improvement needed
- **Impact**: How this affects users, performance, or development
- **Implementation**: Step-by-step approach with specific actions
- **Testing**: How to verify the fix or improvement works
- **Estimated Time**: Realistic time estimate (hours/days)

### Optional Context
- **Root Cause**: Why the issue exists (for bugs)
- **Dependencies**: Other tasks or external factors
- **Code Examples**: Relevant code snippets or patterns
- **References**: Links to documentation or related issues

## Priority Guidelines

### 🔴 Critical Issues (Fix Immediately)
- System-breaking bugs
- Security vulnerabilities
- Data corruption issues
- Complete feature failures

### 🟡 High Priority (Next Sprint)
- User-facing bugs
- Performance degradation
- Blocking development issues
- Important UX problems

### 🔵 Medium Priority (Upcoming)
- Technical debt
- Code quality improvements
- Minor performance optimizations
- Documentation gaps

### 🟢 Low Priority (Backlog)
- Nice-to-have improvements
- Minor UX enhancements
- Code style consistency
- Optional refactoring

## Implementation Guidelines

### For Bug Fixes
- Include steps to reproduce the issue
- Identify root cause when possible
- Provide specific code changes needed
- Include regression testing strategy

### For Performance Issues
- Include current performance metrics
- Identify bottlenecks or inefficiencies
- Suggest optimization approaches
- Define success metrics

### For Technical Debt
- Explain why current approach is problematic
- Propose better architectural solution
- Break down refactoring into manageable steps
- Consider impact on existing functionality

### For Security Issues
- Describe vulnerability without exposing details
- Provide secure implementation approach
- Include security testing requirements
- Consider compliance requirements

## Interaction Model

### Adding Tasks to Source Lists
1. User describes issue: "Add bug: Calendar timezone issue in frontend"
2. AI asks clarifying questions if needed
3. AI determines category and adds to appropriate source list
4. AI updates `/project-planning/bugs/frontend-bugs.md`

### Generating Executable Tasks
1. User requests: "Generate tasks for frontend-bugs.md"
2. AI reads source list and converts to executable format
3. AI creates detailed task file with implementation steps
4. AI saves to `/project-planning/bugs/frontend-bugs-tasks.md`
5. AI presents for user review

### Working Through Tasks
1. User gives Claude Code the generated task file
2. Claude Code works through tasks systematically
3. Claude Code updates completion status in the file
4. User can track progress through the updated file

## Quality Checks

Before finalizing any task entry, ensure:
- [ ] Priority level is appropriate for impact
- [ ] Implementation steps are actionable
- [ ] Testing strategy is defined
- [ ] Time estimate is realistic
- [ ] File references are accurate
- [ ] Task description is clear and complete

## File Management

### Creating New Task List
- Use template structure from bug-task-generate-spec.md
- Include current date in header
- Start with known high-priority issues

### Updating Existing Task List
- Preserve existing task organization
- Add new tasks in appropriate priority sections
- Update completion status as needed
- Archive completed tasks periodically

### Task Tracking
- Move completed tasks to "Completed" section
- Include completion date and notes
- Archive old completed tasks monthly
- Maintain running count of open tasks

## Task Format Requirements

### Hierarchical Structure
All tasks must follow the hierarchical parent/sub-task format:

```markdown
## Relevant Files

- `path/to/file.ts` - Brief description of file's purpose
- `path/to/file.test.ts` - Unit tests for the file

## Tasks

- [ ] 1.0 **PRIORITY**: Parent Task Title
  - [ ] 1.1 Sub-task description with specific action
  - [ ] 1.2 Sub-task description with specific action
  - [ ] 1.3 Sub-task description with specific action
- [ ] 2.0 **PRIORITY**: Parent Task Title
  - [ ] 2.1 Sub-task description with specific action
  - [ ] 2.2 Sub-task description with specific action
```

### Task Requirements
- **Parent Tasks**: High-level objectives with priority indicators (🔴 Critical, 🟡 High, 🔵 Medium, 🟢 Low)
- **Sub-tasks**: Specific, actionable steps that complete the parent task
- **File References**: Include `path/to/file.ts:line_number` when applicable
- **Testing**: Include testing sub-tasks for each implementation
- **Numbering**: Use decimal numbering (1.0, 1.1, 1.2, 2.0, 2.1, etc.)

## Example Task Entry

```markdown
- [ ] 1.0 🔴 **CRITICAL**: Fix Calendar Timezone Display
  - [ ] 1.1 Identify timezone handling issue in `src/components/Calendar.tsx:145`
  - [ ] 1.2 Update date formatting utility to use user's timezone
  - [ ] 1.3 Modify Calendar component to pass timezone context
  - [ ] 1.4 Add timezone configuration to user preferences
  - [ ] 1.5 Test with different timezone settings manually
  - [ ] 1.6 Write unit tests for date formatting utility
  - [ ] 1.7 Write integration tests for Calendar component
  - [ ] 1.8 Verify no regressions in existing calendar functionality
```

## Target Audience

Assume the primary reader is a **junior to mid-level developer** who needs clear guidance on both the problem and solution approach.

## Final Instructions

1. Always ask clarifying questions if task details are unclear
2. Provide concrete implementation steps, not just high-level descriptions
3. Consider dependencies between tasks when organizing
4. Include testing requirements for every task
5. Maintain consistent formatting and categorization
6. Update task priorities based on business impact and technical complexity
