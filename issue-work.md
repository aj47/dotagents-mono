## Issue Work Ledger

- Repo: `aj47/dotagents-mono`
- Started: `2026-03-08`
- Purpose: track issue investigation, assumptions, changes, verification, branch/PR status, and next steps.

### Workflow Notes

- Prefer one small, shippable issue slice at a time.
- Avoid repeating recently investigated issues unless unblocking a known follow-up.
- Record explicit assumptions when issue details are incomplete.

### Iterations

#### 2026-03-08

- Status: initialized ledger.
- Branch: `aloops/issue-work-loop`

##### Issue #55 — Session tile header UI bugs: duplicate maximize button, repeated agent name, and collapsed tile spacing

- Selection rationale: clear bug report, desktop UX impact, and a narrow local implementation path in the session tile header.
- Investigation:
  - Reviewed issue details/labels (`bug`, `ui`) and confirmed there were no comments or extra requirements.
  - Inspected `apps/desktop/src/renderer/src/components/agent-progress.tsx`, `apps/desktop/src/renderer/src/components/session-grid.tsx`, and `apps/desktop/src/renderer/src/pages/sessions.tsx`.
  - Confirmed a likely direct cause for the "duplicate maximize button" report: snoozed tiles render both `Show only this session` and `Restore session`, and both use `Maximize2` icons.
- Important assumptions:
  - Assumption: the reported duplicate maximize state is the snoozed-tile case, because that is the only clear path in the current tile header that renders two maximize-style actions at once.
  - Why acceptable: the issue explicitly says it happens only "in certain cases," and this code path matches that conditional behavior exactly.
- Additional assumption for follow-up slice: the repeated agent-name presentation comes from ACP tiles showing agent identity both in the header profile chip and again in the footer `ACPSessionBadge`.
- Why acceptable: the footer badge already presents the richer agent identity (including version/model context), so hiding the header chip only when the ACP badge names the agent reduces repetition without removing unique information.
- Additional assumption for reflow slice: packing collapsed tiles after expanded tiles is an acceptable first fix for the gap problem, even if it does not introduce a full masonry layout.
- Why acceptable: it removes the most visible empty-space problem in the current flex-wrapped grid with a much smaller, safer change than replacing the layout system.
- Changes implemented:
  - Added `showTileExpandAction` so the tile-level maximize action is hidden when the session is snoozed and already exposes `Restore session`.
  - Added a regression assertion in `apps/desktop/src/renderer/src/components/agent-progress.tile-layout.test.ts` covering the snoozed-tile action gating.
  - Added `showTileProfileName` so ACP-backed tiles do not repeat the header profile chip when the footer `ACPSessionBadge` already names the agent.
  - Added a regression assertion covering the ACP header/footer identity de-duplication.
  - Removed an unused `compact` prop from the tile footer `ACPSessionBadge` call so the invocation matches the component API.
  - Added `orderedVisibleProgressEntries` in `apps/desktop/src/renderer/src/pages/sessions.tsx` so collapsed tiles are packed after expanded tiles, letting open tiles reclaim the primary grid area.
  - Disabled tile drag-reorder while collapsed packing is active to avoid mismatches between the derived display order and persisted manual order.
  - Added a source-level regression assertion in `apps/desktop/src/renderer/src/pages/sessions.layout-controls.test.ts` covering collapsed-tile packing.
- Verification run:
  - Attempted: `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/agent-progress.tile-layout.test.ts`
  - Result: blocked by missing local dependencies / `node_modules`; shared pretest failed with `sh: tsup: command not found`.
  - Attempted: `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/pages/sessions.layout-controls.test.ts`
  - Result: blocked for the same reason (`tsup: command not found`, worktree `node_modules` missing).
  - Confidence: code-path confirmation by source inspection is strong for this slice, but automated test execution remains pending until dependencies are installed in this worktree.
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #55:
  - Consider a fuller masonry-style or grid-row-aware reflow if packed collapsed tiles still feel too coarse.
  - Restore manual drag-reorder while collapsed packing is active if that interaction becomes important.

- Next recommended issue work item: continue `#58` with the storage-integrity half (separating LLM context compaction from on-disk history retention) or pivot to another small desktop reliability bug if a narrower repro appears first.

##### Issue #56 — Feature: Hub website — bundle inspector modal (peek inside before installing)

- Investigation note:
  - Reviewed the issue body/comments and inspected `website/index.html`.
  - Current `website/index.html` is a marketing landing page with a hub section, not an obvious bundle-card list surface matching the issue's proposed "Inspect" button placement.
- Decision:
  - Deferred for now to avoid inventing a larger website information architecture in the same pass.
  - Best next step for `#56` is to identify the exact hub card surface or land a deliberate first slice that introduces bundle cards + inspect modal shell together.

##### Issue #58 — Conversation History: Preserve full data on disk & UI access, exclude from LLM context

- Selection rationale:
  - High user-trust value, directly aligned with desktop session/history UX, and small enough to land a useful acceptance-criteria slice without pretending to finish the whole history-integrity project.
- Investigation:
  - Reviewed the issue body, labels (`enhancement`, `ui`, `conversation-history`), and follow-up scope comment emphasizing `Open History Folder` as an explicit affordance.
  - Confirmed `apps/desktop/src/main/config.ts` already stores conversation files under app data at `conversations/`.
  - Confirmed `apps/desktop/src/main/conversation-service.ts` persists per-session JSON files and a history index, but `compactOnLoad()` currently rewrites older messages into a summary message instead of preserving the full raw stream.
  - Confirmed the desktop renderer already has a `PastSessionsDialog`, but it only supports search/open/delete actions and did not expose any folder-opening affordance for history on disk.
- Important assumptions:
  - Assumption: landing the `Open History Folder` affordance first is a worthwhile, self-contained slice of `#58` even though it does not solve the lossy summarization/storage-separation work.
  - Why acceptable: the issue comment explicitly calls out `Open History Folder` as part of the locked scope, and the current desktop UI had a clear gap here while the broader storage redesign is materially larger.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: mobile session history is stored in AsyncStorage (`apps/mobile/src/store/sessions.ts`) and does not have an OS folder/Finder affordance equivalent to the desktop Electron app.
- Changes implemented:
  - Added `openConversationHistoryFolder` to `apps/desktop/src/main/tipc.ts`, reusing the repo's existing folder-opening pattern by ensuring the conversations directory exists and opening it via Electron `shell.openPath`.
  - Added an `Open History Folder` button to `apps/desktop/src/renderer/src/components/past-sessions-dialog.tsx` with pending/error handling through `tipcClient.openConversationHistoryFolder()`.
  - Added a source-level regression test in `apps/desktop/src/main/conversation-history-folder-actions.test.ts` covering the config path, TIPC handler, and renderer wiring.
  - Extended `apps/desktop/src/renderer/src/components/past-sessions-dialog.layout.test.ts` to assert the new affordance remains present in the history-management toolbar.
- Verification run:
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/main/conversation-history-folder-actions.test.ts src/renderer/src/components/past-sessions-dialog.layout.test.ts`
  - Result: blocked because this worktree has no installed desktop test tooling / `node_modules`; PNPM failed with `Command "vitest" not found`.
  - Completed: `git diff --check` ✅
  - Completed: dependency-free Node assertion script validating 9 source-level checks across `config.ts`, `tipc.ts`, `past-sessions-dialog.tsx`, and the new/updated regression tests ✅
  - Confidence: moderate-to-high for this narrow UI/TIPC slice; full automated desktop test execution remains pending until dependencies are installed in this worktree.
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Preserve the full raw message/event stream on disk even after summarization rather than rewriting older messages into a summary-only conversation file.
  - Add a `Show Full History` viewer/toggle that can surface summarized/partial sections inside the UI.
  - Design a migration/backfill strategy for already-compacted sessions, including an explicit partial-history marker when recovery is impossible.

##### Issue #56 — Feature: Hub website — bundle inspector modal (landing-page first slice)

- Selection rationale:
  - Concrete user-facing value, strong repro path in a single static file, and a clean way to land a reviewable first slice without taking on a full hub-site architecture rewrite.
- Investigation:
  - Re-read the issue body/comments and confirmed the desired behavior: bundle cards expose an `Inspect` action that opens a modal, fetches the real `.dotagents` JSON, renders major sections, and keeps install as a separate action.
  - Re-inspected `website/index.html` and confirmed the repo still only had a marketing landing-page hub section with no bundle-card surface or inspector modal.
  - Checked the live public hub (`https://hub.dotagentsprotocol.com`) and confirmed it already uses real public bundle URLs from `aj47/dotagents-hub`, which provided a concrete artifact shape for the repo-side slice.
  - Confirmed example bundle JSON structure directly from the public raw bundle files so the modal renderer matched real fields (`manifest`, `agentProfiles`, `mcpServers`, `skills`, `repeatTasks`, `memories`) instead of guessing.
- Important assumptions:
  - Assumption: because the repo website is a landing page rather than the full hub app, the right first slice is to add a featured-bundles surface plus inspector modal inside the existing `#hub` section rather than rebuild the whole catalog.
  - Why acceptable: the issue explicitly targeted `website/index.html`, and this lands the core “peek inside before installing” value in the current repo surface with minimal scope.
  - Assumption: using the same public raw bundle URLs the live hub already references is acceptable for this slice.
  - Why acceptable: it keeps the inspector bound to real installable artifacts and avoids inventing a fake or duplicated bundle registry inside the landing page.
- Changes implemented:
  - Added a featured bundle card grid to the landing page hub section for three real public bundles: `Dev Powerpack`, `Research Analyst`, and `TechFren Daily Driver`.
  - Added per-card `Inspect ↗` actions alongside install links so preview and install are clearly separate actions.
  - Added an inspector modal that fetches the selected `.dotagents` bundle JSON, shows bundle metadata, and renders collapsible sections for agent profiles, MCP servers, skills, repeat tasks, and memories.
  - Added lightweight markdown formatting for bundle instruction/prompt content, including frontmatter stripping, headings, lists, inline code, and fenced-code rendering.
  - Added quick warning badges for bundles that contain MCP commands, memories, or especially large prompt/instruction payloads.
  - Added modal dismissal support via close button, Escape, and click-outside behavior, plus focus restoration after close.
  - Added `website/website-hub-inspector.test.js`, a dependency-free source-level regression test that asserts the new featured cards, inspector modal wiring, fetch/install flow, and markdown-rendering helpers exist.
  - After a browser smoke test exposed a stale loading indicator, added explicit `[hidden]` display overrides for modal state rows so loading/error/warning/content states hide reliably even when component classes declare `display`.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: `git diff --check` ✅
  - Completed: local browser smoke via `python3 -m http.server 4312 -d website` + browser automation against `http://127.0.0.1:4312` ✅
    - Confirmed three featured bundle cards render in the hub section.
    - Confirmed the first `Inspect ↗` action opens the modal and loads real content for `Dev Powerpack`.
    - Confirmed visible sections for `Agent Profiles`, `MCP Servers`, `Skills`, and `Repeat Tasks`.
    - Confirmed the stale loading indicator bug was fixed after the `[hidden]` CSS follow-up.
    - Confirmed close behavior works via modal controls.
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - Decide whether the landing page should stay a curated featured-bundles slice or eventually share more code/content with the live hub catalog.
  - If the full hub moves into this repo surface, add catalog search/filtering and reuse the inspector modal for all bundle cards rather than only featured entries.
  - Consider richer per-section summarization (for example, MCP env requirements or repeat-task schedule details) if preview depth becomes a frequent user need.

- Next recommended issue work item: inspect `#53` for a similarly narrow slash-command discoverability/help slice, or take a small reliability slice from `#57` only if it can be landed without broad bundle-import refactoring.
