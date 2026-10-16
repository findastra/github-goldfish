# CLAUDE.md

Read [AGENTS.md](AGENTS.md) first; it holds the rules for this repo and applies to every assistant.

Quick reminders for Claude:

- One-file app: the engine is `<script id="engine">` in `index.html`. Run `node --test test/` after every change to it.
- Do not add dependencies, storage for the token, or `innerHTML` for fetched text.
- After editing `sprite.json`, run `node scripts/sync-sprite.mjs`.
- Record your model name and version in AGENTS.md when you change something substantial (currently: Claude Opus 5.5, 2026-10-09).
- Do not push to `main` without Astra's OK.

The local README auditor was added by OpenAI Codex (GPT-6), 2026-10-15. Read
[its workflow and limits](docs/readme-auditor-20261015.md) before changing it.
Its separate Node companion is the approved exception to the browser-only app;
it uses no third-party Node packages and never merges profile changes.
