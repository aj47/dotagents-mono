# Repeat Task Examples

Ready-to-paste templates for the most common shapes. Save each one to `~/.agents/tasks/<id>/task.md` (or the workspace-layer equivalent under `${DOTAGENTS_WORKSPACE_DIR}/.agents/`).

## 1. Basic interval task

Runs every 60 minutes (the default) using the user's current agent.

```markdown
---
kind: task
id: link-check
name: Link Check
enabled: true
intervalMinutes: 60
---

Check the project README for broken links and report any that 404.
```

## 2. Fire-on-startup task

Same as above, but also runs once immediately when the app boots.

```markdown
---
kind: task
id: morning-briefing
name: Morning Briefing
enabled: true
intervalMinutes: 240
runOnStartup: true
---

Summarize new emails and calendar events since I last logged in.
```

## 3. Wall-clock daily schedule

Fires at 09:00 and 17:00 every day in the local timezone. `intervalMinutes` is ignored when `schedule` is present.

```markdown
---
kind: task
id: daily-standup
name: Daily Standup Prep
enabled: true
intervalMinutes: 60
schedule: {"type":"daily","times":["09:00","17:00"]}
---

List the three highest-priority tasks for today based on my notes and open issues.
```

## 4. Weekly schedule (weekdays only)

Fires at 09:00 Monday through Friday (`daysOfWeek` uses `0=Sunday … 6=Saturday`).

```markdown
---
kind: task
id: weekly-review
name: Weekly Review
enabled: true
intervalMinutes: 60
schedule: {"type":"weekly","times":["09:00"],"daysOfWeek":[1,2,3,4,5]}
---

Summarize this week's commits and surface anything that still needs review.
```

## 5. Continuous task

Starts the next run immediately after the previous one finishes — useful for queue workers and watchdogs. Set `intervalMinutes` to `1` (the minimum) as a safety floor.

```markdown
---
kind: task
id: queue-processor
name: Process Queue
enabled: true
intervalMinutes: 1
runContinuously: true
profileId: background-worker
---

Pull the next item from the processing queue and handle it. If the queue is empty, report idle.
```

## 6. Same-session continuation

Reuses the prior session/conversation across iterations so the agent retains context. The runtime auto-tracks `lastSessionId` after the first run — do not set it by hand.

```markdown
---
kind: task
id: ongoing-journal
name: Ongoing Project Journal
enabled: true
intervalMinutes: 120
continueInSession: true
---

Append today's progress to the running journal we've been keeping. Note any decisions or blockers since the last entry.
```

## 7. Speak the result (TTS)

The task runs snoozed (silent) and is unsnoozed on completion so the renderer auto-plays TTS of the final assistant message. Per-user voice/language settings still apply.

```markdown
---
kind: task
id: hourly-news
name: Hourly News Brief
enabled: true
intervalMinutes: 60
speakOnTrigger: true
profileId: news-anchor
---

Give me a 60-second brief on the top three tech headlines since the last brief, formatted for spoken delivery.
```

## 8. Pinned to a specific agent profile

Use `profileId` when a specific agent should always own the task. Omit it to use the user's current default agent.

```markdown
---
kind: task
id: code-review-bot
name: Auto Code Review
enabled: true
intervalMinutes: 30
profileId: code-reviewer
---

Review any PR opened on this repo in the last 30 minutes and post inline comments for obvious issues.
```

## 9. Built-in critique pass

Runs the worker once, has a built-in critic pass review the answer and referenced artifacts, then asks the worker to revise using that critique. Omit `criticProfileId` to use the default active agent for critique. This is one configured repeat task, not a second scheduled critic task.

```markdown
---
kind: task
id: reviewed-daily-plan
name: Reviewed Daily Plan
enabled: true
intervalMinutes: 1440
profileId: planner
critiquePass: true
criticProfileId: critical-reviewer
---

Draft today's execution plan from my goals, calendar, and open work. Prioritize what most improves leverage and identify any risky assumptions.

When producing artifacts, write them to `~/.agents/tasks/reviewed-daily-plan/latest-plan.md`. The critique pass should inspect that file and challenge unsupported assumptions, vague next actions, and priority inversions before the final revision.
```

## 10. Disable without deleting

To pause a task without losing its config or history, set `enabled: false`. Do not delete the directory.

```markdown
---
kind: task
id: legacy-cleanup
name: Legacy Cleanup
enabled: false
intervalMinutes: 1440
---

Sweep old artifacts from the build cache.
```
