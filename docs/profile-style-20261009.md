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
- The Friendly Farmer's profile round (`astras-pet-os/scripts/farmer-profile-20261009.mjs`, run daily by `findastra/findastra/.github/workflows/farmer-profile-round.yml`) keeps the lists matched to GitHub. Report a layout problem to the Farmer with a card; do not fight the round.
- No sparkle dividers between sections.
- Each repo: ``- [`repo`](https://github.com/findastra/repo) -- description``. The separator is `--`. Never swap in ✧, ✦ or other decoration.
- Private repos are not linked: ``- `repo` *(private)* -- description``.
- **Pet apps** are a numbered running list by pet program number (`pet-programs.json` in astras-pet-os), pet first: ``N. **Pet** -- what the pet does [status]``, with the home, repo and tools as sub-bullets beneath (see Pet roster below). Every pet app belongs in this list, not in the other sections.

## In general
- Only add decoration Astra asked for. Ask before changing the look.

## Pet roster (Astra's corrections, 2026-10-16)
*Checked first in every audit and pinned to the top of the report as `(pet roster)`. Recorded with Claude Opus 5.5 (`claude-opus-5-5`).*

- Line shape (Astra, 2026-10-16): the pet name and what it does, then the home (pet program), repo and tools as sub-bullets:
  ```
  1. **[Friendly Farmer](https://github.com/findastra/astras-pet-os)** -- organizes the pets ...
     - [`the-farm`](page) -- the pet program
     - [`astras-pet-os`](https://github.com/findastra/astras-pet-os) -- Astra's PetOS home repo
     - [`startup-star`](https://github.com/findastra/startup-star) -- ...
  ```
  A line that starts with the repo is flagged; a line with the home and repo still on it is a note. A pet with no home sub-bullet is flagged. **No name twice:** the pet's name is its own link to its repo, so the repo is not listed again beneath it, and the home's name is said once, as its link text.
- **Pet first, home second.** A place (Kingdom, Station, Den, Casino, site…) in the pet slot means they are switched: Astra fixed `File Kingdom · File Master` to `File Master · File Kingdom`, and `Dubstep Gunsmith` (a catalog site) is a home waiting for its pet.
- **Every pet has a home.** No home is reported once, as a list. With no home yet, the first sub-bullet is ``- `pet-program-N` -- pet program, not named yet``.
- **No placeholder names** (`pet-program-77-icon-77`).
- **Status is not a home or a job.** `planned:` / `not decided yet:` in the home slot, or "… are planned" in the job, gets rewritten as what the pet does; status goes in `[brackets]` at the end (`[not connected to any mail account yet]`).
- **A category is not a home** (`tasks:`, `AI cost:`, `network:`).
- **The job does not repeat the home** (`runs The Police Station: …`).
- **Finish the sentence**: "list what needs Astra" became "lists what needs Astra's (L4) attention".
- **Counts as floors**: "26 dated tools" became "30+ dated tools".
- **No editing markers in public** (`[? …]`, `[Suggest one?]`).
- **Numbers**: one pet per number; a repo that calls itself "pet program (#N)" belongs in the numbered list; hatched pets come off the seeds line.
- The list is written by the Friendly Farmer from `astras-pet-os/pet-programs.json` (`icon`, `program`, `mini_descriptor.text`). Fix the JSON there, not just the README, or the next profile round puts the old text back. The Farmer's `pet-organizer` and `pet-finder` tricks (astras-pet-os `skills/`) do this. The round moves `Planned:` and `Not decided yet:` out of the job into `[planned]` and `[job not chosen yet]` by itself.
