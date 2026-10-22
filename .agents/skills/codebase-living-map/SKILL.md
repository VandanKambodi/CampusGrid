---
name: codebase-living-map
description: Use when entering a new/unfamiliar codebase, when a new contributor joins, or when asked to document, map, or explain the project's architecture. Generates and maintains a living CODEBASE.md that maps domains/modules, their dependencies, and blast radius — so any contributor can look up their area (frontend, backend, auth, billing, etc.), see what exists, and know what breaks if they touch it. Keep updating this file as the codebase changes; it is never a one-time snapshot.
---

# Codebase Living Map

## Why this exists

New contributors (or an agent starting fresh) waste time rediscovering the same structure repeatedly, and often make a change without realizing what else depends on the thing they touched. This skill produces one file — `CODEBASE.md` at the repo root — that stays current and answers two questions fast: **"where do I look for my thing?"** and **"what will break if I change this?"**

Pairs with the `codebase-pattern-adherence` skill: that one governs _how_ new code should be written to match conventions; this one governs _where things live_ and _what depends on what_.

## Step 1 — Scan and identify domains

Walk the repo and group it into domains/niches, not just folders — a domain is a functional area a contributor would self-identify with: `auth`, `billing`, `frontend/ui`, `api/routes`, `database`, `notifications`, etc. Note for each:

- Location(s) in the tree (a domain can span multiple folders, e.g. `frontend/auth/` + `backend/auth/`)
- Purpose in one sentence
- Tech/pattern used (link back to what `codebase-pattern-adherence` would find — naming, state mgmt, error handling)

## Step 2 — Map dependencies (the "blast radius")

For each domain, trace:

- **Depends on** — what this domain imports/calls (upstream)
- **Depended on by** — what imports/calls this domain (downstream — this is the part people forget to check)
  Use actual imports/calls, not guesses — grep/search the codebase rather than assuming from folder names.

## Step 3 — Write `CODEBASE.md`

Structure:

````markdown
# Codebase Map

## Stack

<languages, frameworks, DB, key libraries — one line each>

## Domains

| Domain  | Location                          | Purpose                 | Depends on             | Depended on by                    |
| ------- | --------------------------------- | ----------------------- | ---------------------- | --------------------------------- |
| auth    | src/auth/, src/middleware/auth.ts | login/session/JWT       | database, config       | api routes, frontend/dashboard    |
| billing | src/billing/                      | subscriptions, invoices | auth, database, Stripe | frontend/dashboard, notifications |

...

## Dependency graph

​`mermaid
graph LR
  frontend --> api
  api --> auth
  api --> billing
  billing --> database
  auth --> database
​`

## Quick start by role

- **Frontend contributor** → read `frontend/` section + whatever backend domain your feature calls.
- **Backend/API contributor** → read the domain you're touching + its "Depended on by" row before changing signatures.
- **Database/schema changes** → check every domain listing that table/model as a dependency.

## Before you change something

1. Find your domain's row.
2. Read every entry in "Depended on by" — that's who breaks if you change this domain's public surface (exports, API routes, schema).
3. If you're adding a new domain, add its row and update the graph.
````

Keep the table and graph honest — don't list a dependency you didn't actually verify.

## Step 4 — Keep it alive (mandatory, not optional)

This file degrades the moment it's treated as done. **Any code change that touches a domain's public surface requires a `CODEBASE.md` check as part of finishing that task — same commit, not a follow-up.**

Before marking a coding task complete, ask:

- Did I add/remove a file that changes a domain's Location? → update the row
- Did I add/remove an import, API call, or exported function that changes what this domain calls or is called by? → update Depends on / Depended on by, both for this domain AND the other domain's row (dependencies are two-sided — if A now depends on B, B's "Depended on by" must list A too)
- Did I add a new domain entirely? → add a row + a graph edge
- Did I only change internal logic with no new imports/exports/calls? → no update needed, the map is still accurate

If none of the above apply, say so explicitly ("no structural change, map unaffected") rather than silently skipping the check — a silent skip is indistinguishable from forgetting.

## Step 5 — On any "add/modify a feature" request

Before writing code:

1. Open `CODEBASE.md`, find the relevant domain row.
2. State plainly which other domains are in "Depended on by" and therefore need checking.

After writing code, before calling the task done: 3. Check off that nothing in that "Depended on by" list broke (or flag what needs review). 4. Run the Step 4 mandatory check and update `CODEBASE.md` if the dependency shape changed.

This closes the loop with `codebase-pattern-adherence`: that skill's own self-check ("match existing patterns") and this skill's self-check ("update the map") both run at the end of the same task — one keeps the code consistent, the other keeps the map honest.
