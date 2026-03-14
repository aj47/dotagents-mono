---
sidebar_position: 1
sidebar_label: "Overview"
---

# Voice Interface

Voice is the primary interface for DotAgents. Hold to speak, release to act. Your agents listen, think, and execute — all triggered by your voice.

---

## Voice Modes

DotAgents offers several voice interaction modes:

### Hold-to-Record (Dictation)

The default mode for quick voice input:

1. **Hold `Ctrl`** (macOS/Linux) or **`Ctrl+/`** (Windows)
2. **Speak** your request
3. **Release** to stop recording
4. Your speech is transcribed and inserted into the active application

This is pure dictation — the AI transcribes your speech and types it wherever your cursor is.

### MCP Agent Mode

Voice input that triggers full agent execution with tools:

1. **Hold `Ctrl+Alt`** to start recording
2. **Speak** your request (e.g., "Search GitHub for recent issues in my repo")
3. **Release `Ctrl+Alt`** to process
4. The agent **reasons** about your request, **executes** MCP tools, and **responds**
5. Watch real-time progress as each tool is called

### Toggle Dictation (Fn)

Instead of holding a key, toggle dictation on and off:

1. Press **`Fn`** to start recording
2. Speak freely
3. Press **`Fn`** again to stop and transcribe

### Hands-Free Mode (Mobile)

On the mobile app, hands-free mode uses Voice Activity Detection (VAD):

1. Toggle the **microphone icon** in the chat header
2. The app listens continuously
3. When you speak, it transcribes automatically
4. When you stop speaking, it sends the message
5. Perfect for driving, cooking, or multitasking

### Text Input

For when voice isn't convenient:

- **`Ctrl+T`** (macOS/Linux) or **`Ctrl+Shift+T`** (Windows) opens a text input overlay
- Type your message and press Enter
- Same agent processing as voice input

---

## Speech-to-Text (STT)

DotAgents supports multiple STT providers for transcription:

| Provider | Models | Speed | Quality | Offline |
|----------|--------|-------|---------|---------|
| **OpenAI** | Whisper | Fast | Excellent | No |
| **Groq** | Whisper (accelerated) | Very Fast | Excellent | No |
| **Parakeet** | ONNX model | Fast | Good | Yes |

### Language Support

DotAgents supports **30+ languages** for speech recognition:

Afrikaans, Arabic, Armenian, Azerbaijani, Belarusian, Bosnian, Bulgarian, Catalan, Chinese, Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, Galician, German, Greek, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Italian, Japanese, Kannada, Kazakh, Korean, Latvian, Lithuanian, Macedonian, Malay, Marathi, Maori, Nepali, Norwegian, Persian, Polish, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swahili, Swedish, Tagalog, Tamil, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Welsh.

Configure your preferred language in **Settings > General**.

### Configuring STT

1. Go to **Settings > General**
2. Under "Speech-to-Text", select your provider
3. Choose the model variant (if applicable)
4. Set your preferred language
5. Test with a voice recording

---

## Text-to-Speech (TTS)

Agent responses can be spoken aloud with multiple TTS providers:

| Provider | Voices | Quality | Speed |
|----------|--------|---------|-------|
| **OpenAI** | 6 voices (Alloy, Echo, Fable, Onyx, Nova, Shimmer) | High | Fast |
| **Groq** | Orpheus voices | High | Very Fast |
| **Google Gemini** | Multiple voices | High | Fast |
| **Kitten** | Custom voices | Variable | Fast |
| **Supertonic** | Custom voices | Variable | Fast |

### TTS Features

- **Auto-play** — Automatically speak agent responses as they arrive
- **Voice selection** — Choose from 50+ AI voices across providers
- **Audio player** — Play, pause, and replay TTS output
- **Streaming** — Audio begins playing before the full response is generated

### Configuring TTS

1. Go to **Settings > General**
2. Under "Text-to-Speech", select your provider
3. Choose your preferred voice
4. Toggle auto-play on/off
5. Adjust volume and speed (provider-dependent)

---

## Voice Flow Architecture

```
              ┌──────────────┐
              │  Microphone  │
              └──────┬───────┘
                     │
              ┌──────▼───────┐
              │  Recording   │
              │  (Hold key)  │
              └──────┬───────┘
                     │
              ┌──────▼───────┐
              │  STT Provider│
              │  (Whisper)   │
              └──────┬───────┘
                     │
              ┌──────▼───────┐
              │  Transcribed │
              │  Text        │
              └──────┬───────┘
                     │
         ┌───────────┼───────────┐
         │                       │
    ┌────▼─────┐          ┌──────▼───────┐
    │ Dictation│          │ Agent Mode   │
    │ Mode     │          │ (MCP Tools)  │
    └────┬─────┘          └──────┬───────┘
         │                       │
    ┌────▼─────┐          ┌──────▼───────┐
    │ Insert   │          │ LLM Engine   │
    │ Text     │          │ (Tool Calls) │
    └──────────┘          └──────┬───────┘
                                 │
                          ┌──────▼───────┐
                          │ Response     │
                          ├──────────────┤
                          │ Text Display │
                          │ TTS Playback │
                          │ Text Insert  │
                          └──────────────┘
```

## Emergency Stop

If an agent is running a long or undesired operation:

**`Ctrl+Shift+Escape`** — Immediately stops all active agent sessions.

This is the kill switch. It aborts all in-flight LLM calls, tool executions, and ACP delegations.

---

## Tips

- **Short commands work best** — "Search for React tutorials" is better than a paragraph of instructions
- **Be specific** — "Open the file at src/index.ts" beats "open that file"
- **Use agent mode for actions** — Hold `Ctrl+Alt` when you want the agent to do something, not just transcribe
- **Check your mic** — Ensure the correct microphone is selected in your system settings
- **Grant permissions** — macOS requires accessibility permissions for keyboard monitoring

---

## Next Steps

- **[Desktop App](/desktop/overview)** — Full desktop feature guide
- **[Mobile App](/mobile/overview)** — Voice on the go
- **[AI Providers](/tools/providers)** — Configure STT/TTS providers
- **[Keyboard Shortcuts](/configuration/shortcuts)** — All voice hotkeys
