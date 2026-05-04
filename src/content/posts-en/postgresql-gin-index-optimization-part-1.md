---
title: "PostgreSQL Optimization (Part 1): when LIKE meets Regex"
description: "ETL-scale tag filters: LIKE or Regex? Why both hit full scans—and how I/O vs CPU bottlenecks differ."
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "Performance", "GIN Index", "SQL"]
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

This post is a real tuning story from my work—from a debate about LIKE vs Regex to the underlying resource picture.

**This is Part 1:** LIKE vs Regex and the I/O vs CPU story. **[Part 2: EXPLAIN, scale, and GIN](/en/posts/postgresql-gin-index-optimization-part-2)** covers how we escaped full table scans.

---

## Part 1: LIKE vs Regex

### 1. The ETL setup
It started with ETL’d “finished” data: many tag-like attributes stuffed into one text field, separated by `;`.

Roughly like:
`tag1;tag2;tag3;tag_VIP;tag_inactive`

Because the pipeline already shaped the data this way, I kept writing SQL against that column without thinking twice.

### 2. “Why not Regex? It’s faster.”
When I drafted filters as a pile of `LIKE '%tag1%' OR LIKE '%tag2%'`, a senior colleague suggested:
> “Why not fold those into one Regex? It’ll be faster than LIKE.”

### 3. My gut reaction: isn’t it still a full scan?
With **no** useful index, wouldn’t the database still walk **every row** for either LIKE or Regex?

If both are $O(N)$ over the row count, would Regex really help?

### 4. We were both right—different bottlenecks
After digging in, **both views were right**; we were staring at **different limits**.

*   **Me (I/O):** I was thinking about **disk reads**. Without an index, the engine must pull a huge fraction of the table through I/O. That cost exists for **both** LIKE and Regex.
*   **Them (CPU):** They were thinking about **per-row work**. Many `LIKE` clauses over the same row can mean **$O(M)$** string passes for **$M$** conditions—roughly **$O(N \times M)$** overall. One compiled Regex is usually **one** state-machine pass per row—about **$O(N)$** (still subject to pattern size and backtracking, but you drop the extra **$M$** factor).

So, given I/O was already painful, Regex could still **cool down a melting CPU**.

---

**Part 2** walks through `EXPLAIN ANALYZE`, tens of millions of rows, and the **Array + GIN** mental model: **[PostgreSQL performance (Part 2)](/en/posts/postgresql-gin-index-optimization-part-2)**.
