# UI Spec

## Product goal

Design a desktop interface for DotAgents that treats agent work as a task execution system rather than a pure chat interface.

## Primary user promise

At any moment, the UI should clearly show what the system is doing, what it has produced, what it needs from the user, and whether the outcome is trustworthy.

## Core desktop layout

### Left rail: Task navigation
Contents:
- new task button
- task filters: active, blocked, waiting, completed, failed
- task list with status, title, updated time, and run indicator
- pinned or important tasks

Purpose:
- orient the user across multiple threads of work
- make resumability a first-class behavior

### Center workspace: Task run surface
Contents:
- task header with goal, status, autonomy level, and primary actions
- plan / execution outline
- current step card
- outputs and artifacts section
- review summary when complete
- optional conversation panel inline or collapsible

Purpose:
- make the selected task legible as a live work object

### Right rail: Live system awareness
Contents:
- live activity stream
- tool actions
- approvals queue
- blockers
- quick steer controls

Purpose:
- expose execution without forcing users into logs unless needed

## Key states

### Empty state
The product should help users begin with examples, templates, recent work, or quick actions.

### Active run state
Show live status, current step, latest actions, elapsed time, and expected next move.

### Waiting state
Show clearly whether the system is waiting on approval, missing context, external auth, or retry conditions.

### Review state
Promote outputs, verification, and acceptance controls above the transcript.

### Failure state
Explain where execution stopped, why, what was attempted, and what the user can do next.

## Core components

### Task header
Shows:
- task title
- user goal
- current run state
- autonomy level
- elapsed time
- pause / stop / continue / retry actions

### Plan panel
Shows:
- proposed or active plan
- completed, current, and pending steps
- whether the plan has changed

### Current step card
Shows:
- what is happening now
- why this step matters
- tool or agent involved
- expected output

### Activity stream
Shows:
- recent actions in compact chronological form
- tool calls, agent delegation, status changes, and recovery attempts
- expandable details for logs

### Approvals panel
Shows:
- pending decisions
- reason approval is required
- action preview
- approve / reject / edit actions

### Artifacts panel
Shows:
- files, diffs, links, screenshots, drafts, documents, summaries
- status of each artifact
- open or inspect actions

### Review panel
Shows:
- concise summary
- verification checks
- open questions
- confidence statement
- accept / revise / continue actions

### Steering input
Shows:
- a natural language input for redirects and refinements
- optional structured controls for scope, urgency, and autonomy

## Behavioral requirements

### The UI must always expose current status
No hidden “thinking” without visible state.

### The UI must always expose whether user input is needed
Approvals and blockers should be impossible to miss.

### The UI must preserve recoverability
The user should be able to continue from a previous run state or branch a new run.

### The UI must support both novice and expert modes
Novices need clarity and guidance; experts need dense state and fast control.

## Non-goals

- making the interface feel like a generic consumer chatbot
- hiding execution to appear magical
- optimizing solely for conversational charm
