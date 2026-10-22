---
name: codebase-pattern-adherence
description: Use before writing or editing code in an existing codebase. Forces detection of existing conventions (folder structure, naming, state management, error handling, imports, API/validation patterns, testing style) and requires new code to match them instead of introducing a different pattern. Trigger this whenever the user asks to add a feature, fix a bug, refactor, or modify code in a repo that already has established files/patterns — even if they don't say "follow the existing pattern" explicitly.
---

# Codebase Pattern Adherence

## Why this exists

Agents often solve a task in isolation and quietly introduce a new pattern — a different folder layout, a different error-handling style, a new naming scheme — even when the codebase already has one. This skill enforces "read before write."

## Workflow

### Step 1 — Find precedent before writing anything

Do not start generating new code until you've found 1–3 existing files that do something similar to the task.

- Search by feature name, file type, or nearest analogous module (e.g. "how do other routes register a controller").
- If truly nothing similar exists, look at the closest neighboring module for structural conventions instead.

### Step 2 — Extract the pattern, don't just skim

For each precedent file, note:

- Naming convention (kebab-case files? `*.service.ts` suffix? PascalCase components?)
- File placement (grouped by feature vs by type)
- Import style (relative vs alias paths, named vs default exports)
- Error handling (try/catch + custom error class? Result type? middleware?)
- State management (hooks/context/zustand/redux/etc — whatever's already in use)
- API call pattern (fetch wrapper, axios instance, React Query/SWR hooks)
- Validation pattern (zod/yup, and where schemas live)
- Testing pattern and location, if tests exist

### Step 3 — State the pattern before coding

Write one short line: "This codebase does X like `<file>`, so the new code follows the same shape."
If two conflicting patterns exist in the repo, default to the more recent/more widely used one — don't invent a third.

### Step 4 — Implement matching the pattern

- Reuse existing utilities/helpers rather than writing duplicates.
- Match naming exactly (if services are `userService.ts`, don't write `UserManager.ts`).
- Match the skeleton: import order, export style, function ordering.

### Step 5 — Self-check before finishing

- [ ] Same folder structure as similar features
- [ ] Same naming convention
- [ ] Same import/export style
- [ ] Same error-handling approach
- [ ] No new dependency added when an equivalent already exists in the repo
- [ ] No new abstraction invented unless explicitly asked, or no precedent genuinely exists

If you deliberately deviate from an existing pattern (e.g. it's clearly broken), say so explicitly and explain why — never diverge silently.

If the repo has a `CODEBASE.md` (see the `codebase-living-map` skill), also run its Step 4 check now: did this change add/remove an import, export, or call that alters what depends on what? If so, update `CODEBASE.md` before calling the task done — a code change and its effect on the map are one unit of work, not two.

## When no precedent exists

Check `package.json` / existing installed libraries and pick the most idiomatic pattern for that stack. Say plainly that you're establishing a new pattern, since there's nothing to match.
