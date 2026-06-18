---
sidebar_position: 1
sidebar_label: "Settings Reference"
---

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

See [MCP Server Configuration](mcp-servers) for details.

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

See [Agent Profiles](/agents/profiles) for details.

| Setting | Description |
|---------|-------------|
| **Agent Profiles** | List of configured agent profiles |
| **Default Agent** | Agent used by default |
| **Tool Configuration** | Per-agent tool access |
| **Model Override** | Per-agent model/provider |
| **Skills Configuration** | Per-agent skill access |

## Remote Server Settings

See [Remote Server & Mobile Pairing](/desktop/remote-server) for setup and security guidance.

| Setting | Description | Default |
|---------|-------------|---------|
| **Remote Server Enabled** | Starts the Fastify HTTP API for mobile/operator clients | `false` |
| **Port** | Local HTTP port | `3210` |
| **Bind Address** | Interface to listen on; use `127.0.0.1` for local-only, `0.0.0.0` for LAN/tunnel | `127.0.0.1` |
| **API Key** | Bearer token required by remote clients | Generated locally |
| **Log Level** | Remote API log verbosity | `info` |
| **CORS Origins** | Allowed browser origins | `*` |
| **Cloudflare Tunnel Enabled** | Expose the local server through a tunnel | `false` |
| **Cloudflare Tunnel Mode** | Quick tunnel or named tunnel | Quick tunnel |
| **Terminal QR** | Print QR payloads for headless pairing | Auto for QR/headless flows |

## Messaging Integration Settings

### Discord

See [Discord Integration](/tools/discord) for setup and access-control guidance.

| Setting | Description | Default |
|---------|-------------|---------|
| **Discord Enabled** | Starts or stops the Discord bot integration | `false` |
| **Bot Token** | Discord bot token; can also come from `DOTAGENTS_DISCORD_BOT_TOKEN` | — |
| **Allow Direct Messages** | Lets trusted users message the bot directly | `true` |
| **Require Mention** | Requires bot mentions in guild channels | `true` in shared-channel deployments |
| **Allow User IDs** | Users allowed to chat with the bot | Empty |
| **Allow Guild IDs** | Guilds allowed to chat with the bot | Empty |
| **Allow Channel IDs** | Channels allowed to chat with the bot | Empty |
| **Allow Role IDs** | Roles allowed to chat with the bot | Empty |
| **DM Allow User IDs** | Optional narrower user list for direct messages | Empty |
| **Operator Allow User/Guild/Channel/Role IDs** | Separate allowlists for privileged `/ops` commands | Empty |
| **Default Profile ID** | Agent profile used for Discord messages; can also come from `DOTAGENTS_DISCORD_DEFAULT_PROFILE_ID` | — |
| **Log Messages** | Store Discord message content in integration logs | `false` |

### WhatsApp

See [WhatsApp Integration](/tools/whatsapp) for MCP setup and environment variables.

| Setting | Description | Default |
|---------|-------------|---------|
| **WhatsApp Enabled** | Enables the desktop integration controls for the WhatsApp MCP server | `false` |
| **Allow From** | Phone numbers allowed to message the agent | Empty |
| **Operator Allow From** | Phone numbers allowed to run `/ops` commands | Empty |
| **Auto Reply** | Automatically route incoming messages to an agent reply flow | `false` |
| **Log Messages** | Store WhatsApp message content in integration logs | `false` |

## Loop Settings

| Setting | Description |
|---------|-------------|
| **Prompt** | Message to send on each interval |
| **Interval** | Time between executions |
| **Agent** | Which agent handles the loop |
| **Critique mode** | Enables the built-in worker -> critic -> worker revision pass for one configured repeat task |
| **Critic Agent** | Optional agent profile for the critique pass; defaults to the active/default agent |
| **Enabled** | Whether the loop is active |

When the built-in critique pass is enabled, each run uses three steps: the worker agent answers the repeat-task prompt, a critic agent reviews the answer and any referenced artifacts, and the worker agent receives the critique as a follow-up instruction before producing the final result. This is one configured repeat task, not a second scheduled critic task.

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
| `.agents/dotagents-settings.json` | General settings subset |
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
| **Base URL** | Desktop remote server or OpenAI-compatible API endpoint URL |
| **Model** | Model identifier |
| **Environment** | Local vs Cloud toggle |
| **Voice Preferences** | TTS voice, auto-play, language |

---

## Next Steps

- **[MCP Server Configuration](mcp-servers)** — Detailed server setup
- **[Keyboard Shortcuts](shortcuts)** — All hotkeys
- **[Agent Profiles](/agents/profiles)** — Agent configuration
