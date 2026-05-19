---
title: "善用 AI Coding Agent（上）：當 Branch 不足以支撐多 Agent 協作"
description: "從 IDE 局部協作，到讓 AI Coding Agent 執行長時間任務，我才發現只開 branch 還不夠，Agent 真正需要的是互不干擾的工作資料夾。"
date: 2026-05-19T02:00:00Z
authors: ["Luke Kong"]
categories: ["AI Agent"]
tags: ["AI Coding Agent", "Git", "Cursor", "Claude Code", "OpenAI Codex"]
audience: "non-technical"
image: "/images/post/ai-coding-agent-git-worktree-cover.png"
---

AI Coding Agent 已經不只是「幫忙補程式碼」的工具。

我自己也付費使用多個 AI Coding 工具，包含 Cursor、Anthropic Claude Code、OpenAI Codex。這些工具的介面不同，但能力越來越接近：它們可以讀專案、改檔案、跑測試、修錯，甚至花一段時間完成一個比較完整的任務。

這讓我的使用方式開始改變。以前我把 AI 放在 IDE 裡，像一個隨叫隨到的助手；後來我開始把 Agent 當成可以接任務的人。這個轉變聽起來很小，實際上會改變整個工作流程。

> 當 Agent 可以長時間工作，我們要管理的不只指令，也包含它正在使用哪一份專案檔案。

這篇是「善用 AI Coding Agent」系列的上篇。我想先記錄一個實際遇到的問題：當我開始讓 Agent 跑長時間任務，原本靠 Git branch 切換的做法很快就不夠用了。

## 從局部修改開始

我一開始跟 AI 協作的方式，和很多開發者差不多：在 IDE 裡圈選一段程式碼，然後請 AI 幫我做局部修改。

例如：

- 幫我重構這個 function
- 幫我補上 TypeScript 型別
- 幫我解釋這段邏輯
- 幫我把這個 API call 改成另一種寫法
- 幫我補測試

這種方式非常直覺，也很有效。因為操作單位很小，風險也相對容易控制。AI 改完之後，我看一下 diff，覺得可以就接受，不行就退掉。

這個階段的工作方式很單純：我知道現在要改哪裡，AI 只負責處理我指定的那一小塊。它像是加速器，幫我把手上的工作做快一點。

當任務只有幾分鐘，這樣非常夠用。專案目前在哪個狀態、改了哪些檔案、要不要接受修改，都還在我的掌控範圍內。

## 長時間任務改變了問題

後來我在做 Prompt Engineering 相關工作時，遇到一類很適合交給 Agent 的任務：長時間評估。

例如：

- 跑一批 prompt 評估案例
- 比較不同 prompt 版本的輸出品質
- 調整 evaluator 或 LLM-as-a-judge 的判斷邏輯
- 根據測試結果反覆修改 prompt
- 整理 trace 或測試報告

這類任務通常不會改一個地方就結束。Agent 需要讀專案、跑指令、看結果、修改檔案，再重新驗證。時間可能從幾分鐘拉長到半小時甚至更久。

問題出現在等待期間。當一個 Agent 正在跑 prompt evaluation，我自己還想繼續開發新功能，或再開另一個 Agent 去修 bug。

當時我的想法很直接：

> 能不能讓一個 Agent 在背景處理長時間任務，同時我繼續在另一個分支上開發？

直覺答案是開新 branch。

## Branch 看起來可以解決

我一開始也是這樣做的。

假設現在有一個主要專案資料夾：

```text
luke-tech-blog/
```

我可以為長時間任務開一個 branch：

```bash
git checkout -b agent/prompt-eval
```

然後讓 Agent 在這個 branch 上執行 prompt 評估。

如果你不熟 Git，可以先把 branch 想成「同一個專案的不同版本路線」。一條路線用來做 prompt 評估，另一條路線用來開發新功能，聽起來很合理。

接著我想繼續開發新的搜尋頁面：

```bash
git checkout -b feature/search-page
```

這個瞬間，問題才真的浮出來。

同一個專案資料夾，一次只能顯示一個 branch 的檔案。當我從 `agent/prompt-eval` 切到 `feature/search-page`，目前資料夾裡的檔案也會跟著換成另一個版本。

這代表正在執行長時間任務的 Agent，看到的專案檔案被我換掉了。

對人類來說，這件事很好理解：我剛剛切了 branch，所以檔案換了。對正在工作的 Agent 來說，它只知道目前資料夾裡的檔案突然變了。它剛剛讀過的內容、跑過的測試、接下來準備修改的檔案，都可能和新的狀態對不上。

可以把它想像成同一張辦公桌上有兩個人在工作。Agent A 正在整理一份報告，我突然把整張桌子的文件換成另一個專案。Agent A 沒有離開，但它眼前的東西已經不是剛剛那一份了。

> Branch 可以分開專案的不同版本路線，但沒有替每個 Agent 準備自己的工作桌。

## 問題其實在工作空間

這次經驗讓我重新理解問題。

我需要的結構是：

- 同一個專案
- 不同 branch
- 不同資料夾
- 每個資料夾可以同時存在
- 我切換其中一個資料夾時，不影響另一個 Agent

理想上，我希望專案可以長這樣：

```text
luke-tech-blog/
  main

luke-tech-blog.prompt-eval/
  agent/prompt-eval

luke-tech-blog.search-page/
  feature/search-page
```

這樣我就可以把不同任務分配到不同目錄：

```text
Agent A -> luke-tech-blog.prompt-eval
Agent B -> luke-tech-blog.search-page
```

每個 Agent 都有自己的 branch，也有自己的資料夾。長時間任務不會因為我切 branch 被中斷，不同 Agent 的修改也不會混在同一個地方。

這是多 Agent 協作第一個很務實的限制：任務可以平行，工作空間也要能平行。

下一篇，我會接著介紹我後來改用的解法：Git worktree。它可以讓同一個專案在不同資料夾同時打開不同 branch，也讓每個 Agent 有自己的工作桌。

### 小結

> 當 Agent 開始承接長時間任務，每個 Agent 都需要一個不會被別人突然換掉的工作資料夾。

- **[善用 AI Coding Agent（下）：用 Git Worktree 替每個 Agent 建立獨立工作區](/posts/ai-coding-agent-git-worktree-solution)**
