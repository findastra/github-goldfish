# GitHub Aquarium: achievement-tracker tool

By Astra. Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-17. Branch `claude/achievements-20261017`, cut from `codex/l3-activity-20261016` (the newest Aquarium UI; `main` does not have the Aquarium tools yet).

## What it does

A new tool bubble, `achievement-tracker`, in the Aquarium's Tools row, and a **Start Project** button beside "Release the goldfish".

- **Check my achievements** reads public data from `api.github.com` (the token from settings is used if present, sent to that host only, never stored) and estimates:
  - Pull Shark: merged pull requests you opened (search API count).
  - YOLO: any merged PR of yours with no review (`review:none`).
  - Quickdraw: any of your last 100 closed issues/PRs closed within 5 minutes, leaving out merged PRs (a quick merge did not award it on Astra's profile).
  - Starstruck: stars on your most-starred owned repo.
  - Open Sourcerer: other people's repos among your last 100 merged PRs.
  - Pair Extraordinaire: commits with a `Co-authored-by` line. **A hint only**: GitHub counts a co-author only when the email belongs to an account and the PR merged, so this never marks progress by itself.
  - Galaxy Brain, Public Sponsor, Heart On Your Sleeve, Security advisory credit: not detectable without more access; set by hand.
- **Easiest next**: the five achievements not yet earned, sorted by a rough effort figure. Costly (Public Sponsor) and not-yet-awarded (Heart On Your Sleeve, Open Sourcerer) ones get a penalty; ones that need other people say so.
- **All achievements** table: set what your profile actually shows. Once set, it wins over the estimate, higher or lower; "Use the estimate" clears it. Retired badges (Arctic Code Vault, Mars 2020) are listed for marking only.
- **Start Project**: project ideas that stay in the pet ecosystem, tagged by course track (Cyber security, AI, Nomad & money), smallest first. Each card has steps, what it works toward, **Open it as a GitHub issue** (a prefilled `github.com/<account>/<repo>/issues/new` link), **Another idea** and **Mark done**. New-pet ideas go to `astras-pet-os` as "New pet (you name it)"; no names were coined. The Wifi Butterfly idea defers to its undecided card 001.

Manual tiers, done projects, track and the last check are kept in this browser (`github-aquarium:achievements:v1`). Nothing is sent anywhere else.

## Code

- `index.html` (and the identical `github-goldfish-20261008.html`): the spec entry in `<script id="tool-controls">`, then a block between `<!--achievements-start-->` and `<!--achievements-end-->`: `<style id="achievements-style">`, `<script id="achievements">` (data, ranking, issue links, `detect`; no DOM) and `<script id="achievements-ui">`.
- Tests: `test/achievements-20261017.test.mjs` lifts the `achievements` script and tests the real code. `npm test`: 89 pass.

## Verified, and not

- Browser-checked locally (file view) on 2026-10-17: no console errors, both Start Project buttons work, the live check for `findastra` returned 33 merged PRs (Pull Shark tier 2), likely Quickdraw and YOLO, 1 star, 275 co-author commits. No horizontal scroll at 375 px.
- Not deployed; not merged. Achievement rules come from GitHub's docs as I know them (2026-10); GitHub changes them without notice, and Heart On Your Sleeve / Open Sourcerer may not be live.
- The anonymous search API allows 10 searches a minute; the check uses 4.

## 2026-10-17 correction

Astra's profile shows only YOLO. The check had reported Quickdraw (every fast close was a quick merge) and Pull Shark tier 2 (39 merged PRs, all but one merged 2026-10-14 to 10-17). Quickdraw now ignores merged PRs. Why Pull Shark is not on the profile is not known; GitHub may not have awarded it yet. The tool now says so when the owner's setting is below the estimate.
