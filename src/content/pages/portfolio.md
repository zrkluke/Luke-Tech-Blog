---
title: "作品集"
meta_title: "作品集 | Luke Kong | Luke Tech Blog"
description: "Luke Kong 的作品集，包含 AI agent、Python 後端整合與 n8n 自動化專案。"
draft: false
---

## 作品集

這裡整理我做過或正在打磨的技術作品，聚焦在 **AI agent**、**Python 後端整合**、**n8n 自動化流程**，以及能落地到真實工作流的工具。

---

### 作品

#### Threads 爬蟲通知系統 (Apify + n8n + Telegram Bot)

先客製化開發 Threads 爬蟲，部署成 Apify Actor，再由 n8n 透過排程驅動 Actor 執行、取得 Threads 貼文資料集，最後把整理好的結果推送到 Telegram，讓使用者能定期收到追蹤結果。

![n8n Threads 爬蟲通知流程](/images/portfolio/n8n-threads-workflow.svg)

- **Apify Actor：**[threads-crawler](https://apify.com/zrkluke/threads-crawler)
- **技術重點：**客製化爬蟲開發、Apify Actor 部署、定時任務、外部 Actor 執行、資料集讀取、Telegram Bot 通知、自動化資料傳遞。

---

### 精選方向

- **AI Agent / LLM 應用：**工具調用、任務拆解、多步驟工作流、評估與可觀測性。
- **Python 後端與整合：**API、Webhook、資料處理、排程任務與第三方服務串接。
- **n8n 自動化：**表單、Slack、資料庫、通知與內部營運流程自動化。
