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
- [x] 2026-03-08: Reviewed `apps/desktop/src/renderer/src/pages/settings-providers.tsx` for remaining immediate-save provider credential/base-URL inputs.
- [x] 2026-03-08: Confirmed `apps/mobile/src/screens/SettingsScreen.tsx` has no equivalent Groq/Gemini provider credential editor, so this providers-page fix is desktop-only.
- [x] 2026-03-08: Attempted targeted verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.draft.test.tsx`, but `vitest` is still unavailable in this worktree (`Command "vitest" not found`).
- [x] 2026-03-08: `git diff --check` completed cleanly after the providers-page draft-save fix and regression test additions.
- [x] 2026-03-08: Reviewed `apps/desktop/src/renderer/src/pages/settings-general.tsx` for remaining immediate-save long-form settings inputs and found the Groq STT prompt textarea still using direct `saveConfig(...)` on every keystroke.
- [x] 2026-03-08: Confirmed `apps/mobile/src/screens/SettingsScreen.tsx` has no equivalent Groq STT prompt editor, so this transcription-prompt fix is desktop-only.
- [x] 2026-03-08: Attempted verification with `pnpm --filter @dotagents/desktop typecheck:web`, but the worktree still has no installed desktop dependencies (`node_modules` missing; `@electron-toolkit/tsconfig/tsconfig.web.json` not found).
- [x] 2026-03-08: Attempted formatting verification with `pnpm --filter @dotagents/desktop exec prettier --check src/renderer/src/pages/settings-general.tsx src/renderer/src/pages/settings-general.langfuse-draft.test.tsx`, but `prettier` is unavailable in this worktree (`Command "prettier" not found`).
- [x] 2026-03-08: `git diff --check` completed cleanly after the Groq STT prompt draft-save fix and regression test additions.
- [x] 2026-03-08: Reviewed `settings-general.tsx` `Max Iterations` handling against the existing mobile `SettingsScreen.tsx` `inputDrafts.mcpMaxIterations` flow and confirmed desktop still saved/coerced on every keystroke.
- [x] 2026-03-08: Attempted targeted verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse-draft.test.tsx`, but `vitest` is still unavailable in this worktree (`Command "vitest" not found`).
- [x] 2026-03-08: `git diff --check` completed cleanly after the desktop `Max Iterations` draft-save fix and regression test additions.
- [x] 2026-03-08: Reviewed `apps/desktop/src/renderer/src/pages/settings-providers.tsx` Supertonic `Speed` / `Quality Steps` inputs and confirmed they still used controlled numeric props with valid-only `onChange` parsing.
- [x] 2026-03-08: Confirmed `apps/mobile/src/screens/SettingsScreen.tsx` has no equivalent Supertonic settings editor; mobile only shows a notice to configure Supertonic in desktop settings.
- [x] 2026-03-08: Attempted targeted verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.draft.test.tsx`, but `vitest` is still unavailable in this worktree (`Command "vitest" not found`).
- [x] 2026-03-08: `git diff --check` completed cleanly after the Supertonic numeric-draft fix and regression test additions.
- [x] 2026-03-08: Reviewed `apps/desktop/src/renderer/src/pages/settings-providers.tsx` OpenAI `TTS Speed` input and confirmed it still used uncontrolled `defaultValue` plus direct `saveConfig({ openaiTtsSpeed: ... })` from `onChange`.
- [x] 2026-03-08: Confirmed mobile handles `openaiTtsSpeed` with a controlled slider in `apps/mobile/src/screens/SettingsScreen.tsx`, so this edit is desktop-only while aligning with existing mobile commit-on-complete behavior.
- [x] 2026-03-08: Attempted targeted verification with `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.draft.test.tsx`, but `vitest` is still unavailable in this worktree (`Command "vitest" not found`).
- [x] 2026-03-08: `git diff --check` completed cleanly after the OpenAI TTS speed draft-save fix and regression test additions.

### Not Yet Checked
- [ ] Fresh high-signal bug leads after the workspace dependencies are installed and live desktop/mobile debugging can run.
- [ ] Current desktop/mobile logs or reproducible failing tests tied to user-facing regressions once the environment blocker is cleared.
- [ ] Other desktop settings text inputs that may still save on every keystroke.
- [ ] Whether adjacent numeric/text settings in `settings-general.tsx` still need draft-first handling or blur-only persistence now that `mcpMaxIterations` is covered.
- [ ] Whether any remaining provider editors outside the now-covered Supertonic / OpenAI TTS numeric fields still need draft-first handling once the environment blocker is cleared.

### Reproduced
- [x] **Desktop Langfuse settings save-on-every-keystroke bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx` wired the `Public Key`, `Secret Key`, and `Base URL` inputs straight to `saveConfig(...)` from each `onChange` event.
  - That means every keystroke triggered a config mutation + query invalidation round-trip while the user was still typing a credential or URL.
  - The same settings on mobile already use local drafts and deferred persistence, so this desktop behavior is an unintended parity gap rather than a deliberate product difference.
- [x] **Desktop transcript post-processing prompt save-on-every-keystroke bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx` rendered the transcript post-processing prompt dialog with a `Textarea defaultValue` and called `saveConfig({ transcriptPostProcessingPrompt: ... })` directly from `onChange`.
  - Editing a prompt is a long-form text flow, so that wiring forced a config mutation + invalidation round-trip on every keystroke while the user was still writing or pasting instructions.
  - The same setting on mobile already uses local `inputDrafts.transcriptPostProcessingPrompt` plus debounced persistence, so this was another desktop/mobile parity gap rather than an intentional immediate-save UX.
- [x] **Desktop providers-page credential editing save-on-every-keystroke bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-providers.tsx` wired Groq and Gemini `API Key` plus `API Base URL` inputs straight to `saveConfig(...)` from each `onChange` event in both the active and inactive provider sections.
  - That meant every typed character in a provider credential or base URL triggered a full config mutation + invalidation round-trip while the user was still entering secrets or editing an endpoint.
  - Unlike the earlier general-settings fixes, there is no separate mobile editor for these provider credentials, so this is a desktop-only broken editing flow rather than a parity-only gap.
- [x] **Desktop Groq STT prompt save-on-every-keystroke bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx` rendered the Groq STT `Prompt` textarea with `defaultValue={configQuery.data.groqSttPrompt || ""}` and called `saveConfig({ groqSttPrompt: ... })` directly from `onChange`.
  - That meant every typed or pasted character in a transcription prompt triggered a config mutation + invalidation round-trip while the user was still editing long-form guidance text.
  - The prompt is consumed in desktop transcription requests via `form.append("prompt", config.groqSttPrompt.trim())` in `apps/desktop/src/main/tipc.ts`, so this was a real user-facing STT configuration flow rather than dead settings code.
- [x] **Desktop `Max Iterations` numeric editing bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx` bound the `Max Iterations` number input straight to `configQuery.data?.mcpMaxIterations ?? 10` and called `saveConfig({ mcpMaxIterations: parseInt(e.target.value) || 1 })` from each `onChange`.
  - That meant every keystroke triggered a config mutation + invalidation round-trip, and temporary input states like an empty field were immediately coerced to `1` while the user was still editing.
  - Mobile already keeps `mcpMaxIterations` in `inputDrafts` and only persists valid values, so the desktop behavior was another clear parity gap and a broken numeric-editing flow rather than an intentional immediate-save UX.
- [x] **Desktop Supertonic numeric keyboard-editing bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-providers.tsx` rendered the Supertonic `Speed` and `Quality Steps` inputs as controlled numeric fields bound straight to saved config props (`value={speed}` / `value={steps}`), but each `onChange` only called `onSpeedChange` / `onStepsChange` when the parsed value was already within the final valid range.
  - That meant intermediate keyboard states like `0` while typing `0.95`, or `1` while typing `10`, were rejected immediately and React snapped the field back to the old saved value.
  - As a result, valid targets such as `0.95` speed or `10` quality steps were impossible or extremely brittle to enter from the keyboard even though they are allowed final values.
- [x] **Desktop OpenAI TTS speed editing/state-sync bug (directly confirmed in source):**
  - `apps/desktop/src/renderer/src/pages/settings-providers.tsx` rendered `TTS Speed` with `defaultValue={configQuery.data.openaiTtsSpeed?.toString()}` and called `saveConfig({ openaiTtsSpeed: speed })` directly from each valid `onChange` event.
  - That meant valid intermediate prefixes like `3` while typing `3.75` triggered config mutation + invalidation round-trips while the user was still editing, while temporary invalid states like `0` or an empty field had no blur-time reset path.
  - Because the input was uncontrolled, later saved config updates to `openaiTtsSpeed` would also not reliably resync into the visible field after mount, leaving stale values on screen.
  - Mobile already treats the same setting as a controlled slider committed on `onSlidingComplete`, so this was another desktop-only broken editing flow rather than an intentional immediate-save UX.

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
- [x] Updated `apps/desktop/src/renderer/src/pages/settings-providers.tsx` so Groq and Gemini `API Key` / `API Base URL` inputs use local drafts with debounced saves and blur flushes instead of saving on every keystroke.
- [x] Switched the providers-page `saveConfig(...)` helper to merge against a `cfgRef` snapshot of the latest config so delayed provider-field saves do not overwrite newer unrelated settings.
- [x] Added focused regression coverage in `apps/desktop/src/renderer/src/pages/settings-providers.draft.test.tsx` for:
  - debounced Groq API-key saving with latest-config merge behavior
  - blur flushing plus config-resync behavior for the inactive Gemini base-URL editor
- [x] Updated `apps/desktop/src/renderer/src/pages/settings-general.tsx` so the Groq STT `Prompt` textarea uses a local draft with debounced saves and blur flushes instead of saving on every keystroke.
- [x] Kept the Groq STT prompt save path on the existing latest-config merge helper so delayed prompt saves cannot overwrite newer unrelated settings.
- [x] Extended `apps/desktop/src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` with focused regression coverage for:
  - debounced Groq STT prompt saving with latest-config merge behavior
  - blur flushing of the latest Groq STT prompt draft without waiting for a rerender
  - resyncing the Groq STT prompt draft from saved config updates
- [x] Updated `apps/desktop/src/renderer/src/pages/settings-general.tsx` so `Max Iterations` uses a local string draft with debounced valid saves and blur handling instead of coercing/saving on every keystroke.
- [x] Kept the `Max Iterations` save path on the existing latest-config merge helper so delayed numeric saves cannot overwrite newer unrelated settings.
- [x] Cancelled stale pending `Max Iterations` saves when the draft becomes invalid so clearing the field cannot later persist an older number the user has already erased.
- [x] Extended `apps/desktop/src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` with focused regression coverage for:
  - keeping temporary empty numeric input local without saving
  - debounced valid `Max Iterations` saving with latest-config merge behavior
  - cancelling pending numeric saves when a once-valid draft becomes invalid before the debounce fires
  - blur flushing of the latest valid numeric draft and reset of invalid drafts back to the saved config
- [x] Updated `apps/desktop/src/renderer/src/pages/settings-providers.tsx` so the Supertonic `Speed` and `Quality Steps` editors use local string drafts with debounced valid saves and blur-time reset/flush behavior instead of rejecting intermediate keyboard edits.
- [x] Kept the Supertonic numeric save path on the existing providers-page `saveConfig(...)` merge helper because `onSpeedChange` / `onStepsChange` still flow through the latest-config ref in the parent page.
- [x] Extended `apps/desktop/src/renderer/src/pages/settings-providers.draft.test.tsx` with focused regression coverage for:
  - keeping an intermediate `1` draft locally while the user types a final valid `10` quality-steps value
  - keeping an out-of-range `0` speed prefix locally and resetting invalid blur states back to the saved value
- [x] Updated `apps/desktop/src/renderer/src/pages/settings-providers.tsx` so the OpenAI `TTS Speed` editor uses a local string draft with debounced valid saves and blur-time reset/flush behavior instead of uncontrolled direct-save editing.
- [x] Kept the OpenAI `TTS Speed` save path on the existing providers-page `saveConfig(...)` merge helper so delayed numeric saves still merge against the latest config snapshot.
- [x] Extended `apps/desktop/src/renderer/src/pages/settings-providers.draft.test.tsx` with focused regression coverage for:
  - keeping an out-of-range OpenAI speed prefix local until a final valid value is entered
  - debounced valid OpenAI speed saving with latest-config merge behavior
  - resetting invalid blur states back to the saved speed
  - resyncing the visible speed draft from later saved config updates

### Verified
- [x] Manual source verification: the desktop Langfuse inputs no longer call `saveConfig(...)` directly from `onChange`; they now update local draft state and use debounce/blur persistence.
- [x] Manual source verification: the desktop transcript post-processing prompt editor is now a controlled local draft and no longer calls `saveConfig(...)` directly from `onChange`.
- [x] Repository diff sanity check: `git diff --check` completed cleanly after the settings-general / test updates.
- [x] Manual source verification: the Groq/Gemini provider credential inputs on desktop no longer call `saveConfig(...)` directly from `onChange`; they now use controlled drafts with debounce/blur persistence in both active and inactive provider sections.
- [x] Repository diff sanity check: `git diff --check` completed cleanly after the settings-providers / test updates.
- [x] Manual source verification: the desktop Groq STT prompt textarea no longer calls `saveConfig(...)` directly from `onChange`; it now uses a controlled local draft with debounce/blur persistence.
- [x] Repository diff sanity check: `git diff --check` completed cleanly after the Groq STT prompt / regression test updates.
- [x] Manual source verification: the desktop `Max Iterations` input no longer calls `saveConfig(...)` directly from `onChange`; it now keeps a local draft, only schedules saves for valid values, and resets invalid blur states to the saved config.
- [x] Repository diff sanity check: `git diff --check` completed cleanly after the `Max Iterations` / regression test updates.
- [x] Manual source verification: the desktop Supertonic `Speed` / `Quality Steps` inputs no longer reject intermediate keyboard edits immediately; they now keep local drafts, debounce valid saves, and reset invalid blur states to the saved config.
- [x] Repository diff sanity check: `git diff --check` completed cleanly after the Supertonic numeric draft / regression test updates.
- [x] Manual source verification: the desktop OpenAI `TTS Speed` input no longer uses uncontrolled `defaultValue` or direct `saveConfig(...)` from `onChange`; it now keeps a controlled local draft, debounces valid saves, resets invalid blur states, and resyncs from saved config updates.
- [x] Repository diff sanity check: `git diff --check` completed cleanly after the OpenAI TTS speed draft / regression test updates.
- [ ] Automated verification is currently blocked by missing workspace dependencies (`vitest`/shared build tooling unavailable).

### Blocked
- [x] Live desktop reproduction and automated tests are blocked because this worktree does not have installed dependencies (`tsup` missing in predev, `vitest` missing for targeted tests). Per instructions, I did not install dependencies without separate permission.
- [x] Additional desktop verification for this Groq STT prompt fix is blocked by the same missing dependency state: `pnpm --filter @dotagents/desktop typecheck:web` cannot resolve `@electron-toolkit/tsconfig/tsconfig.web.json`, and `pnpm --filter @dotagents/desktop exec prettier ...` cannot find `prettier`, which indicates `apps/desktop/node_modules` is absent in this worktree.
- [x] Targeted automated verification for this `Max Iterations` fix is blocked by the same missing dependency state: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` still fails with `Command "vitest" not found`, which indicates the desktop workspace dependencies remain unavailable in this worktree.
- [x] Targeted automated verification for this Supertonic numeric-editing fix is blocked by the same missing dependency state: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.draft.test.tsx` still fails with `Command "vitest" not found`, which indicates the desktop workspace dependencies remain unavailable in this worktree.
- [x] Targeted automated verification for this OpenAI TTS speed fix is blocked by the same missing dependency state: `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.draft.test.tsx` still fails with `Command "vitest" not found`, which indicates the desktop workspace dependencies remain unavailable in this worktree.

### Still Uncertain
- [ ] Whether any other desktop settings inputs still need the same local-draft treatment once a fully runnable environment is available.
- [ ] Whether the secret-key field should eventually move all the way to blur-only persistence for parity with mobile, rather than debounce + blur flush.
- [ ] Whether the desktop post-processing prompt editor should eventually gain explicit save/cancel dialog affordances instead of autosaving a local draft.
- [ ] Whether the Groq STT prompt should eventually move to an explicit save/cancel affordance if the field grows beyond a short guidance prompt in real usage.
- [ ] Whether any other desktop provider editors still need temporary local-draft handling once the current numeric fixes are covered and the environment blocker is cleared.
- [ ] Whether the desktop OpenAI `TTS Speed` control should eventually switch all the way to a slider like mobile, rather than keeping a keyboard-editable number field with draft-state protection.

### Diagnosis / Rationale
- This is a clear user-facing editing bug: saving on every keystroke makes settings inputs more brittle, creates unnecessary config churn, and can invalidate/refetch state while the user is mid-edit.
- The existing WhatsApp desktop fix and the mobile Langfuse settings already establish a safer repo-local pattern: local draft first, then persist after a short pause or blur.
- Using a latest-config ref is acceptable and safer here because delayed saves must merge with the freshest config snapshot, not whichever render happened to create the timer.
- The transcript post-processing prompt is an even stronger fit for draft-first handling because it is long-form text; repeated config writes while editing or pasting a prompt are especially noisy and brittle there.
- Mobile already treats this exact setting as a draft-backed textarea, so aligning desktop with that behavior is a low-risk parity improvement rather than a new UX direction.
- Provider credentials and base URLs are at least as sensitive to this bug as the earlier settings fields: users often paste or carefully edit these values, so per-keystroke config writes create needless churn and make editing secrets/endpoints feel brittle.
- Using one shared providers-page draft helper for Groq/Gemini keeps the fix small while covering both the active and inactive provider sections that exposed the same broken editing path.
- The Groq STT prompt is another long-form text-editing flow where per-keystroke persistence has no user benefit and can create noisy config churn while the user is still composing or pasting transcription guidance.
- Keeping this fix inside the existing `settings-general.tsx` draft-save pattern is the smallest safe change: it improves a concrete editing flow without changing how the saved prompt is consumed by desktop transcription requests.
- `Max Iterations` is the numeric version of the same bug: per-keystroke persistence makes the field fight the user during normal editing because empty/intermediate values are part of typing, not a real final setting.
- Keeping the fix inside the existing `settings-general.tsx` draft-save pattern is the smallest safe change here too: it improves the editing flow without changing how the runtime consumes the persisted numeric limit.
- The Supertonic fields are the stricter controlled-input version of the same editing bug: because the component rendered the saved number back into the input on every invalid intermediate keystroke, common valid end states could not be typed naturally from the keyboard.
- Keeping the fix local to `SupertonicProviderSection` is the smallest safe change because the problem is isolated to those two numeric inputs and the parent providers page already owns the latest-config merge behavior for persisted saves.
- The OpenAI `TTS Speed` field combines two user-facing issues at once: direct-save churn on valid intermediate edits and stale UI risk from using `defaultValue` instead of a controlled input when saved config changes later.
- Keeping the desktop control as a number input but moving it to the existing draft-save pattern is the smallest safe fix because it preserves the current UI while aligning the save behavior more closely with the mobile slider's commit-on-complete flow.

### Assumptions
- Assumption: debouncing these three desktop Langfuse fields is acceptable because the repo already treats similar settings inputs as draft-first on both desktop and mobile.
- Assumption: keeping the secret key on debounce + blur is acceptable for this pass because it removes the repeated-save bug with the smallest code change while preserving current desktop behavior of showing the in-progress value only in a password field.
- Assumption: debouncing the desktop transcript post-processing prompt is acceptable because the mobile settings screen already treats the same field as a local draft and prompt editing does not require per-keystroke persistence.
- Assumption: debouncing Groq/Gemini provider API keys and base URLs is acceptable because these are long-form credential/endpoint text edits where per-keystroke persistence has no user benefit and the repo already uses draft-first handling for similar settings inputs.
- Assumption: debouncing the desktop Groq STT prompt is acceptable because it is optional long-form guidance text, downstream transcription reads the saved config only when a request is made, and there is no user value in persisting every intermediate keystroke.
- Assumption: keeping invalid `Max Iterations` input local until blur, then snapping back to the saved config when still invalid, is acceptable because the field already has an enforced numeric range in the UI and there is no meaningful persisted empty/zero state for this setting.
- Assumption: handling Supertonic `Speed` / `Quality Steps` with temporary local drafts and blur reset is acceptable because mobile does not expose an equivalent editor, the final persisted values/ranges are unchanged, and the fix only makes already-allowed values possible to enter reliably from the desktop keyboard.
- Assumption: keeping the desktop OpenAI `TTS Speed` UI as a number field (instead of redesigning it into a slider this pass) is acceptable because the mobile slider already establishes the intended range/commit timing, and this draft-backed fix removes the broken persistence/state-sync behavior without a larger UI change.

### Next Leads
- Once dependencies are installed, rerun the targeted test file and a focused desktop renderer verification pass for the Langfuse settings section.
- Once dependencies are installed, rerun `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` and a focused desktop verification pass for the transcript prompt editor.
- After that, inspect other desktop settings text inputs in `settings-general.tsx` for remaining immediate-save behavior.
- Once dependencies are installed, rerun `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.draft.test.tsx` and a focused desktop verification pass for Groq/Gemini credential editing.
- After that, inspect whether other providers-page free-text inputs (for example `groqSttPrompt` or numeric freeform fields) still merit draft-first handling.
- Once dependencies are installed, rerun `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` to execute the new Groq STT prompt coverage and confirm the existing transcript/Langfuse cases still pass together.
- After that, inspect remaining immediate-save numeric/text inputs in `settings-general.tsx` to decide whether they should become draft-backed or blur-committed instead of per-change saves.
- Once dependencies are installed, rerun `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse-draft.test.tsx` to execute the new `Max Iterations` coverage alongside the existing Langfuse/transcript/Groq-STT draft tests.
- After that, inspect remaining immediate-save numeric inputs in desktop settings (for example other bounded number fields) to decide whether they need the same draft-first or blur-commit treatment.
- Once dependencies are installed, rerun `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.draft.test.tsx` to execute the new Supertonic numeric-draft coverage alongside the existing provider credential draft tests.
- After that, inspect whether any other provider editors still combine uncontrolled/defaultValue rendering with direct-save behavior.
- Once dependencies are installed, rerun `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.draft.test.tsx` to execute the new OpenAI TTS speed coverage alongside the existing provider credential / Supertonic draft tests.
- After that, inspect whether any remaining desktop settings editors still use uncontrolled `defaultValue` plus direct-save behavior for user-editable config fields.