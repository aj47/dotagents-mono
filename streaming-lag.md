# Streaming Lag Investigation Ledger

## Scope

- Focus: user-visible lag, jank, delayed paint, low FPS, blocked input, and scroll bugs during long streamed responses in the desktop app.
- Surfaces: normal agents and ACP agents, with special attention to session views and auto-scroll behavior.
- Evidence standard: prefer Chrome/Electron renderer traces, flame charts, long-task evidence, React commit evidence, and directly observed repro steps.

## Checked

- [x] `apps/desktop/DEBUGGING.md` exists and documents `REMOTE_DEBUGGING_PORT` plus renderer target selection in Chrome DevTools.
- [x] Confirmed `streaming-lag.md` did not exist before this investigation.
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

## Not Yet Checked

- [ ] Repro on a live long-streaming ACP-agent session in the visible panel with timing capture, not just completion confirmation.
- [ ] Compare focused session overlay vs tile/session-grid behavior.
- [ ] Capture a proper Chrome Performance/CPU trace on the visible panel target; CDP CPU-profiler attempts were too heavy/noisy in this loop.
- [ ] Measure behavior after user scrolls upward mid-stream.
- [ ] Measure sticky-at-bottom recovery when returning to bottom.
- [ ] Check for scroll jumps when switching sessions / panes / routes.
- [ ] Positively identify the exact active session scroll container in DOM probes and record its bottom-gap before/after a streaming replay.
- [ ] Check whether DOM growth or layout thrash worsens with long histories.
- [ ] Capture a live ACP-agent scroll-interruption repro in an overflowing focused session detail, not just shared-renderer source evidence.
- [ ] Capture a live normal-agent scroll-interruption repro in a stable 1x1/focused session tile with exact bottom-gap samples before/after manual wheel scroll.
- [ ] Measure wheel / trackpad / keyboard scrolling separately from scripted `scrollTop` changes once a stable overflow harness exists.
- [ ] Check whether the sessions page-level `scrollIntoView(..., { behavior: 'smooth' })` paths introduce a separate scroll-jump issue while active sessions stream.

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

## Fixed

- **Renderer change:** updated `StreamingContentBubble` in `apps/desktop/src/renderer/src/components/agent-progress.tsx` to use a lightweight plain-text wrapped rendering path while `streamingContent.isStreaming === true`, and keep `MarkdownRenderer` for finalized/non-streaming content.
- **Test coverage:** added a targeted source-level layout assertion in `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` to lock in the lightweight live-stream path.
- **Renderer change:** tied initial session auto-scroll retries in `apps/desktop/src/renderer/src/components/agent-progress.tsx` to a new timeout registry plus a live `shouldAutoScrollRef`, so delayed retries are cleared on session changes and cancelled/no-op once the user scrolls away from bottom.
- **Test coverage:** added `apps/desktop/src/renderer/src/components/agent-progress.scroll-behavior.test.ts` to lock in the timeout cleanup / auto-scroll-guard behavior for the shared session scroller.

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

## Still Uncertain

- Whether the remaining frame-gap spike (`116.6ms`) is unrelated background noise, window focus/visibility churn, or a second bottleneck in scroll/layout work.
- Whether normal-agent and ACP-agent streaming share the same renderer bottleneck end-to-end in the visible panel; this loop only directly measured the normal-agent replay path.
- Whether auto-scroll in the active session container is perfectly pinned at bottom during long streams; the quick DOM probe did not yet isolate the exact active scroller, so scroll correctness remains unverified rather than cleared.
- Whether the shared fix fully resolves the same interruption pattern in a live ACP session with sustained streaming; this loop confirmed the renderer code path but did not capture a clean overflowing ACP live trace.
- Whether panel auto-resizing is masking a second, separate overflow/anchoring bug in the floating panel itself.

## Notes

- Start each iteration by reviewing this file to avoid repeating recently-checked scenarios.
- Record exact repro inputs, scroll state transitions, target renderer inspected, metrics captured, and what was ruled out.
- Practical debugging note from this run: `requestAnimationFrame`-based timing probes will stall on hidden renderers. Use the visible panel target, or explicitly show/focus the panel before measuring animation/frame timing.