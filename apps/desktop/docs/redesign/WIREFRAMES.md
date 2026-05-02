# Wireframes

These are intentionally low-fidelity structural wireframes. They describe layout and hierarchy, not final styling.

## 1. Main workbench

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top bar: search | new task | global status | notifications | profile        │
├───────────────┬───────────────────────────────────────────┬──────────────────┤
│ Work queue    │ Task workspace                            │ Live rail        │
│               │                                           │                  │
│ Running       │ [Goal] Redesign .agents UI from first    │ [Current step]   │
│ • UI redesign │ principles                                │ Synthesizing IA  │
│ • Issue triage│                                           │                  │
│               │ [Plan]                                    │ [Approvals]      │
│ Needs input   │ 1. Capture philosophy                     │ None             │
│ • Chrome login│ 2. Define IA                              │                  │
│               │ 3. Draft wireframes                       │ [Recent actions] │
│ Needs review  │ 4. Propose migration path                 │ tool: read file  │
│ • Sponsor doc │                                           │ tool: write doc  │
│               │ [Progress]                                │ tool: save spec  │
│ Completed     │ 3/4 steps done | 2 artifacts | low risk   │                  │
│ • Email draft │                                           │ [Artifacts]      │
│               │ [Artifacts]                               │ philosophy.md    │
│               │ philosophy.md                             │ spec.md          │
│               │ product_spec.md                           │                  │
│               │ wireframes.md                             │ [Risk / trust]   │
│               │                                           │ low risk         │
│               │ [Review state] Needs review               │ verified: no     │
│               │                                           │                  │
│               │ [Steer this run...]                       │                  │
├───────────────┴───────────────────────────────────────────┴──────────────────┤
│ Optional bottom tray: transcript / raw logs / debug / tool traces            │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 2. Run in approval state

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Goal: Post tweet about sponsor update                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Current step: Awaiting approval                                              │
│ The agent wants to open Chrome and post to X.                                │
│                                                                              │
│ Proposed action                                                              │
│ Open logged-in Chrome profile and publish one tweet from drafted copy.       │
│                                                                              │
│ Why needed                                                                   │
│ External side effect required to complete the task.                          │
│                                                                              │
│ Risk level                                                                   │
│ Medium — public action, reversible only by deletion.                         │
│                                                                              │
│ [Approve and continue] [Edit action] [Deny] [Pause run]                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 3. Review-ready completion state

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Run complete: Research brief on redesign direction                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Summary                                                                      │
│ Created 8 docs covering philosophy, IA, specs, wireframes, and migration.   │
│                                                                              │
│ Outputs                                                                      │
│ • docs/redesign/PHILOSOPHY.md                                                │
│ • docs/redesign/PRODUCT_SPEC.md                                              │
│ • docs/redesign/WIREFRAMES.md                                                │
│ • docs/redesign/MIGRATION_PLAN.md                                            │
│                                                                              │
│ Verification                                                                 │
│ • Files created successfully                                                 │
│ • Cross-file references aligned                                              │
│ • No UI code changed                                                         │
│                                                                              │
│ Review actions                                                               │
│ [Open files] [Request revisions] [Branch new run] [Mark approved]            │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 4. Multi-run overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Work                                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│ Running (2)                                                                  │
│ ┌──────────────────────┐  ┌──────────────────────┐                            │
│ │ UI redesign docs     │  │ Inbox triage         │                            │
│ │ step: wireframes     │  │ step: summarizing    │                            │
│ │ low risk             │  │ awaiting input       │                            │
│ └──────────────────────┘  └──────────────────────┘                            │
│                                                                              │
│ Needs review (2)                                                             │
│ ┌──────────────────────┐  ┌──────────────────────┐                            │
│ │ Draft email          │  │ Updated issue spec   │                            │
│ │ ready to send        │  │ verify copy          │                            │
│ └──────────────────────┘  └──────────────────────┘                            │
│                                                                              │
│ Blocked (1)                                                                  │
│ ┌──────────────────────┐                                                      │
│ │ X posting            │                                                      │
│ │ blocked on login     │                                                      │
│ └──────────────────────┘                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 5. Transcript as secondary surface

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Overview | Activity | Artifacts | Chat | Verification                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ Chat                                                                         │
│ User: I think I need to redesign .agents UI completely...                    │
│ Assistant: Here's the first-principles framing...                            │
│ User: Write docs for this                                                    │
│ Assistant: Working on it...                                                  │
│                                                                              │
│ [Steer this run...]                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Layout implications

The key visual shift is that transcript is no longer the home screen. The home screen is an operational workspace for a run.
