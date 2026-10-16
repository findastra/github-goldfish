# findastra-README-auditor

A tool by Astra, implemented with OpenAI Codex (GPT-6), 2026-10-15.

Click the desktop GitHub Goldfish three times in quick succession to open this
workflow. The Aquarium also has a launcher under its tools. The normal double
click still opens the Aquarium after the Windows click interval expires.

1. **Audit & redo with L3** reads the current public profile and public repository
   catalog. A Codex maker proposes the complete README and a separate Codex
   checker reviews it. The existing title, tagline and social artwork stay exact.
2. Review the before/after text. **Request changes from L3** sends your feedback
   through a new maker and checker pass. Two failed automatic repair rounds stop
   for review. Model findings are not a runtime certification of the listed pets.
3. **Approve & push branch + PR** approves the displayed hash and original base
   commit. The publisher writes only `findastra/findastra/README.md` to a new
   review branch, verifies the committed text, and creates a pull request. Merge
   separately on GitHub. A changed base requires a fresh audit.

The review panel's green/red lamp controls this workflow across all launchers.
OFF cancels model work and prevents new writes. An in-flight GitHub request may
already have succeeded; publication checkpoints record its branch and any
confirmed commit. Inspect that branch after a failed or cancelled publication.
Completed and partial receipts remain in local state, including the last twenty
publications. The Aquarium's **Launcher ON** checkbox only gates that page's
launcher; it is not the workflow kill switch. Blue/amber records maintenance.

## Complete catalog and whole-document checks

The audit compares every catalog entry, including animals without a public
repository, and reconciles named animals in the registry's registered, pipeline
and seed lists. Public main and the installed PetOS checkout's **published commit**
are read at pinned revisions. The panel shows each revision and any branch-only
additions. Unpublished local changes are not sent to the model. Missing public
source files or conflicting identities stop the audit instead of shrinking its
expected count.
For existing IDs, public main's descriptions and stages take precedence;
different installed-branch metadata is reported rather than silently replacing
main. Only new published branch IDs extend the catalog.

Each animal needs one visible row with its stable catalog ID, exact name and
verified repository link, or an unlinked name when there is no public repository.
An explicit animal-name plus catalog-ID match in public repository metadata may
identify a renamed repository; the panel reports that stale catalog mapping.
Repository visibility comes from the current public GitHub listing. Stale
registry visibility is reported separately, not used to hide an animal.

The panel shows source and draft totals, missing entries, duplicates, incorrect
IDs and stale roster prose through the last line. The obsolete trailing Seeds
paragraph and contradictory Skill Scout description are regression cases.
Comments, code, quoted text and collapsed lists cannot satisfy visible roster
coverage. Ordinary cross-references and unrelated numbered instructions remain
valid. Deterministic failures block model approval and publication; two failed
repair rounds return the findings for review. Old drafts require a fresh audit.

## Local setup

Requirements: Windows, Node 20+, a current Codex CLI signed in through ChatGPT,
and Git Credential Manager signed in to `findastra` with profile push access.
No package installation or new account is performed by this installer.

Keep `github-goldfish` and `astras-pet-os` as sibling checkouts. From Goldfish:

```powershell
.\scripts\install-readme-auditor-20261015.ps1 -PetOs '..\astras-pet-os'
.\scripts\start-readme-auditor-20261015.ps1
```

Build/install PetOS's desktop launcher from the companion feature branch for the
three-click gesture. The installer registers a fixed local `astras-goldfish:`
launcher, not a generic command protocol. Hidden startup failures show a dialog.
It does not enable login startup. Local configuration, state and model responses
live under `%LOCALAPPDATA%\astras-pet-os\github-aquarium\readme-auditor`.

The local service binds loopback, checks host/origin and requires a random local
session token. Open from the launcher after a service restart to refresh it.
GitHub credentials stay in the publisher process and never enter model prompts
or browser storage. Only public profile/catalog evidence goes to Codex; the
maker and checker have execution tools disabled. This is a bounded local L3
workflow using the owner's existing Codex account. It does not establish the
planned shared Pet SDK, protected Iron Gates identity or OS isolation.

The skill requires a `findastra-readme-auditor: managed` comment. Merge the small
[PetOS generator guard PR #22](https://github.com/findastra/astras-pet-os/pull/22)
before [profile PR #1](https://github.com/findastra/findastra/pull/1), so daily
rounds preserve the reviewed text. The guard targets main independently of the
pending UI changes. The existing connection could not update workflow files;
no additional permissions were requested or granted.

Validation: Node tests cover wrong hashes, stale bases, checker rejection,
revision feedback, OFF/cancellation persistence, malformed authentication,
cross-origin writes, exact content verification and partial push receipts.
The Windows self-test covers the three-click classifier and dispatch without
launching real jobs. Live acceptance is recorded in the feature PR.
