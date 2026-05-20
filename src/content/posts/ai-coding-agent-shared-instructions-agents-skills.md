---
title: "一份 AGENTS.md，讓多個 AI Coding Agent 共享專案規則（上）"
description: "Cursor、Claude Code、Codex 與 Antigravity 這類 AI coding tools 持續出現。與其為每個工具維護一份規則，不如讓 repo 保有唯一的工作指引。"
date: 2026-05-20T01:00:00Z
authors: ["Luke Kong"]
categories: ["AI Agent"]
tags: ["AI Coding Agent", "AGENTS.md", "Claude Code", "OpenAI Codex", "Cursor"]
audience: "engineer"
image: "/images/post/ai-coding-agent-shared-instructions-cover.png"
---

AI coding tools 這幾年幾乎是輪流登場。

Cursor（2023）、Claude Code（2025 年 2 月）、Codex CLI / Codex coding agent（2025 年 4-5 月），以及 Google Antigravity（2025 年 11 月）這類工具持續出現。每個工具都有自己的設定檔、規則格式和使用習慣。剛開始我也會想：是不是每換一個工具，就要重新適應一次？是不是每個工具都要維護一份自己的 instruction？

後來我把問題換了一個角度看。

repo 應該成為穩定的工作入口，工具則負責讀懂 repo 裡的規則。只要專案裡有一份清楚、穩定、可版本控管的工作指引，不管今天打開的是 Cursor、Claude Code、Codex，還是下一個新工具，agent 都應該能快速理解這個專案怎麼跑、怎麼測、文章怎麼寫、commit 怎麼下。

> AI coding tools 會換，但 repo 的工作規則應該只維護一份。

註：本文提到的 Codex 指 OpenAI 在 2025 推出的 Codex CLI / Codex coding agent，不是 2021 年的 OpenAI Codex code generation model。

## 工具越多，規則越容易漂移

AI coding agent 最怕的情況，不是它不會寫程式，而是它拿到一份過期的專案規則。

這件事通常不是故意發生的。比較常見的情境是：一開始只有 Cursor，所以你寫了 `.cursor/rules`。後來開始用 Claude Code，又補了一份 `CLAUDE.md`。再後來想試 Codex，於是多了一份 `AGENTS.md`。每一份文件剛建立時都很合理，但幾個月後它們開始長得不一樣。

例如：

- `AGENTS.md` 說 commit 要有 body
- `CLAUDE.md` 還停留在舊的單行 commit 習慣
- `.cursor/rules` 裡的測試指令沒有更新
- skills 的內容被複製到多個工具專屬資料夾

這種 drift 很難靠記憶補救。人都會忘記更新文件，agent 當然也只能照它讀到的內容做事。當同一個 repo 對不同工具說出不同規則，最後受傷的是開發流程本身。

我的整理方向很簡單：repo 只保留一份 project instructions。工具需要自己的入口時，就讓那個入口變成 adapter。

## 官方文件其實指向同一個方向

我整理 Claude Code、Codex、Cursor 的官方文件後，發現三個工具雖然格式不同，但可以收斂成同一個架構。

### Codex：用 AGENTS.md 當 project instructions

Codex 官方文件把 `AGENTS.md` 當成專案指令的主要入口。這份文件適合放 repo 的固定規則，例如：

- 專案結構
- 常用指令
- coding convention
- 測試方式
- PR / commit 期待

Codex 也支援 root `AGENTS.md` 搭配子目錄的 `AGENTS.override.md`。如果某個資料夾需要特殊規則，可以把 override 放到那個子目錄，讓越靠近工作目錄的規則有更高優先權。

這個設計很適合放「穩定、全 repo 適用」的內容。它不適合塞進一大段任務細節，因為任務流程會越長越難維護。

### Claude Code：用 CLAUDE.md 匯入 AGENTS.md

Claude Code 官方預設讀 `CLAUDE.md`。如果 repo 已經有 `AGENTS.md`，官方文件建議在 `CLAUDE.md` 裡用 import：

```md
@AGENTS.md
```

這是很重要的小細節。`CLAUDE.md` 裡只寫 `AGENTS.md` 可能看起來也像在提醒模型讀檔，但它不是官方 import 語法。用 `@AGENTS.md` 才能把 Claude Code 的入口降到 adapter 的角色。

最後 repo 裡真正需要維護的 project instructions 還是 `AGENTS.md`。

### Cursor：簡單情境可以讀 root AGENTS.md

Cursor 官方主要推薦 `.cursor/rules`，因為它可以做更細的規則控制，例如 always apply、依檔案路徑套用、agent requested rule 等。

不過 Cursor 也支援 root `AGENTS.md` 作為簡單 project instructions。對只有一份全專案規則的 repo 來說，這已經足夠。等到專案真的需要針對 `src/content/posts/`、`src/components/`、`infra/` 套不同規則，再引入 `.cursor/rules` 也不遲。

我自己的判斷是：先讓 `AGENTS.md` 承擔共用入口。當規則開始需要分區、分檔、分觸發條件，再讓 Cursor rules 介入。

### Google Antigravity：原生支援 AGENTS.md

Google 於 2025 年底推出的 Antigravity 是一款以 Agent 為核心的強大開發環境。它原生支援讀取專案根目錄的 `AGENTS.md`，並以此作為自主任務執行的決策依據。當我們想進一步導入複雜的 Task Workflow 時，它亦可完美讀取在 `AGENTS.md` 中索引的 `.skills/` 目錄，藉此載入對應的任務規則（例如文章潤飾或 Git 審查），使得「單一規則本體」的理想在 Antigravity 中運行得非常流暢。

## 共用 AGENTS.md 的最小策略

`AGENTS.md` 很適合回答一個問題：這個 repo 的基本工作方式是什麼？

我會把它控制在短而穩定的範圍：

```md
# Agent Instructions

## Repository Expectations

- Follow the existing project structure and style before introducing new patterns.
- Keep shared agent skills in `.skills/`.
- Do not duplicate skill files under tool-specific directories.

## Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Type check: `npm run check`

## Verification

- Run `npm run build` after changing Astro, React, styling, or content rendering code.
- Run `npm run check` after changing TypeScript or Astro components.
- For documentation-only or skill-only changes, no build is required unless behavior changes.
```

這些規則的共同點是穩定。它們不會因為今天用 Claude Code、明天用 Codex 就改變。

最後可以把工具專屬檔案降到 adapter：

```text
AGENTS.md       # 唯一 project instructions
CLAUDE.md       # @AGENTS.md
.cursor/rules   # 只有進階規則需求時才加入
```

這樣 repo 裡真正需要維護的 project instructions 只有 `AGENTS.md`。Claude Code 透過 `CLAUDE.md` 匯入它，Cursor 和 Codex 直接讀它。

> 工具可以各自有 adapter，規則本體不要分裂。

下一篇我會用這個部落格 repo 當例子，說明我怎麼把 `AGENTS.md` 和 `.skills/` 拆開：`AGENTS.md` 放穩定入口，`.skills/` 放任務流程，讓 Claude Code、Codex、Cursor 都能共用同一套工作規則。

- **[一份 AGENTS.md，讓多個 AI Coding Agent 共享專案規則（下）](/posts/ai-coding-agent-shared-instructions-agents-skills-part-2)**

## 參考資料

- [OpenAI Codex: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [OpenAI Codex: Agent Skills](https://developers.openai.com/codex/skills)
- [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- [Claude Code: Skills](https://code.claude.com/docs/en/agent-sdk/skills)
- [Cursor: Rules](https://docs.cursor.com/context/rules-for-ai)
- [Google Developers Blog: Build with Google Antigravity](https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/)
- [Google Antigravity Official Portal](https://antigravity.google/)
- [AGENTS.md Guide: Cross-Tool Rules for Antigravity](https://antigravity.codes/)
- [AGENTS.md Official Standard](https://agents.md/)
- [OpenAI: Introducing Codex](https://openai.com/index/introducing-codex/)
- [TechCrunch: Anysphere raises $8M from OpenAI to build an AI-powered IDE](https://techcrunch.com/2023/10/11/anysphere-raises-8m-from-openai-to-build-an-ai-powered-ide/)
- [TechCrunch: Anthropic launches Claude Code research preview](https://techcrunch.com/2025/02/24/anthropic-launches-a-new-ai-model-that-thinks-as-long-as-you-want/)
