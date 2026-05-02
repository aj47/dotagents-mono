# Core Interaction Spec

## Main job of the interface

Help a user move through this loop quickly and safely:

1. define work
2. launch work
3. understand live status
4. intervene if needed
5. review outputs
6. accept or continue

## Primary object: Task Run

A task run is the unit of interaction.

### Required fields

- `title`
- `goal`
- `state`
- `createdAt`
- `updatedAt`
- `startedAt`
- `completedAt`
- `agentProfile`
- `autonomyMode`
- `currentStep`
- `progressSummary`
- `artifacts[]`
- `approvals[]`
- `verificationState`
- `confidence`

## Run states

### Draft
Task not started yet.

### Queued
Task created and waiting to run.

### Planning
System is interpreting goal and proposing/constructing plan.

### Running
System is actively executing steps.

### Waiting for user
System requires clarification, approval, login, or decision.

### Blocked
System cannot continue because of an external dependency or failure.

### Verifying
Execution is done but verification/review is still in progress.

### Completed
Result delivered and accepted or marked complete.

### Failed
Run terminated without successful completion.

## Default workspace sections

### 1. Goal card
Should always remain visible near the top.

Contains:

- original request
- editable task title
- structured constraints
- expected output
- autonomy mode badge

### 2. Plan card
A lightweight step list.

Rules:

- keep plans short and scannable
- highlight current step
- allow collapse/expand
- show replans when the path changes

### 3. Current activity stream
The user should be able to see the last few meaningful actions at a glance.

Event types:

- planning update
- tool called
- file changed
- browser action
- external message sent
- approval requested
- error encountered
- delegated agent update
- verification result

### 4. Output shelf
A persistent area showing tangible outputs as they appear.

Examples:

- file created
- draft document
- code diff
- screenshot
- summary note
- link opened
- issue created

### 5. Review panel
Appears prominently once work is nearing completion.

Contains:

- what was done
- evidence
- unresolved assumptions
- confidence
- accept / continue / retry / inspect actions

### 6. Steering composer
A compact input box dedicated to changing the task, not restarting the whole interaction.

Suggested quick actions:

- explain current step
- pause after this step
- do not send anything externally
- switch to safer mode
- summarize progress
- continue in background

## Behavior rules

### Rule: status must never be hidden in prose
If the system is waiting, blocked, or verifying, that should be represented as explicit UI state.

### Rule: every side effect should be inspectable
If the system edited files or sent messages, there should be a visible artifact or event.

### Rule: interventions should preserve continuity
A user correction should update the same task run when possible rather than forcing a new thread.

### Rule: completion requires evidence
A run should not feel complete until outputs and verification are visible.

## Approval UX

Approval requests should contain:

- what action is proposed
- why it is needed
- what could happen
- whether it is reversible
- approve once / approve this class / deny / edit instruction

## Errors and recovery

When something breaks, the user should immediately see:

- what failed
- where it failed
- likely cause
- suggested next action
- retry or alternative path

Do not dump raw logs first. Start with a structured explanation and offer logs on demand.

## Backgrounding

Users should be able to send tasks into background execution.

Background tasks still need:

- clear status in task list
- notifications for approvals and completion
- a concise recap when reopened

## Resume behavior

When a user reopens a task, the workspace should summarize:

- where it left off
- what changed since last seen
- whether anything needs attention now
