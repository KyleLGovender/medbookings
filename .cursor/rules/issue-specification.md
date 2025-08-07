Please help me create a detailed Issue Specification document based on: $ARGUMENTS

## Goal

To guide an AI assistant in creating a detailed Issue Specification document in Markdown format, based on an initial user prompt. The specification should clearly define the problem, its impact, and provide enough detail for a developer to understand and fix the issue.

## Process

1. **Receive Initial Prompt:** The user provides a brief description of a bug, problem, or issue they've encountered.
2. **Ask Clarifying Questions:** Before writing the issue specification, the AI _must_ ask clarifying questions to gather sufficient detail. The goal is to understand the "what", "when", "where", and "why" of the issue.
3. **Generate Issue Specification:** Based on the initial prompt and the user's answers to the clarifying questions, generate an issue specification using the structure outlined below.
4. **Save Issue Specification:** Save the generated document as `[issue-name]-issue.md` inside the `/workflow/issues/` directory.

## Clarifying Questions (Examples)

The AI should adapt its questions based on the prompt, but here are some common areas to explore:

- **Issue Name:** Suggest a name for the issue and ask "Is this a good name for the issue? If it isn't please suggest a better name"
- **Problem Description:** "Can you describe exactly what is happening? What is the unexpected behavior?"
- **Expected vs Actual:** "What did you expect to happen? What actually happened instead?"
- **Affected Users:** "Who is experiencing this issue? (e.g., all users, specific user types, admin users only)"
- **Reproduction Steps:** "Can you provide step-by-step instructions to reproduce this issue?"
- **Environment/Context:** "When does this issue occur? (e.g., specific pages, user actions, time of day, browser type)"
- **Error Messages:** "Are there any error messages or console errors associated with this issue?"
- **Impact/Severity:** "How severe is this issue? Does it block users completely or is it a minor inconvenience?"
- **Frequency:** "How often does this issue occur? Is it consistent or intermittent?"
- **Recent Changes:** "Has anything changed recently that might be related to this issue?"
- **Workarounds:** "Are there any temporary workarounds users can use while this is being fixed?"

## Issue Specification Structure

The generated issue specification should include the following sections:

1. **Issue Summary:** Brief description of the problem and its impact on users.
2. **Problem Description:** Detailed explanation of what's going wrong and the symptoms observed.
3. **Expected vs Actual Behavior:** Clear comparison of what should happen vs what actually happens.
4. **Reproduction Steps:** Step-by-step instructions to consistently reproduce the issue.
5. **Affected Users/Scope:** Who is impacted and under what circumstances.
6. **Impact Assessment:** Severity, frequency, and business impact of the issue.
7. **Error Details:** Any error messages, console logs, or technical details available.
8. **Environment Information:** Relevant technical context (browsers, devices, user roles, etc.).
9. **Root Cause Analysis (if known):** Any insights into what might be causing the issue.
10. **Potential Solutions:** Initial thoughts on how the issue might be resolved.
11. **Workarounds:** Temporary solutions users can employ while the issue is being fixed.
12. **Definition of Done:** Clear criteria for when this issue is considered resolved.

## Target Audience

Assume the primary reader of the issue specification is a **developer** who needs to understand and fix the problem. Therefore, the specification should be explicit, technical when necessary, and provide enough detail for them to reproduce, understand, and resolve the issue.

## Output

- **Format:** Markdown (`.md`)
- **Location:** `/workflow/issues/`
- **Filename:** `[issue-name]-issue.md`

## Final instructions

1. Do NOT start implementing the fix
2. Make sure to ask the user clarifying questions
3. Take the user's answers to the clarifying questions and improve the issue specification

Once the issue specification is generated, list any remaining open questions and ask the user if it is correct. Tell the user to "Respond with 'Complete Issue Specification' to complete the issue specification generation."
