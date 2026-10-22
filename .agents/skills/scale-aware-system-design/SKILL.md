---
name: scale-aware-system-design
description: Use whenever building a feature, API, or system that will handle real user load — not just "does it work once" but "does it hold up at scale (thousands/millions of concurrent users, high write volume, large datasets)". Forces explicit scale requirements, bottleneck analysis, and the right level of engineering — neither naive vibe-coding nor premature over-engineering. Trigger for anything touching databases at volume, APIs under load, real-time/concurrent features, background jobs, or when the user mentions scale, performance, concurrency, or many users.
---

# Scale-Aware System Design

## Why this exists

Two failure modes, both bad: (1) "vibe code" a feature that works for 10 users and falls over at 10,000 — no indexing thought, no caching, synchronous everything, in-memory state that breaks on the second server. (2) Over-engineer a todo app with Kafka, sharding, and microservices it will never need. This skill forces sizing the solution to the actual requirement, explicitly.

## Step 1 — Establish the actual scale requirement before designing

Don't assume "millions of users" by default and don't assume "just make it work" either. Figure out (ask if genuinely unclear, otherwise infer from context — existing traffic, stated user base, what the feature is):

- Expected concurrent users / requests per second, even roughly (10s? 1000s? 100,000s?)
- Read vs write ratio (most systems are read-heavy)
- Data volume and growth rate (rows now, rows in a year)
- Latency requirement (real-time chat vs a nightly report have very different bars)
- Consistency requirement (does this need to be exactly right immediately, or is eventual consistency fine — e.g. a "like count" vs an account balance)

State this sizing explicitly in one line before designing: "This needs to handle ~X, read-heavy, eventual consistency is fine for Y but not Z."

## Step 2 — Find the bottlenecks a naive implementation would hit

Check the obvious scale-killers before writing code:

- **N+1 queries** — loading a list then querying per-item instead of a join/batch fetch
- **Missing indexes** on columns used in WHERE/JOIN/ORDER BY at volume
- **Unbounded queries** — `SELECT *` with no pagination/limit on something that grows
- **Synchronous blocking work** in the request path that should be async (emails, image processing, webhooks, anything slow/non-critical to the immediate response)
- **In-memory/local state** (in-process cache, session in a variable) that breaks the moment you run more than one server instance
- **Single point of failure / no retry** on external calls (payment gateway, third-party API)
- **Hot partition / hot row** — everything writing to one row/key (e.g. a single global counter)

## Step 3 — Apply the pattern that matches the actual sizing (not the biggest one available)

Match the fix to Step 1's numbers, cheapest-that-works first:
| Problem | Small scale fix | Large scale fix |
|---|---|---|
| Repeated reads of same data | in-request memoization | Redis/CDN cache with TTL + invalidation |
| Slow background work | a queue table + cron worker | dedicated job queue (SQS/BullMQ/Sidekiq) |
| Growing table, slow queries | add the right index | index + read replicas / partitioning |
| Stateless requirement | avoid local state, put session in DB/cache | same, plus sticky-session-free load balancing |
| Bursty writes to one row | still fine most of the time | counter sharding / event sourcing + aggregation |
| Rate limiting | simple in-memory token bucket | distributed rate limiter (Redis-backed) |

Don't jump to the "Large scale fix" column unless Step 1's numbers actually justify it. Say explicitly why you picked the tier you picked.

## Step 4 — Design for horizontal scaling by default, even at small scale

This part costs almost nothing to do right the first time and is expensive to retrofit, so always:

- Keep request handlers stateless (no in-process data that must persist between requests)
- Make background work idempotent (safe to retry/run twice)
- Paginate anything that lists data, from day one
- Add indexes for the query patterns you're actually writing, not "later"

## Step 5 — Document the decision

Add a short "Scale considerations" note next to the feature — either in `CODEBASE.md` (see `codebase-living-map` skill) under the relevant domain, or a comment at the top of the module if there's no living map yet:

```
Scale notes: ~5k req/min expected, read-heavy. Cached in Redis (60s TTL).
Writes go through a queue to avoid blocking the request. Not sharded —
revisit if write volume exceeds ~X/sec.
```

This does two things: tells the next contributor _why_ a decision was made, and states the ceiling where the current design stops working, so nobody's surprised later.

## Step 6 — Self-check before finishing

- [ ] Stated the actual scale target (not assumed, not skipped)
- [ ] Checked for N+1 queries, missing indexes, unbounded queries
- [ ] Nothing relies on in-process/local state that breaks with >1 server
- [ ] Slow/non-critical work is async, not blocking the response
- [ ] The fix tier matches Step 1's numbers — no unjustified complexity, no naive gaps either
- [ ] Scale decision documented somewhere a future contributor will see it
- [ ] If this change affects a domain tracked in `CODEBASE.md`, that update still happened per the living-map skill

## When genuinely unsure of the target

If the user hasn't specified scale and it's not inferable, default to "hundreds of concurrent users, room to grow" — stateless, indexed, paginated, cache-ready but not pre-built — and say plainly that this is the assumption, so it can be corrected before something more specific gets built on top of it.
