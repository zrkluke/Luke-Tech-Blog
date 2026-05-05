---
title: "PostgreSQL 效能優化（上）：LIKE 和 Regex，哪個比較快？"
description: "用白話拆解 LIKE 與 Regex 的差別：為什麼 Regex 可能讓 CPU 輕鬆一點，卻不一定能解決整表掃描帶來的 I/O 壓力。"
date: 2026-05-04T00:00:00Z
authors: ["Luke Kong"]
categories: ["Database"]
tags: ["PostgreSQL", "Database", "效能調校", "GIN Index", "SQL"]
audience: "non-technical"
image: "/images/post/postgresql-gin-index-optimization-cover.png"
---

這篇文章是我在工作上真的卡住過的一次效能問題。中間繞了一些路，最後才把真正的瓶頸抓出來。

**本篇為上集**，先談 LIKE 與 Regex 的抉擇與 I/O／CPU 迷思；**[下集：EXPLAIN、資料規模與 GIN 索引](/posts/postgresql-gin-index-optimization-part-2)** 接著談如何打破全表掃描。

---

## 上集：當 LIKE 遇上 Regex，到底差在哪？

### 1. 問題背景（白話版）
我在工作上接了一批 ETL 後的資料。每筆資料裡，很多標籤被塞在同一個欄位，用 `;` 串起來，像這樣：

`tag1;tag2;tag3;tag_VIP;tag_inactive`

當我要找特定標籤時，最直覺是寫很多個 `LIKE`。

### 2. 同事一句提醒，直接點到問題
同事說：「把多個 `LIKE` 合成一個 Regex，通常會更快。」

我第一反應是：  
「沒有索引的話，不是都要整張表一筆一筆看過去嗎？那真的會快多少？」

### 3. 我們都沒錯，只是看的是不同成本
後來我才搞懂，我們其實切入點不同：我先看讀取成本(I/O)，同事先看運算成本(CPU)。

- **我看的是 I/O（讀資料成本）**  
  沒有索引時，資料庫通常還是要掃很多資料。這件事不會因為你改成 Regex 就消失。
- **同事看的是 CPU（運算成本）**  
  多個 `LIKE` 代表同一列要重複比對很多次；合成一個 Regex，通常可把「重複比對」變少。

用比喻來說：
- 多個 `LIKE` 像是同一本書翻很多輪，每次找一個關鍵字。
- 單一 Regex 像是一輪閱讀就把多個關鍵字一起判斷。

### 4. 這篇上集我最想說的事
如果資料量還小，Regex 可能已經很有感。  
但資料一大，只換語法通常不夠，最後還是得讓資料庫用不同方式找資料。

### 結論

> Regex 可以先減輕 CPU 壓力，但只要查詢還在掃整張表，I/O 依然會是主瓶頸。

---

下集從 `EXPLAIN ANALYZE` 談起，一路談到五千萬筆規模下的 I/O 與 **Array + GIN** 的「抽屜」思維：**[PostgreSQL 效能優化（下）](/posts/postgresql-gin-index-optimization-part-2)**。
