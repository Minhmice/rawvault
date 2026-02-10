---
name: performance
description: Use for perf budget, profiling, anti-patterns. Assign to backend-b, refactor.
version: 1
triggers:
  keywords: ["performance", "N+1", "pagination", "cache", "latency", "bundle"]
  paths: []
checklist:
  - Measure before/after; avoid N+1; paginate lists; cache read-heavy data; trim payloads
anti_patterns:
  - N+1 queries; unbounded lists; heavy work on main thread; no caching for stable data
examples: "Batch load by id; limit/offset or cursor; cache with TTL; benchmark command to verify."
---

# Performance

Guidelines for performance-sensitive work and avoiding common anti-patterns.

## Perf budget (when applicable)

- Frontend: budget for bundle size or LCP/CLS where measured; fail CI if over.
- API: target p95 latency; alert on regression.

## Profiling checklist

- Measure before and after; use profiler or APM for hotspots.
- Focus on N+1 queries, large payloads, blocking on I/O, unnecessary work in loops.

## Common anti-patterns

- **N+1 queries:** Use batch load or join instead of per-item queries.
- **No pagination:** Do not return unbounded lists; cap and paginate.
- **Heavy work on main thread:** Offload to worker or background job when appropriate.
- **No caching:** Cache read-heavy, stable data with clear TTL and invalidation.
- **Large payloads:** Trim response; use field selection or compression where it helps.

## Search prompts

Use these (or similar) semantic search queries before performance work:

- Where are list or list-style queries executed (possible N+1)?
- How is caching or pagination implemented for this endpoint?
- Where is heavy or blocking work done in request path or main thread?

## Output

When optimizing: state **what was measured**, **change made**, **expected impact**, and **how to verify** (e.g. benchmark command or dashboard).
