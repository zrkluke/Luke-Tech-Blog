---
title: "善用 AI Coding Agent（下）：用 Git Worktree 替每個 Agent 建立獨立工作區"
description: "Git worktree 可以替不同 branch 建立不同工作目錄，讓多個 AI Coding Agent 在檔案層級彼此隔離，適合長時間任務與多 Agent 並行開發。"
date: 2026-05-19T01:00:00Z
authors: ["Luke Kong"]
categories: ["AI Agent"]
tags: ["AI Coding Agent", "Git", "Git Worktree", "Cursor", "Claude Code", "OpenAI Codex"]
audience: "engineer"
image: "/images/post/ai-coding-agent-git-worktree-cover.png"
---

上一篇提到，我一開始想用 branch 解決多 Agent 協作的問題，後來發現單一 working directory 會把所有人綁在同一個 checkout 狀態上。

- **[善用 AI Coding Agent（上）：當 Branch 不足以支撐多 Agent 協作](/posts/ai-coding-agent-branch-is-not-enough)**

當一個 Agent 正在某個 branch 上跑長時間任務時，如果我在同一個資料夾切到另一個 branch，Agent 實際看到的檔案也會跟著改變。這會讓它的上下文、測試結果、接下來要修改的檔案互相對不上。

我後來採用的解法是 Git worktree。它剛好提供我要的結構：

> 同一個 repo，可以在不同資料夾同時打開不同 branch。

> Worktree 把 branch 從單一 checkout 狀態中拆出來，讓每個 Agent 都有自己的檔案現場。

## Worktree 的模型

Git worktree 可以讓同一個 Git repository 擁有多個 working tree。

簡單說，它可以替不同 branch 建立不同的工作目錄。

它不是重新 clone 一份 repository。這些 worktree 仍然共享同一份 Git 物件資料庫，但每個 worktree 都有自己的檔案目錄與 checkout 狀態。

用白話說：

```text
project/
  main

project.prompt-eval/
  agent/prompt-eval

project.search-page/
  feature/search-page
```

每個目錄都有自己的 checkout 狀態。你在 `project.search-page` 修改檔案，不會改到 `project.prompt-eval` 的 working directory。

從成本角度看，worktree 不是免費的。每個 worktree 都會有一份實際檔案，空間複雜度可以粗略視為 O(s)，s 是 working tree 展開後的檔案大小。它共享 Git object database，所以通常比完整 clone 省，但 `node_modules`、build cache、`.env`、產物目錄仍然各自存在。

建立或切換 worktree 的時間成本主要來自 checkout 檔案，粗略是 O(n)，n 是需要寫入工作目錄的檔案數。實務上，這筆成本換來的是更穩定的隔離邊界：長時間任務不會被另一個 branch checkout 打斷。

## 建立 Agent 專用工作區

假設我現在在主專案目錄：

```bash
cd luke-tech-blog
```

我想替 prompt evaluation 任務建立一個新的 branch 和工作目錄，可以執行：

```bash
git worktree add ../luke-tech-blog.prompt-eval -b agent/prompt-eval
```

這個指令做了兩件事：

1. 建立一個新的 branch：`agent/prompt-eval`
2. 建立一個新的工作目錄：`../luke-tech-blog.prompt-eval`

接著我就可以進入那個目錄：

```bash
cd ../luke-tech-blog.prompt-eval
```

從這一刻開始，這個資料夾就是 `agent/prompt-eval` branch 的工作空間。

原本的 `luke-tech-blog` 目錄仍然可以停在 `main` 或其他 branch，不會被這個任務影響。

如果 branch 已經存在，只是想替它建立一個工作目錄，可以這樣做：

```bash
git worktree add ../luke-tech-blog.search-page feature/search-page
```

這會把 `feature/search-page` checkout 到 `../luke-tech-blog.search-page`。

之後你就可以讓另一個 Agent 在這個資料夾工作。

## 管理 Worktree

可以用這個指令查看目前 repository 連到哪些 worktree：

```bash
git worktree list
```

輸出大概會像這樣：

```text
/Users/luke/projects/luke-tech-blog                    abc1234 [main]
/Users/luke/projects/luke-tech-blog.prompt-eval        def5678 [agent/prompt-eval]
/Users/luke/projects/luke-tech-blog.search-page        789abcd [feature/search-page]
```

任務完成、branch merge 之後，可以移除 worktree：

```bash
git worktree remove ../luke-tech-blog.prompt-eval
```

如果手動刪掉資料夾，Git 可能還保留著 worktree 紀錄。這時可以執行：

```bash
git worktree prune
```

這會清掉已經不存在的 worktree 紀錄。

### 指令小結

> 日常使用先記住三個指令就夠：`git worktree add`、`git worktree list`、`git worktree remove`。

## 我的多 Agent 分配方式

使用 Git worktree 之後，我的多 Agent 工作流會變成這樣：

```bash
git worktree add ../project.prompt-eval -b agent/prompt-eval
git worktree add ../project.search-page -b agent/search-page
git worktree add ../project.refactor-card -b agent/refactor-card
```

然後我會把任務講清楚：

```text
你在 ../project.prompt-eval 這個 worktree 工作。
請專注處理 prompt evaluation 任務。
不要修改 UI、部署設定或無關的資料結構。
完成後請回報修改檔案、測試結果與風險。
```

另一個 Agent 則可能是：

```text
你在 ../project.search-page 這個 worktree 工作。
請實作搜尋頁面的前端功能。
不要修改 prompt evaluation 相關檔案。
完成後請執行 build，並整理主要 diff。
```

這裡要建立的是一個可重複的工作流：

- 一個 Agent 對應一個明確任務
- 一個任務對應一個 branch
- 一個 branch 對應一個 worktree
- 每個 worktree 有自己的檔案狀態

這個規則可以降低 review 成本。每個 worktree 最後對應一組 diff，工程師可以用一般 Git 流程看變更、跑測試、決定 merge 順序。

## 它解決的痛點

Git worktree 最直接解決的是檔案工作區被互相影響的問題。

在單一資料夾裡，切 branch 會改變整個 working directory。你、Agent A、Agent B 共用同一個檔案現場；只要其中一方切 branch，其他工作都會受影響。

使用 worktree 之後，每個 Agent 都有自己的桌子：

```text
project/
  main

project.prompt-eval/
  agent/prompt-eval

project.search-page/
  agent/search-page

project.refactor-card/
  agent/refactor-card
```

這帶來幾個好處：

- 長時間任務不會因為你切 branch 被中斷
- 不同 Agent 的修改不會混在同一個 working directory
- 每個任務的 diff 更容易 review
- 可以保留一個乾淨的主工作區
- 多個 Agent 才真的有機會平行工作

### 工作流小結

> Worktree 不會讓 merge conflict 消失，但它會讓每個 Agent 在任務執行期間擁有穩定的檔案世界。

## 人類負責協調邊界

AI Coding Agent 變強之後，人類的工作開始往協調者靠近。

我現在更常做這些事：

- 定義任務邊界
- 選擇適合交給 Agent 的工作
- 分配不同 worktree
- 限制修改範圍
- 要求 Agent 執行驗證
- Review diff
- 決定哪些變更可以 merge

Git worktree 的價值就在這裡。它提供工程流程需要的隔離邊界，讓多個 Agent 可以同時工作，也讓人類保留 review、驗證、整合的控制權。

## 常見注意事項

使用 worktree 時，有幾個地方要注意。

第一，同一個 branch 通常不能同時被兩個 worktree checkout。這是 Git 的保護機制，避免同一條工作線在兩個地方同時被修改。

第二，不要直接把 worktree 建在原本 repo 的子目錄裡。否則有些工具在搜尋、格式化、跑測試時，可能會把其他 worktree 也掃進去。

我會比較建議這種結構：

```text
projects/
  luke-tech-blog/
  luke-tech-blog.prompt-eval/
  luke-tech-blog.search-page/
  luke-tech-blog.refactor-card/
```

第三，多個 worktree 可能各自需要安裝 dependencies。即使它們共享 Git 物件，工作目錄裡的 `node_modules`、build cache、`.env` 等檔案仍然要自己管理。

第四，worktree 只能隔離工作空間，不能消除 merge conflict。

如果兩個 Agent 同時修改同一個核心檔案，最後合併時還是可能衝突。Worktree 能避免工作期間互相踩檔案狀態，任務邊界仍然要由人類先設計好。

我會優先把這些任務分到不同 worktree：

- 長時間評估任務
- 不同 feature 的開發
- bug fix
- 文件更新
- 測試補強
- UI 與 backend 可以明確分開的修改
- refactor 範圍清楚的小型重構

我會避免同時平行丟出這些任務：

- 多個 Agent 同時重構同一個核心 abstraction
- 多個 Agent 同時修改 shared schema
- 多個 Agent 同時調整全域設定
- 任務描述只有「幫我優化整個專案」

## 小結

當 AI Coding Agent 只幫我們改一小段程式碼時，單一 IDE、單一工作目錄通常就夠了。當 Agent 開始執行長時間任務，甚至多個 Agent 同時處理不同 feature，工作空間管理會變成第一個要補上的工程環節。

Git worktree 提供了一個很實用的基礎。每個 Agent 有自己的 branch 與資料夾，不同任務在檔案層級被隔離；人類負責定義任務、檢查結果、整合變更。

### 結論

> 善用 AI Coding Agent 的第一步，是替每個長時間任務安排穩定、可驗證、可回收的工作空間。
