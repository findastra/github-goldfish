# GitHub Aquarium error searches — 2026-10-14

Implemented in source; not deployed or visually verified. Author: OpenAI Codex (GPT-6).

## Tools

- document-control-error: required documents, headings, copies and housekeeping.
- blatant-error: text defects, placeholders, encoding and prohibited wording.
- organizational-error: naming, topics, descriptions and profile organization.
- systemic-error: account-wide consistency and registry problems.
- link-error: paths, heading anchors and known GitHub destinations. Does not request external websites.
- secret-exposure-error: recognizable secret patterns, sensitive filenames, personal data and public links to private repos. Not a comprehensive secret scanner or security certification.
- pet-metadata-error: pet.json requirements and declared file references.
- tool-definition-error: newly checks malformed lists, invalid names, duplicate names and missing tool versions.
- release-metadata-error: newly checks missing program versions and mismatched release_tag declarations. Drift is a note because an older release can be intentional.
- scan-coverage-error: unavailable README/pet metadata, truncated trees and collection notes. Unknown is not missing.

Original four finding categories remain compatible with existing reports. Every finding carries overlapping tool IDs and appears once in the overall total. Bubble counts overlap and must not be summed. ON selects included search results on the next shared repository scan; collection is shared, not an independent permission boundary. Sick is a separate manual defect report. Disabling a search aborts an active run; a finding can remain through another enabled overlapping search. All searches OFF prevents a browser scan. Tool state remains local; delivery to Farmer is unconnected.

Compact cards have a left column of ON and Sick checkboxes. Utilities and tutorial tools have separate sections. Existing saved controls retain their IDs.

## Proposed extensions — not implemented

- website-runtime-error: verify live page response, browser startup, console failures and important actions. Distinguish network failures from app defects; do not send tokens to arbitrary destinations.
- emotion-asset-error: inspect all nine current mood assets, dimensions, transparency, paths and individual-repo availability.
- interface-control-error: verify icon opens chat, tutorial launch, left controls and actual tool behavior.
- dependency-error: inspect manifests/lockfiles and known vulnerability findings; requires advisory data and ecosystem support.
- workflow-permission-error: inspect workflow token permissions, unpinned actions and risky event/checkout combinations; uncertain cases are review notes.
- release-sync-error: compare default-branch commit, release artifact, hub copy and deployed page; distinguish intentional drafts from stale releases.
- accessibility-error: keyboard access, accessible names, contrast, focus and reduced motion in real rendered pages.
- recovery-error: verify documented rollback/export/import and preservation of tool health state.
- permission-boundary-error: exercise denied operations and scoped credentials in a controlled runtime; declarations alone do not prove enforcement.
- handoff-error: missing handoff owner, unresolved checklist, stale status and contradictory documented implementation claims.

## Clarifications retained

The chat is missing, not unwanted. Separate pet chats/seats share maintained UI and infrastructure, with per-pet histories and server-enforced permissions planned. One click shows the highest-priority emotion-linked message. Double-click shows/hides the program window, not background work. Native click changes remain pending.

## Validation

Engine regression tests cover malformed and valid tool metadata, planned and implemented release metadata, overlapping searches, all-disabled filtering, unread README vs absence, token coverage notes and truncated link/entry paths. Browser entries remain byte-identical. Live page still shows old deployment; no claim of revised visual acceptance.

Local browser follow-up: ten compact cards were visually inspected. ON and Sick changed independently and persisted through reload; test state restored. No full live GitHub scan or production deployment was performed.
