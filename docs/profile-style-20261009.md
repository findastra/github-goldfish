# Astra's profile README: how it should look

*What Astra asked for on 2026-10-09 while laying out `findastra/findastra`. The Goldfish uses this when it checks the profile. Recorded with Claude Opus 5.5 (`claude-opus-5-5`).*

## Header
- One centered `<h2>` with her sparkle line around the name: `.  × ˚ ·✧ ˚+·  . Hi, I'm Astra .  × ˚ ·✧ ˚  *  +·`. Keep the heading's underline below the name.
- Under it, a centered tagline in **plain** text (not bold), separated by pipes: `noncorporeal-dancer | reality-hacker | digital-performer | vibe-coder`.

## Socials
- Left-aligned, directly under the tagline, in this order:
  1. Mommy's Discord: Join MMY
  2. VR TikTok: @findastra
  3. Pole Dance TikTok: @astra_on_fire
  4. VRChat Instagram: @astra_on_fire
- Label pattern: what it is + platform, then a colon, then the handle. No personal Discord.
- Each line is a small SVG in `socials/`: the platform's logo plus text at the tagline's size (16px), regular weight, a thin black outline, and a colour gradient. The gradients flow from line to line: pink-red to red, red to orange, orange to yellow, yellow to pink-red.
- Lines sit close together (one paragraph, joined with `<br>`).
- When an SVG changes, give it a new dated file name (`<name>-YYYYMMDD-HHMMSS.svg`) and update the README. GitHub caches images, so editing a file in place keeps showing the old one.

## Repo lists
- Section headings as Astra writes them (now `VR & VRChat`, `Astra's Pet Apps`, `Discord`, `Web & More`).
- The Friendly Farmer's profile round (`astras-pet-apps/scripts/farmer-profile-20261009.mjs`, run daily by `findastra/findastra/.github/workflows/farmer-profile-round.yml`) keeps the lists matched to GitHub. Report a layout problem to the Farmer with a card; do not fight the round.
- No sparkle dividers between sections.
- Each repo: ``- [`repo`](https://github.com/findastra/repo) -- description``. The separator is `--`. Never swap in ✧, ✦ or other decoration.
- Private repos are not linked: ``- `repo` *(private)* -- description``.
- **Pet apps** are a numbered running list in the order they joined the Cage (the order of `pets.json`, then newer pets): ``N. [`repo`](link) -- **Pet name** · description``. Every pet app belongs in this list, not in the other sections.

## In general
- Only add decoration Astra asked for. Ask before changing the look.

## Pet roster (Astra's corrections, 2026-10-16)
*Checked first in every audit and pinned to the top of the report as `(pet roster)`. Recorded with Claude Opus 5.5 (`claude-opus-5-5`).*

- Line shape: ``N. [`repo`](link) -- **Pet** · *Home*: what the pet does   [status]``.
- **Pet first, home second.** A place (Kingdom, Station, Den, Casino, site…) in the pet slot means they are switched: Astra fixed `File Kingdom · File Master` to `File Master · File Kingdom`, and `Dubstep Gunsmith` (a catalog site) is a home waiting for its pet.
- **Every pet has a home.** No home is reported once, as a list.
- **No placeholder names** (`pet-program-77-icon-77`).
- **Status is not a home or a job.** `planned:` / `not decided yet:` in the home slot, or "… are planned" in the job, gets rewritten as what the pet does; status goes in `[brackets]` at the end (`[not connected to any mail account yet]`).
- **A category is not a home** (`tasks:`, `AI cost:`, `network:`).
- **The job does not repeat the home** (`runs The Police Station: …`).
- **Finish the sentence**: "list what needs Astra" became "lists what needs Astra's (L4) attention".
- **Counts as floors**: "26 dated tools" became "30+ dated tools".
- **No editing markers in public** (`[? …]`, `[Suggest one?]`).
- **Numbers**: one pet per number; a repo that calls itself "pet program (#N)" belongs in the numbered list; hatched pets come off the seeds line.
- The list is written by the Friendly Farmer from `astras-pet-apps/pet-programs.json` (`icon`, `program`, `mini_descriptor.text`). Fix the JSON there, not just the README, or the next profile round puts the old text back.
