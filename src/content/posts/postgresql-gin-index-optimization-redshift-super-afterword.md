---
title: "我們選用 Redshift 了！"
description: "每年約 20 TB、至少分析兩年的歷史資料。這篇後記說明團隊選用 Redshift 的具體原因：分析效率、每日索引維護與雲端費用。"
date: 2026-10-28T00:00:00+08:00
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Amazon Redshift", "SUPER", "OLAP", "SQL"]
audience: "engineer"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

上一篇：[PostgreSQL 效能優化（下）：用 Array + GIN 把標籤變成索引](/posts/postgresql-gin-index-optimization-part-3)

## 為什麼從 PostgreSQL 改用 Redshift？

前面三篇聚焦在標籤查詢的調校。正式環境還要做歷史統計，例如比較同一群客戶每月平均餘額的變化，以及不同產品的差異。

| 選型考量               | RDS for PostgreSQL（GIN 方案）                     | Redshift                                                          |
| ---------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| 歷史資料的統計效率     | GIN 可先篩選；命中資料多時，仍要讀取並彙整大量紀錄 | 欄式儲存與壓縮減少讀取量，並行處理分攤彙整工作                    |
| 每日寫入更新的維護成本 | 新增資料與更新標籤會增加 GIN 維護及清理工作        | 省去 GIN 維護，仍有載入、更新與資料整理成本                       |
| 運算資源與費用         | 費用隨執行個體、IOPS 與儲存配置而變                | 分析若非全天候，Serverless 隨用隨付可減少閒置運算支出；儲存費另計 |

這批資料每年約 20 TB，正式環境至少要分析兩年、共 40 TB 以上的歷史資料，同時承接每日寫入與更新。

40 TB 本身未超過 RDS for PostgreSQL 的最高儲存規格。我們最後選擇 Redshift，用欄式儲存與並行處理承接大量歷史統計，也不必另外建立與維護 GIN 索引。分析有閒置時段時，Serverless 隨用隨付也能減少運算支出。

## Redshift 的 SUPER 陣列

上一篇提出把標籤轉成 PostgreSQL 的 `text[]` 陣列，再搭配 GIN 索引。換到 Redshift 後，標籤改存進 **SUPER**；它是可儲存陣列與物件的資料型態，沒有 GIN 的索引功能。

載入時用 `SPLIT_TO_ARRAY` 把 `tag1;tag_VIP` 拆成 `["tag1","tag_VIP"]`，後續就能直接比對完整標籤，不必再拆字串，也避免 `LIKE '%tag_VIP%'` 連 `tag_VIP_plus` 一起找到。

```sql
CREATE TEMP TABLE customer_tags_demo AS
SELECT 1001 AS customer_id,
       SPLIT_TO_ARRAY('tag1;tag_VIP', ';') AS tags;

SELECT DISTINCT c.customer_id
FROM customer_tags_demo AS c,
     c.tags AS tag
WHERE tag = 'tag_VIP';
```

`c.tags AS tag` 會逐個取出陣列裡的標籤，再用 `tag = 'tag_VIP'` 比對，預期找到客戶 `1001`。`DISTINCT` 則讓同一位客戶只出現一次。

資料筆數與每筆標籤越多，展開、比對的工作也越多。

## 實戰心得：資訊補齊後，重新選型

一開始選 PostgreSQL，是因為我最熟悉它，也能透過 pgvector 擴充套件做向量搜尋。

把正式環境的歷史分析需求、每日寫入更新，以及 AWS 費用一起評估後，團隊最後決定改用 Redshift。

## 延伸閱讀

- [AWS：Amazon Redshift 與 PostgreSQL 的差異](https://docs.aws.amazon.com/redshift/latest/dg/c_redshift-and-postgres-sql.html)
- [AWS：Redshift Serverless 隨用隨付計費](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing-on-demand.html)
- [AWS：查詢 SUPER 裡的陣列與物件](https://docs.aws.amazon.com/redshift/latest/dg/query-super.html)
