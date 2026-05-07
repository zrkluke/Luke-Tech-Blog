---
title: "PostgreSQL Optimization (Part 2): Reading EXPLAIN to see where Seq Scan hides"
description: "Use EXPLAIN ANALYZE to expose the real cost of LIKE vs Regex: why SQL syntax dictates how many table scans you get, why B-tree gives up on '%xxx%', and why a Regex state machine only saves CPU, not I/O."
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "Performance", "GIN Index", "SQL"]
audience: "engineer"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

If you haven't read the LIKE/Regex vs I/O/CPU story, start there. If you'd rather jump straight to the implementation, head to Part 3:

- **[Part 1: LIKE vs Regex - what's actually different?](/en/posts/postgresql-gin-index-optimization-part-1)**
- **[Part 3: Turning tags into an index with Array + GIN](/en/posts/postgresql-gin-index-optimization-part-3)**

---

## Problem framing: CPU improved, but the query was still too slow

Part 1 showed that Regex can lower per-row CPU compared to many `LIKE`s. At tens of millions of rows the bottleneck shifts to I/O and access path, and per-row CPU savings stop mattering.

This part has one job: **use `EXPLAIN ANALYZE` to find exactly where LIKE/Regex pin the query to full-table I/O.** Once we see the bottleneck, Part 3 fixes the access path.

---

## Core analysis: read EXPLAIN to find the cost dominator

> Note: the EXPLAIN snippets and SQL below are anonymized — schema, table, and column names (e.g. `customers`, `tag_dictionary`, `balance`) are stand-ins. Execution stats (`rows`, `loops`, `Rows Removed`, `Buffers`) come from a small test dataset and are shown for **structural recognition only**: focus on what each node looks like, where conditions sit, and whether PostgreSQL finds an index entry. The absolute numbers do not represent production scale.

Open the LIKE plan with `EXPLAIN ANALYZE` and the first thing that jumps out: **the same query touches the main table with three separate `Seq Scan` nodes.** To understand why, we have to look at the SQL itself.

### Trace each Seq Scan back to the SQL that triggered it

Here is the simplified LIKE-version SQL with the table-touch points marked:

```sql
WITH product_dict AS (                                       -- ← trigger 1
    SELECT DISTINCT product_id, product
    FROM customers
    WHERE product <> ''
)
SELECT ...
FROM customers AS main                                       -- ← trigger 2
INNER JOIN product_dict ...
WHERE main.segment = 'core'
  AND lower(main.levels) LIKE '%lv1%'
  AND lower(main.excluded_levels) NOT LIKE '%ex001%'
  AND lower(main.excluded_levels) NOT LIKE '%ex022%'
  AND date_trunc('MONTH', main.etl_date)
      = date_trunc('MONTH', (SELECT MAX(etl_date) FROM customers));   -- ← trigger 3
```

Three innocent-looking constructs at the SQL level: a CTE, a main FROM, a `MAX()` subquery. To PostgreSQL, every one of them is "open the table again." Their EXPLAIN counterparts are three `Seq Scan` nodes:

```text
->  Aggregate                                                -- trigger 3: InitPlan 1
      ->  Seq Scan on customers
            Buffers: shared hit=159

->  Seq Scan on customers main                               -- trigger 2: main FROM
      Filter: customer_id <> ''
              AND segment = 'core'
              AND lower(levels) ~~ '%lv1%'
              AND lower(excluded_levels) !~~ '%ex001%'
              AND lower(excluded_levels) !~~ '%ex022%'
              AND date_trunc('MONTH', etl_date) = (InitPlan 1).col1
      Rows Removed by Filter: 3806
      Buffers: shared hit=318

->  Seq Scan on customers                                    -- trigger 1: inside the CTE
      Filter: product <> ''
      Rows Removed by Filter: 3835
      Buffers: shared hit=159
```

Four signals worth reading carefully:

- **Three `Seq Scan` nodes**: each one is "walk the entire table again."
- **`Rows Removed by Filter` close to the node's `rows`**: most of what we read is just thrown away.
- **No condition becomes an `Index Cond`**: every WHERE clause lands inside `Filter`, meaning PostgreSQL could not find any index entry point.
- **The three `Buffers: shared hit` together approach the table's full page count**: the table is effectively read three times.

### Why LIKE locks every scan to Seq Scan

PostgreSQL only considers **B-tree indexes** by default (unless you've explicitly built GIN, GiST, or another type for that column). A B-tree is an ordered tree. Conditions it can accelerate share one property: **a starting key has to be pinnable in the tree** — for example `name = 'Luke'` or `name LIKE 'Lu%'` both let it descend from a specific node. Once that property breaks, the index has nowhere to start. Look back at the three triggers:

- `lower(levels) LIKE '%lv1%'`: leading `%`, no entry point in the tree.
- `lower(excluded_levels) NOT LIKE '%ex001%'`: `NOT LIKE` is "verify a non-match for every row" — a B-tree is poor at negative matching.
- `date_trunc('MONTH', etl_date) = ...`: the column is wrapped in a function, so the B-tree can't find a matching key (unless you build an expression index).

The three `Seq Scan`s come from one structural fact: **the LIKE-plus-function-wrapping style gives PostgreSQL no index entry point at all**.

### What the Regex rewrite actually changes

Replacing the two `NOT LIKE`s with a Regex compiled from a lookup table changes the SQL shape entirely:

```sql
WITH remove_list AS (                                            -- ← trigger 1
    SELECT '(^|;|,)('
        || REPLACE(string_agg(TRIM(code), '|'), ' ', '')
        || ')($|;|,)' AS regex_pattern
    FROM tag_dictionary
    WHERE kind = 'exclude'
      AND category IN ('low_marketing', 'private_bank')
)
SELECT
    cluster_list.display_name,
    main.etl_date,
    product_list.product,
    SUM(main.balance)::numeric / COUNT(DISTINCT main.customer_id) AS avg_balance
FROM (
    SELECT *
    FROM customers                                               -- ← trigger 2
    WHERE customer_id <> ''
      AND segment = 'core'
      AND etl_date = (SELECT MAX(etl_date) FROM customers)       -- ← trigger 3
) AS main
LEFT JOIN (
    SELECT DISTINCT '%' || lower(code) || '%' AS level_code, display_name
    FROM tag_dictionary                                          -- ← trigger 4
    WHERE display_name = 'HVIP'
) AS cluster_list
  ON main.levels LIKE cluster_list.level_code
LEFT JOIN (
    SELECT DISTINCT product_id, product
    FROM customers                                               -- ← trigger 5
    WHERE customer_id = ''
      AND product <> ''
) AS product_list
  ON main.product_id = product_list.product_id
CROSS JOIN remove_list
WHERE COALESCE(main.excluded_levels, '') !~ remove_list.regex_pattern
  AND cluster_list.display_name <> ''
  AND main.product_id <> 0;
```

Five table-touch points map to five `Seq Scan` nodes:

```text
->  Aggregate                                                -- trigger 3: InitPlan 1 (same as LIKE)
      ->  Seq Scan on customers
            Buffers: shared hit=159

->  Aggregate                                                -- trigger 1: remove_list CTE
      ->  Seq Scan on tag_dictionary
            Filter: kind = 'exclude'
                    AND category IN ('low_marketing','private_bank')
            Buffers: shared hit=4

->  Seq Scan on tag_dictionary                               -- trigger 4: cluster_list subquery
      Filter: display_name = 'HVIP'
      Buffers: shared hit=4

->  Seq Scan on customers main                               -- trigger 2: main FROM
      Filter: customer_id <> ''
              AND product_id <> 0
              AND segment = 'core'
              AND etl_date = (InitPlan 1).col1
      Rows Removed by Filter: 3308
      Buffers: shared hit=318

->  Seq Scan on customers                                    -- trigger 5: product_list subquery
      Filter: product <> '' AND customer_id = ''
      Rows Removed by Filter: 3835
      Buffers: shared hit=159
```

The main `customers` table is still scanned three times (triggers 2, 3, 5). The two extra Seq Scans are on the dictionary table (triggers 1, 4).

More importantly, the LIKE/Regex predicates that used to live in the main `Filter:` are now split across two `Join Filter:` nodes:

```text
->  Nested Loop                                              -- applies the Regex
      Join Filter: COALESCE(excluded_levels, '') !~ regex_pattern

->  Nested Loop                                              -- applies LIKE on levels
      Join Filter: levels ~~ ('%' || lower(code) || '%')
```

### LIKE vs Regex: a structural comparison

| Trait | LIKE version | Regex version |
|---|---|---|
| Seq Scans on main table | 3 | 3 |
| Seq Scans on dictionary table | 0 | 2 |
| Where the LIKE/Regex predicates live | main `Filter:` (evaluated during Seq Scan) | `Join Filter:` (evaluated during the join) |
| What rows the main Seq Scan emits | already pruned by LIKE conditions | only basic conditions applied — string checks happen later in the join |

Two structural takeaways:

- **The number of Seq Scans on the main table doesn't change.** Three is still three. Regex doesn't address "how many times we scan."
- **LIKE/Regex are promoted from `Filter` to `Join Filter`.** The string check moves to the join phase, so the main table has to emit every row that passed the basic conditions before LIKE/Regex prunes it. Regex saves per-row CPU in theory (more on that below), but this structural rewrite gives that saving back.

In other words: **SQL structure decides how many times we touch the table; LIKE or Regex decides only what to check on each row.**

### Why a Regex can theoretically push CPU from $O(N \times M)$ to $O(N)$

Quick concept first: a **finite automaton** is a small machine that walks a string character by character, jumping between states, and reports "matched or not" at the end. A regex engine compiles the pattern into one of these structures before running it. There are two flavors:

- **DFA (Deterministic Finite Automaton)**: at any state, a given character has exactly one next state. Fast to run, but the state count can blow up.
- **NFA (Nondeterministic Finite Automaton)**: a state can transition into multiple successors on the same character. Fewer states, but execution may have to backtrack. **PostgreSQL uses an NFA-based engine.**

For an alternation like `(ex001|ex022|ex045)`, the compiled state machine looks roughly like this:

```text
                            ┌─ 0 → 0 → 1   ✓ ex001
start ─→ e ─→ x ─→ 0 ──────┼─ 2 → 2       ✓ ex022
                            └─ 4 → 5       ✓ ex045
```

The shared prefix `ex0` is processed **once**. As input is read character by character, the entire machine advances all branches **simultaneously** — a single pass evaluates every alternative.

Apply this to the query:

- **Multi-LIKE**: M independent patterns, no shared work — each row goes through M full string scans → CPU ~ $O(N \times M)$.
- **Single Regex**: M alternatives merged into one state machine — each row only needs one pass → CPU ~ $O(N)$.

The savings are strictly per-row CPU. The number of times the table has to be scanned does not change.

### Cost dominators across the three approaches

Symbols: `N` = main-table rows, `M` = predicate count, `K` = matching rows.

| Approach | Per-scan CPU | Per-scan I/O |
|---|---|---|
| Multiple `LIKE` | ~ $O(N \times M)$ | ~ $O(N)$ full scan |
| Single Regex | ~ $O(N)$ | ~ $O(N)$ full scan |
| `Array + GIN` | ~ $O(\log N + K)$ | index lookup + fetch matching pages |

LIKE and Regex only move the CPU column; the I/O column doesn't budge. Since SQL structure dictates how many times the main table is touched, the total cost is whichever column you sit in, multiplied by that count. To actually change the shape of each scan, you have to retire `Seq Scan` and bring in `Index Scan`.

In plain terms: this only gets fast when the path changes from "check every row" to "find candidates first, then fetch hits."

---

## Wrap-up of Part 2

Three things are now clear:

- **SQL structure decides how many times the main table is touched.** CTEs, subqueries, and `MAX()` each count as a separate trigger.
- **LIKE plus function-wrapped columns lock every scan to Seq Scan.** B-tree only accelerates conditions that pin down a starting key, and our three triggers all break that property.
- **Rewriting to Regex doesn't reduce scan count.** The state machine only saves per-row CPU; it doesn't change the access path.

To actually pull ahead, we need to switch to an index-driven access path — that's what Part 3 builds:

> **[PostgreSQL Optimization (Part 3): Turning tags into an index with Array + GIN](/en/posts/postgresql-gin-index-optimization-part-3)**
