---
title: "One AGENTS.md for Multiple AI Coding Agents (Part 1)"
description: "How Codex, Claude Code, Antigravity, and Cursor can share one set of repo rules through AGENTS.md, .skills/, and thin adapters."
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

AI coding tools will keep arriving. Once Cursor, Claude Code, Codex, and Antigravity each bring a rule file into a repo, the rules often start saying different things after a few months.

I now treat the repo as the stable entry point: shared rules live in `AGENTS.md`, complete task workflows live in `.skills/`, and tool-specific files only handle discovery or scoped loading. Tools can change while the material the team maintains stays in the repo.

> Update (2026-08-24): This article now reflects this repo's native skill-discovery adapters. Continue to Part 2 for the implementation details and the Antigravity and Cursor workflows.

## 1. How Four Tools Connect to the Same Repo Rules

The entry point differs by tool, but the principle is the same: keep durable, cross-tool guidance in the repo and let tool-specific configuration handle only how it is loaded.

### Codex: `AGENTS.md` Is an Instruction Chain

Codex reads `AGENTS.md` before it works. It walks from the project root to the current working directory and layers instructions along the way. A nearer `AGENTS.md` or `AGENTS.override.md` appears later in the chain, so it can refine the more general rules above it.

This is a good place for repo-wide information:

- project structure and common commands
- build, type-check, and test expectations
- commit and review requirements
- the canonical source for shared skills

If `src/content/posts/` needs a local constraint, that directory can carry nearer instructions. The root `AGENTS.md` still gives every agent the same starting point when it enters the repo.

### Claude Code: Import the Same Instructions From `CLAUDE.md`

Claude Code uses `CLAUDE.md` as its default entry point. Since the shared repo rules already live in `AGENTS.md`, `CLAUDE.md` only needs the official import syntax:

```md
@AGENTS.md
```

This file only imports the instructions. Changes to commands, verification, or git workflow happen in `AGENTS.md`, and Claude Code receives the same version.

### Antigravity: Put Shared Rules Into an Executable Task Context

Antigravity is useful for a full task that crosses the editor, terminal, and browser. In this repo, I start a task by asking the agent to read `AGENTS.md`, then use the skills index to open the matching `.skills/<name>/SKILL.md`.

For an article update, the task can be as bounded as this:

```text
Update the Chinese and English posts. Read AGENTS.md and the matching skill first, then run skills:check, npm run check, and npm run build.
```

The agent can then edit, run commands, and launch a preview. I review the resulting plan, screenshots, or browser recordings before deciding on another round. This is an execution-layer convention; the repo still has one copy of the workflow in `.skills/`.

### Cursor: Use `AGENTS.md` for Shared Rules and `.cursor/rules` for Path Triggers

Cursor can use root `AGENTS.md` as straightforward project instructions. That covers rules that apply across the repo.

Add `.cursor/rules/*.mdc` only when a rule should load for a specific path. For example, a rule can attach the writing workflow when a post is opened or edited:

```mdc
---
description: Apply the blog writing workflow
globs: src/content/posts/**/*.md
alwaysApply: false
---

Read and follow `.skills/tech-blog-polish/SKILL.md` before editing this post.
```

This adapter answers when to load the workflow. It does not copy the article structure or tone rules. Cursor keeps its file-path behavior while the workflow remains in one place.

## 2. A Minimal Shared Strategy for the Repo

I separate rules into three layers: `AGENTS.md` holds stable instructions, `.skills/` holds complete task workflows, and tool folders hold generated or path-scoped adapters. Each file has one responsibility, and a review can quickly tell where a rule belongs.

```text
Luke-Tech-Blog/
├── AGENTS.md                 # project instructions
├── CLAUDE.md                 # imports AGENTS.md
├── .skills/                  # complete, canonical workflows
├── .claude/skills/           # generated native-discovery adapters
├── .agents/skills/           # generated native-discovery adapters
└── .cursor/rules/            # optional file-path triggers
```

Keep `AGENTS.md` short and stable:

```md
## Repository Expectations

- Keep the complete workflow only in `.skills/<skill-name>/SKILL.md`.
- `.claude/skills/` and `.agents/skills/` are generated native-discovery adapters.
- Run `npm run skills:sync` after changing skill frontmatter.
```

Put the details that evolve repeatedly in `.skills/`: the reader profile, structure, and voice for article polishing, or the check sequence and commit rules for git review.

When Claude Code and Codex need native discovery, generate and check the adapters:

```bash
npm run skills:sync
npm run skills:check
```

The first command updates generated files; the second only verifies their state. Drift becomes a clear failure that can be caught before a commit or in CI.

> A shared rule set lasts when every tool carries only the entry point it needs.

## Conclusion: Converge the Rules, Then Use Each Tool Well

The four tools have different strengths. Codex and Claude Code connect directly to shared instructions. Antigravity can execute a longer task and leave inspectable artifacts. Cursor can attach rules automatically by file path.

Once `AGENTS.md` and `.skills/` are established as the single sources of truth, additional tool integrations stop becoming a document-copying project.

The next post returns to this blog repo and shows the native discovery adapters for Claude Code and Codex, plus the Antigravity and Cursor workflows that use the same source.

- **[One AGENTS.md for Multiple AI Coding Agents (Part 2)](/en/posts/ai-coding-agent-shared-instructions-agents-skills-part-2)**

## References

- [OpenAI Codex: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [Claude Code: How Claude remembers your project](https://code.claude.com/docs/en/memory)
- [Cursor: Rules](https://docs.cursor.com/context/rules-for-ai)
- [Google Antigravity: agentic development platform](https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/)
