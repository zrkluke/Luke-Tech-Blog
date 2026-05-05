---
title: "PostgreSQL Optimization (Part 2): escaping full scans with GIN"
description: "Nested loops in EXPLAIN; why Regex doesn’t fix I/O at 50M–100M rows; Arrays + GIN as an inverted-index “drawer” model."
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "Performance", "GIN Index", "SQL"]
audience: "engineer"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

If you haven’t read the LIKE / Regex vs I/O vs CPU story, start here: **[Part 1](/en/posts/postgresql-gin-index-optimization-part-1)**.

---

## Problem framing: CPU improved, but the query was still too slow

Part 1 showed that Regex can reduce CPU work versus many `LIKE`s.  
But at 50M-100M rows, that alone is not enough. The real question is: **how do we stop scan-heavy I/O from dominating?**

---

## Core analysis: plans, complexity, and bottlenecks

I checked with `EXPLAIN ANALYZE`. Multi-`LIKE` plans inflated per-row CPU; Regex improved that part, but scan-heavy work was still the main bottleneck.

Let:
- `N` = total rows
- `M` = number of predicates
- `K` = matching rows

High-level comparison:
- Multi-`LIKE`: often near `O(N x M)` CPU + scan-like I/O near `O(N)`
- Single Regex: often near `O(N)` CPU shape, but still scan-like I/O
- `Array + GIN`: shifts toward index-driven work (`log N`-like lookup intuition + work proportional to `K`)

In plain terms: this only gets fast when the path changes from “check every row” to “find candidates first, then fetch hits.”

---

## Practical solution: make the query index-friendly

### Step 1: normalize tags into arrays

```sql
ALTER TABLE customers ADD COLUMN tags_array text[];

UPDATE customers
SET tags_array = string_to_array(nullif(trim(tags), ''), ';');
```

### Step 2: add GIN index without blocking writes

```sql
CREATE INDEX CONCURRENTLY idx_customers_tags_gin
  ON customers USING gin (tags_array);
```

Then rewrite predicates to array operators (e.g. `&&`, `@>`) so the planner can use GIN.

## Key takeaways: the workflow I would reuse

This is the workflow I would use again:
- Measure with `EXPLAIN ANALYZE`
- Model with `N`, `M`, `K`
- Change data shape to unlock index-native operators
- Verify that execution actually moves from scan-heavy to index-driven

### Conclusion

> Regex helps reduce CPU cost first, but at large scale the bigger win comes from `Array + GIN`, because it changes the access path itself.
