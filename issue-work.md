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

##### Issue #57 — Feature: Bundle load/unload safety — inline recent backups in Settings → Capabilities

- Selection rationale:
  - This was the cleanest next slice after the restore-entrypoint commit: it improves rollback discoverability without opening a new issue surface or introducing a second restore mechanism.
- Investigation:
  - Re-read the `#57` notes in `issue-work.md` and confirmed the remaining trust gap was discoverability, not the restore pipeline itself.
  - Confirmed the new Settings → Capabilities header already hosted restore state and query invalidation logic, making it the lowest-friction place to add a small recent-backups panel.
  - Confirmed `apps/desktop/src/main/bundle-service.ts` could derive recent backup metadata directly from the canonical backup directory by reusing `previewBundle(...)` and filesystem timestamps.
- Important assumptions:
  - Assumption: a small recent-backups shortlist (not a full backup manager) is the right next increment.
  - Why acceptable: it directly reduces friction for the most recent rollback cases while staying aligned with the issue’s preference for narrow, trust-focused steps.
  - Assumption: showing manifest metadata plus a `Restore` button is enough for this slice.
  - Why acceptable: the existing restore dialog still provides the full preview/conflict review before any writes happen, so the list only needs to help users choose the likely backup faster.
- Changes implemented:
  - Added `ImportBackupSummary` and `listImportBackups(...)` in `apps/desktop/src/main/bundle-service.ts` to scan `~/.agents/backups`, ignore unsupported files, reuse bundle preview parsing, sort by recency, and return compact manifest metadata.
  - Added `listBundleBackups` to `apps/desktop/src/main/tipc.ts` so the renderer can fetch recent backups without duplicating filesystem logic.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` with a `Recent backups` panel that loads the latest four automatic backups, shows timestamp/component summaries, handles loading/empty/error states, and launches the same restore dialog directly from each row.
  - Updated restore completion invalidation to refresh the recent-backups query as well, so the list stays current after each import/restore action.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` to cover the recent-backups query wiring and the new main-process listing helper.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Carry richer metadata into the list and dialog (for example, backup path, workspace/global target, and perhaps conflict summary after preview).
  - Consider an `Open backup folder` affordance for manual inspection or cleanup.
  - Apply the same trust-oriented restore affordances to Hub installs and any future bundle-slot/preset flows.

- Next recommended issue work item: either close out `#57` with small polish on backup metadata/open-folder affordances, or pivot to `#58` for a more infrastructure-heavy storage-integrity slice now that restore UX is materially stronger.

##### Issue #53 — Feature: Inline skill invocation via slash commands (overlay + tile follow-up inputs)

- Selection rationale:
  - This was the cleanest non-redundant follow-up from the earlier desktop-composer slice: it extends the same high-value slash-command UX into active session continuation surfaces without taking on mobile or backend invocation changes.
- Investigation:
  - Re-read issue `#53`, confirmed labels (`enhancement`, `ux`), and confirmed there were still no issue comments adding extra constraints.
  - Reviewed `issue-work.md` to avoid repeating the earlier main-composer work and to target the explicitly documented remaining follow-up for `overlay-follow-up-input.tsx` and `tile-follow-up-input.tsx`.
  - Confirmed by source inspection that both follow-up inputs already reused nearby prompt insertion affordances (`PredefinedPromptsMenu`) but did not fetch skills, track slash command state, render suggestion UI, or expand exact `/skill args` drafts before submit.
  - Re-checked `apps/mobile/src/screens/ChatScreen.tsx` only to confirm mobile still uses a separate composer path, so mirroring the desktop slash UX there would be a materially larger follow-up rather than part of this narrow desktop pass.
- Important assumptions:
  - Assumption: extending slash commands to the overlay and tile follow-up inputs is a valid continuation of `#53` even though mobile remains unchanged.
  - Why acceptable: the prior `#53` slice was explicitly desktop-first, and these two inputs are the remaining desktop continuation surfaces where the missing behavior was most visible.
  - Assumption: source-level confirmation that the follow-up inputs lacked any skills query/slash parsing was sufficient reproduction for this slice.
  - Why acceptable: the gap was directly observable in code, the behavior model already existed in `TextInputPanel`, and this worktree still lacks the installed desktop Vitest toolchain for heavier component execution.
- Changes implemented:
  - Added shared desktop follow-up slash helpers in `apps/desktop/src/renderer/src/components/skill-slash-commands.ts` covering slash token normalization, exact-match expansion, suggestion derivation, and slash-command text replacement after selection.
  - Updated `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx` to fetch skills, show slash suggestions, support keyboard navigation/acceptance, expand exact slash commands on submit, and show an active `Skill:` indicator when a command resolves.
  - Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx` with the same slash-command behavior so tile follow-ups match overlay follow-ups and the main desktop composer.
  - Added `apps/desktop/src/renderer/src/components/follow-up-input.slash-command.test.js`, a dependency-free regression test that asserts helper wiring plus the overlay/tile slash suggestion and submit-expansion paths.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/text-input-panel.slash-command.test.js apps/desktop/src/renderer/src/components/follow-up-input.slash-command.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #53:
  - Decide whether mobile should gain a platform-appropriate slash-command picker or remain desktop-only for now.
  - Consider unifying the main desktop composer onto the same shared slash helper module if future behavior changes need to stay perfectly locked across all desktop composer surfaces.
  - Consider richer invocation semantics later (for example, passing a structured selected-skill token instead of always expanding into plain text instructions before submit).

- Next recommended issue work item: either close out `#53` with a mobile decision or helper unification polish, or pivot to `#58` for the storage-integrity/history-viewer infrastructure slice.

##### Issue #58 — Conversation History: preserve raw on-disk history during compaction

- Selection rationale:
  - `#58` was already partially advanced in this ledger via the `Open History Folder` affordance, and the next highest-value non-redundant slice was the underlying storage-integrity contract: make compaction non-lossy on disk and mark older lossy sessions honestly.
- Investigation:
  - Re-read issue `#58` plus its scope-locking comment and confirmed the highest-priority trust requirement is that summarization must never delete raw messages from storage.
  - Inspected `apps/desktop/src/main/conversation-service.ts` and confirmed `compactOnLoad()` currently persisted `[summary, ...recentMessages]` back to the main conversation file, with no preserved raw message stream.
  - Confirmed the same service also drives conversation history indexing, so compacted sessions would otherwise under-report message counts after compaction.
  - Confirmed `apps/desktop/src/main/tipc.ts` still resumes agent runs from `loadConversation(...)` rather than the compaction path, so the safest shippable slice here was persistence integrity first rather than trying to rework resume-time context selection in the same pass.
- Important assumptions:
  - Assumption: landing raw-history preservation and partial-session marking first is a valid, reviewable slice of `#58` even though the current agent resume path still does not actively call the compaction loader.
  - Why acceptable: the issue comment explicitly prioritizes trust/data-integrity foundations before more aggressive summarization behavior, and this slice stops future compaction from deleting recoverable history.
  - Assumption: storing raw messages inline in the same per-session JSON file via `rawMessages` is acceptable for now instead of adding a second JSONL sidecar format.
  - Why acceptable: it is the smallest change that makes the storage contract explicit, keeps migration local, and gives future UI/history work a concrete source of truth without inventing a broader file-format migration.
- Changes implemented:
  - Added `ConversationCompactionMetadata`, `Conversation.rawMessages`, and `Conversation.compaction` in `apps/desktop/src/shared/types.ts` so compacted sessions can preserve full raw history and carry an explicit integrity/partial marker.
  - Added storage-normalization helpers in `apps/desktop/src/main/conversation-service.ts` so legacy summary-only sessions are marked with `partialReason: legacy_summary_without_raw_messages`, while compacted sessions record represented/stored counts.
  - Updated conversation load/save paths so storage metadata is normalized on load, persisted back to disk when needed, and conversation-history index entries use represented full-history counts instead of only the compacted active-window length.
  - Updated `compactOnLoad()` so it preserves the full pre-compaction message stream in `rawMessages` while still generating a compact active `messages` window.
  - Updated `addMessageToConversation()` so post-compaction sessions keep appending to both the active window and the preserved raw stream instead of drifting out of sync.
  - Added `apps/desktop/src/main/conversation-storage-integrity.test.js`, a dependency-free regression test that asserts the raw-history, partial-marker, and represented-count wiring exists.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Route resumed agent context through a dedicated compaction-aware/history-aware loader so LLM context selection is explicitly separated from full on-disk storage.
  - Add a `Show Full History` UI that reads `rawMessages` when present and surfaces the new legacy-partial marker when older raw history is unrecoverable.
  - Consider a richer migration/backfill step for already-compacted legacy sessions if any extra reconstruction signal exists outside the compacted conversation file.

- Next recommended issue work item: stay on `#58` for the resume-path/context-selection split or the first `Show Full History` viewer slice, since the underlying storage contract is now in place.

##### Issue #57 — Bundle backups: open backups folder from Settings → Capabilities

- Selection rationale:
  - After the `#58` storage-integrity commit, the cleanest next shippable follow-up already called out in this ledger was a small `#57` polish slice: let users jump directly to the backup directory for manual inspection, export, or cleanup.
- Investigation:
  - Re-read the prior `#57` ledger entries and confirmed the remaining UX gap was discoverability of where automatic pre-import backup bundles actually live.
  - Confirmed `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` already has a `Recent backups` panel and restore actions, making it the lowest-friction place to add an explicit folder affordance.
  - Confirmed `apps/desktop/src/main/bundle-service.ts` already exposes `getDefaultImportBackupDirectory()`, and `apps/desktop/src/main/tipc.ts` already has a nearby folder-opening pattern via `openConversationHistoryFolder`.
- Important assumptions:
  - Assumption: opening the shared backup directory from the existing Settings → Capabilities backup card is preferable to introducing a separate settings page or dedicated file-management flow.
  - Why acceptable: it keeps the action close to restore controls, matches existing desktop folder-open affordances, and lands the smallest useful UX improvement.
- Changes implemented:
  - Added `openBundleBackupFolder` in `apps/desktop/src/main/tipc.ts`, which ensures the default backup directory exists and opens it via `shell.openPath(...)`.
  - Added an `Open Backups Folder` button to the existing `Recent backups` card in `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx`, including loading/error handling with the existing `sonner` toast pattern.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` to cover the new UI affordance and TIPC wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Re-ran: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Carry richer backup metadata into the Settings list (for example, backup path, target layer, or conflict summary from the originating import).
  - Consider inline cleanup actions once there is a clear retention-management design beyond the current automatic pruning.
  - Reuse the same trust-oriented restore affordances for Hub installs and any future bundle-slot/preset workflows.

- Next recommended issue work item: either continue `#58` with the resume-path/history-viewer split now that storage integrity is in place, or return to `#53` for slash-command helper unification/mobile follow-up if a UI-only slice is preferred next.

##### Issue #58 — Conversation History: desktop `Show Full History` viewer slice

- Selection rationale:
  - `#58` already has the storage-integrity contract landed in this ledger, so the next highest-value, non-redundant slice was the first in-app viewer that exposes preserved on-disk history instead of leaving it only as backend data.
- Investigation:
  - Re-read issue `#58`, its earlier ledger notes, and the storage-integrity follow-up, then confirmed the issue explicitly called for a `Show Full History` path once raw history preservation existed.
  - Inspected `apps/desktop/src/renderer/src/pages/sessions.tsx` and confirmed past-session reopen flows already synthesize a `pendingProgress` object from `loadConversation(...)`, making it the safest narrow integration point for a first viewer slice.
  - Inspected `apps/desktop/src/renderer/src/components/agent-progress.tsx` and confirmed tile-mode transcripts already render conversation history for pending past sessions, so the smallest UX change was to enrich that path rather than invent a separate modal/page.
  - Re-checked mobile surfaces only to confirm there is no equivalent past-session desktop-style history browser to keep in parity for this slice.
- Important assumptions:
  - Assumption: a first `Show Full History` slice only needs to light up the existing desktop past-session tile path, not every live session/resume surface.
  - Why acceptable: the pending past-session flow already loads full conversation files from disk, so it gives users immediate value with minimal architectural change while keeping broader resume-path work for a later `#58` follow-up.
  - Assumption: internal completion-nudge control messages should remain hidden even in the full-history view.
  - Why acceptable: they are system artifacts rather than user-meaningful conversation content, and hiding them keeps the new viewer aligned with the rest of the transcript UI.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: this implementation depends on the desktop past-session tile/session-history flow, which does not have an equivalent mobile UI surface today.
- Changes implemented:
  - Extended `AgentProgressUpdate` in `apps/desktop/src/shared/types.ts` with optional `fullConversationHistory`, `conversationCompaction`, and summary metadata fields so the renderer can distinguish active-window messages from preserved raw history.
  - Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so pending past-session tiles forward `conv.rawMessages`, `conv.compaction`, and summary markers from `loadConversation(...)` into the synthetic progress object.
  - Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to add a tile-level `Show Full History` / `Show Active Window` toggle when preserved earlier history exists, render the stored transcript from disk, and insert an `Active context window starts here.` divider.
  - Added an explicit legacy partial-history warning for summary-only compacted sessions where older raw history is unrecoverable.
  - Added `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js`, a dependency-free source regression test covering the shared progress contract, pending-session wiring, and the new viewer/warning affordances.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop typecheck`
  - Result: blocked because this worktree has no installed desktop dependencies / `node_modules`; TypeScript failed before checking app code with missing base/tooling packages such as `@electron-toolkit/tsconfig`, `electron-vite/node`, and `vitest/globals`.
  - Confidence: moderate-to-high for this renderer slice; the targeted dependency-free regression tests pass, while full desktop typecheck/Vitest validation remains blocked on missing local dependencies in the worktree.
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Extend full-history access beyond the pending past-session tile path if users also need it during active or resumed live sessions.
  - Separate the resume-path/context-selection logic more explicitly so LLM context loading uses the compact active window while the UI always has access to the full preserved transcript.
  - Consider richer visual treatment for summarized sections (for example, a dedicated summary block or compaction metadata badge) if users need more provenance context.

- Next recommended issue work item: stay on `#58` for the resume-path/context-selection split, or add a small follow-up that exposes the same full-history affordance in additional session surfaces if user demand is stronger on live sessions.

##### Issue #58 — Conversation History: resume-path uses compacted context window

- Selection rationale:
  - This was the next explicitly documented `#58` follow-up in the ledger: now that raw history is preserved on disk and the desktop viewer can show it, the LLM resume path needed to stop reading the full stored transcript by default.
- Investigation:
  - Re-read issue `#58` plus the scope-locking comment and confirmed the remaining acceptance gap was the context/storage split itself: resumed agent runs should receive summary + active window, not every preserved raw message.
  - Re-inspected `apps/desktop/src/main/tipc.ts` and confirmed `processWithAgentMode(...)` still called `conversationService.loadConversation(conversationId)` when building `previousConversationHistory`, so large continued conversations would pass the un-compacted `conversation.messages` array into the agent loop.
  - Confirmed `apps/desktop/src/main/conversation-service.ts` already had the right narrow backend primitive for this job: `loadConversationWithCompaction(conversationId, sessionId)` compacts the active window when needed while preserving `rawMessages` on disk.
- Important assumptions:
  - Assumption: switching the desktop resume path to the existing compaction-aware loader is the correct smallest slice even though compaction can still be a best-effort lazy step on first resume of a long conversation.
  - Why acceptable: it directly closes the trust-critical acceptance gap (`LLM receives summary + active window only`) with a minimal change, while deeper performance/streaming refinements can remain a separate follow-up if needed.
- Changes implemented:
  - Updated `apps/desktop/src/main/tipc.ts` so resumed desktop agent runs load conversation history via `conversationService.loadConversationWithCompaction(conversationId, sessionId)` instead of the raw `loadConversation(...)` path.
  - Updated resume-path logging to describe the loaded agent context window in terms of active messages vs represented stored history, making the storage/context split more explicit in diagnostics.
  - Extended `apps/desktop/src/main/conversation-storage-integrity.test.js` with a targeted regression assertion covering the new compaction-aware resume-path wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Decide whether ACP-backed resume/history bootstrap should also adopt an explicit compaction-aware context contract, or remain UI-history-only because ACP session state is managed separately.
  - Consider a performance-oriented follow-up if first-resume compaction latency becomes noticeable on very long histories.
  - Continue exposing the preserved-history vs active-window distinction in more live-session surfaces if users need the same clarity outside pending past-session tiles.

- Next recommended issue work item: stay on `#58` for ACP/history-path alignment or live-session history provenance polish, unless a newly-opened bug with clearer repro and smaller scope appears first.

##### Issue #58 — Conversation History: stronger summary provenance in desktop full-history view

- Selection rationale:
  - After landing the storage/context split on the resume path, the next small acceptance-criteria gap on `#58` was making the relationship between stored earlier history and active summary context more explicit in the UI, without expanding the scope to new history surfaces.
- Investigation:
  - Re-read issue `#58` and its scope comment, focusing on the requirement that summarized segments be clearly marked so users can understand what is active context versus what is only preserved on disk.
  - Re-inspected `apps/desktop/src/renderer/src/components/agent-progress.tsx` and confirmed the past-session `Show Full History` view already had the toggle and divider, but its copy was still generic (`Showing the stored on-disk transcript`) and did not explicitly say how many earlier stored messages were being represented by summary context.
  - Re-checked `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` and confirmed there was already a cheap dependency-free source test to extend for this provenance wording.
  - Considered mobile parity per `apps/desktop/src/renderer/src/AGENTS.md` and confirmed no matching mobile full-history toggle surface exists today, so this exact viewer-copy slice remains desktop-only.
- Important assumptions:
  - Assumption: strengthening the existing desktop history copy is a worthwhile standalone slice even without introducing a separate visual badge component or expanding the feature to live sessions/mobile.
  - Why acceptable: it directly improves user trust and auditability on the only current full-history viewer surface, while keeping the change narrow and reviewable.
  - Assumption: count-based provenance text is sufficient for this slice.
  - Why acceptable: users now see both the stored transcript count and how many earlier stored messages are represented by summary blocks, which is the core trust signal the issue asked for.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to compute summary-block count plus stored/represented history counts for the existing tile transcript history affordance.
  - Updated the active-window history copy to explicitly say when earlier stored messages are currently represented by summary blocks.
  - Updated the `Show Full History` info panel to explain how many earlier stored messages are represented by the active LLM summary context before the `Active context window starts here.` divider.
  - Extended `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` with targeted assertions for the new provenance wording.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Decide whether live-session/resumed-session surfaces also need the same stored-history provenance affordance, beyond the current past-session desktop viewer.
  - Decide whether ACP-backed history bootstrap needs an explicit compaction-aware contract or whether its existing session-state model is sufficient.
  - Consider richer summary visual treatment later (for example, dedicated summary badges/cards) if the copy-only approach proves too subtle.

- Next recommended issue work item: either continue `#58` with ACP/history-path alignment or pivot to a fresh issue such as `#55`/`#57` if a clearer small repro emerges first.

##### Issue #58 — Conversation History: remote server resume path uses compacted context window

- Selection rationale:
  - While reviewing remaining `#58` trust gaps, the remote-server continuation flow stood out as a concrete, unaddressed path where resumed agent runs could still send the full stored transcript to the LLM instead of the compacted active window.
- Investigation:
  - Re-read issue `#58` and its scope-locking comment, focusing on the acceptance criterion that LLM context must stay separate from full on-disk storage.
  - Inspected `apps/desktop/src/main/remote-server.ts` and confirmed `runAgent(...)` still built `previousConversationHistory` directly from `updatedConversation.messages.slice(0, -1)` after appending the new user prompt.
  - Confirmed this differed from the already-fixed desktop resume path in `apps/desktop/src/main/tipc.ts`, which now uses `conversationService.loadConversationWithCompaction(conversationId, sessionId)` before building prior-context history.
  - Confirmed the remote ACP success-path helper `loadFormattedConversationHistory()` only affects returned API history payloads, not the LLM context bootstrap, so the narrowest trust-critical fix here was the non-ACP remote resume bootstrap itself.
- Important assumptions:
  - Assumption: aligning the non-ACP remote-server resume path with the compaction-aware desktop resume path is a valid standalone `#58` slice even though ACP-backed remote history bootstrap remains a separate follow-up decision.
  - Why acceptable: it closes a direct full-history-to-LLM gap on an active execution path with a very small code change, while the ACP path still depends on separate session-state behavior that deserves its own focused pass.
- Changes implemented:
  - Updated `apps/desktop/src/main/remote-server.ts` so continuing an existing remote conversation first appends the new user turn, then loads prior context via `conversationService.loadConversationWithCompaction(conversationId, sessionId)` after the session ID exists.
  - Updated remote-server resume logging to report active-message count versus represented stored-message count, mirroring the storage/context distinction already used in the desktop agent-mode path.
  - Extended `apps/desktop/src/main/conversation-storage-integrity.test.js` with a dependency-free regression assertion covering the new remote-server compaction-aware resume wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Decide whether ACP-backed remote history bootstrap also needs an explicit compaction-aware context contract or whether its separate session-state model is sufficient.
  - Consider whether remote read/recovery endpoints should expose preserved full history more explicitly (for example via `rawMessages`/compaction metadata) if audit/export consumers need parity with the desktop UI affordances.
  - Continue exposing preserved-history versus active-window provenance in additional live-session surfaces if users need the same clarity outside the current past-session viewer.

- Next recommended issue work item: stay on `#58` for ACP/history-path alignment, or pivot to a small `#57` trust-track metadata slice if bundle backup provenance feels more urgent next.

##### Issue #58 — ACP recreated sessions bootstrap with compacted prior context only

- Selection rationale:
  - The ledger’s clearest remaining `#58` gap was ACP/history-path alignment: when an ACP-backed conversation had to recreate its ACP session, DotAgents reused none of the prior conversation context, and there was still no explicit active-window-only contract on that bootstrap path.
  - This was a small, reviewable slice with direct user value for resumed ACP conversations and strong alignment with the issue’s “LLM context window separate from storage policy” acceptance criteria.
- Investigation:
  - Re-read issue `#58` and its scope-locking comment to keep the slice focused on separating active context from full stored history.
  - Inspected `apps/desktop/src/main/acp-main-agent.ts` and confirmed it loaded conversation state only for UI display, then created/reused ACP sessions and always called `acpService.sendPrompt(...)` without any explicit prior-context bootstrap when a new ACP session was created.
  - Confirmed `apps/desktop/src/main/tipc.ts` and the previously-fixed `apps/desktop/src/main/remote-server.ts` non-ACP paths already use `conversationService.loadConversationWithCompaction(conversationId, sessionId)` to honor the active-window-only contract.
  - Confirmed the current user turn is already persisted before `processTranscriptWithACPAgent(...)` is invoked, so an ACP bootstrap helper can safely exclude the current prompt and inject only prior context.
- Important assumptions:
  - Assumption: when an ACP session must be recreated for an existing DotAgents conversation, providing the compacted prior context via the existing prompt-context channel is an acceptable first slice even without implementing ACP protocol-level `session/load` support.
  - Why acceptable: it restores continuity with a very small code change, uses the already-supported `sendPrompt(..., context)` API, and still keeps the full raw transcript out of the recreated session bootstrap.
- Changes implemented:
  - Updated `apps/desktop/src/main/acp-main-agent.ts` to load continued ACP conversations through `conversationService.loadConversationWithCompaction(conversationId, sessionId)` instead of the raw loader.
  - Added a compact-context formatter in `acp-main-agent.ts` that, on recreated ACP sessions only, injects prior DotAgents context into the prompt as the active window (including summary markers) while explicitly excluding the current user prompt.
  - Preserved the existing session-reuse path so normal ACP turns do not redundantly re-inject prior context into already-live ACP sessions.
  - Updated `apps/desktop/src/main/acp-main-agent.test.ts` mocks and added a unit test covering compacted prior-context bootstrap for recreated ACP sessions.
  - Extended `apps/desktop/src/main/conversation-storage-integrity.test.js` with a dependency-free regression assertion covering the ACP compaction-aware bootstrap wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Decide whether ACP agents that support protocol-level session loading should later adopt `session/load` for higher-fidelity resume semantics instead of prompt-context reconstruction.
  - Consider exposing the same active-window-vs-full-history provenance more explicitly in live ACP UI surfaces if users need the distinction outside the past-session viewer.
  - Consider a targeted integration test for recreated ACP sessions once local desktop test dependencies are available in this worktree.

- Next recommended issue work item: stay on `#58` for protocol-level ACP resume fidelity or live-session provenance polish, unless a new bug with a tighter repro path supersedes it.

##### Issue #58 — Conversation History: Preserve full data on disk & UI access, exclude from LLM context

- Selection rationale:
  - Re-reviewed issue `#58` plus its scope-locking comment and chose the smallest remaining user-facing gap: the desktop live-session tile still only exposed `Show Full History` when the tile already carried raw-history data, so active summarized sessions could hide the affordance entirely even though preserved history existed on disk.
  - This was a narrow follow-up with clear UX value and direct alignment with the issue’s acceptance criteria around browsing complete history and clearly separating active context from stored history.
- Investigation:
  - Inspected the issue metadata/labels/comments and confirmed the open scope still explicitly calls for `Open History Folder` + `Show Full History` UI affordances and a clear active-window-vs-stored-history contract.
  - Re-read `apps/desktop/src/renderer/src/components/agent-progress.tsx` and confirmed the tile transcript already had the full-history viewer UI, boundary marker, and legacy partial warning, but only rendered them when `fullConversationHistory` / `conversationCompaction` were already present on the progress object.
  - Confirmed `apps/desktop/src/renderer/src/pages/sessions.tsx` only injects raw-history metadata for the pending past-session continuation tile, not for normal live progress updates.
  - Confirmed the renderer already has `useConversationQuery(...)` backed by `tipcClient.loadConversation(...)`, giving a minimal way to hydrate disk-backed history without changing the live progress event pipeline.
- Important assumptions:
  - Assumption: for this slice, lazily hydrating preserved history from disk inside the tile component is preferable to broadening every live `AgentProgressUpdate` payload.
  - Why acceptable: it keeps the change local to the UI affordance, reuses the existing persisted-conversation API, avoids touching active streaming/update paths, and still delivers the missing user-visible behavior for summarized live sessions.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` to lazily call `useConversationQuery(progress.conversationId)` when a live tile shows summary blocks but does not yet have `fullConversationHistory` attached.
  - Mapped persisted `rawMessages` into the existing `AgentProgress` full-history viewer model so the current `Show Full History` / `Show Active Window` toggle, divider, and provenance copy work for hydrated live sessions too.
  - Reused persisted compaction metadata when present so legacy partial-history warnings still surface correctly even for live tiles.
  - Added a lightweight loading state (`Checking for preserved full history on disk…`) and retry affordance if the disk hydration request fails, instead of silently hiding the feature.
  - Extended `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` with a regression assertion covering the lazy live-session hydration path.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` ✅
  - Attempted: `pnpm --filter @dotagents/desktop exec tsc --noEmit -p tsconfig.web.json --composite false` ⚠️ blocked by existing worktree/tooling issue (`@electron-toolkit/tsconfig/tsconfig.web.json` not found), so typecheck could not be used as a signal for this slice.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Decide whether the same lazy full-history hydration should also be exposed in the desktop overlay view, not just the tile transcript.
  - Consider pushing compaction metadata/full-history references directly through live progress updates later if the same provenance needs to appear in more renderer surfaces without extra fetches.
  - Re-run desktop web typecheck once the missing `@electron-toolkit/tsconfig` dependency/config issue in this worktree is resolved.

- Next recommended issue work item: either finish `#58` by extending the same provenance affordance into the live overlay surface, or pivot to a fresh issue only if it has a tighter local repro path than the remaining `#58` polish.

##### Issue #58 — Conversation History: Preserve full data on disk & UI access, exclude from LLM context

- Selection rationale:
  - The previous `#58` iteration landed lazy preserved-history hydration for live tiles and explicitly called out the desktop overlay as the next smallest remaining provenance gap.
  - Since the overlay shares the same `AgentProgress` transcript state but uses a separate render path, this was a tight follow-up that could deliver more consistency without touching backend storage or progress emission.
- Investigation:
  - Re-read the updated ledger entry and inspected the default/overlay branch in `apps/desktop/src/renderer/src/components/agent-progress.tsx`.
  - Confirmed the overlay path still rendered only the active `displayItems` transcript and had no access to the existing `Show Full History` affordance even after the new lazy hydration logic was added for tiles.
  - Confirmed the shared component state already had everything needed for an overlay slice: hydrated `fullHistoryDisplayItems`, summary counts, compaction metadata, divider index, and the `showFullHistory` toggle state.
- Important assumptions:
  - Assumption: matching the tile provenance affordance in the overlay is acceptable even if the exact visual layout is not pixel-identical.
  - Why acceptable: the issue’s requirement is functional clarity and access to preserved history; reusing the same labels, warnings, and boundary copy across both live surfaces reduces user confusion and keeps the slice reviewable.
- Changes implemented:
  - Expanded the shared preserved-history gating in `apps/desktop/src/renderer/src/components/agent-progress.tsx` so both `tile` and `overlay` variants can lazily hydrate disk-backed history when summarized blocks are present.
  - Added the same history banner / loading / retry / legacy-warning treatment to the overlay transcript surface.
  - Enabled the overlay chat view to switch between the active context transcript and the hydrated full-history transcript, including the existing `Active context window starts here.` divider.
  - Extended `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` with an additional regression assertion covering the overlay full-history path.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` ✅
  - Known blocker carried forward: desktop web typecheck remains unavailable in this worktree because `@electron-toolkit/tsconfig/tsconfig.web.json` is missing, so no new typecheck signal was available for this follow-up either.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Decide whether default/non-overlay desktop progress surfaces should expose the same preserved-history affordance, or whether tile + overlay now sufficiently cover live-session UX.
  - Consider deduplicating the banner rendering if more history-aware surfaces are added later, but avoid abstraction churn unless a third consumer appears.
  - Re-run desktop web typecheck once the missing `@electron-toolkit/tsconfig` dependency/config issue in this worktree is resolved.

- Next recommended issue work item: either wrap up `#58` with any final polish only if a concrete UX gap remains after manual desktop review, or pivot to a fresh issue with a clearer new repro path.

##### Issue #57 — Bundle backups: show target provenance in Settings → Capabilities

- Selection rationale:
  - After the earlier restore-entrypoint / recent-backups slices, the smallest remaining trust-focused improvement on `#57` was making each automatic backup more self-describing inside Settings so users can tell what it would restore without opening it first.
- Investigation:
  - Re-read issue `#57` plus its trust-track comments and focused on the requirements that backup paths stay visible to users and restore remains clearly understandable from Settings → Capabilities.
  - Confirmed `apps/desktop/src/main/bundle-service.ts` only surfaced manifest name/description/date/components for recent backups, so the renderer could not distinguish whether a backup came from the global layer or a workspace layer.
  - Confirmed `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` already had the right local UI surface but only showed bundle name, timestamp, and component counts.
  - Reviewed `apps/desktop/src/renderer/src/AGENTS.md` and confirmed no mobile follow-up is needed for this slice because the backup-folder/restore flow is Electron-specific and mobile has no equivalent Settings → Capabilities surface.
- Important assumptions:
  - Assumption: storing lightweight provenance on automatically-created backup bundles is acceptable even though the broader per-import plan/result metadata contract from the issue comments is still incomplete.
  - Why acceptable: it keeps backup snapshots self-describing, does not fork the import pipeline, and directly improves the existing restore UX with a very small change.
- Changes implemented:
  - Added optional `manifest.backup` metadata for auto-created pre-import backup bundles in `apps/desktop/src/main/bundle-service.ts`, recording that the bundle is a `pre-import-snapshot`, which target layer it protects (`global`, `workspace`, or `custom`), and the resolved target agents directory.
  - Extended `listImportBackups(...)` to return that backup provenance alongside the existing bundle summary fields.
  - Updated `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` so each `Recent backups` row now shows the target layer in the summary line and the stored backup file path in a monospace detail line.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` with source-level assertions covering the new backup-manifest metadata contract and the Settings UI provenance rendering.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Carry richer import-result provenance into the restore/import UI (for example, imported/skipped counts or conflict summaries from the originating import).
  - Consider adding copy-path or reveal-file affordances if users frequently need to manage individual backup bundles outside the app.
  - Reuse the same backup provenance contract in Hub install flows so local bundle imports and Hub installs surface consistent trust metadata.

- Next recommended issue work item: stay on `#57` for import-result/conflict provenance only if a similarly small slice is obvious, otherwise pivot to a fresh bug/enhancement with a clearer new local repro path.

##### Issue #57 — Bundle import dialog: clearer import-result and conflict provenance

- Selection rationale:
  - `#54` remains too speculative for a small shippable pass, while `#57` still had one explicit trust-focused follow-up in this ledger with a tight local implementation path: make import and restore outcomes more self-explanatory.
- Investigation:
  - Re-read the latest `#57` ledger notes and confirmed the remaining follow-up was to surface richer import-result/conflict provenance in the restore/import UI.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the dialog already had conflict counts plus per-item import actions from the backend, but the success toast still collapsed everything into `Successfully imported/restored N item(s)`.
  - Confirmed this meant users could skip or rename conflicting items without getting a clear outcome summary, even though the underlying result already knew which items were imported, overwritten, renamed, or skipped.
- Important assumptions:
  - Assumption: tightening provenance in the existing dialog/toast flow is the right next slice, rather than inventing a new post-import results screen.
  - Why acceptable: the issue is about import trust/safety, and the missing information was already available in the current flow; surfacing it in-place is the smallest useful fix.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the bundle import/restore dialog is part of the desktop Electron settings flow, and there is no corresponding mobile bundle-restore surface.
- Changes implemented:
  - Added local import-result summarization helpers in `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` so the dialog can distinguish imported, renamed, overwritten, skipped, and failed items.
  - Updated import success/error toasts to report clearer outcomes such as `Successfully restored 3 items (2 imported items, 1 skipped item)` instead of only a flat item count.
  - Added an inline `Current selection:` summary under the conflict strategy picker so the dialog explains what the selected strategy will do to the currently selected conflicting items before the user confirms.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` with source-level assertions covering the new provenance helpers and messaging.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Consider adding copy-path or reveal-file affordances for individual backup entries if users need more direct file management than the existing `Open Backups Folder` action.
  - If richer trust telemetry becomes necessary later, consider persisting import-result provenance onto backup manifests or import history rather than only surfacing it in the live dialog/toast flow.
  - Reuse the same clearer provenance language in Hub install flows if bundle installs continue to share this dialog.

- Next recommended issue work item: treat `#57` as largely wrapped unless a very small backup-management affordance is obviously missing, and otherwise pivot to a fresh bug/enhancement with a clearer new repro path than `#54`.

##### Issue #58 — Conversation History: default desktop processing view can inspect preserved full history

- Selection rationale:
  - The latest `#58` ledger entries had already covered tile and overlay history provenance, and the next smallest remaining UX gap was the inline desktop processing surface used by the main composer.
  - This was a concrete, reachable renderer-only slice because `TextInputPanel` still renders `AgentProcessingView` with `variant="default"`, but the shared `AgentProgress` history affordance was gated to `tile` and `overlay` only.
- Investigation:
  - Re-read issue `#58` and the recent ledger tail to avoid repeating earlier work while staying aligned with the remaining acceptance criteria around browsing complete history and separating active context from stored history.
  - Confirmed in `apps/desktop/src/renderer/src/components/agent-progress.tsx` that preserved-history hydration/toggle/provenance logic existed already, but `supportsStoredHistoryViewer` excluded `default` and the standard transcript banner rendered only when `variant === "overlay"`.
  - Confirmed in `apps/desktop/src/renderer/src/components/text-input-panel.tsx` that the desktop composer still uses `AgentProcessingView` with `variant="default"`, making the gap real for inline processing sessions.
  - Checked `apps/mobile/src/screens/ChatScreen.tsx` and `apps/mobile/src/ui/ResponseHistoryPanel.tsx`; mobile currently exposes respond-to-user history but has no matching preserved full-history viewer surface, so there was no equivalent mobile affordance to update in this slice.
- Important assumptions:
  - Assumption: the default desktop processing transcript should match overlay/tile preserved-history behavior rather than remaining a reduced view.
  - Why acceptable: it is the same `AgentProgress` conversation surface shown during inline desktop processing, so hiding stored-history provenance there would make `#58` feel inconsistently implemented across desktop surfaces.
  - Assumption: no mobile change is required for this slice.
  - Why acceptable: mobile does not currently have the same preserved-history UI contract; adding it there would be a larger product/design decision rather than parity work for this narrow desktop renderer follow-up.
- Changes implemented:
  - Extended `supportsStoredHistoryViewer` in `apps/desktop/src/renderer/src/components/agent-progress.tsx` so `default` sessions can lazily hydrate preserved disk-backed history just like tile and overlay views.
  - Updated the shared default/overlay transcript branch so the history banner, loading/error states, and `Show Full History` / `Show Active Window` toggle render for the standard desktop processing view as well, not only the overlay.
  - Renamed the shared transcript-content helper from overlay-specific wording to `standardTranscriptHasContent` to reflect that the branch now serves both default and overlay variants.
  - Extended `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` with assertions covering the default-variant support and the non-overlay-specific banner gating.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Manually desktop-smoke the inline composer flow once a full app/dev environment is available, to confirm the new default-view banner and toggle feel visually balanced under real streaming updates.
  - Decide whether any other non-tile desktop transcript surfaces still need explicit preserved-history affordances, or whether tile + overlay + default now sufficiently cover the current UX.
  - Re-run broader desktop typecheck/Vitest once the worktree has the missing desktop dependency/tooling baseline restored.

- Next recommended issue work item: either manually review `#58` in a full desktop run and close out any remaining UI polish, or pivot to a fresh issue with a tighter local repro path than the still-speculative `#54`.
