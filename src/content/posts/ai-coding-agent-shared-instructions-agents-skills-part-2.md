---
title: "一份 AGENTS.md，讓多個 AI 程式開發 Agent 共享專案規則（下）"
description: "用本部落格專案實作 Claude Code 與 Codex 的原生 skill 探索 adapter，並補上 Antigravity 與 Cursor 各自適合承接的工作方式。"
date: 2026-05-20T00:00:00Z
updated: 2026-08-24T00:00:00Z
authors: ["Luke Kong"]
categories: ["AI Agent"]
tags:
  [
    "AI Coding Agent",
    "AGENTS.md",
    "Agent Skills",
    "Claude Code",
    "OpenAI Codex",
    "Antigravity",
    "Cursor",
  ]
audience: "engineer"
image: "/images/post/ai-coding-agent-shared-instructions-cover.png"
---

上一篇先整理了官方文件的共同方向：`AGENTS.md` 可以成為專案的共用指引。這一篇回到我自己的部落格專案，說明我如何讓 Claude Code 與 Codex 直接發現同一組 skills。

- **[一份 AGENTS.md，讓多個 AI 程式開發 Agent 共享專案規則（上）](/posts/ai-coding-agent-shared-instructions-agents-skills)**

> 更新（2026-08-24）：這個專案已加入可提交的原生探索 adapters。`.skills/` 仍是唯一完整流程，`.claude/skills/` 和 `.agents/skills/` 只保留產生出的入口。

我的目標很明確：

- 專案指引只維護一份
- 任務流程只維護一份
- 工具專屬檔案只做 adapter
- 團隊共用的內容進 Git

這樣換工具時不用重寫規則。接下來我把實作分成兩段：先處理 Claude Code 與 Codex 的原生探索，再補上 Antigravity 與 Cursor 該怎麼接到同一份專案規則。

## 1. Claude Code 與 Codex：一份流程，多個原生入口

上一版架構已經讓 agent 可以從 `AGENTS.md` 找到 `.skills/`。實際使用時，工具開啟專案後若能直接掃描自己的 skills 目錄，任務發現會更自然；我不必在每個指令裡重複提醒「先去 `.skills/` 找流程」。

這次完成後的結構如下：

```text
Luke-Tech-Blog/
├── AGENTS.md
├── CLAUDE.md
├── .skills/
│   ├── README.md
│   ├── tech-blog-polish/
│   │   └── SKILL.md
│   ├── git-change-commit-review/
│   │   └── SKILL.md
│   └── linkedin-blog-promo/
│       └── SKILL.md
├── .claude/
│   └── skills/
│       ├── tech-blog-polish/
│       │   └── SKILL.md
│       ├── git-change-commit-review/
│       │   └── SKILL.md
│       └── linkedin-blog-promo/
│           └── SKILL.md
├── .agents/
│   └── skills/
│       ├── tech-blog-polish/
│       │   └── SKILL.md
│       ├── git-change-commit-review/
│       │   └── SKILL.md
│       └── linkedin-blog-promo/
│           └── SKILL.md
└── scripts/
    └── sync-skills.mjs
```

`AGENTS.md` 依然是專案指引的入口，放常用指令、驗證方式、專案結構與 Git 流程。`CLAUDE.md` 仍然只匯入它：

```md
@AGENTS.md
```

真正的任務流程放在 `.skills/<skill-name>/SKILL.md`。兩個工具目錄裡的同名檔案則是 adapter，讓 Claude Code 與 Codex 可以用各自的原生探索找到同一個 skill。

### 完整流程只寫一次

adapter 的內容刻意很短。以 `tech-blog-polish` 為例，產生出的檔案只保留 skill 的 frontmatter，以及導向唯一來源的指示：

```md
---
name: tech-blog-polish
description: Polish technical blog articles for this project...
---

# Canonical Skill

完整流程在 `.skills/tech-blog-polish/SKILL.md`。先讀該檔，再依其步驟執行。
```

這個設計刻意避開把完整內容複製三份。文章潤稿規則、Git 審查規則，甚至未來新增的流程，都只修改 `.skills/` 內的 `SKILL.md`。

`AGENTS.md` 也明確說出這個責任分工：

```md
Keep the complete workflow only in `.skills/<skill-name>/SKILL.md`.
`.claude/skills/` and `.agents/skills/` are generated native-discovery adapters.
```

> `.skills/` 是完整流程的唯一來源；原生 adapter 只負責讓工具找到它。

### 用腳本產生 adapter，讓失步變成可檢查的錯誤

Windows symlink 在不同開發環境仍可能遇到權限差異。因此這個專案用 Node.js 小腳本 `scripts/sync-skills.mjs` 產生檔案，而非依賴 symlink。

它會逐一讀取 `.skills/` 的子目錄，確認 `SKILL.md` 有 `name` 與 `description` frontmatter，再把精簡 adapter 寫到兩個原生探索位置：

```text
.skills/<name>/SKILL.md
  ├─> .claude/skills/<name>/SKILL.md
  └─> .agents/skills/<name>/SKILL.md
```

日常修改後跑：

```bash
npm run skills:sync
```

CI 或提交前則跑：

```bash
npm run skills:check
```

`--check` 不會寫檔。只要唯一來源的 skill frontmatter 或 adapter 內容沒有同步，它就會列出需要更新的檔案並以失敗結束。這讓「有人改了 `.skills/` 卻忘了更新 adapter」成為明確、可重現的問題。

## 2. 補充：Antigravity 與 Cursor 的使用方法

這兩個工具不需要複製另一份 skill。它們適合補上不同層次的工作方式：Antigravity 處理跨編輯器、終端機、瀏覽器的任務執行；Cursor 處理與特定檔案路徑綁定的即時規則。

### Antigravity：從 `AGENTS.md` 進入，交給 agent 完成整段任務

在 Antigravity 開啟這個專案時，我會先讓 agent 讀根目錄的 `AGENTS.md`。裡面的 skills 索引會指向 `.skills/`；任務命中後，agent 再讀對應的唯一來源 `SKILL.md`。這個順序讓專案指引、任務流程與工具操作各自有清楚的位置。

例如要更新一篇文章，我會直接交代任務範圍與驗證要求：

```text
更新中英文 Part 2，先讀 AGENTS.md 與命中的 skill，完成後跑 skills:check、npm run check、npm run build。
```

Antigravity 的 Manager Surface 適合這類需要編輯、跑指令與看預覽的長任務。完成後我會從它產生的計畫、截圖或瀏覽紀錄檢查結果，再決定是否送出下一輪修正。專案裡的 `.skills/` 不需要為它另開副本。

### Cursor：把檔案路徑觸發留給 `.cursor/rules`

Cursor 也能讀根目錄的 `AGENTS.md`，因此全專案的規則仍然只有一份。當需求和檔案位置有直接關係時，才在 `.cursor/rules/` 放一個短 adapter。例如文章被開啟或修改時，讓 Cursor 載入文章潤稿流程：

```mdc
---
description: Apply the blog writing workflow
globs: src/content/posts/**/*.md
alwaysApply: false
---

Read and follow `.skills/tech-blog-polish/SKILL.md` before editing this post.
```

英文文章可以用另一個相同概念的 rule，將 `globs` 指到 `src/content/posts-en/**/*.md`。這個 `.mdc` 檔只負責觸發，不重述文章結構、語氣與驗收細節；完整規則仍然在 `.skills/tech-blog-polish/SKILL.md`。

這樣分工後，Cursor 的自動附加規則解決「何時載入」，Antigravity 的 agent 任務解決「如何執行整段工作」，而 Claude Code 與 Codex 透過原生 adapters 解決「怎麼發現 skill」。四個工具都回到同一份流程。

## 結論：讓工具找到規則，也讓團隊只維護一份規則

AI 程式開發工具還會繼續變，skills 探索的目錄也可能不同。把流程直接複製到每個工具資料夾，長期一定會增加維護成本。

現在這個專案讓 `.skills/` 承擔完整內容，腳本產生 Claude Code 與 Codex 的原生 adapters，再用 `skills:check` 守住同步。新工具要加入時，我只需要新增一個輕量 adapter，不必搬動整套流程。

> 原生探索可以因工具而異；團隊共用的流程應該只有一個來源。

## 參考資料

- [OpenAI Codex：Agent Skills](https://developers.openai.com/codex/skills)
- [Anthropic：Agent Skills](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview)
- [Cursor：Rules](https://docs.cursor.com/context/rules-for-ai)
- [Google Antigravity：Agent 導向開發平台](https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/)
