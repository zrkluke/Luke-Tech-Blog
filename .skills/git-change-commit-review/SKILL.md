---
name: git-change-commit-review
description: Review changed files and staged files, summarize what changed, propose commit messages, and decide whether changes should be split into multiple commits. Use when the user asks to review changes/files or asks for commit strategy, commit message, or commit split advice.
disable-model-invocation: true
---

# Git Change And Commit Review

## Goal

專門查看 changed files 與 staged files，幫使用者確認這些檔案做了哪些改變，判斷 commit message 該怎麼寫，以及是否要拆分多個 commit。

## Trigger phrases

當使用者提到以下同義詞時，優先套用此 skill：

- review變更
- review檔案
- 檢查變更
- 看看改了什麼
- 幫我看 staged
- 幫我看 changed files
- commit message 怎麼寫
- 要不要拆 commit
- 幫我規劃 commit

## Required git checks

每次執行此 skill，先跑這三組資訊：

1. `git status --short`
2. `git diff`（未 staged）
3. `git diff --staged`（已 staged）

若需要看提交風格，再加：
- `git log -5 --oneline`

## Analysis workflow

1. 列出 changed / staged 檔案清單，標註每個檔案狀態（新增、修改、刪除、rename）。
2. 逐檔案摘要「改了什麼」與「為什麼改」。
3. 依變更性質分組：
   - feature
   - fix
   - refactor
   - docs
   - test
   - chore
4. 判斷是否該拆 commit：
   - **應拆分**：一組變更同時混入多種目的（例如功能 + 格式化 + 重構）。
   - **可單一 commit**：所有檔案服務同一目標且可用一句話解釋。
5. 提供 commit message 建議：
   - 單 commit：給 1 個最推薦 message（含主旨與 1-2 句 body）
   - 多 commit：給每個 commit 的建議標題與納入檔案範圍

## Commit split decision rules

- 同一 commit 應該能回答「這個 commit 想解決哪一件事」。
- 如果 review 時需要不同脈絡才能理解，應拆分。
- 純機械性修改（format、rename、lint fix）應與邏輯修改分開。
- 若檔案互相依賴才能編譯/執行，可保持同一 commit，但需在訊息說明。

## Output format

使用以下結構回覆：

```markdown
## 變更摘要
- ...

## staged 與 unstaged 狀態
- staged: ...
- unstaged: ...

## 建議 commit 策略
- 單一 commit / 拆成 N 個 commit
- 理由: ...

## Commit message 建議
- Commit 1: ...
- Commit 2: ... (if needed)
```

## Message writing style

- 主旨要寫「目的」，不要只列檔名。
- 優先使用動詞開頭：add / fix / refactor / docs / chore / test。
- 簡短明確，避免空泛詞（update stuff, minor changes）。
- 一律使用中文撰寫 commit message，包含主旨與 body。
- 可保留 conventional commit type / scope 前綴，例如 `content(posts):`、`chore(cursor):`，但冒號後的描述要使用中文。

## Commit type convention for this repository

- 文章新增或文章改寫（`src/content/posts/`, `src/content/posts-en/`）優先用：`content(posts): ...`
- Cursor 規則、skill、設定檔（`.cursor/`）優先用：`chore(cursor): ...`
- 程式功能新增用：`feat(...): ...`
- 程式 bug 修正用：`fix(...): ...`
