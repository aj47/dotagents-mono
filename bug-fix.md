## Bug Fix Ledger

### Checked
- [x] 2026-03-08: `bug-fix.md` did not exist; created this ledger to avoid revisiting the same leads.
- [x] 2026-03-08: Reviewed `apps/desktop/DEBUGGING.md` for the preferred live-debugging workflow.
- [x] 2026-03-08: Reviewed repo root/app-level docs inventory for likely bug sources and validation paths.
- [x] 2026-03-08: Reviewed `visible-ui.md`, `improve-app.md`, and `streaming-lag.md` to avoid bugs already investigated recently.
- [x] 2026-03-08: Compared desktop `settings-general.tsx` Langfuse inputs against the existing mobile `SettingsScreen.tsx` draft/debounce behavior.
- [x] 2026-03-08: Searched `apps/desktop` for local log artifacts; there were no captured runtime log files in-repo for this iteration beyond the `src/main/console-logger.ts` implementation.
- [x] 2026-03-08: Compared the desktop transcript post-processing prompt editor in `settings-general.tsx` against the existing mobile `SettingsScreen.tsx` `inputDrafts.transcriptPostProcessingPrompt` debounce flow.
- [x] 2026-03-08: Attempted live desktop repro with `REMOTE_DEBUGGING_PORT=9333 ELECTRON_EXTRA_LAUNCH_ARGS='--inspect=9339' pnpm dev -- -dui -dapp`, but the workspace has no installed dependencies (`tsup: command not found` during predev).
- [x] 2026-03-08: Attempted targeted test verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse-draft.test.tsx`, but `vitest` is unavailable in this worktree (`Command "vitest" not found`).

### Not Yet Checked
- [ ] Fresh high-signal bug leads after the workspace dependencies are installed and live desktop/mobile debugging can run.
- [ ] Current desktop/mobile logs or reproducible failing tests tied to user-facing regressions once the environment blocker is cleared.
- [ ] Other desktop settings text inputs that may still save on every keystroke.

### Reproduced
- [x] **Desktop Langfuse settings save-on-every-keystroke bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx` wired the `Public Key`, `Secret Key`, and `Base URL` inputs straight to `saveConfig(...)` from each `onChange` event.
  - That means every keystroke triggered a config mutation + query invalidation round-trip while the user was still typing a credential or URL.
  - The same settings on mobile already use local drafts and deferred persistence, so this desktop behavior is an unintended parity gap rather than a deliberate product difference.
- [x] **Desktop transcript post-processing prompt save-on-every-keystroke bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx` rendered the transcript post-processing prompt dialog with a `Textarea defaultValue` and called `saveConfig({ transcriptPostProcessingPrompt: ... })` directly from `onChange`.
  - Editing a prompt is a long-form text flow, so that wiring forced a config mutation + invalidation round-trip on every keystroke while the user was still writing or pasting instructions.
  - The same setting on mobile already uses local `inputDrafts.transcriptPostProcessingPrompt` plus debounced persistence, so this was another desktop/mobile parity gap rather than an intentional immediate-save UX.

### Fixed
- [x] Updated `apps/desktop/src/renderer/src/pages/settings-general.tsx` to use local Langfuse drafts with debounced saves and blur flushes for `langfusePublicKey`, `langfuseSecretKey`, and `langfuseBaseUrl`.
- [x] Switched the page-level `saveConfig(...)` helper to merge against a `cfgRef` snapshot of the latest config so delayed Langfuse saves do not overwrite newer unrelated settings.
- [x] Added focused regression coverage in `apps/desktop/src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` for:
  - debounced public-key saving
  - blur flushing for the secret key
  - resyncing displayed drafts from saved config updates
  - merging delayed saves with the latest config snapshot
- [x] Updated `apps/desktop/src/renderer/src/pages/settings-general.tsx` so the transcript post-processing prompt dialog uses a local draft with debounced saves and blur flushes instead of saving on every keystroke.
- [x] Kept the prompt save path on the existing latest-config merge helper so delayed prompt saves cannot overwrite newer unrelated settings.
- [x] Extended `apps/desktop/src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` with focused regression coverage for:
  - debounced transcript prompt saving
  - blur flushing of the latest prompt draft without waiting for a rerender
  - resyncing the prompt draft from saved config updates

### Verified
- [x] Manual source verification: the desktop Langfuse inputs no longer call `saveConfig(...)` directly from `onChange`; they now update local draft state and use debounce/blur persistence.
- [x] Manual source verification: the desktop transcript post-processing prompt editor is now a controlled local draft and no longer calls `saveConfig(...)` directly from `onChange`.
- [x] Repository diff sanity check: `git diff --check` completed cleanly after the settings-general / test updates.
- [ ] Automated verification is currently blocked by missing workspace dependencies (`vitest`/shared build tooling unavailable).

### Blocked
- [x] Live desktop reproduction and automated tests are blocked because this worktree does not have installed dependencies (`tsup` missing in predev, `vitest` missing for targeted tests). Per instructions, I did not install dependencies without separate permission.

### Still Uncertain
- [ ] Whether any other desktop settings inputs still need the same local-draft treatment once a fully runnable environment is available.
- [ ] Whether the secret-key field should eventually move all the way to blur-only persistence for parity with mobile, rather than debounce + blur flush.
- [ ] Whether the desktop post-processing prompt editor should eventually gain explicit save/cancel dialog affordances instead of autosaving a local draft.

### Diagnosis / Rationale
- This is a clear user-facing editing bug: saving on every keystroke makes settings inputs more brittle, creates unnecessary config churn, and can invalidate/refetch state while the user is mid-edit.
- The existing WhatsApp desktop fix and the mobile Langfuse settings already establish a safer repo-local pattern: local draft first, then persist after a short pause or blur.
- Using a latest-config ref is acceptable and safer here because delayed saves must merge with the freshest config snapshot, not whichever render happened to create the timer.
- The transcript post-processing prompt is an even stronger fit for draft-first handling because it is long-form text; repeated config writes while editing or pasting a prompt are especially noisy and brittle there.
- Mobile already treats this exact setting as a draft-backed textarea, so aligning desktop with that behavior is a low-risk parity improvement rather than a new UX direction.

### Assumptions
- Assumption: debouncing these three desktop Langfuse fields is acceptable because the repo already treats similar settings inputs as draft-first on both desktop and mobile.
- Assumption: keeping the secret key on debounce + blur is acceptable for this pass because it removes the repeated-save bug with the smallest code change while preserving current desktop behavior of showing the in-progress value only in a password field.
- Assumption: debouncing the desktop transcript post-processing prompt is acceptable because the mobile settings screen already treats the same field as a local draft and prompt editing does not require per-keystroke persistence.

### Next Leads
- Once dependencies are installed, rerun the targeted test file and a focused desktop renderer verification pass for the Langfuse settings section.
- Once dependencies are installed, rerun `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` and a focused desktop verification pass for the transcript prompt editor.
- After that, inspect other desktop settings text inputs in `settings-general.tsx` for remaining immediate-save behavior.