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
