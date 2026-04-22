# Codex-authenticated media support

DotAgents can reuse the existing OpenAI Codex / ChatGPT OAuth session for the
media endpoints that ChatGPT exposes behind the Codex login.

## Implemented: speech-to-text

- Provider ID: `chatgpt-web` / label `OpenAI Codex`.
- Endpoint: `POST https://chatgpt.com/backend-api/transcribe`.
- Auth: the same OAuth access token used by the Codex Responses transport.
- Request shape: multipart form data with a `file` part and optional
  `duration_ms` when the desktop recording duration is available.
- Model selection: ChatGPT chooses the transcription model server-side, so the
  settings UI intentionally does not expose a Codex STT model selector.

This is wired into the existing desktop transcription paths for recordings,
preview chunks, and agent-mode voice recordings. The mobile settings screen can
also select the provider because it updates the desktop app's remote settings.

## Investigated but not implemented yet

### Text-to-speech

OpenAI's public TTS endpoint is `POST /v1/audio/speech`, but that endpoint uses
API-key auth. Codex's app-server has experimental realtime output-audio events,
but there is not a stable ChatGPT `/backend-api/...` TTS endpoint equivalent to
`/backend-api/transcribe` yet. DotAgents should keep using the existing OpenAI,
Groq, Gemini, Edge, and local TTS providers until a stable Codex-auth TTS path is
available.

### Image generation

Codex CLI supports image generation behind an experimental feature flag and uses
the OpenAI Images API flow with GPT Image models such as `gpt-image-1.5`. The
desktop app does not currently have a first-class image-generation feature
surface, so this PR does not add one. A future integration should add an explicit
image-generation UI/tool rather than overloading chat or transcription settings.