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

##### Issue #57 — Bundle backups: reveal individual backup bundles from Settings → Capabilities

- Selection rationale:
  - Re-reviewed `#57` and its trust-track comments, then chose the smallest remaining backup-management gap already called out in this ledger: users could open the whole backups folder, but each recent backup row still lacked a direct reveal action for the exact bundle they were about to restore or inspect.
  - This stayed tightly aligned with the issue’s trust goal of making backup paths visible and recovery easy without inventing a separate backup manager.
- Investigation:
  - Refreshed issue `#57` details/comments and confirmed the trust-track still emphasizes visible backup paths, restore from Settings → Capabilities, and keeping the existing import/restore pipeline rather than creating side flows.
  - Re-inspected `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed each recent backup row already renders the full file path but only exposes a `Restore` action.
  - Re-inspected `apps/desktop/src/main/tipc.ts` and confirmed the main process already has a reusable `revealFileInFolder(filePath)` helper based on `shell.showItemInFolder(...)`, making this a narrow TIPC/UI follow-up rather than a new filesystem abstraction.
  - Checked mobile parity and confirmed there is no equivalent mobile Settings → Capabilities backup-restore surface; mobile settings live in `apps/mobile/src/screens/SettingsScreen.tsx` and do not expose desktop-style bundle backup management.
- Important assumptions:
  - Assumption: adding a per-backup `Reveal` affordance is a valid next slice even without also adding copy-path or delete/cleanup controls in the same pass.
  - Why acceptable: it directly closes the most obvious individual-backup discoverability gap with minimal UI churn, while the existing path text and folder-level action still cover broader file-management needs.
  - Assumption: restricting the reveal action to files inside the managed backups directory is acceptable even though the renderer already receives absolute backup paths from the recent-backups query.
  - Why acceptable: it preserves the intended Settings → Capabilities contract and avoids turning the new TIPC action into a generic arbitrary-file reveal endpoint.
- Changes implemented:
  - Added `revealBundleBackupFile` to `apps/desktop/src/main/tipc.ts`, reusing `revealFileInFolder(...)` and validating that the requested file resolves inside the default backups directory before revealing it in Finder/Explorer.
  - Added per-row `Reveal` actions to the `Recent backups` panel in `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx`, including spinner/error handling alongside the existing `Restore` action.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` with source-level assertions covering the new renderer affordance and the guarded TIPC reveal action.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Consider adding `Copy path` if users still need faster handoff into terminal/Finder workflows beyond reveal + folder open.
  - Consider per-backup cleanup/remove actions only after there is a clear retention-management design that complements the existing automatic pruning.
  - Reuse the same reveal/provenance affordances in Hub install flows if bundle install history becomes a first-class surface.

- Next recommended issue work item: treat `#57` as substantially wrapped unless a very small `Copy path` polish proves necessary, and otherwise pivot to a fresh issue with a tighter validated repro path than `#54`.

##### Issue #57 — Bundle backups: copy backup bundle path from Settings → Capabilities

- Selection rationale:
  - This was the smallest remaining trust/discoverability polish explicitly called out in the prior `#57` ledger entry: users could reveal a backup in Finder/Explorer, but still lacked a one-click way to copy the exact bundle path into terminal, chat, or docs.
- Investigation:
  - Re-read issue `#57` comments and confirmed the trust track still emphasizes visible backup paths, restore reachability, and low-friction recovery from Settings → Capabilities.
  - Re-inspected `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed each recent backup row already displayed the full absolute path plus `Reveal` and `Restore` actions, but no direct copy affordance.
  - Confirmed the desktop renderer already has a shared `copyTextToClipboard()` helper in `apps/desktop/src/renderer/src/lib/clipboard.ts` that falls back to Electron main-process clipboard writes on platforms where `navigator.clipboard` is unreliable.
  - Checked mobile parity and confirmed no follow-up is needed for this slice because mobile does not expose the desktop bundle-backup management surface.
- Important assumptions:
  - Assumption: a renderer-only `Copy path` action is sufficient; no new TIPC route is needed.
  - Why acceptable: the existing shared clipboard helper already encapsulates the necessary fallback behavior, so a new main-process API would duplicate established infrastructure.
- Changes implemented:
  - Imported `copyTextToClipboard` into `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and added `handleCopyBackupPathClick(...)` with success/error toasts.
  - Added a per-row `Copy path` action to the `Recent backups` panel so each backup bundle can be copied directly from Settings → Capabilities.
  - Let the backup action group wrap on narrow widths so the added third action does not force the row controls into overflow-prone horizontal compression.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` with source-level assertions covering the copy helper import, `Copy path` label, success toast copy feedback, and row handler wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Consider whether a temporary inline `Copied` state is worthwhile if users need less toast-dependent confirmation when copying multiple backup paths.
  - Consider per-backup cleanup/remove actions only after there is a retention-management design beyond the current automatic pruning.
  - Reuse the same clearer provenance/copy affordances in Hub install history if bundle-install recovery becomes a first-class surface.

- Next recommended issue work item: treat `#57` as effectively wrapped for now and pivot to a fresher validated issue slice, with `#58` desktop/ACP history provenance or another well-scoped bug preferred over the still-speculative `#54`.

##### Issue #53 — Inline skill invocation: unify main desktop composer onto shared slash helpers

- Selection rationale:
  - `#54` remains too speculative for a trustworthy implementation pass, while `#53` still had a concrete, reviewable follow-up already called out in this ledger: the main desktop composer duplicated slash-command parsing/expansion logic that overlay and tile follow-up inputs had already moved into a shared helper module.
  - This slice improves consistency and lowers drift risk across the three desktop slash-command surfaces without changing the user-facing contract.
- Investigation:
  - Re-read issue `#53` and confirmed the acceptance criteria are about slash-triggered discovery, inline invocation, optional arguments, and visible active-skill indication across chat inputs.
  - Re-inspected `apps/desktop/src/renderer/src/components/text-input-panel.tsx` and confirmed it still had its own local `normalizeSkillSlashToken`, `getSlashCommandState`, and `expandSlashCommandText` helpers plus inline slash-command replacement logic.
  - Re-inspected `apps/desktop/src/renderer/src/components/skill-slash-commands.ts`, `overlay-follow-up-input.tsx`, and `tile-follow-up-input.tsx` and confirmed those two follow-up composers already shared the extracted slash-command helpers.
  - Checked mobile parity only to confirm there is still no equivalent mobile slash-command composer flow to update in this narrow desktop-only consistency pass.
- Important assumptions:
  - Assumption: helper unification is a valid shippable `#53` slice even without adding new slash-command capabilities.
  - Why acceptable: it directly reduces regression risk across the existing desktop slash-command experience and keeps future behavior changes from drifting between composer surfaces.
  - Assumption: no mobile follow-up is required for this slice.
  - Why acceptable: mobile still does not expose the desktop slash-command UI contract, so parity work there would be a separate product/UX decision rather than part of this consistency refactor.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/text-input-panel.tsx` to import `getSlashCommandState`, `expandSlashCommandText`, and `replaceSlashCommandSelection` from `skill-slash-commands.ts`.
  - Removed the main composer’s duplicate local slash-command parsing/expansion helpers so the primary desktop composer now uses the same helper contract as overlay and tile follow-up inputs.
  - Replaced the main composer’s inline selection-rewrite logic with `replaceSlashCommandSelection(...)` so slash suggestion acceptance stays behaviorally aligned across desktop inputs.
  - Extended `apps/desktop/src/renderer/src/components/text-input-panel.slash-command.test.js` with assertions covering the shared-helper import and the removal of the old local helper definitions.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/text-input-panel.slash-command.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #53:
  - Decide whether mobile should gain a platform-appropriate slash-command picker or remain desktop-only for now.
  - Consider whether any additional slash-command affordances (for example, command aliases or richer structured invocation metadata) should be implemented once the desktop helper contract is fully stabilized.
  - Re-run broader desktop Vitest/typecheck once this worktree has the missing dependency/tooling baseline restored.

- Next recommended issue work item: either keep closing small consistency/polish gaps on `#53` only if a real user-facing mismatch remains, or pivot back to `#58` for any remaining ACP/live-session history provenance work since that issue still maps more directly to current trust/UX priorities.

##### Issue #58 — Conversation History: persistent header provenance badges

- Selection rationale:
  - The broader `#58` history viewer/storage work is already in place in this branch, and the clearest remaining user-facing gap was discoverability: summarized-vs-active history state only appeared inside the transcript banner, not in the always-visible session chrome.
- Investigation:
  - Re-read issue `#58` and its scope-locking comment, especially the requirement to visibly differentiate summarized history from the active context window.
  - Re-inspected `apps/desktop/src/renderer/src/components/agent-progress.tsx` and confirmed the UI already showed `Show Full History`, the active-window divider, and legacy partial warnings inside transcript panels, but nothing in the tile/default/overlay headers signaled history state before the transcript was opened or expanded.
  - Checked the desktop-renderer `AGENTS.md` cross-platform reminder and confirmed mobile has no equivalent stored-history/session-chrome affordance today, so a mirrored mobile change would be a separate design decision rather than part of this narrow desktop slice.
- Important assumptions:
  - Assumption: adding a compact provenance badge to the existing desktop session headers is a valid `#58` slice even without changing the transcript content itself.
  - Why acceptable: it directly advances the issue's `visually differentiate summarized vs active` requirement with minimal UI churn and improves discoverability for collapsed tiles and glanceable live sessions.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: mobile does not currently expose the same full-history viewer or session-header status surface that this badge augments on desktop.
- Changes implemented:
  - Added a derived `historyStatusBadge` in `apps/desktop/src/renderer/src/components/agent-progress.tsx` that summarizes compacted/full/partial/checking/error history states using the existing stored-history signals.
  - Rendered the new provenance badge in both the tile header and the default/overlay header so history state stays visible even when the transcript body is collapsed or scrolled away.
  - Extended `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` with source-level assertions covering the new badge labels and header wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Consider whether ACP-specific session chrome needs richer provenance wording if ACP resume/bootstrap semantics diverge further from the standard conversation path.
  - Consider adding a lightweight tooltip/popover or help copy if users need more context than the compact badge title provides.
  - Re-run broader desktop Vitest/typecheck once this worktree has the missing dependency/tooling baseline restored.

- Next recommended issue work item: either keep tightening `#58` with ACP/live-session provenance polish if a concrete mismatch remains, or pivot to a fresh issue with a similarly strong local repro path instead of the still-speculative `#54`.

##### Issue #58 — Conversation History: past-session compaction provenance badges

- Selection rationale:
  - After landing header-level provenance badges for live/default session chrome, the next clear `#58` gap was in Past Sessions: compacted or legacy-partial sessions were still indistinguishable in the history list before opening them.
- Investigation:
  - Inspected `apps/desktop/src/shared/types.ts`, `apps/desktop/src/main/conversation-service.ts`, and `apps/desktop/src/renderer/src/components/past-sessions-dialog.tsx`.
  - Confirmed `ConversationHistoryItem` only exposed title/timestamps/preview counts, so `useConversationHistoryQuery()` could not surface compaction state to the renderer even though full conversation files already carry `compaction` metadata.
  - Confirmed the Past Sessions dialog had no badge/label for compacted vs legacy-partial sessions, so users had no at-a-glance provenance signal in the historical list.
- Important assumptions:
  - Assumption: backfilling missing index metadata only for history items with `messageCount > COMPACTION_MESSAGE_THRESHOLD` is sufficient for this slice.
  - Why acceptable: the current compaction path only activates above that threshold, so this avoids a broad file-scan penalty for obviously non-compacted sessions while still covering the sessions most likely to need provenance badges.
  - Assumption: deriving compaction metadata in memory from the stored conversation JSON is enough even if the conversation file itself is not rewritten during the backfill path.
  - Why acceptable: this slice needs the metadata primarily for history-list display; the canonical conversation metadata is still normalized the next time those sessions are loaded/saved through standard paths.
- Changes implemented:
  - Added optional `compaction` metadata to `ConversationHistoryItem` in `apps/desktop/src/shared/types.ts`.
  - Updated `apps/desktop/src/main/conversation-service.ts` so new history index entries persist `conversation.compaction`, and added a best-effort backfill path that enriches older index entries from on-disk conversation files when the index predates this metadata.
  - Updated `apps/desktop/src/renderer/src/components/past-sessions-dialog.tsx` to render `History compacted` and `History partial` badges in session rows with explanatory `title` text.
  - Extended source-level regression coverage in `apps/desktop/src/main/conversation-storage-integrity.test.js` and `apps/desktop/src/renderer/src/components/past-sessions-dialog.layout.test.ts`.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run apps/desktop/src/renderer/src/components/past-sessions-dialog.layout.test.ts` ⚠️ failed because the current workspace does not have a runnable `vitest` binary available on PATH for that package.
  - Completed fallback: `node -e "const fs=require('fs'); const src=fs.readFileSync('apps/desktop/src/renderer/src/components/past-sessions-dialog.tsx','utf8'); ..."` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - If the desktop workspace dependency baseline is restored, re-run the targeted Vitest file to replace the no-install renderer fallback verification.
  - Consider whether the Sessions page recent-history surfaces should mirror the same compacted/partial badge treatment for consistency.
  - Consider whether very old compacted sessions below current thresholds need a one-time fuller index migration if real user data disproves the threshold-based backfill assumption.

- Next recommended issue work item: refresh the remaining open issues and choose a new concrete slice outside `#58` unless a specific provenance inconsistency is still observable, because the highest-value trust/visibility gaps for compacted history are now largely covered.

##### Issue #54 — ChatGPT subscription provider feasibility triage + ambiguity-reduction copy

- Selection rationale:
  - After two `#58` slices, `#54` was the most obvious remaining open issue, but it needed a feasibility pass before any implementation work because the request explicitly depends on OAuth/session semantics outside the repo's current API-key provider model.
- Investigation:
  - Read issue `#54` and confirmed the requested behavior is specifically `ChatGPT (Subscription)` via OAuth/session billing, not just another OpenAI-compatible API preset.
  - Inspected provider definitions and settings wiring in `packages/shared/src/providers.ts`, `apps/desktop/src/shared/types.ts`, `apps/desktop/src/main/ai-sdk-provider.ts`, `apps/desktop/src/main/models-service.ts`, and `apps/desktop/src/renderer/src/pages/settings-providers.tsx`.
  - Confirmed the current architecture only supports explicit API-backed providers (`openai`, `groq`, `gemini`) plus local voice providers; there is no existing OAuth/session-token provider abstraction or ChatGPT-specific transport.
  - Queried official OpenAI help center search results and found explicit guidance that ChatGPT subscriptions and API billing are separate (`How can I move my ChatGPT subscription to the API?` / `How can I access the ChatGPT API?`).
- Important assumptions:
  - Assumption: it is not responsible to add a fake or unofficial `ChatGPT (Subscription)` provider option without a documented, supportable auth + billing path.
  - Why acceptable: the current repo routes all model traffic through API-style providers, and the official OpenAI help guidance says ChatGPT Plus/Pro does not grant API access. Shipping a UI option that implies otherwise would create broken expectations and likely reliability/security debt.
  - Assumption: a small UX clarification in provider settings is a worthwhile issue slice even though it does not implement the requested provider.
  - Why acceptable: it directly addresses the user confusion motivating `#54`, reduces support ambiguity immediately, and preserves honesty about current platform constraints while keeping the door open for a future supported integration.
- Changes implemented:
  - Added clarifying copy to `apps/desktop/src/renderer/src/pages/settings-providers.tsx` explaining that ChatGPT Plus/Pro subscriptions are billed separately from the OpenAI API and that OpenAI usage in DotAgents still requires API billing credentials or an OpenAI-compatible preset.
  - Added a no-install regression test at `apps/desktop/src/renderer/src/pages/settings-providers.subscription-guidance.test.js` to assert the new guidance text and ensure the shared provider list still only exposes officially supported API-backed chat providers.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-providers.subscription-guidance.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #54:
  - Revisit only if OpenAI exposes a documented OAuth/session-based integration path that explicitly permits third-party app usage against ChatGPT subscription entitlements.
  - If the product still wants to pursue this sooner, the next step is a dedicated feasibility/legal/reliability review of any unofficial session approach before code implementation.
  - If no official path emerges, consider reframing the user ask toward easier-to-support alternatives (for example, clearer OpenAI-compatible preset onboarding or cost-awareness UX) rather than pretending subscription billing works via the API.

- Next recommended issue work item: refresh the open issue list again and prefer a new bug or tightly-scoped enhancement with a direct implementation path, since `#54` is now better triaged but still fundamentally blocked on external platform support.

##### Issue #55 — Session tile spacing follow-up: collapsed pending continuation tiles no longer hold the lead grid slot

- Selection rationale:
  - `#55` is still the only open bug in the current repo issue set, and the prior collapsed-tile packing fix left one clear desktop-specific edge case: pending continuation tiles were still rendered first even when collapsed.
- Investigation:
  - Re-read issue `#55`, confirmed there were still no comments beyond the original report, and revisited the earlier `#55` ledger entry to avoid repeating the already-landed maximize/name fixes.
  - Inspected `apps/desktop/src/renderer/src/pages/sessions.tsx` and confirmed the previous packing logic only reordered `orderedVisibleProgressEntries` for regular sessions.
  - Confirmed the pending continuation tile path was still rendered unconditionally before regular tiles with `index={0}`, even when `collapsedSessions[pendingSessionId]` was true, which could preserve the same empty-space symptom the issue calls out.
  - Checked nearby desktop-only layout code in `apps/desktop/src/renderer/src/components/session-grid.tsx` and confirmed collapsed tiles use `height: auto`, so DOM/render order directly affects whether an expanded tile can reclaim the primary grid slot.
- Important assumptions:
  - Assumption: source-level confirmation of the pending-tile render order is a sufficient repro for this slice.
  - Why acceptable: the bug follows directly from the current render contract (`pending` tile always first, collapsed regular tiles packed later), and this worktree still lacks the installed desktop Vitest toolchain for heavier renderer execution.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the bug is specific to the desktop sessions tile grid / pending continuation flow, which does not have an equivalent mobile tile-layout surface.
- Changes implemented:
  - Added `shouldDeferPendingProgressTile` in `apps/desktop/src/renderer/src/pages/sessions.tsx` so a collapsed pending continuation tile is deferred behind expanded regular tiles whenever there is another visible tile to reclaim the lead grid slot.
  - Extracted a small local `renderPendingProgressTile(index)` helper so the same pending tile can render either first or after the regular ordered entries without duplicating the tile body.
  - Replaced the regular-tile index offset logic with `pendingTileIndexOffset`, so drag-target/index math only shifts when a pending tile actually renders ahead of the regular session list.
  - Added `apps/desktop/src/renderer/src/pages/sessions.pending-tile-layout.test.js`, a dependency-free regression test covering the new defer-after-expanded logic and the corresponding index-offset wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/sessions.pending-tile-layout.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #55:
  - Consider whether collapsed-tile packing should eventually preserve drag-reorder even when one or more regular tiles are collapsed.
  - If users still report awkward gaps, evaluate a fuller masonry/grid-row-aware layout rather than additional ad hoc ordering rules.

- Next recommended issue work item: refresh the current open issues again and pick the next smallest direct-value slice outside `#55`, unless collapsed-tile drag-reorder becomes the next clearly reported UX gap.

##### Issue #56 — Bundle inspector follow-up: render agent system prompts as markdown

- Selection rationale:
  - `#56` already had a shipped landing-page inspector slice, but one explicit acceptance criterion remained only partially met: agent system prompts were still rendered as plain escaped text instead of going through the readable markdown path used for skills and repeat-task prompts.
  - This was a small, high-value trust improvement with a direct local verification path in the static website test suite.
- Investigation:
  - Re-read issue `#56`, including the owner follow-up comment emphasizing agent-profile prompt preview as part of the inspect-before-install trust surface.
  - Re-checked `website/index.html` and confirmed `profile.systemPrompt` was still rendered inside a raw `.bundle-command` block, while `skill.instructions` and `repeatTasks[].prompt` already used `renderMarkdown(...)`.
  - Re-checked `website/website-hub-inspector.test.js` and confirmed the existing coverage asserted generic markdown helper presence but did not specifically lock in markdown rendering for agent system prompts.
- Important assumptions:
  - Assumption: promoting system prompts into the existing markdown renderer is preferable to preserving the old monospace command-block treatment.
  - Why acceptable: the issue body explicitly calls for readable markdown for system prompts, and MCP server commands still retain the dedicated `.bundle-command` treatment where monospace command formatting is actually the right UI.
- Changes implemented:
  - Updated `website/index.html` so `profile.systemPrompt` renders through `renderMarkdown` with an explicit `## System Prompt` heading, matching the readability treatment already used for other long-form bundle content.
  - Updated `website/website-hub-inspector.test.js` to assert that system prompts now flow through the markdown renderer, preventing regression back to plain escaped text.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - Consider richer summarization for especially long system prompts (for example, collapsible previews or first-lines summaries) if the modal becomes too dense on mobile.
  - If the hub catalog expands beyond curated featured bundles in this repo surface, reuse the same inspector behavior across the full bundle list instead of maintaining separate preview patterns.

- Next recommended issue work item: refresh the remaining open issues and prefer either a tightly-scoped reliability slice from `#57` / `#58` or a similarly concrete trust/preview enhancement from `#25` if it can be landed without widening scope.

##### Issue #57 — Conflict preview follow-up: show concrete conflicting items and predicted rename outcomes

- Selection rationale:
  - `#57` was still open, and the current bundle import dialog only exposed per-component conflict counts plus a global resolution selector. That left a trust gap against the issue’s “see exactly what a bundle will change before committing” goal even after earlier backup/cherry-pick work landed.
- Investigation:
  - Re-read issue `#57` and its follow-up comments, especially the request for a diff-style conflict preview with skip/overwrite/rename behavior visible before any writes occur.
  - Inspected `apps/desktop/src/main/bundle-service.ts`, `apps/desktop/src/main/tipc.ts`, and `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx`.
  - Confirmed `previewBundleWithConflicts(...)` already returned concrete conflict items (`id`, `name`, optional `existingName`) but did not include any predicted rename target or explicit default action metadata.
  - Confirmed the renderer dialog showed only aggregate conflict counts and a strategy selector, so users still could not review the exact conflicting items or the rename outcome they were about to apply.
- Important assumptions:
  - Assumption: a grouped itemized conflict preview with deterministic rename-target hints is a worthwhile shippable slice even without fully per-item inline controls yet.
  - Why acceptable: it materially improves trust and inspectability right now, while preserving the existing global conflict policy contract and avoiding a much broader import-plan refactor in one pass.
  - Assumption: reusing the existing `generateUniqueId(...)` rename logic for preview metadata is sufficiently accurate for this slice.
  - Why acceptable: the import path already uses the same deterministic rename helper, so surfacing that predicted ID in preview keeps the UI aligned with the current write behavior.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the bundle import dialog is a desktop renderer flow; there is no equivalent mobile import surface to keep in sync here.
- Changes implemented:
  - Extended `PreviewConflict` in `apps/desktop/src/main/bundle-service.ts` to carry `defaultStrategy: "skip"` and `renameTargetId`, and populated those fields for every detected conflict using the existing rename helper.
  - Updated the local TIPC conflict item type in `apps/desktop/src/main/tipc.ts` so the richer preview payload survives the main-to-renderer contract.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` to render a new grouped `Conflict preview` section that lists the exact conflicting items by component type, shows the currently selected strategy badge, and surfaces the predicted renamed ID when `Rename imported items` is selected.
  - Extended `apps/desktop/src/main/bundle-service.test.ts` expectations to lock in the new preview metadata for conflict results.
  - Added a dependency-free source regression test at `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` covering the preview metadata contract and the dialog wiring for concrete conflict rendering.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop test -- --run src/main/bundle-service.test.ts` ⚠️ failed because this worktree currently has no installed workspace dependencies / `node_modules`, so `pnpm` could not run the shared `tsup` pretest step (`sh: tsup: command not found`).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Consider promoting the current global conflict strategy into true per-item controls inline in the preview list if users still need more granular conflict decisions.
  - If the dependency baseline is restored, re-run the targeted desktop Vitest coverage for `bundle-service.test.ts` so the richer preview payload is exercised by the real test harness rather than only the no-install source-level guard.
  - Consider adding non-conflicting “Add new” rows to the preview if the product wants the dialog to become a fuller diff-style import plan rather than a conflict-focused review.

- Next recommended issue work item: either continue `#57` with inline per-item conflict actions or switch to a fresh `#58` / `#25` trust slice, but avoid broad refactors unless a specific acceptance gap is confirmed first.

##### Issue #57 — Import-plan follow-up: include non-conflicting “Add new” rows in bundle preview

- Selection rationale:
  - `#57` was still missing the most literal part of its diff-style preview acceptance: after the earlier conflict-preview slice, users could now inspect exact conflicting items, but they still could not see the non-conflicting items that would simply be added.
  - This was a small, reviewable trust improvement with a strong local implementation path in the existing desktop import dialog.
- Investigation:
  - Re-read issue `#57`, especially the sample table showing both `✅ Add new` and conflict actions before import.
  - Re-inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the current preview section still rendered only conflict items plus the global strategy selector.
  - Re-checked the preview contract and confirmed `previewBundleWithConflicts(...)` already returns the full bundle object alongside conflict metadata, so the renderer already had enough item detail to derive a fuller import plan without expanding the main-process API surface.
  - Confirmed mobile parity is not part of this slice because mobile still has no equivalent bundle import dialog to update.
- Important assumptions:
  - Assumption: a renderer-only expansion from “conflict preview” to “import plan” is a valid shippable `#57` slice even without true per-item conflict controls.
  - Why acceptable: it directly closes more of the issue’s “see exactly what a bundle will change before committing” gap while keeping the current import execution contract intact.
  - Assumption: using the bundle payload already returned in preview is preferable to adding a second backend-specific “planned items” structure for now.
  - Why acceptable: it keeps the change narrow, avoids new cross-process abstractions, and still lets the UI show concrete item names/IDs grouped by component.
- Changes implemented:
  - Extended the local preview typing in `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` to read the already-returned bundle component arrays.
  - Added `buildImportPlanItems(...)` plus import-plan outcome/badge helpers that derive per-item `Add new`, `Skip`, `Overwrite`, or `Rename` rows from the selected components and current conflict strategy.
  - Replaced the prior conflict-only preview block with an `Import plan` section that now lists all selected bundle items by component, preserving rename previews for conflicts while also surfacing non-conflicting additions explicitly.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to lock in the new import-plan wording, add-new outcome copy, renderer-side item derivation, and rename preview wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop typecheck:web` ⚠️ failed because this worktree does not currently have installed workspace dependencies / `node_modules`; the desktop tsconfig’s `@electron-toolkit/tsconfig/tsconfig.web.json` base config could not be resolved.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Consider inline per-item conflict controls if users still need different actions for different conflicting rows in the same import.
  - Consider nested per-item cherry-pick toggles under each component group if the product wants to match the issue’s sketched item-level checkbox UX rather than only component-level selection.
  - Re-run targeted desktop typecheck/Vitest once the dependency baseline is restored in this worktree.

- Next recommended issue work item: either finish `#57` with true per-item conflict actions/item-level toggles, or pivot to a fresh issue like `#58`/`#25` if a similarly concrete trust or provenance gap has a tighter repro path.

##### Issue #58 — Recent Sessions follow-up: mirror compacted/partial provenance badges in Sessions empty state

- Selection rationale:
  - The most concrete remaining `#58` inconsistency was in the Sessions page empty state: the `Recent Sessions` list reused persisted history items but still lacked the compacted/partial provenance badges already added to the Past Sessions dialog and session headers.
  - This was a small desktop-only trust improvement with a direct local implementation path and no new main-process work.
- Investigation:
  - Re-read issue `#58` and the recent ledger entries to avoid repeating the already-landed history storage, header badge, and Past Sessions badge work.
  - Inspected `apps/desktop/src/renderer/src/pages/sessions.tsx` and confirmed the empty-state `Recent Sessions` list rendered only title + timestamp for `useConversationHistoryQuery()` items, with no history-state badge.
  - Re-inspected `apps/desktop/src/renderer/src/components/past-sessions-dialog.tsx` and confirmed it already had the exact compacted/partial badge mapping logic, but only as a local helper inside that component.
  - Confirmed this is desktop-only UI parity work; mobile still has no equivalent Past Sessions / recent-history provenance surface to update.
- Important assumptions:
  - Assumption: reusing the same compacted/partial badge mapping in the Sessions-page recent history list is a valid shippable `#58` slice even without adding new history controls.
  - Why acceptable: it directly advances the issue’s requirement to visually differentiate summarized/partial history in another real navigation surface users rely on before opening a conversation.
  - Assumption: extracting the existing renderer badge mapping into a tiny shared helper is preferable to duplicating the same compaction wording across multiple components.
  - Why acceptable: this keeps provenance copy/class semantics aligned between Past Sessions and the Sessions-page recent-history list while staying entirely within the renderer boundary.
- Changes implemented:
  - Added `apps/desktop/src/renderer/src/lib/conversation-history-badges.ts` with a shared `getConversationHistoryBadge(...)` helper that maps stored compaction metadata to the existing `History compacted` / `History partial` label, tooltip, and styling contract.
  - Updated `apps/desktop/src/renderer/src/components/past-sessions-dialog.tsx` to reuse the new helper instead of keeping a local copy of the badge logic.
  - Updated `apps/desktop/src/renderer/src/pages/sessions.tsx` so the empty-state `Recent Sessions` rows now show the same provenance badge next to the session title when compacted or legacy-partial history metadata is present.
  - Updated `apps/desktop/src/renderer/src/components/past-sessions-dialog.layout.test.ts` to assert the shared-helper wiring.
  - Added `apps/desktop/src/renderer/src/pages/sessions.recent-history-badges.test.js`, a dependency-free regression test covering helper reuse and badge rendering contracts across both desktop history surfaces.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/sessions.recent-history-badges.test.js` ✅
  - Completed: `git diff --check` ✅
  - Known blocker unchanged: broader desktop typecheck/Vitest remains unavailable in this worktree until workspace dependencies / `node_modules` are restored.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Consider whether the active-agents sidebar’s past-session rows should also surface compacted/partial provenance for consistency with Sessions and Past Sessions.
  - If the desktop dependency baseline is restored, re-run targeted renderer Vitest/typecheck to replace the current no-install source verification.
  - Consider whether compacted-history badges should expose a richer tooltip/popover if users need more detail than the current concise titles.

- Next recommended issue work item: either continue `#58` with sidebar history provenance parity, or pivot back to `#25` / another fresh issue if a tighter locally verifiable trust or UX slice is available.

##### Issue #58 — Active agents sidebar provenance badge parity

- Selection rationale:
  - The most concrete remaining `#58` inconsistency after the recent Sessions-page and Past Sessions provenance work was the desktop active-agents sidebar, which still listed past sessions without showing whether history was compacted or partially unrecoverable.
  - This was a small, user-facing trust slice with a clear local renderer implementation path.
- Investigation:
  - Re-read issue `#58` and its scope-locking comment to confirm that visually differentiating summarized/partial history is still part of the intended UX acceptance.
  - Inspected `apps/desktop/src/renderer/src/components/active-agents-sidebar.tsx` and confirmed past sidebar rows only rendered archive icon + title, using a narrowed local `ConversationHistoryItem` shape that dropped `compaction` metadata entirely.
  - Confirmed the sidebar prioritizes `recentSessions` runtime rows ahead of persisted history rows, which meant even conversations with stored compaction metadata could lose provenance badges when a recent runtime row with the same `conversationId` won deduplication.
  - Reused the existing shared badge contract in `apps/desktop/src/renderer/src/lib/conversation-history-badges.ts` rather than introducing another renderer-specific mapping.
- Important assumptions:
  - Assumption: extending provenance badges to the desktop active-agents sidebar is a valid standalone `#58` slice even though mobile session lists still do not show the same history-state badges.
  - Why acceptable: the issue and nearby landed work are centered on desktop conversation-history affordances, and the mobile app has a different session-list surface rather than an equivalent active-agents sidebar to keep in lockstep here.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/active-agents-sidebar.tsx` to import the shared `ConversationHistoryItem` type plus `getConversationHistoryBadge(...)` and `Badge`, removing the local drifted history-item shape.
  - Added sidebar `historyItem` tracking so past-session rows can carry persisted history metadata alongside the display session object.
  - Added `conversationHistoryById` enrichment so recent runtime sessions inherit persisted compaction metadata when their `conversationId` matches a stored conversation-history entry, preserving badges even when runtime rows win deduplication.
  - Rendered the shared `History compacted` / `History partial` badges inline on sidebar past-session rows.
  - Added `apps/desktop/src/renderer/src/components/active-agents-sidebar.history-badges.test.js`, a dependency-free regression test covering shared-helper reuse and the runtime-to-persisted metadata enrichment path.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/active-agents-sidebar.history-badges.test.js apps/desktop/src/renderer/src/pages/sessions.recent-history-badges.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Consider whether the mobile session list should also expose compacted/partial provenance now that several desktop history surfaces do.
  - If workspace dependencies are restored in this worktree, replace the current source-level verification with targeted desktop renderer Vitest/typecheck coverage for the sidebar.
  - Consider richer provenance affordances (for example, tooltip detail or popover summaries) if users need more than the current compact badge labels.

- Next recommended issue work item: stay on `#58` only if there is another narrow provenance surface to align, otherwise pivot to a fresh high-value issue such as `#25` or another clearly local desktop reliability/UX slice.

##### Issue #57 — Bundle import per-item cherry-pick follow-up

- Selection rationale:
  - `#57` was still open and already had the backup + conflict-preview groundwork landed in this worktree, but one important acceptance gap remained: users could toggle whole component groups, yet they still could not deselect individual bundle items before import.
  - This made `#57` a strong follow-up candidate even though it had been investigated recently, because the remaining slice was narrow, user-visible, and locally implementable without reopening the broader restore/sandbox scope.
- Investigation:
  - Re-read issue `#57` and confirmed the explicit cherry-pick acceptance criterion is “User can deselect individual components before importing,” with the proposal text showing per-item toggles nested under each component group.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the dialog only supported component-level switches plus a single global conflict strategy selector; each import-plan row was read-only.
  - Inspected `apps/desktop/src/main/bundle-service.ts` and `apps/desktop/src/main/tipc.ts` and confirmed the backend import contract only accepted `components`, so there was no way for the renderer to express per-item inclusion/exclusion even if the dialog grew item toggles.
  - Reviewed the existing dependency-free regression harness in `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` and the fuller Vitest coverage in `apps/desktop/src/main/bundle-service.test.ts` to anchor a minimal, reviewable test update.
- Important assumptions:
  - Assumption: for this iteration, it is acceptable to add per-item inclusion/exclusion while keeping conflict handling as a single import-wide strategy (`skip` / `overwrite` / `rename`) rather than implementing mixed per-conflict decisions.
  - Why acceptable: issue `#57` explicitly calls out cherry-pick import as a standalone goal, and adding true per-item selection materially reduces import risk without forcing a much larger UI/state rewrite in the same pass.
  - Assumption: mobile does not need a parallel update in this slice.
  - Why acceptable: this bundle import preview surface is desktop-specific Electron UI; there is no equivalent mobile bundle-import dialog in the current codebase that would drift from this change.
- Changes implemented:
  - Extended the main-process import contract in `apps/desktop/src/main/bundle-service.ts` so `ImportOptions` can carry `selectedItems`, with per-component selection-set checks that skip deselected bundle items and report them as skipped in the import result.
  - Extended the TIPC handlers in `apps/desktop/src/main/tipc.ts` so renderer callers can pass the new per-item selection payload through both `importBundle` and `importBundleFromDialog`.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` to track selected item IDs per component, initialize them from the previewed bundle contents, and send that selection state when importing.
  - Upgraded the import-plan UI so each listed item now has its own toggle, shows an `Excluded` outcome when deselected, updates selected conflict counts accordingly, and preserves the existing component-level toggles plus global conflict policy selector.
  - Added a new Vitest regression in `apps/desktop/src/main/bundle-service.test.ts` covering per-item import selection across all supported component types, and extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` with source-level assertions for the new dialog/TIPC/service wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted but blocked: `pnpm --filter @dotagents/desktop exec vitest run src/main/bundle-service.test.ts --testNamePattern 'respects per-item selection within enabled components'` ❌ (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` / `Command "vitest" not found` in this worktree)
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - If workspace dependencies are restored, run the targeted desktop Vitest coverage for `bundle-service.test.ts` and then the smallest relevant typecheck covering the updated TIPC/dialog surface.
  - Consider whether `#57` still needs per-conflict mixed decisions (for example, one conflicting item skipped while another is renamed) beyond the current global conflict strategy.
  - Revisit the restore-from-backup surface if it is not already complete enough to satisfy the remaining acceptance criteria under Settings → Capabilities.

- Next recommended issue work item: either keep pushing `#57` by validating the new cherry-pick backend path under restored desktop dependencies, or pivot back to a fresh issue such as `#25` / another local desktop reliability slice if a cleaner verification path is preferred.

##### Issue #25 — `.dotagents` docs/spec alignment after import-safety + inspector work

- Selection rationale:
  - Issue `#25` had not been directly advanced in the ledger yet, and its only issue comment explicitly called out a docs/spec follow-up after `#56` (inspect-before-install) and `#57` (import safety) landed.
  - This was a fresh, narrow, high-value slice: make the now-real bundle trust model discoverable without reopening backend import complexity.
- Investigation:
  - Re-read issue `#25` plus its planning comment and confirmed the requested next deliverable was to extend the `.dotagents` docs/spec with finalized UX and security defaults from `#56` and `#57`.
  - Inspected `README.md`, `apps/desktop/src/main/bundle-service.ts`, `apps/desktop/src/renderer/src/components/bundle-export-dialog.tsx`, and `apps/desktop/src/renderer/src/components/bundle-publish-dialog.tsx` to align the documentation with the current implementation rather than the earlier aspirational ZIP-based issue prose.
  - Confirmed the repo did not yet have a focused `.dotagents` workflow/spec document; the closest public-facing surface was a brief mention in `README.md` plus code comments in `bundle-service.ts`.
- Important assumptions:
  - Assumption: a repo-local current-state spec note plus README discoverability is the right first docs slice for `#25`, rather than trying to fully rewrite the umbrella issue body or build a larger docs site.
  - Why acceptable: the issue comment asked for docs/spec alignment after recent trust work, and this lands an immediately useful, reviewable artifact in the repo with the least scope.
  - Assumption: documenting the current JSON-based `.dotagents` artifact shape is preferable to restating the older ZIP-oriented proposal from the original issue text.
  - Why acceptable: the implementation in `bundle-service.ts` is the source of truth users and contributors need today, and the doc explicitly frames itself as a current-state workflow/spec note instead of a frozen final format promise.
- Changes implemented:
  - Added `DOTAGENTS_BUNDLES.md`, a focused current-state bundle workflow/spec note covering artifact shape, automatic pre-import backups, restore entry points, preview/conflict defaults, per-item cherry-pick import, Hub-oriented export defaults, and inspect-before-install trust posture.
  - Updated `README.md` with a new `.dotagents Bundles` key-concept row and a short `Portable .dotagents Bundles` section linking readers to the new doc.
- Verification run:
  - Completed: `git diff --check` ✅
  - Completed: dependency-free Node assertion script validating the README link plus 6 required workflow/spec headings/phrases across `README.md` and `DOTAGENTS_BUNDLES.md` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Keep the new doc in sync if the bundle format changes again (for example, artifact structure, restore metadata, or Hub install flow).
  - Decide whether the website, README, and issue body should later converge on a single canonical bundle-spec surface once the Hub workflow stabilizes further.
  - Continue Phase 2 work only when there is a similarly concrete local slice (for example, registry caching, install/update status, or Hub install provenance) rather than reopening the entire umbrella issue at once.

- Next recommended issue work item: either return to `#25` for a narrow Phase 2 Hub install/status slice, or pivot to another fresh issue only if it offers a tighter user-visible reliability/UX increment than the remaining bundle follow-ups.

##### Issue #25 — Hub install reliability: user-visible failure feedback for remote bundle downloads

- Selection rationale:
  - After the `.dotagents` docs/spec pass, issue `#25` still had a concrete Phase 2-adjacent reliability gap with direct user value: `dotagents://install?bundle=...` failures were only logged in the main process, so a broken Hub bundle URL or network error could look like a no-op install click.
  - This was a small, reviewable slice that improves trust in the one-click Hub install flow without reopening registry caching or broader marketplace work.
- Investigation:
  - Re-read issue `#25`, focusing on the Phase 2 acceptance direction around one-click install from Hub and install/update status.
  - Inspected `apps/desktop/src/main/index.ts`, `apps/desktop/src/main/hub-install.ts`, `apps/desktop/src/main/index.hub-install.test.ts`, and `apps/desktop/src/renderer/src/pages/settings-agents.tsx`.
  - Confirmed the current path is: deep link / open-url / argv → `queueHubBundleInstallFromUrl(...)` → `downloadHubBundleToTempFile(...)` → `/settings/agents?installBundle=...`.
  - Confirmed the failure path only logged `[hub-install] Failed to download Hub bundle` and returned `false`, with no renderer toast, no error dialog, and no user-facing explanation.
- Important assumptions:
  - Assumption: a native Electron error dialog is the safest first feedback surface for Hub download failures.
  - Why acceptable: this failure can happen before the renderer install dialog opens, so a main-process `dialog.showErrorBox(...)` is more reliable than depending on router state or an already-mounted toast system.
- Changes implemented:
  - Updated `apps/desktop/src/main/index.ts` so failed remote Hub bundle downloads now surface a `Hub Bundle Download Failed` native error dialog including the error message, source bundle URL, and a retry hint.
  - Extended `apps/desktop/src/main/index.hub-install.test.ts` with focused regression coverage for startup deep-link failures and runtime `open-url` failures, asserting the error dialog appears and the install handoff is not routed into `/settings/agents?installBundle=...`.
- Verification run:
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/main/index.hub-install.test.ts src/main/hub-install.test.ts`
  - Blocked: command failed with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` because `vitest` is not available in this worktree (`Command "vitest" not found`).
  - Action taken: kept the regression tests in-tree, avoided installing dependencies without explicit permission, and documented the exact blocked command here for the next iteration once the worktree test tooling baseline is restored.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Re-run the targeted Vitest files as soon as desktop test dependencies are restored in this worktree.
  - Consider whether Hub install should also surface a renderer-visible success/failure status after the import dialog completes, rather than relying only on the dialog flow plus native error fallback.
  - Continue Phase 2 only with similarly tight slices (for example, install provenance, cache freshness, or update-status affordances).

- Next recommended issue work item: once the desktop test runner is available, re-run the targeted Hub-install tests and commit this reliability slice; otherwise pivot only to another issue that can be verified in the current worktree without dependency restoration.

##### Issue #25 — Hub install provenance surfaced in the import dialog

- Selection rationale:
  - After the prior `#25` failure-feedback slice, the next concrete trust gap in the one-click Hub flow was provenance: once a remote bundle downloaded into a temp file, the existing import dialog no longer showed which Hub URL it came from.
  - This was a small, auditable UX improvement that fit the current worktree constraints because it could be verified with dependency-free source regression tests.
- Investigation:
  - Re-read issue `#25` and its planning comment to stay aligned with the umbrella goal of making bundle install/import flows transparent and auditable by default.
  - Inspected `apps/desktop/src/main/index.ts`, `apps/desktop/src/main/startup-routing.ts`, `apps/desktop/src/renderer/src/pages/settings-agents.tsx`, and `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx`.
  - Confirmed the main process preserved only the downloaded temp file path in the `/settings/agents?installBundle=...` handoff, so the renderer could no longer tell whether the import came from a local file or a specific Hub artifact URL.
- Important assumptions:
  - Assumption: surfacing the original remote bundle URL in the existing import dialog is a worthwhile first provenance slice even without a fuller install-history model.
  - Why acceptable: it restores the most important missing trust signal at the moment of import review, using the current flow users already see.
  - Assumption: query-string handoff of the original Hub artifact URL is acceptable for this slice.
  - Why acceptable: the URL is already public, it stays inside the existing main-window navigation contract, and it avoids inventing new persistence/state plumbing for a narrow UX improvement.
- Changes implemented:
  - Extended `apps/desktop/src/main/startup-routing.ts` so Hub install routes can carry both the downloaded bundle file path and the original `installBundleSource` URL.
  - Updated `apps/desktop/src/main/index.ts` to track `pendingHubBundleSourceUrl` alongside the temp file path, preserve it through downloaded deep-link handoff, and clear it when the handoff is consumed.
  - Updated `apps/desktop/src/renderer/src/pages/settings-agents.tsx` so the Hub import handoff reads and clears `installBundleSource` from the router search params, then passes it into the existing `BundleImportDialog`.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` with an optional provenance panel that renders a visible external source link when a bundle came from the Hub.
  - Updated the existing Vitest coverage in `apps/desktop/src/main/startup-routing.test.ts`, `apps/desktop/src/main/index.hub-install.test.ts`, and `apps/desktop/src/renderer/src/pages/settings-agents.install-handoff.test.tsx` to reflect the new source-aware handoff.
  - Added `apps/desktop/src/renderer/src/pages/settings-agents.hub-install-provenance.test.js`, a dependency-free regression test covering the source-aware route builder, main-process handoff state, settings-page query parsing, and dialog provenance rendering.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-agents.hub-install-provenance.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/main/startup-routing.test.ts src/main/index.hub-install.test.ts src/renderer/src/pages/settings-agents.install-handoff.test.tsx`
  - Blocked: desktop test tooling is still unavailable in this worktree; PNPM failed with `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` / `Command "vitest" not found`.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Re-run the targeted Vitest files once the desktop test runner is available in this worktree.
  - Consider surfacing renderer-visible post-install success/failure status after the imported Hub bundle completes, not just pre-import provenance.
  - If Hub install provenance becomes more important later, consider carrying it into a longer-lived install history or import metadata model instead of only the transient route handoff.

- Next recommended issue work item: stay on `#25` for a similarly small install-status/provenance follow-up once the desktop test runner is available, or only pivot to another issue if it offers an equally concrete, locally verifiable UX/reliability increment.

##### Issue #25 — Hub install completion copy now stays source-aware after the dialog closes

- Selection rationale:
  - The most obvious remaining `#25` follow-up after the provenance handoff slice was renderer-visible completion status: the Hub flow opened an `Install Hub Bundle` dialog, but the primary action still used generic `Import` wording and the success/error toasts dropped the Hub/source context once the dialog closed.
  - This was a tiny, reviewable UX/trust slice that could be verified cheaply in the current dependency-light worktree.
- Investigation:
  - Re-read the latest `#25` ledger entries and focused specifically on the remaining note to surface renderer-visible post-install status after a Hub bundle import completes.
  - Re-inspected `apps/desktop/src/renderer/src/pages/settings-agents.tsx` and confirmed the Hub handoff only customized the dialog title/description, not the button label or success verb.
  - Re-inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the success/error toasts still emitted generic import copy with backup metadata only, even when `sourceUrl` provenance was available.
- Important assumptions:
  - Assumption: source-aware completion copy in the existing dialog/toast flow is the smallest acceptable interpretation of “renderer-visible post-install status.”
  - Why acceptable: users immediately see the status after the import completes, and the change stays inside the already-established Hub install review surface instead of inventing a new notification/state system.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/pages/settings-agents.tsx` so source-aware Hub handoffs pass `confirmLabel="Install"` and `successVerb="installed"` into `BundleImportDialog`, keeping the action wording consistent with the Hub install flow.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` with a small `buildSourceOutcomeMessage(...)` helper so success, partial-failure, and thrown-error toasts append the preserved source label/URL whenever a bundle came from the Hub.
  - Extended `apps/desktop/src/renderer/src/pages/settings-agents.install-handoff.test.tsx` and the dependency-free `apps/desktop/src/renderer/src/pages/settings-agents.hub-install-provenance.test.js` regression coverage to lock in the new install-specific labels and source-aware outcome messaging contract.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-agents.hub-install-provenance.test.js` ✅
  - Completed: `git diff --check` ✅
  - Not re-attempted: the desktop Vitest runner is still unavailable in this worktree (`vitest` missing), and this slice only extended the already-covered source-level contract.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Re-run the targeted Hub-install Vitest files once the desktop test runner is available in this worktree.
  - If user research shows the toast-level status is still too transient, consider a longer-lived install history/status surface for Hub bundle installs.
  - Continue Phase 2 only with similarly narrow, concrete slices (for example, update-status affordances) rather than reopening registry caching or broader Hub marketplace work.

- Next recommended issue work item: treat `#25` as meaningfully advanced for now and pivot next to a fresh issue only if it offers a similarly tight, locally verifiable bug/UX slice.

##### Issue #54 — ChatGPT subscription provider support triaged as externally blocked for now

- Selection rationale:
  - After the recent `#25`, `#53`, `#55`, `#57`, and `#58` slices, `#54` was the only clearly fresh open issue in the repo that had not already been investigated in this ledger.
  - I evaluated it first to avoid repeating recently-worked issues without a justified follow-up.
- Investigation:
  - Re-read issue `#54` and checked the current desktop provider/auth implementation.
  - Inspected `apps/desktop/src/renderer/src/pages/settings-providers.tsx` and `apps/desktop/src/renderer/src/components/model-selector.tsx`.
  - Confirmed the current provider UX is explicitly API-key/base-URL/model driven for the supported providers; there is no model-provider pathway for a subscription/OAuth-only provider.
  - Inspected `apps/desktop/src/main/oauth-client.ts`, `apps/desktop/src/main/mcp-service.ts`, and `apps/desktop/src/preload/index.ts`.
  - Confirmed the existing OAuth client is wired for MCP/external service auth flows, not for chat/model providers.
  - Checked current public OpenAI help/docs and found the documented contract is still that ChatGPT Plus/Pro subscriptions do **not** include API credits; I did not find a public developer-facing subscription OAuth flow I could wire up safely from this repo.
- Important assumptions:
  - Assumption: we should only implement provider auth against public/supported APIs or an explicit product decision, not by reverse-engineering ChatGPT web session auth.
  - Why acceptable: this repo is a desktop product and issue work should favor reliable, supportable integrations over brittle or policy-risky hacks.
- Changes implemented:
  - None in this iteration.
- Verification run:
  - Code inspection only; no code changes were made.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #54:
  - Confirm whether the desired outcome is an officially supported OAuth/provider contract from OpenAI or a different product direction entirely.
  - If an official contract becomes available, the likely first implementation slice is provider-metadata/auth-mode plumbing in settings plus a non-API-key provider path.

- Next recommended issue work item: leave `#54` blocked until there is a public provider/auth contract, then resume with a narrowly scoped provider-plumbing slice.

##### Issue #58 — Inline summary messages are now visibly distinct in the active transcript

- Selection rationale:
  - After blocking on `#54`, I pivoted to the best documented follow-up slice on `#58`: the issue explicitly asks for summarized vs active messages to be visually differentiated, and prior ledger work had already landed storage, full-history, and boundary affordances.
  - This was a narrow, locally verifiable renderer change with direct user value.
- Investigation:
  - Re-read issue `#58` and its scope comment emphasizing preserved raw history, `Show Full History`, and clear summarized-vs-active UI affordances.
  - Inspected `apps/desktop/src/renderer/src/components/agent-progress.tsx`, `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js`, `apps/desktop/src/renderer/src/pages/sessions.tsx`, and `apps/desktop/src/shared/types.ts`.
  - Confirmed the data model already carries `isSummary` / `summarizedMessageCount`, and the desktop transcript already had full-history banners/dividers, but the compact inline message renderer still treated summary blocks like ordinary assistant messages.
  - Checked `apps/mobile/src/screens/ChatScreen.tsx` and confirmed mobile currently strips summary metadata when mapping saved session messages and does not yet have the same preserved-history viewer contract, so a mobile mirror would be a separate deeper slice.
- Important assumptions:
  - Assumption: adding a subtle inline badge/count to summary messages in the desktop transcript is the smallest useful interpretation of the issue’s “visually differentiate summarized vs active” acceptance direction.
  - Why acceptable: users can now identify summary blocks even when they stay in the active-window view, without waiting for a larger transcript redesign.
  - Assumption: desktop-only is acceptable for this pass.
  - Why acceptable: the preserved-history viewer and compaction provenance work for `#58` currently lives in the desktop renderer; mobile needs separate summary-metadata plumbing before the same badge can be applied there.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/agent-progress.tsx` so compact transcript messages accept `isSummary` / `summarizedMessageCount`, apply a subtle summary-specific card style, and render a `Context summary` badge with the represented earlier-message count.
  - Extended `apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` with dependency-free source regression coverage for the new inline summary affordance.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/agent-progress.full-history.test.js` ✅
  - Completed: `git diff --check` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Mirror summary metadata through the mobile session/message mapping layer before attempting the same inline distinction in `apps/mobile`.
  - Consider whether summary blocks should suppress per-message TTS controls if that proves noisy in long transcripts.
  - If more provenance is still needed, consider a complementary “active window” badge for non-summary messages near the full-history boundary.

- Next recommended issue work item: treat `#58` as meaningfully advanced again; next iteration should either take another concrete/mobile follow-up on `#58` or move to a different locally verifiable issue once one is available.

##### Issue #58 — Mobile now preserves and labels context summary messages

- Selection rationale:
  - The previous `#58` ledger entry explicitly called out the next missing slice: mobile was still stripping `isSummary` / `summarizedMessageCount`, so summarized transcript blocks could not be distinguished there.
  - This was a small, user-visible trust improvement with a clear local implementation path across shared types, mobile sync/persistence, and the mobile transcript UI.
- Investigation:
  - Re-read issue `#58` and the existing ledger history for the desktop/full-history work already landed.
  - Inspected `apps/mobile/src/screens/ChatScreen.tsx`, `apps/mobile/src/lib/openaiClient.ts`, `apps/mobile/src/lib/syncService.ts`, `apps/mobile/src/store/sessions.ts`, `packages/shared/src/types.ts`, `packages/shared/src/session.ts`, and `packages/shared/src/api-types.ts`.
  - Confirmed mobile `ChatMessage` and shared server/session message contracts did not expose summary metadata consistently.
  - Confirmed the mobile chat screen recreated message objects in several places (saved session load, lazy server fetch, progress/final history hydration, recovery) and dropped summary metadata in each of those mappings.
  - Confirmed the mobile transcript had no summary-specific inline affordance, so even preserved summary messages would still look like ordinary assistant messages.
- Important assumptions:
  - Assumption: the smallest acceptable mobile `#58` follow-up is metadata preservation plus a subtle inline `Context summary` badge, not the full preserved-history viewer contract.
  - Why acceptable: it directly advances the issue’s trust/auditability goals and matches the already-landed desktop distinction pattern without trying to solve the larger mobile history-browser surface in one pass.
  - Assumption: a shared helper for summary metadata normalization/label text is acceptable even though only mobile consumes the new helper today.
  - Why acceptable: the helper keeps the contract consistent across sync, persistence, and rendering while staying tiny and dependency-free inside `packages/shared`.
- Changes implemented:
  - Extended the shared conversation/session/server message contracts in `packages/shared/src/types.ts`, `packages/shared/src/session.ts`, and `packages/shared/src/api-types.ts` so `isSummary` / `summarizedMessageCount` are first-class optional fields across storage and sync boundaries.
  - Added small shared helpers in `packages/shared/src/chat-utils.ts` to normalize summary metadata and produce consistent user-facing summary count copy.
  - Updated `apps/mobile/src/lib/openaiClient.ts`, `apps/mobile/src/lib/syncService.ts`, `apps/mobile/src/store/sessions.ts`, and all relevant message-mapping paths in `apps/mobile/src/screens/ChatScreen.tsx` so mobile preserves summary metadata from server fetches, session persistence, recovery, and conversation-history hydration.
  - Added a subtle mobile transcript treatment in `apps/mobile/src/screens/ChatScreen.tsx`: summary messages now get a `Context summary` badge, count copy, and a distinct accent/background.
  - Added focused regression coverage in `apps/mobile/src/lib/syncService.summary-metadata.test.ts` for summary metadata normalization, summary label copy, and sync conversion preservation.
- Verification run:
  - Completed: `git diff --check` ✅
  - Completed: `tsc -p packages/shared/tsconfig.json --noEmit` ✅
  - Attempted but blocked: `pnpm build:shared` ❌ (`tsup` missing because this worktree has no installed workspace dependencies / `node_modules`)
  - Attempted but environment-blocked: `tsc -p apps/mobile/tsconfig.json --noEmit` ❌ (Expo/mobile dependencies and `expo/tsconfig.base` unavailable in this worktree; failures were environment-level, not specific to this slice)
  - Not runnable in this worktree: the new mobile Vitest regression file also depends on missing workspace/mobile dependencies.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Re-run `pnpm build:shared` plus the targeted mobile Vitest file once workspace dependencies are installed in this worktree.
  - Consider mirroring the desktop preserved-history/full-history browsing affordance into mobile after the metadata plumbing is now in place.
  - If summary messages prove noisy on mobile, consider whether TTS/other per-message controls should be suppressed or restyled for summary blocks.

- Next recommended issue work item: treat `#58` as advanced again; if the next worktree has dependencies installed, a mobile full-history browsing slice is now more feasible, otherwise pivot to another narrow issue with dependency-light verification.

##### Issue #57 — Bundle import cherry-pick UX: section bulk selection + empty-import guard

- Selection rationale:
  - `#57` remains open, and the current import dialog already supports per-item cherry-pick toggles, but using them on larger bundles is still unnecessarily tedious and can lead to a confusing no-op import when every item is deselected.
  - This was a tight, user-facing follow-up with clear local value: make the existing cherry-pick plan faster to use and prevent accidental empty imports.
- Investigation:
  - Re-read the latest `#57` ledger entries to avoid repeating the already-landed conflict preview, full import plan, and per-item toggle work.
  - Re-inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed each import-plan row already had its own toggle, but there was no section-level `Select all` / `Clear all` affordance even though items are grouped by component.
  - Confirmed the dialog already computes `selectedPlanItemCount`, but the primary import button still ignored that count and remained enabled even when every item had been excluded.
- Important assumptions:
  - Assumption: section-level bulk selection and a zero-selected import guard are valid `#57` follow-ups even without introducing more advanced mixed per-conflict actions.
  - Why acceptable: they directly improve the practical cherry-pick workflow users already have, stay entirely within the existing renderer contract, and reduce accidental confusing imports without broadening scope.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the bundle import dialog is still a desktop-only Electron workflow.
- Changes implemented:
  - Refactored `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` to reuse a shared `getBundleImportItems(...)` helper for import-plan item derivation and bulk section selection.
  - Added per-section `Select all` / `Clear all` controls to each import-plan group so users can quickly include or exclude all items within a component type.
  - Added an empty-selection safeguard so the dialog now shows `Select at least one item to import.` and disables the primary action when the current plan has zero selected items.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` with dependency-free source assertions covering the new bulk-selection controls and zero-selected import guard.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `git diff --check` ✅
  - Re-checked: `pnpm --filter @dotagents/desktop exec vitest --version` ❌ still blocked in this worktree with `Command "vitest" not found`, so dependency-backed desktop Vitest coverage remains unavailable.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Re-run the targeted desktop Vitest coverage (`bundle-service.test.ts` and related dialog tests) once the workspace dependency baseline is restored.
  - If users still need more control inside one import, consider true per-conflict mixed actions rather than the current import-wide skip/overwrite/rename policy.
  - If the import plan grows further, consider adding collapse/expand or search inside large component sections instead of overloading the dialog with more always-visible rows.

- Next recommended issue work item: refresh the open issue list again and prefer either a verification/unblock step once desktop Vitest is available or another equally narrow, dependency-light UX/reliability slice from the remaining open issues.

##### Issue #53 — Slash-command discoverability hint added to follow-up composers

- Selection rationale:
  - After refreshing the open issues and re-checking the recent ledger, `#53` still had a small, user-visible discoverability gap with a clean local path: the main desktop composer already tells users to type `/` for skills, but the overlay and tile follow-up inputs support the same slash-command flow without any comparable hint.
  - This was a narrow desktop UX slice that improves feature discoverability without reopening invocation semantics or broader mobile parity work.
- Investigation:
  - Re-read issue `#53` and confirmed there were still no issue comments adding extra constraints beyond slash-triggered discovery, inline invocation, optional arguments, and visible active-skill indication.
  - Inspected `apps/desktop/src/renderer/src/components/text-input-panel.tsx`, `overlay-follow-up-input.tsx`, and `tile-follow-up-input.tsx`.
  - Confirmed the main composer already renders explicit `/` guidance (`Type your message • ... • Type "/" for skills`), while the two follow-up inputs only exposed generic placeholders such as `Continue conversation...` and `Queue message...` despite already shipping slash suggestions and inline expansion.
  - Checked `apps/mobile/src/screens/ChatScreen.tsx` because the renderer `AGENTS.md` requires parity review, and confirmed mobile still does not expose the desktop slash-command interaction, so mirroring the hint there would imply a broader mobile slash-command feature decision rather than this small desktop discoverability pass.
- Important assumptions:
  - Assumption: adding concise `/ for skills` placeholder hints to the overlay and tile follow-up inputs is a valid `#53` slice even without changing slash-command behavior.
  - Why acceptable: it closes a real UX mismatch between desktop composer surfaces and helps users discover a capability that already exists in those inputs.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: mobile currently lacks the slash-command composer contract itself, so adding hint text there would over-promise unsupported behavior.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx` so the idle and queue-enabled placeholders now mention `(/ for skills)`.
  - Updated `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx` with the same `(/ for skills)` placeholder hint so both continuation surfaces match the main composer’s discoverability level more closely.
  - Extended `apps/desktop/src/renderer/src/components/follow-up-input.slash-command.test.js` with dependency-free source assertions locking in the new follow-up placeholder guidance.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/follow-up-input.slash-command.test.js` ✅
  - Completed: `git diff --check` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #53:
  - Decide whether mobile should gain a platform-appropriate slash-command picker or remain explicitly desktop-only for now.
  - If more discoverability is still needed on desktop, consider a compact inline helper row near the follow-up inputs instead of relying only on placeholders.
  - Re-run the broader desktop slash-command Vitest coverage once the worktree has the missing desktop test runner available.

- Next recommended issue work item: treat `#53` as advanced again; next iteration should either make a deliberate mobile decision for slash commands or pivot to another equally concrete, dependency-light UX/reliability slice from the remaining open issues.

##### Issue #25 — Export dialog now warns when selected memories appear to contain secrets

- Selection rationale:
  - After reviewing the latest ledger and open issues, `#25` remained the best actionable enhancement slice that had clear user value without reopening larger bundle-format or install-flow work.
  - The issue acceptance criteria explicitly calls for warning users when exported memories appear to contain secret-like content, and that trust/safety gap was still unaddressed in the export flow.
- Investigation:
  - Re-read the current `#25` scope and nearby ledger entries to avoid redoing recent hub install/import work.
  - Inspected `apps/desktop/src/main/bundle-service.ts`, `apps/desktop/src/renderer/src/components/bundle-selection.tsx`, and `apps/desktop/src/renderer/src/components/bundle-export-dialog.tsx`.
  - Confirmed the export dialog already warns generically that included memories are written into the bundle file, but it did not flag when a selected memory looked like it contained a token, API key, JWT, or other secret-like value.
  - Confirmed there was no existing secret-pattern helper to reuse, so the narrowest safe path was to compute boolean warning metadata in the main-process exportable-items preview and surface that metadata in the renderer without sending raw secret content around.
- Important assumptions:
  - Assumption: heuristic secret detection for export warnings is acceptable even if it is not perfect.
  - Why acceptable: the requirement is a warning, not blocking or automatic redaction, so a high-signal heuristic materially improves safety while keeping the UX lightweight.
  - Assumption: warning metadata should stay coarse (`containsPotentialSecret` plus flagged fields) instead of sending matched secret substrings to the renderer.
  - Why acceptable: it preserves the safety value of the warning while minimizing additional exposure of sensitive memory text.
  - Assumption: source-level Node tests are an acceptable verification supplement in this worktree because the normal desktop Vitest path still lacks the local dependency baseline.
  - Why acceptable: the new tests still lock in the contract and UI wiring, and `tsc --noEmit` passed for the touched desktop code.
- Changes implemented:
  - Extended `apps/desktop/src/main/bundle-service.ts` exportable memory summaries with `containsPotentialSecret` and `secretWarningFields`, backed by a focused set of secret-like string heuristics for API keys, GitHub tokens, Google API keys, Slack tokens, JWTs, and generic keyword-plus-token patterns.
  - Updated `apps/desktop/src/renderer/src/components/bundle-selection.tsx` with a `getBundleMemorySecretWarnings(...)` helper so the renderer can derive warnings only for memories that remain selected for export.
  - Updated `apps/desktop/src/renderer/src/components/bundle-export-dialog.tsx` to render a specific warning panel listing selected memories whose content/key findings/user notes look secret-like, with guidance that bundle files include memory text as-is.
  - Added targeted tests in `apps/desktop/src/main/bundle-service.test.ts` and `apps/desktop/src/renderer/src/components/bundle-selection.test.ts`, plus dependency-light source-contract coverage in `apps/desktop/src/main/bundle-service.memory-secret-warning.test.js` and `apps/desktop/src/renderer/src/components/bundle-export-dialog.warning.test.js` for this worktree.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/bundle-service.memory-secret-warning.test.js apps/desktop/src/renderer/src/components/bundle-export-dialog.warning.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
  - Attempted but blocked by missing workspace dependencies: `pnpm --filter @dotagents/desktop test -- --run src/main/bundle-service.test.ts src/renderer/src/components/bundle-selection.test.ts` → `tsup: command not found` during `build:shared` pretest because this worktree does not currently have the full desktop/node_modules baseline.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Re-run the targeted desktop Vitest tests once the worktree has the normal desktop dependency/tooling baseline restored.
  - Consider whether bundles should eventually support stronger structured secret review for memories (for example, preview-side opt-out affordances or richer detection explanations) without turning the export flow into a blocker.
  - Revisit the separate `#25` acceptance items around stripped MCP secrets and import-time reconfiguration only if the bundle format is expanded to carry placeholder metadata instead of today’s coarser safe summaries.

- Next recommended issue work item: prefer another concrete bug-sized UX/reliability slice from the remaining open issues, with `#55` still worth revisiting only if a fresh directly reproducible tile-layout defect is confirmed first.

##### Issue #25 — Bundle memory imports now stay additive-only and skip same-content duplicates

- Selection rationale:
  - After the export warning slice, `#25` still had another concrete acceptance-aligned gap with strong reliability value: imported memories were still only deconflicted by `id`, even though the issue calls for additive-only memory handling and duplicate detection by content hash.
  - This was a good follow-up because it stayed inside the existing bundle import flow, avoided package changes, and materially reduced accidental duplicate memory installs.
- Investigation:
  - Re-read the current bundle import path in `apps/desktop/src/main/bundle-service.ts` and confirmed memories still honored the global conflict strategy (`skip` / `overwrite` / `rename`) instead of staying additive-only.
  - Confirmed `previewBundleWithConflicts(...)` only flagged memory conflicts when the incoming memory reused an existing `id`, so same-content duplicates with new IDs were invisible during preview.
  - Reviewed `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the import plan text would currently imply overwrite/rename behavior for memories, which would become misleading once additive-only handling was enforced.
- Important assumptions:
  - Assumption: memory duplicate detection should fingerprint normalized memory `content` only, not the full record.
  - Why acceptable: the issue explicitly calls for duplicate detection by content hash, and content is the core semantic payload users would not want duplicated under a new ID.
  - Assumption: additive-only memory imports should skip duplicates rather than renaming them.
  - Why acceptable: that matches the issue acceptance language (“memories additive only”) and avoids surprising silent proliferation of nearly identical memories.
  - Assumption: previewing same-content duplicates as skip-only conflicts is worth the extra narrow UI update.
  - Why acceptable: it keeps the import plan honest and avoids a preview/import mismatch for selected memory items.
- Changes implemented:
  - Added memory content fingerprinting to `apps/desktop/src/main/bundle-service.ts` using normalized content plus a SHA-256 hash.
  - Updated `previewBundleWithConflicts(...)` so memory conflicts now surface both reused-`id` duplicates and same-content duplicates, with a skip-only default strategy.
  - Updated `importBundle(...)` so memories are now truly additive-only: if an imported memory would collide by `id` or by content fingerprint, it is skipped rather than overwritten or renamed. Duplicate-content memories later in the same bundle are also skipped.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` so memory conflicts render as skip-only in the import plan, the plan copy explicitly says memories stay additive-only, and the summary includes a separate memory-specific conflict outcome line.
  - Added targeted regression coverage in `apps/desktop/src/main/bundle-service.test.ts` for both preview-side memory conflict detection and import-time additive-only duplicate handling, and extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to lock in the renderer/main-process contract.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js apps/desktop/src/renderer/src/components/bundle-export-dialog.warning.test.js apps/desktop/src/main/bundle-service.memory-secret-warning.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
  - Added but not runnable in this worktree without the missing desktop dependency baseline: the new `bundle-service.test.ts` runtime tests for memory duplicate preview/import behavior.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Re-run the new `bundle-service.test.ts` cases once the worktree has the normal desktop/Vitest dependency baseline available again.
  - Consider whether memory duplicate preview UX should eventually explain *why* a memory conflicts (`id` vs same content) without making the import plan noisy.
  - If bundle import later supports richer conflict reasons, thread the memory duplicate reason through the preview payload instead of keeping today’s generic skip-only conflict entry.

- Next recommended issue work item: pivot away from `#25` for the next pass unless another clearly self-contained acceptance gap appears; `#55` remains the best bug candidate only if a fresh direct repro is confirmed first, otherwise revisit the remaining open UX issues for a similarly small verified slice.
