feature required: $ARGUMENTS

**Trigger Format:**
- Must start with exact phrase: "feature required:"
- Everything after colon is $ARGUMENTS
- Strip leading/trailing whitespace from $ARGUMENTS

## Goal

To create a comprehensive Product Requirements Document (PRD) and associated task list for a new feature, then automatically add it to the project backlog.

## Process

1. **Read Technical Plan**
   - Extract feature name from $ARGUMENTS (already determined by technical planning)
   - Read technical plan at `/workflow/technical-plans/[feature-name]-technical-plan.md`
   - If no technical plan exists: ERROR - "Technical planning required first. Run: plan technical approach for: feature: [description]"

2. **Quick Note Tracking** (if applicable)
   
   - If this feature/issue originated from a quick note in backlog:
     - Add entry to `/workflow/complete.md` under "## Quick Notes Promoted":
       ```markdown
       - **[Current Date]:** Quick note "[original quick note text]" became [feature/issue] "[confirmed-name]"
       ```
   - Remove the quick note from `/workflow/backlog.md`
   - Update backlog statistics after removal

3. **PRD Generation**
   
   - If `/workflow/prds/` doesn't exist: Create with `mkdir -p /workflow/prds/`
   - Check if `/workflow/prds/[feature-name]-prd.md` exists
     - If exists: Ask "PRD file '/workflow/prds/[feature-name]-prd.md' already exists. Overwrite/Rename/Cancel? (o/r/c)"
     - If rename:
      - Check if "-v2" exists, then "-v3", etc.
      - Use next available version number
      - Inform user: "Saving as [feature-name]-prd-v[N].md"
   - If user cancels: Clean up any partial files created
   - Ask clarifying questions:
    - "What problem does this feature solve for the user?"
    - "Who is the primary user of this feature?"
    - "What are the key actions users should be able to perform?"
    - "What are the success criteria?"
    - "Are there any specific constraints or non-goals?"
    - "How many users will this impact approximately?"
    - "What's the expected business value/ROI?"
   - Generate PRD using this structure mapping from the technical plan at `/workflow/technical-plans/[feature-name]-technical-plan.md`:
    - Executive Summary → Problem Statement intro
    - Scope Definition → Technical Constraints & Non-Goals
    - Technical Architecture → Implementation Approach
    - Test Coverage Strategy → Testing Requirements
    - Risk Assessment → Risks and Mitigation
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
   - Save as `/workflow/prds/[feature-name]-prd.md`

4. **Task List Generation**
   - Automatically read the generated PRD
   - Load task template from `/workflow/reference/prd/prd-tasks-template.md`
   - Create high-level parent tasks (3-7 tasks) based on template structure
   - Present parent tasks and ask: "Ready to generate sub-tasks? Respond with 'Yes' to proceed"
   - Generate detailed sub-tasks for each parent task
   - Save as `/workflow/prds/[feature-name]-prd-tasks.md`

5. **Backlog Integration**

   - Ask priority questions:
     - "How urgent is this feature? (High/Medium/Low)"
     - "How many users will this impact?"
     - "Is this blocking other work?"
   - Extract feature summary from PRD (2-3 lines max)
   - Add to `/workflow/backlog.md` in appropriate priority section:
     ```markdown
     - [ ] [Feature: feature-name] - [Brief description from PRD overview]
       - **Type:** Feature
       - **Impact:** [User impact summary]
       - **PRD:** `/workflow/prds/[feature-name]-prd.md`
       - **Tasks:** `/workflow/prds/[feature-name]-prd-tasks.md`
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
   - Inform user: "Feature PRD, tasks, and backlog entry created successfully"
   - Show paths to all created files:
     - PRD: `/workflow/prds/[feature-name]-prd.md`
     - Tasks: `/workflow/prds/[feature-name]-prd-tasks.md`
     - Backlog: `/workflow/backlog.md`
   
   **To implement this feature, copy and run this command:**
   ```markdown
   implement feature tasks from: [feature-name]-prd-tasks.md
   ```
## Success Criteria

- PRD is comprehensive and follows existing structure
- Tasks are detailed and actionable
- Backlog entry is properly categorized by priority
- All files are correctly linked


