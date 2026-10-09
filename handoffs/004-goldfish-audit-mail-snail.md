status: open
for: goldfish (any assistant working on github-goldfish)
from: Claude Haiku 5.5 (claude-haiku-5-5), 2026-10-09
needs: AGENTS.md "House conventions", findastra/mail-snail, findastra/astras-pet-apps handoffs/007
---
## Task
A new pet repo was created on 2026-10-09: **Mail Snail** (`findastra/mail-snail`, public, placeholder).
Run the audit over it, like the other pet repos:

```
node scripts/goldfish-cli.mjs findastra --md > audit-20261009-mail-snail.md
```

1. **Pet files** in `mail-snail`: `README.md` opens with `*A pet app by Astra.*`. It has no
   `pet.json`, `AGENTS.md`, `CLAUDE.md`, LICENSE, topic `pet-app` or model line yet. Report those as
   missing, not as errors, since it is a placeholder.
2. **Retired words:** check the README against the `words` list in astras-pet-apps' `pets.json`.
3. **Registry:** Mail Snail is not in the Cage's `pets.json` yet (see astras-pet-apps handoffs/007).

## Done when
Findings are in `handoffs/results/004-mail-snail.md` with the model name and version at the top.

## Return
Commit on a branch and set `status: done`.
