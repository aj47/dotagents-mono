# Interaction Model

## The user journey

A strong interaction model for `.agents` should support five phases:

1. Define work
2. Start execution
3. Supervise or background the run
4. Intervene when needed
5. Review and continue

## 1. Define work

Input should feel fast and low-friction.

The system should accept:

- plain-language requests
- pasted context
- attachments
- selected agent/profile
- optional constraints

Immediately after submission, the product should create a task and begin a visible run state. The user should feel that work has started, not that they are waiting for a chat reply.

## 2. Start execution

Very early in the run, the system should present:

- a distilled goal
- an initial plan
- the first current step
- any risky assumptions or blockers

This creates early trust and gives the user a chance to redirect before too much happens.

## 3. Supervise or background the run

Users need two dominant modes:

### Foreground mode
The user keeps the workspace open and watches progress.

Need:

- live current step
- action feed
- visible controls
- fast follow-up steering

### Background mode
The user leaves the run and returns later.

Need:

- notifications / badges
- concise summaries
- explicit resume points
- clear review state

## 4. Intervene when needed

Interventions should be lightweight.

Examples:

- pause after current step
- stop now
- skip this approach
- use a different tool
- narrow the goal
- approve proposed action
- answer blocking question

These controls should be available directly from the run workspace and from queue-level surfaces when appropriate.

## 5. Review and continue

Review should not be a dead end.

After inspecting output, the user should be able to:

- approve
- request revisions
- branch into a new run
- continue from current state
- convert output into a reusable artifact

## Suggested input patterns

### Persistent steering box
A follow-up input pinned near the bottom of the workspace so the user can steer the run without hunting through the transcript.

### Structured quick actions
Examples:

- Continue
- Revise plan
- Pause
- Approve
- Open artifacts
- Show tool activity

### Inline approvals
Approval prompts should appear where attention is already focused, not buried in the action stream.

## Interaction rules

### Rule 1: Every state should imply an obvious next action
If blocked, show what will unblock it.
If ready for review, show how to review.
If complete, show what to do with the result.

### Rule 2: Users should not lose place
Switching between runs should preserve context, scroll state, and the current section.

### Rule 3: Runs should be resumable
If the app closes or the user returns later, the workspace should reconstruct the current state clearly.

### Rule 4: Side effects should feel deliberate
When a run is about to perform meaningful external actions, it should be obvious and reviewable.

### Rule 5: Completion should hand off, not disappear
A completed run should transition into a review state instead of simply moving to history.
