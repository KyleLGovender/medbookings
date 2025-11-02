# Context Scoping Guide for Claude Code

**Purpose**: Maintain optimal context size (3,000-5,000 tokens) during implementation tasks to avoid confusion and maintain focus.

**When to Use**: At the start of every implementation task (Step 5 in tasks-process-enhanced.md)

---

## 🎯 Context Loading Strategy

### Core Principle

Load **ONLY** what you need for the current task. Avoid loading entire feature modules or the complete codebase.

**Target**: 3,000-5,000 tokens per task
**Maximum**: 8,000 tokens (reload context if exceeding this)

---

## 📋 Step-by-Step Context Loading

### Step 1: Read Task-Specific Files Only

From the Technical Plan section "Files to Modify" and "Files to Create":

1. **Read ONLY the files explicitly listed** (not entire feature modules)
2. **For each file**:
   - Read the entire file (don't skim - you need complete understanding)
   - Read direct imports (one level deep only)
   - Read type definitions that are used
   - Stop there - don't follow rabbit holes

**Example**:

```
Technical Plan says: "Modify /src/server/api/routers/calendar.ts"

✅ DO:
- Read /src/server/api/routers/calendar.ts (entire file)
- Read types imported from /src/features/calendar/types/types.ts
- Read utilities imported from /src/features/calendar/lib/

❌ DON'T:
- Read all files in /src/features/calendar/
- Read other routers
- Read all calendar components
```

### Step 2: Load Relevant Code Patterns

From `/workflow/reference/code-patterns/`, load ONLY relevant patterns:

**Pattern Selection Matrix**:
| Task Type | Pattern File to Load | Approx Size |
|-----------|---------------------|-------------|
| API/tRPC work | `api-patterns.md` | ~50 lines |
| React components | `component-patterns.md` | ~50 lines |
| Custom hooks | `hook-patterns.md` | ~50 lines |
| Form validation | `validation-patterns.md` | ~50 lines |

**Rule**: Load maximum 2 pattern files per task. If you need more, you're likely

trying to do too much in one task.

### Step 3: Database Context (Conditional)

**ONLY if database changes required**:

Use `grep` to extract specific models (not entire schema):

```bash
# Extract single model
grep -A 20 "^model Provider" prisma/schema.prisma

# Extract related models
grep -A 20 "^model Provider\|^model Organization" prisma/schema.prisma
```

**Load**:

- The specific models being modified
- Related models (foreign key relationships)
- Relevant enums

**Don't Load**:

- Entire prisma/schema.prisma file (1069 lines!)
- Unrelated models
- Migration files

### Step 4: Architecture Reference (Minimal)

From CLAUDE.md, load ONLY relevant sections:

**Task-Specific Sections**:

- API work → Section 3: Architecture & Tech Stack (tRPC patterns)
- Database → Section 7: Healthcare Compliance (timezone, booking integrity)
- Forms → Section 12: Development Workflow (form standards)
- Security → Section 8: Security Checklist

**Method**: Use Read tool with `offset` and `limit` parameters to read specific sections only.

---

## 🚫 What NOT to Read

### Never Read These (Unless Explicitly Required):

- ❌ Entire feature modules (`/src/features/[feature]/`)
- ❌ All database models (use grep for specific models)
- ❌ Unrelated tRPC routers
- ❌ Test files (unless task is "fix tests" or "write tests")
- ❌ Built/generated files (.next/, node_modules/, dist/)
- ❌ Migration files (unless task involves migrations)
- ❌ Complete CLAUDE.md (32KB - read sections only)
- ❌ Complete CLAUDE-AGENT-CONTEXT.md (unless initial analysis)
- ❌ Documentation files (unless updating docs)
- ❌ Config files (unless modifying config)

### Special Cases:

- **If user says "I'm confused"**: Reload context with Step 1-4
- **If switching between frontend/backend**: Reload context
- **After each parent task**: Optionally refresh context for next task

---

## 📊 Context Size Management

### Display Context Info to User

After loading context, always display:

```
📊 Context Loaded:
- Files read: [X]
- Patterns loaded: [Y]
- Database models: [Z]
- Estimated tokens: ~[N]k

Ready to implement [task description]
```

### Context Size Checkpoints

| Token Count | Action                                                 |
| ----------- | ------------------------------------------------------ |
| < 3,000     | ⚠️ May be missing context - verify you have everything |
| 3,000-5,000 | ✅ Optimal - proceed with implementation               |
| 5,000-8,000 | ⚠️ High but acceptable - stay focused                  |
| > 8,000     | 🔴 Too much - reload with more selective approach      |

### When to Reload Context

**Reload context if:**

1. Token count exceeds 8,000
2. You're getting confused about what you're implementing
3. User says "let's start fresh"
4. Switching between major work types (API → Frontend)
5. Starting a new parent task (optional - use judgment)

**How to Reload:**

1. Acknowledge: "Context is getting large, reloading with focused scope"
2. Follow Steps 1-4 again
3. Display new context info
4. Continue implementation

---

## 🎯 Context Loading Examples

### Example 1: API Endpoint Task

**Task**: "Add new tRPC procedure to get provider availability"

**Context to Load**:

1. `/src/server/api/routers/providers.ts` (file to modify)
2. `/src/features/providers/types/types.ts` (types used)
3. `/workflow/reference/code-patterns/api-patterns.md` (pattern reference)
4. `grep -A 15 "^model Provider\|^model Availability" prisma/schema.prisma` (database models)

**Estimated tokens**: ~3,500

**Don't load**:

- Other routers
- Provider components
- Calendar router (unless mentioned in plan)

### Example 2: React Component Task

**Task**: "Create availability calendar component"

**Context to Load**:

1. `/src/features/calendar/components/` - list directory first, then read relevant files
2. `/src/features/calendar/hooks/useAvailability.ts` (hook to call)
3. `/src/features/calendar/types/types.ts` (type definitions)
4. `/workflow/reference/code-patterns/component-patterns.md` (pattern reference)

**Estimated tokens**: ~4,200

**Don't load**:

- API router (already implemented)
- Other calendar components
- Database schema (not needed for display component)

### Example 3: Form with Validation Task

**Task**: "Add provider service form with Zod validation"

**Context to Load**:

1. `/src/features/providers/components/` - list directory, find similar form
2. `/src/features/providers/types/schemas.ts` (existing schemas)
3. `/workflow/reference/code-patterns/validation-patterns.md` (validation patterns)
4. `/workflow/reference/code-patterns/component-patterns.md` (form patterns)
5. CLAUDE.md Section 12 (form standards - ~100 lines)

**Estimated tokens**: ~4,800

**Don't load**:

- API router (if form submission is separate task)
- Database schema (if not modifying)
- Other provider components

---

## 🔄 Context Refresh Strategy

### Refresh Points

**After Each Parent Task (Optional)**:

- Review next parent task requirements
- Determine if current context is still relevant
- If switching domains (API → UI), reload context

**During Long Implementation Sessions**:

- Every 3-4 parent tasks: Consider context refresh
- If implementation spans multiple days: Reload at start of new session
- If user reports confusion: Reload immediately

### Refresh Protocol

1. **Acknowledge**: "Refreshing context for next phase"
2. **Review**: Check next task requirements
3. **Selective Load**: Apply Steps 1-4 for new task
4. **Display**: Show new context info
5. **Proceed**: Continue with implementation

---

## 💡 Pro Tips

### Tip 1: Use Directory Listings First

Before reading all files in a directory, list it first:

```bash
ls -1 src/features/calendar/components/
```

Then read ONLY the relevant files.

### Tip 2: Use Grep for Targeted Reading

Instead of reading entire files, use grep when appropriate:

```bash
# Find specific function
grep -A 10 "export function useAvailability" src/features/calendar/hooks/useAvailability.ts

# Find specific type
grep -A 5 "export type Availability" src/features/calendar/types/types.ts
```

### Tip 3: Leverage CLAUDE-AGENT-CONTEXT.md

For high-level architecture understanding, reference the context document:

- Initial setup: Read full document
- During tasks: Reference specific sections only
- Don't reload entire document for every task

### Tip 4: Track What You've Loaded

Mentally (or explicitly) track loaded context:

- Files: [list]
- Patterns: [list]
- Database models: [list]

This helps avoid duplicate loading and context bloat.

### Tip 5: When in Doubt, Ask User

If unsure whether to load additional context:

- Ask user: "Should I read [file/module] for this task?"
- Better to ask than to load unnecessarily

---

## ✅ Context Loading Checklist

Before starting implementation, verify:

- [ ] I've read the technical plan's "Files to Modify/Create" section
- [ ] I've loaded ONLY those specific files (not entire modules)
- [ ] I've loaded 1-2 relevant pattern files (max)
- [ ] If database work: I've grepped specific models only
- [ ] If needed: I've read relevant CLAUDE.md sections only
- [ ] I've displayed context info to user (~Xk tokens)
- [ ] My context is between 3k-5k tokens (optimal)
- [ ] I understand what I'm implementing (95%+ confidence)

If any checkbox is unchecked, address before proceeding.

---

## 🆘 Troubleshooting

**Problem**: "I don't have enough context to implement this"
**Solution**:

1. Review technical plan - did you miss a file?
2. Check if additional imports need reading
3. Ask user: "I need more context for X. Should I read Y?"

**Problem**: "I'm getting confused with too much information"
**Solution**:

1. Acknowledge context overload
2. Reload with more selective approach (Steps 1-4)
3. Focus on current sub-task only

**Problem**: "Context exceeds 8,000 tokens"
**Solution**:

1. Identify what's taking up space
2. Remove least relevant files
3. Use grep instead of full file reads
4. Consider breaking task into smaller chunks

**Problem**: "User says implementation is off-track"
**Solution**:

1. Re-read technical plan carefully
2. Re-read PRP business objectives
3. Reload context with focus on stated requirements
4. Ask user for clarification on expectations

---

**Remember**: Less context = more focus = better implementation

Quality over quantity. Load what you need, nothing more.
