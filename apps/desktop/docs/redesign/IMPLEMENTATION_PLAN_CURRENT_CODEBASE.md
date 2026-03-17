# Implementation Plan Mapped to Current Renderer

This document turns the redesign philosophy into a concrete implementation sequence for the current desktop renderer.

## Strategic approach

Do not rewrite the renderer all at once.

Use the current primitives and progressively reshape them around a task/run model.

The ideal sequencing is:

1. rename and reframe
2. add structure around existing components
3. split transcript responsibilities into dedicated surfaces
4. introduce review-first completion
5. tighten state semantics later

## Phase 1 — Reframe the current sessions screen as a work queue

## Goal

Make the existing `/` route feel like a work dashboard rather than a session gallery.

## Current files

- `src/renderer/src/pages/sessions.tsx`
- `src/renderer/src/components/sessions-kanban.tsx`
- `src/renderer/src/components/active-agents-sidebar.tsx`
- `src/renderer/src/stores/agent-store.ts`

## Recommended changes

### 1. Introduce UI terminology helpers
Add a thin presentation layer that maps internal `session` language to UI-facing `run` or `task` language.

This avoids a risky internal rename at the start.

Examples:

- Sessions → Work
- Session → Run
- Continue conversation → Continue run
- Past sessions → Run history

### 2. Change queue grouping semantics
Instead of `idle / active / done`, derive user-meaningful groups:

- Running
- Needs input
- Needs review
- Completed
- Blocked

Likely derivation sources:

- `progress.isComplete`
- `progress.isSnoozed`
- `progress.pendingToolApproval`
- backend/session status `error` or `stopped`
- normalized conversation state

### 3. Improve queue card summaries
Each run card should show compact operational metadata:

- title
- run state
- active step summary
- approval badge
- artifact count if derivable
- last updated
- risk indicator

## Deliverable

A redesigned work queue that still uses current store data.

## Phase 2 — Build a task workspace shell around the focused run

## Goal

Stop making `AgentProgress` feel like the whole product.

## Current files

- `src/renderer/src/pages/sessions.tsx`
- `src/renderer/src/components/agent-progress.tsx`

## Recommended changes

Create a new wrapper component, for example:

- `src/renderer/src/components/run-workspace.tsx`

This wrapper should organize the focused run into stable sections:

- Run header
- Goal/summary card
- Current step card
- Activity section
- Artifacts section
- Review/verification section
- Chat/steering section

At first, some sections can still delegate to `AgentProgress` internally.

## Suggested first extraction order

### Step 1: Run header
Display:

- run title
- current status
- autonomy/trust badge placeholder
- elapsed time
- stop/pause controls

### Step 2: Current step summary
Derive from the latest step/tool/delegation state and show a concise “what is happening now” card.

### Step 3: Review placeholder
For completed runs, show a summary box above the transcript saying what was produced and what to inspect next.

## Deliverable

A task-centric shell with the transcript demoted inside it.

## Phase 3 — Split activity from chat

## Goal

Create a dedicated execution surface so users do not need to read messages to understand what happened.

## Current file

- `src/renderer/src/components/agent-progress.tsx`

## Recommended changes

Extract a compact activity stream component, for example:

- `run-activity-stream.tsx`

It should render normalized events like:

- planning update
- tool invoked
- tool completed
- approval requested
- delegated subagent started/completed
- blocker encountered
- verification completed

Use existing progress data where possible.

## Why this matters

This is the biggest UX shift. Once activity is visible outside the transcript, the app starts to feel like an operations tool.

## Deliverable

An Activity tab/panel that becomes the default execution lens.

## Phase 4 — Create a real artifacts panel

## Goal

Elevate outputs over narration.

## Current sources

Likely derivable from:

- tool results in `agent-progress.tsx`
- step data in `agent-store.ts`
- created summaries/responses

## Recommended changes

Create:

- `run-artifacts-panel.tsx`

Initial artifact types can be heuristic/derived rather than perfect:

- generated markdown/file references
- command result summaries
- created links
- screenshots/images
- drafted outputs

Even a partial artifact shelf would materially improve review.

## Deliverable

An Artifacts section visible for every run.

## Phase 5 — Add review-first completion

## Goal

Make completion feel like handoff rather than transcript termination.

## Recommended changes

Create:

- `run-review-panel.tsx`

Show:

- what was done
- key outputs
- verification signals
- unresolved questions
- continue / revise actions

Possible initial verification signals:

- run completed successfully
- no pending approval
- last tool result successful
- artifacts present

This can begin as a UI-level heuristic before the backend adds richer verification semantics.

## Deliverable

Completed runs land in a structured review state.

## Phase 6 — Introduce derived run-state selectors

## Goal

Make state labels consistent everywhere.

## Current file

- `src/renderer/src/stores/agent-store.ts`

## Recommended changes

Add selectors/helpers, for example:

- `getRunDisplayState(progress)`
- `getRunCurrentStep(progress)`
- `getRunRiskLevel(progress)`
- `getRunNeedsAttention(progress)`

These selectors can be used by:

- queue cards
- run header
- sidebar badges
- review panels

## Deliverable

A consistent run-state model without requiring immediate backend refactors.

## Phase 7 — Rename routes and navigation semantics

## Goal

Align product language with the new mental model.

## Current file

- `src/renderer/src/router.tsx`
- `src/renderer/src/components/app-layout.tsx`

## Recommended changes

Potential UI copy changes:

- route label `Sessions` → `Work`
- `Past Sessions` → `History`
- `Active Agents` sidebar → `Runs` or `Active work`

Do this after the structure starts to match the new language.

## Deliverable

The app starts sounding like what it actually is.

## Suggested new components to add first

1. `run-state.ts` — display-state derivation helpers
2. `run-workspace.tsx` — shell around focused run
3. `run-header.tsx` — title, status, actions
4. `run-current-step-card.tsx` — “what is happening now”
5. `run-activity-stream.tsx` — normalized activity events
6. `run-artifacts-panel.tsx` — outputs
7. `run-review-panel.tsx` — completion and verification

## Suggested order of operations for the next coding pass

### Pass 1
Add derived state helpers and update queue labels/cards.

### Pass 2
Wrap focused `AgentProgress` in a `RunWorkspace` with a new header and current-step card.

### Pass 3
Extract Activity and Artifacts into separate sections.

### Pass 4
Add review panel for completed runs.

### Pass 5
Refine navigation copy and empty states.

## Practical recommendation

The smartest next implementation step is probably this:

Build a new `RunWorkspace` component and use it inside `pages/sessions.tsx` for the focused run, while leaving the existing store and progress machinery intact.

That single move would create a new center of gravity for the whole product without forcing a rewrite.
