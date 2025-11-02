issue-prp required: $ARGUMENTS

**Trigger Format:**

- Must start with exact phrase: "issue-prp required:"
- Everything after colon is $ARGUMENTS
- Strip leading/trailing whitespace from $ARGUMENTS

## Goal

To create a comprehensive Issue PRP (Product Requirement Prompt) and associated task list for a bug fix or issue, then automatically add it to the project backlog.

## Configuration

**All paths, naming conventions, and workflow behavior are configured in `/workflow/config.json`.**

Key configuration areas:

- **Paths**: All workflow directories (features, issues, templates, etc.)
- **File Naming**: Customizable naming patterns for PRPs, tasks, and technical plans
- **Severities**: Configurable severity levels and labels (S1, S2, S3, S4)
- **Inference Patterns**: Keyword patterns for automatic severity/type detection
- **Backlog Sections**: Section markers and structure
- **Git Conventions**: Branch prefixes (feature/, issue/, hotfix/)

To customize the workflow system, edit `/workflow/config.json` and run validation checks.

## Process

1. **Rules, Reference context, Standards**

   - Analyse and comprehend the CLAUDE.md file in project root, and WORKFLOW.md file in the /.claude folder

2. **Read Technical Plan**

   - Extract issue name from $ARGUMENTS (already determined by technical planning)
   - Read technical plan at `/workflow/technical-plans/[issue-name]-technical-plan.md`
   - If no technical plan exists: ERROR - "Technical planning required first. Run: plan technical approach for: issue: [description]"

3. **Quick Note Tracking** (if applicable)

   - If this feature/issue originated from a quick note in backlog:
     - Add entry to `/workflow/complete.md` under "## Quick Notes Promoted":
       ```markdown
       - **[Current Date]:** Quick note "[original quick note text]" became [feature/issue] "[confirmed-name]"
       ```
   - Remove the quick note from `/workflow/backlog.md`
   - Update backlog statistics after removal

4. **Issue PRP Generation**

   - If `/workflow/prps/issues/` doesn't exist: Create with `mkdir -p /workflow/prps/issues/`
   - Check if `/workflow/prps/issues/[issue-name]-issue-prp.md` exists
     - If exists: Ask "Issue PRP file '/workflow/prps/issues/[issue-name]-issue-prp.md' already exists. Overwrite/Rename/Cancel? (o/r/c)"
     - If rename:
     - Check if "-v2" exists, then "-v3", etc.
     - Use next available version number
     - Inform user: "Saving as [issue-name]-issue-prp-v[N].md"
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
   - Save as `/workflow/prps/issues/[issue-name]-issue-prp.md`

5. **Task List Generation**

   - Automatically read the generated issue PRP
   - Load task template from `/workflow/reference/prp/issue/issue-prp-tasks-template.md`
   - Create high-level parent tasks based on template structure
   - Present parent tasks and ask: "Ready to generate sub-tasks? Respond with 'Yes' to proceed"
   - Generate detailed sub-tasks for each parent task
   - Save as `/workflow/prps/issues/[issue-name]-issue-prp-tasks.md`

6. **Backlog Integration**

   - **Automatic Severity/Type Inference**: The system analyzes the technical plan and Issue PRP content to automatically infer:
     - Severity (Critical/High/Medium/Low) based on keywords like "blocker", "data loss", "security", user impact
     - Issue Type (Security Issue/Performance Issue/Data Issue/UI/UX Issue/Integration Issue/Bug Fix) based on content analysis
   - The inferred metadata is displayed for review
   - Extract issue summary from specification (2-3 lines max)
   - Add to `/workflow/backlog.md` in appropriate priority section based on inferred severity:
     ```markdown
     - [ ] [Issue: issue-name] - [Brief problem description]
       - **Type:** Bug Fix
       - **Severity:** [Critical/High/Medium/Low]
       - **Issue PRP:** `/workflow/prps/issues/[issue-name]-issue-prp.md`
       - **Tasks:** `/workflow/prps/issues/[issue-name]-issue-prp-tasks.md`
       - **Added:** [Date]
     ```

7. **Update Backlog Statistics**

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

8. **Confirmation**

   - Inform user: "Issue PRP, tasks, and backlog entry created successfully"
   - Show paths to all created files:
     - Issue PRP: `/workflow/prps/issues/[issue-name]-issue-prp.md`
     - Tasks: `/workflow/prps/issues/[issue-name]-issue-prp-tasks.md`
     - Backlog: `/workflow/backlog.md`

   **To fix this issue, copy and run this command:**

   ```markdown
   implement issue-prp tasks from: [issue-name]-issue-prp-tasks.md
   ```

## Success Criteria

- Issue specification is detailed with clear reproduction steps
- Tasks include investigation, fix, and validation phases
- Backlog entry is properly prioritized
- All files are correctly linked
