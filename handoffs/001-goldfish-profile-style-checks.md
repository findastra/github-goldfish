status: open
for: goldfish (any assistant working on github-goldfish)
from: Claude Opus 5.5 (claude-opus-5-5), 2026-10-09
needs: docs/profile-style-20261009.md, index.html engine (profile section), test/engine.test.mjs
---
## Task
Teach the engine Astra's profile layout from `docs/profile-style-20261009.md`, as quiet
`Organizational` notes on `findastra/findastra/README.md`:
- a repo line whose separator is not `--`;
- a pet app that is not in the numbered pet apps list, or is out of the Cage's order;
- a bold tagline, or sparkle dividers between sections;
- a social image in `socials/` that the README does not use, or a README image that is missing.

Each check needs a "fires" and a "does not fire" test. Keep index.html and the dated copy in sync.

## Done when
`node --test "test/*.test.mjs"` passes and the current profile README produces no profile-style notes.

## Return
Branch plus PR, set this card to `status: done`.
