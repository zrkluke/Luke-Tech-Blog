---
name: tech-blog-polish
description: Polish technical blog articles for this project using a strict four-part structure (Introduction, Development, Transition, Conclusion). Use when refining software and AI articles for either engineer readers or non-technical readers.
disable-model-invocation: true
---

# Luke Tech Blog Writing Polish

## Goal

Turn draft content into a clear, persuasive article with strict `起承轉合` structure.
Keep the original core idea, but improve readability, logic flow, and audience fit.

## Required four-part flow (no literal 起承轉合 labels)

- Keep the four-part logic, but do not output headings literally as `起` `承` `轉` `合`.
- Use reader-friendly subheadings that match the article topic.
- Example heading sets:
  - `問題背景` -> `關鍵分析` -> `觀點轉折` -> `重點總結`
  - `The setup` -> `What we found` -> `A different angle` -> `Takeaways`

### 起 (Introduction)
- Function: state topic, provide context, trigger curiosity.
- Content: quickly introduce core claim and context (time/place/person/problem).
- Techniques:
  - Direct opening: state topic immediately.
  - Quotation opening: use a relevant quote for authority.
  - Suspense opening: ask a counterintuitive question.

### 承 (Development)
- Function: carry the opening claim and explain in depth.
- Content: provide evidence, examples, and concrete scenarios.
- Techniques:
  - Concrete detail: convert abstract ideas into story or scene.
  - Data support: cite objective numbers or expert viewpoints.
  - Layered explanation: break down points as first, second, third.

### 轉 (Transition)
- Function: shift perspective, add reflection, avoid a flat argument.
- Content: expose blind spots, add counter-views, or switch reasoning angle.
- Techniques:
  - Counterfactual: what if the opposite happened?
  - Perspective switch: re-check from other roles or long-term view.
  - Reflection and lift: move from event-level to principle-level insight.

### 合 (Conclusion)
- Function: close the loop, summarize, and elevate.
- Content: restate main thesis and final takeaway.
- Constraint: do not introduce new major arguments here.
- Techniques:
  - Echo opening: connect back to the opening idea.
  - Concise summary: recap key points.
  - Insight/call: provide reflection, encouragement, or invitation to action.

## Audience-specific writing mode

### Audience decision source of truth

- Read article frontmatter first.
- If `audience` exists, use it as the writing mode source of truth.
- Allowed values: `engineer`, `non-technical`.
- If `audience` is missing, ask the user before polishing.

### Mode A: Engineers
- Tone: precise, practical, and problem-solving.
- Use more technical vocabulary, but keep sentence structure clean.
- Emphasize:
  - Problem definition and constraints
  - Design decisions and trade-offs
  - Complexity analysis (time/space) and scaling behavior
  - System design thinking (CAP, reliability, consistency, and operability)
  - Implementation details and pitfalls
  - Why this approach works in real projects
- Preferred evidence:
  - Code snippets, architecture choices, complexity/performance notes
  - Real incident, debugging process, benchmark, or measurable result
- Complexity analysis rules:
  - Always state time complexity using Big-O for key operations.
  - State space complexity when memory usage is relevant.
  - Compare at least one alternative approach and explain trade-offs.
  - Explain practical cost, not only asymptotic notation (constants, IO, network, cache effects).
  - If complexity cannot be exact, provide reasoned upper bound and assumptions.
- System design analysis rules:
  - For distributed or service-level topics, discuss CAP trade-offs explicitly (choose two under partition and justify).
  - Clarify consistency model assumptions (strong/eventual/read-your-writes) and user impact.
  - Analyze availability and failure modes (timeouts, retries, idempotency, backpressure, circuit breaking).
  - Include scalability path (vertical vs horizontal, sharding/partitioning, caching strategy).
  - Explain observability and operations plan (SLO/SLI, key metrics, logs, tracing, alert signals).

### Mode B: Non-technical readers
- Tone: plain language, guided, low jargon.
- Explain terms immediately using analogy or everyday examples.
- Emphasize:
  - What the technology is
  - Why it matters in daily life or work
  - Practical use cases and expected value
  - Limits, risks, and realistic expectations
- Preferred evidence:
  - Scenarios, comparisons, simple numbers, and tangible outcomes

## Voice and style standards (human-sounding)

- Write like a real engineer sharing field experience, not a formal AI narrator.
- Prefer concrete verbs and direct statements over abstract slogans.
- Keep confidence grounded: explain why with one clear reason or example.
- Allow short natural sentences; do not force every sentence into textbook structure.
- Use topic-specific wording, avoid reusable generic phrases.
- Tone baseline: sincere sharing, sharp diagnosis, direct but respectful.
- Be candid about problems, but avoid blameful or mocking language.
- State the issue in one sentence first, then explain context.

### Phrases to avoid (AI-like)

- `關鍵在於...`
- `本質上...`
- `值得注意的是...`
- `總而言之...`
- `不是A，而是B` (overused rhetorical frame)

### Rewrite preference

- Replace abstract lines with concrete action/result wording.
- Example:
  - Less human-like: `關鍵不在語法，而在是否改變存取路徑。`
  - Preferred: `真正差別不在你把 SQL 寫得多漂亮，而是你有沒有讓資料庫改走索引那條路。`

## Highlight rule: use blockquote for key takeaway

- Use blockquote to highlight one final takeaway sentence when the section closes.
- Keep the heading outside the blockquote for clean visual hierarchy.
- Preferred pattern:
  - `### 結論`
  - `> [single key takeaway sentence]`
- Keep blockquote short: one sentence (max two).
- Do not place lists, code blocks, or long paragraphs inside the quote.

### Final tone check before output

1. Remove at least 1 generic abstract sentence if found.
2. Ensure at least 1 sentence sounds like firsthand experience or practical judgment.
3. Read one paragraph aloud mentally; if it sounds like a report template, rewrite it.
4. Ensure wording is direct and clear, but not hurtful.

## Execution checklist

When polishing an article, follow this order:

1. Identify target audience (`engineer` or `non-technical`).
   - First read frontmatter `audience` and follow it.
   - If not present, ask user to decide before continuing.
2. Rebuild the article into a four-part flow with custom semantic headings.
3. Ensure each section has a distinct role and no repetition.
4. Adjust wording to the selected audience mode.
5. Apply voice and style standards to remove AI-like phrasing.
6. Remove empty claims; add evidence, example, or reasoning.
7. Tighten sentences: one paragraph, one purpose.
8. Finish with a conclusion that echoes the opening.

## Output contract

- Keep the original author intent and opinion.
- Improve structure first, then wording.
- Use Traditional Chinese by default unless user asks otherwise.
- If source content is too short, propose a draft expansion for each section.
