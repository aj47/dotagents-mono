# Component Map

This document maps the redesign onto likely current renderer components.

## Existing components that can be reused

### `pages/sessions.tsx`
Use as the initial host for the new task/run workspace.

Short-term role:
- remain the main work route
- host the new queue + workspace framing
- keep compatibility with current focused-session behavior

### `components/agent-progress.tsx`
Use as a transitional execution renderer.

Short-term role:
- remain the source for detailed transcript and tool activity rendering
- be embedded inside a higher-level workspace shell rather than owning the whole experience

Long-term role:
- shrink into a lower-level details pane
- provide chat/activity internals to more specific run components

### `components/sessions-kanban.tsx`
Use as the basis of a real work queue.

Short-term role:
- regroup cards by user-meaningful run states
- rename columns from idle/active/done to running/needs input/needs review/completed/blocked

### `components/active-agents-sidebar.tsx`
Use as the first draft of a run navigator.

Short-term role:
- become Active work / History navigator
- expose clearer run state badges and attention signals

### `stores/agent-store.ts`
Use as the compatibility layer for all early redesign work.

Short-term role:
- keep current session-backed data
- add derived selectors and display-state helpers

## Components to add next

### `components/run-state.ts`
Purpose:
- centralize all UI-facing derived run state

Suggested exports:
- `getRunDisplayState(progress)`
- `getRunReviewState(progress)`
- `getRunAttentionLevel(progress)`
- `getRunCurrentStepLabel(progress)`
- `getRunLastActivity(progress)`

### `components/run-workspace.tsx`
Purpose:
- create the new task-centric center column

Suggested props:
- `sessionId`
- `progress`
- `isFocused`
- action callbacks for pause/stop/focus

Suggested structure:
- run header
- goal summary
- current step card
- activity section
- artifacts section
- transcript/chat section
- review panel

### `components/run-header.tsx`
Purpose:
- give each focused run a strong top identity

Should show:
- title
- run state badge
- elapsed time
- attention / approval badge
- quick controls

### `components/run-current-step-card.tsx`
Purpose:
- answer “what is happening now?” immediately

Should show:
- current step summary
- why it matters
- latest tool or agent involved
- expected next move

### `components/run-activity-stream.tsx`
Purpose:
- normalize execution into compact events

Should show:
- tool actions
- delegation events
- approval requests
- retries
- blockers
- completion/verification events

### `components/run-artifacts-panel.tsx`
Purpose:
- elevate concrete outputs above transcript prose

Should support initial artifact types:
- file/path references
- markdown/doc outputs
- command summaries
- external links
- screenshots/images

### `components/run-review-panel.tsx`
Purpose:
- create a proper review-ready completion state

Should show:
- what was done
- outputs to inspect
- verification hints
- unresolved assumptions
- continue/revise actions

## Transitional architecture

Phase 1 structure should likely be:

- `sessions.tsx`
  - queue/list shell
  - focused `RunWorkspace`
    - new header/current step/review sections
    - embedded `AgentProgress` for details

This lets the product look substantially different before needing large data-model changes.

## What not to refactor yet

Avoid immediately renaming all internal session/conversation primitives.

Why:
- high churn
- unclear backend/UI coupling
- not required to validate the new interaction model

Instead, create a UI-facing translation layer first.
