issue fix required: $ARGUMENTS

## Goal

To create a comprehensive Issue Specification and associated task list for a bug fix or issue, then automatically add it to the project backlog.

## Process

1. **Issue Name Determination**

   - Analyze the issue description in $ARGUMENTS
   - Suggest a concise issue name and ask: "Is '[suggested-name]' a good name for this issue? If not, please suggest a better name"

2. **Issue Specification Generation**

   - Ask clarifying questions:
     - "What exactly is happening? What is the unexpected behavior?"
     - "What did you expect to happen instead?"
     - "Can you provide steps to reproduce this issue?"
     - "How severe is this issue? Does it block users completely?"
     - "Are there any error messages?"
     - "Are there any workarounds?"
   - Generate comprehensive issue specification following existing structure
   - Save as `/workflow/issues/[issue-name]-issue.md`
   - Ensure issue spec includes:
     - Environment details (browser, device, user role)
     - Console/network error logs if available
     - Clear severity justification

3. **Task List Generation**

   - Automatically read the generated issue specification
   - Create high-level parent tasks for investigation, fixing, and validation
   - Present parent tasks and ask: "Ready to generate sub-tasks? Respond with 'Yes' to proceed"
   - Generate detailed sub-tasks for each parent task
   - Save as `/workflow/issues/[issue-name]-issue-tasks.md`

4. **Backlog Integration**

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

5. **Confirmation**
   - Inform user: "✅ Issue specification, tasks, and backlog entry created successfully"
   - Show paths to all created files

## Success Criteria

- Issue specification is detailed with clear reproduction steps
- Tasks include investigation, fix, and validation phases
- Backlog entry is properly prioritized
- All files are correctly linked
