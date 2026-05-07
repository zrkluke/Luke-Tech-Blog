---
title: "PostgreSQL 效能優化（下）：用 Array + GIN 把標籤變成索引"
description: "把『分號串起來的標籤字串』改成 PostgreSQL 原生 text[]，搭配 GIN 倒排索引，讓查詢從 Seq Scan 換成 Index Scan，附上資料模型遷移與 GIN 建立的實戰指令。"
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "效能調校", "GIN Index", "SQL"]
audience: "engineer"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

若你還沒讀過前兩集的問題定位與 EXPLAIN 拆解：

- **[上集：當 LIKE 遇上 Regex 的觀念碰撞](/posts/postgresql-gin-index-optimization-part-1)**
- **[中集：用 EXPLAIN 看見 Seq Scan 的真相](/posts/postgresql-gin-index-optimization-part-2)**

---

## 從觀察到動手：真正要換掉的是存取路徑

中集確認的事實是：LIKE 與 Regex 都讓 PostgreSQL 規劃出全表 `Seq Scan`，因為 B-tree 索引在 `'%xxx%'` 條件下找不到入口。要根本改變查詢成本，得做兩件事：**改資料模型**讓查詢語意能對應到合適的索引型態，**建索引**讓 PostgreSQL 有索引可走。

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

查詢改寫為陣列運算（如 `&&`, `@>`），讓 PostgreSQL 能走 GIN：

- `tags_array && ARRAY['tag_VIP']::text[]`：判斷是否有交集
- `tags_array @> ARRAY['tag_VIP']::text[]`：判斷是否完整包含

---

## 可帶走的觀念：之後遇到 DB 效能問題都還用得上的基本功

下面這幾個基本功，下次遇到任何資料庫效能問題都會再用到：

- **量測優先於直覺**：靠 `EXPLAIN ANALYZE` 看計畫，永遠比靠經驗或感覺猜瓶頸可靠。
- **用複雜度語言描述現況**：把 `N`、`M`、`K` 這些變數寫出來，才有辦法理性比較不同寫法的代價。
- **資料模型是性能的天花板**：SQL 語法只能在現有結構上做局部優化，要根本拉開差距常常得回頭改欄位設計。
- **優化要在 plan 上驗證**：要看到 `Seq Scan` 真的換成 `Index Scan` 才算數，執行時間變短不代表存取路徑改了。

### 結論

> Regex 的確能先把 CPU 壓力降下來，但資料量一大，真正拉開差距的還是 `Array + GIN` 這種直接改變查詢路徑的做法。

---

回頭快速複習前兩集：

- **[上集：當 LIKE 遇上 Regex 的觀念碰撞](/posts/postgresql-gin-index-optimization-part-1)**
- **[中集：用 EXPLAIN 看見 Seq Scan 的真相](/posts/postgresql-gin-index-optimization-part-2)**
