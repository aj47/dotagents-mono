## Improve App Log

### Purpose
Track small, shippable product improvements. Review this file before each iteration to avoid repeating recent investigations and to keep momentum focused on high-leverage changes.

### Checked Recently
- 2026-03-08: Desktop repeat-task creation flow in `apps/desktop/src/renderer/src/pages/settings-loops.tsx` plus main-process repeat-task persistence in `apps/desktop/src/main/loop-service.ts` / `apps/desktop/src/main/agents-files/tasks.ts`, with mobile loop-creation parity review in `apps/mobile/src/screens/LoopEditScreen.tsx` and `apps/mobile/src/lib/settingsApi.ts`.
- 2026-03-08: Desktop transcript post-processing prompt editor save behavior in `apps/desktop/src/renderer/src/pages/settings-general.tsx` plus mobile parity review in `apps/mobile/src/screens/SettingsScreen.tsx`.
- 2026-03-08: Desktop provider numeric TTS inputs (`openaiTtsSpeed`, `supertonicSpeed`, `supertonicSteps`) in `apps/desktop/src/renderer/src/pages/settings-providers.tsx` plus mobile TTS parity review in `apps/mobile/src/screens/SettingsScreen.tsx`.
- 2026-03-08: Desktop provider settings Groq/Gemini credential inputs (`apps/desktop/src/renderer/src/pages/settings-providers.tsx`) plus mobile parity check in `apps/mobile/src/screens/SettingsScreen.tsx`.
- 2026-03-08: Desktop general settings Langfuse text inputs (`apps/desktop/src/renderer/src/pages/settings-general.tsx`) and mobile parity in `apps/mobile/src/screens/SettingsScreen.tsx`.
- 2026-03-07: Initial setup. No prior investigation log existed.
- 2026-03-07: Desktop main-process session shutdown guardrails (`apps/desktop/src/main/state.ts`).
- 2026-03-07: Desktop text composer submission resilience (`apps/desktop/src/renderer/src/components/text-input-panel.tsx`).
- 2026-03-07: Desktop follow-up composer duplicate-submit guardrails (`apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx`, `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`).
- 2026-03-07: Desktop WhatsApp settings allowlist editing resilience (`apps/desktop/src/renderer/src/pages/settings-whatsapp.tsx`).

### Improved
- 2026-03-08: Desktop repeat-task creation now uses collision-safe readable IDs, so creating a second task with the same name no longer silently overwrites the first task file/config entry.
- 2026-03-08: Desktop transcript post-processing prompt editing now uses a local draft, debounced autosave, blur flush, and latest-config merging instead of mutating config on every keystroke inside the dialog.
- 2026-03-08: Desktop provider numeric TTS settings now keep local drafts for OpenAI speed plus Supertonic speed/quality steps, debounce config writes, flush valid edits on blur, and restore invalid drafts to the last saved value.
- 2026-03-08: Desktop provider settings now keep local drafts for Groq/Gemini API keys and base URLs, debounce config writes, flush on blur, and merge delayed saves against the latest config snapshot.
- 2026-03-08: Desktop Langfuse settings now keep local drafts, debounce config writes, flush on blur, and merge against the latest config snapshot before saving.

### Verified
- 2026-03-08: attempted `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-loops.ids.test.ts` (blocked: `vitest` not installed in this worktree).
- 2026-03-08: `git diff --check`
- 2026-03-08: attempted `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse.test.tsx` (blocked: `vitest` not installed in this worktree).
- 2026-03-08: attempted `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.credentials.test.tsx` (blocked: `vitest` not installed in this worktree).

### Blocked
- 2026-03-08: Focused desktop Vitest verification for `src/renderer/src/pages/settings-loops.ids.test.ts` is blocked in this worktree because `pnpm --filter @dotagents/desktop exec vitest ...` cannot find `vitest` without installed dependencies.
- 2026-03-08: Targeted desktop Vitest verification is currently blocked because this worktree does not have installed dependencies (`node_modules` missing). `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/pages/settings-general.langfuse.test.tsx` failed during the required shared prebuild because `packages/shared` could not run `tsup`, and both `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.credentials.test.tsx` and `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse.test.tsx` failed because `vitest` was not installed in this worktree.

### Not Yet Checked Recently
- Shared utility reliability / guardrails
- Memories management flows

### Next Highest-Value Targets
- Inspect shared utility reliability / guardrails for the next small resilience win
- Inspect memories management flows for the next localized UX/reliability improvement
- Revisit the remaining multiline settings editors (for example `groqSttPrompt`) once tests can run reliably in this workspace

### 2026-03-08 — Desktop repeat-task duplicate-create guardrails
- Date:
  - 2026-03-08
- Area / screen / subsystem:
  - desktop repeat-task management in `apps/desktop/src/renderer/src/pages/settings-loops.tsx`
  - repeat-task persistence in `apps/desktop/src/main/loop-service.ts` and `apps/desktop/src/main/agents-files/tasks.ts`
- Why it was chosen:
  - the ledger identified agent/task management flows as the next fresh area that had not been investigated recently
  - desktop repeat-task creation derived the task ID directly from the task name, so creating another task with the same or similar name would reuse the same ID and silently overwrite the existing task file/config entry
  - the fix had direct user value, was highly localized, and avoided a broader scheduling refactor
- What was inspected:
  - `apps/desktop/src/renderer/src/pages/settings-loops.tsx`
  - `apps/desktop/src/main/loop-service.ts`
  - `apps/desktop/src/main/agents-files/tasks.ts`
  - repeat-task IPC handlers in `apps/desktop/src/main/tipc.ts`
  - mobile loop creation in `apps/mobile/src/screens/LoopEditScreen.tsx` plus `apps/mobile/src/lib/settingsApi.ts`; confirmed mobile creates new loops through the API layer rather than reusing the desktop name-slug path
  - remote loop creation in `apps/desktop/src/main/remote-server.ts`; confirmed the remote API already creates random loop IDs, so the silent-overwrite risk was localized to desktop settings create flow
  - attempted live desktop inspection, but Electron CDP was unavailable in this environment
- Improvement made:
  - extracted a small `settings-loops.ids.ts` helper for readable slug generation plus collision-safe ID suffixing
  - desktop repeat-task creation now keeps readable IDs when available, but automatically appends `-2`, `-3`, etc. when the base slug already exists
  - collision checks are case-insensitive so desktop task creation does not accidentally collide on case-insensitive filesystems
  - editing an existing task still preserves its current ID instead of renaming task files behind the user’s back
  - added focused regression coverage in `apps/desktop/src/renderer/src/pages/settings-loops.ids.test.ts`
- Assumptions / tradeoffs / rationale:
  - kept readable, name-derived IDs rather than switching desktop repeat tasks to opaque UUIDs so the underlying `.agents/tasks/<id>/task.md` structure stays predictable for users browsing files directly
  - scoped the change to desktop create flow because mobile and remote API creation paths already avoid this specific overwrite mode
  - preferred automatic suffixing over a blocking validation error so creating similarly named tasks remains fast and low-friction
- Tests / verification:
  - attempted `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-loops.ids.test.ts`, but the current workspace still lacks installed dependencies and `vitest` was unavailable
  - `git diff --check`
- Follow-up checks:
  - once dependencies are available, run `src/renderer/src/pages/settings-loops.ids.test.ts`
  - inspect shared utility reliability / guardrails for the next localized resilience pass
  - inspect memories management flows for the next non-overlapping UX/reliability improvement

### 2026-03-08 — Desktop transcript post-processing prompt draft/save resilience
- Date:
  - 2026-03-08
- Area / screen / subsystem:
  - desktop general settings in `apps/desktop/src/renderer/src/pages/settings-general.tsx`
  - transcript post-processing prompt editor dialog
- Why it was chosen:
  - after the first iteration, this was the next highest-value unchecked item in the ledger
  - the dialog still saved on every keystroke, which is noisy for a multiline prompt and increases the chance of partial / stale writes while editing
  - mobile already debounces the analogous remote setting path, so desktop was the lagging surface
- What was inspected:
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx`
  - `apps/desktop/src/renderer/src/pages/settings-general.langfuse.test.tsx` for the existing focused renderer test harness
  - `apps/mobile/src/screens/SettingsScreen.tsx`; confirmed mobile already routes `transcriptPostProcessingPrompt` through its debounced `handleRemoteSettingUpdate(...)` draft flow
  - attempted live desktop inspection, but Electron CDP was unavailable in this environment
- Improvement made:
  - expanded the existing desktop general-settings draft/save helper to include `transcriptPostProcessingPrompt`
  - the prompt textarea now keeps a local draft, debounces saves by 400ms, and flushes the latest text on blur instead of saving on every keystroke
  - delayed prompt saves still merge against the latest config snapshot through `configRef`, preventing unrelated setting changes from being overwritten by an older timeout
  - added focused regression coverage for draft behavior, blur flush, and latest-config merging in `apps/desktop/src/renderer/src/pages/settings-general.langfuse.test.tsx`
- Assumptions / tradeoffs / rationale:
  - kept the existing autosave model rather than introducing explicit modal Save/Cancel controls to keep the change consistent with the rest of desktop settings UX
  - scoped the helper expansion to this prompt plus the already-migrated Langfuse fields, avoiding a larger general-settings refactor
  - left the existing saved-value preview outside the dialog unchanged; it now reflects the last persisted prompt rather than in-progress draft text
- Tests / verification:
  - attempted `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-general.langfuse.test.tsx`, but the current workspace still lacks installed dependencies and `vitest` was unavailable
  - `git diff --check`
- Follow-up checks:
  - once dependencies are available, run the general-settings and provider-settings focused renderer tests
  - inspect agent/task management flows for the next localized reliability or UX improvement
  - revisit other multiline prompt fields such as `groqSttPrompt` for the same pattern

### 2026-03-08 — Desktop provider numeric draft/save resilience
- Date:
  - 2026-03-08
- Area / screen / subsystem:
  - desktop provider settings in `apps/desktop/src/renderer/src/pages/settings-providers.tsx`
  - specifically `openaiTtsSpeed`, `supertonicSpeed`, and `supertonicSteps`
- Why it was chosen:
  - the ledger explicitly called out these remaining numeric settings as a fresh, not-yet-checked area after the credential-input pass
  - these inputs sit on a core TTS configuration surface and still saved eagerly while typing, which creates avoidable config churn and awkward numeric-editing UX
  - the fix was local, user-visible, and could reuse the existing draft/debounce approach without a broad settings refactor
- What was inspected:
  - `apps/desktop/src/renderer/src/pages/settings-providers.tsx`
  - `apps/desktop/src/renderer/src/pages/settings-providers.credentials.test.tsx` for the existing focused renderer test harness around provider settings
  - `apps/mobile/src/screens/SettingsScreen.tsx`; confirmed mobile already uses a more deliberate `onSlidingComplete(...)` flow for OpenAI TTS speed and does not expose the same Supertonic numeric editing surface, so no parity change was needed here
  - attempted live desktop inspection, but no Electron CDP target was available in this environment
- Improvement made:
  - added shared local draft state for OpenAI TTS speed and Supertonic speed / quality-step inputs
  - debounced valid numeric saves by 400ms while typing and flushes the latest valid value on blur
  - invalid or blank numeric drafts now revert to the last saved config value on blur instead of sticking in a broken state or attempting an invalid save
  - delayed numeric saves now still merge against the latest config snapshot via the existing `configRef`, preventing stale-config overwrites when unrelated settings change before the timeout fires
  - kept Supertonic test-voice playback reading the current valid numeric draft so preview behavior stays aligned with what the user just typed
  - extended focused regression coverage in `apps/desktop/src/renderer/src/pages/settings-providers.credentials.test.tsx`
- Assumptions / tradeoffs / rationale:
  - kept the existing autosave model instead of adding explicit Save/Cancel controls to keep the change small and consistent with nearby settings UX
  - chose “revert invalid blur” rather than persisting blanks/default resets automatically so incomplete numeric edits do not silently overwrite saved settings
  - kept this pass scoped to the three remaining numeric provider inputs instead of reorganizing the broader provider settings screen
- Tests / verification:
  - attempted `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.credentials.test.tsx`, but the current workspace still lacks installed dependencies and `vitest` was unavailable
  - `git diff --check`
- Follow-up checks:
  - once dependencies are available, run `src/renderer/src/pages/settings-providers.credentials.test.tsx` plus the previously blocked Langfuse settings test file
  - revisit the transcript post-processing prompt editor for similar draft/save UX issues
  - inspect agent/task management flows for the next small, high-value iteration

### 2026-03-08 — Desktop provider credential draft/save resilience
- Date:
  - 2026-03-08
- Area / screen / subsystem:
  - desktop provider settings in `apps/desktop/src/renderer/src/pages/settings-providers.tsx`
  - specifically Groq and Gemini API key / base URL inputs in both active and inactive provider sections
- Why it was chosen:
  - the ledger explicitly called out remaining provider settings text inputs that still saved on every keystroke
  - API keys and base URLs are long, high-friction values where eager autosave causes visible churn and unnecessary config writes
  - the fix was local, user-visible, and did not require a broad provider-settings refactor
- What was inspected:
  - `apps/desktop/src/renderer/src/pages/settings-providers.tsx`
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx` for the existing Langfuse local-draft/debounce pattern
  - `apps/desktop/src/renderer/src/pages/settings-whatsapp.tsx` for the latest config-ref save pattern
  - `apps/desktop/src/renderer/src/pages/settings-general.langfuse.test.tsx` and `apps/desktop/src/renderer/src/pages/settings-whatsapp.allowlist.test.tsx` for focused regression-test structure
  - `apps/mobile/src/screens/SettingsScreen.tsx`; confirmed mobile does not expose the same provider credential-editing surface, so no parity change was needed for this pass
  - attempted live desktop inspection, but no Electron CDP target was available in this environment
- Improvement made:
  - added shared local draft state for Groq and Gemini API keys / base URLs across both active and inactive provider sections
  - debounced provider credential saves by 400ms while typing and flushes the latest draft on blur
  - switched these delayed saves to merge against the latest config snapshot via a ref, avoiding stale-config overwrites when unrelated settings change before the timeout fires
  - added focused regression coverage in `apps/desktop/src/renderer/src/pages/settings-providers.credentials.test.tsx`
- Assumptions / tradeoffs / rationale:
  - kept the existing autosave interaction model instead of adding explicit Save/Cancel controls to keep the change small and consistent with nearby settings UX
  - limited this pass to Groq/Gemini credential text inputs because they were the clearest remaining save-on-every-keystroke pain point in this screen; numeric provider settings remain separate follow-up work
  - introduced only a small local helper for the duplicated credential controls instead of broadly reorganizing provider sections
- Tests / verification:
  - attempted `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-providers.credentials.test.tsx`, but the current workspace still lacks installed dependencies and `vitest` was unavailable
  - `git diff --check`
- Follow-up checks:
  - once dependencies are available, run `src/renderer/src/pages/settings-providers.credentials.test.tsx` and the previously blocked Langfuse settings test file
  - inspect remaining provider numeric inputs (`openaiTtsSpeed`, `supertonicSpeed`, `supertonicSteps`) for the same autosave-churn pattern
  - revisit transcript post-processing prompt editing UX after verification can run again

### 2026-03-07 — Desktop session shutdown guardrails
- Date:
  - 2026-03-07
- Area / screen / subsystem:
  - desktop main-process session lifecycle and shutdown cleanup in `apps/desktop/src/main/state.ts`
- Why it was chosen:
  - `ui-audit.md` already covers many recent UX-polish iterations, so this pass deliberately avoided overlapping that work.
  - Session stop/cleanup is a high-leverage reliability seam because it is shared by normal session completion, manual stop flows, sub-session cancellation, and emergency-stop behavior.
- What was inspected:
  - `apps/desktop/src/main/state.ts`
  - `apps/desktop/src/main/llm-fetch.ts`
  - `apps/desktop/src/main/emergency-stop.ts`
  - usages of `agentSessionStateManager.stopSession(...)`, `cleanupSession(...)`, and `toolApprovalManager.cancelSessionApprovals(...)`
  - existing session-related tests in `apps/desktop/src/main/acp-session-state.test.ts` and `apps/desktop/src/main/acp-service.test.ts`
- Improvement made:
  - centralized session shutdown cleanup in `state.ts` so `stopSession(...)` and `cleanupSession(...)` now:
    - unregister session abort controllers from the global `llmRequestAbortManager` before aborting them
    - cancel pending tool approvals for that session instead of relying on each caller to remember
  - added focused regression coverage in `apps/desktop/src/main/state.test.ts`
- Tests / verification:
  - `pnpm --filter @dotagents/desktop exec vitest run src/main/state.test.ts`
  - `pnpm --filter @dotagents/desktop typecheck:node`
- Follow-up checks:
  - inspect other session-adjacent cleanup seams for the same “caller must remember” pattern, especially queue pause/resume and user-response cleanup on less common cancellation paths
  - inspect desktop composer / send flows next for a small UX or resilience improvement

### 2026-03-07 — Desktop text composer submission resilience
- Date:
  - 2026-03-07
- Area / screen / subsystem:
  - desktop panel text composer / new-message send flow in `apps/desktop/src/renderer/src/components/text-input-panel.tsx`
  - submit orchestration in `apps/desktop/src/renderer/src/pages/panel.tsx`
- Why it was chosen:
  - the previous reliability pass explicitly called out desktop composer / send flows as the next area to inspect
  - this composer starts new desktop text sessions, so duplicate submissions or draft loss here directly affect a core user flow
- What was inspected:
  - `apps/desktop/src/renderer/src/components/text-input-panel.tsx`
  - `apps/desktop/src/renderer/src/pages/panel.tsx`
  - adjacent desktop follow-up composers in `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx` and `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
  - `apps/desktop/src/renderer/src/components/session-input.tsx` (found to be currently unused)
  - mobile composer send callback in `apps/mobile/src/screens/ChatScreen.tsx` to check whether the same fix needed to be mirrored there
- Improvement made:
  - hardened the active desktop text composer so it now awaits the async submit result instead of clearing immediately
  - preserved the draft when submission is declined before the session starts (for example, if selected-agent application does not complete)
  - added a local in-flight submit guard so rapid repeat clicks / Enter presses cannot trigger duplicate sends before parent mutation state propagates
  - updated `panel.tsx` to return an explicit success boolean from `handleTextSubmit(...)` so the composer knows when it is safe to clear local state
- Tests / verification:
  - `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/text-input-panel.submit.test.tsx src/renderer/src/pages/panel.recording-layout.test.ts`
  - `pnpm --filter @dotagents/desktop typecheck:web`
- Follow-up checks:
  - inspect `overlay-follow-up-input.tsx` and `tile-follow-up-input.tsx` for similar resilience gaps around send-error feedback and queued/active-session edge states
  - decide whether the currently unused `session-input.tsx` should be removed, revived, or brought under test to avoid future drift

### 2026-03-07 — Desktop follow-up composer duplicate-submit guardrails
- Date:
  - 2026-03-07
- Area / screen / subsystem:
  - desktop session follow-up composers in `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx`
  - desktop session-tile follow-up composer in `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
- Why it was chosen:
  - the previous composer-resilience pass explicitly called out these follow-up inputs as the next likely seam for the same duplicate-submit race
  - these components continue active conversations, so accidental duplicate sends degrade a core ongoing-session workflow
- What was inspected:
  - `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx`
  - `apps/desktop/src/renderer/src/components/tile-follow-up-input.tsx`
  - `apps/desktop/src/renderer/src/components/agent-progress.tsx` to confirm how tile and overlay follow-up inputs are mounted, including pending-session behavior
  - `apps/mobile/src/screens/ChatScreen.tsx` for renderer/mobile parity; confirmed mobile uses a different primary-composer path rather than these desktop-specific follow-up components
- Improvement made:
  - added a local `isSubmitting` state plus `submitInFlightRef` guard to both desktop follow-up composers
  - switched both submit handlers to `mutateAsync(...)` so the guard spans the full async send lifecycle instead of depending only on React Query state propagation
  - disabled follow-up text and voice controls immediately during local submit startup, closing the rapid double-click / double-Enter race window before `isPending` re-renders
  - added focused regression coverage in `apps/desktop/src/renderer/src/components/follow-up-input.submit.test.ts`
- Tests / verification:
  - `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/follow-up-input.submit.test.ts`
  - `pnpm --filter @dotagents/desktop typecheck:web`
- Follow-up checks:
  - inspect whether these follow-up composers should surface clearer user-visible error feedback when async sends fail
  - inspect the mobile `ChatScreen` primary composer separately for similar duplicate-submit risks, since it uses a different send path and was not changed in this pass

### 2026-03-07 — Desktop WhatsApp settings allowlist editing resilience
- Date:
  - 2026-03-07
- Area / screen / subsystem:
  - desktop WhatsApp settings page in `apps/desktop/src/renderer/src/pages/settings-whatsapp.tsx`
- Why it was chosen:
  - the tracker called out settings screens and validation UX as a fresh area that had not been investigated in the recent desktop composer passes
  - this allowlist field controls which senders are allowed through a remote integration, so sluggish or brittle editing has direct user impact and can also generate unnecessary config writes
- What was inspected:
  - `apps/desktop/src/renderer/src/pages/settings-whatsapp.tsx`
  - `apps/mobile/src/screens/SettingsScreen.tsx` for parity; confirmed mobile already uses a local draft for the same allowlist setting
  - `apps/desktop/src/main/remote-server.ts` to confirm the allowlist is consumed as config data downstream
  - related config query/mutation plumbing in `apps/desktop/src/renderer/src/lib/queries.ts`
- Improvement made:
  - switched the desktop WhatsApp allowlist input from immediate save-on-every-keystroke behavior to a local draft with a short debounce
  - flushes any pending allowlist edit on blur so quick tab-away interactions still persist predictably
  - updated saving to read from the latest config ref before merging, avoiding stale-config overwrites when delayed saves fire after other settings change
  - added focused regression coverage in `apps/desktop/src/renderer/src/pages/settings-whatsapp.allowlist.test.tsx`
- Tests / verification:
  - `pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/pages/settings-whatsapp.allowlist.test.tsx`
  - attempted `pnpm --filter @dotagents/desktop exec tsc -p tsconfig.web.json --noEmit`, but the current workspace still has an unrelated pre-existing web typecheck failure in desktop renderer type declarations
- Follow-up checks:
  - inspect other desktop settings text inputs that still save on every keystroke to see whether they need the same local-draft pattern
  - consider small copy polish for WhatsApp allowlist guidance across desktop/mobile if future UX passes revisit this screen

### 2026-03-08 — Desktop Langfuse settings draft/save resilience
- Date:
  - 2026-03-08
- Area / screen / subsystem:
  - desktop general settings Langfuse inputs in `apps/desktop/src/renderer/src/pages/settings-general.tsx`
- Why it was chosen:
  - the ledger already called out remaining settings text inputs that still save on every keystroke
  - these Langfuse fields include long keys and URLs, so save-on-every-keystroke creates avoidable config churn and a visibly worse editing experience
  - mobile already uses local drafts for the same Langfuse area, so desktop was lagging behind an existing product pattern
- What was inspected:
  - `apps/desktop/src/renderer/src/pages/settings-general.tsx`
  - `apps/mobile/src/screens/SettingsScreen.tsx`
  - `apps/desktop/src/renderer/src/pages/settings-whatsapp.allowlist.test.tsx` for an existing local-draft/debounce test pattern
  - `apps/desktop/src/renderer/src/lib/queries.ts` to confirm config-save invalidation behavior
  - attempted live desktop inspection, but no Electron CDP target was available in this environment
- Improvement made:
  - added local draft state for Langfuse public key, secret key, and base URL inputs on desktop
  - debounced Langfuse saves by 400ms while typing and flushes the latest value on blur
  - switched config merging for these delayed saves to use the latest config snapshot via a ref, avoiding stale-config overwrites if another setting changes before the timeout fires
  - added focused regression coverage in `apps/desktop/src/renderer/src/pages/settings-general.langfuse.test.tsx`
- Assumptions / tradeoffs / rationale:
  - kept the existing autosave model instead of introducing explicit Save/Cancel controls to keep the change small and low-risk
  - used the existing WhatsApp settings debounce timing (400ms) for behavioral consistency rather than inventing a new threshold
  - limited this pass to Langfuse inputs instead of refactoring every settings field at once, because the user value here is clear and the implementation path is local
- Tests / verification:
  - attempted `pnpm --filter @dotagents/desktop test:run -- src/renderer/src/pages/settings-general.langfuse.test.tsx` but the workspace currently lacks installed dependencies; the required prebuild failed because `tsup` was unavailable in `packages/shared`
  - `git diff --check`
- Follow-up checks:
  - inspect desktop provider API key / base URL fields for the same save-on-every-keystroke pattern next
  - once dependencies are available again, run the targeted Langfuse test file and consider broadening coverage to other settings draft-save flows

### Iteration Template
- Date:
- Area / screen / subsystem:
- Why it was chosen:
- What was inspected:
- Improvement made:
- Tests / verification:
- Follow-up checks:

### Backlog of Areas to Inspect
- Desktop follow-up composers and queued-send edge states
- Desktop session lifecycle and error states (follow-up: queue/user-response cleanup consistency)
- Settings screens and validation UX (remaining text inputs that still save on every keystroke)
- Agent/task management flows
- Mobile parity gaps with desktop
- Shared utility reliability / guardrails
- Test coverage gaps around critical user flows

