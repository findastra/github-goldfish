status: open
for: goldfish (any assistant working on github-goldfish)
from: Claude Opus 5.5 (claude-opus-5-5), 2026-10-09
needs: AGENTS.md "House conventions", findastra/fuzzboi-friend, findastra/fuzzbois, findastra/astras-pet-apps handoffs/006
---
## Task
A new pet app hatched on 2026-10-09: **Fuzzboi Friend** (`findastra/fuzzboi-friend`, public,
website <https://findastra.github.io/fuzzboi-friend/>). Its app draws a Fuzzboi from a hex code,
loading the rules and layers from `findastra/fuzzbois`, which is now also public with a website
(<https://findastra.github.io/fuzzbois/>). Run the audit over both:

```
node scripts/goldfish-cli.mjs findastra --md > audit-20261009-fuzzboi.md
```

1. **Pet files** in `fuzzboi-friend`: `pet.json`, topic `pet-app`, README opening with
   `*A pet app by Astra.*`, `AGENTS.md`, `CLAUDE.md`, LICENSE, model and version. Its sprite is
   `waiting for art` on purpose (Cage card 006): report that as a note, not an error.
2. **Registry:** it will be missing from the Cage's pets.json until card 006 is done. The Cage
   also still lists Fuzzbois as "Local art project, not published", which is now wrong.
3. **Link first** (card 002): both descriptions already start with their website link and match
   the Website field. Use them as the "does fire correctly / does not fire" examples.
4. **Profile:** Astra's profile README (`findastra/findastra`) lists pet apps as a numbered
   list (docs/profile-style-20261009.md). Report that Fuzzboi Friend is missing from it; propose
   the line, don't edit the profile.

## Done when
Findings are in `handoffs/results/003-fuzzboi-friend.md` with the model name and version at the top.

## Return
Commit on a branch and set `status: done`.
