# Trust and Safety Model

## Core statement

In DotAgents, trust should be built through visibility, controllability, and verification.

## Trust levers

### 1. Visibility
The user can see what the system is doing.

### 2. Approval
The user can gate sensitive actions.

### 3. Reversibility
The system communicates whether an action can be undone.

### 4. Verification
The system checks whether it actually completed the task.

### 5. Continuity
The user can interrupt and resume without losing context.

## Autonomy modes

### Observe
The system can plan and inspect, but not execute side effects.

### Ask-first
The system asks before meaningful tool use or external actions.

### Safe-auto
The system may do low-risk actions automatically but asks for sensitive ones.

### Full-run
The system executes within defined permissions and reports back for review.

These modes should be visible on every task.

## What counts as sensitive

Sensitive actions include, at minimum:

- sending messages externally
- posting publicly
- editing important local files
- deleting data
- making purchases or authenticated web actions
- changing credentials, secrets, or integrations

## Approval card anatomy

Each approval card should answer:

- what action is proposed?
- why is it needed?
- what exact target is affected?
- what are the risks?
- can it be undone?
- what are alternatives?

## Verification model

The UI should distinguish between:

### Claimed completion
The agent says it is done.

### Observed completion
Artifacts or outputs exist.

### Verified completion
Checks confirm the outputs meet success criteria.

This distinction is critical. Users should never be forced to infer verification from tone.

## Confidence communication

Avoid fake precision.

Prefer labels such as:

- high confidence, verified
- medium confidence, review recommended
- low confidence, blocked by missing access

## Failure UX principles

When trust is threatened, the UI must become more explicit, not less.

Display:

- failure point
- cause summary
- impact
- recovery path
- whether anything partial already happened

## Auditability

Every task should preserve an action history that can answer:

- what tools were used?
- what external systems were touched?
- what files changed?
- which approvals were granted?
- what was delivered?

## Safety thesis

Users trust agent systems when the software behaves like a transparent operator, not a theatrical performer.
