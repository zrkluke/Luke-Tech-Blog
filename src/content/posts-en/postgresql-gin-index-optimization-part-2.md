---
title: "PostgreSQL Optimization (Part 2): escaping full scans with GIN"
description: "Nested loops in EXPLAIN; why Regex doesn’t fix I/O at 50M–100M rows; Arrays + GIN as an inverted-index “drawer” model."
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "Performance", "GIN Index", "SQL"]
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

If you haven’t read the LIKE / Regex vs I/O vs CPU story, start here: **[Part 1](/en/posts/postgresql-gin-index-optimization-part-1)**.

---

## Part 2: breaking the full scan

### 5. What EXPLAIN showed
I ran `EXPLAIN ANALYZE`. With multiple `LIKE`s, the plan showed nasty **nested loops**—the CPU kept revisiting the same row for different tag predicates.

Regex was cleaner: roughly **one** evaluation per row. But is that enough?

### 6. The real scare: tens of millions of rows
Regex helped CPU, but the next problem loomed: this table was headed for **roughly 50M–100M rows**.

At that scale, **just reading** ~100M rows from disk (sequential scan) can take minutes. Faster CPU doesn’t repeal storage physics. **Without cutting I/O, you still lose.**

### 7. Arrays + GIN (“drawers”)
If you can’t afford row-by-row scans, you need a **catalog**. In PostgreSQL, a strong tool for multi-value tags is **GIN (Generalized Inverted Index)**.

**What changes in complexity terms?**  
Without a helpful index, LIKE stacks and Regex still tie qualification to scanning on the order of **total rows $N$** (and multi-`LIKE` can look like **$O(N \times M)$** in CPU terms). With a **GIN index on an array column**, “contains this tag” often becomes **GIN entry lookup**: walk the index tree (grows slowly—think **logarithmic** vs “+1 per row”), fetch matching **TIDs**, then read only the **hit rows**—not the whole table. Multi-predicate plans often use **BitmapAnd / BitmapOr**—set-style work instead of repeated string scans per row.

**Compared to Part 1:** folding LIKE into Regex mostly stays on an **$O(N)$ scan**, but removes an **$M$** multiplier on per-row CPU. **Adding an index changes the path**: you stop being dominated by **$N$** and shift cost toward **index work + hit count**. The win is usually **much larger** than “LIKE → Regex” alone; Regex helps CPU, **indexes** help I/O and overall scaling.

### Putting it into practice

Two mechanical steps:

**Step 1 — split strings into arrays**  
Turn `'tag1;tag2'` into PostgreSQL arrays `{"tag1","tag2"}` with `string_to_array` (example: legacy column `tags`, delimiter `;`):

```sql
ALTER TABLE customers ADD COLUMN tags_array text[];

UPDATE customers
SET tags_array = string_to_array(nullif(trim(tags), ''), ';');
```

**Step 2 — add GIN on the array**

```sql
CREATE INDEX CONCURRENTLY idx_customers_tags_gin
  ON customers USING gin (tags_array);
```

Query with array ops (e.g. `tags_array && ARRAY['tag_VIP']::text[]` for overlap, `@>` for contains) so the planner can use GIN instead of scan-everything LIKE/Regex.

### Why it feels like “drawers”
The engine stops “open every customer row.” Instead, each **tag** behaves like a **drawer** of row ids—same idea as an **inverted index**: **term → postings**. Your **intent** (“rows with `tag_VIP`”) maps to a **small candidate set**, not a per-row string shootout.

*   Drawer `tag1` → rows 1, 5, 99  
*   Drawer `tag_VIP` → rows 2, 8  

To serve `tag_VIP`, Postgres doesn’t linearly walk 100M rows for that predicate; it opens the drawer, then fetches those rows by TID.

**Complexity intuition:** cost shifts from “**scan bound by $N$**” to “**index steps + work proportional to real hits**”—when hits are far below $N$, that’s the “dimension reduction” moment.

### Closing
From naive `LIKE`, to CPU-aware `Regex`, to **`Array + GIN`** for I/O at scale—one lesson stuck:

> **Tuning isn’t picking the “prettier” syntax—it’s knowing whether you’re paying in CPU, I/O, or both.**

Pick structures that match how the engine actually finds data.
