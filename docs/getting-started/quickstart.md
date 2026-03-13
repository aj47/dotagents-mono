# Quick Start

Get from zero to talking to your AI agent in under 5 minutes.

---

## Step 1: Launch DotAgents

Open DotAgents after [installing](installation.md). On first launch, you'll see the **onboarding wizard** that walks you through initial setup.

## Step 2: Configure an AI Provider

DotAgents needs at least one AI provider to work. Go to **Settings > Providers** and add your API key for one of:

| Provider | Models | Best For |
|----------|--------|----------|
| **OpenAI** | GPT-4o, GPT-4o-mini, o1, o3 | General purpose, highest quality |
| **Groq** | Llama 3, Mixtral, Whisper | Fast inference, great for voice |
| **Google Gemini** | Gemini 2.0 Flash, Gemini Pro | Multimodal, large context |
| **Local Models** | Ollama, LM Studio | Privacy-first, offline capable |

Enter your API key and select a model. For local models, set the custom base URL (e.g., `http://localhost:11434/v1` for Ollama).

## Step 3: Talk to Your Agent

### Voice Input (Primary)

1. **Hold `Ctrl`** (macOS/Linux) or **`Ctrl+/`** (Windows) to start recording
2. **Speak** your request naturally
3. **Release** to stop recording — your speech is transcribed and the agent responds
4. The response is automatically inserted into your active application

### Agent Mode (with Tools)

1. **Hold `Ctrl+Alt`** to start recording in agent mode
2. **Speak** your request — the agent will use MCP tools to complete it
3. **Release** and watch real-time progress as the agent executes tools
4. Results are displayed or inserted automatically

### Text Input

- Press **`Ctrl+T`** (macOS/Linux) or **`Ctrl+Shift+T`** (Windows) for direct text input

## Step 4: Explore the Interface

### Sessions View

The main interface shows your conversation history. Each session is a threaded conversation with your agent, complete with tool execution history and results.

### Settings

Access settings from the sidebar to configure:

- **General** — AI provider, TTS voice, STT language
- **Providers** — API keys and model selection
- **Capabilities** — Enable/disable MCP servers and individual tools
- **Agents** — Create and manage agent profiles
- **Loops** — Set up recurring automated tasks

### Panel Mode

DotAgents can run as a compact floating panel on your desktop — always accessible without taking up screen space.

## Step 5: Add Your First MCP Tool

MCP tools extend what your agent can do. Go to **Settings > Capabilities** and add a tool server:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Documents"]
    }
  }
}
```

Now your agent can read and write files on your behalf. See [MCP Tools](../tools/mcp.md) for more servers.

---

## What's Next

- **[Your First Agent](first-agent.md)** — Create a specialized agent profile
- **[Voice Interface](../voice/overview.md)** — Master the voice controls
- **[Agent Skills](../agents/skills.md)** — Teach your agent new capabilities
- **[MCP Tools](../tools/mcp.md)** — Connect more tools and services
