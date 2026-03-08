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

##### Issue #57 — Feature: Bundle load/unload safety — pre-import backup slice

- Selection rationale:
  - Bundle preview/conflict detection and component toggles already exist, so the missing trust-critical gap with the cleanest local implementation path was the pre-import safety net.
- Investigation:
  - Reviewed the issue body plus three follow-up comments and confirmed Phase 1 explicitly prioritizes `previewBundleWithConflicts` → backup snapshot → import writes using the existing bundle pipeline.
  - Confirmed `apps/desktop/src/main/bundle-service.ts` already supports bundle export/import/preview, conflict strategies, and component-level inclusion toggles, but `importBundle()` wrote directly into the target `.agents` layer with no snapshot bundle created first.
  - Confirmed `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` already routes all import confirmation through `tipcClient.importBundle(...)`, making it the right place to surface backup metadata without inventing a second import flow.
- Important assumptions:
  - Assumption: for this slice, backing up the current target layer before mutation is sufficient even though a future trust-track step may want richer merged-layer or slot-aware restore behavior.
  - Why acceptable: the issue follow-up comment explicitly frames Phase 1 around the current target layer and asks not to fork the import pipeline before the trust foundations are landed.
  - Assumption: excluding memories from the automatic safety backup is the correct default for now.
  - Why acceptable: the issue body states backup should include agent profiles, MCP servers, skills, and repeat tasks, with memories intentionally not part of the default safety snapshot.
- Changes implemented:
  - Extended `ImportBundleResult` with `backupFilePath` and `ImportOptions` with internal backup configuration so imports can report the generated snapshot path and tests can direct backups into temporary folders.
  - Added `createPreImportBackup()` in `apps/desktop/src/main/bundle-service.ts` to export the current target layer before any import writes, save it as `~/.agents/backups/backup-*.dotagents`, exclude memories by default, and prune older backup files down to the configured maximum.
  - Made `importBundle()` abort before mutation if the snapshot cannot be created, returning a clear `Pre-import backup failed` error instead of proceeding unsafely.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` success/error toasts to surface the backup path so the user can immediately see where the automatic safety snapshot was saved.
  - Added targeted regression tests in `apps/desktop/src/main/bundle-service.test.ts` covering snapshot creation before mutation, backup rotation, and abort-on-backup-failure behavior.
- Verification run:
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/main/bundle-service.test.ts`
  - Result: blocked in this worktree because the desktop test toolchain is not installed locally; PNPM failed with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` / `Command "vitest" not found`.
  - Completed: `git diff --check` ✅
  - Completed: dependency-free Node source assertion script validating backup metadata wiring, backup helper presence, dialog surfacing, and the three new regression test cases ✅
  - Confidence: moderate-to-high for this backend/UI slice; full Vitest execution remains pending until the desktop dependencies are installed in this worktree.
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Add a restore entrypoint in Settings → Capabilities so the newly-created backup bundles are actually reachable from the UI.
  - Carry backup metadata and per-item decisions through a richer import plan contract instead of only the current global conflict strategy.
  - Reuse the same import-preview/backup contract for Hub installs so trust behavior is consistent between local bundle imports and Hub bundle installs.

- Next recommended issue work item: stay on `#57` for the restore-entrypoint follow-up in Settings → Capabilities, or pivot to a small `#53` slash-command discovery slice if a UI-only pass is preferred next.

##### Issue #53 — Feature: Inline skill invocation via slash commands (desktop composer first slice)

- Selection rationale:
  - Clear UX value, existing nearby skill-insertion behavior to reuse, and a small renderer-only slice that improves discoverability without requiring new backend invocation plumbing.
- Investigation:
  - Reviewed the issue body and confirmed there were no comments constraining implementation beyond slash-triggered skill autocomplete and inline invocation.
  - Inspected `apps/desktop/src/renderer/src/components/text-input-panel.tsx`, `predefined-prompts-menu.tsx`, and `session-input.tsx` to locate the primary desktop composer and existing prompt/skill insertion patterns.
  - Confirmed `PredefinedPromptsMenu` already fetches `tipcClient.getSkills()` and inserts full skill instructions into the composer, which provided a concrete local behavior model for a slash-command slice.
  - Checked `apps/mobile/src/screens/ChatScreen.tsx` for parity and confirmed mobile has its own composer but no existing prompt/skill insertion affordance, making a mirrored mobile implementation materially larger than this first desktop pass.
- Important assumptions:
  - Assumption: for a first shippable slice, slash commands can reuse the existing skill-as-prompt behavior by expanding `/skill-name ...args` into the selected skill instructions plus the trailing user request on submit.
  - Why acceptable: this matches the repo's current skill insertion model, keeps the implementation local to the renderer, and still delivers the user-facing value of inline skill invocation.
  - Assumption: landing this in the main desktop `TextInputPanel` first is acceptable even though tile follow-up, overlay follow-up, and mobile composers exist.
  - Why acceptable: `TextInputPanel` is the primary chat composer surface, while the other inputs can follow once the slash-command interaction is proven and refined.
  - Assumption: limiting slash-command detection to the start of the draft is acceptable for this slice.
  - Why acceptable: it aligns with common slash-command UX, avoids ambiguous mid-message parsing, and keeps the transformation predictable.
- Changes implemented:
  - Added desktop composer skill lookup in `apps/desktop/src/renderer/src/components/text-input-panel.tsx` using the existing skills query source.
  - Added `/`-triggered skill suggestions with keyboard navigation (`ArrowUp`/`ArrowDown`) and acceptance via `Tab` or `Enter` before the draft is sent.
  - Added exact slash-command expansion so drafts like `/browse https://example.com` submit the skill instructions plus a `User request:` block containing the inline arguments.
  - Added a compact `Skill: ...` badge in the composer chrome so the active slash-selected skill is visible for the current turn.
  - Extended `apps/desktop/src/renderer/src/components/text-input-panel.submit.test.tsx` with focused regression coverage for exact slash-command expansion and Enter-key suggestion acceptance.
  - Added `apps/desktop/src/renderer/src/components/text-input-panel.slash-command.test.js`, a dependency-free source regression test that validates the new query wiring, inline expansion contract, suggestion list, and keyboard acceptance path.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/text-input-panel.slash-command.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/text-input-panel.submit.test.tsx`
  - Result: blocked in this worktree because the desktop test toolchain is not installed locally; PNPM failed with `Command "vitest" not found`.
  - Confidence: moderate for this renderer-only slice; the new source-level regression test passes, while full component-test execution remains pending until the worktree has desktop dependencies installed.
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #53:
  - Extend the same slash-command interaction to `overlay-follow-up-input.tsx` and `tile-follow-up-input.tsx` so continuation flows match the primary composer.
  - Decide whether slash commands should also ship on mobile or remain desktop-first until a mobile-specific command picker UX is designed.
  - Consider richer invocation semantics later (for example, preserving the selected skill as structured metadata rather than expanding it into plain text instructions at submit time).

- Next recommended issue work item: continue `#53` by porting the same slash-command interaction to follow-up inputs, or pivot back to `#57` for the restore-entrypoint slice if bundle trust is higher priority.

##### Issue #57 — Feature: Bundle load/unload safety — restore entrypoint in Settings → Capabilities

- Selection rationale:
  - Directly completes the next trust-critical acceptance slice called out in the issue comments: users can now reach backup restore from the app UI instead of only seeing backup paths in toasts.
- Investigation:
  - Re-read issue `#57` and its trust-track comments, especially the explicit Phase 1 requirement to add a restore entrypoint in `Settings -> Capabilities` without creating a second import pipeline.
  - Confirmed `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` was still just a two-tab shell for `Skills` and `MCP Servers`, with no backup/restore affordance.
  - Confirmed `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` already handled conflict-aware preview/import and could safely be reused for restore once given a preselected backup file path.
  - Confirmed `apps/desktop/src/main/bundle-service.ts` already knew the canonical pre-import backup location (`~/.agents/backups`) implicitly via backup creation, but there was no dedicated picker helper for restore flows.
- Important assumptions:
  - Assumption: a first restore slice only needs a button that opens the backup directory in a file picker and then reuses the existing import preview dialog, rather than a new in-app backup browser.
  - Why acceptable: the issue acceptance criteria only require restore to be accessible from Settings → Capabilities, and reusing the existing preview/import flow is explicitly preferred by the trust-track comments.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the restore flow depends on Electron file dialogs and the desktop `.agents/backups` directory, which do not map cleanly to the mobile app.
- Changes implemented:
  - Added `getDefaultImportBackupDirectory()` and `selectImportBackupBundleFromDialog()` in `apps/desktop/src/main/bundle-service.ts` so restore flows open from the canonical backup directory instead of a generic bundle picker.
  - Added `selectBundleBackupFile` to `apps/desktop/src/main/tipc.ts` so the renderer can launch the backup-focused picker without duplicating main-process dialog logic.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` with optional `confirmLabel` and `successVerb` props so the existing conflict-aware import dialog can speak in restore-specific UI copy without forking the component.
  - Added a `Restore Backup` action to `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx`, wired it to the new backup picker, reused `BundleImportDialog` with restore-specific labels, and invalidated affected skills/config/sidebar queries after a successful restore.
  - Added `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js`, a dependency-free regression test covering the Settings → Capabilities entrypoint, the restore-specific dialog labeling, and the main-process backup picker wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `git diff --check` ✅
  - Note: did not re-run desktop Vitest here because earlier iterations already established this worktree is missing the installed desktop test toolchain; this slice instead added and passed a dependency-free targeted regression test.
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Consider showing the most recent backup bundles inline in Settings → Capabilities so restore does not always require a file picker.
  - Carry richer backup/import metadata into the restore UI (for example, bundle timestamp and component counts) before confirmation.
  - Reuse the same restore-aware trust contract for Hub-installed bundles and any future bundle-slot/preset workflow.

- Next recommended issue work item: stay on `#57` for an inline recent-backups list in Settings → Capabilities, or pivot back to `#58` for the storage-integrity slice now that the trust-track UI affordances are stronger.
