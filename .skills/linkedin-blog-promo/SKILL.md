---
name: linkedin-blog-promo
description: Draft or refine LinkedIn posts that promote technical blog articles in Luke's conversational style. Use when the user asks for a LinkedIn intro, blog promotion copy, article teaser, launch post, repost caption, or CTA for a technical blog, especially when they provide an article, outline, draft, or example tone to preserve.
disable-model-invocation: true
---

# LinkedIn Blog Promo

## Goal

Write LinkedIn copy that makes a technical blog feel like it came from a real work discussion, not a generic article summary. Prioritize natural Traditional Chinese, concrete work context, one focused technical question, and a soft CTA into the article.

## Source-first rule

Read the provided article, outline, or draft before writing.

If article content is available in the workspace, inspect it first. Do not produce a generic LinkedIn template before reading the source material.

When the user provides their own final draft or preferred version, treat that as the strongest tone reference.

## Workflow

1. Identify the article's surface topic, deeper concept, and what should remain unsaid so readers still have a reason to click.
2. Draft from a conversational work moment: `最近在工作上...`, `最近跟同事討論...`, `前陣子在處理...`.
3. Build tension with one concrete question or mild contradiction.
4. Tease the deeper concept without fully explaining the article.
5. End with a soft invitation to read the full article.

## Preferred structure

Use this shape for most first-pass drafts:

```text
最近在工作上遇到一個 [topic] 問題。

[Brief concrete context: what data/system/workflow was being handled.]

[Most intuitive approach.]

後來跟同事討論時，他提到 [alternative or observation].

這時我腦中浮現一個問題：

[The core question in plain language.]

...

這個案例滿適合拿來討論一個常見的 [deeper concept]：
[Surface comparison], 但背後真正影響 [outcome] 的，是 [deeper mechanism].

---

我把這次 [work/optimization/debugging] 的經驗寫成文章。

想知道 [question 1]、[question 2]，以及 [question 3]，歡迎點進文章看 =D
```

Adjust the structure when the user asks for a different tone, shorter post, multiple variants, or a non-technical audience.

## Voice rules

- Write like a person sharing a recent work case, not like a polished marketing campaign.
- Prefer `最近在工作上...`, `後來跟同事討論...`, `這時我腦中浮現一個問題...` over abstract openings.
- Keep the author competent. Do not frame the discovery as if they just learned a basic concept for the first time.
- Use the case to introduce a concept the author already understands.
- Use `滿適合拿來討論...` or `剛好可以拿來拆...` for the transition into the lesson.
- Keep sentences short and scannable for LinkedIn.
- Use Mandarin technical terms naturally: `查詢效能`, `全表掃描`, `索引`, `語法`, `資料庫`, `比對`.
- Keep emotive punctuation light. A small `=D` is acceptable when it matches the user's style.

## LinkedIn formatting

- Do not use Markdown code formatting. LinkedIn will not render backticks as code.
- Write technical terms directly: LIKE, Regex, Seq Scan, CPU, I/O, GIN index.
- Use blank lines for readability.
- Avoid horizontal rules unless separating the CTA section; `---` is acceptable before the final article invitation when it matches the user's draft.
- Do not overuse bullets. This style works best as short paragraphs.

## Teaser discipline

The post may mention the deeper concept, but should not fully spoil the article's solution.

Good:

```text
乍看之下我們是在比較語法 LIKE 和 Regex，但背後真正影響查詢速度的，是資料庫有沒有索引可以走。
```

Too much for an early-series teaser:

```text
最後要把分號字串改成 text[]，再用 GIN index 和 array operators 把 Seq Scan 換成 Index Scan。
```

Use the first style for Part 1 or teaser posts. Use the second only when promoting the solution article itself.

## CTA patterns

Prefer soft invitations:

- `歡迎點進文章看 =D`
- `歡迎點進文章看完整整理`
- `我把這次經驗整理成文章，裡面有更完整的拆解。`
- `如果你也遇過類似問題，歡迎點進文章看看。`

Avoid hard-selling phrases:

- `千萬不要錯過`
- `必看`
- `保證讓你學會`
- `完整攻略都在這裡`

## Example style

Use this as the closest style reference:

```text
最近在工作上遇到一個 PostgreSQL 查詢效能問題。

起初我只是在做字串比對：
資料裡有一個欄位，儲存著一串用 ";" 接起來的標籤，例如 "tag_A;tag_B;tag_C"。查詢資料時需要篩選標籤，即判斷 tag 是否存在。

最直覺的寫法是 LIKE。

後來跟同事討論時，他提到可以把多個 LIKE 合成一個 Regex，效能通常會比較好。

這時我腦中浮現一個問題：

LIKE 跟 Regex 應該都是資料庫全表掃描，那同事怎麼會說 Regex 比較快？

...

這個案例滿適合拿來討論一個常見的效能問題：
乍看之下我們是在比較語法 LIKE 和 Regex，但背後真正影響查詢速度的，是資料庫有沒有索引可以走。

---

我把這次優化 PostgreSQL 效能的經驗寫成文章。

想知道 LIKE 和 Regex 到底差在哪、Regex 為什麼有時候會更快，以及它又解不了什麼問題，歡迎點進文章看 =D
```

## Output contract

- Return one ready-to-copy LinkedIn post in a fenced `text` block by default.
- Keep the copy in Traditional Chinese unless the user asks otherwise.
- If asked for options, provide 2-3 variants with distinct positioning.
- If useful, add one short note explaining the positioning choice after the copy.
