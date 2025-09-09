feature required: $ARGUMENTS

## Goal

To create a comprehensive Product Requirements Document (PRD) and associated task list for a new feature, then automatically add it to the project backlog.

## Process

1. **Feature Name Determination**

   - Analyze the feature description in $ARGUMENTS
   - Suggest a concise feature name and ask: "Is '[suggested-name]' a good name for this feature? If not, please suggest a better name"

2. **PRD Generation**

   - Ask clarifying questions:
     - "What problem does this feature solve for the user?"
     - "Who is the primary user of this feature?"
     - "What are the key actions users should be able to perform?"
     - "What are the success criteria?"
     - "Are there any specific constraints or non-goals?"
   - Generate comprehensive PRD following the existing PRD structure
   - Save as `/workflow/prds/[feature-name]-prd.md`
   - Ensure PRD includes:
     - Clear backlog summary section for easy extraction
     - Specific user impact metrics
     - Explicit blocking status

3. **Task List Generation**

   - Automatically read the generated PRD
   - Create high-level parent tasks (3-7 tasks)
   - Present parent tasks and ask: "Ready to generate sub-tasks? Respond with 'Yes' to proceed"
   - Generate detailed sub-tasks for each parent task
   - Save as `/workflow/prds/[feature-name]-prd-tasks.md`

4. **Backlog Integration**

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

5. **Confirmation**
   - Inform user: "✅ Feature PRD, tasks, and backlog entry created successfully"
   - Show paths to all created files

## Success Criteria

- PRD is comprehensive and follows existing structure
- Tasks are detailed and actionable
- Backlog entry is properly categorized by priority
- All files are correctly linked
