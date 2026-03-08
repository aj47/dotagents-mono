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

##### Issue #25 — Bundle imports now preserve redacted MCP placeholders and prompt reconfiguration

- Selection rationale:
  - The latest ledger explicitly deferred the remaining `#25` MCP-secret acceptance gap until the bundle format carried placeholder metadata instead of the previous coarse MCP summaries.
  - After re-checking the current code, that was now the best small, high-trust follow-up: exports were already stripping secrets recursively, but imports still discarded most of the stripped MCP config, so users lost the exact fields that needed reconfiguration.
- Investigation:
  - Re-read `#25` plus its comment history and confirmed the umbrella issue still covers bundle trust/safety work even after the recent `#56` / `#57` slices.
  - Inspected `apps/desktop/src/main/bundle-service.ts` and confirmed `loadMCPServersForBundle(...)` already computed a recursively stripped MCP config, but then only kept `name`, `command`, `args`, `transport`, and `enabled` in `BundleMCPServer`.
  - Confirmed `importBundle(...)` rebuilt imported MCP servers only from those summary fields, which meant imported servers lost redacted `env`, `headers`, `oauth`, `url`, and timeout context that users would need in order to finish setup safely.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the dialog had no way to warn when a selected MCP server would import with `<CONFIGURE_YOUR_KEY>` placeholders and require follow-up in Settings.
- Important assumptions:
  - Assumption: preserving redacted MCP config structure in the bundle is acceptable as long as secret values remain replaced with placeholders.
  - Why acceptable: it materially improves import transparency and reconfiguration without exposing the original credentials.
  - Assumption: continuing to redact only secret-looking keys (rather than blanking every `env` / `headers` value wholesale) is acceptable for this slice.
  - Why acceptable: it stays consistent with the existing secret-stripping heuristic already used by bundle export, so this change improves round-tripping without broadening what gets exposed.
  - Assumption: source-level Node tests are the practical verification path in this worktree right now.
  - Why acceptable: the worktree still lacks the desktop dependency baseline needed for Vitest / TypeScript checks, but the added source-contract tests still lock in the new bundle/import-dialog wiring and the runtime-focused Vitest coverage is in place for later re-run.
- Changes implemented:
  - Expanded `BundleMCPServer` in `apps/desktop/src/main/bundle-service.ts` to carry the full redacted MCP `config` plus derived `redactedSecretFields` metadata.
  - Added helper logic to derive redacted secret field names from `<CONFIGURE_YOUR_KEY>` placeholders, normalize that metadata during bundle preview, and rebuild imported MCP server configs from the preserved redacted structure.
  - Updated bundle export so MCP servers now keep safe placeholder-bearing config data instead of dropping the fields entirely.
  - Updated the desktop bundle import dialog to flag selected MCP servers that will import with placeholders, list the affected servers/field groups, and show a post-import warning pointing users to Settings → Capabilities for reconfiguration.
  - Added runtime-oriented Vitest coverage in `apps/desktop/src/main/bundle-service.test.ts` for both export-side redacted MCP config preservation and import-side placeholder round-tripping.
  - Added dependency-light source tests in `apps/desktop/src/main/bundle-service.mcp-placeholder.test.js` and `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to lock in the new service/dialog contract in this dependency-light worktree.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/bundle-service.mcp-placeholder.test.js apps/desktop/src/main/bundle-service.memory-secret-warning.test.js apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted but blocked by missing workspace dependencies: `pnpm --filter @dotagents/desktop exec vitest run src/main/bundle-service.test.ts src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` → `Command "vitest" not found`.
  - Attempted but blocked by missing workspace dependencies: `pnpm --filter @dotagents/desktop run typecheck` → missing `electron-vite/node`, `vitest/globals`, and `@electron-toolkit/tsconfig` because this worktree does not currently have the desktop `node_modules` baseline.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Re-run the new `bundle-service.test.ts` cases and desktop typecheck once the worktree has the normal desktop dependency/tooling baseline restored.
  - Consider whether the import dialog should eventually offer a one-click jump directly into the MCP settings surface after import for servers that still contain placeholders.
  - If bundle preview payloads later grow richer item metadata, consider threading explicit per-field reconfiguration reasons through the preview/import result instead of keeping today’s light `redactedSecretFields` summary.

- Next recommended issue work item: pivot to another open issue for the next loop; `#54` still looks too speculative for a code-first slice, so prefer a fresh direct repro for `#55` or a narrow follow-up on `#57` / `#58` with similarly local verification.

##### Issue #57 — Per-conflict mixed import actions now work inside the bundle import plan

- Selection rationale:
  - `#57` remained open even after the recent preview/cherry-pick/backups work because the dialog still forced one global conflict strategy across all conflicting non-memory items.
  - That gap was concrete, locally implementable, and high-value: mixed imports are common when a user wants to overwrite one known-good item but rename or skip others in the same bundle.
- Investigation:
  - Re-read the current `#57` state in the ledger and verified the remaining acceptance gap was still the lack of per-conflict mixed choices.
  - Inspected `apps/desktop/src/main/bundle-service.ts` and confirmed `ImportOptions` only accepted one `conflictStrategy`, with each import loop applying that same choice to every conflicting agent profile, MCP server, skill, and repeat task.
  - Inspected `apps/desktop/src/main/tipc.ts` and `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx`; the dialog computed the import plan from a single global strategy and rendered no per-row override control.
- Important assumptions:
  - Assumption: keeping the existing global conflict strategy as the default while adding optional per-row overrides is the least disruptive path.
  - Why acceptable: it preserves current behavior for simple imports while unlocking the missing mixed-action workflow only when the user needs it.
  - Assumption: memories should stay additive-only and skip-only even after adding mixed conflict controls elsewhere.
  - Why acceptable: that matches the existing additive memory import contract and avoids regressing the dedupe/safety behavior already shipped.
- Changes implemented:
  - Extended `ImportOptions` / bundle-service conflict handling with `conflictStrategyOverrides`, keyed by component type and item ID/name, plus a small resolver helper that falls back to the global default.
  - Updated the agent profile, MCP server, skill, and repeat-task import loops so conflicting items can now resolve to different actions within the same import instead of sharing one import-wide choice.
  - Threaded the new override payload through both bundle import TIPC procedures.
  - Updated the bundle import dialog to maintain per-item override state, render a `Conflict action` selector on each selected conflicting non-memory row, and summarize the expected outcomes from the actual row-level plan instead of from the global default alone.
  - Added a deferred Vitest regression case in `apps/desktop/src/main/bundle-service.test.ts` covering a mixed import where agent profiles/tasks overwrite while skills/MCP servers rename under the same global default.
  - Added dependency-light source-contract coverage in `apps/desktop/src/main/bundle-service.conflict-overrides.test.js` and extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` so the new service/TIPC/dialog wiring is locked in for this worktree.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/bundle-service.conflict-overrides.test.js apps/desktop/src/main/bundle-service.mcp-placeholder.test.js apps/desktop/src/main/bundle-service.memory-secret-warning.test.js apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `git diff --check` ✅
  - Deferred until the desktop dependency baseline is restored in this worktree: the new `bundle-service.test.ts` mixed-conflict case should be re-run under Vitest together with desktop typecheck.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Re-run the new runtime regression case and desktop typecheck once the worktree has its normal dependency/tooling baseline.
  - Consider whether the dialog should eventually expose an explicit `Use default` option per row if users want to revert an override after changing the global default multiple times in the same session.
  - Consider persisting row-level conflict overrides across dialog reopen/refresh events only if user testing shows that matters; for now they intentionally reset with a new preview to keep the state model simple.

- Next recommended issue work item: look next at `#58` for another small history/UX slice or confirm a direct repro for `#55`; `#54` still appears too under-specified for a safe code-first implementation pass.

##### Issue #25 — Bundle import warnings now deep-link straight to MCP server reconfiguration

- Selection rationale:
  - The latest `#25` ledger entry explicitly called out a still-open follow-up: after importing bundles with redacted MCP placeholders, users were warned to reconfigure servers but had no one-click jump into the right settings surface.
  - This was a small, high-trust UX slice with direct user value and a clean local implementation path inside the existing import dialog + settings routing.
- Investigation:
  - Re-read the latest `#25` ledger notes to avoid redoing earlier bundle safety work and confirmed the remaining gap was post-import reconfiguration affordance, not bundle parsing or secret stripping.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the dialog already detects imported MCP servers carrying `redactedSecretFields`, but the success path only showed a warning toast telling users to manually open `Settings → Capabilities`.
  - Inspected `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed the Capabilities page had local tab state only, so there was no stable deep-link path for opening the `MCP Servers` tab from another workflow.
- Important assumptions:
  - Assumption: using a lightweight `?tab=mcp-servers` query-param contract for the Capabilities page is preferable to introducing new shared navigation state.
  - Why acceptable: the repo already uses search-param handoff patterns in nearby settings flows, and this keeps the fix narrow, explicit, and reversible.
  - Assumption: a toast action is an acceptable post-import affordance for this workflow.
  - Why acceptable: it preserves the existing success flow while making the next required recovery step one click away instead of forcing users to hunt through settings manually.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` to support `?tab=` deep links, initialize from that query param, and react to later query-param changes so same-route navigation can switch tabs after mount.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` to use `useNavigate()` and attach an `Open MCP Servers` action to the post-import warning toast when imported MCP servers still contain `<CONFIGURE_YOUR_KEY>` placeholders.
  - Extended the existing dependency-light source-contract tests in `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` and `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` to lock in the new navigation/toast behavior and the Capabilities tab deep-link contract.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Re-run the relevant desktop/Vitest coverage and typecheck once the worktree has its normal dependency baseline restored.
  - Consider whether the pre-import MCP placeholder warning card should also expose the same direct settings jump, not just the post-import toast action.
  - If bundle install/import trust UX grows further, consider preserving a lightweight history of recent import warnings so post-import remediation is not toast-only.

- Next recommended issue work item: either return to `#58` for another small history provenance/reliability slice or confirm a fresh direct repro for `#55`; keep avoiding `#54` until there is stronger concrete evidence for a safe local implementation path.

##### Issue #25 — Bundle import preflight warning now deep-links to MCP server settings

- Selection rationale:
  - `issue-work.md` already documented a precise, still-open `#25` follow-up: the bundle import dialog warned about MCP placeholder reconfiguration before import, but only the post-import toast exposed a one-click remediation path.
  - This was a small, high-trust UX slice with immediate user value and a fully local implementation path in the desktop renderer.
- Investigation:
  - Re-read open issue `#25` plus its planning comment to confirm bundle trust/transparency work is still in scope under the umbrella issue.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the post-import `toast.warning(...)` already offered `Open MCP Servers`, while the pre-import `Credential reconfiguration required` warning card only showed explanatory text.
  - Re-checked `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed the `?tab=mcp-servers` deep-link contract already exists, so the dialog could reuse that route instead of inventing new navigation state.
- Important assumptions:
  - Assumption: reusing the same `Settings → Capabilities?tab=mcp-servers` deep link in the pre-import warning is preferable to a new inline credential editor inside the import dialog.
  - Why acceptable: it keeps the change narrow, matches the already-shipped post-import flow, and gives users a consistent recovery destination without duplicating MCP editing UI.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the `.dotagents` bundle import dialog and MCP server settings route are desktop renderer workflows, with no equivalent mobile import/settings surface in this repo today.
- Changes implemented:
  - Added a shared `MCP_SERVERS_SETTINGS_ROUTE` constant in `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and reused it for the existing post-import warning toast.
  - Added an `openMcpServersSettings` handler so both pre-import and post-import MCP placeholder warnings use the same deep-link behavior.
  - Added an `Open MCP Servers` button with the existing external-link icon to the pre-import `Credential reconfiguration required` warning card.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to assert the shared route constant, the shared handler, and the new warning-card action wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Consider whether bundles with MCP placeholders should keep a post-import remediation reminder somewhere more persistent than toast history alone.
  - If the import dialog later grows richer trust UX, consider exposing field-level placeholder details or direct targeting of specific MCP server rows after navigation.
  - Re-run the fuller desktop Vitest coverage for bundle import flows if/when this worktree regains that test entrypoint.

- Next recommended issue work item: pivot back to `#58` for another small history provenance/reliability slice, or revisit `#55` only after a fresh direct repro confirms the remaining tile-layout bug surface.

##### Issue #55 — Collapsed session tiles no longer keep their old grid-column width

- Selection rationale:
  - `#55` remains the clearest open bug in the current repo issue set, and the ledger explicitly said to revisit it only with a fresh direct repro.
  - A new source-level repro was available in the desktop tile wrapper itself: collapsed tiles still kept their previous measured width, so they could continue occupying a half-width grid column even after the earlier ordering fixes.
- Investigation:
  - Re-read issue `#55` and the prior ledger entries to avoid redoing the already-landed maximize/name fixes and the earlier collapsed-ordering slices.
  - Inspected `apps/desktop/src/renderer/src/components/session-grid.tsx` and confirmed `SessionTileWrapper` only changed `height` when `isCollapsed`, while leaving `style={{ width, ... }}` untouched.
  - Re-checked the nearby layout behavior in `apps/desktop/src/renderer/src/pages/sessions.tsx` and confirmed collapsed tiles are already packed later in DOM order, so width retention was the next obvious reason a collapsed tile could still keep too much grid real estate.
- Important assumptions:
  - Assumption: treating collapsed tiles as full-width compact rows is an acceptable first fix for the remaining spacing bug, even if it is not a full masonry/grid-row-aware layout.
  - Why acceptable: it removes the leftover half-column footprint with a much smaller, safer change than replacing the sessions layout system, and it keeps the expanded tile size state intact for when the tile is reopened.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the affected `SessionGrid` / `SessionTileWrapper` code is desktop-renderer-specific; mobile does not use this tile grid surface.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so collapsed tiles use the full measured grid width (`containerWidth`) instead of retaining their old resizable column width.
  - Preserved the stored expanded width state so reopening a tile restores its prior width rather than overwriting the user’s resize preference.
  - Added `apps/desktop/src/renderer/src/components/session-grid.collapsed-layout.test.js`, a dependency-light regression test locking in the collapsed-width override.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/session-grid.collapsed-layout.test.js apps/desktop/src/renderer/src/pages/sessions.pending-tile-layout.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/sessions.layout-controls.test.ts src/renderer/src/components/agent-progress.tile-layout.test.ts`
  - Result: still blocked in this worktree because PNPM cannot find the `vitest` executable from the desktop package (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL: Command "vitest" not found`).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #55:
  - If users still report awkward gaps, evaluate a fuller masonry/grid-row-aware layout rather than more ad hoc ordering/footprint rules.
  - If collapsed tiles should remain drag-reorderable, revisit how reorder affordances interact with the derived collapsed-tile presentation.

- Next recommended issue work item: pivot back to `#58` for another small history provenance/reliability slice, or continue `#25`/`#57` only if another equally narrow trust-focused follow-up is directly observable.

##### Issue #58 — Mobile full-history fetch now preserves summary metadata and exposes a basic stored-history viewer

- Selection rationale:
  - After the `#55` follow-up, `#58` was the next highest-value open issue with a concrete local trust/reliability gap.
  - The clearest remaining gap was on mobile: the desktop/mobile recovery endpoint for `GET /v1/conversations/:id` still stripped summary metadata and did not expose preserved raw history / compaction information, so mobile could not faithfully browse the stored transcript for summarized conversations.
- Investigation:
  - Re-read the recent `#58` ledger entries to avoid repeating already-landed desktop history-viewer work.
  - Inspected `apps/desktop/src/main/remote-server.ts` and confirmed the recovery route only returned compacted `messages` fields (`role`, `content`, timestamps, tool data) while dropping `isSummary`, `summarizedMessageCount`, `rawMessages`, and `compaction`.
  - Inspected `apps/mobile/src/lib/syncService.ts`, `apps/mobile/src/store/sessions.ts`, and `apps/mobile/src/screens/ChatScreen.tsx` and confirmed mobile lazy-loads server conversations through that stripped response, so the preserved full transcript could not be surfaced there.
- Important assumptions:
  - Assumption: a first mobile full-history slice that adds a simple toggle/banner is acceptable without building a dedicated modal or desktop-style viewer.
  - Why acceptable: it is the smallest user-visible improvement that lets mobile users switch between the active compacted window and the preserved stored transcript for summarized conversations.
  - Assumption: environment failures in this worktree’s mobile/build tooling do not invalidate the source-level/mobile logic change itself as long as the direct source regressions are covered and desktop typecheck still passes.
  - Why acceptable: the failing commands are missing-tool / missing-config problems that affect the broader mobile package, not a targeted runtime error introduced by this slice.
- Changes implemented:
  - Extended `packages/shared/src/api-types.ts` so `ServerConversationFull` can carry `rawMessages` and `compaction` metadata via a shared `ConversationCompactionMetadata` type.
  - Updated `apps/desktop/src/main/remote-server.ts` so `GET /v1/conversations/:id` now preserves `isSummary`, `summarizedMessageCount`, `rawMessages`, and `compaction` instead of stripping them from the response.
  - Updated `apps/mobile/src/lib/syncService.ts` and `apps/mobile/src/store/sessions.ts` so lazy-loaded mobile conversations retain that extra full-history/compaction payload.
  - Updated `apps/mobile/src/screens/ChatScreen.tsx` so summarized conversations can show a compact banner with `Show Full History` / `Show Active Window`, using the preserved raw transcript when available.
  - Added focused regression tests:
    - `apps/desktop/src/main/remote-server.conversation-history-response.test.js`
    - `apps/mobile/src/lib/syncService.full-history-response.test.js`
    - `apps/mobile/src/screens/ChatScreen.full-history-banner.test.js`
- Verification run:
  - Completed: `node --test apps/desktop/src/main/remote-server.conversation-history-response.test.js apps/mobile/src/lib/syncService.full-history-response.test.js apps/mobile/src/screens/ChatScreen.full-history-banner.test.js apps/desktop/src/renderer/src/components/session-grid.collapsed-layout.test.js apps/desktop/src/renderer/src/pages/sessions.pending-tile-layout.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Attempted: `pnpm build:shared`
  - Result: blocked in this worktree because the shared package build tool is unavailable (`tsup: command not found`; PNPM also warns that local `node_modules` are missing there).
  - Attempted: `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - Result: blocked by pre-existing mobile environment/config problems in this worktree (`expo/tsconfig.base` missing plus widespread missing mobile package typings/deps), but the only new targeted regression it surfaced during the run (`ServerConversationFull` import omission in `syncService.ts`) was fixed before the final focused verification rerun.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - If mobile needs parity with desktop’s richer history UX, promote the banner/toggle into a dedicated full-history viewer with clearer provenance copy and navigation between compacted vs stored views.
  - Re-run shared/mobile package builds once this worktree has the missing package-manager artifacts/tooling restored.

- Next recommended issue work item: revisit `#57` or `#25` for another narrow trust/preview follow-up, or continue `#58` only if the next slice is similarly self-contained and does not depend on broader mobile environment repair.

##### Issue #57 / #25 — Bundle import trust UX: pre-confirm automatic backup notice

- Selection rationale:
  - The latest `#57` trust-track comments explicitly called for a backup notice before confirm, and `#25` treats that trust behavior as part of the shared `.dotagents` import contract.
  - This was a small, directly observable gap in the existing shared bundle import flow with user value across local imports, skill-only imports, Hub installs, and backup restores.
- Investigation:
  - Re-read open issues `#57` and `#25` plus their comments to confirm the remaining requirement: users should see the automatic snapshot/restore guarantee before any bundle write, not only after import toasts.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the dialog already surfaced conflict previews and post-import `backupFilePath` toast copy, but had no pre-confirm backup notice in the body.
  - Confirmed by inspecting `apps/desktop/src/renderer/src/pages/settings-agents.tsx` and `apps/desktop/src/renderer/src/pages/settings-skills.tsx` that the same dialog is reused for Hub installs and local bundle imports, so one renderer change would cover the whole trust track without duplicating logic.
- Important assumptions:
  - Assumption: source-level confirmation of the missing notice is sufficient reproduction for this slice.
  - Why acceptable: the trust gap is the absence of explicit UI copy in a known shared dialog, and the dialog reuse points are directly visible in code.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the affected bundle import dialog is desktop-renderer-specific, with no equivalent mobile bundle-import surface in this repo.
- Changes implemented:
  - Added an `Automatic safety backup` notice card to `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` explaining that DotAgents creates a fresh pre-import backup before any bundle write and that users can later restore it from `Settings → Capabilities → Restore Backup`.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` with a targeted regression test locking in the new pre-confirm backup guarantee copy alongside the existing post-import backup-path wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57 / #25:
  - Consider whether the pre-confirm notice should also surface richer backup metadata (for example, the target layer or expected restore location) once that information can be shown without adding noise.
  - Decide whether bundle trust UX needs a more persistent post-import reminder surface than toast history alone for users who postpone restore/MCP follow-up actions.
  - Re-run any fuller desktop component/Vitest coverage for bundle-import flows if/when the worktree regains that test entrypoint.

- Next recommended issue work item: stay on `#57` / `#25` for another narrow trust/preview polish slice only if it is similarly local, otherwise pivot back to `#58` for a comparably self-contained history/reliability improvement.

##### Issue #57 / #25 — Bundle import trust UX: show target layer + backup location before confirm

- Selection rationale:
  - The shared bundle import dialog already promised an automatic safety backup, but it still hid two trust-critical details users often want before clicking confirm: which layer will actually be mutated and where the recovery snapshot will be written.
  - This was a narrow, reusable improvement in the existing shared dialog, so one change covers local bundle imports, restore flows, and Hub-driven imports that reuse the same preview contract.
- Investigation:
  - Re-read open issues `#57` and `#25` plus the trust-track comments to confirm the intent is not just “backup exists,” but that bundle writes stay auditable and reversible by default.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the dialog only showed a generic backup promise with no target-layer or backup-folder metadata.
  - Inspected `apps/desktop/src/main/tipc.ts` and `apps/desktop/src/main/bundle-service.ts` and confirmed the main process already knew the chosen import target directory plus the canonical backup directory, but that metadata was not carried through `previewBundleWithConflicts(...)` to the renderer.
  - Checked for a mobile equivalent and confirmed there is no corresponding mobile bundle-import dialog surface in this repo, so no mobile parity update was needed for this desktop trust slice.
- Important assumptions:
  - Assumption: source-level confirmation of the missing target/backup metadata is sufficient reproduction for this slice.
  - Why acceptable: the gap is a directly observable omission in a known shared dialog, and the necessary metadata already existed in the import pipeline.
  - Assumption: surfacing the target layer and backup folder in the existing pre-confirm notice is a better first step than inventing a richer new backup-management surface.
  - Why acceptable: it lands immediate trust value with minimal scope and builds directly on already-shipped backup/restore affordances.
- Changes implemented:
  - Extended `apps/desktop/src/main/bundle-service.ts` so `previewBundleWithConflicts(...)` now returns `importTarget` metadata containing the resolved import layer, target agents directory, and canonical backup directory.
  - Extended the corresponding preview shape in `apps/desktop/src/main/tipc.ts` so the renderer can safely consume that metadata without losing it during the workspace/global conflict-merge path.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` so the `Automatic safety backup` notice now tells the user which layer the import will update, where the backup will be stored, and which concrete agents directory is the write target.
  - Added an `Open Backups Folder` action directly inside the import dialog’s backup notice, reusing the existing TIPC folder-opening affordance.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to lock in the new preview-contract metadata and the new dialog trust copy/action.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57 / #25:
  - Consider whether the dialog should also surface richer restore metadata (for example, target layer labels in post-import success toasts or a one-click reveal of the exact created backup file).
  - Decide whether Hub catalog/install surfaces should additionally summarize the resolved target layer before the shared import dialog opens, or continue delegating that detail entirely to the dialog.
  - Re-run any broader renderer/component test coverage for bundle-import flows if/when the worktree regains the full Vitest entrypoint.

- Next recommended issue work item: stay on `#57` / `#25` only for another equally local trust-polish slice (for example, exact backup-file reveal from the success path), otherwise pivot to `#58` or another open issue with a similarly self-contained repro.

##### Issue #57 / #25 — Bundle import trust UX: reveal the exact created backup bundle from import-result toasts

- Selection rationale:
  - The prior `#57 / #25` ledger entry explicitly called out exact backup-file reveal from the success path as the next smallest trust-focused follow-up.
  - The shared import dialog already told users where backups live, but after import they still had to open the folder and manually find the newest bundle instead of jumping straight to the exact snapshot just created for that run.
- Investigation:
  - Re-read the latest `#57 / #25` ledger entries and confirmed this gap was still unaddressed after the pre-confirm backup notice and backup-folder affordance landed.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed import-result toasts only appended the raw `backupFilePath` string with no action tied to it.
  - Inspected `apps/desktop/src/main/tipc.ts` plus `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed the repo already had a safe `revealBundleBackupFile` TIPC handler and renderer usage pattern for revealing individual backup files.
- Important assumptions:
  - Assumption: adding a direct toast action is a worthwhile trust improvement even though Settings → Capabilities already exposes reveal/copy controls for recent backups.
  - Why acceptable: it shortens the path from import completion to backup inspection/recovery, which is exactly when the user is most likely to want immediate reassurance.
  - Assumption: source-level confirmation of the missing reveal action is sufficient reproduction for this slice.
  - Why acceptable: the issue is a concrete omission in the shared import-result UI, and the needed safe reveal plumbing already existed in the codebase.
- Changes implemented:
  - Added `revealBackupFile(...)` and `getRevealBackupToastOptions(...)` in `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx`.
  - Updated both success and failure import-result toasts to include a `Reveal Backup` action whenever `backupFilePath` is present, reusing `tipcClient.revealBundleBackupFile(...)` instead of adding new filesystem logic.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to lock in the new reveal helper wiring and toast action usage.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57 / #25:
  - Consider whether post-import success toasts should also surface the resolved target-layer label so the recovery action and mutated layer remain visible together after the dialog closes.
  - If the bundle trust UX still needs more permanence than toasts, consider a lightweight import-history/recent-imports surface rather than stacking more transient toast copy.
  - Re-run any broader desktop component/Vitest coverage for bundle-import flows if/when the worktree regains that fuller test entrypoint.

- Next recommended issue work item: pivot away from `#57 / #25` unless another equally small trust polish is directly observable, and prefer either a narrow `#58` provenance/reliability follow-up or a fresh bug slice from the current open issues.

##### Issue #57 / #25 — Bundle import result toasts now name the mutated target layer

- Selection rationale:
  - Re-reviewed open issue `#57`, its trust-track comments, and the latest ledger note that called out one still-local follow-up: after import, the toast could reveal the backup bundle but still did not tell the user which layer had actually been mutated.
  - This was a narrow, high-trust renderer-only slice with immediate user value across local bundle imports, restore flows, and Hub installs that reuse the same dialog.
- Investigation:
  - Confirmed issue `#57` remains open with labels (`enhancement`, `ux`, `hub`) and a Phase 5 comment explicitly emphasizing trust-critical follow-through on the shared import-preview/result contract.
  - Inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the dialog already knew `preview.importTarget.layer` for the pre-confirm backup card, but the success/failure toasts only mentioned the backup path and optional source URL.
  - Re-ran the existing dependency-free regression test and confirmed there was no assertion yet locking in target-layer messaging after import completion.
- Important assumptions:
  - Assumption: source-level confirmation that the import-result toast omitted the target layer is sufficient reproduction for this slice.
  - Why acceptable: the gap is a directly visible omission in a shared renderer path, and the required metadata was already available locally in the preview contract.
  - Assumption: surfacing the target layer in both success and failure result toasts is preferable to adding a new persistent UI surface in the same pass.
  - Why acceptable: it keeps the trust-critical detail attached to the moment users most need it, without reopening broader import-history design.
- Changes implemented:
  - Added `buildImportTargetOutcomeMessage(...)` in `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` to consistently format post-import target-layer copy from the existing preview metadata.
  - Updated both success and failure import-result toasts so they now include the resolved target layer before the backup-path/source details.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to lock in the new toast messaging helper and its inclusion in both toast paths.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/main/bundle-service.test.ts`
  - Result: still blocked in this worktree because the desktop package does not currently expose `vitest` on that command path (`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` / `Command "vitest" not found`).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57 / #25:
  - If bundle trust UX still needs more permanence than toasts, consider a lightweight import-history / recent-imports surface instead of stacking more transient copy.
  - Re-run broader desktop component/Vitest coverage for bundle-import flows if/when the desktop test command path is restored in this worktree.
  - Prefer pivoting to a different open issue next unless another equally small, clearly observable bundle-trust gap appears.

- Next recommended issue work item: pivot away from `#57 / #25` for the next pass and prefer either a fresh bug slice from the current open issues or a similarly self-contained `#58` reliability/provenance follow-up.

##### Issue #58 — Mobile full-history viewer now marks where the active context window begins

- Selection rationale:
  - Re-reviewed the current open issues after the previous `#57 / #25` commit and intentionally did **not** force another `#55` pass once source inspection showed the earlier duplicate-maximize guard (`showTileExpandAction = !!onExpand && !isExpanded && !isSnoozed`) was already in place.
  - `#58` still had a small, trust-critical provenance gap with a clear local path: mobile could toggle into stored full history, but it still lacked the desktop-style boundary marker that tells users where the active LLM context window starts.
- Investigation:
  - Re-read open issue `#58` and its scope-locking comment, focusing on the acceptance criteria around browsing complete history and clearly marking the relationship between stored history and active context.
  - Inspected `apps/mobile/src/screens/ChatScreen.tsx` and confirmed mobile already hydrated `fullHistoryMessages`, exposed `Show Full History` / `Show Active Window`, and rendered `Context summary` badges, but it never inserted an explicit divider before the active window when full history was expanded.
  - Cross-checked the already-landed desktop behavior in `apps/desktop/src/renderer/src/components/agent-progress.tsx`, which computes a `fullHistoryBoundaryIndex` and renders `Active context window starts here.` before the active context segment.
- Important assumptions:
  - Assumption: mirroring the desktop boundary marker in mobile is an acceptable narrow follow-up without adding a full separate mobile history inspector.
  - Why acceptable: the issue acceptance is about auditability and provenance clarity, and mobile already has the same stored-history toggle surface where this boundary belongs.
  - Assumption: using `messages.length` as the active-window length is correct for the current mobile stored-history contract.
  - Why acceptable: mobile already treats `messages` as the active context window and `fullHistoryMessages` as the preserved on-disk superset for the same conversation.
- Changes implemented:
  - Added `summaryBlockCount` and `fullHistoryBoundaryIndex` derivation in `apps/mobile/src/screens/ChatScreen.tsx` so the mobile full-history view can identify where preserved earlier history ends and the active context window begins.
  - Updated the mobile stored-history banner copy to explicitly describe when earlier stored messages are represented by summary blocks in the active context window.
  - Inserted an accessible `Active context window starts here.` divider into the mobile full-history transcript and added matching success-colored styles.
  - Added a new dependency-free regression test at `apps/mobile/tests/conversation-history-full-history.test.js` to lock in the boundary calculation and divider rendering contract.
- Verification run:
  - Completed: `node --test apps/mobile/tests/conversation-history-full-history.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - Result: blocked by the current mobile worktree/tooling state rather than this slice (`expo/tsconfig.base` missing plus broad missing Expo/React Native type dependencies and JSX config errors from the package baseline).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - If more mobile provenance polish is needed, consider matching the desktop banner phrasing even more closely (for example, explicitly saying when messages above the divider may be summarized out of the current LLM context).
  - Re-run broader mobile type validation once the package regains its intended Expo/TypeScript toolchain in this worktree.
  - Prefer a fresh issue or a different small `#58` slice next rather than stacking many more micro-polishes on the same viewer without a stronger user signal.

- Next recommended issue work item: prefer a fresh open issue slice next if one has a clear local repro, otherwise take only another equally self-contained `#58` provenance/reliability increment.

##### Issue #53 — Mobile composer slash commands for enabled skills

- Selection rationale:
  - Re-reviewed the currently open issues and the latest ledger guidance, which recommended a fresh issue slice rather than another `#58` micro-follow-up unless a new high-confidence gap appeared.
  - `#53` still had a clear, user-visible follow-up with a local implementation path: desktop composers already supported slash-triggered skill discovery and inline invocation, while mobile had neither autocomplete nor an active-skill indicator despite already talking to the same remote settings server.
- Investigation:
  - Re-read open issue `#53`, confirmed there were still no issue comments narrowing the implementation beyond slash-triggered discovery, optional arguments, and visible indication of the active skill.
  - Inspected `apps/mobile/src/screens/ChatScreen.tsx` and confirmed the mobile composer had no slash-command UI or submit-time skill expansion.
  - Inspected `apps/mobile/src/lib/settingsApi.ts`, `apps/mobile/src/screens/SettingsScreen.tsx`, and `apps/desktop/src/main/remote-server.ts` to confirm mobile already fetched skill summaries from `GET /v1/skills`, but had no per-skill detail endpoint for retrieving full instructions when a slash command needed to expand before send.
- Important assumptions:
  - Assumption: adding a small mobile slash picker is an acceptable `#53` slice even though the original issue started desktop-first.
  - Why acceptable: the issue’s acceptance criteria are phrased around inline invocation UX, not renderer-only behavior, and mobile already shares the same profile-aware skills backend.
  - Assumption: fetching full instructions lazily via a new `GET /v1/skills/:id` endpoint is preferable to bloating the existing skills list response.
  - Why acceptable: mobile only needs full instructions when a user actually selects or submits an exact slash command, so a detail endpoint keeps the list response lightweight and matches the narrow scope of this iteration.
  - Assumption: filtering to `enabledForProfile && enabled` skills is the right mobile behavior.
  - Why acceptable: that matches the existing mobile settings semantics, which already treat skill enablement as current-profile-specific and expose globally disabled skills separately.
- Changes implemented:
  - Added `apps/mobile/src/lib/skillSlashCommands.ts` to centralize mobile slash-command parsing, suggestion matching, selection replacement, and submit-time prompt expansion.
  - Extended `apps/mobile/src/lib/settingsApi.ts` with a `SkillDetail` type plus `getSkill(skillId)` so mobile can fetch full instructions only when needed.
  - Extended `apps/desktop/src/main/remote-server.ts` with `GET /v1/skills/:id` and aligned `GET /v1/skills` to include `enabled`, letting mobile fetch profile-aware skill details safely.
  - Updated `apps/mobile/src/screens/ChatScreen.tsx` to load enabled skills, render a `Slash Commands` suggestion strip when the composer starts with `/`, show an active `Skill: …` chip for exact matches, preload selected skill details, and expand exact slash commands into the inline-invocation contract before send.
  - Added `apps/mobile/tests/chat-skill-slash-command.test.js` to lock in the new mobile composer wiring, API client method, and remote-server endpoint contract.
- Verification run:
  - Completed: `node --test apps/mobile/tests/chat-composer-accessibility.test.js apps/mobile/tests/chat-skill-slash-command.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/mobile exec tsc --noEmit`
  - Result: still blocked by the current mobile worktree/tooling baseline rather than this slice (`expo/tsconfig.base` missing plus broad missing Expo/React Native module/type setup and JSX config errors across the package).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #53:
  - If mobile slash usage proves valuable, consider adding keyboard or list-selection affordances beyond tap-only chip selection.
  - Consider promoting the slash-command helper contract into a broader shared package only if another non-desktop surface needs the same parsing logic; this pass kept the change narrow and mobile-local.
  - Re-run broader mobile type/build validation once the Expo/TypeScript toolchain is restored in this worktree.

- Next recommended issue work item: prefer a fresh open issue slice next unless `#53` receives explicit follow-up feedback, since the remaining work there now trends toward broader mobile UX polish rather than another tiny shippable contract fix.

##### Issue #56 — Hub bundle inspector: richer MCP transport and setup disclosure

- Selection rationale:
  - After the earlier landing-page inspector slice, `#56` still had one small trust-focused follow-up already called out in this ledger: the MCP section could be more informative without reopening the broader hub architecture.
  - This was a tight website-only change with clear user value because MCP servers are one of the highest-risk parts of a bundle preview.
- Investigation:
  - Re-read open issue `#56` and its owner comment, which explicitly emphasized previewing MCP servers/commands before install as a key trust surface.
  - Re-inspected `website/index.html` and confirmed the MCP section still rendered only `command + args`, falling back to a generic `configured via provider` label for non-stdio servers.
  - Checked real public bundle data from `aj47/dotagents-hub` and confirmed the gap is user-visible today: the `TechFren Daily Driver` bundle includes an `exa` MCP entry with `transport: streamableHttp` but no command, so the inspector currently hides the meaningful connection shape behind that generic fallback.
  - Re-checked `apps/desktop/src/main/bundle-service.ts` and confirmed the bundle format already preserves safe MCP config metadata (`config`, `redactedSecretFields`) for richer disclosure when bundles include redacted placeholders or bundled endpoints.
- Important assumptions:
  - Assumption: improving MCP preview fidelity is an acceptable `#56` follow-up even though the original acceptance criteria were already broadly covered by the first slice.
  - Why acceptable: the issue is fundamentally about inspect-before-install trust, and MCP connection/setup disclosure is a direct improvement to that trust surface rather than unrelated polish.
  - Assumption: it is worth supporting richer MCP metadata in the website inspector now even if the currently featured public bundles only use part of that shape.
  - Why acceptable: the code stays small, improves current `streamableHttp` previews immediately, and future-proofs the modal for community bundles that carry redacted placeholder/config metadata.
- Changes implemented:
  - Updated `website/index.html` so MCP entries now render transport-aware connection previews instead of collapsing non-command servers into a generic provider fallback.
  - Added MCP helper logic that normalizes transport labels (for example, `streamableHttp` → `streamable HTTP`) and surfaces a clearer preview for remote HTTP/SSE MCP servers.
  - Added safe setup-hint rendering for MCP entries with preserved redacted placeholder metadata, showing `Requires configuration: ...` when bundles include `redactedSecretFields` or placeholder env values such as `<CONFIGURE_YOUR_KEY>`.
  - Added a small `.bundle-entry-note` style so setup requirements read as trust/safety guidance rather than primary content.
  - Extended `website/website-hub-inspector.test.js` with dependency-light assertions covering the new MCP helper functions and setup-warning copy.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - If community bundles start shipping richer redacted MCP configs, consider showing a slightly more structured setup summary (for example, separating endpoint, auth fields, and local path requirements).
  - If repeat-task preview depth becomes a recurring trust question, the next similarly small follow-up would be exposing startup-trigger details or other schedule metadata beyond the current interval label.
  - Avoid taking on broader hub-catalog/search work here unless the repo website intentionally becomes the full hub surface.

- Next recommended issue work item: refresh the open issue list again and prefer either a fresh bug with a direct local repro or another equally small trust/UX slice, avoiding `#54` unless a concrete provider contract appears.

##### Issue #57 — Bundle presets / slots follow-up triage (new comment, no code landed yet)

- Selection rationale:
  - After the latest `#56` commit, I refreshed the current repo’s open issues and comment threads instead of guessing another micro-follow-up from memory.
  - Issue `#57` has a brand-new owner comment (2026-03-07 22:44 UTC) introducing `Bundle Presets / Slots` as the next trust-track direction, which is higher-signal than inventing more polish on already-advanced surfaces.
- Investigation:
  - Re-read the new `#57` comment and its proposed slot model: `~/.agents/bundle-slots/{slotId}/`, `active-slot.json`, runtime loader mounts the active slot as a higher-priority layer, and `Switch Slot` becomes a pointer flip + runtime refresh instead of a destructive merge.
  - Inspected current config/layer loading and confirmed the runtime is not currently slot-ready:
    - `apps/desktop/src/main/config.ts` hardcodes merged loading as `global .agents + optional workspace .agents` via `loadMergedAgentsConfig(...)`.
    - `apps/desktop/src/main/agents-files/modular-config.ts` only exposes two-layer merge helpers (`global`, then `workspace`).
    - `loop-service.ts`, `memory-service.ts`, and `agent-profiles.ts` each independently resolve the same `global + workspace` layering assumption.
    - `tipc.ts` bundle preview/import helpers currently choose one concrete mutable target dir (`workspace || global`) and then call `refreshRuntimeAfterBundleImport()` to reload the existing merge model.
  - Confirmed this means a real slot implementation is broader than a bundle-service-only change: it needs a shared layer-resolution contract that every runtime loader and refresh path can consume consistently.
- Important assumptions / blockers:
  - Blocker: a safe first implementation slice for slots cannot be just "write files under `bundle-slots/`" because the runtime would still ignore them.
  - Blocker: slot precedence relative to workspace `.agents` is not yet settled in code, even though the new issue comment says the active slot should be a higher-priority layer; today repo guidance says workspace wins on conflicts.
  - Assumption: the right next engineering slice is to centralize layer resolution before any slot-switch UI or import-target changes.
  - Why acceptable: that keeps the future slot behavior honest and avoids shipping a misleading UI that appears to support presets while the core loaders still bypass them.
- Recommended next implementation slice for `#57` slots:
  - Introduce a single shared main-process helper that resolves the effective ordered `.agents` layers for the current runtime (initially `global`, optional `active slot`, optional `workspace` once precedence is explicitly decided).
  - Migrate `config.ts`, `agent profile`, `memory`, `task`, and bundle-preview/import target selection code to use that helper instead of each resolving layers ad hoc.
  - Only after that layer contract exists, add `active-slot.json` metadata/TIPC and a minimal read-only UI surface showing the active slot state.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.

- Next recommended issue work item: for actual code, prefer the `#57` slot-foundation helper as the next safe trust-track slice; otherwise refresh again and pick a fresh bug or similarly concrete non-slot issue rather than forcing a partial slot UI.

##### Issue #57 — Bundle presets / slots: shared runtime layer-resolution foundation

- Selection rationale:
  - The previous `#57` triage entry identified one safe next slice before any slot UI/import-target work: centralize runtime `.agents` layer resolution so future slot layers can be added without every service re-implementing precedence rules.
  - This was small, shippable, and high leverage across config loading, bundle flows, tasks, memories, skills, and agent profiles.
- Investigation:
  - Re-read issue `#57` plus the new owner slots comment and confirmed the requested model is an ordered runtime layer stack, not another destructive merge path.
  - Re-inspected `apps/desktop/src/main/config.ts`, `tipc.ts`, `loop-service.ts`, `memory-service.ts`, `skills-service.ts`, and `agent-profile-service.ts` and confirmed each still resolved `global + optional workspace` layers independently.
  - Confirmed bundle preview/import/export/cleanup code in `tipc.ts` was also hand-assembling layer arrays and writable targets, making it an especially important place to stop duplicating the current precedence contract before slots are introduced.
- Important assumptions:
  - Assumption: the correct slot-foundation slice is to centralize the **current** runtime contract (`global`, then optional `workspace` override) without implementing slot precedence yet.
  - Why acceptable: the issue comment makes slots the next direction, but changing precedence before the active-slot model exists would be speculative and risk user-visible behavior drift.
  - Assumption: source-level regression coverage plus desktop TypeScript validation is sufficient for this refactor slice.
  - Why acceptable: the change is primarily a shared-contract refactor with no new package installs required, and this worktree can now run `pnpm --filter @dotagents/desktop exec tsc --noEmit` successfully.
- Changes implemented:
  - Added `getRuntimeAgentsLayers()` in `apps/desktop/src/main/config.ts`, returning the ordered current runtime layers, writable layer, and workspace-source metadata in one place.
  - Updated `config.ts` itself to load merged config through that shared helper instead of re-resolving workspace state inline.
  - Migrated `apps/desktop/src/main/agent-profile-service.ts`, `memory-service.ts`, `skills-service.ts`, and `loop-service.ts` to use the shared runtime layer contract instead of each rebuilding `global/workspace` paths ad hoc.
  - Updated `apps/desktop/src/main/tipc.ts` bundle/export/import/preview target selection, cleanup helpers, prompt/guidelines file actions, and `getAgentsFolders` to consume the same shared runtime layer helper.
  - Added `apps/desktop/src/main/agents-layer-resolution.foundation.test.js`, a dependency-free regression test asserting the new central helper exists and that the key desktop services/TIPC bundle flows route through it.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/agents-layer-resolution.foundation.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Decide and document the exact future slot precedence relative to workspace `.agents` before adding `active-slot.json` or writable slot targeting.
  - Add slot metadata/helpers (`bundle-slots/{slotId}`, `active-slot.json`) on top of the new shared runtime layer contract.
  - Once slot state exists, extend the same shared helper to include the active slot and then add a minimal Settings/UI surface for active-slot visibility and switching.

- Next recommended issue work item: stay on `#57` for slot metadata/preference groundwork only if slot-vs-workspace precedence can be made explicit in code/comments first; otherwise refresh the backlog again and choose a fresh bug or similarly concrete trust/UX slice.

##### Issue #56 — Hub bundle inspector: repeat-task startup/schedule disclosure

- Selection rationale:
  - The latest ledger guidance suggested a fresh bug or another equally concrete trust/UX slice rather than forcing speculative slot work.
  - `#56` still had a very small, high-signal follow-up already called out in the previous entry: repeat-task previews only exposed a generic interval label, which is weak disclosure for automation users may install from the public hub.
- Investigation:
  - Re-read issue `#56` and its comments, then re-inspected `website/index.html` and `website/website-hub-inspector.test.js`.
  - Confirmed the repeat-task section still rendered only `${formatIntervalLabel(task.intervalMinutes)} · enabled/disabled by default`, with no disclosure of whether a task also fires on app launch.
  - Checked real public bundle artifacts from `aj47/dotagents-hub` and the existing desktop/shared bundle schema, confirming repeat tasks support `intervalMinutes`, `enabled`, and optional `runOnStartup` metadata that the website modal was currently hiding.
- Important assumptions:
  - Assumption: exposing startup-trigger behavior and bundle-default enablement in the website inspector is a valid `#56` follow-up even though the core modal already shipped.
  - Why acceptable: this remains squarely within the issue’s inspect-before-install trust goal, and automation timing is one of the most important things users need to understand before installing a bundle.
  - Assumption: a website-only source test is sufficient verification for this static landing-page slice.
  - Why acceptable: the change is isolated to `website/index.html`, existing dependency-free tests already cover this surface, and the targeted Node test now passes locally.
- Changes implemented:
  - Added `getRepeatTaskScheduleSummary(task)` in `website/index.html` so repeat-task previews now disclose cadence, startup-trigger state, and whether the task is enabled in the bundle versus disabled by default.
  - Added `getRepeatTaskBehaviorNote(task)` so each repeat task includes a short trust-focused note clarifying whether it can run immediately on app launch or will wait for the normal interval schedule.
  - Updated the repeat-task inspector rendering to use the richer schedule summary and behavior note instead of only the prior interval/default subtitle.
  - Extended `website/website-hub-inspector.test.js` with targeted assertions locking the new repeat-task helper functions and trust copy in place.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - If repeat-task trust questions continue, consider showing slightly more structured schedule metadata later (for example, separate cadence/trigger/default pills or explicit task IDs) without turning the landing page into a full bundle manager.
  - Keep broader hub catalog/search work out of scope here unless the repo intentionally adopts the full hub app surface.

- Next recommended issue work item: refresh open issues again and prefer either a concrete bug or another small trust/reliability slice; if `#57` slots is revisited, only do so after slot-vs-workspace precedence is explicitly documented in code or issue comments.

##### Issue #57 — Runtime layer-resolution foundation: executable helper coverage

- Selection rationale:
  - The latest `#57` ledger entry had already landed the shared runtime `.agents` layer helper, but its strongest regression guard was still a source-inspection test.
  - This worktree can currently run dependency-free Node tests and desktop TypeScript checks, so the highest-value next slice was to add executable coverage for the helper behavior itself without changing the runtime contract.
- Investigation:
  - Re-read issue `#57` and its slot follow-up comments, then re-inspected `apps/desktop/src/main/config.ts`, `config.persistence.test.ts`, and `agents-layer-resolution.foundation.test.js`.
  - Confirmed `getRuntimeAgentsLayers()` is now the central contract for the current runtime stack (`global` plus optional `workspace` overlay), but there was no executable test asserting the actual behavior for env-driven workspaces, upward-discovered workspaces, or the same-as-global guardrail.
  - Confirmed the worktree still lacks installed desktop dependencies (`pnpm` reported missing local `node_modules`, and the desktop `pretest` path failed while trying to run `packages/shared` `tsup`), so fully running Vitest is currently blocked locally.
- Important assumptions:
  - Assumption: adding a real Vitest test file for `getRuntimeAgentsLayers()` is still worthwhile even though this worktree cannot execute Vitest until dependencies are present.
  - Why acceptable: the new test captures the intended runtime behavior in executable form for CI / a fully bootstrapped checkout, while local verification can still prove the new file type-checks and that the existing no-dependency foundation guard continues to pass.
  - Assumption: not changing runtime code is the safest `#57` step here.
  - Why acceptable: the issue’s current open question is future slot precedence, not the already-landed global/workspace contract; strengthening verification reduces regression risk without speculating on slot behavior.
- Changes implemented:
  - Added `apps/desktop/src/main/config.runtime-layers.test.ts` with focused tests covering:
    - global-only resolution when no workspace overlay exists
    - `DOTAGENTS_WORKSPACE_DIR` as the writable overlay source
    - upward `.agents` discovery when no env override is set
    - ignoring env workspaces that collapse to the global `~/.agents` layer
  - Kept the existing dependency-free `agents-layer-resolution.foundation.test.js` in place so cross-file usage of the shared helper remains guarded even in minimally bootstrapped environments.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/agents-layer-resolution.foundation.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Attempted: `pnpm --filter @dotagents/desktop run test:run -- src/main/config.runtime-layers.test.ts src/main/config.persistence.test.ts` ⚠️ blocked locally because desktop/shared dependencies are not installed in this worktree (`tsup: command not found`, `node_modules missing`).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - In a fully bootstrapped environment, rerun the new Vitest file and keep it green alongside `config.persistence.test.ts`.
  - Before adding `active-slot.json` or slot-targeted imports, explicitly document slot-vs-workspace precedence in code/comments so runtime layering stays intentional.
  - After that precedence decision, extend the same shared helper to include the active slot and add the smallest read-only UI/status surface first.

- Next recommended issue work item: if dependencies become available, re-run the new `#57` Vitest coverage first; otherwise refresh the backlog again and pick a fresh concrete bug or small trust/UX slice rather than speculative slot UI work.

##### Issue #54 — Feature: ChatGPT subscription (sub OAuth) as a model provider option

- Selection rationale:
  - Re-read the open issue because it was the only still-open item in the current repo that had not already been worked recently in this ledger.
- Investigation:
  - Reviewed issue `#54`, its acceptance criteria, the current provider/OAuth codepaths (`apps/desktop/src/renderer/src/pages/settings-profiles.tsx`, `apps/desktop/src/main/oauth-client.ts`, `apps/desktop/src/main/mcp-oauth-service.ts`), and searched the repo for any existing ChatGPT subscription/session integration.
  - Confirmed the desktop app already has generic OAuth plumbing, but there is no existing ChatGPT subscription provider implementation, no documented stable endpoint/session contract in the repo, and no local code surface that safely proves an official or supportable ChatGPT subscription OAuth flow exists.
- Important assumptions:
  - Assumption: this issue should not get a speculative partial implementation until the auth/session feasibility is explicit.
  - Why acceptable: the issue itself calls out endpoint/session investigation as the key unknown, and shipping a fake or unsupported provider option would create more user confusion than value.
- Outcome:
  - No code change landed for `#54` in this iteration.
  - Captured the blocker here so the next pass does not thrash: before implementation, gather concrete evidence for a supportable ChatGPT subscription auth/session flow (official OAuth or a deliberately accepted unofficial/session-based approach).

##### Issue #55 — Session tile header UI bugs: duplicate maximize button, repeated agent name, and collapsed tile spacing

- Selection rationale:
  - After `#54` proved blocked on auth feasibility, `#55` was the best remaining concrete bug with direct user-visible value and a narrow local implementation path.
- Investigation:
  - Re-read issue `#55`, then inspected `apps/desktop/src/renderer/src/components/agent-progress.tsx`, `session-grid.tsx`, and existing tile layout regression tests.
  - Tried to confirm the bug through the running Electron renderer, but the currently attached renderer window was effectively blank (`SpeakMCP` title with no useful body text), so live DOM validation was not reliable in this worktree.
  - Confirmed the collapsed-tile spacing bug directly from source instead: `SessionTileWrapper` explicitly widened collapsed tiles to the full measured container width, and `session-grid.collapsed-layout.test.js` locked that behavior in as the expected contract.
  - Also confirmed the other two issue symptoms already have dedicated source guards in `agent-progress.tile-layout.test.ts` (`showTileExpandAction` avoids duplicate maximize-style affordances for snoozed tiles, and `showTileProfileName` hides the extra header agent label when the ACP footer badge already names the agent).
- Important assumptions:
  - Assumption: collapsed tiles should temporarily snap to the base grid column width for the current layout mode while preserving any user-resized width for when the tile is expanded again.
  - Why acceptable: that matches the issue's expected reflow behavior, fixes the confirmed full-row gap source, and keeps the expanded resize state intact because only the collapsed render width changes.
  - Assumption: no mobile change is needed for this slice.
  - Why acceptable: the bug and implementation both live in the desktop session tile grid.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/session-grid.tsx` so collapsed tiles use `calculateTileWidth(containerWidth, gap, layoutMode)` instead of stretching to the full container width.
  - Updated `apps/desktop/src/renderer/src/components/session-grid.collapsed-layout.test.js` to assert the new reflow-friendly contract instead of the old full-width collapsed behavior.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/session-grid.collapsed-layout.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop run test:run src/renderer/src/components/agent-progress.tile-layout.test.ts` ⚠️ blocked locally because this worktree still lacks installed package dependencies (`packages/shared` build failed with `tsup: command not found`, and pnpm warned that local `node_modules` are missing).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #55:
  - Once the desktop test environment is bootstrapped, re-run `agent-progress.tile-layout.test.ts` through the package test script so the duplicate-maximize and duplicate-agent-name guards execute again instead of remaining source-only checks in this worktree.
  - Revisit live Electron repro when the attached renderer can surface the real sessions UI; if the duplicate maximize or agent-name symptoms are still observable beyond the current source guards, take the smallest isolated follow-up for those paths.

- Next recommended issue work item: if dependencies become available, verify the existing `#55` source guards through the real desktop test runner; otherwise continue with another concrete trust/reliability slice from `#56`/`#57`, and keep `#54` blocked until auth feasibility evidence exists.

##### Issue #56 — Hub bundle inspector: MCP placeholder/setup disclosure

- Selection rationale:
  - After the latest `#55` bug slice, `#56` still offered a narrow, high-trust follow-up that stayed inside the existing landing-page inspector rather than reopening larger desktop/provider work.
  - Real public bundles are already installable from the featured cards, so exposing hidden MCP setup requirements before install has direct user value.
- Investigation:
  - Re-read issue `#56`, its labels (`enhancement`, `ui`, `hub`), and its trust-focused comment about inspect-before-install disclosure.
  - Re-inspected `website/index.html` and `website/website-hub-inspector.test.js`, then fetched the real featured `Dev Powerpack` bundle artifact from `aj47/dotagents-hub`.
  - Confirmed a concrete current gap: the bundle includes a filesystem MCP arg with `/Users/<YOUR_USERNAME>`, but the website inspector's `getMcpConfigurationRequirements(server)` only looked at `server.config.env` placeholders and `redactedSecretFields`, so the modal did not flag that this MCP still requires user configuration.
- Important assumptions:
  - Assumption: treating any angle-bracket placeholder in MCP command/args/url/config values as a setup requirement is acceptable for this slice, even when the placeholder is not a secret key.
  - Why acceptable: from the installer's perspective both secret placeholders and templated local values (for example usernames or paths) mean the bundle is not plug-and-play and should be disclosed before install.
  - Assumption: surfacing this as both per-server `Requires configuration:` copy and a top-level `Requires setup` warning badge is enough for the first trust-focused fix.
  - Why acceptable: it improves visibility without redesigning the modal or inventing a new requirements panel.
- Changes implemented:
  - Added `getTemplatePlaceholderTokens(value)` and `collectPlaceholderRequirements(value, label, pushRequirement)` in `website/index.html` to detect generic placeholder tokens like `<YOUR_USERNAME>` across nested MCP values.
  - Expanded `getMcpConfigurationRequirements(server)` to scan top-level `command`, `args`, `url`, and nested `config` values instead of only `config.env` placeholder cases.
  - Added a top-level `Requires setup` warning badge when any MCP server in the inspected bundle still contains unresolved configuration placeholders.
  - Extended `website/website-hub-inspector.test.js` with targeted source assertions locking the new placeholder-detection helpers and setup-warning wiring in place.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - If more bundle metadata is added upstream, consider surfacing manifest dependency/compatibility requirements in the same trust-oriented modal area.
  - If setup disclosure grows beyond a badge + note, consider a small dedicated `Requirements` section rather than overloading the MCP rows.

- Next recommended issue work item: refresh the remaining open issues again and prefer another similarly concrete trust/reliability slice, likely from `#57`/`#58`, while keeping `#54` blocked until auth feasibility evidence exists.

##### Issue #57 — Bundle import dialog: treat templated MCP placeholders as setup requirements too

- Selection rationale:
  - After the website-side `#56` fix, the cleanest next open-issue follow-up was the same trust gap inside the actual desktop import/restore flow: bundles with non-secret MCP placeholders still looked safer than they were.
  - This stayed tightly scoped to the shared desktop import dialog used for bundle imports/restores, without reopening broader slot or provider work.
- Investigation:
  - Refreshed open issue `#57` and its comments, then re-inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` plus its regression test.
  - Confirmed a concrete gap: `getSelectedMcpServersRequiringConfiguration(...)` and `getImportedMcpServersRequiringConfiguration(...)` only treated `redactedSecretFields` as reconfiguration signals.
  - Confirmed the main-process preview/import contract already carries enough MCP detail (`command`, `args`, `config`) through the bundle payload, so renderer-only logic could detect placeholder values like `/Users/<YOUR_USERNAME>` without adding a new backend API.
  - Re-checked `apps/desktop/src/renderer/src/AGENTS.md` and confirmed no mobile parity work is needed because this Electron bundle-import dialog has no equivalent mobile surface.
- Important assumptions:
  - Assumption: the import dialog should treat templated MCP placeholders and redacted secrets as the same class of post-import setup requirement.
  - Why acceptable: both represent “not ready to use as imported,” which is exactly the trust/safety signal the issue wants surfaced before and after bundle writes.
  - Assumption: broadening the warning language from credential-only wording to general MCP setup wording is preferable to adding a second warning card.
  - Why acceptable: it keeps the UX smaller and clearer while covering both secret and non-secret placeholder cases.
- Changes implemented:
  - Expanded the renderer-side bundle preview typing in `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` so MCP preview items can inspect `command`, `args`, and `config`, not just `redactedSecretFields`.
  - Added `getTemplatePlaceholderTokens(...)`, `collectPlaceholderRequirements(...)`, and `getMcpConfigurationRequirements(...)` to detect templated values like `<YOUR_USERNAME>` across MCP command args and nested config.
  - Updated both the pre-import warning card and post-import warning toast to treat any detected placeholder/manual-setup requirement as actionable MCP reconfiguration, not only `<CONFIGURE_YOUR_KEY>` secrets.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` with source-level assertions locking in the broader MCP setup detection and wording.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - If users need even clearer recovery guidance later, consider linking directly to specific imported MCP rows or preserving a lightweight post-import remediation history beyond toasts.
  - If Hub install/import trust UX keeps expanding, align the website inspector, desktop import dialog, and any future install-history surface on one shared vocabulary for “requires setup”.

- Next recommended issue work item: refresh open issues again and prefer either a fresh bug with a concrete repro or another equally narrow trust/reliability slice from `#58`, while continuing to keep `#54` blocked on external feasibility evidence.

##### Issue #53 — Feature: Inline skill invocation via slash commands

- Selection rationale:
  - Re-opened `#53` because the issue remains open, it has clear UX value, and the ledger's earlier slash-command work left room for a small reliability follow-up instead of a broad new feature push.
  - Avoided repeating recent `#55`/`#56`/`#57` work and chose a slice directly tied to the issue's acceptance criterion that slash invocation should work correctly across agent profiles.
- Investigation:
  - Re-read issue `#53` and its acceptance criteria, especially the requirement that skills come from the enabled registry and work across agent profiles.
  - Inspected the current desktop slash-command surfaces in `apps/desktop/src/renderer/src/components/text-input-panel.tsx`, `overlay-follow-up-input.tsx`, and `tile-follow-up-input.tsx`.
  - Confirmed a concrete desktop gap from source: all three components queried `tipcClient.getSkills()` and used that raw list for slash suggestions and exact `/skill` expansion, with no per-profile filtering.
  - Cross-checked the mobile implementation in `apps/mobile/src/screens/ChatScreen.tsx` and confirmed mobile already filters available slash skills with `skill.enabledForProfile && skill.enabled`, which made the desktop inconsistency clear.
  - Confirmed the desktop main process already exposes enough profile-aware data to fix this without backend changes: `getCurrentAgentProfile`, `getSessionProfileSnapshot`, and `getEnabledSkillIdsForProfile` already exist in `apps/desktop/src/main/tipc.ts`.
- Important assumptions:
  - Assumption: this iteration should focus on restricting slash-command skill availability, not the broader non-slash "Skills" prompt menu.
  - Why acceptable: the issue is specifically about inline slash invocation, and filtering the slash-command path removes the most direct profile-bypass bug in the smallest reviewable patch.
  - Assumption: when the relevant profile context is still loading, temporarily hiding slash skills is preferable to showing the global skill list.
  - Why acceptable: it avoids exposing disabled skills during query races and is safer than briefly allowing an exact `/skill` expansion against the wrong profile.
  - Assumption: follow-up composers should use the session snapshot profile when available, not the current global agent selection.
  - Why acceptable: active sessions are already isolated to a captured profile snapshot, so slash-command availability should match the session's own profile rather than any later global selector change.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/text-input-panel.tsx` to resolve the effective agent profile for the main composer (`selectedAgentId` or current/default agent profile), then filter slash-command skills via `getEnabledSkillIdsForProfile(...)` before autocomplete or exact command expansion runs.
  - Updated `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx` and `tile-follow-up-input.tsx` to resolve the session profile via `getSessionProfileSnapshot(...)`, fall back to the current agent only when no session snapshot is available, and filter slash-command skills against that profile's enabled skill IDs.
  - Extended `apps/desktop/src/renderer/src/components/text-input-panel.slash-command.test.js` and `follow-up-input.slash-command.test.js` with source-level assertions locking in the new profile-aware query wiring.
  - Updated `apps/desktop/src/renderer/src/components/text-input-panel.submit.test.tsx` mocks so the submit-behavior regression coverage still exercises the main composer with the extra profile-aware queries present.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/text-input-panel.slash-command.test.js apps/desktop/src/renderer/src/components/follow-up-input.slash-command.test.js` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/text-input-panel.slash-command.test.js src/renderer/src/components/follow-up-input.slash-command.test.js src/renderer/src/components/text-input-panel.submit.test.tsx` ⚠️ blocked locally because the workspace does not currently have installed package dependencies (`packages/shared` pretest failed with `tsup: command not found`, and pnpm warned that local `node_modules` are missing).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #53:
  - Once dependencies are available, run the desktop Vitest pass for `text-input-panel.submit.test.tsx` (and ideally a focused renderer typecheck) to catch any TS/runtime issues beyond the source-level slash-command assertions.
  - Consider applying the same per-profile filtering to `PredefinedPromptsMenu` if skill prompt insertion is also meant to honor profile-level skill gating, but keep that as a separate follow-up since this slice intentionally focused on slash invocation.

- Next recommended issue work item: if the workspace dependencies become available, finish the blocked desktop verification for this `#53` slice first; otherwise refresh open issues again and prefer either a new well-scoped bug or a narrow follow-up from `#58` rather than re-opening the broader blocked `#54` work.

##### Issue #58 — ACP live progress preserves compaction summary metadata for history UI hydration

- Selection rationale:
  - Re-reviewed `issue-work.md`, the current open issue list, and live issue `#58` metadata/comments before selecting this pass. The issue body plus the scope-locking comment still emphasize preserved raw history, a `Show Full History` affordance, and a clear stored-history-vs-active-window contract.
  - I avoided recently worked issues where possible and chose a fresh, narrowly verifiable `#58` follow-up with direct desktop UX value: summarized ACP sessions were still dropping the summary markers needed by the already-landed full-history/provenance UI.
- Investigation:
  - Inspected `apps/desktop/src/main/acp-main-agent.ts` and confirmed continued ACP sessions load conversation state via `conversationService.loadConversationWithCompaction(conversationId, sessionId)`, but immediately remap those messages into `conversationHistory` while stripping `id`, `isSummary`, and `summarizedMessageCount`.
  - Cross-checked the renderer history affordance work in `apps/desktop/src/renderer/src/components/agent-progress.tsx` and confirmed live full-history hydration is gated off summary metadata in `conversationHistory` when `fullConversationHistory` is not already attached.
  - Inspected `apps/desktop/src/main/acp-main-agent.test.ts` and `apps/desktop/src/main/conversation-storage-integrity.test.js` to extend the existing ACP compaction coverage without broadening scope.
  - Re-read issue `#58` labels/comments (`enhancement`, `ui`, `conversation-history`) and the scope comment calling this a foundational data-integrity item before more summarization work.
- Important assumptions:
  - Assumption: preserving summary metadata on ACP live `conversationHistory` is the smallest effective fix, even without also pushing `fullConversationHistory` through every live progress update.
  - Why acceptable: the renderer already knows how to lazily hydrate preserved disk history when summary markers are present, so restoring those markers unblocks the existing UX with a very small, low-risk main-process change.
  - Assumption: not attaching potentially stale `fullConversationHistory` payloads from ACP bootstrap is preferable for this slice.
  - Why acceptable: the lazy fetch path can read the freshest persisted history, while this fix focuses only on restoring the missing provenance signal that enables that fetch.
- Changes implemented:
  - Updated `apps/desktop/src/main/acp-main-agent.ts` so compacted ACP bootstrap history now preserves `id`, `isSummary`, and `summarizedMessageCount` when mapping loaded messages into progress `conversationHistory`.
  - Added a targeted unit test in `apps/desktop/src/main/acp-main-agent.test.ts` asserting the initial ACP progress update still carries compacted summary metadata.
  - Extended `apps/desktop/src/main/conversation-storage-integrity.test.js` with source-level regression assertions covering the new ACP summary-metadata mapping.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/main/acp-main-agent.test.ts`
  - Blocked: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` / `Command "vitest" not found` in this worktree, so the new Vitest coverage could not be executed locally yet.
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Re-run `apps/desktop/src/main/acp-main-agent.test.ts` once the desktop Vitest entrypoint is available again in this worktree.
  - Check whether any non-ACP live progress paths still strip `isSummary` / `summarizedMessageCount` before reaching shared renderer transcript surfaces.
  - Only continue `#58` if another similarly concrete provenance/reliability gap is directly observable; otherwise pivot to a different open issue next.

- Next recommended issue work item: prefer a fresh open issue for the next pass unless another comparably tight `#58` live-history gap appears immediately from source or manual repro.

##### Issue #58 — ACP live progress preserves compaction summary metadata for history UI hydration

- Selection rationale:
  - Re-reviewed `issue-work.md` first, then refreshed the remaining open issues and the last `#58` ledger follow-up before selecting this pass.
  - The previous `#58` entry explicitly called out checking non-ACP live progress paths for stripped summary metadata, and both desktop `tipc` agent resumes and the remote server resume/API formatting path still showed a direct source-level gap.
  - I chose this slice because it is small, user-visible, and tightly aligned with the issue’s trust/provenance goal: the renderer can already explain compacted history, but non-ACP resume paths were still dropping the metadata needed to do that consistently.
- Investigation:
  - Inspected `apps/desktop/src/main/tipc.ts` and confirmed `processWithAgentMode(...)` loaded compacted conversation context via `conversationService.loadConversationWithCompaction(...)` but remapped prior messages into `previousConversationHistory` without `id`, `isSummary`, or `summarizedMessageCount`.
  - Inspected `apps/desktop/src/main/remote-server.ts` and found the same stripping in two places: `runAgent(...)`’s `previousConversationHistory` bootstrap mapping and `formatConversationHistoryForApi(...)`, which shaped `conversation_history` responses for remote/mobile callers.
  - Cross-checked `apps/desktop/src/main/llm.ts` and confirmed the non-ACP progress formatter also omitted summary metadata even if earlier layers had preserved it.
  - Re-used the existing `#58` renderer understanding from prior entries rather than re-opening the UI: `agent-progress.tsx` already knows how to surface compacted-history provenance once `conversationHistory` entries still carry summary markers.
- Important assumptions:
  - Assumption: preserving compacted summary metadata on non-ACP resume/progress and remote API formatting is the highest-value follow-up, even without expanding the public conversation create/update schema in the same pass.
  - Why acceptable: this directly fixes the active resume/hydration path users hit after compaction, while API schema broadening would be a separate compatibility change with less immediate desktop UX impact.
  - Assumption: preserving `id` alongside summary flags is acceptable even though the issue primarily called out `isSummary` / `summarizedMessageCount`.
  - Why acceptable: ACP already keeps IDs for the same history hydration purpose, and retaining IDs here improves parity and stable renderer reconciliation with no meaningful downside.
- Changes implemented:
  - Updated `apps/desktop/src/main/tipc.ts` so non-ACP agent-mode resumes now carry `id`, `isSummary`, and `summarizedMessageCount` through `previousConversationHistory` when loading a compacted conversation window.
  - Updated `apps/desktop/src/main/remote-server.ts` so remote agent resumes preserve the same metadata and `formatConversationHistoryForApi(...)` now keeps those fields in returned `conversation_history` payloads.
  - Updated `apps/desktop/src/main/llm.ts` so non-ACP progress formatting and `AgentModeResponse` typing preserve `id`, `timestamp`, `isSummary`, and `summarizedMessageCount` once they are present in prior history.
  - Added `apps/desktop/src/main/non-acp-summary-progress.test.js` with source-level regression coverage locking in the `tipc`, `llm`, and `remote-server` summary-metadata passthrough.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/non-acp-summary-progress.test.js apps/desktop/src/main/remote-server.conversation-history-response.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - If another `#58` slice is needed later, inspect whether the remote conversation create/update endpoints should also accept and persist incoming summary metadata instead of stripping those fields on save.
  - If a live repro still shows missing provenance after this patch, inspect any remaining progress sanitization/replay layers between `emitAgentProgress(...)` and renderer store hydration rather than revisiting these now-covered mappings first.
  - Otherwise prefer a fresh open issue next instead of continuing to mine `#58`.

- Next recommended issue work item: refresh open issues again and prefer a fresh, well-scoped bug or reliability slice next; only return to `#58` if a new direct metadata-loss path is observed.

##### Issue #25 — `.dotagents` docs/spec alignment after finalized `#56` / `#57` trust defaults

- Selection rationale:
  - Re-reviewed `issue-work.md` first, then refreshed the still-open issues and issue comments before choosing this pass.
  - Issue `#25` has an explicit owner planning comment saying the concrete deliverables in `#56` (Hub inspect modal) and `#57` (import safety / restore UX) should feed back into the umbrella `.dotagents` docs/spec next.
  - This made `#25` the cleanest fresh issue for a small shippable slice: improve contributor/user understanding of the already-landed trust model without reopening backend import complexity.
- Investigation:
  - Re-read issue `#25` and its planning comment, then inspected the existing bundle docs in `DOTAGENTS_BUNDLES.md` and the README summary to see what current-state behavior was still undocumented.
  - Re-inspected `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed the current restore surface now goes beyond the earlier doc: recent backups show target provenance and component summaries, plus per-backup `Restore`, `Reveal`, and `Copy path` actions alongside `Open Backups Folder`.
  - Re-inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the trust model now also includes an explicit automatic safety-backup notice, `Reveal Backup` toast actions, and placeholder-aware MCP setup disclosure for both secret placeholders like `<CONFIGURE_YOUR_KEY>` and templated values like `<YOUR_USERNAME>`.
  - Re-inspected `website/index.html` and confirmed the Hub inspector now discloses more than the existing doc captured: warning badges for `Contains MCP commands` / `Requires setup` / `Contains memories` / `Large prompt content`, transport-aware MCP connection previews, and repeat-task schedule/startup/default-state disclosure.
- Important assumptions:
  - Assumption: the right `#25` slice is to keep the repo-local current-state spec accurate, not to rewrite the umbrella issue body or design a larger documentation site.
  - Why acceptable: the owner comment explicitly asked for docs/spec alignment after `#56`/`#57`, and a narrow current-state update is the most reviewable way to land that.
  - Assumption: a dependency-free source test guarding the README + spec prose is sufficient verification for this docs-only pass.
  - Why acceptable: this slice changes no runtime code, and a small Node test gives the repo a durable guard against the new trust-default documentation drifting again.
- Changes implemented:
  - Expanded `DOTAGENTS_BUNDLES.md` to document the now-shipped restore/recovery affordances: recent-backup provenance, per-backup `Restore` / `Reveal` / `Copy path` actions, automatic-safety-backup messaging, and reveal-from-toast behavior.
  - Added a new `MCP setup disclosure before and after import` section documenting that bundle import treats both redacted secrets and templated placeholders as required follow-up configuration and deep-links users to `Settings -> Capabilities -> MCP Servers`.
  - Updated the export/share and website-inspector sections in `DOTAGENTS_BUNDLES.md` to cover local memory secret warnings, placeholder-bearing setup requirements, Hub warning badges, transport-aware MCP previews, and repeat-task cadence/startup/default-state disclosure.
  - Tightened the README bundle summary to mention recent-backup recovery tools and inspect-before-install setup disclosure.
  - Added `tests/dotagents-bundles-docs.test.js`, a dependency-free regression test locking in the new bundle-doc trust defaults and README discoverability.
- Verification run:
  - Completed: `node --test tests/dotagents-bundles-docs.test.js` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Keep `DOTAGENTS_BUNDLES.md` aligned if future slot/preset isolation changes import targets, restore provenance, or bundle artifact metadata again.
  - If Hub bundles later expose explicit dependency metadata, extend both the website inspector and the current-state spec with that trust signal rather than leaving it implied by MCP command previews.
  - Only resume broader Phase 2/Phase 3 hub work when there is another similarly concrete local slice (for example, installed/update status or registry-caching behavior), not by reopening the full umbrella spec at once.

- Next recommended issue work item: refresh the open issues again and prefer a fresh, well-scoped bug or reliability slice next; if `#25` is revisited, keep it to another concrete docs/trust-sync step rather than speculative roadmap prose.

##### Issue #57 — Bundle-slot groundwork: make future slot precedence explicit in code/comments

- Selection rationale:
  - After the `#25` docs/spec sync commit, refreshed the open issues again and re-read the latest tail of `issue-work.md` before choosing the next slice.
  - `#57` remained the best narrow follow-up because the ledger had already identified one prerequisite blocker for any active-slot metadata/UI work: slot precedence relative to workspace `.agents` still was not explicit in code, even though slot support had become the next requested direction.
  - This was small, reviewable, and directly useful: it settles the contract future slot work should extend without speculating on broader slot UI or import-target behavior yet.
- Investigation:
  - Re-read issue `#57` and its follow-up comments, especially the newest slot comment requiring the runtime loader to mount an `active slot` as a higher-priority layer.
  - Re-inspected `apps/desktop/src/main/config.ts` and confirmed `getRuntimeAgentsLayers()` already centralizes the current runtime order but only documents the present `global + optional workspace overlay` behavior.
  - Re-inspected `apps/desktop/src/main/agents-layer-resolution.foundation.test.js` and confirmed the existing no-dependency guard locked the helper shape/usages, making it the best place to freeze the new precedence note too.
  - Re-checked repo guidance and nearby merge comments (`workspace wins on conflicts`) to avoid documenting a slot order that would silently contradict the project’s current conflict semantics.
- Important assumptions:
  - Assumption: the slot comment's "higher-priority layer" requirement should be interpreted as `higher priority than global`, not `higher priority than workspace`.
  - Why acceptable: repo guidance and existing merge comments already establish that workspace overrides win on conflicts, so the least surprising future order is `global -> active slot -> workspace`.
  - Assumption: a code-comment plus regression-test slice is enough progress for this iteration even without adding `active-slot.json` metadata yet.
  - Why acceptable: the explicit blocker was ambiguity in the contract itself; documenting and locking that contract removes the ambiguity without shipping misleading partially wired slot UI.
- Changes implemented:
  - Added an explicit future-precedence comment above `RuntimeAgentsLayerName` in `apps/desktop/src/main/config.ts` documenting that bundle-slot work must preserve `global -> active slot -> workspace` ordering.
  - Expanded the `getRuntimeAgentsLayers()` docblock to say the centralized helper should be extended with the same slot-in-the-middle ordering once slot support is introduced.
  - Updated `apps/desktop/src/main/agents-layer-resolution.foundation.test.js` so the existing no-dependency guard now asserts both the future `global -> active slot -> workspace` contract and the `workspace wins on conflicts` note.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/agents-layer-resolution.foundation.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Add actual slot metadata/helpers (`bundle-slots/{slotId}`, `active-slot.json`) on top of the now-explicit precedence contract.
  - Once slot state exists, extend `getRuntimeAgentsLayers()` to include the active slot between global and workspace, then add a minimal read-only UI/TIPC surface showing the active slot and last-switched metadata.
  - Keep import-target and restore semantics aligned with this precedence when slot-aware bundle import is introduced.

- Next recommended issue work item: refresh the open issues again and prefer the next smallest direct-value bug/reliability slice; if `#57` is revisited, the clean next step is real slot metadata/state on top of the now-documented layer order, not more abstract slot planning.

##### Issue #57 — Bundle-slot groundwork: read-only slot metadata/status in Settings → Capabilities

- Selection rationale:
  - Re-read `issue-work.md` first and followed the immediately recommended `#57` next step after the precedence-doc slice: add real slot metadata/state, but keep the first landing read-only so the app does not imply full preset switching is already finished.
  - This was the smallest shippable follow-up with direct user/developer value because it exposes the future slot surface (`bundle-slots/*` + `active-slot.json`) in the app and main-process contract without yet changing runtime layer loading semantics.
- Investigation:
  - Re-read issue `#57` plus the owner slot comment and confirmed the requested visible state includes the active slot and last-switched time.
  - Re-inspected `apps/desktop/src/main/config.ts`, `apps/desktop/src/main/tipc.ts`, and `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed there was still no slot metadata helper, no TIPC endpoint, and no Capabilities UI surface for slot state.
  - Confirmed the earlier precedence note now makes the intended future order explicit (`global -> active slot -> workspace`), so a read-only status slice can safely reference that contract without silently changing runtime behavior yet.
- Important assumptions:
  - Assumption: storing the active-slot pointer at `~/.agents/bundle-slots/active-slot.json` is an acceptable first concrete location even though the issue comment named the file but not its exact parent folder.
  - Why acceptable: colocating the pointer with the slot directories keeps the new metadata self-contained under the bundle-slot root and avoids inventing another top-level config file.
  - Assumption: the first landed UI should be explicitly read-only rather than shipping a half-wired switcher.
  - Why acceptable: the runtime still does not mount slot layers, so a status card plus folder affordance is honest, useful, and avoids misleading users into thinking preset switching already works end-to-end.
- Changes implemented:
  - Added bundle-slot metadata helpers to `apps/desktop/src/main/config.ts`:
    - `bundleSlotsFolder` and `activeBundleSlotStatePath`
    - validation helpers for slot IDs / timestamps
    - `listBundleSlotDirectories()`
    - `getActiveBundleSlotState()` returning discovered slots, active pointer, last-switched timestamp, future precedence note, and an explicit `runtimeActivationEnabled: false` guard
  - Added `getBundleSlotState` and `openBundleSlotsFolder` procedures in `apps/desktop/src/main/tipc.ts` so the renderer can query slot status and open the canonical slot root.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` with a new `Bundle slots` card that shows:
    - the current active slot pointer (or empty state)
    - last-switched time if present
    - discovered slot directories
    - an `Open Slots Folder` action
    - explicit copy that this is status-only for now and does not yet activate runtime layer switching
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` with dependency-free source assertions covering the new config helpers, TIPC endpoints, and Capabilities UI/status copy.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Add write-side slot actions next (`set active slot`, `clear active slot`, or import-targeted slot creation) only once the runtime can actually consume the active slot layer.
  - Extend `getRuntimeAgentsLayers()` and the relevant loaders/services to mount the active slot between global and workspace before exposing a switch action in the UI.
  - When slot activation lands, update the Capabilities card from status-only copy to real switch / rollback affordances and keep restore/import semantics aligned with the same layer order.

- Next recommended issue work item: refresh the open issues again and prefer a concrete bug/reliability slice next; if `#57` is revisited immediately, the right next move is runtime consumption of the active slot contract (not more read-only slot chrome).

##### Issue #56 — Bundle inspector: skill preview first, expandable full instructions

- Selection rationale:
  - After the `#57` slot-status commit, I refreshed the open issues and avoided forcing another blocked/repetitive desktop-runtime slice.
  - `#56` still had a concrete trust/mobile gap that maps directly to the owner comment: skills were requested as `title + first lines / summary`, but the current website inspector dumped full instructions immediately.
  - Real featured bundle data made this a current user-facing problem, not hypothetical: the `TechFren Daily Driver` bundle includes very large skill instruction bodies, which makes the modal dense and harder to scan on smaller viewports.
- Investigation:
  - Re-read `#56` and its owner comment, especially the requested v1 modal shape for skills (`title + first lines / summary`).
  - Re-inspected `website/index.html` and confirmed the skills section still rendered `renderMarkdown(skill.instructions)` directly for every skill, with no preview truncation or inline affordance.
  - Fetched the real featured public bundle artifacts (`techfrenaj-daily-driver.dotagents`, `dev-powerpack.dotagents`, `research-analyst.dotagents`) and confirmed the density problem is real today: several skill instructions are long enough that the modal becomes a wall of content before the user can finish scanning the rest of the bundle.
- Important assumptions:
  - Assumption: `#56` is better served by preview-first skill rendering than by always showing the full skill body inline.
  - Why acceptable: this matches the owner comment more closely, improves mobile scanability, and still preserves access to the full instructions through an explicit inline details affordance.
  - Assumption: a dependency-free website source test plus inline script syntax parse is sufficient verification for this static landing-page change.
  - Why acceptable: the slice only touches `website/index.html` and its existing no-dependency test suite, and both targeted checks now pass locally.
- Changes implemented:
  - Added `buildMarkdownPreview(...)` in `website/index.html` to strip frontmatter, keep only the first lines/characters of long markdown content, and mark whether the content was truncated.
  - Updated the inspector skills section so each skill now renders:
    - title + description
    - a readable markdown preview first
    - `Show full skill instructions` inline details only when the instructions exceed the preview limits
  - Added lightweight website styles for the inline skill-details affordance so the expanded full content remains visually nested rather than blending into the main card body.
  - Updated `website/website-hub-inspector.test.js` to lock in the preview helper and the expandable full-instructions affordance.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: inline website script syntax parse via Node (`new Function(...)`) ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - If agent-profile prompts become similarly hard to scan on mobile, apply the same preview-first pattern there without hiding short prompts unnecessarily.
  - If the landing page grows beyond curated featured bundles, keep the preview/full-content behavior consistent across any future catalog surface.
  - Avoid turning the inspector into a full editor/manager; keep it focused on inspect-before-install trust.

- Next recommended issue work item: refresh open issues again and prefer either a concrete desktop bug/reliability slice or the next honest `#57` runtime-slot follow-up only if it actually mounts the active slot contract instead of adding more status-only UI.

##### Issue #56 — Bundle inspector: agent prompt preview first, expandable full instructions

- Selection rationale:
  - Re-read `issue-work.md` first and avoided re-opening larger, riskier work like `#54` subscription OAuth or `#57` runtime slot activation without a sharper local repro.
  - `#56` still had a concrete user-facing gap called out by the owner comment: agent profiles should lead with a system-prompt preview, but the landing-page inspector still rendered full agent prompts and guidelines inline immediately.
  - This was a small, shippable website-only slice with direct mobile/readability value and fast local verification.
- Investigation:
  - Re-read issue `#56` plus the owner comment specifying `Agent profiles (name + system prompt preview)` for the modal v1 content model.
  - Re-inspected `website/index.html` and confirmed `renderBundle(...)` still rendered `renderMarkdown(\`## System Prompt ...\`)` and `renderMarkdown(\`## Guidelines ...\`)` directly for every agent profile, unlike the newer preview-first treatment already added for skills.
  - Confirmed this made the modal disproportionately dense before users could scan the rest of the bundle sections, especially on smaller viewports.
- Important assumptions:
  - Assumption: combining system prompt + guidelines into one preview block is acceptable for this slice.
  - Why acceptable: the owner comment explicitly prioritizes a system-prompt preview, and keeping guidelines in the same expandable instruction block avoids hiding information while still reducing initial modal density.
  - Assumption: dependency-free website regression tests plus inline script syntax parsing are sufficient verification for this static landing-page change.
  - Why acceptable: the slice only changes `website/index.html` and its existing no-dependency test coverage, and both targeted checks pass locally.
- Changes implemented:
  - Added `getAgentProfileInstructions(profile)` in `website/index.html` to compose the agent `System Prompt` and `Guidelines` sections into a single markdown source block.
  - Updated the bundle inspector `Agent Profiles` renderer to use `buildMarkdownPreview(...)` before showing agent instructions.
  - Added an inline `Show full prompt + guidelines` details affordance that reveals the full rendered markdown only when the agent instruction content exceeds the preview limit.
  - Extended `website/website-hub-inspector.test.js` with source-level regression coverage for the new agent preview helper and expandable full-instructions path.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: inline website script syntax parse via Node (`new Function(...)`) ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - If repeat-task prompts or agent previews still feel too dense on mobile, apply the same preview-first pattern there without obscuring short content.
  - If the curated landing-page hub grows into a larger catalog, keep the preview/details affordance consistent across all inspector entry points.
  - Continue keeping the inspector trust-focused rather than turning it into an in-browser bundle editor.

- Next recommended issue work item: refresh the open issues again and prefer a concrete desktop bug/reliability slice next; if `#57` is revisited, the highest-value honest follow-up is runtime consumption of the active slot layer rather than more status-only slot UI.

##### Issue #57 — Runtime now mounts the active slot layer between global and workspace

- Selection rationale:
  - Re-read the updated ledger first and avoided speculative OAuth-heavy issue `#54` plus more status-only slot chrome.
  - `#57` still had the clearest high-leverage technical gap: the repo already surfaced slot folders and an active pointer, but the runtime layer contract still ignored that pointer entirely.
  - This slice was self-contained enough to ship without pretending full slot switching/edit management is done.
- Investigation:
  - Re-inspected `apps/desktop/src/main/config.ts` and confirmed `getRuntimeAgentsLayers()` still returned only `global -> workspace`, while `getActiveBundleSlotState()` explicitly reported `runtimeActivationEnabled: false`.
  - Re-checked `agent-profile-service.ts`, `skills-service.ts`, `memory-service.ts`, and `modular-config.ts`; they all depended on the centralized runtime layer contract, so updating that contract plus a small number of loaders could unlock real read-side slot activation without a broad refactor.
  - Confirmed the renderer capabilities page still described slots as status-only, so UI copy also needed to be aligned with the new runtime behavior.
- Important assumptions:
  - Assumption: it is acceptable for this iteration to focus on read-side runtime layering, not full slot-aware authoring/switch/import UX.
  - Why acceptable: issue `#57` is broader than one landing, and the owner-guided next honest slice was activating the runtime layer contract rather than shipping more placeholder UI.
  - Assumption: leaving `writableLayer` as `workspace ?? global` is correct for now.
  - Why acceptable: workspace must remain the highest-priority override, and routing all generic writes into slot directories before a dedicated slot-management UX exists would risk surprising persistence semantics.
  - Assumption: source-level node tests plus TypeScript validation are acceptable verification here even though the desktop Vitest run is currently blocked by missing local package binaries/deps in this workspace.
  - Why acceptable: the changed logic type-checks, the dependency-free regression tests pass, and the Vitest failure is environmental (`vitest` / `tsup` unavailable locally), not caused by the patch itself.
- Changes implemented:
  - Updated `apps/desktop/src/main/config.ts` so `getRuntimeAgentsLayers()` now resolves `global -> active slot -> workspace`, exposes `activeSlotLayer`, and marks `runtimeActivationEnabled: true` when surfacing slot state.
  - Added a shared slot-resolution helper so both slot status and runtime layer loading use the same validated `active-slot.json` pointer resolution.
  - Updated config loading in `config.ts` + `agents-files/modular-config.ts` so ordered `.agents` directories can be merged sequentially, allowing an active slot layer to override global settings while still staying below workspace overrides.
  - Updated `agents-files/agent-profiles.ts` + `agent-profile-service.ts` so ordered profile layers merge through the same contract and prompt file reads come from the topmost active read layer.
  - Updated `skills-service.ts` and `memory-service.ts` to merge all ordered runtime layers, preserve slot origins in-memory, and resolve active/fallback layer paths from the centralized runtime layer contract.
  - Updated desktop capabilities copy/tests so the settings page now truthfully explains that slot overlays participate in runtime loading instead of calling them status-only.
  - Added focused regression coverage in:
    - `apps/desktop/src/main/config.runtime-layers.test.ts`
    - `apps/desktop/src/main/agents-files/modular-config.test.ts`
    - `apps/desktop/src/main/agents-files/agent-profiles.test.ts`
    - updated source-level assertions in `agents-layer-resolution.foundation.test.js` and `settings-capabilities.restore-backup.test.js`
- Verification run:
  - Completed: `node --test apps/desktop/src/main/agents-layer-resolution.foundation.test.js apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc -p tsconfig.json --noEmit` ✅
  - Completed: `git diff --check` ✅
  - Blocked by local environment: `pnpm run test:run -- src/main/config.runtime-layers.test.ts src/main/agents-files/modular-config.test.ts src/main/agents-files/agent-profiles.test.ts` ❌ because the workspace is missing package binaries/deps (`vitest`/`tsup` not found; pnpm warns `node_modules` is missing).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Make profile/config editing semantics slot-aware where appropriate; today this slice activates slot reads, but some write paths still target the writable global/workspace layer rather than writing back into a slot.
  - Add explicit switch/promote/import actions so users do not have to hand-edit `bundle-slots/active-slot.json`.
  - Surface active slot paths more explicitly in settings/help text if users need to inspect the effective layer stack.
  - Re-run the new Vitest coverage once package dependencies are available in the workspace.

- Next recommended issue work item: if staying on `#57`, tackle the first honest write-path follow-up (especially agent-profile/config persistence semantics under an active slot); otherwise refresh open issues and pick the next concrete desktop bug/reliability slice.

##### Issue #57 — Feature: Bundle load/unload safety — slot-aware prompt/profile persistence follow-up

- Selection rationale:
  - Re-read `issue-work.md` first and followed the prior recommended next step instead of jumping to a broader speculative feature.
  - Issue `#57` already had the runtime read-side slot overlay landed, and the owner follow-up explicitly called out bundle slots / easy swapping as part of the trust track.
  - The most concrete remaining reliability gap was local and testable: effective profiles/prompts could be read from an active slot, but edits still tended to persist into the default writable layer rather than the layer that supplied the visible data.
- Investigation:
  - Re-read issue `#57` plus the owner comments, especially the follow-up requirement that the runtime loader mount the active slot as its own layer for easy bundle swapping without config loss.
  - Re-inspected `apps/desktop/src/main/agent-profile-service.ts` and confirmed two concrete problems:
    - `syncPromptsFromLayer(...)` only read prompt files from the topmost runtime layer, so a workspace overlay with no prompt files could mask valid slot/global prompt files below it.
    - `saveSingleProfile(...)` and delete flows still targeted the global layer, so editing a profile sourced from an active slot would write back to the wrong layer.
  - Re-checked `apps/desktop/src/main/agents-files/modular-config.ts` and confirmed prompt writes only had a combined `writeAgentsPrompts(...)` helper, making per-file layered persistence awkward.
- Important assumptions:
  - Assumption: for this slice, existing profiles/prompts should write back to their effective origin layer, but brand-new generic profile creation can still fall back to `writableLayer`.
  - Why acceptable: the prior runtime-layer landing explicitly kept `writableLayer = workspace ?? global`, and changing new-item authoring semantics to default into slots would be a larger UX decision than this narrow bug fix.
  - Assumption: deleting a profile should delete the effective origin-layer copy only, even if a lower-priority version could later become visible again.
  - Why acceptable: that behavior matches layered override semantics and is safer than silently deleting lower layers the user may not intend to mutate.
  - Assumption: dependency-free source-level node tests plus desktop TypeScript validation are sufficient verification for this persistence-layer follow-up.
  - Why acceptable: the patch is confined to main-process layering/persistence logic, the new regression tests pass locally, and `tsc` passes for the desktop app in this workspace.
- Changes implemented:
  - Updated `apps/desktop/src/main/agent-profile-service.ts` to track `profileOriginById` from merged layered profile loads and resolve later saves/deletes back to the profile's origin layer before falling back to `writableLayer`.
  - Fixed prompt loading in `agent-profile-service.ts` so system prompt and agents guidelines are discovered from the highest available runtime layer for each file independently instead of assuming the topmost overlay has both files.
  - Updated prompt persistence in `agent-profile-service.ts` so main-agent prompt files write back to their prompt source layer (or the main-agent profile layer as a fallback) rather than collapsing everything into one default layer.
  - Added per-file prompt write helpers in `apps/desktop/src/main/agents-files/modular-config.ts` so `system-prompt.md` and `agents.md` can persist independently when their effective sources differ.
  - Added focused source-level regression coverage in `apps/desktop/src/main/agent-profile-slot-persistence.test.js` for layered profile-origin persistence and prompt-layer resolution.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/agent-profile-slot-persistence.test.js` ✅
  - Completed: `node --test apps/desktop/src/main/agents-layer-resolution.foundation.test.js` ✅
  - Completed: `pnpm exec tsc --noEmit -p apps/desktop/tsconfig.json` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Extend the same slot-aware origin semantics to broader config write paths where active-slot overrides are editable from settings screens.
  - Add explicit slot UX actions (`switch slot`, `clear slot`, `import into new/current slot`, `promote current config to slot`) so users do not rely on manual pointer edits.
  - Decide whether deleting an override should surface lower-priority versions immediately in UI or offer a clearer layered-delete affordance.
  - Revisit deeper runtime/integration coverage once the full desktop test runner environment is consistently available.

- Next recommended issue work item: stay on `#57` for one more small slice only if it tackles a concrete write-path or slot-action gap (most likely broader config save semantics or explicit slot-switch actions); otherwise refresh open issues and pick the next well-scoped desktop bug/reliability issue.

##### Issue #57 — Bundle slots: explicit switch / clear actions in Settings → Capabilities

- Selection rationale:
  - Followed the latest `issue-work.md` recommendation first instead of reopening a broader issue.
  - The remaining gap was concrete and user-facing: slot state was visible in Settings → Capabilities, but users still had to hand-edit `bundle-slots/active-slot.json` to actually switch or clear the active slot.
  - This was a small, reviewable trust/UX slice of `#57` with a direct local implementation path across config, TIPC, and the existing desktop settings page.
- Investigation:
  - Re-read issue `#57` plus the earlier ledger notes and confirmed explicit slot actions were still listed as a remaining follow-up after the slot-aware runtime read/persistence work.
  - Re-inspected `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed the page already showed `Active slot` state and discovered slot directories, but exposed no action beyond `Open Slots Folder`.
  - Re-inspected `apps/desktop/src/main/config.ts` and confirmed there was a read-side `getActiveBundleSlotState()` contract but no write helper for the active-slot pointer.
  - Re-inspected `apps/desktop/src/main/tipc.ts` and confirmed there was already a reusable runtime refresh helper used after bundle imports, making explicit slot switching a narrow follow-up rather than a new architecture.
- Important assumptions:
  - Assumption: a first explicit slot-action slice only needs `Use Slot` and `Clear Active Slot`, not the larger `import into new/current slot` or `promote current config to slot` workflows.
  - Why acceptable: the issue thread and earlier ledger notes explicitly called out manual pointer editing as the immediate UX gap, and these two actions remove that friction without broadening scope.
  - Assumption: clearing the active slot should still persist a fresh `lastSwitchedAt` timestamp rather than deleting `active-slot.json` entirely.
  - Why acceptable: it preserves useful provenance for the Settings UI while still expressing “no active slot selected” cleanly.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: bundle-slot activation is wired through the desktop Electron `.agents` layering/runtime path, and the mobile app does not expose the same filesystem-backed slot model.
- Changes implemented:
  - Added `setActiveBundleSlot(slotId: string | null)` in `apps/desktop/src/main/config.ts` to validate discovered slot IDs, persist `active-slot.json` safely with backups, and return updated slot state.
  - Reused the existing main-process runtime refresh path in `apps/desktop/src/main/tipc.ts` via new `setActiveBundleSlot` and `clearActiveBundleSlot` procedures so switching a slot also reloads config, agent profiles, skills, loops, memories, and MCP state.
  - Updated `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` to add per-slot `Use Slot` actions, an `Active` disabled state, a `Clear Active Slot` button, success/error toasts, and query invalidation for runtime-layer-dependent renderer caches.
  - Extended `apps/desktop/src/main/config.runtime-layers.test.ts` with a focused unit test covering persisted slot switching.
  - Updated source-level regression coverage in `apps/desktop/src/main/agents-layer-resolution.foundation.test.js` and `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` to assert the new config/TIPC/UI wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/agents-layer-resolution.foundation.test.js apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `pnpm exec tsc --noEmit -p apps/desktop/tsconfig.json` ✅
  - Completed: `git diff --check` ✅
  - Blocked by local environment: `pnpm --filter @dotagents/desktop exec vitest run src/main/config.runtime-layers.test.ts` ❌ because this workspace is missing installed package binaries/dependencies (`vitest` not found; pnpm also reports missing `node_modules`).
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Add explicit slot-targeted import flows (`import into current slot` / `import into new slot`) so bundle workflows can use slots directly instead of only switching existing ones.
  - Extend the same clarity to broader settings/config save paths if users can edit values that are currently sourced from an active slot override.
  - Consider a `promote current config to slot` or similar workflow if slot authoring becomes a common desktop path.
  - Re-run the new Vitest coverage once package dependencies are available in the workspace.

- Next recommended issue work item: stay on `#57` only if the next slice is another narrow slot workflow (most likely slot-targeted import/promote actions or broader config-save semantics); otherwise refresh open issues and pick the next concrete desktop reliability/UX bug.

##### Issue #57 — Bundle import: explicit active-slot target in the existing import dialog

- Selection rationale:
  - Stayed on `#57` because the previous ledger entry explicitly called out slot-targeted import as the next concrete, user-facing gap.
  - This is a narrow trust/UX slice with immediate value: users can now route an import into the active bundle slot instead of always merging into the writable workspace/global layer.
  - It fits the issue’s stretch-goal direction without attempting the larger “new slot” authoring workflow in one pass.
- Investigation:
  - Re-read issue `#57` and confirmed the remaining slot-related gap sits under the same bundle-safety/try-without-fear theme.
  - Re-inspected `apps/desktop/src/main/tipc.ts` and confirmed both `previewBundleWithConflicts` and `importBundle` always resolved `writableLayer.paths.agentsDir`, so there was no explicit way to preview/import into the active slot.
  - Re-inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the existing dialog already owned the pre-import preview/import flow, making it the smallest place to add an explicit target selector.
  - Re-inspected `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed restore-backup uses the same dialog, so restore-specific behavior needed to stay pinned to the restore path rather than inherit slot targeting automatically.
- Important assumptions:
  - Assumption: the most valuable first slot-targeted import slice is `import into active slot`, not full `import into new slot` creation.
  - Why acceptable: the issue already has active-slot runtime state and recent slot activation UX; using that existing state keeps the change small and directly useful.
  - Assumption: active slot state can be treated as stable for the lifetime of one import dialog session.
  - Why acceptable: slot switches are a local desktop action, the dialog re-previews when the user toggles target mode, and the main process still guards against missing active-slot state during import.
  - Assumption: restore-backup should not expose slot-target selection in this slice.
  - Why acceptable: restore is framed as safety recovery, so keeping it anchored to the current restore flow avoids surprising target changes while still allowing normal bundle imports to use slots.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: this workflow is desktop/Electron-specific and depends on the desktop `.agents` layering + filesystem slot model.
- Changes implemented:
  - Extended `apps/desktop/src/main/tipc.ts` with a narrow `targetMode` contract (`default` vs `active-slot`) plus centralized target resolution so preview/import can resolve either the writable layer or the active slot while still merging conflict previews across `global -> slot -> workspace` ordering.
  - Updated `apps/desktop/src/main/bundle-service.ts` so callers can label slot-targeted previews and automatic pre-import backups with `targetLayer: "slot"` instead of falling back to `custom`.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` to fetch current slot state, show an `Import target` selector when an active slot exists, re-preview the same bundle when the user switches target mode, and pass the explicit active-slot target through the existing import pipeline.
  - Kept restore-backup pinned to the current restore semantics by passing `allowImportTargetSelection={false}` from `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx`, while also teaching the settings page to render `Bundle slot` labels for backup metadata.
  - Extended lightweight regression coverage in `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js`, `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js`, and `apps/desktop/src/main/agents-layer-resolution.foundation.test.js` to lock in the new target-mode wiring and restore guardrail.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js apps/desktop/src/main/agents-layer-resolution.foundation.test.js` ✅
  - Completed: `pnpm --filter @dotagents/desktop exec tsc --noEmit` ✅
  - Completed: `git diff --check` ✅
- Branch / PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Add a complementary `import into new slot` flow so users can create a fresh isolated slot during import rather than only targeting the current active slot.
  - Consider whether the dialog should preserve per-item conflict overrides when re-previewing across targets, not just item selections.
  - Extend similar slot-target clarity to other write paths that may still implicitly save into the writable layer while an active slot is mounted.
  - Add deeper runtime/integration coverage once the full desktop test runner environment is reliably available.

- Next recommended issue work item: either stay on `#57` for one last narrow slot-authoring/import slice (`import into new slot` or config-save semantics), or refresh open issues and switch to the next concrete desktop reliability bug if another `#57` slice would stop being obviously reviewable.

##### Issue #57 — Bundle import: create a fresh slot directly from the import dialog

- Selection rationale:
  - Re-read `issue-work.md` first and followed the immediately recommended next step from the prior `#57` entry instead of reopening a broader or already-blocked issue.
  - Refreshed the still-open issues and briefly re-checked `#54`; it remains blocked on auth/model-transport feasibility, so the best actionable slice was the next trust/slot UX step on `#57`.
  - This is a small, reviewable extension of the already-landed active-slot target work: users can isolate a bundle import into a brand-new slot without hand-creating slot folders first.
- Investigation:
  - Re-read issue `#57` and its slot-oriented follow-ups, then re-inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx`, `apps/desktop/src/main/tipc.ts`, and `apps/desktop/src/main/config.ts`.
  - Confirmed the dialog currently supported `default` and `active-slot` targets only, while the prior ledger entry explicitly called out `import into new slot` as the cleanest next gap.
  - Confirmed slot discovery/switch state already exists in config/settings, but there was no helper to validate/create a new slot directory for import-time targeting.
  - Re-checked the provider/OAuth surfaces for open issue `#54` plus recent external references and still did not find a supportable repo-local implementation path that would be safer than this `#57` slice.
- Important assumptions:
  - Assumption: importing into a new slot should create the slot but should **not** auto-activate it.
  - Why acceptable: switching the active slot is already an explicit user action in Settings → Capabilities, and silently changing the effective runtime layer during import would be a riskier surprise.
  - Assumption: a first slice can auto-suggest the new slot id from the bundle name instead of adding a fully editable slot-naming form.
  - Why acceptable: it keeps the UX small and predictable while still creating a visible isolated destination; a richer naming flow can follow later if needed.
  - Assumption: previewing a new-slot import should compare against `global` + `workspace` layers, not the currently active slot.
  - Why acceptable: the new slot is staged as an alternative layer rather than merged with the current active slot, so comparing against the eventual surrounding stack is less misleading than flagging the current active slot as a direct conflict target.
- Changes implemented:
  - Added `getBundleSlotDirectory(...)` and `createBundleSlot(...)` in `apps/desktop/src/main/config.ts` so slot-targeted imports can validate ids and create fresh slot directories through shared config helpers.
  - Extended `apps/desktop/src/main/tipc.ts` with a new bundle import target mode, `new-slot`, and passed optional `newSlotId` through preview/import/restore entrypoints.
  - Updated target resolution so preview/import into a new slot writes to a fresh slot directory, refuses collisions with existing slot ids, and only creates the slot on the mutating import path.
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` to expose `New bundle slot (...)` alongside the existing target choices, show the derived slot id, and route preview/import requests with the new target metadata.
  - Extended `apps/desktop/src/main/config.runtime-layers.test.ts`, `apps/desktop/src/main/agents-layer-resolution.foundation.test.js`, and `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to cover the new config helper and slot-targeted dialog/TIPC wiring.
- Verification run:
  - Attempted: `pnpm --filter @dotagents/desktop exec vitest run src/main/config.runtime-layers.test.ts src/main/agents-layer-resolution.foundation.test.js src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js`
  - Result: blocked because this worktree does not have installed package dependencies / `node_modules`; PNPM failed before running tests (`vitest` unavailable locally).
  - Attempted: `pnpm --filter @dotagents/desktop typecheck`
  - Result: blocked for the same environment reason (desktop toolchain dependencies are not installed in this worktree).
  - Completed: `node --test apps/desktop/src/main/agents-layer-resolution.foundation.test.js apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `git diff --check` ✅
  - Confidence: moderate-to-high for this narrow config/TIPC/renderer slice; the dependency-free regression tests pass, while full desktop Vitest/typecheck verification remains blocked on missing local dependencies.
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Decide whether users should eventually be able to edit the suggested new-slot id inline before preview/import instead of always using the derived bundle-name slug.
  - Consider preserving per-item conflict overrides (not just item selections) when re-previewing across import targets.
  - Extend the same slot-target clarity to any remaining settings/config write paths that may still implicitly save into the writable layer while an active slot is mounted.
  - Re-run the blocked desktop Vitest/typecheck verification once package dependencies are available in this worktree.

- Next recommended issue work item: if staying on `#57`, take one more honest slot workflow slice only if it directly improves write semantics or slot naming/editability; otherwise refresh the open issues again and keep `#54` blocked until there is concrete auth/model-transport feasibility evidence.

##### Issue #57 — Bundle import: make the new-slot id editable before import

- Selection rationale:
  - Re-read `issue-work.md` first and followed the most recent `#57` recommendation instead of re-triaging the whole issue list again.
  - This was the smallest remaining user-visible gap on the new-slot import path: the dialog could create a fresh slot, but users could not rename the suggested slot id inline before importing.
  - It is a focused desktop UX improvement with immediate value and low blast radius because it stays inside the existing bundle import dialog.
- Investigation:
  - Re-checked issue `#57`, recent ledger notes, and the open issue list for the current repo; `#54` still lacked a safe local implementation path, so the best actionable next slice remained on `#57`.
  - Re-inspected `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` and confirmed the `New slot id` input was rendered as read-only and always used the derived slug from the bundle name.
  - Re-checked `apps/desktop/src/main/tipc.ts` and `apps/desktop/src/main/config.ts` to confirm backend support for `new-slot` imports already existed, so this follow-up could stay renderer-only if the dialog validated ids before import.
  - Re-inspected the lightweight source-level regression coverage in `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` and confirmed it was the fastest reliable place to lock in the new behavior.
- Important assumptions:
  - Assumption: local dialog validation can mirror the existing backend slot-id rules instead of adding a second main-process API just for live validation.
  - Why acceptable: the main process still remains the source of truth on import, while the renderer can prevent the obvious empty/invalid/already-existing cases and keep this slice narrow.
  - Assumption: changing the typed new-slot id does not require a fresh conflict preview for every keystroke in this first pass.
  - Why acceptable: for a valid brand-new slot, the meaningful change is the destination path and collision guardrail; the import button is disabled for invalid/existing ids and the underlying import still uses the current typed value.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the bundle import dialog and bundle slot model are desktop/Electron-only workflows.
- Changes implemented:
  - Updated `apps/desktop/src/renderer/src/components/bundle-import-dialog.tsx` so `New slot id` is now editable, seeded from the suggested bundle-name slug, and preserved until the dialog closes.
  - Added renderer-side slot-id validation for empty ids, invalid characters/length, and collisions with already-known slot ids, then disabled import and surfaced an inline error until the target is valid.
  - Updated the dialog’s new-slot label and destination-path copy so the UI reflects the current typed slot id rather than the original auto-suggested slug.
  - Extended `apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` to cover the editable input, validation helper wiring, and the stricter import-disable condition.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/components/bundle-import-dialog.conflict-preview.test.js` ✅
  - Completed: `pnpm exec tsc --noEmit -p apps/desktop/tsconfig.json` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Decide whether the dialog should re-run preview automatically after a valid new-slot id edit so the preview target path and any slot-specific guardrails update immediately rather than only at import time.
  - Consider preserving per-item conflict overrides (not just selected items) when users switch between default / active-slot / new-slot targets.
  - Review whether other settings/config write paths should expose similar active-slot vs writable-layer clarity.
- Next recommended issue work item: refresh the open issues again and only stay on `#57` if there is one more very small write-semantics or preview-sync follow-up; otherwise move to the next concrete desktop reliability/UX issue and keep `#54` blocked until feasibility changes.

##### Issue #56 — Bundle inspector: repeat-task prompts now lead with a preview

- Selection rationale:
  - Re-read `issue-work.md` first and deliberately pivoted away from another immediate `#57` slot follow-up to avoid over-focusing one issue when other open issues still had clean local UX slices.
  - `#56` remained open, and the recent ledger entries had already improved skills and agent prompts with preview-first rendering while explicitly noting repeat-task prompts as the next likely density problem on mobile.
  - This was a small, reviewable website-only slice with direct user value: bundle visitors can scan repeat tasks faster without losing access to the full prompt.
- Investigation:
  - Re-read issue `#56` plus the owner comment, which still frames inspect-before-install as a trust surface and explicitly includes repeat tasks in the modal's v1 content model.
  - Re-inspected `website/index.html` and confirmed the modal already used `buildMarkdownPreview(...)` for agent prompts and skills, but repeat tasks still rendered `renderMarkdown(task.prompt)` inline with no truncation or details affordance.
  - Re-checked `website/website-hub-inspector.test.js` and confirmed the regression coverage locked schedule/behavior copy for repeat tasks but did not yet assert preview-first rendering for task prompts.
- Important assumptions:
  - Assumption: repeat-task prompts should follow the same preview-first pattern already used for skills and agent prompts, even though the original issue text only explicitly called out previews for skills/agents.
  - Why acceptable: the owner comment emphasizes mobile-friendly inspection and the current repeat-task prompts contribute to the same modal-density problem; keeping full content behind an inline details affordance preserves trust while improving scanability.
  - Assumption: a dependency-free website regression test plus inline script syntax parsing are sufficient verification for this static landing-page slice.
  - Why acceptable: the change only touches `website/index.html` and its existing no-dependency test file, and both targeted checks pass locally.
- Changes implemented:
  - Updated `website/index.html` so repeat tasks now derive a prompt preview with `buildMarkdownPreview(...)` instead of always rendering the full prompt inline.
  - Added a `Show full repeat task prompt` inline details affordance for truncated task prompts, reusing the existing `bundle-inline-details` pattern already used by agent and skill previews.
  - Extended `website/website-hub-inspector.test.js` with source-level assertions covering the repeat-task preview helper usage and full-prompt details affordance.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: inline website script syntax parse via Node (`new Function(...)`) ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - If the modal still feels dense on very small screens, consider whether memories or MCP sections need similar compact/expand treatment without hiding important trust signals.
  - If the landing-page hub grows beyond curated featured bundles, keep the preview/details behavior consistent across all bundle-card entry points.
  - Continue keeping the inspector trust-focused rather than turning it into a full browser-side bundle manager/editor.

- Next recommended issue work item: refresh the open issues again and prefer either a fresh desktop bug/reliability slice or another equally small website trust improvement; keep `#54` blocked until provider/auth feasibility materially changes.

##### Issue #58 — Remote conversation writes preserve compaction summary metadata

- Selection rationale:
  - Re-read `issue-work.md` first and followed the latest recommendation to prefer a fresh desktop reliability slice rather than immediately forcing another `#57`/`#56` micro-follow-up.
  - Refreshed the open issues and chose `#58` because it still maps directly to trust/auditability, and the current source exposed one narrow unaddressed metadata-loss path in the remote conversation API.
  - This was a small, reviewable main-process change with direct value: summarized conversation markers should survive remote/mobile conversation saves instead of being silently stripped.
- Investigation:
  - Re-read issue `#58` and confirmed its scope still explicitly includes preserving summarized/full-history provenance rather than only adding UI affordances.
  - Inspected `apps/desktop/src/main/remote-server.ts` and confirmed the remote `POST /v1/conversations` and `PUT /v1/conversations/:id` handlers rebuilt incoming messages with only `role`, `content`, `timestamp`, `toolCalls`, and `toolResults`.
  - Confirmed the same routes also omitted `isSummary` / `summarizedMessageCount` from their response payloads, even though the `GET /v1/conversations/:id` recovery route already preserves those fields.
  - Cross-checked `apps/mobile/src/lib/syncService.ts` and verified mobile already preserves summary metadata in `toServerMessage(...)`, so the server-side stripping was a real contract mismatch rather than dead code.
  - Reused the existing dependency-light source assertions in `apps/desktop/src/main/remote-server.conversation-history-response.test.js` and `conversation-storage-integrity.test.js` as the fastest reliable regression guard for this path.
- Important assumptions:
  - Assumption: this iteration should preserve per-message summary metadata on the existing remote create/update contract, not broaden the API to accept full `rawMessages` / `compaction` payloads yet.
  - Why acceptable: the source-confirmed loss today is the stripping of `isSummary` / `summarizedMessageCount` from normal message writes, and fixing that closes the immediate provenance bug without widening the sync payload surface in the same pass.
  - Assumption: source-level regression tests plus a focused desktop TypeScript check are sufficient verification for this change.
  - Why acceptable: the patch is isolated to `remote-server.ts` request/response mapping with no runtime behavior outside the typed Fastify handlers, and the targeted checks passed locally.
- Changes implemented:
  - Updated `apps/desktop/src/main/remote-server.ts` so remote conversation create/update request bodies now accept `isSummary` and `summarizedMessageCount` on incoming messages.
  - Preserved those summary fields when mapping incoming POST and PUT payloads into stored conversation messages, including both the PUT-create and PUT-update branches.
  - Returned the same summary metadata in the POST and PUT response payloads so clients immediately receive the persisted provenance markers back, matching the existing GET recovery route.
  - Extended `apps/desktop/src/main/remote-server.conversation-history-response.test.js` with route-specific source assertions that the create/update handlers preserve summary metadata on both write and response paths.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/remote-server.conversation-history-response.test.js apps/desktop/src/main/conversation-storage-integrity.test.js` ✅
  - Completed: `pnpm exec tsc --noEmit -p apps/desktop/tsconfig.json` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - If mobile/server sync later needs true preserved full-history round-tripping, extend the shared create/update conversation request types to optionally carry `rawMessages` / `compaction` and plumb that through the sync client explicitly.
  - If a live repro still shows metadata loss, inspect any remaining non-remote save/update paths that rebuild `Conversation.messages` without copying summary fields.
  - When a fuller desktop/mobile environment is available, add runtime request/response coverage for these remote conversation routes rather than relying only on source assertions.
- Next recommended issue work item: refresh the open issues again and prefer either a fresh direct-value desktop bug/reliability slice or another equally concrete `#58` storage-contract follow-up only if a new source-confirmed metadata-loss path appears.

##### Issue #58 — Remote conversation create/update contract now accepts preserved raw history fields

- Selection rationale:
  - Re-read `issue-work.md` first and followed the latest recommendation literally: only stay on `#58` if another source-confirmed storage-contract gap appeared.
  - Refreshed the open issues and re-checked nearby code before changing anything; the clearest new gap was that remote conversation `GET` already returned `rawMessages` / `compaction`, but the shared create/update request contract still could not carry those fields back.
  - This was a small, reviewable reliability slice with direct user value: it closes one more history-loss path on the remote API without attempting a broader mobile-state refactor in the same pass.
- Investigation:
  - Re-read issue `#58` and confirmed it still centers on preserving full conversation history and compaction provenance, not merely rendering summarized markers.
  - Inspected `packages/shared/src/api-types.ts` and confirmed `CreateConversationRequest` / `UpdateConversationRequest` only allowed `messages`, so the typed remote contract still prevented clients from sending preserved raw history even though `ServerConversationFull` exposed it on reads.
  - Inspected `apps/desktop/src/main/remote-server.ts` and confirmed the remote `POST /v1/conversations` and `PUT /v1/conversations/:id` handlers similarly had no request-body support for `rawMessages` / `compaction`, and their responses still omitted those fields after writes.
  - Re-checked `apps/mobile/src/lib/syncService.ts` and confirmed mobile sync still only pushes the active `messages` window today; that means the smallest honest slice here was to align the shared/server contract first and explicitly document the remaining client-side plumbing gap.
- Important assumptions:
  - Assumption: this iteration should extend the remote/shared contract to preserve `rawMessages` / `compaction` when clients send them, but should not yet refactor mobile session state to persist full raw history locally.
  - Why acceptable: the contract gap was source-confirmed and self-contained, while mobile-side full-history persistence is a larger follow-up that would touch store/state semantics beyond one reviewable slice.
  - Assumption: when an update request changes normal `messages` but omits `rawMessages` / `compaction`, the server should preserve any existing stored raw-history fields rather than clearing them implicitly.
  - Why acceptable: issue `#58` prioritizes not silently discarding preserved history; preserving prior raw-history metadata is safer than deleting it for older clients that still only know about `messages`.
  - Assumption: source-level regression tests plus a focused desktop TypeScript check are sufficient verification for this contract-alignment slice.
  - Why acceptable: the behavior change is isolated to request/response typing + route mapping logic, and the targeted checks pass locally.
- Changes implemented:
  - Extended `packages/shared/src/api-types.ts` so `CreateConversationRequest` and `UpdateConversationRequest` now optionally accept `rawMessages` and `compaction` alongside `messages`.
  - Updated `apps/desktop/src/main/remote-server.ts` so remote conversation create/update handlers now validate optional `rawMessages` arrays and optional compaction metadata, map those fields into stored conversations, and return them in POST/PUT responses.
  - Kept the update path preservation-friendly: if callers omit `rawMessages` / `compaction`, existing stored raw-history fields are retained instead of being silently dropped.
  - Extended `apps/desktop/src/main/remote-server.conversation-history-response.test.js` with source assertions covering request-body support, stored mapping, and response payload preservation for `rawMessages` / `compaction`.
  - Added `packages/shared/src/api-types.conversation-history.test.js` to lock in the shared request-contract shape for future regressions.
- Verification run:
  - Completed: `node --test apps/desktop/src/main/remote-server.conversation-history-response.test.js packages/shared/src/api-types.conversation-history.test.js` ✅
  - Completed: `pnpm exec tsc --noEmit -p apps/desktop/tsconfig.json` ✅
  - Attempted: `pnpm exec tsc --noEmit -p apps/mobile/tsconfig.json`
  - Result: blocked by the pre-existing mobile worktree environment (`apps/mobile/tsconfig.json` references missing `expo/tsconfig.base`, plus widespread missing Expo/React Native type dependencies unrelated to this slice).
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #58:
  - Plumb `rawMessages` / `compaction` through the actual mobile sync client once session/local state can persist full raw history rather than only the active message window.
  - Add runtime request/response coverage for the remote conversation routes when a fuller Fastify/Vitest environment is available, instead of relying only on source assertions.
  - If a live repro still shows history loss, inspect any remaining non-remote update paths that overwrite conversations after lazy-loading full history.
- Next recommended issue work item: refresh the open issues again and prefer a fresh direct-value desktop bug/UX slice next; only stay on `#58` if another concrete, source-confirmed full-history persistence gap appears beyond the now-aligned remote/shared write contract.

##### Issue #56 — Bundle inspector: expandable MCP config/details in the website modal

- Selection rationale:
  - Re-read `issue-work.md` first and avoided immediately mining `#58` again after the remote history-contract work landed.
  - Refreshed the open issues plus issue details/comments and confirmed `#56` still had a clean trust-focused follow-up inside the existing website inspector: MCP sections showed name + transport + one-line command preview, but fuller bundled config details still stayed opaque unless you installed the bundle.
  - This was a small, reviewable website-only slice with direct user value and quick verification.
- Investigation:
  - Re-read issue `#56` and its owner comment; the trust goal is inspect-before-install, and MCP commands/config are explicitly part of that surface.
  - Inspected `website/index.html` and confirmed the modal already had preview-first treatment for agent prompts, skills, and repeat tasks, but MCP servers still rendered only `getMcpConnectionPreview(server)` plus the setup-requirements note.
  - Confirmed there was already nearby website-only source coverage in `website/website-hub-inspector.test.js`, making this a safe place to lock in another small trust affordance without introducing broader frontend tooling.
- Important assumptions:
  - Assumption: keeping the existing one-line MCP preview visible and adding an optional inline `Show full MCP config` details block is preferable to dumping structured config inline for every server.
  - Why acceptable: it preserves the current scan-friendly modal density while still letting cautious users inspect the actual bundled MCP wiring before installing.
  - Assumption: showing bundled URLs, args, config JSON, and redacted-secret field names is acceptable for public bundle inspection because the bundle format is already public-safe and secret values themselves are not rendered here.
  - Why acceptable: the issue is specifically about trust-through-inspection, and these fields are precisely what users need to judge MCP safety without exposing hidden secret contents.
- Changes implemented:
  - Added `renderMcpServerDetails(server)` to `website/index.html`.
  - The website inspector now shows an inline `Show full MCP config` affordance whenever a bundle MCP server includes extra inspectable detail such as a bundled URL, args array, config object, or redacted-secret field hints.
  - The inline details render structured MCP data using the existing `bundle-inline-details` / `bundle-command` styles so the modal stays readable on small screens.
  - Extended `website/website-hub-inspector.test.js` to lock in the new MCP details helper, the inline details affordance, and the structured JSON/config rendering hooks.
- Verification run:
  - Completed: `node --test website/website-hub-inspector.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #56:
  - Consider whether memories should eventually show lightweight item-level previews (for example, ids/titles only) or remain count + warning only as currently suggested by the owner comment.
  - Consider richer MCP formatting later (for example, grouped env/headers/transport sections) only if the current JSON/details view proves insufficient in practice.
  - Keep the inspector trust-focused; avoid turning the website into a full browser-side bundle editor/manager.
- Next recommended issue work item: refresh the open issues again and prefer a concrete desktop bug/reliability slice next; only continue `#56` if another similarly small inspect-before-install clarity gap is directly visible in source.

##### Issue #55 — Added dependency-free regression coverage after the desktop test runner stayed blocked

- Selection rationale:
  - After committing the `#56` website slice, refreshed the next iteration toward the remaining open bug work.
  - Re-checked `#55` first because it is still the clearest open bug, but avoided speculative UI churn by trying to verify the previously-landed tile/header fixes before changing behavior again.
  - When the full desktop test runner was still blocked by missing workspace dependencies, converted that blocker into a smaller reliability slice: add no-dependency source tests so this worktree can still protect the specific `#55` regressions.
- Investigation:
  - Confirmed the branch was clean, then attempted the previously relevant desktop checks:
    - `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/agent-progress.tile-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts`
    - `node --test apps/desktop/src/renderer/src/components/session-grid.collapsed-layout.test.js`
  - The existing no-dependency collapsed-grid test passed, but the full desktop test runner failed before running Vitest because `pnpm run pretest` shells into `pnpm -w run build:shared`, which currently cannot find `tsup` in this worktree (`node_modules` missing / not installed).
  - Re-inspected the current source and confirmed the `#55` safeguards are still present in code (`showTileExpandAction`, ACP profile-name suppression, collapsed-tile ordering, collapsed-layout drag disablement), so the highest-value move here was to make those checks executable without package installs.
- Important assumptions:
  - Assumption: source-level node tests are an acceptable follow-up slice for `#55` while the full desktop toolchain remains unavailable in this worktree.
  - Why acceptable: the issue-specific logic is already expressed in source-level terms, and the immediate goal was to keep the bug fix verifiable instead of waiting on an environment repair.
  - Assumption: it is better to add portable issue-specific tests than to install dependencies or otherwise mutate the environment during this automated loop.
  - Why acceptable: dependency installation requires explicit permission in general and would be broader/riskier than the targeted regression coverage needed here.
- Changes implemented:
  - Added `apps/desktop/src/renderer/src/components/agent-progress.issue55-regressions.test.js` to assert the snoozed/maximize action guard and ACP duplicate-name suppression directly from `agent-progress.tsx`.
  - Added `apps/desktop/src/renderer/src/pages/sessions.issue55-collapsed-layout.test.js` to assert collapsed-tile packing order and drag-reorder disablement directly from `sessions.tsx`.
  - Re-used the existing `apps/desktop/src/renderer/src/components/session-grid.collapsed-layout.test.js` as part of the same no-dependency verification bundle.
- Verification run:
  - Attempted: `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/components/agent-progress.tile-layout.test.ts src/renderer/src/pages/sessions.layout-controls.test.ts`
  - Result: blocked before Vitest by the pre-existing workspace dependency gap (`tsup: command not found` during `pnpm -w run build:shared`; local `node_modules` missing).
  - Completed: `node --test apps/desktop/src/renderer/src/components/agent-progress.issue55-regressions.test.js apps/desktop/src/renderer/src/pages/sessions.issue55-collapsed-layout.test.js apps/desktop/src/renderer/src/components/session-grid.collapsed-layout.test.js` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #55:
  - Re-run the original desktop Vitest coverage once this worktree has its expected dependencies installed again.
  - If a fresh manual repro still exists after that, investigate runtime behavior rather than adding more source-only checks; current source strongly suggests the originally reported regressions are already addressed.
  - Do not keep churning `#55` without either a new repro or a fuller runtime validation path.
- Next recommended issue work item: refresh the open issues again and prefer either a concrete runtime-repro desktop bug or a focused docs/spec sync slice for the remaining bundle/import issues if no better local bug candidate emerges.

##### Issue #25 — `.dotagents` docs/spec sync for slot-aware import targets and richer MCP inspection

- Selection rationale:
  - Re-read `issue-work.md` first and followed the latest recommendation literally: after the recent `#55` reliability follow-up, there was no sharper local runtime bug candidate than the already-covered/blocked paths.
  - Refreshed the open issues and re-checked issue `#25` plus its planning comment, which explicitly says finalized `#56`/`#57` trust defaults should keep feeding back into the umbrella `.dotagents` docs/spec.
  - This made a small docs/spec sync the next honest, non-thrashy slice.
- Investigation:
  - Re-read issue `#25` and its owner planning comment calling for `#57` import safety + `#56` inspect-before-install work to feed back into the umbrella spec.
  - Inspected `DOTAGENTS_BUNDLES.md` and confirmed it already documented earlier trust defaults, but it still described import targets in older `global/workspace/custom` language and did not yet mention active-slot/new-slot targeting or the runtime precedence contract.
  - Confirmed the same doc also stopped short of documenting the newly landed website affordance that lets users expand `Show full MCP config` to inspect bundled URL/args/config details.
  - Inspected `README.md` and confirmed the short bundle summary also lagged behind the latest slot-aware import isolation and MCP inspector improvements.
- Important assumptions:
  - Assumption: issue `#25` is the right place for current-state trust/workflow documentation updates even when the underlying feature work was landed under concrete child issues like `#56` and `#57`.
  - Why acceptable: the owner comment explicitly frames `#25` as the umbrella spec that should absorb the finalized UX/security defaults from those deliverables.
  - Assumption: this pass should stay strictly current-state and avoid promising speculative future slot/Hub behavior.
  - Why acceptable: `DOTAGENTS_BUNDLES.md` is already framed as a workflow/spec note for current repo behavior, not a roadmap commitment.
- Changes implemented:
  - Updated `DOTAGENTS_BUNDLES.md` so the preview/import trust section now documents slot-aware import targets (default writable layer, active slot, new slot) plus the current runtime precedence contract `global -> active slot -> workspace`.
  - Added a dedicated `Slot-aware import isolation` subsection to the bundle doc and updated the `Settings -> Capabilities` surface summary to include slot actions alongside backup recovery.
  - Extended the `Inspect before install` section to mention the new expandable `Show full MCP config` affordance for bundled MCP URL/args/config plus redacted-secret field hints.
  - Updated the README bundle summary bullets so the top-level project docs also reflect slot-targeted imports and richer MCP inspection defaults.
- Verification run:
  - Completed: `git diff --check` ✅
  - Manually inspected the updated `DOTAGENTS_BUNDLES.md` and `README.md` excerpts for wording/structure consistency ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #25:
  - Keep the umbrella docs aligned if future `#57` slot work changes write semantics, restore provenance, or slot-management surfaces again.
  - If the Hub inspector later exposes dependency metadata or richer MCP grouping, extend the current-state docs with that trust signal rather than leaving it implied.
  - Avoid reopening broader bundle-roadmap prose unless another concrete local docs/spec sync need appears.
- Next recommended issue work item: refresh the open issues again and prefer the next concrete runtime-repro desktop bug or reliability slice; keep `#54` blocked until provider/auth feasibility materially changes, and only revisit docs if another just-landed trust default needs syncing.

##### Issue #57 — Recent backup list now identifies slot-targeted backups by slot name

- Selection rationale:
  - Re-read `issue-work.md` first and followed the latest recommendation to refresh open issues before continuing any existing thread.
  - Refreshed current open issues and re-read issue `#57` plus its newer slot-oriented owner comment; the best remaining small trust UX slice was richer backup provenance rather than broader conflict/import refactoring.
  - This was a narrow, reviewable desktop-only improvement with direct rollback value: recent backups created from slot-targeted imports should tell the user which slot they protect.
- Investigation:
  - Re-read issue `#57` and its trust-track comments, especially the follow-up requirement around easy multi-bundle swapping and slot awareness.
  - Inspected `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` and confirmed the `Recent backups` card only rendered a generic `Bundle slot` label even when `backup.targetAgentsDir` clearly pointed at a specific slot directory.
  - Confirmed `apps/desktop/src/main/bundle-service.ts` already stores enough backup provenance for a small UI-only fix (`targetLayer` + `targetAgentsDir`), so this slice did not need a new backend contract.
  - Confirmed the same page already queries live slot metadata via `tipcClient.getBundleSlotState()`, giving the renderer enough context to resolve a backup path back to a known slot id and mark the currently active slot when applicable.
- Important assumptions:
  - Assumption: inferring the slot name from the stored `targetAgentsDir` is acceptable for this slice instead of expanding backup metadata with a separate explicit `slotId` field.
  - Why acceptable: the slot directory path is already persisted in backup metadata, current slot state exposes the canonical slot directories, and this keeps the change renderer-local and reviewable.
  - Assumption: no mobile follow-up is needed for this slice.
  - Why acceptable: the affected UI is the desktop-only `Settings -> Capabilities` bundle backup/slot surface, with no equivalent mobile affordance today.
- Changes implemented:
  - Updated the local `RecentBackup` type in `apps/desktop/src/renderer/src/pages/settings-capabilities.tsx` so backup metadata now correctly recognizes `targetLayer: "slot"`.
  - Added renderer helpers to normalize backup target paths, resolve slot-targeted backups against the live bundle-slot list, and fall back to the target directory basename when the slot is no longer present.
  - Updated the recent-backups summary line so slot-targeted backups now render as `Bundle slot "{slotId}"`, and append `(active)` when the backup matches the currently active slot.
  - Extended `apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` with source assertions covering the slot-aware backup label helper, the `slot` target-layer type, and the updated UI wiring.
- Verification run:
  - Completed: `node --test apps/desktop/src/renderer/src/pages/settings-capabilities.restore-backup.test.js` ✅
  - Completed: `pnpm exec tsc --noEmit -p apps/desktop/tsconfig.json` ✅
  - Completed: `git diff --check` ✅
- Related branch/PR status:
  - Branch: `aloops/issue-work-loop`
  - PR: not created in this iteration.
- Remaining follow-ups for issue #57:
  - Carry even richer provenance into the recent-backups list if needed (for example, imported/skipped counts or a conflict summary from the originating import plan).
  - Consider persisting an explicit `slotId` in backup metadata later if backup provenance needs to survive renamed/moved slot directories more robustly.
  - Keep aligning slot-targeted import/restore affordances with any future Hub install trust flow so bundle origin and rollback remain equally clear.
- Next recommended issue work item: refresh the open issues again and prefer another concrete desktop reliability/UX slice; if staying on `#57`, the next honest increment is richer backup/import provenance rather than broader new abstractions.
