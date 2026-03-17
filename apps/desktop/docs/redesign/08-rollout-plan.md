# Rollout Plan

## Goal

Redesign the product without requiring a single destabilizing rewrite.

## Strategy

Ship the redesign as a sequence of structural changes, each independently valuable.

## Phase 0: Align on model

Deliverables:

- philosophy docs
- IA docs
- wireframes
- terminology agreement

Exit criteria:

- team agrees task/run is primary object
- team agrees on state model
- team agrees on trust model

## Phase 1: Introduce task-centric shell

Deliverables:

- left task rail
- center task workspace shell
- right live activity rail
- explicit run states

Keep:

- existing transcript and message rendering under the hood where needed

Exit criteria:

- active work no longer feels like a raw chat thread

## Phase 2: Separate events from messages

Deliverables:

- structured activity stream
- event types for tools, approvals, outputs, failures
- transcript visually demoted to steering context

Exit criteria:

- user can understand a run without reading all messages

## Phase 3: Build review mode

Deliverables:

- output shelf
- verification panel
- completion review surface
- accept / continue / request changes actions

Exit criteria:

- “done” feels reviewable rather than asserted

## Phase 4: Improve trust controls

Deliverables:

- visible autonomy mode per task
- approval policy controls near live work
- clearer failure and blocker states

Exit criteria:

- users can calibrate safety without opening deep settings

## Phase 5: Unify desktop and mobile mental model

Deliverables:

- equivalent task-run model on mobile
- consistent state terminology
- shared component behaviors where possible

Exit criteria:

- same task can be understood similarly across form factors

## Phase 6: Artifacts and automations become first-class

Deliverables:

- artifact browser
- automation center
- background task monitoring
- notifications with meaningful summaries

Exit criteria:

- DotAgents starts to feel like a persistent work system, not a single-session assistant

## Migration heuristics

### Preserve data model compatibility where possible
Avoid breaking existing sessions until the task/run abstraction is stable.

### Prefer wrappers before rewrites
First reorganize how information is presented. Then rationalize underlying models.

### Instrument before polishing
Measure where users get blocked, confused, or fail to trust the interface.

## Success metrics

- faster user comprehension of active task state
- fewer transcript-scroll interactions to understand status
- higher task completion trust
- lower confusion around approvals and blockers
- more successful resume flows
