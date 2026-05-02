# First Sprint Proposal

This is the most pragmatic first implementation sprint for the redesign.

## Sprint goal

Make the main screen feel materially more like a task/run workspace without breaking current behavior.

## Outcome target

By the end of the sprint, a user should be able to open the main screen and answer:

- what run is active
- what it is doing now
- whether it needs input
- what outputs exist so far
- whether it looks close to done

without relying entirely on transcript reading.

## Scope

Keep the existing stores and most current rendering logic.
Build a new structural shell and derived state helpers.

## Recommended tickets

### Ticket 1 — Add UI-facing run state helpers
Files:
- new `src/renderer/src/components/run-state.ts`
- update usages in `sessions.tsx`, `sessions-kanban.tsx`, `active-agents-sidebar.tsx`

Deliverables:
- derived run state labels
- review state label
- attention level
- current step summary helper

### Ticket 2 — Create `RunHeader`
Files:
- new `src/renderer/src/components/run-header.tsx`

Deliverables:
- title
- current state badge
- elapsed time
- approval/blocker chip
- stop/pause placeholder controls

### Ticket 3 — Create `RunCurrentStepCard`
Files:
- new `src/renderer/src/components/run-current-step-card.tsx`

Deliverables:
- “what is happening now” card
- latest meaningful step summary
- expected next move

### Ticket 4 — Create `RunWorkspace`
Files:
- new `src/renderer/src/components/run-workspace.tsx`
- integrate into `src/renderer/src/pages/sessions.tsx`

Deliverables:
- workspace shell around focused run
- embeds `RunHeader`, `RunCurrentStepCard`, and existing `AgentProgress`
- transcript/details pushed lower in hierarchy

### Ticket 5 — Improve queue card semantics
Files:
- `src/renderer/src/components/sessions-kanban.tsx`
- possibly parts of `src/renderer/src/pages/sessions.tsx`

Deliverables:
- replace idle/active/done grouping with more meaningful run states
- improved card subtitles
- clearer attention badges

### Ticket 6 — Add review placeholder for completed runs
Files:
- likely inside `RunWorkspace`

Deliverables:
- simple review box for completed runs
- summary + likely outputs + continue actions

## Explicitly out of scope for sprint 1

- full data model rename from session to run
- backend protocol changes
- full artifact extraction engine
- major route restructuring
- mobile parity work
- redesigning all settings screens

## Why this sprint first

Because it changes the product’s center of gravity with limited risk.

It does not require:
- store rewrites
- protocol changes
- deleting current components

But it does create:
- a clearer mental model
- a stronger top-level hierarchy
- a better foundation for later activity/artifact/review work

## Success criteria

Qualitative:
- main screen feels more like a work console and less like a transcript viewer
- focused run has a clear top section and current step summary
- completed runs feel at least partially reviewable

Implementation:
- new workspace shell exists
- queue labels and badges are improved
- state derivation is centralized
