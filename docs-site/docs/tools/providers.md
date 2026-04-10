---
sidebar_position: 2
sidebar_label: "AI Providers"
---

# AI Providers

DotAgents integrates with multiple AI providers for chat, speech-to-text, and text-to-speech. Configure one or more providers to power your agents.

---

## Chat Providers

These providers power the LLM that drives your agents' reasoning and responses.

### OpenAI

| Setting | Value |
|---------|-------|
| **API Key** | `sk-...` |
| **Base URL** | `https://api.openai.com/v1` (default) |
| **Models** | GPT-5.4, GPT-5.4 Mini, GPT-5.4 Nano |

Best for: Frontier reasoning, coding, and agentic workflows. Use smaller variants when latency and cost matter more than maximum capability.

### Groq

| Setting | Value |
|---------|-------|
| **API Key** | `gsk_...` |
| **Base URL** | `https://api.groq.com/openai/v1` (default) |
| **Models** | GPT-OSS 120B, Llama 4 Scout, Llama 3.3 70B, Llama 3.1 8B |

Best for: Fast inference, real-time voice interactions.

### Google Gemini

| Setting | Value |
|---------|-------|
| **API Key** | Google AI API key |
| **Models** | Gemini 3.1 Pro Preview, Gemini 3 Flash Preview, Gemini 2.5 Flash |

Best for: Multimodal tasks, large context windows, and agentic reasoning. Prefer Gemini 3.1 Pro/Flash previews for the newest capabilities; use Gemini 2.5 stable models when you need stable model IDs.

### Claude via OpenAI-compatible gateways

DotAgents does not require a dedicated provider integration for every model family. If your gateway exposes an OpenAI-compatible API, configure it as a custom provider and use current Claude model IDs such as `claude-opus-4-6`, `claude-sonnet-4-6`, or `claude-haiku-4-5`.

> Model examples were refreshed in April 2026 from the [OpenAI model guide](https://platform.openai.com/docs/models/), [Anthropic model guide](https://docs.anthropic.com/en/docs/about-claude/models), [Gemini model guide](https://ai.google.dev/gemini-api/docs/models), and [Groq model list](https://console.groq.com/docs/models). Provider catalogs change frequently; use the in-app model picker or refresh from provider APIs for exact availability on your account.

### Local Models

Use any OpenAI-compatible local model server:

| Server | Base URL |
|--------|----------|
| **Ollama** | `http://localhost:11434/v1` |
| **LM Studio** | `http://localhost:1234/v1` |
| **llama.cpp** | `http://localhost:8080/v1` |

Best for: Privacy-first, offline use, no API costs.

## Speech-to-Text (STT) Providers

### OpenAI Whisper

- High accuracy across 30+ languages
- Requires API key and internet connection
- Model: `whisper-1`

### Groq Whisper

- Same Whisper model, accelerated by Groq hardware
- Significantly faster than OpenAI's endpoint
- Requires Groq API key

### Parakeet (Local)

- Runs locally using ONNX runtime
- No API key or internet required
- Good accuracy for English
- Model runs on CPU

## Text-to-Speech (TTS) Providers

### OpenAI TTS

- 6 voices: Alloy, Echo, Fable, Onyx, Nova, Shimmer
- High quality, natural-sounding
- Models: `tts-1`, `tts-1-hd`

### Groq (Orpheus)

- Fast inference via Groq hardware
- Multiple voice options
- Low latency for real-time playback

### Google Gemini TTS

- Multiple voices
- Natural prosody
- Supports multiple languages

### Kitten TTS

- Custom voice engine
- Configurable via Kitten API

### Supertonic TTS

- Custom voice engine
- Additional voice options

## Configuration

### Via the UI

1. Go to **Settings > Providers**
2. Select your provider
3. Enter your API key
4. Choose a model from the dropdown
5. (Optional) Set a custom base URL

### Via Configuration Files

In `.agents/models.json`:

```json
{
  "providers": {
    "openai": {
      "apiKey": "sk-...",
      "baseUrl": "https://api.openai.com/v1"
    },
    "groq": {
      "apiKey": "gsk_..."
    },
    "gemini": {
      "apiKey": "AI..."
    }
  },
  "defaultModel": {
    "provider": "openai",
    "model": "gpt-5.4-mini"
  }
}
```

### Per-Agent Model Override

Each agent can use a different model/provider:

```json
{
  "modelConfig": {
    "provider": "groq",
    "model": "llama-3.3-70b-versatile"
  }
}
```

## Model Presets

DotAgents includes pre-configured model bundles that set the provider, model, and recommended settings together. Select a preset in **Settings > Models** for quick setup.

## Rate Limiting

DotAgents handles API rate limits gracefully:

- Automatic retry with exponential backoff
- Rate limit status shown in the UI
- Per-provider rate limit tracking

---

## Next Steps

- **[MCP Tools](mcp)** — Configure tool servers
- **[Voice Interface](/voice/overview)** — STT and TTS in action
- **[Settings Reference](/configuration/settings)** — All configuration options
