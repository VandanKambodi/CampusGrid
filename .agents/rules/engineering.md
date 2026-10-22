---
trigger: always_on
---

# Engineering Rules (always-on)

These apply to every coding task in this repo, automatically — not conditional on the agent deciding they're relevant. For full detail, see the matching skill: `codebase-pattern-adherence`, `codebase-living-map`, `scale-aware-system-design`.

## 1. Never guess versions or "current" facts from memory

Before naming a library version, API shape, or "current best practice": check the repo's actual lockfile/package manifest for what's installed, or web-search for anything external you're not reading straight from a file. Training data goes stale — a model's memory of "the latest version" is frequently wrong. Never state a version or API as fact without checking it this way.

## 2. Match existing patterns — don't invent a new one

Before writing new code, find 1–3 existing files doing something similar and match their naming, folder placement, import style, error handling, and state management. If genuinely no precedent exists, say so and pick the most idiomatic option for the stack already in use — don't silently introduce a different convention.

## 3. Keep `CODEBASE.md` honest

If this repo has a `CODEBASE.md`: any change that adds/removes an import, export, or call between modules must update that file's domain table and dependency graph in the same task. If nothing structural changed, say so explicitly rather than skipping silently.

## 4. Size the solution to the real scale, every time

State the rough expected load (requests/sec, read/write ratio) before designing anything that touches a database or handles concurrent requests. Check for N+1 queries, missing indexes, unbounded queries, blocking calls that should be async, and in-memory state that breaks across multiple servers. Pick the fix tier that matches the stated load — no unjustified complexity, no naive gaps. Leave a one-line "scale notes" comment or `CODEBASE.md` entry explaining the decision and its ceiling.

## 5. Say what you didn't do

When a rule above doesn't apply to this task (no scale concern, no structural change, no relevant precedent), state that plainly instead of leaving it unaddressed. Silence reads the same as forgetting.
