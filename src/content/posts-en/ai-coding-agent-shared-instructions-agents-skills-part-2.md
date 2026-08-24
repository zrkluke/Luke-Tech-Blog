---
title: "One AGENTS.md for Multiple AI Coding Agents (Part 2)"
description: "A concrete native-discovery adapter setup for Claude Code and Codex, plus practical roles for Antigravity and Cursor without duplicating workflows."
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

In the previous post, I summarized the common direction from the official docs: `AGENTS.md` can be the shared project instruction entry point for a repo. This post shows how I made Claude Code and Codex discover the same skills natively.

- **[One AGENTS.md for Multiple AI Coding Agents (Part 1)](/en/posts/ai-coding-agent-shared-instructions-agents-skills)**

> Update (2026-08-24): This repo now includes commit-ready native discovery adapters. `.skills/` remains the only full workflow source; `.claude/skills/` and `.agents/skills/` contain generated entry files only.

The goal is direct:

- maintain project instructions in one place
- maintain task workflows in one place
- keep tool-specific files as adapters
- check shared team rules into git

With this shape, switching tools does not mean rewriting the repo rules. I split the implementation into two parts: native discovery for Claude Code and Codex, then practical ways for Antigravity and Cursor to use the same repo rules.

## 1. Claude Code and Codex: One Workflow, Native Entry Points

`AGENTS.md` already lets an agent find `.skills/`. Native discovery makes the handoff smoother: when a tool scans its own skills directory, it can identify the matching workflow without a reminder in every prompt.

The finished structure looks like this:

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

`AGENTS.md` remains the project-instruction entry point for commands, verification, project structure, and git workflow. `CLAUDE.md` still imports it with one line:

```md
@AGENTS.md
```

The full task workflow lives in `.skills/<skill-name>/SKILL.md`. The matching files in the two tool directories are adapters, so Claude Code and Codex can find that same workflow through their native discovery paths.

### Write the Full Workflow Once

The adapter is deliberately short. For `tech-blog-polish`, the generated file contains its frontmatter plus a pointer to the canonical source:

```md
---
name: tech-blog-polish
description: Polish technical blog articles for this project...
---

# Canonical Skill

The complete workflow is in `.skills/tech-blog-polish/SKILL.md`. Read that file first.
```

This avoids copying the complete article-polish and git-review rules three times. Every update happens in `.skills/<skill-name>/SKILL.md`.

`AGENTS.md` makes the division of responsibility explicit:

```md
Keep the complete workflow only in `.skills/<skill-name>/SKILL.md`.
`.claude/skills/` and `.agents/skills/` are generated native-discovery adapters.
```

> `.skills/` is the only source of full workflows. Native adapters only help tools find it.

### Generate Adapters and Check for Drift

Windows symlinks can still vary by permissions and developer setup. This repo uses a small Node.js script, `scripts/sync-skills.mjs`, instead of depending on symlinks.

The script reads each `.skills/` subdirectory, confirms that `SKILL.md` has `name` and `description` frontmatter, then writes a small adapter to both native discovery locations:

```text
.skills/<name>/SKILL.md
  ├─> .claude/skills/<name>/SKILL.md
  └─> .agents/skills/<name>/SKILL.md
```

Run this after editing a canonical skill:

```bash
npm run skills:sync
```

Use this before a commit or in CI:

```bash
npm run skills:check
```

`--check` writes nothing. If an adapter is stale, it lists the files that need synchronizing and exits with an error. A forgotten sync step is now a reproducible failure instead of a quiet documentation mismatch.

## 2. Supplement: How Antigravity and Cursor Fit In

These tools do not need another copy of a skill. They fill different layers of the workflow: Antigravity runs a task across the editor, terminal, and browser; Cursor attaches rules at the moment a particular file path matters.

### Antigravity: Start at `AGENTS.md`, Then Hand the Whole Task to an Agent

When I open this repo in Antigravity, I start by having the agent read the root `AGENTS.md`. Its skills index points to `.skills/`, and the agent reads the matching canonical `SKILL.md` when a task calls for it. Project instructions, task workflow, and tool execution stay in separate, understandable places.

For an article update, I can give the agent a bounded instruction such as:

```text
Update the Chinese and English Part 2 posts. Read AGENTS.md and the matching skill first, then run skills:check, npm run check, and npm run build.
```

Antigravity's Manager Surface is a natural fit for a longer task that needs edits, terminal commands, and a preview. I review the plan, screenshots, or browser recordings it produces before deciding on another round of changes. The repo does not need a separate copy of `.skills/` for that flow.

### Cursor: Reserve `.cursor/rules` for File-Path Triggers

Cursor can also read root `AGENTS.md`, so repo-wide rules still have one source. I add a short adapter in `.cursor/rules/` only when a rule should load because of a file path. For example, when a blog post is opened or edited, Cursor can attach the writing workflow:

```mdc
---
description: Apply the blog writing workflow
globs: src/content/posts/**/*.md
alwaysApply: false
---

Read and follow `.skills/tech-blog-polish/SKILL.md` before editing this post.
```

English posts can use the same pattern with `globs` targeting `src/content/posts-en/**/*.md`. The `.mdc` file only decides when to load the workflow. Its structure, tone, and acceptance details still live in `.skills/tech-blog-polish/SKILL.md`.

With that split, Cursor's auto-attached rules answer when to load a workflow, Antigravity's agent task handles the end-to-end execution, and Claude Code and Codex use native adapters to discover the skill. All four tools return to the same workflow source.

## Conclusion: Let Tools Find Rules Without Duplicating Them

AI coding tools will keep changing, and so will their discovery directories. Copying full workflows into each tool folder creates maintenance work that compounds over time.

This repo keeps the complete content in `.skills/`, generates native adapters for Claude Code and Codex, and uses `skills:check` to protect that relationship. Adding another tool now means adding one thin adapter, not moving a whole workflow.

> Native discovery can vary by tool. A shared workflow should have one source.

## References

- [OpenAI Codex: Agent Skills](https://developers.openai.com/codex/skills)
- [Anthropic: Agent Skills](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview)
- [Cursor: Rules](https://docs.cursor.com/context/rules-for-ai)
- [Google Antigravity: agentic development platform](https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/)
