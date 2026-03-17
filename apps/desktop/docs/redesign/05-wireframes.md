# Wireframes

These are conceptual wireframes for structure, not final visual design.

## 1. Desktop home / active tasks

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Top bar: Search | New Task | Global Status | Notifications | Settings      │
├───────────────┬───────────────────────────────────────┬─────────────────────┤
│ Left rail     │ Main workspace                        │ Right rail          │
│               │                                       │                     │
│ Tasks         │ [Task Title]        [Running] [Safe]  │ Live Activity       │
│ - Active      │ Goal: Redesign DotAgents UI...        │                     │
│ - Waiting     │                                       │ 12:03 planned 5     │
│ - Done        │ Plan                                  │ 12:03 opened docs   │
│               │  ✓ capture philosophy                 │ 12:04 wrote spec    │
│ Recent        │  → write wireframes                   │ 12:05 needs review  │
│ - Task A      │  • trust model                        │                     │
│ - Task B      │                                       │ Approvals           │
│ - Task C      │ Current Step                          │ - none              │
│               │ Writing wireframe docs                │                     │
│ Automations   │                                       │ Risks               │
│ - Inbox triage│ Output Shelf                          │ - low               │
│ - Weekly recap│ [philosophy.md] [spec.md] [README]    │                     │
│               │                                       │ Controls            │
│               │ Review Status                         │ Pause | Stop |      │
│               │ Verification pending                  │ Retry | Inspect     │
│               │                                       │                     │
│               │ Steering Composer                     │                     │
│               │ > Also draft a migration plan...      │                     │
└───────────────┴───────────────────────────────────────┴─────────────────────┘
```

## 2. Task list view

```text
┌────────────────────────────────────────────────────────────┐
│ Tasks                                                     │
├────────────────────────────────────────────────────────────┤
│ Filters: All | Active | Waiting | Background | Done | Fail│
│                                                            │
│ [Running] Redesign UI around tasks not chat      12m      │
│ current: writing interaction spec                          │
│ artifacts: 6  approvals: 0  verification: pending         │
│                                                            │
│ [Waiting] Post tweet about release                3m       │
│ needs: X login in Chrome                                   │
│                                                            │
│ [Done] Summarize feed                             22m      │
│ outputs: summary.md                                        │
└────────────────────────────────────────────────────────────┘
```

## 3. Review-focused completion state

```text
┌───────────────────────────────────────────────────────────────┐
│ Redesign DotAgents UI                         Completed       │
├───────────────────────────────────────────────────────────────┤
│ What was done                                                │
│ - wrote philosophy doc                                       │
│ - wrote spec and wireframes                                  │
│ - updated AGENTS guidance                                    │
│                                                              │
│ Outputs                                                      │
│ [README.md] [01-philosophy.md] [04-core-interaction-spec.md] │
│                                                              │
│ Verification                                                 │
│ ✓ files created                                              │
│ ✓ docs folder linked                                         │
│ ! design decisions still need product review                 │
│                                                              │
│ Open questions                                               │
│ - should Home and Tasks be separate?                         │
│ - how should mobile handle multi-agent live activity?        │
│                                                              │
│ [Accept] [Continue Working] [Request Changes] [Export]       │
└───────────────────────────────────────────────────────────────┘
```

## 4. Waiting-for-user state

```text
┌─────────────────────────────────────────────────────────────┐
│ Post launch tweet                              Waiting      │
├─────────────────────────────────────────────────────────────┤
│ Blocker                                                     │
│ Chrome debug session is not logged into X.                 │
│                                                             │
│ Why this matters                                            │
│ The agent cannot post without an authenticated browser.    │
│                                                             │
│ Next actions                                                │
│ [Open Chrome Debug] [I have logged in] [Cancel task]       │
│                                                             │
│ Recent attempts                                             │
│ - opened X                                                  │
│ - detected login page                                       │
│ - paused per safety policy                                  │
└─────────────────────────────────────────────────────────────┘
```

## 5. Agent management view

```text
┌──────────────────────────────────────────────────────────────┐
│ Agents                                                      │
├──────────────────────────────────────────────────────────────┤
│ Profiles         Status        Capabilities     Last active │
│ Main agent       idle          tools,memory     now         │
│ Web Browser      running       browser          2m ago      │
│ AJ PT            idle          coaching         1d ago      │
│ internal x3      active        parallel work    now         │
│                                                              │
│ Selected agent details                                       │
│ - permissions                                                 │
│ - default autonomy                                             │
│ - connected tools                                               │
│ - profile prompt / role                                         │
└──────────────────────────────────────────────────────────────┘
```

## Structural interpretation

The important pattern across all wireframes is stable:

- navigation and queue on the left
- task understanding and outputs in the center
- live execution and intervention on the right

This preserves user orientation even as the task state changes.
