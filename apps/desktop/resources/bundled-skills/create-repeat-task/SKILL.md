---
name: create-repeat-task
description: "Use this skill when the user asks to create, edit, or reason about a repeat task or loop — including phrases like 'create repeat task', 'recurring task', 'scheduled task', 'continuous task', 'same session continue', 'speak the result', 'TTS for a task', 'critique pass', or asks for good loop/cron prompt design. It teaches canonical task.md frontmatter, scheduler/runtime boundaries, prompt contracts, durable loop state, companion-skill factoring, and the safe edit workflow."
---

# Create Repeat Task

## Overview

A repeat task ("loop") is a DotAgents config object that runs a prompt against an agent on a schedule. It is a markdown file with YAML frontmatter at:

- Global: `~/.agents/tasks/<task-id>/task.md`
- Workspace (when `DOTAGENTS_WORKSPACE_DIR` is set): `${DOTAGENTS_WORKSPACE_DIR}/.agents/tasks/<task-id>/task.md`

Workspace tasks override global tasks with the same `id`.

The file format is parsed by `packages/core/src/agents-files/tasks.ts`. Desktop runtime behavior is in `apps/desktop/src/main/loop-service.ts`, and desktop-only task fields may also appear in `apps/desktop/src/shared/types.ts` and `packages/shared/src/api-types.ts`.

## When to use this skill

Trigger on any of:

- "create a repeat task", "make a recurring task", "schedule this"
- "run this every N minutes/hours", "fire on startup"
- "continuous task", "run continuously", "run back-to-back"
- "same session continue", "keep the conversation context across runs"
- "speak the result", "TTS for the task", "read it out when it's done"
- "critique pass", "critic agent", "feed critique back to the worker"
- "edit task `<id>`", "disable task `<id>`", "change the schedule of task `<id>`"

## Discovery first

Before editing, inspect:

1. `~/.agents/tasks/` (and `${DOTAGENTS_WORKSPACE_DIR}/.agents/tasks/` if set) to see existing task IDs and conventions.
2. The user's existing agent profiles (`~/.agents/agents/<id>/`) so you can pick a valid `profileId` when the user names an agent.
3. The current schema at `packages/core/src/agents-files/tasks.ts`, `apps/desktop/src/main/loop-service.ts`, `apps/desktop/src/shared/types.ts`, and `packages/shared/src/api-types.ts` if you suspect the available fields have evolved past what this skill documents.

If you find an existing task with the requested ID, prefer editing it in place over recreating it.

## Frontmatter schema

| Field               | Type                  | Default     | Notes                                                                                          |
| ------------------- | --------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `kind`              | string (literal)      | `task`      | Always `task`. Required.                                                                       |
| `id`                | string                | dir name    | Stable identifier. Falls back to the directory name, then to `name`, if omitted.               |
| `name`              | string                | `id`        | Display name. Falls back to `id` if omitted.                                                   |
| `intervalMinutes`   | number                | `60`        | Fixed interval in minutes between runs. Minimum `1`. Ignored when `schedule` is set.           |
| `enabled`           | boolean               | `true`      | Set `false` to disable without deleting the task.                                               |
| `profileId`         | string                | unset       | ID of the agent profile to run as. Omit to use the user's current default agent.                |
| `runOnStartup`      | boolean               | `false`     | Fire once immediately on app start, before the first interval.                                  |
| `speakOnTrigger`    | boolean               | `false`     | Run snoozed (silent), then unsnooze on completion so the renderer auto-plays TTS of the reply. |
| `continueInSession` | boolean               | `false`     | Reuse the prior session/conversation so the agent retains context across runs.                  |
| `lastSessionId`     | string                | unset       | Session ID resumed on the next run. Auto-populated; user may pin manually.                      |
| `runContinuously`   | boolean               | `false`     | Start the next run immediately after the previous one finishes (zero-delay loop).               |
| `critiquePass` | boolean             | `false`     | Run a built-in critic pass after the worker answer, then feed critique back to the worker.       |
| `criticProfileId`   | string                | unset       | Optional profile ID for the critic pass. Omit to use the default active agent.                  |
| `schedule`          | JSON object as string | unset       | Wall-clock schedule. When present, supersedes `intervalMinutes`. See "Schedules" below.         |
| `lastRunAt`         | number (ms epoch)     | unset       | Auto-managed timestamp. Do not hand-set unless the user explicitly asks.                        |

The markdown body (everything after the closing `---`) is the **prompt** sent to the agent on each run. Write it as per-run work instructions, not as a second scheduler config.

## Frontmatter vs prompt boundary

Keep runtime mechanics in frontmatter and per-run behavior in the prompt.

Frontmatter/runtime owns:

- cadence: `intervalMinutes`, `schedule`, `runContinuously`
- lifecycle: `enabled`, `runOnStartup`
- session/delivery: `profileId`, `continueInSession`, `speakOnTrigger`
- review wiring: `critiquePass`, `criticProfileId`
- auto-managed state: `lastRunAt`, `lastSessionId`

Prompt body owns:

- current objective and scope
- input sources or search paths
- durable output files or artifact directories
- user-facing progress report location
- per-run quota or done condition
- blocked/no-change fallback
- final response shape

Do not restate cadence or harness mechanics in the prompt. Avoid phrases like "every 20 minutes", "when this startup task fires", "because continueInSession is on", or "the critic will revise once" unless that timing itself changes the work product. Prefer "On each run..." for the prompt objective.

Bad:

```markdown
Every 20 minutes overnight, search my inbox and send me anything important.
```

Good:

```markdown
On each run, check for new important mail since the last saved checkpoint. Update `~/.agents/tasks/important-mail/ledger.md`. If nothing clears the bar, return one compact no-change bullet.
```

## Good loop prompt contract

For non-trivial loops, include these pieces in the prompt body:

1. **Objective** — one sentence starting with "On each run..." and focused on the artifact or decision produced in that run.
2. **Inputs** — files, URLs, repositories, tools, or local folders to inspect first.
3. **Durable state** — one or more files under the task folder for checkpoint, source ledger, output, or report state. Do not rely only on conversation memory.
4. **Per-run quota** — the smallest concrete unit of progress: add one artifact, process one queue item, inspect one source family, update one report, or return no-change.
5. **Fallback ladder** — what to do when the preferred source is blocked or empty.
6. **Stop condition** — what counts as done for this run; then the agent should stop.
7. **Progress report** — for long-running or artifact-heavy loops, prefer a nice task-local HTML status page that summarizes current progress, outputs, rankings, blockers, and next steps.
8. **Final response shape** — compact status for the loop transcript or TTS.

Good loop prompts are usually short but specific. They should make repeated runs additive instead of re-opening strategy from scratch.

## User-facing progress reports

For loops that produce artifacts over multiple runs, the preferred way to report progress to the user is a polished HTML page in the task folder, for example `~/.agents/tasks/<id>/status.html` or `~/.agents/tasks/<id>/progress.html`.

Use the HTML page for:

- current status and last updated time
- ranked outputs or decisions
- artifact links and local file paths
- source ledger summaries
- blockers, risks, and next lane
- a compact run history

Keep the final assistant response short and point to the page. The response is for the loop transcript or TTS; the HTML page is the durable, skimmable progress surface.

## Companion skills

If the task body starts becoming a reusable playbook, create or update a companion skill and keep the repeat-task prompt thin.

Use a companion skill when the loop needs:

- reusable tool recipes, command sequences, or API caveats
- domain review criteria that will be reused outside this task
- long examples, templates, or generated-asset instructions
- security or source-quality rules that should be maintained independently

Then the task prompt should name the skill and bind it to the current objective and artifact paths, for example:

```markdown
On each run, use the `youtube-thumbnail` skill to improve one thumbnail candidate for the current video. Read and update `~/.agents/tasks/video-packaging/thumbnail-board.md`; save generated assets under `~/.agents/tasks/video-packaging/assets/thumbnails/`; return the best current direction and next lane.
```

Do not paste the whole companion skill into the task prompt.

## Quiet and cheap monitor pattern

For monitoring jobs, avoid high-frequency LLM work that only says "nothing changed." If a deterministic script, API, or existing tool can decide whether anything changed, prefer that outside the repeat-task prompt when available. If the loop must run through the agent, define a cheap no-change path:

- check only the minimal state needed
- update a small checkpoint or ledger
- return one compact no-change bullet
- do not re-run broad research or generation when inputs are unchanged

## Schedules

`schedule` must be a JSON string and is one of:

- Daily — fires at each `HH:MM` (24h, machine local time) every day:
  ```json
  {"type":"daily","times":["09:00","17:00"]}
  ```
- Weekly — fires at each `HH:MM` on each listed day, where `0=Sunday … 6=Saturday`:
  ```json
  {"type":"weekly","times":["09:00"],"daysOfWeek":[1,2,3,4,5]}
  ```

Schedules with no valid times, or unknown `type`, are silently ignored — the task then falls back to `intervalMinutes`.

## Continuous vs scheduled vs interval

Pick exactly one cadence model and prefer the simplest that fits:

- **Wall-clock schedule** (`schedule`): the user wants specific times of day or week.
- **Continuous** (`runContinuously: true`): the user wants the task to run back-to-back with no delay between runs. `intervalMinutes` becomes a floor only when a run completes faster than expected — set it to `1` (the minimum) when running continuously.
- **Interval** (`intervalMinutes`): the default. Use when the user says "every N minutes/hours".

`runContinuously` and `schedule` should not be combined — `schedule` is ignored in continuous mode at runtime.

## Same-session continuation

Set `continueInSession: true` when the user wants the agent to remember previous iterations (for example, a long-running watchdog, a stateful queue worker, or a journaling task). On each run the loop service revives the prior session referenced by `lastSessionId`; if it can no longer be revived a fresh session is created and `lastSessionId` is updated automatically.

If the user wants each run to start from a clean slate (the default for a simple summarizer), leave `continueInSession` off.

Even with `continueInSession: true`, use durable state files for important checkpoints. Conversation context can help continuity, but task progress should survive session fallback, compaction, and manual inspection.

## Speaking the result

Set `speakOnTrigger: true` when the user wants the task to "speak" or "read out" the result. The task then runs snoozed (silent / hidden) and is unsnoozed on completion so the renderer auto-plays TTS for the final assistant message. Leaving this off keeps the run completely passive in the background.

This is independent of any user-level TTS settings — those still control voice, language, and quality.

## Built-in critique pass

Set `critiquePass: true` when the user wants a repeat task with critique, review, or worker feedback. This creates **one configured repeat task** that runs worker -> critic -> worker revision inside each scheduled run. Do not create a second scheduled critic task unless the user explicitly asks for an independently scheduled watchdog.

Set `criticProfileId` only when the user names a specific critic profile; otherwise omit it and the critique pass uses the default active agent.

This increases runtime and token use because each scheduled run performs a worker pass, a critic pass, and a final worker revision pass.

For artifact-heavy tasks, include artifact paths and critic expectations in the task prompt. The built-in critic inspects referenced artifacts when they are available, so the prompt should name canonical files such as dashboards, HTML previews, reports, render outputs, or state files.

Do not describe the worker -> critic -> worker revision mechanics in the task prompt. The runtime already owns that. The prompt should only say what the critic should judge and which artifacts matter.

## Workflow

1. Confirm what the task should produce and how often the harness should run it.
2. Pick the cadence model: schedule, continuous, or interval.
3. Pick an `id`. Prefer short, kebab-case, descriptive — e.g. `daily-standup`, `queue-processor`, `morning-summary`.
4. Choose `profileId` if a specific agent should own the task; otherwise omit it.
5. Decide `continueInSession` (state across runs?), `speakOnTrigger` (TTS on completion?), and `critiquePass` (critic feedback loop?).
6. Decide `runOnStartup` (fire immediately when the app boots?).
7. Decide whether complex reusable procedure belongs in a companion skill instead of the task prompt.
8. Write a prompt contract with objective, inputs, durable state, per-run quota, fallback, stop condition, and final response shape.
9. Write `~/.agents/tasks/<id>/task.md` (or the workspace equivalent) using direct file editing, not app-specific config tools.
10. Confirm with the user, then check it appears in Settings > Loops / Repeat Tasks and that `enabled` is correct.

See `examples.md` (next to this `SKILL.md`) for ready-to-paste templates for each common shape.

## Guardrails

- Always set `kind: task`. The loader rejects files without it.
- Keep `intervalMinutes` ≥ 1. Sub-minute cadence is only achievable via `runContinuously: true`.
- Do not invent fields. Unknown frontmatter keys are ignored silently, so typos look like the option "didn't work".
- `schedule` must be valid JSON on a single line — wrap it in double quotes carefully if your YAML formatter complains.
- Do not hand-set `lastSessionId` or `lastRunAt` unless the user explicitly asks; they are auto-managed.
- Do not put cadence, startup, same-session, TTS, or critique mechanics in the prompt body just because the user mentioned them; encode those in frontmatter.
- For stateful loops, name durable files under the task folder and tell the loop how to update them.
- For artifact-heavy loops, make each run add or improve at least one artifact, ledger entry, or concrete decision.
- Never delete a task directory to "disable" it — set `enabled: false` instead.
- If both global and workspace `.agents/tasks/<id>/` exist, ask the user which layer should own the change before editing.
