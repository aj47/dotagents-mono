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
- Status: blocked
- Branch/PR: `aloops/issue-work-loop`; PR not created in this iteration
- Notes:
  - Diagnosis: The issue text and the current codebase do not line up. The reported top-right hands-free mic toggle exists in `apps/mobile/src/screens/ChatScreen.tsx`, but the desktop individual-chat mic buttons route through `apps/desktop/src/renderer/src/components/overlay-follow-up-input.tsx` / `tile-follow-up-input.tsx` into `triggerMcpRecording` and the desktop `Recorder` / `createMcpRecording` flow, which has no hands-free or wake-word state.
  - Reproduced or confirmed: Confirmed with live Expo web runtime plus codepath inspection. The chat UI reached at `http://localhost:8082` shows the top-right hands-free toggle described in the issue, while desktop code search and follow-up input inspection show a separate push-to-record MCP recording flow instead of hands-free gating.
  - Assumptions:
    - It is acceptable to block rather than ship code here because the issue explicitly targets Desktop, but the current Desktop implementation inspected in this pass does not expose the described hands-free wake-word toggle path.
    - Rolling back the prior mobile-only slice is safer than keeping an unapproved change that cannot be justified against the reported desktop issue.
  - Changes:
    - Reverted the prior `apps/mobile`-only `useSpeechRecognizer` fix and regression test from this draft so the branch no longer claims to fix desktop issue `#81` with an unrelated mobile/web change.
    - Added concrete runtime/codepath notes showing the mismatch between the issue report and the current desktop implementation.
  - Verification:
    - Expo web runtime launched and reached the chat screen with the top-right hands-free toggle visible.
    - Desktop Electron dev runtime launched, and desktop codepath inspection confirmed the individual-chat mic buttons go through MCP recording rather than a hands-free recognizer.
    - After reverting the mobile slice, the targeted remaining `useSpeechRecognizer.test.ts` suite still passes.
  - Next: Re-triage issue `#81` against the current desktop product surface. Either update the issue to the actual mobile/web chat surface, or capture a concrete desktop reproduction against the Electron chat flow before shipping code.
- Evidence:
  - Scope: Remediate QA findings for issue #81 by replacing the mis-scoped mobile-only draft slice with a concrete runtime/codepath blocker trail for the reported desktop issue.
  - Before evidence: QA findings correctly noted two gaps: (1) no live runtime attempt or blocker trail was recorded even though Expo web can run locally, and (2) the shipped code only touched `apps/mobile` even though issue `#81` explicitly targets the Desktop app.
  - Change: Reverted the `apps/mobile/src/lib/voice/useSpeechRecognizer.ts` draft change and its regression test, launched Expo web to inspect the live chat header control, and documented the separate desktop recording codepath (`overlay-follow-up-input.tsx` / `tile-follow-up-input.tsx` -> `triggerMcpRecording` -> desktop `Recorder` / `createMcpRecording`).
  - After evidence: Live runtime inspection at `http://localhost:8082` reached Chats -> New Chat and showed a top-right hands-free mic toggle; screenshot artifact `.aloops-artifacts/issue-work-loop/expo-web-chat-screen-final.png` captures that control. In contrast, desktop code inspection shows the individual-chat mic buttons only start MCP recording, and no desktop search hit surfaced hands-free or wake-word logic in `apps/desktop` chat components.
  - Verification commands/run results:
    - `pnpm --filter @dotagents/mobile exec expo start --web --port 8082` -> passed (background process; Metro reported `Waiting on http://localhost:8082`).
    - Web runtime inspection at `http://localhost:8082` -> reached chat after local browser-only config, observed the top-right hands-free toggle, and captured `.aloops-artifacts/issue-work-loop/expo-web-chat-screen-final.png`.
    - `rg -n "hands[- ]free|handsFree|wake word|wake-word|wakePhrase|sleepPhrase" apps/desktop apps/mobile -S` -> showed hands-free / wake-word chat logic under `apps/mobile`, while desktop hits were limited to recording and unrelated config text.
    - `pnpm --filter @dotagents/desktop run dev:no-sherpa -- --inspect=9222` -> launched Electron dev runtime successfully for desktop codepath validation.
    - `pnpm --filter @dotagents/mobile exec vitest run src/lib/voice/useSpeechRecognizer.test.ts` -> passed (`1` file, `3` tests) after reverting the mis-scoped mobile regression; emitted only the existing Node engine warning (`v25.2.1` vs package `<25`).
  - Blockers/remaining uncertainty: This pass did not find a current desktop runtime path that matches the issue's described hands-free wake-word chat flow. The strongest evidence now indicates the report maps to the mobile/web chat surface instead, but that needs issue re-triage or a fresh desktop repro before another code slice is justified.

