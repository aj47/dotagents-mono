## Issue work ledger

This file tracks issue investigations and shipped slices for the issue-work loop.

### Iteration template
- Issue: `#<id>` — <title>
- Status: investigating | blocked | shipped
- Notes:
  - Diagnosis:
  - Assumptions:
  - Changes:
  - Verification:
  - Next:

### Iterations

#### 2026-03-09 — Issue #72: TTS replays latest agent message on follow-up user message
- Issue: `#72` — Bug: TTS replays latest agent message on follow-up user message
- Status: shipped
- Labels: `bug`, `tts`, `ux`
- Branch/PR: `aloops/issue-work-loop`; PR not created in this iteration
- Notes:
  - Diagnosis: `agent-progress.tsx` derived fallback `respond_to_user` content from the full session message list, so a new user turn could still surface previous-turn mid-turn response text. `appendUserMessageToSession()` also preserved stale `userResponse` state and old per-session TTS keys until a later progress update arrived.
  - Reproduced or confirmed: Confirmed directly from source against the issue report. The current fallback scan walked all assistant tool calls in `conversationHistory`, and the store already contained revival-clearing comments about stale `userResponse` causing TTS re-reads.
  - Assumptions:
    - Restricting fallback `respond_to_user` extraction to the current turn is acceptable because previous-turn mid-turn responses should not survive once a new user message starts the next turn.
    - Clearing per-session TTS tracking on follow-up is acceptable because a new turn should be allowed to autoplay its own response even if the text matches a prior turn.
  - Changes:
    - Added a focused renderer helper to extract `respond_to_user` content only from messages after the most recent user message.
    - Updated `agent-progress.tsx` to use the new current-turn-only fallback helper.
    - Updated `appendUserMessageToSession()` to clear stale `userResponse`, `userResponseHistory`, and session TTS tracking when a follow-up user message is optimistically appended.
    - Added regression tests for current-turn fallback extraction and follow-up append clearing behavior.
  - Verification:
    - Targeted Vitest tests passed for the new helper and the store regression.
    - Desktop renderer web typecheck passed after running `pnpm build:shared`.
  - Next: Manually validate the full Electron TTS behavior once the local native install blocker (`@egoist/electron-panel-window`) is resolved in a supported runtime, then pick the next actionable open issue.
- Evidence:
  - Scope: Fix one narrow slice of issue #72 by preventing previous-turn `respond_to_user` content and TTS state from carrying into a new follow-up user turn in the desktop renderer.
  - Before evidence: Issue #72 reported that a follow-up user message replays the latest `respond_to_user` audio. Source confirmation showed `extractRespondToUserResponsesFromMessages()` scanning the entire session history, and `appendUserMessageToSession()` left `userResponse` / `userResponseHistory` untouched.
  - Change: Added `apps/desktop/src/renderer/src/lib/respond-to-user-history.ts`, wired `agent-progress.tsx` to current-turn-only fallback extraction, and cleared stale per-turn response/TTS state in `apps/desktop/src/renderer/src/stores/agent-store.ts` when appending a follow-up user message.
  - After evidence: `respond-to-user-history.test.ts` now proves a trailing user message yields no carried-over `respond_to_user` fallback, and `agent-store.test.ts` proves appending a follow-up clears stale response state and removes old TTS tracking keys.
  - Verification commands/run results:
    - `pnpm install` -> failed under Node `v25.2.1` because `@egoist/electron-panel-window` native build does not compile there.
    - `export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:$PATH" && pnpm install` -> still failed on the same native package under Node `v24.1.0`.
    - `export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:$PATH" && pnpm install --ignore-scripts` -> passed.
    - `export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:$PATH" && pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/lib/respond-to-user-history.test.ts src/renderer/src/stores/agent-store.test.ts` -> passed (`2` files, `4` tests).
    - `export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:$PATH" && pnpm build:shared` -> passed.
    - `export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:$PATH" && pnpm --filter @dotagents/desktop run typecheck:web` -> passed.
  - Blockers/remaining uncertainty: Full Electron runtime / audio playback validation was not completed because this worktree cannot currently finish a normal scripted install; the native dependency `@egoist/electron-panel-window` fails to compile under the locally available Node `v25.2.1` and `v24.1.0`, so this iteration relies on targeted unit tests and typecheck rather than live TTS playback evidence.

#### 2026-03-09 — QA remediation for Issue #72 follow-up verification
- Issue: `#72` — Bug: TTS replays latest agent message on follow-up user message
- Status: shipped
- Labels: `bug`, `tts`, `ux`
- Branch/PR: `aloops/issue-work-loop`; PR not created in this iteration
- Notes:
  - Diagnosis: QA correctly flagged that the previous ledger overstated the runtime blocker. This worktree can launch the desktop app and expose a CDP target, so the misleading part was the claim that runtime validation was unavailable rather than specifically limited for this issue repro.
  - Reproduced or confirmed: Confirmed the verification gap from source and QA findings. The prior regression coverage only exercised `respond-to-user-history` and `agent-store`, not the rendered `AgentProgress` overlay path that actually triggers TTS autoplay.
  - Assumptions:
    - A focused renderer-level regression test for `AgentProgress` is an acceptable remediation because it exercises the live follow-up autoplay logic in the component that surfaced the user-visible bug.
    - A runtime launch artifact plus CDP inspection is acceptable as launchability evidence even though this pass does not synthesize a full live agent session with real `respond_to_user` tool traffic.
  - Changes:
    - Added `apps/desktop/src/renderer/src/components/agent-progress.tts-follow-up.test.tsx` with a hook-runtime render of `AgentProgress` overlay behavior.
    - Covered both the negative case (no stale previous-turn `respond_to_user` playback after a follow-up user message) and the positive case (current-turn `respond_to_user` still renders and autoplays).
    - Refreshed desktop runtime evidence with a live Electron launch artifact and CDP-backed renderer observation.
  - Verification:
    - Targeted Vitest coverage now passes across the helper, store, and rendered `AgentProgress` overlay path.
    - Live Electron dev runtime launches successfully in this worktree; CDP inspection reached the renderer and a fresh screenshot artifact was captured.
  - Next: If a future pass needs stronger live evidence for this exact UX bug, add a deterministic local session harness or scripted store injection path so the running app can be driven directly into a follow-up `respond_to_user` state without depending on an external model session.
- Evidence:
  - Scope: Remediate QA findings for issue #72 by correcting the ledger's runtime-validation claim and adding direct `AgentProgress` follow-up TTS regression coverage without expanding the fix scope.
  - Before evidence: QA findings documented two gaps: (1) the ledger said runtime validation was unavailable even though `pnpm --filter @dotagents/desktop exec electron --version` and `pnpm --filter @dotagents/desktop run dev:no-sherpa -- --inspect=9222` were already shown to work in this workspace, and (2) the shipped proof stopped at helper/store tests with no rendered `AgentProgress` verification.
  - Change: Added `apps/desktop/src/renderer/src/components/agent-progress.tts-follow-up.test.tsx`, reran the related TTS regression tests together, launched the desktop Electron app again, captured `.aloops-artifacts/issue-work-loop/issue-72-runtime-launch.png`, and confirmed renderer access over CDP.
  - After evidence: The new `AgentProgress` test proves an overlay follow-up turn with only previous-turn `respond_to_user` history renders no stale TTS player and makes zero `generateSpeech` calls, while a current-turn `respond_to_user` still renders/autoplays once. A fresh runtime launch also produced a live renderer observation (`title: DotAgents`, settings UI text present via CDP) and screenshot artifact `.aloops-artifacts/issue-work-loop/issue-72-runtime-launch.png`.
  - Verification commands/run results:
    - `export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:$PATH" && pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tts-follow-up.test.tsx` -> passed (`1` file, `2` tests).
    - `export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:$PATH" && pnpm --filter @dotagents/desktop exec vitest run src/renderer/src/components/agent-progress.tts-follow-up.test.tsx src/renderer/src/lib/respond-to-user-history.test.ts src/renderer/src/stores/agent-store.test.ts` -> passed (`3` files, `6` tests).
    - `export PATH="$HOME/.nvm/versions/node/v24.1.0/bin:$PATH" && pnpm --filter @dotagents/desktop run dev:no-sherpa -- --inspect=9222` -> launched Electron + renderer dev server successfully (background process for CDP validation).
    - `electron_execute` renderer inspection -> returned `title: DotAgents`, `href: http://localhost:8081/`, and visible settings-page text, confirming a live renderer target was reachable.
    - `mkdir -p .aloops-artifacts/issue-work-loop && screencapture -x '.aloops-artifacts/issue-work-loop/issue-72-runtime-launch.png'` -> passed and refreshed a screenshot artifact.
  - Blockers/remaining uncertainty: This remediation proves runtime launchability and strengthens the actual `AgentProgress` regression path, but it does not drive a fully live end-to-end follow-up agent session inside Electron. There is still no deterministic local harness for synthesizing a real `respond_to_user` follow-up turn in the running app without external session orchestration, so the issue-specific behavior claim remains grounded primarily in the new rendered component test plus the helper/store regressions.

#### 2026-03-09 — Issue #81: Hands-free toggle off still keeps wake-word gating in chat
- Issue: `#81` — Hands-free toggle off still keeps wake-word gating in chat
- Status: shipped
- Branch/PR: `aloops/issue-work-loop`; PR not created in this iteration
- Notes:
  - Diagnosis: `apps/mobile/src/lib/voice/useSpeechRecognizer.ts` created the web `SpeechRecognition` instance once and installed `onresult` / `onend` handlers that closed over the original `handsFree` value. After hands-free was turned off, subsequent recordings could still finalize in `handsfree` mode, which matches the reported wake-word-gated behavior.
  - Reproduced or confirmed: Confirmed directly from source and with a focused regression test. The existing web recognizer reused stale closures after a hands-free-to-push-to-talk transition.
  - Assumptions:
    - The open issue's desktop symptom is routed through this shared chat speech-recognizer path. This is acceptable because repo inspection did not surface a separate desktop-specific hands-free recognizer implementation, and the stale web recognizer closure exactly matches the reported post-toggle behavior.
    - Updating long-lived recognizer callbacks to read current refs is preferable to recreating the web recognizer on every toggle because it is smaller, less disruptive, and preserves the existing lifecycle.
  - Changes:
    - Updated `useSpeechRecognizer` so long-lived web/native recognizer callbacks read current `handsFree`, `willCancel`, logging, and callback values from refs instead of stale render-time closures.
    - Preserved existing recognizer lifecycle while making finalization mode and error/permission handling reflect the latest chat mode.
    - Added a regression test that reuses the same web recognizer across a hands-free-on → hands-free-off transition and verifies the final payload switches back to normal `send` mode.
  - Verification:
    - Targeted speech recognizer regression tests passed.
    - The package vitest suite passed.
    - A package-level TypeScript check still fails, but only on pre-existing unrelated `LoopEditScreen.tsx` `guidelines` errors.
  - Next: If issue #81 needs stronger runtime proof later, add a deterministic chat-level harness or live UI script that toggles hands-free in the running client and records the actual post-toggle mic behavior.
- Evidence:
  - Scope: Fix one narrow slice of issue #81 by ensuring the shared chat speech recognizer stops treating later mic interactions as hands-free after the user toggles hands-free off.
  - Before evidence: Issue #81 reported that turning hands-free off left chat input wake-word gated. Source review showed `useSpeechRecognizer` installed web `SpeechRecognition` handlers only once, so those handlers captured the original `handsFree` value and could keep finalizing later recordings as `handsfree` even after a toggle-off rerender.
  - Change: Updated `apps/mobile/src/lib/voice/useSpeechRecognizer.ts` to route long-lived recognizer decisions through current refs, and extended `apps/mobile/src/lib/voice/useSpeechRecognizer.test.ts` with a regression that reuses the same web recognizer across a mode switch.
  - After evidence: The new regression proves a recognizer created while `handsFree=true`, then reused after rerendering with `handsFree=false`, now emits `{ mode: 'send', source: 'web' }` for the next push-to-talk transcript instead of staying in hands-free mode.
  - Verification commands/run results:
    - `pnpm --filter @dotagents/mobile exec vitest run src/lib/voice/useSpeechRecognizer.test.ts` -> passed (`1` file, `4` tests); emitted an engine warning because local Node is `v25.2.1` while the package wants `>=20.19.4 <25`.
    - `pnpm --filter @dotagents/mobile run test:vitest` -> passed (`6` files, `51` tests); same engine warning only.
    - `pnpm --filter @dotagents/mobile exec tsc --noEmit` -> failed on pre-existing unrelated errors in `src/screens/LoopEditScreen.tsx` (`Property 'guidelines' does not exist on type 'ApiAgentProfile'`).
  - Blockers/remaining uncertainty: This iteration did not run a live desktop UI repro. The fix is justified by a direct source match plus regression coverage on the shared chat recognizer path, but there is still no runtime artifact showing the exact top-right mic toggle flow in a running desktop client.

