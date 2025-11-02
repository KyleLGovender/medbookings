feature-prp required: $ARGUMENTS

**Trigger Format:**

- Must start with exact phrase: "feature-prp required:"
- Everything after colon is $ARGUMENTS
- Strip leading/trailing whitespace from $ARGUMENTS

## Goal

To create a comprehensive Product Requirement Prompt (PRP) and associated task list for a new feature, then automatically add it to the project backlog.

## Configuration

**All paths, naming conventions, and workflow behavior are configured in `/workflow/config.json`.**

Key configuration areas:

- **Paths**: All workflow directories (features, issues, templates, etc.)
- **File Naming**: Customizable naming patterns for PRPs, tasks, and technical plans
- **Priorities**: Configurable priority levels and labels (P1, P2, P3)
- **Inference Patterns**: Keyword patterns for automatic priority/type detection
- **Backlog Sections**: Section markers and structure
- **Git Conventions**: Branch prefixes (feature/, issue/, hotfix/)

To customize the workflow system, edit `/workflow/config.json` and run validation checks.

## Process

1. **Rules, Reference context, Standards**

   - Analyse and comprehend the CLAUDE.md file in project root, and WORKFLOW.md file in the /.claude folder

2. **Read Technical Plan**

   - Extract feature name from $ARGUMENTS (already determined by technical planning)
   - Read technical plan at `/workflow/technical-plans/[feature-name]-technical-plan.md`
   - If no technical plan exists: ERROR - "Technical planning required first. Run: plan technical approach for: feature: [description]"

3. **Quick Note Tracking** (if applicable)

   - If this feature/issue originated from a quick note in backlog:
     - Add entry to `/workflow/complete.md` under "## Quick Notes Promoted":
       ```markdown
       - **[Current Date]:** Quick note "[original quick note text]" became [feature/issue] "[confirmed-name]"
       ```
   - Remove the quick note from `/workflow/backlog.md`
   - Update backlog statistics after removal

4. **PRP Generation**

   - Use the PRP generation script: `node workflow/scripts/workflow-mgmt/generate-prp.js create [feature-name] feature`
   - If `/workflow/prps/features/` doesn't exist: Create with `mkdir -p /workflow/prps/features/`
   - Check if `/workflow/prps/features/[feature-name]-feature-prp.md` exists
     - If exists: Ask "PRP file '/workflow/prps/features/[feature-name]-feature-prp.md' already exists. Overwrite/Rename/Cancel? (o/r/c)"
     - If rename:
     - Check if "-v2" exists, then "-v3", etc.
     - Use next available version number
     - Inform user: "Saving as [feature-name]-feature-prp-v[N].md"
   - If user cancels: Clean up any partial files created
   - Ask clarifying questions:
   - "What problem does this feature solve for the user?"
   - "Who is the primary user of this feature?"
   - "What are the key actions users should be able to perform?"
   - "What are the success criteria?"
   - "Are there any specific constraints or non-goals?"
   - "How many users will this impact approximately?"
   - "What's the expected business value/ROI?"
   - Generate PRP using this structure mapping from the technical plan at `/workflow/technical-plans/[feature-name]-technical-plan.md`:
   - Executive Summary → Problem Statement intro
   - Scope Definition → Technical Constraints & Non-Goals
   - Technical Architecture → Implementation Approach
   - Test Coverage Strategy → Testing Requirements
   - Risk Assessment → Risks and Mitigation
   - Codebase Intelligence Section:
     - Analyze 3 similar features for patterns
     - Extract common import structures
     - Document error handling patterns
     - Include actual code snippets from codebase
   - Runbook Section
     - Pre-flight checks (build, lint, type)
     - Step-by-step implementation with validations
     - Post-implementation verification
   - Implementation Sequence → Timeline estimates
   - Fill from clarifying questions:
   - Problem being solved → Problem Statement section
   - Primary user identification → Target Users (Primary User)
   - Key user actions → User Stories section
   - Success criteria → Goals and Success Criteria section
   - Additional constraints → Constraints (adds to technical constraints)
   - User impact numbers → Impact Assessment (User Impact)
   - Business value/ROI → Impact Assessment (Business Impact)
   - **Reference to technical plan**: "Technical Plan: `/workflow/technical-plans/[feature-name]-technical-plan.md`"
   - Save as `/workflow/prps/features/[feature-name]-feature-prp.md`

5. **Task List Generation**

   - Automatically read the generated PRP
   - Load task template from `/workflow/reference/prp/feature/feature-prp-tasks-template.md`
   - Create high-level parent tasks (3-7 tasks) based on template structure
   - Present parent tasks and ask: "Ready to generate sub-tasks? Respond with 'Yes' to proceed"
   - Generate detailed sub-tasks for each parent task
   - Save as `/workflow/prps/features/[feature-name]-feature-prp-tasks.md`

6. **Backlog Integration**

   - **Automatic Priority/Type Inference**: The system analyzes the technical plan and PRP content to automatically infer:
     - Priority (High/Medium/Low) based on keywords like "critical", "urgent", "blocking", user impact numbers
     - Feature Type (New Feature/Enhancement/Refactor/Performance/Security) based on content analysis
   - The inferred metadata is displayed for review
   - Extract feature summary from PRP (2-3 lines max)
   - Add to `/workflow/backlog.md` in appropriate priority section based on inferred priority:

     ```markdown

     ```

   - [ ] [Feature: feature-name] - [Brief description from PRP overview]

     - **Type:** Feature
     - **Impact:** [User impact summary]
     - **PRP:** `/workflow/prps/features/[feature-name]-feature-prp.md`
     - **PRD:** [Legacy - if exists]
     - **Tasks:** `/workflow/prps/features/[feature-name]-feature-prp-tasks.md`
     - **Added:** [Date]

     ```

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

   - Inform user: "Feature PRP, tasks, and backlog entry created successfully"
   - Show paths to all created files:
     - PRP: `/workflow/prps/features/[feature-name]-feature-prp.md`
     - Tasks: `/workflow/prps/features/[feature-name]-feature-prp-tasks.md`
     - Backlog: `/workflow/backlog.md`

   **To implement this feature, copy and run this command:**

   ```markdown
   implement feature-prp tasks from: [feature-name]-feature-prp-tasks.md
   ```

## Success Criteria

- PRP is comprehensive and follows existing structure
- Tasks are detailed and actionable
- Backlog entry is properly categorized by priority
- All files are correctly linked
