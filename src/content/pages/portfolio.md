---
title: "作品集"
meta_title: "作品集 | Luke Kong | Luke Dev Notes"
description: "Luke Kong 的作品集，包含 AI agent、Python 後端整合與 n8n 自動化專案。"
draft: false
---

這裡整理我做過的實作案例，重點放在能解決具體問題、能接進真實工作流的工具與自動化流程。

---

### 精選作品

#### 自動化與資料流程

##### Threads 爬蟲通知系統 (Apify + n8n + Telegram Bot)

先客製化開發 Threads 爬蟲，部署成 Apify Actor，再由 n8n 透過排程驅動 Actor 執行、取得 Threads 貼文資料集，最後把整理好的結果推送到 Telegram，讓使用者能定期收到追蹤結果。

![n8n Threads 爬蟲通知流程](/images/portfolio/n8n-threads-workflow.svg)

- **Apify Actor：** [threads-crawler](https://apify.com/zrkluke/threads-crawler)
- **技術重點：** 客製化爬蟲開發、Apify Actor 部署、定時任務、外部 Actor 執行、資料集讀取、Telegram Bot 通知、自動化資料傳遞。

##### 00981A 主動式 ETF 持股追蹤器 (Python + GitHub Actions + Email + Telegram)

這支程式每天抓取 MoneyDJ 的 00981A 持股資料，保存成每日 CSV 快照，再與前一個交易日的快照做差異比較。當持股資料有更新時，流程會產出摘要與 diff 檔，並透過 Email 和 Telegram 推送通知，讓投資追蹤不需要手動打開網站比對。

![00981A 主動式 ETF 持股追蹤與通知流程](/images/portfolio/active-etf-crawler-workflow.svg)

- **GitHub Repo：** [active-etf-crawler](https://github.com/zrkluke/active-etf-crawler)
- **技術重點：** Python 爬蟲、每日資料快照、CSV 差異比較、GitHub Actions 排程、SMTP Email 通知、Telegram Bot 通知、避免重複通知的資料日期判斷。
