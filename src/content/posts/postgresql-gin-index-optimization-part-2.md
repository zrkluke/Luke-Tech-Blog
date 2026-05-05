---
title: "PostgreSQL 效能優化（下）：打破全表掃描，GIN 索引的終極魔法"
description: "用 EXPLAIN 看見巢狀迴圈；在五千萬至億級資料下，為何 Regex 仍救不了 I/O？以 Array 轉型與 GIN 倒排索引，把標籤變成抽屜、終結全表掃描。"
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "效能調校", "GIN Index", "SQL"]
audience: "engineer"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

若你還沒讀過 LIKE／Regex 與 I/O、CPU 兩條戰線，請先看：**[上集：當 LIKE 遇上 Regex 的觀念碰撞](/posts/postgresql-gin-index-optimization-part-1)**。

---

## 問題升級：Regex 幫了 CPU，但整體還是不夠快

在上集我們確認了：Regex 能有效降低每列字串比對的 CPU 成本。  
但當資料規模上看 5,000 萬到 1 億筆時，真正決定延遲與吞吐的，通常是 I/O 與存取路徑，而不是字串語法本身。

這一集要解的就一件事：**怎麼把查詢從掃整張表，改成先走索引再抓命中資料。**

---

## 關鍵分析：用 EXPLAIN 與複雜度看主導成本

我先用 `EXPLAIN ANALYZE` 看實際路徑。多條 `LIKE` 常會放大每列計算成本；改成 Regex 雖然能降 CPU，但沒有索引時，掃描範圍還是很大。

把符號定義清楚：

- `N`：總列數
- `M`：條件數
- `K`：命中列數（通常 `K << N` 才有顯著收益）

粗略比較：

- 多 `LIKE`：常見接近 `O(N x M)` 的 CPU 壓力 + 近 `O(N)` I/O 掃描
- 單 Regex：多半降為 `O(N)` 的 CPU 形態，但 I/O 仍常接近掃描級
- `Array + GIN`：查詢形態改為「索引步驟 + 命中集合」，常見更接近 `O(log N + K)` 的直覺（實際仍受統計資訊、可見性檢查與回表成本影響）

說白了，差別不在 SQL 寫法漂不漂亮，而是有沒有真的讓資料庫走到索引那條路。

---

## 實作方案：把標籤查詢改成索引友善路徑

我把調校拆成兩步，簡單直接：先改資料型態，再改查詢寫法讓它吃到索引。

### A. 資料模型調整（字串 -> 陣列）

先把 `'tag1;tag2'` 轉為 PostgreSQL 原生 `text[]`，讓查詢語意可以直接映射到陣列運算子：

```sql
ALTER TABLE customers ADD COLUMN tags_array text[];

UPDATE customers
SET tags_array = string_to_array(nullif(trim(tags), ''), ';');
```

### B. 建立 GIN 倒排索引

```sql
CREATE INDEX CONCURRENTLY idx_customers_tags_gin
  ON customers USING gin (tags_array);
```

查詢改寫為陣列運算（如 `&&`, `@>`），讓 optimizer 能走 GIN：
- `tags_array && ARRAY['tag_VIP']::text[]`：判斷是否有交集
- `tags_array @> ARRAY['tag_VIP']::text[]`：判斷是否完整包含

## 重點總結：可重複的效能優化流程

這次做完，我把流程整理成一套自己下次也能直接用的做法：

- 先用 `EXPLAIN ANALYZE` 找主導資源（CPU/I/O）
- 用複雜度語言描述現況（`N`, `M`, `K`）
- 改資料模型以配合索引存取路徑
- 驗證查詢是否真的從掃描型路徑切到索引型路徑

### 結論

> Regex 的確能先把 CPU 壓力降下來，但資料量一大，真正拉開差距的還是 `Array + GIN` 這種直接改變查詢路徑的做法。
