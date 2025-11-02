quick feature note: $ARGUMENTS
OR
quick issue note: $ARGUMENTS

**Trigger Format:**

- Must start with either: "quick feature note:" OR "quick issue note:"
- Everything after colon is $ARGUMENTS
- Strip leading/trailing whitespace from $ARGUMENTS

## Goal

To quickly capture feature ideas or issues in the backlog without creating full specifications.

## Process

1. **Rules, Reference context, Standards**

   - Analyse and comprehend the CLAUDE.md file in project root, and WORKFLOW.md file in the /.claude folder

2. **Determine Type**

   - Check if command starts with "quick feature note" or "quick issue note"

3. **Gather Minimal Information**

   - For features, ask only:
     - "Priority? (High/Medium/Low/Idea)"
     - "Brief impact description?"
   - For issues, ask only:
     - "Severity? (Critical/High/Medium/Low)"
     - "Affects how many users?"

4. **Add to Backlog**

   - Read current `/workflow/backlog.md`
   - Add to appropriate section:

   For quick features:

   ```markdown
   ## Quick Feature Notes

   - [ ] [Quick Note] - $ARGUMENTS
     - **Type:** Feature Idea
     - **Priority:** [User Response]
     - **Impact:** [User Response]
     - **Status:** Needs Specification
     - **Added:** [Date]
   ```

   For quick issues:

   ```markdown
   ## Quick Issue Notes

   - [ ] [Quick Note] - $ARGUMENTS
   - **Type:** Issue Report
   - **Severity:** [User Response]
   - **Affects:** [User Response]
   - **Status:** Needs Investigation
   - **Added:** [Date]
   ```

5. **Update Backlog Statistics**

   - After adding quick note, automatically update statistics:
     - Count all `- [ ]` items in all sections
     - Count all `- [x]` items throughout document
     - Calculate totals as per standard counting logic

   **Counting Pattern Instructions:**

   - Use pattern `^\s*- \[ \]` to match uncompleted items
   - Use pattern `^\s*- \[x\]` to match completed items (case-insensitive)
   - Section boundaries: Count stops at next `##` heading or `---` separator
   - Include all indentation levels (sub-items under main checkbox items)
   - Replace all [auto-count] placeholders with actual numbers
   - Update **Last Updated:** with current date (YYYY-MM-DD)

6. **Confirmation**

   - Inform: "Quick note added to backlog. You can expand this into a full [feature/issue] later by saying 'feature required:' or 'issue fix required:' with more details"

## Success Criteria

    - Quick capture without lengthy process
    - Clear distinction from full specifications
    - Easy to identify for later expansion
