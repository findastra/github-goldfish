# GitHub Goldfish

*A pet app by Astra.*

A little pixel goldfish that swims through every public word on a GitHub account and tells you what is wrong, misplaced, or inconsistent. Point it at `findastra` and it visits each repo, reads the descriptions, topics, README and other Markdown files, then reports four kinds of problem:

| Kind | What it means | Examples |
|---|---|---|
| **Document control** | A required file is missing, malformed, or uncontrolled | no README or LICENSE, GitHub cannot recognize the license, pet repo without `pet.json` or the `pet-app` topic, README missing the "A pet app by Astra." line, committed `.env`, files named `... (1).txt` or `...-final.md` |
| **Blatant** | A plain error a visitor can see | a link to a repo that does not exist, a relative link or `#anchor` that goes nowhere, doubled words, typos, garbled characters, leftover `TODO`, a token pasted into a README, a personal folder path, any word on your never-say list (a legal name, an employer) |
| **Organizational** | Things are in the wrong place or named off-pattern | default branch is not `main`, "Moved:" stub repos that are not archived, no topics, README title that does not echo the repo name, profile blurb that disagrees with the repo's own description |
| **Systemic** | A pattern across the whole account | mixed apostrophes (`'` and `’`), mixed dashes, mixed description style, some repos with a license and some without, a pet missing from the Cage registry |

Every finding says where it is (file and line when it can), what is wrong, and a suggested fix. Severity is **error**, **warning** or **note**. The goldfish's face follows the result: happy when clean, calm with only warnings, worried with a few errors, alarmed with more than five, curious while it works, and sad if it could not finish. It swims and hops around its tank the whole time.

## Run it

**In a browser:** open `index.html`, leave the account as `findastra` (or type another), press **Release the goldfish**. Tested when served from `localhost` (`python -m http.server`). Opening the file directly should also work but has not been tested.

**On the command line** (Node 20 or newer):

```bash
node scripts/goldfish-cli.mjs findastra            # readable list
node scripts/goldfish-cli.mjs findastra --md       # Markdown report
node scripts/goldfish-cli.mjs findastra --save /private/audit-snapshot-20261008.json   # keep the fetched data outside the repo
node scripts/goldfish-cli.mjs --snapshot /private/audit-snapshot-20261008.json         # re-audit with no network
```

The command exits with code 1 when there is any error-level finding, so it can gate a scheduled job later.

**Tests:** `node --test "test/*.test.mjs"` (no dependencies).

### Teach a naming correction

When the owner corrects a project name during GitHub work, save the approved correction so Goldfish can flag it on later audits. In either browser entry, use **Naming corrections Goldfish remembers**: enter the full `owner/repository`, the mistaken name, and the preferred name, then press **Remember correction**. The list is saved only in that browser on that site. **Forget** removes a correction; entering the same repository and mistaken name updates its preferred name. Browser storage failures are shown plainly. Tokens are never saved.

For the CLI, keep a JSON array in a private file **outside the repository**, for example `naming-rules-20261008.json`:

```json
[
  { "repo": "example/blue-hall", "from": "Blue World", "to": "Blue Hall" }
]
```

```bash
node scripts/goldfish-cli.mjs example --naming-rules /private/naming-rules-20261008.json
node scripts/goldfish-cli.mjs --snapshot /private/audit-snapshot-20261008.json --naming-rules /private/naming-rules-20261008.json
```

The engine accepts the same array as `Goldfish.audit({ ...snapshot, namingRules })`. These are explicit, repository-scoped rules. They match whole names without regard to capitalization in the repository's description, fetched Markdown prose, and pet metadata; the preferred spelling does not trigger its own correction. Code, URLs, placeholders, other repositories, profile text, filenames and repository slugs are outside this check. Malformed or conflicting rules stop the audit with an explanation.

After teaching a correction, rerun the relevant snapshot and check both a mistaken-name example and the corrected source. Report whether the rule was saved and tested. Goldfish does not watch edits or learn automatically, and a saved rule does not extend the public-only collector to private repositories. Private source snapshots can be audited locally. Keep those snapshots and naming rules outside Git.

### The words it must never find

The page has a box for words that must never appear in public text (a legal name, your employer, a private address, a codename). They are saved in that browser only and are never written into the repo, so put your employer's name there rather than in any file. On the command line use `--never "word,word"`.

### Rate limit and tokens

GitHub allows 60 anonymous requests an hour per network address. One audit of 12 repos costs about 14, so you get about four runs an hour. A token with no scopes raises that to 5,000. Paste it in the token box (kept in memory, never saved, sent only to `api.github.com`) or set `GITHUB_TOKEN` for the command line.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: the tank, the audit engine, the report. One file, no dependencies. |
| `sprite.json` | The 32×32 pixel twin in nine moods (idle, blink, happy, curious, worried, sad, sick, alarmed, sleep). The art is drawn in the Cage repo; after copying new frames here run `node scripts/sync-sprite.mjs`. |
| `pet.json` | Pet card for the Cage ([findastra-pet-apps](https://github.com/findastra/findastra-pet-apps)). |
| `scripts/` | Command-line audit, the loader that lifts the engine out of `index.html`, the sprite sync. |
| `test/` | Engine tests. |
| `AGENTS.md`, `CLAUDE.md` | Rules for any assistant that picks this up. |

## Limits

What the goldfish cannot do yet, plainly:

- **Spelling** is a short typo list plus doubled words. It is not a dictionary.
- **External links** are not tested (browsers cannot read another site's status). Only links to your own repos, files and `#anchors` are.
- **Not read:** issues, pull requests, wikis, releases, gists, commit messages, text inside images, code comments, live websites, private repos, forks.
- At most 20 extra `.md` files per repo are read, each under 200 KB.
- Style checks (apostrophes, dashes, description punctuation) compare against what the account mostly does; they do not know what you meant.
- Naming corrections use only the rules the owner explicitly saved or supplied; there is no automatic learning or background monitoring. Browser and CLI rule stores are separate.
- The finding "profile blurb vs repo description" is a word-overlap guess and can be wrong.
- Status is **hatching**: source version 0.2.0-20261008; first run on 2026-10-07.
- Live hosting and source release verification are recorded in `docs/publications-20261008.md`.

## Credits

Made by Astra. Built with Claude Sonnet 5.5 (`claude-sonnet-5-5`) on 2026-10-07. MIT licensed.

## Browser interface · 2026-10-08

Open [github-goldfish-20261008.html](github-goldfish-20261008.html) in a modern browser. The dated browser entry and index.html share the same audit engine and interface, including saved naming corrections added by Codex (GPT-6) on 2026-10-08. Original sprite.json is unchanged. GitHub requests require a network connection; an optional token stays only in memory.

Current Cage artwork is bundled in `art/` and indexed in `sprite-20261008.json`. Private records, tokens, logs and local machine metadata must stay outside Git.

Source version `0.2.0-20261008`, immutable tag [v0.2.0-20261008](https://github.com/findastra/github-goldfish/tree/v0.2.0-20261008). Publication checks are recorded in `docs/publications-20261008.md`; source publication does not establish live hosting.
