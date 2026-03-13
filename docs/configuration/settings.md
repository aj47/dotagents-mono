# Settings Reference

All configurable options in DotAgents, organized by category.

---

## General Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **AI Provider** | Primary LLM provider (OpenAI, Groq, Gemini) | — |
| **Model** | Chat model to use | Provider default |
| **STT Provider** | Speech-to-text engine | OpenAI Whisper |
| **STT Language** | Language for speech recognition | English |
| **TTS Provider** | Text-to-speech engine | OpenAI |
| **TTS Voice** | Voice for spoken responses | Alloy |
| **TTS Auto-play** | Automatically speak responses | Off |
| **Theme** | Dark or light mode | Dark |
| **Langfuse Enabled** | Enable LLM tracing | Off |
| **Langfuse Public Key** | Langfuse public API key | — |
| **Langfuse Secret Key** | Langfuse secret API key | — |
| **Langfuse Base URL** | Self-hosted Langfuse URL | Cloud default |

## Provider Settings

### OpenAI

| Setting | Description |
|---------|-------------|
| **API Key** | OpenAI API key (`sk-...`) |
| **Base URL** | Custom endpoint (default: `https://api.openai.com/v1`) |
| **Organization** | OpenAI organization ID (optional) |

### Groq

| Setting | Description |
|---------|-------------|
| **API Key** | Groq API key (`gsk_...`) |
| **Base URL** | Custom endpoint (optional) |

### Google Gemini

| Setting | Description |
|---------|-------------|
| **API Key** | Google AI API key |

### Custom Provider

| Setting | Description |
|---------|-------------|
| **Base URL** | Any OpenAI-compatible endpoint |
| **API Key** | Authentication key |

## MCP Server Settings

See [MCP Server Configuration](mcp-servers.md) for details.

| Setting | Description |
|---------|-------------|
| **mcpServers** | JSON object of MCP server configurations |
| **Server transport** | `stdio`, `websocket`, or `streamableHttp` |
| **Server command** | Process to spawn (stdio only) |
| **Server args** | Process arguments (stdio only) |
| **Server env** | Environment variables |
| **Server URL** | Endpoint URL (remote only) |
| **Server disabled** | Disable without removing |
| **Tool approval** | Require user confirmation |

## Agent Settings

See [Agent Profiles](../agents/profiles.md) for details.

| Setting | Description |
|---------|-------------|
| **Agent Profiles** | List of configured agent profiles |
| **Default Agent** | Agent used by default |
| **Tool Configuration** | Per-agent tool access |
| **Model Override** | Per-agent model/provider |
| **Skills Configuration** | Per-agent skill access |

## Loop Settings

| Setting | Description |
|---------|-------------|
| **Prompt** | Message to send on each interval |
| **Interval** | Time between executions |
| **Agent** | Which agent handles the loop |
| **Enabled** | Whether the loop is active |

## UI Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Theme** | `dark` or `light` | `dark` |
| **Layout** | Session view layout preference | Grid |
| **Panel Mode** | Floating panel vs full window | Full window |

## Storage Locations

### Desktop

| Platform | Config Path |
|----------|-------------|
| **macOS** | `~/Library/Application Support/DotAgents/` |
| **Windows** | `%APPDATA%/DotAgents/` |
| **Linux** | `~/.config/DotAgents/` |

### Agent Protocol

| Layer | Path |
|-------|------|
| **Global** | `~/.agents/` |
| **Workspace** | `./.agents/` (project directory) |

### Configuration Files

| File | Content |
|------|---------|
| `config.json` | Main application settings |
| `.agents/speakmcp-settings.json` | General settings subset |
| `.agents/mcp.json` | MCP server configuration |
| `.agents/models.json` | Model presets and provider keys |
| `.agents/system-prompt.md` | Custom system prompt |
| `.agents/agents.md` | Agent guidelines |
| `.agents/layouts/ui.json` | UI layout settings |

### Mobile

All settings are stored in **AsyncStorage** on the device:

| Setting | Description |
|---------|-------------|
| **API Key** | Bearer token for authentication |
| **Base URL** | API endpoint URL |
| **Model** | Model identifier |
| **Environment** | Local vs Cloud toggle |
| **Voice Preferences** | TTS voice, auto-play, language |

---

## Next Steps

- **[MCP Server Configuration](mcp-servers.md)** — Detailed server setup
- **[Keyboard Shortcuts](shortcuts.md)** — All hotkeys
- **[Agent Profiles](../agents/profiles.md)** — Agent configuration
