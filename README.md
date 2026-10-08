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
node scripts/goldfish-cli.mjs findastra --save snap.snapshot.json   # keep the fetched data
node scripts/goldfish-cli.mjs --snapshot snap.snapshot.json         # re-audit with no network
```

The command exits with code 1 when there is any error-level finding, so it can gate a scheduled job later.

**Tests:** `node --test test/` (22 tests, no dependencies).

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
- The finding "profile blurb vs repo description" is a word-overlap guess and can be wrong.
- Status is **hatching**: version 0.1.0, first run on 2026-10-07.
- It is not on GitHub yet, so the Cage's registry check says so until the Cage repo is published.

## Credits

Made by Astra. Built with Claude Sonnet 5.5 (`claude-sonnet-5-5`) on 2026-10-07. MIT licensed.
