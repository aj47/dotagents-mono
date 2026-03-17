# Information Architecture

## Primary entities

### Task
A user-defined unit of intended work.

### Run
A concrete execution instance of a task.

### Step
A meaningful stage in a run.

### Action
An individual operation taken by an agent or tool.

### Artifact
A produced output such as a file, diff, draft, screenshot, URL, issue, summary, or command result.

### Approval
A decision point requiring user confirmation.

### Blocker
A reason the task cannot progress without input, permission, or recovery.

### Agent
An execution actor, either primary or delegated.

### Memory / context
Durable preferences and scoped task context that shape execution.

## Recommended top-level navigation

### Inbox / Home
Recent tasks, running work, pending approvals, and resumable items.

### Tasks
A structured list of all tasks and runs with filters for active, blocked, waiting, completed, and failed.

### Agents
Available agents, status, capabilities, and current assignments.

### Artifacts
Cross-task outputs such as files, docs, screenshots, summaries, and external links.

### Settings / Trust Controls
Autonomy level, approvals, permissions, memory controls, notification preferences, and safety defaults.

## Task detail hierarchy

A task detail page or primary workspace should expose:

1. Goal and constraints
2. Current status
3. Plan or execution outline
4. Live step/activity view
5. Approvals and blockers
6. Output artifacts
7. Conversation / steering panel
8. Review summary and verification

## Main screen layout thesis

Recommended desktop layout:

### Left rail
- task list
- task filters
- active runs
- quick create

### Center workspace
- selected task run
- goal
- plan
- current step
- outputs
- review state

### Right rail
- live activity stream
- approvals
- blockers
- quick actions

This structure makes the task the central object while preserving awareness of system activity.

## Temporal model

The interface should show time in layers:

- now: current step and live status
- recent: last actions and new outputs
- full history: expandable run timeline

The user should not be forced into a single endless chronology.
