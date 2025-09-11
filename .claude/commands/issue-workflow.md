issue fix required: $ARGUMENTS

**Trigger Format:**
- Must start with exact phrase: "issue fix required:"
- Everything after colon is $ARGUMENTS
- Strip leading/trailing whitespace from $ARGUMENTS

## Goal

To create a comprehensive Issue Specification and associated task list for a bug fix or issue, then automatically add it to the project backlog.

## Process

1. **Read Technical Plan**
   - Extract issue name from $ARGUMENTS (already determined by technical planning)
   - Read technical plan at `/workflow/technical-plans/[issue-name]-technical-plan.md`
   - If no technical plan exists: ERROR - "Technical planning required first. Run: plan technical approach for: issue: [description]"

2. **Quick Note Tracking** (if applicable)
   
   - If this feature/issue originated from a quick note in backlog:
     - Add entry to `/workflow/complete.md` under "## Quick Notes Promoted":
       ```markdown
       - **[Current Date]:** Quick note "[original quick note text]" became [feature/issue] "[confirmed-name]"
       ```
   - Remove the quick note from `/workflow/backlog.md`
   - Update backlog statistics after removal

3. **Issue Specification Generation**
   
   - If `/workflow/issues/` doesn't exist: Create with `mkdir -p /workflow/issues/`
   - Check if `/workflow/issues/[issue-name]-issue.md` exists
     - If exists: Ask "Issue spec file '/workflow/issues/[issue-name]-issue.md' already exists. Overwrite/Rename/Cancel? (o/r/c)"
     - If rename:
      - Check if "-v2" exists, then "-v3", etc.
      - Use next available version number
      - Inform user: "Saving as [issue-name]-issue-v[N].md"
   - If user cancels: Clean up any partial files created
   - Ask clarifying questions:
    - "What exactly is happening? Describe the unexpected behavior."
    - "What did you expect to happen instead?"
    - "Can you provide exact steps to reproduce this issue?"
    - "How often does this occur? (Always/Sometimes/Rarely)"
    - "Are there any error messages? If yes, paste them."
    - "What browser/device were you using?"
    - "Does this block users completely or is there a workaround?"
    - "How many users are affected?"
    - "When did this issue first appear?"
   - Generate Issue Specification using this structure mapping from technical plan at `/workflow/technical-plans/[issue-name]-technical-plan.md`:
    - Executive Summary → Resolution Approach intro
    - Root cause analysis (from discovery) → Investigation Notes & Root Cause
    - Files to Modify → Related Code/Suspected files
    - Test Coverage Strategy → Testing Requirements
    - Risk Assessment → Impact Assessment (technical)
    - Breaking Changes → Business Impact warnings
    - Implementation Details → Proposed Solution details
    - Implementation Sequence → Fix complexity/effort estimate
   - Fill from clarifying questions:
    - User's problem description → Problem Description
    - Reproduction details → Reproduction Steps
    - Error messages → Error Information
    - Frequency/environment → Environment & Frequency
    - User impact → User Impact section
   - **Reference to technical plan**: "Technical Plan: `/workflow/technical-plans/[issue-name]-technical-plan.md`"
   - Save as `/workflow/issues/[issue-name]-issue.md`

4. **Task List Generation**
   - Automatically read the generated issue specification  
   - Load task template from `/workflow/reference/issue/issue-tasks-template.md`
   - Create high-level parent tasks based on template structure
   - Present parent tasks and ask: "Ready to generate sub-tasks? Respond with 'Yes' to proceed"
   - Generate detailed sub-tasks for each parent task
   - Save as `/workflow/issues/[issue-name]-issue-tasks.md`

5. **Backlog Integration**

   - Ask priority questions:
     - "Does this block user workflows?"
     - "How many users are affected?"
     - "Is there a workaround available?"
   - Extract issue summary from specification (2-3 lines max)
   - Add to `/workflow/backlog.md` in appropriate priority section:
     ```markdown
     - [ ] [Issue: issue-name] - [Brief problem description]
       - **Type:** Bug Fix
       - **Severity:** [Critical/High/Medium/Low]
       - **Spec:** `/workflow/issues/[issue-name]-issue.md`
       - **Tasks:** `/workflow/issues/[issue-name]-issue-tasks.md`
       - **Added:** [Date]
     ```

6. **Update Backlog Statistics**

   - After adding entry to backlog, automatically update statistics:
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

7. **Confirmation**
   - Inform user: "Issue specification, tasks, and backlog entry created successfully"
   - Show paths to all created files:
     - Issue Spec: `/workflow/issues/[issue-name]-issue.md`
     - Tasks: `/workflow/issues/[issue-name]-issue-tasks.md`
     - Backlog: `/workflow/backlog.md`
   
   **To fix this issue, copy and run this command:**
   ```markdown
   implement issue tasks from: [issue-name]-issue-tasks.md
   ```
## Success Criteria

- Issue specification is detailed with clear reproduction steps
- Tasks include investigation, fix, and validation phases
- Backlog entry is properly prioritized
- All files are correctly linked
