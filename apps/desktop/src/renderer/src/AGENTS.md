# Renderer UI — AGENTS.md

## Cross-platform reminder

When making changes to the desktop renderer UI (this directory), consider whether the same change is needed in the mobile app at `apps/mobile/src/`. The two apps share similar UX patterns for:

- Agent progress display and tool call rendering
- TTS (text-to-speech) triggering and playback
- Chat message rendering and conversation history
- Settings pages and configuration UI

Always check if the mobile app has equivalent code that needs updating.

