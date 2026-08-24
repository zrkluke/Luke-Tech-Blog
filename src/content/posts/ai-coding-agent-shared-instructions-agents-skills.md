---
title: "一份 AGENTS.md，讓多個 AI 程式開發 Agent 共享專案規則（上）"
description: "整理 Codex、Claude Code、Antigravity 與 Cursor 如何接到同一份專案規則，並用 AGENTS.md、.skills/ 與輕量 adapter 避免規則失步。"
date: 2026-05-20T01:00:00Z
updated: 2026-08-24T00:00:00Z
authors: ["Luke Kong"]
categories: ["AI Agent"]
tags:
  [
    "AI Coding Agent",
    "AGENTS.md",
    "Claude Code",
    "OpenAI Codex",
    "Antigravity",
    "Cursor",
  ]
audience: "engineer"
image: "/images/post/ai-coding-agent-shared-instructions-cover.png"
---

AI 程式開發工具會一直增加。當 Cursor、Claude Code、Codex、Antigravity 各自帶著一份規則檔進專案，幾個月後常會發現規則彼此已經說了不同的事。

我現在把專案當成穩定入口：共用規則放在 `AGENTS.md`，完整任務流程放在 `.skills/`，工具需要特定探索位置時只放輕量 adapter。工具換了，真正需要維護的內容仍然留在專案裡。

> 更新（2026-08-24）：本文已配合本專案的原生 skill 探索 adapter 更新。實作細節與 Antigravity、Cursor 的使用方式請接著閱讀 Part 2。

## 1. 四個工具如何接到同一份專案規則

四個工具的入口不同，但它們都可以回到同一個原則：把跨工具、長期穩定的內容留在專案，讓工具專屬設定只處理載入方式。

### Codex：`AGENTS.md` 是專案指引的指令鏈

Codex 在開始工作前會讀取 `AGENTS.md`。它會從專案根目錄一路走到目前工作目錄，逐層合併規則；較靠近工作目錄的 `AGENTS.md` 或 `AGENTS.override.md` 會排在後面，因此能覆寫前面的通用規則。

這很適合放全專案都要遵守的資訊：

- 專案結構與常用指令
- 建置、型別檢查與測試規則
- 提交與審查的期待
- 共用 skills 的唯一來源

如果 `src/content/posts/` 有特別的工作限制，可以在那個資料夾新增較近的指引。全域規則仍然放在根目錄的 `AGENTS.md`，讓新進專案的 agent 一開始就知道基本工作方式。

### Claude Code：用 `CLAUDE.md` 匯入同一份指引

Claude Code 的預設入口是 `CLAUDE.md`。既然專案的共用規則已經放在 `AGENTS.md`，`CLAUDE.md` 只需要保留官方匯入語法：

```md
@AGENTS.md
```

這個檔案是 adapter，不承載另一份規則。指令、驗證方式與 Git 流程改動時，只修改 `AGENTS.md`，Claude Code 也會讀到同一個版本。

### Antigravity：把共用規則放進可執行的任務脈絡

Antigravity 適合處理跨編輯器、終端機、瀏覽器的完整任務。對這個專案，我會在任務一開始要求 agent 讀 `AGENTS.md`，再依 skills 索引開啟命中的 `.skills/<name>/SKILL.md`。

例如文章更新可以直接交代：

```text
更新中英文文章。先讀 AGENTS.md 與命中的 skill，完成後跑 skills:check、npm run check、npm run build。
```

接著讓 agent 依序改內容、執行指令、啟動預覽；最後再從計畫、截圖或瀏覽紀錄檢查成果。這是任務執行層的安排，專案的流程本體仍然只有 `.skills/` 那一份。

### Cursor：共用規則用 `AGENTS.md`，路徑觸發用 `.cursor/rules`

Cursor 可以把根目錄的 `AGENTS.md` 當成簡單的專案指引。這足以承接整個專案都適用的規則。

當某條規則只適用於一類檔案時，再加入 `.cursor/rules/*.mdc`。例如文章被開啟或修改時，讓規則檔只指向完整流程：

```mdc
---
description: Apply the blog writing workflow
globs: src/content/posts/**/*.md
alwaysApply: false
---

Read and follow `.skills/tech-blog-polish/SKILL.md` before editing this post.
```

這個 adapter 只回答「什麼時候載入」，不複製文章結構與語氣規則。Cursor 的檔案路徑能力保留下來，流程也不會分裂成多份。

## 2. 專案的最小共用策略

我會把規則拆成三個層次：`AGENTS.md` 放穩定指引，`.skills/` 放完整任務流程，工具資料夾放產生的或依路徑套用的 adapters。這個分法讓每個檔案都有單一責任，也讓審查時能快速判斷一條規則該放在哪裡。

```text
Luke-Tech-Blog/
├── AGENTS.md                 # 專案指引
├── CLAUDE.md                 # 匯入 AGENTS.md
├── .skills/                  # 完整且唯一的流程
├── .claude/skills/           # 產生的原生探索 adapter
├── .agents/skills/           # 產生的原生探索 adapter
└── .cursor/rules/            # 可選的檔案路徑觸發規則
```

`AGENTS.md` 的內容保持短而穩定：

```md
## Repository Expectations

- Keep the complete workflow only in `.skills/<skill-name>/SKILL.md`.
- `.claude/skills/` and `.agents/skills/` are generated native-discovery adapters.
- Run `npm run skills:sync` after changing skill frontmatter.
```

`.skills/` 才放會反覆演進的細節，例如文章潤稿的讀者設定、段落結構與語氣，或 Git 審查的檢查順序與提交規則。

需要 Claude Code 與 Codex 的原生探索時，執行同步腳本產生 adapter：

```bash
npm run skills:sync
npm run skills:check
```

前者更新產生檔，後者只驗證同步狀態。這讓失步變成可以在提交前或 CI 明確攔下來的錯誤。

> 一份共用規則能走得久，前提是每個工具只帶走它需要的入口。

## 結論：先讓規則收斂，再讓工具各自發揮

四個工具各有適合的使用方式：Codex 與 Claude Code 可直接接到共用指引；Antigravity 適合執行長任務並留下可檢查的成果；Cursor 適合按檔案路徑自動附加規則。

先把 `AGENTS.md` 與 `.skills/` 定為唯一來源，後面的工具整合才不會變成持續複製文件的工作。

下一篇會回到這個部落格專案，實際展示 Claude Code 與 Codex 的原生探索 adapters，以及 Antigravity、Cursor 在同一份流程上的使用方式。

- **[一份 AGENTS.md，讓多個 AI 程式開發 Agent 共享專案規則（下）](/posts/ai-coding-agent-shared-instructions-agents-skills-part-2)**

## 參考資料

- [OpenAI Codex：Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Claude Code：How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Cursor：Rules](https://docs.cursor.com/context/rules-for-ai)
- [Google Antigravity：agentic development platform](https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/)
