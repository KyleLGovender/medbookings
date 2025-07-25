---
trigger: manual
---

# Rule: Adding Issues to Project Backlog

## Goal

To guide an AI assistant in collecting issue details through structured questions and automatically updating the project backlog with properly categorized and prioritized tasks.

## Process

1. **Receive Initial Issue:** The user describes a bug, feature request, or improvement they've discovered
2. **Ask Clarifying Questions:** Gather sufficient detail to properly categorize and prioritize the issue
3. **Determine Priority & Category:** Based on answers, classify the issue appropriately
4. **Update Backlog:** Automatically add the issue to the correct section in `backlog.md`
5. **Update Metrics:** Refresh the project health metrics

## Clarifying Questions

The AI should ask these questions to properly categorize and prioritize the issue:

### Issue Classification
- **Issue Type:** "Is this a bug fix, new feature, enhancement to existing feature, or technical debt/chore?"
- **Issue Title:** "What would you call this issue? (I'll suggest a clear, actionable title)"

### Priority Assessment
- **User Impact:** "How does this affect users? Does it break functionality, cause confusion, or just minor inconvenience?"
- **Urgency:** "How soon does this need to be addressed? Is it blocking other work or user workflows?"
- **Scope:** "How many users/areas of the app does this affect?"

### Context & Details
- **Current Behavior:** "What's happening now that shouldn't be?"
- **Expected Behavior:** "What should happen instead?"
- **Steps to Reproduce:** "How can someone reproduce this issue?"
- **Files/Areas Affected:** "Do you know which files or parts of the app are involved?"

### Implementation Context
- **Complexity:** "Does this seem like a quick fix or a complex change?"
- **Dependencies:** "Does this relate to or depend on any other issues or features?"
- **Additional Context:** "Anything else important to know about this issue?"

## Priority Classification Rules

Based on the answers, classify as:

### 🔥 High Priority
- Blocks user workflows or core functionality
- Affects many users
- Security issues
- Data integrity problems
- Urgent business needs

### 📊 Medium Priority
- Improves user experience but doesn't break functionality
- Affects some users
- Performance improvements
- UI/UX enhancements
- Minor bugs with workarounds

### 🧹 Low Priority / Technical Debt
- Nice-to-have improvements
- Code quality issues
- Minor UI polish
- Developer experience improvements
- Documentation updates

## Issue Categories

- **Bug Fix:** Something is broken or not working as intended
- **Feature:** Completely new functionality
- **Enhancement:** Improvement to existing functionality
- **Technical Debt:** Code quality, performance, or maintainability improvement
- **UX/UI:** User interface or experience improvement
- **Security:** Security-related fixes or improvements

## Backlog Update Process

After collecting information:

1. **Format the Issue:** Create a clear, actionable task description
2. **Determine Section:** Place in appropriate priority section of `backlog.md`
3. **Add Context:** Include relevant details as sub-bullets
4. **Update Metrics:** Refresh project health section
5. **Confirm Addition:** Show the user where the issue was added

## Task Format in Backlog

```markdown
- [ ] [Issue Title] - [Brief description]
  - **Type:** [Bug Fix/Feature/Enhancement/Technical Debt]
  - **Impact:** [Brief impact description]
  - **Files:** [Known affected files/areas]
  - **Added:** [Date]
```

## AI Instructions

When a user mentions an issue:

1. **Acknowledge:** "I'll help you add this to the backlog. Let me ask a few questions to properly categorize and prioritize it."

2. **Ask Questions:** Go through the clarifying questions systematically - don't ask all at once, but have a natural conversation

3. **Classify:** Based on answers, determine priority and category

4. **Confirm:** "Based on our discussion, I'm categorizing this as a [priority] [type] issue. Does that sound right?"

5. **Update Backlog:** Add to appropriate section in `backlog.md`

6. **Update Metrics:** Refresh project health numbers

7. **Confirm:** "✅ Added to [section] in backlog.md. The issue is now tracked and will be addressed according to its priority."

## Example Interaction

```
User: "I just noticed that when users click the save button on the profile page, it doesn't show any loading state so they don't know if it worked."

AI: "I'll help you add this to the backlog. Let me ask a few questions to properly categorize it.

First, this sounds like a UX enhancement - users can save their profile, but they don't get feedback about the action. Is that correct?

How does this affect users? Do they think the save failed, or do they click it multiple times?"

[Continue conversation...]

AI: "✅ Added to Medium Priority Backlog in backlog.md:
- [ ] Add loading state to profile save button - Users need visual feedback when saving
  - **Type:** Enhancement  
  - **Impact:** Improves user confidence in save actions
  - **Files:** Profile page components
  - **Added:** 2025-01-17

Updated project metrics: 5 total active tasks (3 high, 2 medium, 0 low priority)"
```

## Success Criteria

- Issue is properly categorized and prioritized
- Backlog is updated with clear, actionable description
- Project health metrics are refreshed
- User understands where their issue was added and why