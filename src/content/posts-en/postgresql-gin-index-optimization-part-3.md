---
title: "PostgreSQL Optimization (Part 3): Turning tags into an index with Array + GIN"
description: "Convert delimited tag strings into PostgreSQL's native text[] and back it with a GIN inverted index, so the query swaps Seq Scan for Index Scan. Includes the migration SQL and the GIN index command."
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "Performance", "GIN Index", "SQL"]
audience: "engineer"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

If you haven't read the earlier parts:

- **[Part 1: LIKE vs Regex - what's actually different?](/en/posts/postgresql-gin-index-optimization-part-1)**
- **[Part 2: Reading EXPLAIN to see where Seq Scan hides](/en/posts/postgresql-gin-index-optimization-part-2)**

---

## From observation to action: the access path is what we need to change

Part 2 made the situation concrete: LIKE and Regex both hand PostgreSQL a full-table `Seq Scan`, because B-tree indexes can't anchor on `'%xxx%'` conditions. Two things have to happen to actually change the cost: **change the data model** so the query can express itself in operators an index can serve, and **build the right kind of index** so PostgreSQL has somewhere to go.

---

## Practical solution: make the query index-friendly

Two simple steps: change the data type, then rewrite the predicates so they hit the index.

### A. Reshape the data (string → array)

Convert `'tag1;tag2'` into PostgreSQL's native `text[]`, so query semantics map directly onto array operators:

```sql
ALTER TABLE customers ADD COLUMN tags_array text[];

UPDATE customers
SET tags_array = string_to_array(nullif(trim(tags), ''), ';');
```

### B. Build a GIN inverted index

```sql
CREATE INDEX CONCURRENTLY idx_customers_tags_gin
  ON customers USING gin (tags_array);
```

Rewrite predicates with array operators (`&&`, `@>`) so PostgreSQL can pick up the GIN index:

- `tags_array && ARRAY['tag_VIP']::text[]` — has any overlap.
- `tags_array @> ARRAY['tag_VIP']::text[]` — contains the value.

---

## Key takeaways: database fundamentals worth carrying forward

These database fundamentals will resurface on every future performance problem:

- **Measurement beats intuition.** Read the plan with `EXPLAIN ANALYZE`. Years of experience still lose to a printed plan tree.
- **Describe cost in complexity language.** Naming `N`, `M`, `K` upfront is what lets you compare two approaches honestly.
- **The data model caps performance.** SQL syntax can only optimize within the current shape — fundamental wins usually require rethinking the column design.
- **Verify the optimization in the plan.** A `Seq Scan` becoming an `Index Scan` is the proof; faster wall-clock alone doesn't confirm the access path changed.

### Conclusion

> Regex helps reduce CPU cost first, but at large scale the bigger win comes from `Array + GIN`, because it changes the access path itself.

---

Recap of the earlier parts:

- **[Part 1: LIKE vs Regex - what's actually different?](/en/posts/postgresql-gin-index-optimization-part-1)**
- **[Part 2: Reading EXPLAIN to see where Seq Scan hides](/en/posts/postgresql-gin-index-optimization-part-2)**
