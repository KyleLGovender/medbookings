
Please generate a detailed task list from the specification file: $ARGUMENTS

Follow these steps:

1. **Read Specification File:** Use the Read tool to read the contents of the specification file from the path provided in $ARGUMENTS
2. **Determine Document Type:** Identify if this is a PRD (Product Requirements Document), Issue Specification, or other type of specification
3. **Analyze Content:** 
   - For PRDs: Analyze functional requirements, user stories, and implementation needs
   - For Issues: Analyze problem description, reproduction steps, and resolution requirements
   - For other specs: Analyze the core requirements and objectives
4. **Phase 1: Generate Parent Tasks:** Based on the analysis, create the file and generate the main, high-level tasks required. For features, focus on implementation tasks. For issues, focus on investigation, fixing, and validation tasks. Use your judgement on how many high-level tasks to use (typically 3-7). Present these tasks to the user in the specified format (without sub-tasks yet). Inform the user: "I have generated the high-level tasks based on the specification. Ready to generate the sub-tasks? Respond with 'Go' to proceed."
5. **Wait for Confirmation:** Pause and wait for the user to respond with "Go".
6. **Phase 2: Generate Sub-Tasks:** Once the user confirms, break down each parent task into smaller, actionable sub-tasks necessary to complete the parent task. Ensure sub-tasks logically follow from the parent task and cover the work implied by the specification.
7. **Identify Relevant Files:** Based on the tasks and specification, identify potential files that will need to be created or modified. List these under the `Relevant Files` section, including corresponding test files if applicable.
8. **Generate Final Output:** Combine the parent tasks, sub-tasks, relevant files, and notes into the final Markdown structure.
9. **Save Task List:** Save the generated document in the appropriate directory based on the specification type:
   - For PRDs: `/workflow/prds/[spec-file-name]-tasks.md`
   - For Issues: `/workflow/issues/[spec-file-name]-tasks.md`
   - For other specs: `/workflow/[spec-file-name]-tasks.md`

## Output Format

- **Format:** Markdown (`.md`)
- **Location:** Determined by specification type:
  - PRDs: `/workflow/prds/`
  - Issues: `/workflow/issues/`
  - Other: `/workflow/`
- **Filename:** `[spec-file-name]-tasks.md` (e.g., `user-profile-editing-prd-tasks.md` or `login-bug-issue-tasks.md`)

The generated task list _must_ follow this structure:

```markdown
## Relevant Files

- `path/to/potential/file1.ts` - Brief description of why this file is relevant (e.g., Contains the main component for this feature).
- `path/to/another/file.tsx` - Brief description (e.g., API route handler for data submission).
- `lib/utils/helpers.ts` - Brief description (e.g., Utility functions needed for calculations).

### Notes

- End-to-end testing is handled via Playwright (`npx playwright test`)
- No unit testing framework is configured in this codebase

## Tasks

- [ ] 1.0 Parent Task Title
  - [ ] 1.1 [Sub-task description 1.1]
  - [ ] 1.2 [Sub-task description 1.2]
- [ ] 2.0 Parent Task Title
  - [ ] 2.1 [Sub-task description 2.1]
- [ ] 3.0 Parent Task Title (may not require sub-tasks if purely structural or configuration)
```

## Interaction Model

The process explicitly requires a pause after generating parent tasks to get user confirmation ("Go") before proceeding to generate the detailed sub-tasks. This ensures the high-level plan aligns with user expectations before diving into details.

Once all tasks are generated prompt the user by saying "All tasks have been generated. Please review and if you are happy say 'Tasks complete' to confirm this process is done"

## Target Audience

Assume the primary reader of the task list is a **developer** who will work on the implementation or resolution. For PRDs, focus on feature implementation. For issues, focus on problem investigation and resolution.
