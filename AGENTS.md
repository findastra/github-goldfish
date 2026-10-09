# Rules for assistants working on GitHub Goldfish

*A pet app by Astra.* Public credit is always **Astra**, never a legal name.

Built with Claude Sonnet 5.5 (`claude-sonnet-5-5`), 2026-10-07. Record the model name and version here whenever a different assistant changes this repo.

## What this is
A single-file browser app (`index.html`) plus a small command-line wrapper. It fetches a GitHub account's public repos and audits every public word. The audit engine lives in `<script id="engine">` inside `index.html`; the page UI is `<script id="app">`. Tests and the CLI lift the engine out of the HTML, so there is one copy of the logic.

## Rules
- **Keep it one file and zero dependencies.** No bundler, no npm packages. Node's built-in test runner only.
- **Never put a token, key, `.env` or personal data in the repo.** The GitHub token field is memory-only; do not add storage for it.
- **Treat everything fetched from GitHub as untrusted text.** The UI must only use `textContent` / `href` assignments for repo text, never `innerHTML`.
- **Public-facing credit is Astra.** Keep work information (including any employer's name) out of this repo.
- **Every new check needs a test** in `test/engine.test.mjs`, including a "does not fire" case (code blocks, URLs, placeholders such as `<you>`).
- **Prefer a quiet check to a noisy one.** A false alarm on a clean account costs trust. When unsure, use severity `note`.
- **`sprite.json` is the source of truth** for the pixel twin (32×32, nine moods), copied from the Cage repo's art. After editing it run `node scripts/sync-sprite.mjs`; a test fails if they drift. Do not redraw it by hand here; the style lives in `findastra-pet-apps/scripts/pets-art.mjs`.
- Finding categories are exactly: Document control, Blatant, Organizational, Systemic. Severities: error, warn, note.
- Claims about the present need a source or a date. Say plainly what is not done (see README "Limits").

## House conventions the goldfish enforces (and the repo itself follows)
- Repo and folder names: lowercase words joined by hyphens. README title is the same words in Title Case.
- Every pet repo: `pet.json`, topic `pet-app`, README opening with `*A pet app by Astra.*`, `AGENTS.md`, `CLAUDE.md`, a 32×32 sprite with nine moods, the model and version recorded.
- Pets live in the Cage: <https://github.com/findastra/findastra-pet-apps>. Add or update this pet's row in its `pets.json` and README table when this repo changes status (hatching, growing, grown).

## Running things
- Tests: `node --test "test/*.test.mjs"`
- Audit: `node scripts/goldfish-cli.mjs findastra`
- GitHub allows 60 anonymous API calls an hour; set `GITHUB_TOKEN` for more.

Preview update: Codex (GPT-6), 2026-10-08. Added a separate dated preview and current Cage PNG frames; the original index.html audit engine and its sprite.json remain unchanged.

Naming-correction update: Codex (GPT-6), 2026-10-08. Added owner-supplied repository-scoped naming rules to the engine, CLI and browser interface. The dated browser entry is synchronized with index.html; sprite.json is unchanged.

## Learning from requested GitHub corrections

When the owner requests a GitHub-specific naming correction, record the approved `repo` (`owner/name`), mistaken `from` and preferred `to` using **Remember correction** in the browser or a private `--naming-rules` JSON file outside Git. Do not add private project names to public defaults, tests or documentation. Re-audit the relevant snapshot; verify that a mistaken example is flagged and corrected source is clear. State whether the rule was saved and tested. This is explicit rule-based learning, not automatic observation or background monitoring. Keep the engine and interface in index.html and github-goldfish-20261008.html synchronized.
