# Interaction Model

## Core loop

The redesigned experience should support a simple recurring loop:

1. define the task
2. launch execution
3. observe progress
4. intervene if needed
5. review outputs
6. accept, refine, or continue

## Starting a task

Task creation should support multiple input styles:

- natural language prompt
- structured task form with goal, constraints, deliverable, and urgency
- quick actions from existing context or artifacts

The system may suggest a plan, but the user should not need to write a plan to begin.

## While work is running

The default view should answer, at minimum:

- current state
- current step
- latest actions
- blockers
- expected next move
- whether user input is needed

The user should be able to:

- pause
- stop
- redirect
- tighten scope
- provide missing context
- approve pending actions
- inspect artifacts

## Intervention patterns

### Soft steer
A light instruction that does not reset the task.
Example: “Focus on the desktop app only.”

### Scope correction
A stronger redirect that changes the plan.
Example: “Do not implement yet; write docs first.”

### Approval
An explicit yes/no checkpoint.
Example: “Post this,” “Send this email,” “Run this destructive command.”

### Recovery
Resume or branch after failure.
Example: “Retry with a different approach,” “Create a new run from the last successful step.”

## Completion patterns

A run should not simply end with a narrative response.

Instead, the completion state should provide:

- a concise summary
- artifacts produced
- verification outcomes
- risks or open questions
- recommended next actions
- accept / continue / revise controls

## Conversation's role

Conversation remains useful for:

- framing tasks
- resolving ambiguity
- incremental feedback
- asking follow-up questions
- refining outputs

But conversation should be a steering layer, not the only lens into the system.
