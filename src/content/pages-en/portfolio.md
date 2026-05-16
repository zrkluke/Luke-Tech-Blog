---
title: "Portfolio"
meta_title: "Portfolio | Luke Kong | Luke Dev Notes"
description: "Luke Kong's portfolio, featuring AI agents, Python backend integrations, and n8n automation projects."
draft: false
---

This page collects practical work I have built, with an emphasis on tools and automation workflows that solve concrete problems and fit into real operations.

---

### Featured Projects

#### Automation & Data Workflows

##### Threads Crawler Notification System (Apify + n8n + Telegram Bot)

I custom-built a Threads crawler, deployed it as an Apify Actor, and then used n8n to trigger the Actor on a schedule, retrieve the Threads dataset, and send the processed results to Telegram so users can receive tracked updates on a recurring basis.

![n8n Threads crawler notification workflow](/images/portfolio/n8n-threads-workflow.svg)

- **Apify Actor:** [threads-crawler](https://apify.com/zrkluke/threads-crawler)
- **Highlights:** custom crawler development, Apify Actor deployment, scheduled automation, external Actor execution, dataset retrieval, Telegram Bot notifications, and automated data delivery.

##### 00981A Active ETF Holdings Tracker (Python + GitHub Actions + Email + Telegram)

This Python workflow fetches the MoneyDJ 00981A holdings page every day, stores a dated CSV snapshot, and compares it with the previous snapshot. When new holdings data is available, it generates a summary and diff file, then sends the update through email and Telegram so daily ETF changes can be monitored without manually checking the source page.

![00981A active ETF holdings tracker notification workflow](/images/portfolio/active-etf-crawler-workflow.svg)

- **GitHub Repo:** [active-etf-crawler](https://github.com/zrkluke/active-etf-crawler)
- **Highlights:** Python crawler development, daily holdings snapshots, CSV diff generation, GitHub Actions scheduling, SMTP email delivery, Telegram Bot notifications, and data-date checks to avoid duplicate alerts.
