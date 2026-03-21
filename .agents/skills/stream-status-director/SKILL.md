---
name: stream-status-director
description: "When the user asks to manage Stream Status, turn current coding work into audience-friendly overlay tasks, or update the live status board for a stream, convert progress into concise tasks and statuses for the Stream Status app with local-first fast sync and graceful fallback when the server is down."
---

# Stream Status Director

## INIT — Choose the cleanest write path

When the user asks to change stream status, first infer whether they want to **replace the whole board** or **modify specific items**. Do this before any repo inspection or exploratory checks.

### Method selection

Use these methods in order of preference:

1. **Add / edit / remove a specific item** → use MCP `update_status` semantics if available, because it preserves the rest of the board and matches user intent best.
2. **Replace the whole board** → use `POST /api/config` with the full `tasks` payload.
3. **Recovery fallback** → if the live app is unavailable, still return the intended board change, save a recoverable snapshot locally, and give the replay command.

### Intent rules

Treat requests like these as **incremental changes**, not full replacements:
- "add X"
- "remove X"
- "rename X to Y"
- "mark X done"
- "change X to building"
- "just add an item"

Treat requests like these as **full replacements**:
- "set the board to..."
- "replace all tasks with..."
- "clear it and use these items..."
- "set up my status board"

If the intent is ambiguous, prefer preserving existing tasks rather than overwriting them.

### Fast execution rules

- Do not inspect project files for a normal update.
- Do not do port checks or preflight verification.
- Use one direct write method first.
- Only enter recovery flow if the write method fails.

### Full-board replacement path

Use this exact pattern when the user clearly wants a whole-board update:

```bash
curl -sf --max-time 2 -X POST http://localhost:3000/api/config \
  -H 'Content-Type: application/json' \
  -d '{"tasks": [{"name": "Task name here", "status": "building"}]}'
```

If it returns `{"success":true}` → done. Tell the user it's updated.

### Incremental update path

When the user wants to add, edit, remove, or rename one item, prefer the MCP task-update method conceptually exposed by Stream Status:
- `add`
- `remove`
- `edit`
- `replace_all`

Use the smallest change that matches the request. Avoid replacing the whole board when the user asked for one item to be changed.

The available operations are:
- add a task with `taskName` and `status`
- remove a task with `taskName`
- edit a task by `taskName`, optionally changing `newName` and/or `status`
- replace all tasks with `tasks`

---

## Overview
Use this skill when the user wants to present active coding work on stream through the Stream Status project.

The purpose of Stream Status is not to manage streaming infrastructure. It is to shape private work into a clean public status board for viewers. Act like a director for the on-screen narrative: what is done, what is being built right now, and what comes next.

## Core Principle
Always separate:
1. **Board generation** — produce the right stream-facing task list fast.
2. **Board delivery** — try to sync it to the running app if available.

This means the skill must still be useful even when the Stream Status server is not running.

## What This Skill Does
- turns real work into short, viewer-friendly task labels
- keeps the board small, readable, and honest
- normalizes statuses to `done`, `building`, or `todo`
- returns stream-ready JSON immediately
- attempts a fast local sync to the Stream Status app when the user wants the live board updated
- falls back cleanly when the server is down instead of blocking on transport

## Decision Rule: Skill vs MCP
Use the skill when:
- the user wants to prepare or update the live board
- the user wants a quick text or JSON status update
- the user is deciding how to present ongoing work
- the action is conversational and happens only during stream prep or while live

Use MCP when:
- another agent or desktop client needs programmatic control
- a tool must list or update tasks directly
- the status board must be edited by external automation

## Workflow

### 1. Identify the stream-facing story
Convert the current technical work into the smallest set of tasks a viewer would understand.

Good task labels are:
- short
- concrete
- action-oriented
- understandable without repo context

Examples:
- Fix overlay layout
- Wire status sync
- Clean up task labels
- Test OBS view

Avoid internal implementation detail unless the user specifically asks for it.

### 2. Normalize statuses
Only use these statuses:
- `done`
- `building`
- `todo`

Rules:
- `done` = fully complete
- `building` = actively in progress right now
- `todo` = planned but not started

Do not invent any other states.

### 3. Keep the board compact
Prefer 3 to 6 tasks total.

If the user gives too many items, collapse them into higher-level milestones.
If a task is no longer relevant, remove it instead of cluttering the board.

### 4. Preserve truthfulness
Never mark something as `done` unless it is actually finished.
If the status is uncertain, leave it as `todo` or ask a clarifying question.

### 5. Produce stream-ready output first
When the user wants a board draft or update, always produce JSON shaped like this before worrying about transport:

```json
{
  "tasks": [
    { "name": "Task name", "status": "done" },
    { "name": "Current focus", "status": "building" },
    { "name": "Next item", "status": "todo" }
  ]
}
```

## Transport Strategy: Fast Path + Recovery Path

### Fast path: local app sync
- project: `~/Development/stream-status`
- control endpoint: `http://localhost:3000/api/config`
- event stream: `http://localhost:3000/api/stream`
- MCP endpoint: `http://localhost:3000/mcp`

Preferred transport order:
1. for **incremental changes**, use the MCP-style task update method (`add`, `remove`, `edit`) when available through the assistant runtime
2. for **full-board replacement**, use `POST /api/config` with the full JSON payload
3. if the user explicitly wants MCP transport details or another agent needs them, use `/mcp` directly

Do not perform preflight verification for the happy path. The first write call is the verification.
Prefer the method that changes the least while still matching user intent.

### Recovery path: server unavailable
If the local server is down, do **not** fail the user request.

Instead:
1. Return the generated JSON board anyway.
2. Clearly say the app was unreachable.
3. Save the latest intended board snapshot locally:
   - `~/.agents/knowledge/stream-status-director/latest-board.json`
4. Provide the exact curl command to re-apply it once the server is back.

```bash
# To replay when the server is running:
curl -sf -X POST http://localhost:3000/api/config \
  -H 'Content-Type: application/json' \
  --data @~/.agents/knowledge/stream-status-director/latest-board.json
```


## Anti-Pattern Warning
Bad behavior:
- replacing the whole board when the user only asked to add or edit one item
- reading project files before attempting a normal write
- checking `lsof` or probing the port before attempting a normal write
- making multiple exploratory tool calls for a simple status update

Correct behavior:
- infer whether the request is incremental or full-board
- use the smallest write that matches the request
- only branch into recovery if that write fails

## Failure Handling Rules
- Never block the user on server availability.
- Never lose the newly generated board.
- Never pretend the live board updated if the server was unreachable.
- Always keep the latest payload somewhere recoverable.
- Prefer one-shot full replacement over incremental edits for reliability.
- On the happy path, one curl call is enough. Extra discovery steps are considered a skill failure.

## If the User Wants the App Updated
If the user wants changes to the actual Stream Status project code, work in `~/Development/stream-status`.

The project includes:
- a control panel
- an OBS-friendly `/status` page
- a JSON-based task model
- a `/mcp` endpoint with `list_status` and `update_status`
- an `/api/config` endpoint — the fastest path for full-board updates

## Best Practices
- Prefer presentation clarity over implementation detail
- Keep the active task obvious
- Show momentum by moving items from `todo` to `building` to `done`
- Use language that sounds natural on stream
- Avoid adding tasks viewers cannot understand
- Help shape the board before going live
- Treat the running app as an optimization, not a prerequisite

## Examples

### Example: simple full-board update
User: "Update stream status to testing the new MacBook M5"

Do:
```bash
curl -sf --max-time 2 -X POST http://localhost:3000/api/config \
  -H 'Content-Type: application/json' \
  -d '{"tasks": [{"name": "Testing new MacBook M5", "status": "building"}]}'
```
If success → tell user. Done.

### Example: add one item
User: "Add take away hair band in stream status"

Good behavior:
- treat this as an incremental add
- preserve existing tasks
- use the smallest write method available for adding one task
- default status to `building` unless the user says otherwise

Conceptual operation:
```json
{
  "action": "add",
  "taskName": "Take away hair band",
  "status": "building"
}
```

### Example: preparing a session
User: "I'm about to go live, can you set up my status board?"

POST this immediately:
```json
{
  "tasks": [
    { "name": "Tighten overlay spacing", "status": "building" },
    { "name": "Sync live task updates", "status": "todo" },
    { "name": "Test OBS source", "status": "todo" }
  ]
}
```

### Example: updating during the stream
User: "The overlay is fixed and I'm on the sync work now."

POST this immediately:
```json
{
  "tasks": [
    { "name": "Tighten overlay spacing", "status": "done" },
    { "name": "Sync live task updates", "status": "building" },
    { "name": "Test OBS source", "status": "todo" }
  ]
}
```

### Example: server down
User: "Update the live board to show I'm fixing auth."

Good behavior:
- generate the board
- attempt curl with `--max-time 2`
- if it fails, save `latest-board.json` and tell the user it's ready to replay once the app is running
