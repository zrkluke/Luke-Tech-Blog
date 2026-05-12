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
