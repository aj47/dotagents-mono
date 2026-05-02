# Renderer UI — AGENTS.md

## Core redesign principle

When working on the desktop renderer UI, treat `.agents` as a workspace for directing and reviewing autonomous work, not primarily as a chat app.

The primary object should be the **task / run**. Messages are supporting artifacts, not the core container for all product state.

## What the UI should answer

At any moment, the UI should make it easy to understand:

- what is happening
- why it is happening
- what the user can do next
- what could go wrong
- whether the result can be trusted

## Preferred implementation bias

When deciding between alternatives, prefer the option that makes these more legible:

- current step
- execution state
- approvals
- blockers
- artifacts
- verification
- review readiness

Prefer structured UI over long narrative text when possible.

## Avoid

- burying important execution state in chat bubbles
- relying on transcript scrollback as the only source of truth
- treating a final assistant message as the full completion state
- making multi-run work feel like browsing old chats

## Cross-platform reminder

When making changes to the desktop renderer UI (this directory), consider whether the same change is needed in the mobile app at `apps/mobile/src/`. The two apps share similar UX patterns for:

- Agent progress display and tool call rendering
- TTS triggering and playback
- Chat message rendering and conversation history
- Settings pages and configuration UI
- Approval, artifact, and review state patterns

Always check if the mobile app has equivalent code that needs updating.
