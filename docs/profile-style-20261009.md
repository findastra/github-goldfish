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
- Lowercase section headings: `vr & vrchat`, `pet apps`, `discord`, `web & more`.
- No sparkle dividers between sections.
- Each repo: ``- [`repo`](https://github.com/findastra/repo) -- description``. The separator is `--`. Never swap in ✧, ✦ or other decoration.
- Private repos are not linked: ``- `repo` *(private)* -- description``.
- **Pet apps** are a numbered running list in the order they joined the Cage (the order of `pets.json`, then newer pets): ``N. [`repo`](link) -- **Pet name** · description``. Every pet app belongs in this list, not in the other sections.

## In general
- Only add decoration Astra asked for. Ask before changing the look.
