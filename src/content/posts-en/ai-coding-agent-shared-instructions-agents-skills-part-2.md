---
title: "One AGENTS.md for Multiple AI Coding Agents (Part 2)"
description: "A concrete example from this blog repo: AGENTS.md as the shared entry point, .skills/ as the canonical task workflow folder, and thin adapters for Claude Code, Codex, and Cursor."
date: 2026-05-20T00:00:00Z
authors: ["Luke Kong"]
categories: ["AI Agent"]
tags: ["AI Coding Agent", "AGENTS.md", "Agent Skills", "Claude Code", "OpenAI Codex", "Cursor"]
audience: "engineer"
image: "/images/post/ai-coding-agent-shared-instructions-cover.png"
---

In the previous post, I summarized the common direction from the official docs: `AGENTS.md` can be the shared project instruction entry point for a repo.

- **[One AGENTS.md for Multiple AI Coding Agents (Part 1)](/en/posts/ai-coding-agent-shared-instructions-agents-skills)**

This post uses my own blog repo as the concrete example. The goal is direct:

- maintain project instructions in one place
- maintain task workflows in one place
- keep tool-specific files as adapters
- check shared team rules into git

With this shape, switching tools does not mean rewriting the repo rules. A new AI coding agent only needs to find the repo entry point before it can start understanding the project.

## The Final Repo Structure

I ended up with this structure:

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

`AGENTS.md` is the only project instruction source. It contains stable information every tool should know: commands, verification, project structure, and git workflow.

`CLAUDE.md` contains one line:

```md
@AGENTS.md
```

This lets Claude Code import `AGENTS.md`. `CLAUDE.md` no longer copies project rules, so it cannot drift away from the canonical file.

For Cursor, I removed the old `.cursor/rules/skills.mdc`. That file repeated the same content as `AGENTS.md`. Since Cursor can read root `AGENTS.md`, this repo does not need `.cursor/rules` yet.

## AGENTS.md Is the Stable Entry Point

The job of `AGENTS.md` is to tell an agent how work is done in this repo.

I include rules like these:

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

These rules are not tied to one tool. Codex, Claude Code, and Cursor should all reach the same conclusion after reading them.

Then I add a short project structure section:

```md
## Project Structure

- Blog posts live in `src/content/posts/`.
- English posts live in `src/content/posts-en/`.
- Shared agent skills live in `.skills/`.
- Static assets live in `public/`.
```

This looks ordinary, but it saves the agent from guessing. Fewer guesses means fewer wrong edits.

## Skills Hold the Task Workflows

`AGENTS.md` should not become a long task manual. Workflows like article polishing and git diff review have many details, and they are not relevant to every task.

So I keep them in `.skills/`:

```text
.skills/
  tech-blog-polish/
    SKILL.md
  git-change-commit-review/
    SKILL.md
```

`tech-blog-polish` defines how I want technical articles refined: structure, audience, tone, and phrases to avoid.

`git-change-commit-review` defines how to review changed files: which git checks to run, how to separate staged and unstaged changes, when to split commits, and how to write commit messages.

`AGENTS.md` only needs a skills index:

```md
## Shared Skills

Project skills live in `.skills/`.

Before handling a request, check whether it matches one of these skill descriptions:

- `.skills/tech-blog-polish/SKILL.md`
- `.skills/git-change-commit-review/SKILL.md`

When a request matches a skill, read that skill's `SKILL.md` and follow it as the source of truth for the task.
```

The agent does not need to read every skill on every turn. It can start from `AGENTS.md`, then open the matching `SKILL.md` only when the task calls for it.

> `AGENTS.md` is the entry point. `.skills/` contains the details. The entry point should stay stable, and the details should evolve independently.

## Why I Did Not Add .claude/skills or .agents/skills Yet

Claude Code and Codex both have their own skill discovery paths:

```text
.claude/skills/
.agents/skills/
```

If I wanted to match those defaults exactly, I could expose `.skills/` through symlinks or a sync step:

```text
.claude/skills -> .skills
.agents/skills -> .skills
```

I am not doing that yet. On Windows, symlinks can require Developer Mode or administrator permissions, and team environments are not always identical. For this repo, explicitly pointing agents to `.skills/` from `AGENTS.md` is stable enough.

If native tool skill discovery becomes necessary later, I can add the adapter then. The first priority is keeping the canonical source clear.

## Commit Rules Belong in the Repo Too

During this cleanup, I also made the git workflow explicit:

```md
## Git Workflow

- Use the git change review skill when reviewing changed files or proposing commit messages.
- Every commit must include both a subject and a body.
```

This small rule matters. Agents can easily create a one-line commit when moving quickly. Once the rule lives in the repo, every review and commit goes back to the same standard.

This is also why I want `AGENTS.md` in git. Repo working rules should be reviewed like code, not scattered across personal tool settings.

## When Tool-Specific Rules Are Still Useful

I am not saying `.cursor/rules`, `.claude/skills`, or `.agents/skills` should never exist. I only add them when the need is real.

Use `AGENTS.md` when the rule applies to the whole repo.

Use `.skills/<name>/SKILL.md` when the rule is a repeatable task workflow.

Add `.cursor/rules` when Cursor needs path-scoped or trigger-specific behavior.

Expose `.skills/` through `.claude/skills` or `.agents/skills` when native skill discovery becomes important enough to justify the adapter.

This keeps tool-specific files late and intentional.

## Keep the Rule Source Stable

AI coding tools will keep changing. Today it is Cursor, Claude Code, and Codex. Tomorrow it may be another agentic IDE.

I do not want to rewrite repo rules every time I try a new tool. I want the repo to carry its own working instructions. A new tool should connect to `AGENTS.md` first, then read `.skills/` when it needs task-specific detail.

This setup does not use every feature from every tool. It solves the more important problem first: there is only one rule source to maintain.

> AI coding tools will change, but a repo's working rules should be maintained in one place.
