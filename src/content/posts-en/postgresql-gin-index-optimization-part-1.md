---
title: "PostgreSQL Optimization (Part 1): LIKE vs Regex, which is actually faster?"
description: "A plain-language walkthrough of LIKE vs Regex: why Regex can lower CPU work, but may still leave full-scan I/O as the real bottleneck."
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "Performance", "GIN Index", "SQL"]
audience: "non-technical"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

This post comes from a real performance issue I hit at work. I took a few wrong turns before I understood what was actually slow.

**This is Part 1:** LIKE vs Regex and the I/O vs CPU story. The next two parts go deeper:

- **[Part 2: Reading EXPLAIN to see where Seq Scan hides](/en/posts/postgresql-gin-index-optimization-part-2)**
- **[Part 3: Turning tags into an index with Array + GIN](/en/posts/postgresql-gin-index-optimization-part-3)**

---

## Part 1: LIKE vs Regex in plain language

### 1. The setup
I inherited ETL-shaped data where many tags were packed into one text field, separated by `;`:

`tag1;tag2;tag3;tag_VIP;tag_inactive`

So I did the obvious thing: filter with many `LIKE` conditions.

### 2. One comment that hit the real issue
A senior teammate said:
> “Merge those LIKE clauses into one Regex. It should run faster.”

My first reaction:
“If there is no useful index, don’t both approaches still read a lot of rows?”

### 3. We were not disagreeing, just entering from different angles
We were solving the same problem, but from different starting points: I focused on read cost first, while my teammate focused on compute cost first.

- **My focus: I/O cost**  
  Without an index, the database often still scans a large part of the table.
- **Teammate’s focus: CPU cost**  
  Many `LIKE`s can repeat string checks on the same row.  
  One Regex often reduces that repeated per-row work.

A simple analogy:
- Many `LIKE`s = reading the same page many times, each time looking for one word.
- One Regex = reading the page once and checking many words in that pass.

### 4. What I want to pass on
If your dataset is small, Regex alone may already feel much better.  
At larger scale, syntax tweaks are not enough. You need to change how the database reaches the data.

### Conclusion

> Regex can reduce CPU work, but if the query still scans most rows, I/O remains the real bottleneck.

---

Part 2 dissects LIKE and Regex with `EXPLAIN ANALYZE`; Part 3 builds the **Array + GIN** solution:

- **[PostgreSQL Optimization (Part 2): Reading EXPLAIN to see where Seq Scan hides](/en/posts/postgresql-gin-index-optimization-part-2)**
- **[PostgreSQL Optimization (Part 3): Turning tags into an index with Array + GIN](/en/posts/postgresql-gin-index-optimization-part-3)**
