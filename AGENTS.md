# Agent Instructions

## Repository Expectations

- Follow the existing project structure and style before introducing new patterns.
- Keep shared agent skills in `.skills/`.
- Keep the complete workflow only in `.skills/<skill-name>/SKILL.md`.
- `.claude/skills/` and `.agents/skills/` are generated native-discovery adapters. Run `npm run skills:sync` after changing skill frontmatter; do not edit the generated files directly.
- Present every folder structure as a fenced `text` Markdown tree with an explicit root directory and consistent `├──`, `└──`, and `│` branches.

## Commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Type check: `npm run check`

## Verification

- Run `npm run build` after changing Astro, React, styling, or content rendering code.
- Run `npm run check` after changing TypeScript or Astro components.
- For documentation-only or skill-only changes, no build is required unless behavior changes.

## Project Structure

- Blog posts live in `src/content/posts/`.
- English posts live in `src/content/posts-en/`.
- Shared agent skills live in `.skills/`.
- Native-discovery adapters live in `.claude/skills/` and `.agents/skills/`.
- Static assets live in `public/`.

## Shared Skills

Project skills live in `.skills/`.

Claude Code and Codex discover the generated adapters in `.claude/skills/` and
`.agents/skills/`. After an adapter matches the task, read the corresponding
`.skills/<skill-name>/SKILL.md` for the complete workflow.

Before handling a request, check whether it matches one of these skill descriptions:

- `.skills/tech-blog-polish/SKILL.md`
- `.skills/linkedin-blog-promo/SKILL.md`
- `.skills/git-change-commit-review/SKILL.md`

When a request matches a skill, read that skill's `SKILL.md` and follow it as the source of truth for the task.

## Git Workflow

- Use the git change review skill when reviewing changed files or proposing commit messages.
- Every commit must include both a subject and a body.
