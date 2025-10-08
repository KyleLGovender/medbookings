# Claude Code Custom Commands - Parameter Input Pattern

This document explains the pattern used across all custom commands to ensure proper parameter collection before execution.

## Pattern Overview

All commands now follow this standardized pattern:

```markdown
## Required User Input (MUST ASK FIRST)

**CRITICAL:** Check if the user provided [required info] via $ARGUMENTS or in their message. If not provided or unclear, you MUST ask the user:

1. **[Parameter Name]:** "[Clear question asking for the parameter]"
2. **[Optional Parameter]:** "[Optional parameter question]"

Once you have this basic information from $ARGUMENTS or user input, proceed to [next phase].
```

## Why This Pattern?

### Problems It Solves

1. **Prevents Assumptions**: Commands won't proceed without required information
2. **Clear User Experience**: Users know exactly what information is needed
3. **Flexible Input**: Works whether user provides $ARGUMENTS or not
4. **Graceful Degradation**: Commands ask for missing information instead of failing

### Key Benefits

- **Explicit Requirements**: Commands state upfront what they need
- **Interactive Flow**: Natural conversation when information is missing
- **Robust Handling**: Works with or without $ARGUMENTS
- **Consistent UX**: All commands follow same pattern

## Implementation Guide

When creating a new command, add this section at the top (after the opening statement):

```markdown
## Required User Input (MUST ASK FIRST)

**CRITICAL:** Check if the user provided [X] via $ARGUMENTS or in their message. If not provided or unclear, you MUST ask the user:

1. **[Parameter Name]:** "[Clear question]"
   - [Optional: Additional context or examples]

Once you have this information from $ARGUMENTS or user input, proceed to [next step].
```

### Example: Simple Command

```markdown
## Required User Input (MUST ASK FIRST)

**CRITICAL:** Check if the user provided a file path via $ARGUMENTS. If not provided, you MUST ask:

1. **File Path:** "What is the path to the file you want to process?"

Once you have this path, proceed to reading the file.
```

### Example: Complex Command with Multiple Parameters

```markdown
## Required User Input (MUST ASK FIRST)

**CRITICAL:** Before proceeding, verify you have these required parameters:

1. **Feature Description:** "What feature would you like to document?"
2. **Target Users:** "Who will use this feature?"
3. **Priority (Optional):** "What is the priority level? (high/medium/low, default: medium)"

Ask for any missing information before proceeding to the next phase.
```

## Command-Specific Implementations

### 1. prd-specification.md

**Asks for:**
- Feature description (what to document)
- Initial context (problem/opportunity)

**Then proceeds to:** Detailed clarifying questions

### 2. issue-specification.md

**Asks for:**
- Issue description (the bug/problem)
- When it occurs (context)

**Then proceeds to:** Structured investigation questions

### 3. issue-add-to-backlog.md

**Asks for:**
- Issue description (what to add)

**Then proceeds to:** Priority and categorization questions

### 4. tasks-list.md

**Asks for:**
- Specification file path (source document)

**Then proceeds to:** Task generation process

### 5. tasks-process.md

**Asks for:**
- Task list file path (what to implement)
- Execution mode (optional: interactive vs YOLO)

**Then proceeds to:** Task implementation workflow

## Best Practices

### ✅ Do This

1. **Be Specific**: Ask clear, unambiguous questions
2. **Provide Context**: Explain why the parameter is needed
3. **Give Examples**: Show valid input formats when helpful
4. **Check $ARGUMENTS First**: Always check if user provided info already
5. **Use Consistent Language**: "MUST ask", "CRITICAL", "Required"

### ❌ Avoid This

1. **Don't Assume**: Never guess or use placeholder values
2. **Don't Skip Validation**: Always check if required info exists
3. **Don't Proceed Without Input**: Stop and ask for missing information
4. **Don't Use Generic Questions**: Be specific about what you need

## Testing Your Command

When testing a command, try these scenarios:

1. **With $ARGUMENTS**: `/command arg1 arg2`
   - Should extract parameters and proceed

2. **Without $ARGUMENTS**: `/command`
   - Should ask for required parameters

3. **Partial $ARGUMENTS**: `/command arg1`
   - Should ask for missing parameters only

4. **Invalid $ARGUMENTS**: `/command invalid-format`
   - Should detect and ask for clarification

## Template for New Commands

```markdown
[Command opening statement explaining what it does]

## Required User Input (MUST ASK FIRST)

**CRITICAL:** Check if the user provided [required info] via $ARGUMENTS or in their message. If not provided or unclear, you MUST ask the user:

1. **[Parameter 1 Name]:** "[Clear question asking for parameter 1]"
   - [Optional: Format, examples, or additional context]

2. **[Parameter 2 Name (Optional)]:** "[Clear question for optional parameter]"
   - [Optional: Default value if not provided]

Once you have this information from $ARGUMENTS or user input, proceed to [next phase].

## Goal

[Rest of your command instructions...]

## Process

1. [First step using the collected parameters]
2. [Second step...]
...
```

## Migration Checklist

When updating existing commands:

- [ ] Add "Required User Input" section at the top
- [ ] List all required parameters with clear questions
- [ ] Check for $ARGUMENTS or user message first
- [ ] Add validation logic
- [ ] Update references to parameters throughout document
- [ ] Test with and without $ARGUMENTS
- [ ] Document any default values
- [ ] Update examples to show new pattern

## Summary

This pattern ensures:
- **Reliability**: Commands never execute with missing information
- **User-Friendly**: Clear communication about what's needed
- **Flexibility**: Works with various input methods
- **Consistency**: Uniform experience across all commands

By following this pattern, your custom commands will be robust, user-friendly, and maintainable.
