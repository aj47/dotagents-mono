# Information Architecture

## Proposed top-level model

The app should be organized around three layers:

1. Intent layer
2. Execution layer
3. Review layer

Most current AI interfaces collapse these into a single chat timeline. DotAgents should separate them cleanly.

## Layer 1: Intent

Purpose: capture what the user wants.

Contains:

- task title / goal
- natural language instructions
- constraints
- autonomy mode
- selected agent/profile
- scope / target environment
- success criteria

This is the “what” and “under what rules.”

## Layer 2: Execution

Purpose: show what the system is doing right now.

Contains:

- plan
- active step
- recent actions
- tool/agent activity
- blockers
- approvals needed
- logs and reasoning summaries
- live status of delegated agents

This is the operational center of the product.

## Layer 3: Review

Purpose: help the user assess whether the result is acceptable.

Contains:

- outputs and artifacts
- diffs / changed files
- created issues / messages / emails / docs
- verification checks
- follow-up suggestions
- accept / reopen / retry / continue controls

This is the “is this actually good?” layer.

## Primary navigation proposal

### Main nav

- Home
- Tasks
- Agents
- Artifacts
- Automations
- Settings

### Why this nav

Home: overview of current and recent work
Tasks: queue/history of runs
Agents: profiles, capabilities, and active runtimes
Artifacts: created outputs across tasks
Automations: repeat tasks / loops / background jobs
Settings: providers, tools, permissions, preferences

## Main screen proposal

A three-column layout is the strongest default for desktop.

### Left rail: tasks and navigation

Contains:

- new task button
- task inbox / queue
- filters: active, waiting, done, failed
- recent tasks
- optional pinned automations

### Center: task workspace

Contains the currently selected task, with structured sections:

- goal
- plan
- current step
- outputs
- review status
- steering input

### Right rail: live activity and controls

Contains:

- recent tool actions
- approval requests
- delegated agent status
- warnings / risks
- quick actions: pause, stop, retry, inspect

## Task object anatomy

Every task should expose these sections consistently.

### Header
- title
- state
- started by / assigned agent
- elapsed time
- autonomy mode
- confidence / verification marker

### Goal panel
- user request
- structured constraints
- success criteria

### Plan panel
- current plan
- completed steps
- current step
- upcoming steps

### Activity panel
- tool calls
- agent actions
- external side effects
- rationale summaries

### Output panel
- files
- summaries
- messages sent
- created records
- links

### Review panel
- verification results
- unresolved assumptions
- accept / request changes / continue working

### Steering panel
- chat input
- quick follow-up prompts
- change autonomy
- redirect task

## Secondary entities

### Agents
Profiles and worker identities with capabilities, permissions, and connection types.

### Artifacts
Outputs that can outlive a single run.
Examples: documents, files, screenshots, issue drafts, summaries, bundles.

### Automations
Scheduled or recurring work that runs without direct prompting each time.

### Memories
Long-lived context and preferences that affect future work.

## Mobile interpretation

Mobile should preserve the same IA but collapse into stacked views:

- task list
- task summary
- live activity drawer
- review sheet
- steering composer

The task remains primary even when layout changes.
