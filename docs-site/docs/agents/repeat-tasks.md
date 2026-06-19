---
sidebar_position: 4
sidebar_label: "Repeat Tasks"
---

# Repeat Tasks

Repeat tasks are scheduled agent runs. They are useful when the work should recur without you starting a new chat each time: checking a queue, refreshing a dashboard, drafting a daily brief, watching for regressions, or iterating on an artifact until it passes review.

In DotAgents, repeat tasks are file-backed `.agents` tasks. The desktop scheduler owns execution, the mobile app can create and edit them through the remote API, and the sidebar groups their run history separately from normal user sessions.

## When To Use Repeat Tasks

Use a repeat task when all of these are true:

- The instruction is stable enough to run more than once.
- Each run can produce a compact answer, artifact, or state update.
- The agent has clear permission boundaries for any tools it may call.
- You are comfortable with the cadence, token cost, and side effects.

Good examples:

- Refresh a research dashboard every few hours.
- Process one item from a queue until the queue is empty.
- Draft titles, hooks, thumbnails, or release notes on a schedule.
- Audit a changing artifact and report only material changes.
- Run a watchdog that checks health, logs, or open pull requests.

Avoid repeat tasks for:

- One-shot work that is easier to do in a normal session.
- Irreversible actions unless the task requires tool approval or human confirmation.
- Hard real-time automation where a delayed LLM response is unacceptable.
- Vague prompts such as "improve my business" without a measurable artifact or decision.
- Tasks where the agent cannot inspect the evidence needed to make progress.

## Where They Live

Repeat tasks are markdown files:

```text
~/.agents/tasks/<task-id>/task.md
./.agents/tasks/<task-id>/task.md
```

The global layer is `~/.agents/`. A workspace can add `./.agents/`; workspace tasks with the same `id` override global tasks.

The frontmatter is simple `key: value` metadata, not full YAML.

```markdown
---
kind: task
id: youtube-growth-lab
name: YouTube Growth Lab
enabled: true
intervalMinutes: 60
profileId: main-agent
runOnStartup: true
continueInSession: true
critiquePass: true
criticProfileId: strict-critic
---

Review recent channel notes, analytics exports, and audience evidence. Produce:

- Three title candidates
- Three hook candidates
- One thumbnail concept
- One evidence note that explains what changed since the last run

Write the latest artifact to `~/.agents/tasks/youtube-growth-lab/latest.md`.
The critique pass should reject unsupported claims, vague packaging, and any draft that does not cite the evidence it used.
```

## Core Fields

| Field | Description |
|-------|-------------|
| `kind` | Must be `task`. |
| `id` | Stable task identifier. Defaults from the folder name when omitted. |
| `name` | Display name used in settings, task lists, and sidebar grouping. |
| `enabled` | Enables or pauses the task without deleting it. |
| `intervalMinutes` | Fixed interval between runs. Minimum is `1`. Ignored when `schedule` is set. |
| `schedule` | Optional JSON daily or weekly schedule. |
| `runContinuously` | Starts the next run as soon as the previous run finishes. Use for queue workers and tight iteration loops. |
| `runOnStartup` | Runs once when the desktop app starts. |
| `profileId` | Agent that should run the worker pass. Omit to use the default agent. |
| `continueInSession` | Reuses the worker conversation across runs. |
| `lastSessionId` | Runtime-managed session pointer for `continueInSession`. Do not hand-edit it unless you are intentionally pinning a session. |
| `speakOnTrigger` | Runs quietly, then unsnoozes completion for text-to-speech playback. |
| `critiquePass` | Enables the built-in worker -> critic -> worker revision loop for each run. |
| `criticProfileId` | Optional agent profile for the critic pass. Omit to use the default agent. |
| `maxIterations` | Optional cap for agent-loop iterations during a run. |

## Cadence

Pick one cadence model:

| Model | Use when | Fields |
|-------|----------|--------|
| Interval | The task should run every N minutes. | `intervalMinutes` |
| Wall-clock schedule | The task should run at specific local times. | `schedule` |
| Continuous | The task should run back-to-back until disabled. | `runContinuously: true`, `intervalMinutes: 1` |

Do not combine `runContinuously` and `schedule`. Continuous mode is for queue-style work; wall-clock schedule is for time-of-day work.

## Session Memory

`continueInSession` controls whether the worker keeps conversation history across runs.

| Setting | Behavior | Use for |
|---------|----------|---------|
| `continueInSession: false` | Each run starts with a fresh worker conversation. | Stateless checks, summaries, independent snapshots. |
| `continueInSession: true` | Each run appends to the previous worker conversation. | Stateful iteration, journals, long-running queues, accumulating decisions. |

This is separate from sidebar collapse. The sidebar can show one row per task while the underlying runs still keep separate conversations. Collapsing task rows is presentation only; it does not merge history.

## Built-In Critique Pass

Set `critiquePass: true` when a task should not trust the worker's first answer.

Each scheduled run becomes:

```text
1. Worker pass
   Runs the task prompt with `profileId`.

2. Critic pass
   Creates a separate critic conversation.
   Reviews the original prompt, the worker answer, and referenced artifacts.
   Uses `criticProfileId` when provided.

3. Worker revision
   Appends the critic's feedback back into the worker conversation.
   Asks the worker to produce the final revised answer.
```

The built-in critique pass is one configured repeat task. It is not a second scheduled critic task. Use a separate scheduled critic only when you intentionally want an independent watchdog with its own cadence.

### What The Critic Sees

The built-in critic prompt includes:

- The original repeat-task prompt.
- The worker's latest answer.
- Instructions to inspect local files, artifact paths, or URLs referenced by the prompt or worker answer when available and material.
- Instructions to judge artifacts and decisions, not only prose.

The critic runs in its own conversation. The worker revision happens in the worker conversation. If `continueInSession` is enabled, only the worker session is continued across runs; the built-in critic starts fresh for each run.

## Why Critique Helps

The design follows a practical pattern from agent research: first generate, then critique, then revise.

- [Self-Refine](https://arxiv.org/abs/2303.17651) shows that iterative feedback and refinement can improve outputs at test time without model training.
- [Reflexion](https://arxiv.org/abs/2303.11366) frames language feedback as a way for agents to improve future decisions without updating model weights.
- [OpenAI's CriticGPT work](https://openai.com/index/finding-gpt4s-mistakes-with-gpt-4/) found that model-generated critiques can help humans catch more issues, while also noting that critics still hallucinate and struggle with long or dispersed errors.
- [LLM-as-a-judge research](https://arxiv.org/abs/2306.05685) supports using strong models as scalable evaluators, but calls out bias and reasoning limits.
- [ReAct](https://arxiv.org/abs/2210.03629) and [SWE-agent](https://arxiv.org/abs/2405.15793) both reinforce the same product lesson: agents do better when the environment gives them clear interfaces, observations, and feedback loops.

That research does not mean every critique is correct. It means critique is most useful when it is grounded in artifacts, rubrics, and observable pass/fail criteria.

## Designing A Good Critique

A good repeat-task critique is not "be more critical." It is a bounded review contract.

### Give The Worker A Concrete Artifact

The worker should produce something the critic can inspect:

- A markdown report.
- An HTML dashboard.
- A rendered image or video.
- A JSON state file.
- A checklist with evidence links.
- A decision record.

Name canonical paths in the prompt. For example:

```markdown
Write the current report to `~/.agents/tasks/youtube-growth-lab/latest.md`.
Keep durable state in `~/.agents/tasks/youtube-growth-lab/state.json`.
```

### Give The Critic A Rubric

Put the rubric in the task prompt so the built-in critic sees it.

Good rubrics specify:

- Required files or outputs.
- Evidence that must be cited.
- Blockers that should force revision.
- What counts as "done."
- What should be ignored as low-value nitpicking.

Example:

```markdown
Critique rubric:

- Fail if any title claim is not supported by an analytics note, transcript quote, or audience comment.
- Fail if the thumbnail concept cannot be drawn from real assets we have.
- Fail if the recommendation repeats the previous run without a material new reason.
- Pass with caveat if the output is useful but one evidence item is weak.
- Return only: verdict, top blocker, artifact path reviewed, and one correction.
```

### Keep Critiques Actionable

The revision pass works best when critique output is short and specific.

Prefer:

```text
Verdict: REVISE
Blocker: The top title claims "retention doubled" but the artifact only cites comments, not retention data.
Correction: Replace the retention claim with a comment-backed claim or attach the retention export.
```

Avoid:

```text
The work could be more strategic and the writing should be more compelling.
```

### Separate Evidence From Inference

Ask the critic to label:

- What it observed in files, tool output, or URLs.
- What it inferred from that evidence.
- What is still missing.

This reduces the chance that the critic invents a flaw or accepts an unsupported claim.

### Decide How Strict To Be

Strict critics are best for public artifacts, irreversible decisions, code changes, and anything that could mislead a user. Softer critics are better for brainstorming and exploratory ideation.

If a task keeps getting stuck, do not make the critic vague. Change the task behavior:

- Archive blocked work and start a new candidate.
- Ask for human approval when evidence is missing.
- Lower the claim strength.
- Add a source-collection step before artifact generation.

## UI And API Behavior

Desktop settings expose **Critique mode** on repeat tasks. When enabled, choose the default critic or a dedicated critic agent.

Mobile uses the same remote API fields:

```json
{
  "name": "YouTube Growth Lab",
  "prompt": "Draft titles, hooks, and thumbnail concepts from the latest evidence.",
  "intervalMinutes": 60,
  "enabled": true,
  "profileId": "main-agent",
  "critiquePass": true,
  "criticProfileId": "strict-critic"
}
```

The remote API returns `critiquePass`, `criticProfileId`, and `criticProfileName` from `GET /v1/loops`. If critique mode is off, `criticProfileId` is not reported as active.

The sidebar groups repeat-task runs by repeat-task provenance. Worker and critic conversations for the same task collapse into one task row so the Sessions list stays focused on user-started conversations. Existing historical conversations may remain as normal sessions when they cannot be safely backfilled to a unique task prompt.

## Current Limitations And Improvement Ideas

The current built-in critique pass is intentionally simple. Important gaps to keep in mind:

| Gap | Why it matters | Possible improvement |
|-----|----------------|----------------------|
| Generic critic prompt | The built-in critic can only infer the domain rubric from the task body. | Add a first-class `criticPrompt` or `critiqueRubric` field. |
| Free-form critique result | The worker revises whenever the critic returns text; there is no structured verdict gate. | Support `PASS`, `REVISE`, and `BLOCKED` as structured outcomes. |
| Same model blind spots | A critic using the same model and context may share the worker's assumptions. | Encourage dedicated critic agents, alternate models, or artifact-first rubrics. |
| Extra token and runtime cost | Critique mode can run up to three agent passes per scheduled run. | Show expected run cost and duration in settings before enabling. |
| Artifact access is prompt-dependent | The critic only inspects paths and URLs it can see or infer. | Add explicit artifact fields or task-owned artifact manifests. |
| Human approval is still separate | Critique reduces mistakes but does not replace permission checks. | Require tool approval for irreversible actions and expose a "needs approval" task state. |
| Historical cleanup is conservative | Old task-run sessions without provenance may stay in Sessions. | Add a manual "reclassify as task run" or "hide old task runs" action. |

## Templates

### Simple Interval Task

```markdown
---
kind: task
id: link-check
name: Link Check
enabled: true
intervalMinutes: 60
---

Check the project README for broken links and report only links that fail.
```

### Continuous Queue Worker

```markdown
---
kind: task
id: inbox-triage
name: Inbox Triage
enabled: true
intervalMinutes: 1
runContinuously: true
profileId: main-agent
---

Process one inbox item. If no item is available, report idle and do not fabricate work.
```

### Reviewed Artifact Task

```markdown
---
kind: task
id: reviewed-release-notes
name: Reviewed Release Notes
enabled: true
intervalMinutes: 240
profileId: writer
critiquePass: true
criticProfileId: release-critic
---

Draft release notes from merged PRs since the previous run.

Write:

- `~/.agents/tasks/reviewed-release-notes/latest.md`
- `~/.agents/tasks/reviewed-release-notes/state.json`

Critique rubric:

- Fail if any user-facing claim lacks a PR, commit, or issue reference.
- Fail if breaking changes are not called out.
- Fail if the notes include internal implementation detail that users cannot act on.
- Return only verdict, reviewed path, blocker, and one correction.
```

## Related Pages

- [Agents](/agents/profiles)
- [Settings Reference](/configuration/settings)
- [Remote API Reference](/reference/api)
- [The .agents Protocol](/concepts/dot-agents-protocol)
