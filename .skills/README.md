# Shared Agent Skills

This directory is the canonical source for project skills shared by Cursor, Claude Code, and Codex.

Project instruction files point agents here:

- `AGENTS.md` for Codex
- `CLAUDE.md` imports `AGENTS.md` for Claude Code
- Cursor can read the root `AGENTS.md` as simple project instructions

Edit skill instructions only in `.skills/<skill-name>/SKILL.md`.
