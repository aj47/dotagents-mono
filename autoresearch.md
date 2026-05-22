# Autoresearch: Desktop session lifecycle responsiveness

## Objective
Optimize the desktop app for the high-churn session lifecycle path: create many visible sessions, switch/focus one, dismiss/close them, and measure UI lag/responsiveness.

## Current baseline reset
- Previous progress was cleaned and squashed into PR branch `autoresearch/session-lifecycle-speedup-pr`.
- Squashed commit: `8a6d97a04` (`Improve desktop session lifecycle responsiveness`).
- Prior best before reset: `4799ms` from kept run #70 (`5e70d92`) versus corrected active-session baseline `5189ms` (`-7.5%`).
- `autoresearch.jsonl` has been reset to config-only so the next run becomes the new baseline on top of the squashed progress.

## Workload
Run:

```bash
./autoresearch.sh
```

The harness launches isolated Electron dev app repetitions with a gated e2e bridge enabled. Each repetition asks the main process to create concurrent long-running active sessions from the original agent-loop e2e use cases by default, waits for the real renderer session UI to receive them, switches/focuses between sessions through the real sidebar row click path, stops/removes a subset through the real sidebar stop/remove button path, then switches among remaining sessions and records responsiveness via CDP. `autoresearch.sh` reports the median metrics across repetitions to reduce benchmark jitter without weakening the workload.

Pi autoresearch config:

- `autoresearch.config.json` sets `workingDir` to this repo and `maxIterations` to `200`.

Environment knobs:

- `SESSION_E2E_SCENARIO` default `original-e2e` (`generic` is also supported)
- `SESSION_E2E_COUNT` default `10` for the original e2e use-case set
- `SESSION_E2E_CLOSE_COUNT` default half the session count (`5` when the default count is `10`)
- `SESSION_E2E_SWITCH_COUNT` default twice the session count (`20` when the default count is `10`)
- `SESSION_E2E_COMPLETED` default `false`; active long-running sessions are the default workload
- `SESSION_E2E_MESSAGE_REPEAT` default `8`
- `SESSION_E2E_REPEATS` default `3` independent full app repetitions; set `1` for a single diagnostic run
- `SESSION_E2E_METRICS_DIR` default `tmp/autoresearch-session-lifecycle`

## Primary metric
- `session_lifecycle_ms` (lower is better): median full harness wall-clock time across `SESSION_E2E_REPEATS` independent repetitions, each including Electron startup, session injection, focus, close loop, and responsiveness collection.

## Secondary metrics
- `session_count`, `use_case_count`
- `ui_ready_ms`
- `session_create_ms`
- `session_first_paint_ms`
- `session_focus_ms`
- `switch_latency_ms_p50`, `switch_latency_ms_p95`, `switch_latency_ms_max`, `switch_latency_ms_total`
- `close_latency_ms_p50`, `close_latency_ms_p95`, `close_latency_ms_max`, `close_latency_ms_total`
- `ui_input_latency_ms`
- `ui_raf_delay_p95_ms`, `ui_raf_delay_ms`
- `ui_long_task_count`
- `dom_nodes_after_create`, `dom_nodes_final`

Secondary metrics are also reported as medians across repetitions when `SESSION_E2E_REPEATS > 1`.

## Editable surface
Any source code file in the repo may be changed when it plausibly improves this workload, including desktop renderer, desktop main process, shared desktop types/utilities, and shared package code.

High-probability areas:
- `apps/desktop/src/renderer/src/components/active-agents-sidebar.tsx` — session list rendering and dismiss controls.
- `apps/desktop/src/renderer/src/pages/sessions.tsx` — selected session tile and session hydration/render path.
- `apps/desktop/src/renderer/src/components/agent-progress.tsx` — heavy session tile/chat rendering.
- `apps/desktop/src/renderer/src/stores/agent-store.ts` — session progress merge and cleanup behavior.
- `apps/desktop/src/renderer/src/lib/sidebar-sessions.ts` — session ordering/status helpers.
- `apps/desktop/src/main/tipc.ts`, `apps/desktop/src/main/agent-session-tracker.ts`, `apps/desktop/src/main/emit-agent-progress.ts` — main-process session lifecycle and progress broadcast paths.
- `packages/shared/src/*` and `apps/desktop/src/shared/*` — shared rendering/progress utilities if the optimization belongs there.

## Benchmark / harness files
Do **not** change the benchmark or autoresearch harness to improve scores. Only touch these when they are broken, flaky, or need diagnostic metrics that do not change the workload:
- `scripts/session-lifecycle-e2e.mjs`
- `apps/desktop/src/renderer/src/lib/session-e2e-harness.ts`
- `autoresearch.sh`
- `autoresearch.checks.sh`
- `autoresearch.config.json`

## Constraints
- Primary metric is `session_lifecycle_ms`; lower is better.
- Preserve the default workload: original-e2e scenario with 10 active long-running use-case sessions, 20 real sidebar switches, stopping/removing 5 sessions, then switching among the remaining sessions, repeated independently for median scoring.
- Do not weaken real session cleanup semantics.
- Do not change benchmark behavior or thresholds unless the harness itself is broken; document any harness fix in `autoresearch.md` and ASI.
- Keep renderer/main boundaries intact; renderer must not import from `src/main`.
- Keep the e2e bridge gated by `DOTAGENTS_SESSION_E2E_HARNESS=1`.
- Prefer actual UI/source-path improvements over benchmark-only shortcuts.
