# Main Screen Wireframes

These are low-fidelity text wireframes meant to clarify layout and hierarchy, not visual style.

## 1. Home / active task view

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ DotAgents                                                                                  │
├──────────────────────┬───────────────────────────────────────────────┬──────────────────────┤
│ Tasks                │ Redesign DotAgents UI                         │ Live Activity        │
│                      │ Active · Visible autonomy · 12m               │                      │
│ [+ New Task]         │                                               │ • Read 3 docs        │
│                      │ Goal                                          │ • Wrote philosophy   │
│ Active               │ Reframe the product from chat-first to        │ • Created wireframes │
│ > UI redesign        │ task-first and produce redesign docs          │                      │
│   Release notes      │                                               │ Pending approvals    │
│   Security review    │ Plan                                          │ None                 │
│                      │ [✓] Define first principles                   │                      │
│ Waiting              │ [→] Draft spec and wireframes                 │ Blockers             │
│   Tax summary        │ [ ] Translate into implementation roadmap     │ None                 │
│                      │                                               │                      │
│ Completed            │ Current step                                  │ Quick steer          │
│   Inbox triage       │ Writing the UI spec and interaction model     │ [ Pause ] [ Stop ]   │
│   Build fix          │                                               │ [ Tighten scope ]    │
│                      │ Outputs                                       │ [ Ask question ]     │
│                      │ - philosophy.md                               │                      │
│                      │ - ui-spec.md                                  │                      │
│                      │ - wireframes.md                               │                      │
│                      │                                               │                      │
│                      │ Steering                                      │                      │
│                      │ > Keep this focused on desktop first          │                      │
└──────────────────────┴───────────────────────────────────────────────┴──────────────────────┘
```

## 2. Approval-needed state

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Task: Post release thread                                                                   │
├──────────────────────┬───────────────────────────────────────────────┬──────────────────────┤
│ Tasks                │ Review before publish                         │ Approval needed      │
│                      │                                               │                      │
│ Active               │ Draft artifact                                │ Post to X            │
│ > Release thread     │ "DotAgents is shifting from chat UI to task  │                      │
│                      │ orchestration..."                             │ Why approval needed  │
│                      │                                               │ Externally visible   │
│                      │ Verification                                  │ account-affecting    │
│                      │ [✓] Draft complete                            │                      │
│                      │ [✓] Character count valid                     │ Preview              │
│                      │ [ ] Final user review                         │ [tweet preview...]   │
│                      │                                               │                      │
│                      │ Notes                                         │ [Approve] [Edit]     │
│                      │ The system is paused at a publish boundary.   │ [Reject]             │
└──────────────────────┴───────────────────────────────────────────────┴──────────────────────┘
```

## 3. Failure / recovery state

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Task: Build desktop release                                                                  │
├──────────────────────┬───────────────────────────────────────────────┬──────────────────────┤
│ Tasks                │ Blocked                                       │ Failure details      │
│                      │                                               │                      │
│ Blocked              │ Current step failed                           │ pnpm build failed    │
│ > Desktop release    │ Typecheck failed in src/renderer/App.tsx      │ at 14:42             │
│                      │                                               │                      │
│                      │ What happened                                 │ What you can do      │
│                      │ The system attempted build, captured logs,     │ [Retry differently]  │
│                      │ and stopped at the first unrecoverable error. │ [Open logs]          │
│                      │                                               │ [Ask agent to fix]   │
│                      │ Last successful outputs                       │ [Branch new run]     │
│                      │ - compiled shared packages                    │                      │
│                      │ - generated release notes draft               │                      │
└──────────────────────┴───────────────────────────────────────────────┴──────────────────────┘
```

## 4. Completion / review state

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Task: Redesign DotAgents UI                                                                  │
├──────────────────────┬───────────────────────────────────────────────┬──────────────────────┤
│ Tasks                │ Ready for review                              │ Verification         │
│                      │                                               │                      │
│ Completed            │ Summary                                       │ [✓] Docs created     │
│ > UI redesign        │ Created philosophy, principles, IA, trust     │ [✓] Files saved      │
│                      │ model, spec, wireframes, and roadmap docs.    │ [ ] Team reviewed    │
│                      │                                               │                      │
│                      │ Artifacts                                     │ Confidence           │
│                      │ - docs/redesign/philosophy.md                 │ High, because the    │
│                      │ - docs/redesign/ui-spec.md                    │ model is internally  │
│                      │ - docs/redesign/main-screen-wireframes.md     │ consistent but not   │
│                      │                                               │ yet validated with   │
│                      │ Recommended next actions                      │ implementation learn │
│                      │ [Create issue] [Start mockups] [Map to code]  │                      │
└──────────────────────┴───────────────────────────────────────────────┴──────────────────────┘
```

## Layout rationale

The layout intentionally separates:

- navigation and resumability on the left
- task understanding and output review in the center
- execution visibility and intervention controls on the right

This reduces the pressure on any single transcript to carry the entire experience.
