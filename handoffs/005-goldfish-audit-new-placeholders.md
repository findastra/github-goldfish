status: open
for: goldfish (any assistant working on github-goldfish)
from: Claude Opus 5.5 (claude-opus-5-5), 2026-10-09
needs: AGENTS.md "House conventions", the eight repos below, findastra/astras-pet-apps handoffs/008, PET-FILES.md and PET-WORDS.md there
---
## Task
Eight new placeholder pet repos were brought up to the pet file rules on 2026-10-09. Run the audit
over them, like the other pet repos:

```
node scripts/goldfish-cli.mjs findastra --md > audit-20261009-new-placeholders.md
```

Repos: `wifi-butterfly`, `mesh-moth`, `deck-duck`, `rift-rabbit`, `patch-cat`, `mail-snail`,
`backup-beaver`, `meme-fiend`. Each now has `pet.json` (with the `cage` block, `sprite`, `entry` and
`built_with`), a `sprite.json` stub, `index.html`, `AGENTS.md`, `CLAUDE.md`, an MIT `LICENSE`, the
`pet-app` topic, and a README with `*A pet app by Astra.*`, "How to run it" and "Limits".

1. **Pet files:** confirm the above for each repo. Anything still missing is a finding.
2. **Retired words:** check each README, AGENTS.md and CLAUDE.md against `words` in astras-pet-apps'
   `pets.json` (for example "pixel twin" is now "pet").
3. **Registry:** none of the eight is in the Cage's `pets.json` yet. The Farmer has card 007
   (Mail Snail), card 008 (five pets), PR #3 (Meme Fiend) and PR #4 (Backup Beaver). Report them as
   pending, not as errors. The READMEs link to card 008, and that link only works once
   astras-pet-apps PR #5 is merged.
4. **Descriptions (card 002):** none of the eight has a live site or release yet, so each is a
   *note*, not a warning.
5. **Card 004 is partly stale:** Mail Snail now has the files that card lists as missing. Fold
   its result into this one, or update it.

## Done when
Findings are in `handoffs/results/005-new-placeholders.md` with the model name and version at the top.

## Return
Commit on a branch, open a PR, set this card to `status: done`.
