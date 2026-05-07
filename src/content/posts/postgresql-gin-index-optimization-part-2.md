---
title: "PostgreSQL 效能優化（中）：用 EXPLAIN 看見 Seq Scan 的真相"
description: "用 EXPLAIN ANALYZE 拆解 LIKE 與 Regex 的真實成本：為什麼 SQL 觸發點會變成多次 Seq Scan、B-tree 為何幫不上忙、Regex 狀態機只能壓 CPU 卻動不到 I/O。"
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "效能調校", "GIN Index", "SQL"]
audience: "engineer"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

若你還沒讀過 LIKE／Regex 與 I/O、CPU 兩條戰線，請先看上集；想直接動手做的，可以跳到下集：

- **[上集：當 LIKE 遇上 Regex 的觀念碰撞](/posts/postgresql-gin-index-optimization-part-1)**
- **[下集：用 Array + GIN 把標籤變成索引](/posts/postgresql-gin-index-optimization-part-3)**

---

## 問題升級：Regex 幫了 CPU，但整體還是不夠快

上集的結論提到 Regex 能降低每列字串比對的 CPU 成本，但當資料規模上看千萬、億級時，真正決定延遲與吞吐的是 I/O 與存取路徑，而不是字串語法本身。

這一集要做的就一件事：**用 EXPLAIN ANALYZE 把計畫攤開，定位 LIKE / Regex 寫法在哪一步把整張表的 I/O 給綁死了。** 確認瓶頸位置之後，下集再動手換存取路徑。

---

## 關鍵分析：用 EXPLAIN 與複雜度看主導成本

> 註：以下 EXPLAIN 與 SQL 已將 schema、表名、欄位名匿名化處理（例：`customers`、`tag_dictionary`、`balance` 等）。執行統計（`rows`、`loops`、`Rows Removed`、`Buffers`）來自一份測試資料集的 `EXPLAIN ANALYZE` 實測，僅作為「結構辨識」範例——關注每個節點長什麼樣、條件擺在哪、有沒有走索引；絕對數字會隨資料量變化，不代表生產環境。

用 `EXPLAIN ANALYZE` 攤開 LIKE 版的計畫，第一個刺眼的訊息是 **這條查詢對主表 `Seq Scan` 了三次**。要弄懂為什麼會這樣，必須回到 SQL 語法本身。

### 從 SQL 找出每一個 Seq Scan 的源頭

把 LIKE 版本的 SQL 簡化、標出每個會碰到主表的位置：

```sql
WITH product_dict AS (                                       -- ← 觸發點 1
    SELECT DISTINCT product_id, product
    FROM customers
    WHERE product <> ''
)
SELECT ...
FROM customers AS main                                       -- ← 觸發點 2
INNER JOIN product_dict ...
WHERE main.segment = 'core'
  AND lower(main.levels) LIKE '%lv1%'
  AND lower(main.excluded_levels) NOT LIKE '%ex001%'
  AND lower(main.excluded_levels) NOT LIKE '%ex022%'
  AND date_trunc('MONTH', main.etl_date)
      = date_trunc('MONTH', (SELECT MAX(etl_date) FROM customers));   -- ← 觸發點 3
```

三個觸發點在 SQL 上看起來很無辜：一個 CTE、一個主 FROM、一個 `MAX()` 子查詢。但對 PostgreSQL 來說，每一個都是「再把表打開讀一次」的指令。對應到 EXPLAIN：

```text
->  Aggregate                                                -- 觸發點 3：InitPlan 1
      ->  Seq Scan on customers
            Buffers: shared hit=159

->  Seq Scan on customers main                               -- 觸發點 2：主 FROM
      Filter: segment = 'core'
              AND lower(levels) ~~ '%lv1%'
              AND lower(excluded_levels) !~~ '%ex001%'
              AND lower(excluded_levels) !~~ '%ex022%'
              AND date_trunc('MONTH', etl_date) = (InitPlan 1).col1
      Rows Removed by Filter: 3806
      Buffers: shared hit=318

->  Seq Scan on customers                                    -- 觸發點 1：CTE 內部
      Filter: product <> ''
      Rows Removed by Filter: 3835
      Buffers: shared hit=159
```

四個關鍵訊號：

- **`Seq Scan` 出現三次**：每一次都代表「主表逐列翻一遍」。
- **每個 `Filter` 之後的 `Rows Removed` 幾乎等於該節點吐出的 `rows`**：被讀進來的列絕大多數只是為了被丟掉。
- **沒有條件被歸到 `Index Cond`**：所有 WHERE 條件都落在 `Filter` 內，PostgreSQL 找不到任何走索引的入口。
- **三段 `Buffers: shared hit` 加總接近主表的全部 page 數**：實質上整張表被完整讀了三次。

### 為什麼 LIKE 把每一個掃描都鎖死在 Seq Scan

PostgreSQL 預設只會挑 **B-tree 索引**來規劃查詢（除非你明確替欄位建了 GIN、GiST 等其他類型）。B-tree 是有序樹，能加速的查詢條件只有一種共通特徵：**能在樹中定位出起始 key**——例如 `name = 'Luke'` 或 `name LIKE 'Lu%'`，B-tree 都能從特定節點往下走。一旦條件失去這個性質，索引就無從切入。回到三個觸發點的條件：

- `lower(levels) LIKE '%lv1%'`：前後都是 `%`，B-tree 沒入口。
- `lower(excluded_levels) NOT LIKE '%ex001%'`：`NOT LIKE` 等於要求對每一列驗證「條件不成立」，索引天生不擅長否定查詢。
- `date_trunc('MONTH', etl_date) = ...`：欄位被函數包住，B-tree 找不到對應的 key（除非建 expression index）。

所以三個觸發點全部退回 `Seq Scan` 的根因只有一個：**LIKE 加上「函數包欄位」的寫法根本沒給 PostgreSQL 任何走索引的入口**。

### 改寫成 Regex 之後，SQL 跟 EXPLAIN 變這樣

把兩條 `NOT LIKE` 改用 Regex（從字典表動態組出 alternation pattern）後，SQL 結構整個換掉：

```sql
WITH remove_list AS (                                            -- ← 觸發點 1
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
    FROM customers                                               -- ← 觸發點 2
    WHERE customer_id <> ''
      AND segment = 'core'
      AND etl_date = (SELECT MAX(etl_date) FROM customers)       -- ← 觸發點 3
) AS main
LEFT JOIN (
    SELECT DISTINCT '%' || lower(code) || '%' AS level_code, display_name
    FROM tag_dictionary                                          -- ← 觸發點 4
    WHERE display_name = 'HVIP'
) AS cluster_list
  ON main.levels LIKE cluster_list.level_code
LEFT JOIN (
    SELECT DISTINCT product_id, product
    FROM customers                                               -- ← 觸發點 5
    WHERE customer_id = ''
      AND product <> ''
) AS product_list
  ON main.product_id = product_list.product_id
CROSS JOIN remove_list
WHERE COALESCE(main.excluded_levels, '') !~ remove_list.regex_pattern
  AND cluster_list.display_name <> ''
  AND main.product_id <> 0;
```

五個觸發點對應 EXPLAIN 的五個 `Seq Scan`：

```text
->  Aggregate                                                -- 觸發點 3：InitPlan 1（同 LIKE 版）
      ->  Seq Scan on customers
            Buffers: shared hit=159

->  Aggregate                                                -- 觸發點 1：remove_list CTE
      ->  Seq Scan on tag_dictionary
            Filter: kind = 'exclude'
                    AND category IN ('low_marketing','private_bank')
            Buffers: shared hit=4

->  Seq Scan on tag_dictionary                               -- 觸發點 4：cluster_list 子查詢
      Filter: display_name = 'HVIP'
      Buffers: shared hit=4

->  Seq Scan on customers main                               -- 觸發點 2：主 FROM
      Filter: customer_id <> ''
              AND product_id <> 0
              AND segment = 'core'
              AND etl_date = (InitPlan 1).col1
      Rows Removed by Filter: 3308
      Buffers: shared hit=318

->  Seq Scan on customers                                    -- 觸發點 5：product_list 子查詢
      Filter: product <> '' AND customer_id = ''
      Rows Removed by Filter: 3835
      Buffers: shared hit=159
```

主表 `customers` 還是被 `Seq Scan` 三次（觸發點 2、3、5），完全沒少；多出來的兩次 Seq Scan 在字典表上（觸發點 1、4）。

更關鍵的是，原本擠在主 `Filter:` 裡的 LIKE 與 Regex，現在被拆到兩層 `Join Filter:`：

```text
->  Nested Loop                                              -- 套 Regex
      Join Filter: COALESCE(excluded_levels, '') !~ regex_pattern

->  Nested Loop                                              -- 套 LIKE on levels
      Join Filter: levels ~~ ('%' || lower(code) || '%')
```

### LIKE 版 vs Regex 版的結構性對照

| 項目 | LIKE 版 | Regex 版 |
|---|---|---|
| 主表 `Seq Scan` 次數 | 3 | 3 |
| 字典表 `Seq Scan` 次數 | 0 | 2 |
| LIKE / Regex 條件擺在哪 | 主表的 `Filter:`（隨 Seq Scan 同時評估） | `Join Filter:`（join 階段才評估） |
| 主表 Seq Scan 直接吐出的列 | 已經套完 LIKE 條件 | 只套基本條件，字串檢查留待 join 處理 |

兩個結構性結論：

- **主表的 Seq Scan 次數沒變**：3 次仍然 3 次。Regex 沒有解決「掃幾次」這件事。
- **LIKE / Regex 從 `Filter` 升到 `Join Filter`**：字串檢查被推到 join 階段，主表必須先把所有通過基本條件的列都吐進 join，才開始用 LIKE / Regex 篩。Regex 在 per-row CPU 上理論上更輕（下面解釋為什麼），這個結構性改寫等於把省下的力氣再吐回去。

也就是說：**SQL 結構決定要掃幾次表，LIKE 或 Regex 只決定每次掃描如何檢查每一列。**

### 為什麼理論上 Regex 能把 CPU 從 $O(N \times M)$ 壓成 $O(N)$

要理解這個差別，得先補一個概念：**狀態機（finite automaton）就是一台「邊讀字元、邊跳狀態」的小機器**——給它一個字串，它依序看每一個字元，決定要跳到哪個狀態，最後告訴你「有沒有匹配成功」。Regex 引擎在執行前會把整個 pattern 翻譯成這種結構，常見有兩個變體：

- **DFA（Deterministic Finite Automaton，確定性自動機）**：每個狀態看到一個字元只有一條轉移路徑，執行快但狀態總數可能爆炸。
- **NFA（Nondeterministic Finite Automaton，非確定性自動機）**：每個狀態同一個字元可以有多條轉移路徑，狀態少但執行可能要 backtrack。**PostgreSQL 用的是 NFA-based 引擎**。

對 alternation `(ex001|ex022|ex045)`，編譯出來的狀態機長這樣（簡化）：

```text
                            ┌─ 0 → 0 → 1   ✓ ex001
start ─→ e ─→ x ─→ 0 ──────┼─ 2 → 2       ✓ ex022
                            └─ 4 → 5       ✓ ex045
```

關鍵是共用前綴 `ex0` 只被處理**一次**。讀進輸入字串後，每讀一個字元，整台狀態機**同時**推進所有分支，掃過字串一輪就等於一次判斷完所有替代項。

把這套機制套回查詢：

- **多 LIKE**：M 個 pattern 各自獨立、不共用工作，每列要跑 M 次完整字串比對 → CPU ~ $O(N \times M)$
- **單 Regex**：M 個替代項合併成同一台狀態機，每列只走一次 → CPU ~ $O(N)$

省的是「每列的 CPU」，沒有改變「要不要再掃一次表」這件事。

### 三種寫法的成本主導者

定義符號：`N` = 主表列數、`M` = 條件數、`K` = 命中列數。

| 寫法 | 每次掃描的 CPU | 每次掃描的 I/O |
|---|---|---|
| 多 `LIKE` | ~ $O(N \times M)$ | ~ $O(N)$ 全表掃 |
| 單 Regex | ~ $O(N)$ | ~ $O(N)$ 全表掃 |
| `Array + GIN` | ~ $O(\log N + K)$ | 走索引 + 抓命中頁 |

LIKE 與 Regex 只動 CPU 那一欄，I/O 那欄一動沒動；而且 SQL 結構讓查詢碰主表幾次，整體成本就是上表那一欄按次累計。要根本改變每一次掃描的形狀，得讓 `Seq Scan` 退場、換 `Index Scan` 上場。

說白了，真正拉開差距的是有沒有讓查詢改走索引那條路。

---

## 中集小結

到這裡我們已經看清三件事：

- **SQL 結構決定要碰主表幾次**（CTE、子查詢、`MAX()` 各算一次觸發點）
- **LIKE 加上「函數包欄位」讓每一次掃描都鎖死成 Seq Scan**：B-tree 只能加速能定位起始 key 的條件，本案三個觸發點全部不符合
- **Regex 改寫不會減少掃描次數**：狀態機只壓 per-row CPU，不改變存取路徑

要根本拉開差距，得直接換索引型存取路徑——下集動手做：

> **[PostgreSQL 效能優化（下）：用 Array + GIN 把標籤變成索引](/posts/postgresql-gin-index-optimization-part-3)**
