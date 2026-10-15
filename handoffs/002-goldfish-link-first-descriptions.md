status: open
for: goldfish (any assistant working on github-goldfish)
from: Claude Opus 5.5 (claude-opus-5-5), 2026-10-09
needs: AGENTS.md "House conventions", index.html engine (repo metadata checks), test/engine.test.mjs
---
## Task
Astra's rule, set 2026-10-09: **every repo's description starts with a link, first thing, so she
can get straight there.** Remember it and check it everywhere.

The link is where you *use* the thing: its live website (GitHub Pages or other hosting), or its
download (latest release) when it is a program. The same URL goes in the repo's **Website**
field (`homepage`). Example, as done on 2026-10-09:

- `findastra/fuzzbois`: description `👉 https://findastra.github.io/fuzzbois/ — Make your Fuzzboi: …`, Website `https://findastra.github.io/fuzzbois/`.

1. The convention is already written in AGENTS.md "House conventions" (this card added it).
2. Teach the engine, with tests, including "does not fire" cases:
   - **warn** (Organizational): the description does not start with `http(s)://…` (an optional
     leading emoji such as 👉 is fine).
   - **warn**: the description's first link and the Website field differ, or one is missing.
   - **warn**: the repo has GitHub Pages turned on, but neither the description nor the Website
     field links to it.
   - **note** only: no website or release exists yet, so there is nothing to link. Say so in plain words.
   - Private repos: same checks, but as notes (only Astra sees them).
3. Run the audit over the whole account and list every repo that needs a link, with the URL you
   would use. Don't change other repos' descriptions from this card: list them for Astra.

## Done when
The engine flags a repo with no leading link, tests pass, and the account list is in
`handoffs/results/002-link-first-descriptions.md` with the model name and version at the top.

## Return
Branch and PR, then set this card to `status: done`.
