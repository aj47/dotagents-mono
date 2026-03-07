# Streaming Lag Investigation Ledger

## Scope

- Focus: user-visible lag, jank, delayed paint, low FPS, blocked input, and scroll bugs during long streamed responses in the desktop app.
- Surfaces: normal agents and ACP agents, with special attention to session views and auto-scroll behavior.
- Evidence standard: prefer Chrome/Electron renderer traces, flame charts, long-task evidence, React commit evidence, and directly observed repro steps.

## Checked

- [x] `apps/desktop/DEBUGGING.md` exists and documents `REMOTE_DEBUGGING_PORT` plus renderer target selection in Chrome DevTools.
- [x] Confirmed `streaming-lag.md` already existed before this iteration and reviewed it before choosing a new repro.
- [x] Located likely desktop session streaming/scroll UI code in:
  - `apps/desktop/src/renderer/src/components/agent-progress.tsx`
  - `apps/desktop/src/renderer/src/components/session-tile.tsx`
  - `apps/desktop/src/renderer/src/pages/sessions.tsx`
- [x] Launched desktop dev app with remote debugging enabled and confirmed both renderer targets from `http://localhost:9333/json/list`:
  - main window: `http://localhost:5174/`
  - panel window: `http://localhost:5174/panel`
- [x] Confirmed the panel renderer is the visible target for user-visible timing work; the main renderer was hidden during this iteration.
- [x] Confirmed real long responses were produced in this session by both:
  - normal agent (`main-agent`) — completed session `session_1772916642378_towh3dak4`, final content length `6783`
  - ACP agent (`augustus`) — completed session `session_1772916586475_fr6pyi0hv`, final content length `5383`
- [x] Reproduced a renderer performance issue in the visible panel session view by replaying real normal-agent response text into `AgentProgress` streaming state in 84 chunks while the chat view was focused.
- [x] Verified the streaming bubble currently renders live content through `MarkdownRenderer` in `StreamingContentBubble`, meaning the full accumulated buffer is reparsed on every streamed chunk.
- [x] Reviewed this ledger before starting a new loop and avoided repeating the prior markdown hot-path replay investigation.
- [x] Re-inspected desktop session scroll logic in `apps/desktop/src/renderer/src/components/agent-progress.tsx`, especially the initial auto-scroll retry effect, the streaming auto-scroll effect, and `handleScroll` state transitions.
- [x] Reattached to the live Electron renderer over CDP with `agent-browser --cdp 9333` and inspected both the panel target and the main window target during active sessions.
- [x] Confirmed the panel can auto-resize aggressively enough to hide overflow during some probes, so overflow/scroll correctness is easier to observe from the main sessions window than from the floating panel in this loop.
- [x] Confirmed the shared session renderer still scheduled four delayed initial scroll-to-bottom retries (`0/50/100/200ms`) after mount / first display item appearance, regardless of whether the user had already scrolled upward.
- [x] Positively identified the active overflowing session scroller in the main sessions window via `.progress-panel .h-full.overflow-y-auto.scrollbar-hide-until-hover` / `.progress-panel .h-full.overflow-y-auto` DOM probes and recorded exact bottom-gap samples from it.
- [x] Reproduced a pinned-at-bottom streaming scroll-lag issue in the visible main sessions window for both a normal-agent probe session and an ACP-styled probe session by streaming long text into the live renderer store and sampling bottom-gap after one vs two animation frames.
- [x] Captured renderer traces for this scroll-lag repro before and after the fix:
  - `apps/desktop/tmp/stream-scroll-before-fix.zip`
  - `apps/desktop/tmp/stream-scroll-after-fix.zip`
- [x] Inspected the ACP-specific delegated sub-agent conversation scroller in `SubAgentConversationPanel` inside `apps/desktop/src/renderer/src/components/agent-progress.tsx` and confirmed it still had its own pinned-bottom logic separate from the shared session scroller.
- [x] Verified there is no separate mobile equivalent of this delegated sub-agent conversation panel; the relevant scroll path is desktop-only in this repo.
- [x] Reproduced a fresh ACP-only scroll lag in the visible main sessions window by scripting delegated conversation messages into the live renderer store and sampling the inner conversation panel bottom-gap over animation frames while pinned at bottom.
- [x] Reproduced a fresh settled-grid streaming lag in the visible main sessions window (`http://localhost:5174/`) by seeding 12 long session tiles into the live renderer store, waiting for the grid to settle, and then streaming chunks into one active tile while measuring chunk→next-frame delay.
- [x] Ruled out one tempting but secondary culprit: removing the `AgentProgress` close-button subscription to the full `agentProgressById` map alone only nudged the 12-tile probe from `~785ms` to `~751ms` avg chunk→frame delay, so it was not the primary sessions-grid bottleneck.
- [x] Captured settled-grid main-window traces around the 12-tile streaming repro:
  - before: `apps/desktop/tmp/session-stream-many-tiles-before-fix.trace.json`
  - after: `apps/desktop/tmp/session-stream-many-tiles-after-fix.trace.json`
- [x] Reproduced a fresh ACP delegated-conversation recovery bug in the visible main sessions window by scrolling the inner sub-agent panel upward, clicking `Latest`, and sampling exact bottom-gap / button visibility over subsequent animation frames while new delegated messages continued arriving.

## Not Yet Checked

- [ ] Repro on a live long-streaming ACP-agent session in the visible panel with timing capture, not just completion confirmation.
- [ ] Compare focused session overlay vs tile/session-grid behavior.
- [ ] Capture a proper Chrome Performance/CPU trace on the visible panel target; CDP CPU-profiler attempts were too heavy/noisy in this loop.
- [ ] Capture a proper Chrome Performance trace specifically for the ACP delegated sub-agent conversation panel while its inner scroller overflows; this loop used CDP frame/bottom-gap sampling instead.
- [ ] Measure shared/non-ACP behavior after user scrolls upward mid-stream.
- [ ] Measure shared/non-ACP sticky-at-bottom recovery when returning to bottom.
- [ ] Check for scroll jumps when switching sessions / panes / routes.
- [ ] Check whether DOM growth or layout thrash worsens with long histories.
- [ ] Capture a live ACP-agent scroll-interruption repro in an overflowing focused session detail, not just shared-renderer source evidence.
- [ ] Capture a live normal-agent scroll-interruption repro in a stable 1x1/focused session tile with exact bottom-gap samples before/after manual wheel scroll.
- [ ] Measure wheel / trackpad / keyboard scrolling separately from scripted `scrollTop` changes once a stable overflow harness exists.
- [ ] Check whether the sessions page-level `scrollIntoView(..., { behavior: 'smooth' })` paths introduce a separate scroll-jump issue while active sessions stream.
- [ ] Run the same settled-grid repro against a real ACP session mix instead of a synthetic long-history store harness.
- [ ] Investigate the remaining single-tile baseline cost (`~72ms` avg chunk→next-frame) in the focused/final tile path after the sessions-grid fix.

## Reproduced

- **Scenario:** visible panel session view (`/panel`), chat tab focused, pinned-stream replay using real `main-agent` final content (`6783` chars) applied to the renderer store in 84 chunks of 80 chars.
- **Evidence:** before the fix, the per-chunk paint cost climbed with accumulated text size, which is consistent with reparsing/re-rendering the entire markdown buffer on each stream chunk.
- **Baseline measurements (panel replay, before fix):**
  - `avgChunkToPaintMs`: `37.5`
  - `p95ChunkToPaintMs`: `67.6`
  - `maxChunkToPaintMs`: `82.6`
  - worst observed frame gap: `116.6ms`
  - tail chunks degraded badly (`58.4ms`, `67.4ms`, `67.6ms`, `67.8ms`, `82.6ms`)
- **Diagnosis:** `apps/desktop/src/renderer/src/components/agent-progress.tsx` rendered the active streaming bubble with `<MarkdownRenderer content={streamingContent.text} />`, so every incoming chunk forced markdown parsing/render of the full growing response text in the live session view.
- **Scenario:** early manual upward scroll in a just-mounted session view while the shared `AgentProgress` scroller is performing its initial auto-scroll stabilization.
- **Evidence:** `AgentProgress` scheduled four delayed bottom-scroll retries (`0/50/100/200ms`) from the mount/first-item effect and did not cancel them when `handleScroll` detected that the user had left the bottom.
- **Observed risk window:** the user could scroll up, set `shouldAutoScroll=false`, and still be yanked back toward the bottom by pending retries for up to `~200ms` afterward.
- **Diagnosis:** the initial retry timers were not tied to the current auto-scroll mode or session lifecycle, so stale retries could keep writing `scrollTop = scrollHeight` after manual scroll interruption.
- **Scenario:** visible main sessions window (`http://localhost:5174/`), single focused active session tile, chat scroller pinned at bottom while long text streams into `progress.streamingContent` through the live renderer store.
- **Evidence:** before the fix, the exact active scroller was still measurably off-bottom after the first animation frame on every sampled chunk, then caught up on the second frame. This was reproducible in both shared render paths:
  - normal-agent styled probe: `avgGapAfterOneFrame=31.1px`, `maxGapAfterOneFrame=48px`, `nonZeroOneFrameSamples=18/18`, `avgGapAfterTwoFrames=0px`
  - ACP-styled probe: `avgGapAfterOneFrame=39.1px`, `maxGapAfterOneFrame=48px`, `nonZeroOneFrameSamples=18/18`, `avgGapAfterTwoFrames=0px`
- **Diagnosis:** the shared session auto-scroll hot path in `apps/desktop/src/renderer/src/components/agent-progress.tsx` ran inside `useEffect` and then waited for another `requestAnimationFrame`, so newly streamed content could paint above the fold for one frame before the scroller caught up. This manifested as delayed bottom-pinning / scroll lag during streaming in both normal and ACP session views.
- **Scenario:** visible main sessions window (`http://localhost:5174/`), focused ACP probe session, delegated sub-agent conversation panel expanded and already pinned at bottom while long delegated messages stream into `delegation.conversation`.
- **Evidence:** before the fix, the inner delegated conversation scroller visibly lagged behind new messages even though it was pinned at bottom. Exact CDP frame samples from the live renderer showed:
  - baseline gap before updates: `0px`
  - after one animation frame: `avgGap=95.6px`, `maxGap=193px`, `nonZeroSamples=12/12`
  - after three animation frames: `avgGap=90.6px`, `maxGap=184px`, `nonZeroSamples=12/12`
  - after `120ms`: `avgGap=61.8px`, `maxGap=166px`, `nonZeroSamples=11/12`
- **Diagnosis:** `SubAgentConversationPanel` used `requestAnimationFrame(() => scrollToBottom("smooth"))` whenever new delegated messages arrived. Under rapid ACP updates, the inner scroller spent multiple frames animating toward the bottom and stayed visibly behind the newest content instead of landing on the latest delegated message in the same paint.
- **Scenario:** visible main sessions window (`http://localhost:5174/`), focused ACP probe session, delegated sub-agent conversation panel overflowed with full history visible; after manually scrolling upward by `~900px`, click the `Latest` button while delegated messages continue arriving every `~180ms`.
- **Evidence:** before the fix, the `Latest` recovery path did not actually snap back to bottom. Exact live CDP samples from the inner delegated scroller showed:
  - gap immediately after manual upward scroll: `900px`
  - gap immediately after clicking `Latest`: `900px`
  - gap after `72ms` / 8 animation frames: still `888px`
  - gap after `120ms`: `953px` (new delegated chunk arrived while the smooth animation was still far from bottom)
  - the `Latest` button reappeared by frame 4 (`~39ms`) because the smooth-scroll animation kept firing scroll events while the viewport was still far from bottom
- **Diagnosis:** the ACP `Latest` button still called `scrollToBottom("smooth")`. That animated recovery left the inner scroller visibly behind the newest delegated message after the user explicitly requested the latest view, and the mid-animation scroll events could flip `isPinnedToBottom` back to `false` before the animation ever reached the bottom.
- **Scenario:** visible main sessions window (`http://localhost:5174/`), 12 mounted session tiles with long histories (24 user/assistant pairs per tile), grid fully settled for `2s`, then one active session receives 10 streamed chunk updates through the live renderer store.
- **Evidence:** before the fix, the grid-level chunk→next-frame delay scaled catastrophically with mounted long-history tiles even after the layout was already settled:
  - 1 tile baseline: `avg=71.8ms`, `max=90.7ms`
  - 12 tiles before fix: `avg=757.0ms`, `max=769.5ms`
- **Diagnosis:** the sessions overview kept full long transcripts mounted in every non-focused tile, so one active streamed chunk forced expensive layout/paint work across a very large tile DOM even after initial mount. A tile-level memoization pass helped only marginally until the inactive tile transcript size was reduced.

## Fixed

- **Renderer change:** updated `StreamingContentBubble` in `apps/desktop/src/renderer/src/components/agent-progress.tsx` to use a lightweight plain-text wrapped rendering path while `streamingContent.isStreaming === true`, and keep `MarkdownRenderer` for finalized/non-streaming content.
- **Test coverage:** added a targeted source-level layout assertion in `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the lightweight live-stream path.
- **Renderer change:** tied initial session auto-scroll retries in `apps/desktop/src/renderer/src/components/agent-progress.tsx` to a new timeout registry plus a live `shouldAutoScrollRef`, so delayed retries are cleared on session changes and cancelled/no-op once the user scrolls away from bottom.
- **Test coverage:** added `apps/desktop/src/renderer/src/components/agent-progress.scroll-behavior.test.ts` to lock in the timeout cleanup / auto-scroll-guard behavior for the shared session scroller.
- **Renderer change:** moved the streaming auto-scroll hot path in `apps/desktop/src/renderer/src/components/agent-progress.tsx` from `useEffect` + nested `requestAnimationFrame` to `useLayoutEffect` with an immediate `scrollToBottom()` write, so pinned streaming updates land in the same paint as the content commit.
- **Test coverage:** extended `apps/desktop/src/renderer/src/components/agent-progress.scroll-behavior.test.ts` with a focused assertion that the pinned streaming path stays on `useLayoutEffect` and performs the direct `scrollToBottom()` write.
- **Renderer change:** updated the ACP-only `SubAgentConversationPanel` scroll path in `apps/desktop/src/renderer/src/components/agent-progress.tsx` to perform same-paint bottom pinning with `useLayoutEffect` and direct `scrollTop = scrollHeight` writes for `"auto"` behavior, instead of scheduling animated smooth scrolling for each delegated message.
- **Test coverage:** extended `apps/desktop/src/renderer/src/components/agent-progress.scroll-behavior.test.ts` with an ACP-specific regression assertion covering the delegated conversation panel’s same-paint pinning path.
- **Renderer change:** updated the ACP delegated-conversation `Latest` recovery button in `apps/desktop/src/renderer/src/components/agent-progress.tsx` to use the same immediate `scrollToBottom("auto")` path instead of an animated smooth scroll, so resuming auto-scroll after manual upward scrolling lands on the newest delegated message right away.
- **Test coverage:** extended `apps/desktop/src/renderer/src/components/agent-progress.scroll-behavior.test.ts` with a regression assertion that the ACP `Latest` button no longer uses the smooth recovery path.
- **Renderer change:** memoized regular sessions-page tiles in `apps/desktop/src/renderer/src/pages/sessions.tsx` via `SessionProgressTile` and stabilized the focus/dismiss handlers so unrelated streamed chunks do not need to re-execute every tile component.
- **Renderer change:** limited non-focused, non-expanded tile transcripts in `apps/desktop/src/renderer/src/components/agent-progress.tsx` to a recent preview (`6` display items) with an explicit "Showing latest … updates" indicator, keeping full transcripts for the focused/maximized tile while shrinking inactive tile DOM during long streams.
- **Test coverage:** added/extended `apps/desktop/src/renderer/src/components/agent-progress.performance.test.ts` to lock in the sessions-grid memoization and transcript-preview guardrails.

## Verified

- **Targeted test:** `pnpm --filter @dotagents/desktop test -- --run src/renderer/src/components/agent-progress.tile-layout.test.ts` ✅
- **Renderer typecheck:** `pnpm --filter @dotagents/desktop typecheck:web` ✅
- **Same replay after fix (same panel target, same 84-chunk replay, same 6783-char source):**
  - `avgChunkToPaintMs`: `15.0` (down from `37.5`)
  - `p95ChunkToPaintMs`: `17.0` (down from `67.6`)
  - `maxChunkToPaintMs`: `17.2` (down from `82.6`)
  - tail chunks stayed flat instead of degrading with content length
- **Interpretation:** this materially reduces visible session-view lag during long streamed outputs by removing the full markdown reparse from the hot streaming path.
- **Targeted tests:** `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.scroll-behavior.test.ts src/renderer/src/components/agent-progress.tile-layout.test.ts` ✅
- **Desktop typecheck:** `pnpm --filter @dotagents/desktop typecheck` ✅
- **Interpretation:** the shared session scroller no longer keeps stale initial bottom-scroll retries alive after manual upward scrolling, reducing a concrete early-stream scroll-jump / scroll-interruption bug in both tile and overlay `AgentProgress` variants.
- **Targeted test:** `pnpm --filter @dotagents/desktop test:run src/components/agent-progress.scroll-behavior.test.ts` ✅
- **Renderer typecheck:** `pnpm --filter @dotagents/desktop typecheck:web` ✅
- **Same bottom-gap replay after fix (same main-window probe, same active scroller, same 18 sampled chunks):**
  - normal-agent styled probe: `avgGapAfterOneFrame=0px`, `maxGapAfterOneFrame=0px`, `nonZeroOneFrameSamples=0/18`
  - ACP-styled probe: `avgGapAfterOneFrame=0px`, `maxGapAfterOneFrame=0px`, `nonZeroOneFrameSamples=0/18`
- **Interpretation:** the shared session view now stays pinned on the very next paint instead of visibly lagging a frame behind streamed content in the measured normal and ACP replay paths.
- **Targeted test:** `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.scroll-behavior.test.ts` ✅
- **Renderer typecheck:** `pnpm --filter @dotagents/desktop typecheck:web` ✅
- **Same ACP delegated-conversation probe after fix (same focused main-window session, same 12 delegated message appends):**
  - baseline gap before updates: `0px`
  - after one animation frame: `avgGap≈0px`, `maxGap=0px`, `nonZeroSamples=1/12` (single `-1px` rounding artifact only)
  - after `120ms`: `avgGap=0px`, `maxGap=0px`, `nonZeroSamples=0/12`
- **Interpretation:** the ACP delegated sub-agent conversation panel no longer trails the bottom during rapid delegated message streaming; the newest delegated message is effectively visible on the next paint instead of after a long smooth-scroll catch-up.
- **Targeted test:** `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.performance.test.ts` ✅
- **Renderer typecheck:** `pnpm --filter @dotagents/desktop typecheck:web` ✅
- **Same settled-grid probe after fix (same main-window target, same 12 long tiles, same 2s settle, same 10 streamed updates):**
  - 1 tile baseline after fix: `avg=71.9ms`, `max=89.3ms`
  - 12 tiles after fix: `avg=162.8ms`, `max=178.4ms`
  - improvement vs prior 12-tile settled probe: `~78.5%` lower avg chunk→next-frame delay (`757.0ms` → `162.8ms`)
- **Interpretation:** the sessions overview still has some remaining cost, but the long-history multi-tile streaming path no longer stalls for ~0.75s per chunk; inactive tile DOM size was the dominant grid-level jank source in this repro.
- **Targeted test:** `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.scroll-behavior.test.ts` ✅
- **Renderer typecheck:** `pnpm --filter @dotagents/desktop typecheck:web` ✅
- **Same ACP delegated-conversation recovery probe after fix (same main-window target, same `~900px` manual upward scroll, same `~180ms` delegated chunk cadence):**
  - gap immediately after clicking `Latest`: `~1px` rounding only
  - gaps over the next 8 animation frames (`~69ms` total): stayed at `~1px` and never reopened a visible gap
  - gap after `120ms`: `0px`
  - gap after `240ms`: `0px`
  - `Latest` stayed hidden after the first frame instead of reappearing mid-recovery
- **Interpretation:** ACP delegated-session auto-scroll recovery is now immediate when the user clicks `Latest`; the panel no longer spends multiple frames visibly behind the newest delegated message after the explicit recovery action.

## Still Uncertain

- Whether the remaining frame-gap spike (`116.6ms`) is unrelated background noise, window focus/visibility churn, or a second bottleneck in scroll/layout work.
- Whether live end-to-end normal-agent and ACP-agent sessions in the floating panel show the same before/after behavior as the scripted main-window replay, since panel resizing can mask overflow.
- Whether the shared fix fully resolves the same interruption pattern in a live ACP session with sustained streaming; this loop confirmed the renderer code path but did not capture a clean overflowing ACP live trace.
- Whether panel auto-resizing is masking a second, separate overflow/anchoring bug in the floating panel itself.
- Whether the shared/non-ACP session scroller has a separate recovery bug when the user scrolls upward mid-stream and then manually returns to bottom; this loop only fixed the ACP delegated-conversation `Latest` button path.
- Whether the remaining `~72ms` single-tile chunk→frame cost is dominated by the focused tile’s own markdown/layout work, follow-up input layout, or another hot path independent of the sessions grid.

## Notes

- Start each iteration by reviewing this file to avoid repeating recently-checked scenarios.
- Record exact repro inputs, scroll state transitions, target renderer inspected, metrics captured, and what was ruled out.
- Practical debugging note from this run: `requestAnimationFrame`-based timing probes will stall on hidden renderers. Use the visible panel target, or explicitly show/focus the panel before measuring animation/frame timing.