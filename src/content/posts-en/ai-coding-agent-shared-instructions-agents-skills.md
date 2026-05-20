---
title: "One AGENTS.md for Multiple AI Coding Agents (Part 1)"
description: "Cursor, Claude Code, Codex, and Antigravity keep adding new ways to work with AI coding agents. Instead of maintaining separate rules for every tool, keep one canonical project instruction file in the repo."
date: 2026-05-20T01:00:00Z
authors: ["Luke Kong"]
categories: ["AI Agent"]
tags: ["AI Coding Agent", "AGENTS.md", "Claude Code", "OpenAI Codex", "Cursor"]
audience: "engineer"
image: "/images/post/ai-coding-agent-shared-instructions-cover.png"
---

AI coding tools have been arriving one after another.

Cursor (2023), Claude Code (February 2025), Codex CLI / Codex coding agent (April-May 2025), and even Google Antigravity (November 2025, which I have not used yet) all bring their own configuration files, rule formats, and workflows. At first, I also wondered whether every new tool meant learning a new setup, and whether every tool needed its own project instruction file.

I eventually changed the way I looked at the problem.

The repo should be the stable entry point. The tools should adapt to the repo. If a project contains one clear, version-controlled set of working rules, then Cursor, Claude Code, Codex, or the next tool should be able to understand how the project is installed, built, tested, written, and committed.

> AI coding tools will change, but a repo's working rules should be maintained in one place.

Note: in this article, Codex refers to the Codex CLI / Codex coding agent that OpenAI introduced in 2025, not the 2021 OpenAI Codex code generation model.

## More Tools, More Drift

The worst situation for an AI coding agent is not that it cannot write code. It is that it follows an outdated project rule.

This usually happens quietly. Maybe the project started with Cursor, so you created `.cursor/rules`. Later, you tried Claude Code and added `CLAUDE.md`. Then you tried Codex and added `AGENTS.md`. Each file made sense when it was created, but after a few months, they no longer say the same thing.

For example:

- `AGENTS.md` says every commit needs a body
- `CLAUDE.md` still describes the old single-line commit style
- `.cursor/rules` contains an outdated test command
- skill instructions have been copied into several tool-specific folders

This kind of drift is hard to fix with memory. People forget to update documentation, and an agent can only follow the files it reads. When the same repo gives different tools different rules, the development workflow becomes the thing that breaks.

My direction is simple: keep one project instruction source in the repo. When a tool needs its own entry file, make that file an adapter.

## The Official Docs Point in the Same Direction

After reading the official docs for Claude Code, Codex, and Cursor, I found that their file formats differ, but the architecture can still converge.

### Codex: Use AGENTS.md for Project Instructions

Codex treats `AGENTS.md` as the main project instruction entry point. It is a good place for stable repo rules such as:

- project structure
- common commands
- coding conventions
- verification steps
- PR and commit expectations

Codex also supports a root `AGENTS.md` plus nested `AGENTS.override.md` files. If a subdirectory needs special rules, that directory can contain an override file, and the rules closer to the working directory take higher priority.

This is a good fit for stable, repo-wide expectations. It is not where I would put a long task workflow, because task-specific details grow quickly and make the entry file harder to maintain.

### Claude Code: Import AGENTS.md From CLAUDE.md

Claude Code reads `CLAUDE.md` by default. If the repo already has `AGENTS.md`, the official docs recommend importing it from `CLAUDE.md`:

```md
@AGENTS.md
```

This detail matters. Writing only `AGENTS.md` inside `CLAUDE.md` may look like a hint to the model, but it is not the official import syntax. Using `@AGENTS.md` turns `CLAUDE.md` into a thin adapter.

The actual project instructions still live in `AGENTS.md`.

### Cursor: Root AGENTS.md Is Enough for Simple Cases

Cursor primarily recommends `.cursor/rules`, because rules can do more advanced things: always apply, attach by file path, or be requested by the agent.

Cursor also supports root `AGENTS.md` as simple project instructions. For a repo that only needs one project-wide rule set, that is enough. If the project later needs different rules for `src/content/posts/`, `src/components/`, or `infra/`, then `.cursor/rules` can be added with a clear reason.

My default choice is to let `AGENTS.md` carry the shared entry point first. Cursor rules can come in when I actually need path-scoped or trigger-specific behavior.

## A Minimal Shared AGENTS.md Strategy

`AGENTS.md` should answer one question: how does this repo expect work to be done?

I keep it short and stable:

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

These rules are stable. They should not change just because I use Claude Code today and Codex tomorrow.

Then the tool-specific files become adapters:

```text
AGENTS.md       # the only project instruction source
CLAUDE.md       # @AGENTS.md
.cursor/rules   # add only when advanced Cursor rules are needed
```

Now the repo has only one project instruction file to maintain. Claude Code imports it through `CLAUDE.md`. Cursor and Codex can read it directly.

> Tools can have their own adapters, but the rule source should not split.

In the next post, I will use this blog repo as the concrete example: `AGENTS.md` as the stable entry point, `.skills/` for task workflows, and one shared setup that Claude Code, Codex, and Cursor can all follow.

- **[One AGENTS.md for Multiple AI Coding Agents (Part 2)](/en/posts/ai-coding-agent-shared-instructions-agents-skills-part-2)**

## References

- [OpenAI Codex: Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- [OpenAI Codex: Agent Skills](https://developers.openai.com/codex/skills)
- [Claude Code: Memory](https://code.claude.com/docs/en/memory)
- [Claude Code: Skills](https://code.claude.com/docs/en/agent-sdk/skills)
- [Cursor: Rules](https://docs.cursor.com/context/rules-for-ai)
- [Google Developers Blog: Build with Google Antigravity](https://developers.googleblog.com/en/build-with-google-antigravity-our-new-agentic-development-platform/)
- [OpenAI: Introducing Codex](https://openai.com/index/introducing-codex/)
- [TechCrunch: Anysphere raises $8M from OpenAI to build an AI-powered IDE](https://techcrunch.com/2023/10/11/anysphere-raises-8m-from-openai-to-build-an-ai-powered-ide/)
- [TechCrunch: Anthropic launches Claude Code research preview](https://techcrunch.com/2025/02/24/anthropic-launches-a-new-ai-model-that-thinks-as-long-as-you-want/)
