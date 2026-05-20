---
title: "一份 AGENTS.md，讓多個 AI Coding Agent 共享專案規則（下）"
description: "用本部落格 repo 示範如何讓 AGENTS.md 成為共用入口，並把任務流程放進 .skills/，避免 Claude Code、Codex 與 Cursor 各自維護一份規則。"
date: 2026-05-20T00:00:00Z
authors: ["Luke Kong"]
categories: ["AI Agent"]
tags: ["AI Coding Agent", "AGENTS.md", "Agent Skills", "Claude Code", "OpenAI Codex", "Cursor"]
audience: "engineer"
image: "/images/post/ai-coding-agent-shared-instructions-cover.png"
---

上一篇先整理了官方文件的共同方向：`AGENTS.md` 可以成為 repo 的共用 project instructions。這一篇回到我自己的部落格 repo，說明最後實際怎麼放檔案。

- **[一份 AGENTS.md，讓多個 AI Coding Agent 共享專案規則（上）](/posts/ai-coding-agent-shared-instructions-agents-skills)**

我的目標很明確：

- project instructions 只維護一份
- task workflow 只維護一份
- 工具專屬檔案只做 adapter
- 團隊共用的內容進 git

這樣換工具時不用重寫規則。新的 AI coding agent 只要能讀到 repo 裡的入口，就能快速理解專案。

## 這個 repo 的最後結構

我最後把 repo 整理成這樣：

```text
AGENTS.md
CLAUDE.md
.skills/
  README.md
  tech-blog-polish/
    SKILL.md
  git-change-commit-review/
    SKILL.md
```

`AGENTS.md` 是唯一 project instructions。它放所有工具都應該知道的穩定資訊，例如 commands、verification、project structure、git workflow。

`CLAUDE.md` 只保留一行：

```md
@AGENTS.md
```

這樣 Claude Code 會匯入 `AGENTS.md`。`CLAUDE.md` 不再複製任何專案規則，也不會和 `AGENTS.md` drift。

Cursor 這邊，我刪掉原本的 `.cursor/rules/skills.mdc`。原因很單純：那份檔案和 `AGENTS.md` 寫的是同一件事。既然 Cursor 可以讀 root `AGENTS.md`，這個 repo 暫時不需要 `.cursor/rules`。

## AGENTS.md 放 repo 的穩定入口

目前 `AGENTS.md` 的角色是「讓 agent 進 repo 後先知道工作方式」。

我會放這些內容：

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

這些規則每天都會用到，而且不屬於任何單一工具。Codex 讀到它，Claude Code 讀到它，Cursor 讀到它，應該得到同一套結論。

接著再放 repo 結構：

```md
## Project Structure

- Blog posts live in `src/content/posts/`.
- English posts live in `src/content/posts-en/`.
- Shared agent skills live in `.skills/`.
- Static assets live in `public/`.
```

這段看起來很普通，但對 agent 很有用。它少猜一次目錄，就少一次亂翻檔案或改錯位置的機會。

## Skills 放任務流程

`AGENTS.md` 不適合放太長的任務流程。像文章潤稿、git diff review 這類流程，細節會很多，也不是每次工作都會用到。

所以我把它們放進 `.skills/`：

```text
.skills/
  tech-blog-polish/
    SKILL.md
  git-change-commit-review/
    SKILL.md
```

`tech-blog-polish` 處理文章潤稿。它會定義文章結構、讀者類型、語氣、要避免的 AI 味句型。

`git-change-commit-review` 處理 changed files review。它會規定要跑哪些 git checks、怎麼整理 staged / unstaged、怎麼判斷 commit 是否要拆分，以及 commit message 要怎麼寫。

`AGENTS.md` 只需要保留 skills index：

```md
## Shared Skills

Project skills live in `.skills/`.

Before handling a request, check whether it matches one of these skill descriptions:

- `.skills/tech-blog-polish/SKILL.md`
- `.skills/git-change-commit-review/SKILL.md`

When a request matches a skill, read that skill's `SKILL.md` and follow it as the source of truth for the task.
```

這樣 agent 不需要每次都讀完整 skills。它只要先看 `AGENTS.md`，等任務真的命中某個 skill，再打開對應的 `SKILL.md`。

> `AGENTS.md` 是入口，`.skills/` 是細節。入口要穩，細節要能獨立演進。

## 為什麼不直接放 .claude/skills 和 .agents/skills

Claude Code 和 Codex 都有各自的 skills discovery 路徑：

```text
.claude/skills/
.agents/skills/
```

如果要完全貼合工具預設，可以用 symlink 或同步方式把 `.skills/` 暴露到這些路徑：

```text
.claude/skills -> .skills
.agents/skills -> .skills
```

但我目前先不做這一步。原因是 Windows 上 symlink 可能需要 Developer Mode 或管理員權限，團隊環境不一定一致。對這個 repo 來說，用 `AGENTS.md` 明確告訴 agent 去讀 `.skills/`，已經足夠穩定。

等未來真的需要工具原生 skills discovery，再處理 adapter。先把 canonical source 定下來比較重要。

## 這次調整的 commit 規則

這次整理過程中，我也順手把 git workflow 寫清楚：

```md
## Git Workflow

- Use the git change review skill when reviewing changed files or proposing commit messages.
- Every commit must include both a subject and a body.
```

這條規則看起來小，但很實用。agent 很容易為了快速完成任務直接下單行 commit。把規則寫進 repo 後，每次 review changed files 或執行 commit，都會回到同一個標準。

這也是我希望 `AGENTS.md` 進 git 的原因。repo 的工作規則應該像程式碼一樣被 review，而不是散落在每個工具的個人設定裡。

## 何時才需要工具專屬規則

我現在的選擇不是永遠拒絕 `.cursor/rules`、`.claude/skills` 或 `.agents/skills`。比較好的判斷方式是看需求。

只有全 repo 共用規則時，用 `AGENTS.md`。

需要任務流程時，用 `.skills/<name>/SKILL.md`。

需要 Cursor 依檔案路徑自動套用不同規則時，再加入 `.cursor/rules`。

需要 Claude Code 或 Codex 原生 skills discovery 時，再用 symlink 或同步方式接到 `.skills/`。

這樣做可以讓 tool-specific adapter 晚一點出現，而且每次出現都有明確理由。

## 結論：先穩住規則本體

AI coding tools 還會繼續變。今天是 Cursor、Claude Code、Codex，明天可能又多一個新的 agentic IDE。

我不想每換一個工具，就重寫一份 repo 規則。更好的做法是讓 repo 自己帶著工作說明。新的工具進來時，先接到 `AGENTS.md`；任務流程需要更細，再讀 `.skills/`。

這套做法沒有一次吃下所有工具功能，但它先解決最重要的問題：規則本體只有一份。

> AI coding tools 會換，但 repo 的工作規則應該只維護一份。
