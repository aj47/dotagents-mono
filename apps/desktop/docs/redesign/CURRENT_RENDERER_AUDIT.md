# Current Renderer Audit

This document maps the current desktop renderer to the first-principles redesign direction.

## High-level read

The current renderer already has many of the right primitives, but they are organized around **sessions and transcript display** more than **task/run review and control**.

That means the redesign can likely be implemented as a structural reframe rather than a ground-up rewrite.

## Strong existing primitives

### 1. Session/running-work infrastructure already exists
Relevant files:

- `src/renderer/src/pages/sessions.tsx`
- `src/renderer/src/components/active-agents-sidebar.tsx`
- `src/renderer/src/stores/agent-store.ts`

What exists now:

- active session list
- focused session
- session view modes (`grid`, `list`, `kanban`)
- pinned/archive behavior
- progress updates keyed by session
- recent and past sessions

Interpretation:
This is very close to a **run queue**, but the naming and presentation still suggest “session browser” more than “work operating system.”

### 2. Rich live execution data already exists
Relevant files:

- `src/renderer/src/components/agent-progress.tsx`
- `src/renderer/src/stores/agent-store.ts`

What exists now:

- conversation history
- steps
- streaming state
- pending tool approvals
- delegation progress
- tool execution summaries
- retry states
- completion state
- queue state

Interpretation:
This is enough to build a much more structured execution UI. The data is there; it is just not yet elevated into a strong task/workspace hierarchy.

### 3. The app layout already supports sidebars and structured shell patterns
Relevant file:

- `src/renderer/src/components/app-layout.tsx`

What exists now:

- left app navigation
- collapsible sidebar behavior
- active agents sidebar
- settings and capabilities surfaces
- stable routed shell

Interpretation:
The redesign does not need a new app shell from scratch. It needs the shell to be repurposed around work queue + workspace + live rail.

### 4. Kanban and tile patterns already exist
Relevant files:

- `src/renderer/src/components/sessions-kanban.tsx`
- `src/renderer/src/components/session-grid.tsx`
- `src/renderer/src/components/session-tile.tsx`

What exists now:

- grouped session views
- visual distinction between active, idle, done
- cards/tiles that can focus and collapse

Interpretation:
These are useful stepping stones toward a task-centric queue and multi-run overview.

## Current structural mismatches

### 1. Core naming is still session-first
Examples:

- `sessions.tsx`
- `session-grid.tsx`
- `session-tile.tsx`
- `focusedSessionId`
- `conversation-store`

Problem:
The UI model implicitly tells the user that the product is about sessions/conversations. That conflicts with the redesign thesis that the product is about tasks/runs.

Recommendation:
Keep underlying compatibility for now, but start introducing a UI vocabulary layer:

- session → run
- conversation title → task title / run title
- session list → work queue
- completed session → completed run

### 2. The main experience is still too transcript-centric
Relevant file:

- `src/renderer/src/components/agent-progress.tsx`

Problem:
`AgentProgress` appears to be the mega-container for most execution understanding. It handles messages, tool executions, approvals, delegation, streaming, TTS-related concerns, and summary rendering. This is powerful, but it makes the run feel like a dressed-up transcript rather than a structured workspace.

Recommendation:
Split this into more explicit panels over time:

- run overview
- current step
- activity stream
- approvals
- artifacts
- chat
- verification/review

### 3. Queue/status model is underpowered relative to what the product needs
Current state hints include:

- complete vs not complete
- snoozed
- pending tool approval
- error/stopped
- active/recent

Problem:
These are useful but insufficiently expressed as a strong run-state model.

Recommendation:
Introduce a UI-level state model such as:

- Draft
- Planning
- Running
- Awaiting input
- Awaiting approval
- Blocked
- Verifying
- Ready for review
- Completed
- Failed

These can initially be derived from existing fields instead of requiring backend changes immediately.

### 4. Completion is not yet a real review surface
Problem:
The current system has completion and summaries, but the redesign needs a distinct handoff state where artifacts, verification, and follow-up actions are clearly grouped.

Recommendation:
Add a first-class review panel for completed or near-complete runs.

### 5. Artifacts are not yet a dominant organizing concept
Problem:
The redesign depends on concrete outputs becoming more visible than prose. The current UI already knows about tool results and summaries, but artifacts do not yet appear to be a primary organizing surface.

Recommendation:
Create a unified artifact shelf/panel that can show:

- file changes
- generated docs
- screenshots
- links
- command outputs
- created external resources

## Immediate opportunities

### Opportunity 1: Reframe without breaking data model
The fastest redesign win is probably not changing stores first. It is changing the structure and labels of the `sessions` experience.

### Opportunity 2: Build a new workspace wrapper around `AgentProgress`
Instead of replacing `AgentProgress` immediately, wrap it inside a new task/run workspace shell and progressively pull sections out.

### Opportunity 3: Turn kanban into a real work queue
The existing kanban grouping can evolve into:

- Running
- Needs input
- Needs review
- Completed

instead of idle/active/done.

### Opportunity 4: Use derived selectors before changing backend semantics
A lot of the new UX can be powered by selectors that derive task/run state from current store fields.

## Bottom line

The codebase is in a good position for an incremental redesign.

The renderer already has:

- run-like objects
- live progress data
- queue-like overviews
- sidebar infrastructure
- tile/card layouts
- approval-related data

The main work is **reorganizing presentation and naming** so the product behaves like a task-centric control surface instead of a transcript-centric session browser.
