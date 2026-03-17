# Information Architecture

## Primary hierarchy

The redesign should organize the product around this hierarchy:

1. Workspace
2. Tasks
3. Runs
4. Steps
5. Actions
6. Artifacts
7. Messages

This ordering is intentional. Messages are important, but they should sit beneath the work structure rather than define it.

## Top-level navigation

Recommended top-level areas:

- **Work** — active runs, queue, review, recent completions
- **History** — completed and archived runs, searchable
- **Agents** — agent profiles and capabilities
- **Capabilities** — tools, MCP, skills, permissions
- **Memories** — persistent context and preferences
- **Settings** — system-level configuration

## Work area structure

### Work queue
A persistent list of run objects.

Suggested grouping:

- Running
- Awaiting input
- Awaiting approval
- Ready for review
- Completed

### Workspace tabs or sections
Within a selected run, use stable sections instead of one long transcript.

Suggested sections:

- Overview
- Activity
- Artifacts
- Chat
- Verification

## Object relationships

### Task → Run
A task can have many runs.
A run is the concrete execution instance.

### Run → Step
A run consists of meaningful stages.

### Step → Action
A step contains individual actions such as tool calls or agent messages.

### Run → Artifact
A run produces artifacts that may span multiple steps.

### Run → Review state
A run has a review state independent of execution state.

This distinction matters because a run can be technically complete but still need review.

## State separation

Keep these distinct in the UI and data model:

### Execution state
What the system is doing operationally.

Examples:

- running
- paused
- blocked
- verifying

### Review state
Whether the output is ready for human acceptance.

Examples:

- no review needed
- needs review
- revisions requested
- approved

### Risk state
Whether any notable caution exists.

Examples:

- low risk
- external side effects pending
- auth blocked
- destructive action proposed

## Metadata to expose everywhere

For each run, strongly consider showing:

- title
- status
- active step
- elapsed time
- last updated
- number of open approvals
- number of artifacts
- risk level
- verification status

## Message placement

Messages should live in a dedicated communication surface rather than being the default home for all system information.

A message view is still valuable for:

- conversational context
- exact wording
- nuanced corrections
- freeform collaboration

But the user should not need message reading to answer operational questions.
