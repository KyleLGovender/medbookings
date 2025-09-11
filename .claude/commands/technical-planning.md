plan technical approach for: $ARGUMENTS

**Trigger Format:**
- Must start with exact phrase: "plan technical approach for:"
- Everything after colon is $ARGUMENTS
- $ARGUMENTS must start with either "feature:" or "issue:"
- Strip leading/trailing whitespace from $ARGUMENTS
- Example: "plan technical approach for: feature: user-authentication"

## Goal

To perform DEEP technical analysis with maximum cognitive effort ("Think hardest" mode) and create a detailed implementation plan BEFORE creating PRD/Issue documents.

## Process

1. **Initial Classification**

   - Parse $ARGUMENTS to determine type:
     - If starts with "feature:", this is a FEATURE
     - If starts with "issue:", this is an ISSUE
   - Extract the name after the keyword:
     - Feature: Extract text after "feature:" as [feature-name]
     - Issue: Extract text after "issue:" as [issue-name]

2. **Deep Thinking Technical Discovery Phase**

   **DIRECTIVE: Think hardest about the following:**

   For FEATURES (detected "feature:"):

   - **Internal prompt**: "Make a detailed plan to accomplish: [feature-name]. Think hardest. How will we implement only the functionality we need right now? Identify files that need to be changed. Do not include plans for legacy fallback unless required or explicitly requested."
   - Analyze with maximum depth:
   - Minimal viable solution
   - Existing code that can be reused
   - Absolute minimum files to touch

   For ISSUES (detected "issue:"):

   - **Internal prompt**: "Make a detailed plan to fix: [issue-name]. Think hardest. How will we implement only the functionality we need right now to fix this? Identify files that need to be changed. Do not include plans for legacy fallback unless required or explicitly requested."
   - Deep trace analysis:
   - Root cause identification
   - Minimal fix approach
   - Side effect analysis

3. **Name Determination Based on Technical Scope**
   - Based on technical analysis, determine appropriate name
   - Consider: scope, files affected, actual functionality
   - Suggest name to user: "Based on technical analysis, suggested name: '[name]'. Accept? (yes/no/suggest alternative)"
   - Use confirmed name for all file creation
   - **Name Sanitization:**
     - Replace spaces with hyphens
     - Remove special characters except hyphens
     - Convert to lowercase
     - Truncate to 50 characters max
     - Example: "User's Profile Page (v2)!" becomes "users-profile-page-v2"


4. **Generate Technical Plan with Deep Thinking**

   **Before generating, execute this thinking directive:**
   Write a short overview of what you are about to do and what you need to do.
   Write function names and 1-3 sentences about what they do.
   Write test names and 5-10 words about behaviour to cover.
   Think hardest about elegant, minimal solutions.

   **Ensure directory exists:**
   - Check if `/workflow/technical-plans/` directory exists
   - If not, create it with: `mkdir -p /workflow/technical-plans/`

   **File Handling Rules:**
   - If file exists: Ask user "File exists. Overwrite? (yes/no/rename)"
    - If rename:
     - Check if "-v2" exists, then "-v3", etc.
     - Use next available version number
     - Inform user: "Saving as [name]-technical-plan-v[N].md"
   - Always backup existing files before overwriting

   ```markdown
   # Technical Plan: [Name]

   ## Type: [Feature/Issue]

   ## Executive Summary

   [2-3 sentences describing the minimal solution approach]

   ## Scope Definition

   ### What We're Building

   - [Essential functionality only]
   - [No legacy fallback unless explicitly requested]

   ### What We're NOT Building

   - [Future features]
   - [Backwards compatibility unless required]
   - [Nice-to-haves]

   ## Technical Architecture

   ### Files to Modify

   /src/[path/file.ts] - [Specific changes needed]
   /src/[path/file.tsx] - [Specific changes needed]

   ### Files to Create

   /src/[path/new-file.ts] - [Purpose and contents]

   ### Database Changes

   - [Schema modifications if any]
   - [Migration requirements]

   ## Implementation Details

   ### Core Functions

   ```typescript
   // Function: functionName
   // Purpose: [1-3 sentences about what it does]
   // Location: /src/[path]
   functionName(params: Types): ReturnType

   // Function: anotherFunction
   // Purpose: [1-3 sentences about what it does]
   // Location: /src/[path]
   anotherFunction(params: Types): ReturnType
   ```

   ### API Endpoints (if applicable)

   ```typescript
   // tRPC Procedure: procedureName
   // Purpose: [What it does]
   // Input: [Schema description]
   // Output: [Return type]
   ```

   ### Component Structure (if applicable)

   ```typescript
   // Component: ComponentName
   // Purpose: [What it renders/handles]
   // Props: [Key props needed]
   ```

   ## Test Coverage Strategy

   ### Unit Tests

   - should [behavior] - [5-10 words about test]
   - handles [edge case] - [5-10 words about test]
   - throws error when [condition] - [5-10 words about test]

   ### Integration Tests

   - API: [endpoint] returns [data] - [What to verify]
   - Database: [operation] persists correctly - [What to check]

   ### E2E Tests

   - User can [action] - [User flow to test]

   ## Implementation Sequence

   1. Phase 1: Foundation

   - [First thing to implement]
   - [Test to write]

   2. Phase 2: Core Logic

   - [Implementation step]
   - [Test to write]

   3. Phase 3: Integration

   - [Final connections]
   - [Integration tests]

   Risk Assessment

   - Technical Risk: [Any identified risks]
   - Performance Impact: [Expected impact]
   - Breaking Changes: [Any breaking changes]

   Code Quality Requirements
   [ ] No legacy fallback code
   [ ] Minimal implementation only
   [ ] Each code block must pass linting
   [ ] Each code block must compile
   [ ] Tests written before next code block
   [ ] No backwards compatibility unless requested

   Save as `/workflow/technical-plans/[name]-technical-plan.md`
   ```

5. **Implementation Directive**

   Include in the plan a section called "Implementation Instructions":

   ```markdown
   ## Implementation Instructions

   When implementing this plan, use the following directive:

   For FEATURES:
   "Now think hard and write elegant code that implements and achieves the feature: [name].
   Do not add backwards compatibility unless explicitly requested.
   After every code block you write, lint, compile, and write corresponding tests and run them before writing the next code block."

   For ISSUES:
   "Now think hard and write elegant code that implements and achieves the fix for issue: [name].
   Do not add backwards compatibility unless explicitly requested.
   After every code block you write, lint, compile, and write corresponding tests and run them before writing the next code block."
   ```

6. **Quality Control Checklist**
   Before finalizing the plan, verify:

   [ ] Used "Think hardest" mode for analysis
   [ ] Identified MINIMAL implementation only
   [ ] No legacy fallback included
   [ ] Each function has clear 1-3 sentence purpose
   [ ] Each test has 5-10 word behavior description
   [ ] Implementation sequence is elegant and minimal

7. **Review and Refinement**

   - Present plan to user
   - Ask: "Does this technical approach look correct? Any concerns? (approve/revise)"
   - If revise, ask for specific concerns and update

8. **Automatic Transition to Requirements**
   - Once approved, attempt to execute:
     - For features: `feature required: [confirmed-name]`
     - For issues: `issue fix required: [confirmed-name]`
   - If execution fails:
     - Inform user: "Failed to auto-generate requirements. Manual trigger needed."
     - For features, provide command: "Run: feature required: [confirmed-name]"
     - For issues, provide command: "Run: issue fix required: [confirmed-name]"
   - Success: "Requirements documentation created automatically."

## Success Criteria

  - Technical feasibility validated BEFORE requirements
  - Minimal scope clearly defined
  - No unnecessary legacy code planned
  - Clear implementation sequence
  - Test strategy defined upfront
